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

get_pool_nodes(){
 sudo rm /tmp/pool_nodes
 CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool01" )
 docker exec $CONT psql -U repmgr -h pgpool01 -p 9999 repmgr -t -c "show pool_nodes;" > /tmp/pool_nodes
 if [ $? -ne 0 ] ; then
   echo ERROR 
   return 1
 fi
 cat /tmp/pool_nodes
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
 echo check pool nodes OK
}

docker stack rm pgcluster
sleep 10
./delvol.sh
docker stack deploy -c docker-compose-test.yml pgcluster
docker service ls
echo "Check for db pg01 to be ready"
wait_for_db pg01
wait_for_db pg02
echo Sleep 30 to wait for pgpool
sleep 30
check_pool_nodes up,up primary,standby
echo "Stop pg01"
CONT=$( docker ps -q --filter="status=running" --filter="name=pg01" )
docker exec $CONT supervisorctl stop postgres
echo Sleep 40 to let failover happen
sleep 40
check_pool_nodes down,up standby,primary
CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool01" )
docker exec $CONT pcp_recovery_node -h pgpool01 -p 9898 -w 0
check_pool_nodes up,up standby,primary
echo "Stop pg02"
CONT=$( docker ps -q --filter="status=running" --filter="name=pg02" )
docker exec $CONT supervisorctl stop postgres
echo Sleep 40 to let failover happen
sleep 40
check_pool_nodes up,down primary,standby
CONT=$( docker ps -q --filter="status=running" --filter="name=pgpool01" )
docker exec $CONT pcp_recovery_node -h pgpool01 -p 9898 -w 1
check_pool_nodes up,up primary,standby
