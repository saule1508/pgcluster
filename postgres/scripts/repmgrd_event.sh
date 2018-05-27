#!/bin/bash

#%n node ID
#%e event type
#%s success (1) or failure (0)
#%t timestamp
#%d details
#%p node ID of the current primary (repmgr standby register and repmgr standby follow)
#   node ID of the demoted primary (repmgr standby switchover only)
#%c conninfo string of the primary node (repmgr standby register and repmgr standby follow)
#   conninfo string of the next available node (bdr_failover and bdr_recovery)
#%a name of the current primary node (repmgr standby register and repmgr standby follow)
#   name of the next available node (bdr_failover and bdr_recovery)

NODE_ID=$1
EVENT_TYPE="$2"
SUCCESS=$3
if [ ! -f /var/log/repmgrd_event.log ] ; then
  sudo touch /var/log/repmgrd_event.log
  sudo chown postgres:postgres /var/log/repmgrd_event.log
fi
# following variable will be injected by initdb.sh based on env variable
REPMGRD_FAILOVER_MODE="##REPMGRD_FAILOVER_MODE##"

if [ $EVENT_TYPE == "standby_recovery" -a $SUCCESS -eq 1 ] ; then
  echo attach node $NODE_ID because $EVENT_TYPE >> /var/log/pgcluster/repmgrd_event.log
  pcp_attach_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
fi

if [ "$REPMGRD_FAILOVER_MODE" == "manual" ] ; then
  exit 0
fi

if [ $EVENT_TYPE == "repmgrd_failover_promote" ] ; then
  pcp_promote_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
fi
if [ $EVENT_TYPE == "repmgrd_failover_follow" ] ; then
  echo detach node $NODE_ID because $EVENT_TYPE >> /var/log/pgcluster/repmgrd_event.log
  pcp_attach_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
fi
if [ $EVENT_TYPE == "standby_failure" ] ; then
  echo detach node $NODE_ID because $EVENT_TYPE >> /var/log/pgcluster/repmgrd_event.log
  pcp_detach_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
fi
