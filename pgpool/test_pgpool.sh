#!/bin/bash

if [ $# -ne 1 ] ; then
  echo Please specify repmgrd or pgpool as parameter to determine failover mode
  exit
fi
if [ "$1" == "repmgrd" ] ; then
  DOCKERFILE="docker-compose-test-repmgrdfailover.yml"
else
  DOCKERFILE="docker-compose-test-pgpoolfailover.yml"
fi


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

get_pool_nodes(){
 if [ -f /tmp/pool_nodes ] ; then
   sudo rm /tmp/pool_nodes
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
 sudo rm /tmp/repmgr_nodes
 CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool" )
 docker exec $CONT psql -U repmgr -h pgpool -p 9999 repmgr -t -c "select * from nodes order by node_id;" > /tmp/repmgr_nodes
 if [ $? -ne 0 ] ; then
   echo ERROR 
   return 1
 fi
 cat /tmp/repmgr_nodes
 return 0
}

check_pool_nodes(){
 EXPECTED_STATUS=$1
 EXPECTED_ROLE=$2
 get_pool_nodes 
 if [ $? -ne 0 ] ; then
   echo ERROR in get_pool_nodes
   exit 1
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

docker stack rm pgcluster
sleep 10
./delvol.sh
docker stack deploy -c $DOCKERFILE pgcluster
docker service ls
echo "Check for db pg01 to be ready"
wait_for_db pg01
echo "Check for db pg02 to be ready"
wait_for_db pg02
echo "Check for db pg03 to be ready"
wait_for_db pg03
echo Sleep 60 to wait for pgpool
sleep 60
check_pool_nodes up,up,up primary,standby,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,t,t primary,standby,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
echo "Stop pg01"
CONT=$( docker ps -q --filter="status=running" --filter="name=pg01" )
docker exec $CONT supervisorctl stop postgres
echo Sleep 60 to let failover happen
sleep 60
check_pool_nodes down,up,up standby,primary,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes f,t,t primary,primary,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool" )
echo doing pcp_recovery_node of 0
docker exec $CONT pcp_recovery_node -h pgpool -p 9898 -w 0
check_pool_nodes up,up,up standby,primary,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,t,t standby,primary,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
echo "Stop pg02"
CONT=$( docker ps -q --filter="status=running" --filter="name=pg02" )
docker exec $CONT supervisorctl stop postgres
echo Sleep 60 to let failover happen
sleep 60
check_pool_nodes up,down,up primary,standby,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,f,t primary,primary,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool" )
echo doing pcp_recovery_node for 1
docker exec $CONT pcp_recovery_node -h pgpool -p 9898 -w 1
check_pool_nodes up,up,up primary,standby,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,t,t primary,standby,standby
if [ $? -ne 0 ] ; then
  exit 1
fi
echo "Stop pg03 (standby database)"
CONT=$( docker ps -q --filter="status=running" --filter="name=pg03" )
docker exec $CONT supervisorctl stop postgres
echo Sleep 30 to let failover happen
sleep 30
check_pool_nodes up,up,down primary,standby,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,t,f primary,standby,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
echo Restart pg03
CONT=$( docker ps -q --filter="status=running" --filter="name=pg03" )
docker exec $CONT supervisorctl start postgres
echo Sleep 30 to let node rejoin happen
sleep 30
check_pool_nodes up,up,up primary,standby,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,t,t primary,standby,standby
if [ $? -ne 0 ] ; then
 exit 1
fi

exit 0
