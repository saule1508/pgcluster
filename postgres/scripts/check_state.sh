#!/bin/bash

# this script will re-attach a failed standby database
# or recover a failed primary database
# it requires that pgpool is available and that the database on this node is running
# this script might be called when the postgres container is starting but then it must do so
# when both pgpool and the database is running. Since the db is started with supervisor, this would
# require to lauch the script in the background after the start of postgres
# the script can also be started manually or via cron

PGP_NODE_ID=$(( NODE_ID-1 ))
PGP_STATUS_WAITING=1
PGP_STATUS_UP=2
PGP_STATUS_DOWN=3

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

str=$( pcp_node_info -h pgpool -p 9898 -w $PGP_NODE_ID-1 )
if [ $? -ne 0 ] ; then
  echo "ERROR - pgpool cannot be accessed"
  exit 1
fi
read node port status weight role <<< $str
if [ $status -ne $PGP_STATUS_DOWN ] ; then
  echo "pgpool status for node $node is $status and role $role, nothing to do"
  exit 0
fi
echo "Node $node is down (role is $role)"
# status down, the node is detached
# get the primary from pool_nodes
psql -h pgpool -p 9999 -U repmgr -c "show pool_nodes;" > /tmp/pool_nodes.log
if [ $? -ne 0 ] ; then
  echo "cannot connect to postgres via pgpool"
  exit 1
fi
PRIMARY_NODE_ID=$( cat /tmp/pool_nodes.log | grep primary | grep -v down | cut -f2 -d"|" | sed -e "s/ //g")
PRIMARY_HOST=$( cat /tmp/pool_nodes.log | grep primary | grep -v down | cut -f3 -d"|" | sed -e "s/ //g")
echo "Primary node is $PRIMARY_HOST"

# check if this node is a failed master (degenerated master)
# if yest then pcp_recovery_node or node rejoin is needed
if [ $role == "primary" ] ; the
  echo "This node is a primary and it is down: recovery needed"
  # sanity check
  if [ $PRIMARY_NODE_ID -ne $PGP_NODE_ID ] ; then
     echo "Unpextected state, this node $PGP_NODE_ID is a primary according to pcp_node_info but pool_nodes said $PRIMARY_NODE_ID is master
     exit 1
  fi
  echo "First try node rejoin"
  echo "todo"
  echo "Do pcp_recovery_node"
  pcp_recovery_node -h pgpool -p 9898 -w $PGP_NODE_ID
  exit $?
fi

echo "This node is a standby and it is down: check if it can be re-attached"
echo "Check if the DB is running, if not do not start it but exit with error"
pg_ctl status
if [ $? -ne 0 ] ; then
  echo "Error the DB is not running"
  exit 1
  # we cannot use supervisorctl start postgres 
  # because if this script is called from initdb.sh it would recurse
  #pg_stl start -w
  #if [ $? -ne 0 ] ; then
  #  echo "Cannot start DB"
  #  exit 1
  #fi
  #DB_WAS_STARTED=1
fi
check_is_streaming_from $PRIMARY_NODE_ID
res=$?
if [ $res -eq 1 ] ; then
  echo "attach node back since it is in recovery streaming from $PRIMARY_NODE_ID"
  pcp_attach_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
  if [ $? -eq 0 ] ; then
    echo "OK attached node $node back since it is in recovery and streaming from $PRIMARY_NODE_ID"
    exit 0
  fi
  echo "ERROR attach node failed for node $node"
  exit 1
fi
echo "node is supposed to be a standby but it is not streaming from the primary, lets do pcp_recovery_node"
pcp_recovery_node -h pgpool -p 9898 -w $PGP_NODE_ID
exit $?
