#!/bin/bash

if [ $# -ne 1 ] ; then
  echo Please specify repmgrd or pgpool as parameter to determine failover mode
  exit
fi
if [ "$1" == "repmgrd" ] ; then
  DOCKERFILE="docker-compose-test-2nodes-repmgrdfailover.yml"
else
  DOCKERFILE="docker-compose-test-2nodes-pgpoolfailover.yml"
fi
if [ ! -f $DOCKERFILE ] ; then
  echo Dockerfile $DOCKERFILE does not exist
  exit 1
fi
export pg_version=$( cat ../version.txt )

source ./test_lib.sh

docker stack rm pgcluster
sleep 10
./delvol.sh
if [ $? -ne 0 ] ; then
  echo Failed to delete docker volumes
  exit 1
fi
docker stack deploy -c $DOCKERFILE pgcluster
docker service ls
echo "Check for db pg01 to be ready"
wait_for_db pg01
echo "Check for db pg02 to be ready"
wait_for_db pg02
echo Sleep 60 to wait for pgpool
sleep 60
check_pool_nodes up,up primary,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,t primary,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
stop_pg pg01
echo Sleep 30 to let failover happen
sleep 30
check_pool_nodes down,up standby,primary
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes f,t primary,primary
if [ $? -ne 0 ] ; then
 exit 1
fi
recover_node 0
check_pool_nodes up,up standby,primary
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,t standby,primary
if [ $? -ne 0 ] ; then
 exit 1
fi
stop_pg pg02
sleep 30
check_pool_nodes up,down primary,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,f primary,primary
if [ $? -ne 0 ] ; then
 exit 1
fi
recover_node 1
check_pool_nodes up,up primary,standby
if [ $? -ne 0 ] ; then
 exit 1
fi
check_repmgr_nodes t,t primary,standby
if [ $? -ne 0 ] ; then
  exit 1
fi
# start a long connection via pgpool and stop the standby 
# see if the connection was not lost
long_connection 60 &
stop_pg pg02
sleep 70
nbr=$(count_records long_connection)
if [ $? -ne 0 ] ; then
  echo "error in count_records long_connection"
  exit 1
fi
if [ $nbr -ne 2 ] ; then
  echo expected to have 2 records in long_connection table, but got $nbr
  exit 1
else
  echo got $nbr records in table long_connection
fi
check_pool_nodes up,down primary,standby
start_pg pg02
recover_failed_node pg02
check_pool_nodes up,up primary,standby

exit 0
