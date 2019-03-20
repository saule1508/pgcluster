#!/bin/bash

wait_for_db(){
 echo Wait for $1
 CONT=$( docker ps -q --filter="status=running" --filter="name=$1" )
 while [ -z $CONT ] ; do
   echo cannot get running container for $1, sleep 5
   sleep 5
   CONT=$( docker ps -q --filter="status=running" --filter="name=$1" )
 done
 echo got container $CONT for $1
 echo try to connect
 done=0
 while [ $done -eq 0 ] ; do
   docker exec --user postgres $CONT psql -U repmgr repmgr -c "select * from nodes;"
   if [ $? -eq 0 ] ; then
     echo return code is 0, done
     done=1
   else
     echo psql error, sleep 5
     sleep 5
   fi
 done
 echo waited for $CONT OK
 return 0
}

stop_pg(){
  PG2STOP=$1
  echo "Stop $PG2STOP"
  CONT=$( docker ps -q --filter="status=running" --filter="name=${PG2STOP}" )
  docker exec $CONT supervisorctl stop postgres
}

start_pg(){
  PG2START=$1
  echo "Start $PG2START"
  CONT=$( docker ps -q --filter="status=running" --filter="name=${PG2START}" )
  docker exec $CONT supervisorctl start postgres
}

get_pool_nodes(){
 if [ -f /tmp/pool_nodes ] ; then
   rm /tmp/pool_nodes
 fi
 CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool" )
 docker exec $CONT psql -U repmgr -h pgpool -p 9999 repmgr -t -c "show pool_nodes;" > /tmp/pool_nodes
 if [ $? -ne 0 ] ; then
   echo ERROR 
   return 1
 fi
 cat /tmp/pool_nodes
 return 0
}

get_repmgr_nodes(){
 rm /tmp/repmgr_nodes
 CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool" )
 docker exec $CONT psql -U repmgr -h pgpool -p 9999 repmgr -t -c "select * from nodes order by node_id;" > /tmp/repmgr_nodes
 if [ $? -ne 0 ] ; then
   echo ERROR 
   return 1
 fi
 cat /tmp/repmgr_nodes
 return 0
}

#
#1: csv list of status
#2: csv list or roles
check_pool_nodes(){
 EXPECTED_STATUS=$1
 EXPECTED_ROLE=$2
 # get_pool_nodes will generate file /tmp/pool_nodes
 get_pool_nodes 
 if [ $? -ne 0 ] ; then
   echo ERROR in get_pool_nodes
   return 1
 fi
 echo Check status $EXPECTED_STATUS and role $EXPECTED_ROLE
 cat /tmp/pool_nodes | egrep -v "pgpool|node_id|---|^\(|^$" | while read line
 do
   NODE=$( echo $line | cut -c1 )
   FIELD=$((NODE+1))
   NODE_STATUS_EXPECTED=$( echo $EXPECTED_STATUS | cut -f$FIELD -d",")
   NODE_ROLE_EXPECTED=$( echo $EXPECTED_ROLE | cut -f$FIELD -d",")
   NODE_STATUS=$(echo $line | cut -f4 -d"|" | sed -e "s/ //g")
   NODE_ROLE=$(echo $line | cut -f6 -d"|" | sed -e "s/ //g")
   echo Node $NODE status is $NODE_STATUS and role is $NODE_ROLE
   if [ $NODE_ROLE_EXPECTED != $NODE_ROLE ] ; then
      echo ERROR node role expected not OK for $NODE
      exit 1
   fi 
   if [ $NODE_STATUS_EXPECTED != $NODE_STATUS ] ; then
      echo ERROR node status expected not OK for $NODE
      exit 1
   fi 
 done
 ret=$?
 if [ $ret -eq 0 ] ; then 
   echo check pool nodes OK
   return 0
 else
   echo ERROR in check pool nodes
   return $ret
 fi
}

#1: csv list of t or f (t=active true, f=active false)
#2: csv list of type (primary or standby)
check_repmgr_nodes(){
 EXPECTED_ACTIVE=$1
 EXPECTED_TYPE=$2
 get_repmgr_nodes 
 if [ $? -ne 0 ] ; then
   echo ERROR in get_repmgr_nodes
   exit 1
 fi
 echo Check status $EXPECTED_ACTIVE and role $EXPECTED_TYPE
 cat /tmp/repmgr_nodes | egrep -v "node_id|---|^\(|^$" | while read line
 do
   NODE=$( echo $line | cut -c1 )
   FIELD=$((NODE))
   NODE_ACTIVE_EXPECTED=$( echo $EXPECTED_ACTIVE | cut -f$FIELD -d",")
   NODE_TYPE_EXPECTED=$( echo $EXPECTED_TYPE | cut -f$FIELD -d",")
   NODE_ACTIVE=$(echo $line | cut -f3 -d"|" | sed -e "s/ //g")
   NODE_TYPE=$(echo $line | cut -f5 -d"|" | sed -e "s/ //g")
   echo Node $NODE active is $NODE_ACTIVE and role is $NODE_TYPE
   if [ $NODE_TYPE_EXPECTED != $NODE_TYPE ] ; then
      echo ERROR node type expected not OK for $NODE
      exit 1
   fi 
   if [ $NODE_ACTIVE_EXPECTED != $NODE_ACTIVE ] ; then
      echo ERROR node active expected not OK for $NODE
      exit 1
   fi 
 done
 ret=$?
 if [ $ret -eq 0 ] ; then 
   echo check repmgr nodes OK
   return 0
 else
   echo ERROR in check repmgr nodes
   return $ret
 fi
}

recover_node(){
  NODE=$1

  CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool" )
  echo doing pcp_recovery_node of $NODE
  docker exec $CONT pcp_recovery_node -h pgpool -p 9898 -w $NODE
}

attach_node(){
  NODE=$1

  CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool" )
  echo doing pcp_attach_node of $NODE
  docker exec $CONT pcp_attach_node -h pgpool -p 9898 -w $NODE
}

# this will re-attach a failed standby
# i.e a standby that was detached from the pool and later comes back
recover_failed_node() {
  HOST=$1
  CONT=$( docker ps -q --filter="status=running" --filter="name=$HOST" )
  echo doing recover_failed_node in $HOST

  docker exec --user postgres $CONT /scripts/recover_failed_node.sh
}

# test if we can write
can_write(){
  # get container
  CONT=$(docker ps -q --filter="status=running" --filter="name=pgpool" )
  docker exec $CONT psql -U repmgr -h pgpool -p 9999 -c "create table test(id serial); drop table test;"
  return $?
}

# number of records in a table owned by repmgr
count_records(){
  table=$1
  # get container
  CONT=$(docker ps -q --filter="status=running" --filter="name=pgpool" )
  docker exec $CONT psql -U repmgr -h pgpool -p 9999 \
   -t -c "select count(*) from $table;"
}

# long psql connection that can be started in background
# it will insert a first record, then sleep X seconds, then insert a second records
long_connection(){
  SLEEP=${1:-60}
  # get container
  CONT=$(docker ps -q --filter="status=running" --filter="name=pgpool" )
  docker exec $CONT psql -U repmgr -h pgpool -p 9999 \
    -c "drop table if exists long_connection; create table long_connection(ts timestamp);insert into long_connection(ts) SELECT CURRENT_TIMESTAMP; SELECT pg_sleep($SLEEP); insert into long_connection(ts) SELECT CURRENT_TIMESTAMP;"
  return $?
}


