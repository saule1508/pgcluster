#!/bin/bash

pg_is_in_recovery(){
  psql -t -c "select pg_is_in_recovery();" | head -1 | awk '{print $1}'
}

check_is_streaming_from(){
  PRIMARY=$1
  # first check if is_pg_in_recovery is t
  in_reco=$( pg_is_in_recovery )
  if [ "a${in_reco}" != "at" ] ; then
    return 0
  fi
  psql -t -c "select * from pg_stat_wal_receiver;" > /tmp/stat_wal_receiver.tmp
  # check that status is streamin
  status=$( cat /tmp/stat_wal_receiver.tmp | head -1 | cut -f2 -d"|" | sed -e "s/ //g" )
  if [ "a${status}" != "astreaming" ] ; then
    echo "status is not streaming"
    return 0
  fi  
  #check that is recovering from primary
  conninfo=$( cat /tmp/stat_wal_receiver.tmp | head -1 | cut -f12 -d"|" )
  echo $conninfo | grep "host=${PRIMARY}"
  if [ $? -eq 1 ] ; then
    echo "not streaming from $PRIMARY"
    return 0
  fi
  return 1
}

STATUS_WAITING=1
STATUS_UP=2
STATUS_DOWN=3

str=$( pcp_node_info -h pgpool -p 9898 -w $(( NODE_ID-1 )) )
read node port status weight role <<< $str
if [ $status -ne $STATUS_DOWN ] ; then
  echo OK database node $node status $status role $role
  exit 0
fi
echo database node $node is not up status $status
# status down, the node is detached: if it is a failed standby just restart it
psql -h pgpool -p 9999 -U repmgr -c "show pool_nodes;" > /tmp/pool_nodes.log
PRIMARY=$( cat /tmp/pool_nodes.log | grep primary | cut -f2 -d"|" | sed -e "s/ //g")
pg_ctl status
if [ $? -ne 0 ] ; then
  echo "ERROR the DB is not running"
  exit 1
fi
check_is_streaming_from $PRIMARY
res=$?
if [ $res -eq 1 ] ; then
  echo "attach node back since it is in recovery streaming from $PRIMARY"
  pcp_attach_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
  if [ $? -eq 0 ] ; then
    echo "OK attached node $node back since it is in recovery and streaming from $PRIMARY"
    exit 0
  fi
  echo "ERROR attach node failed for node $node"
fi
# node is supposed to be a standby but it is not streaming from the primary
echo pcp_recovery_node is needed for $node, stop DB and fails
sudo supervisorctl stop postgres
exit 1
