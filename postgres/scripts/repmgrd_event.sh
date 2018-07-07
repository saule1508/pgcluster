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

LOGFILE=/var/log/repmgrd_event.log

if [ ! -f $LOGFILE ] ; then
  sudo touch $LOGFILE
  sudo chown postgres:postgres $LOGFILE
fi
log_info(){
  echo "INFO - $( date +"%Y%m%d %H:%M:%S.%s" ) - $1" >> $LOGFILE
}

log_info "got event $EVENT_TYPE for NODE $NODE_ID success is $SUCCESS, all args: $*"
if [ $EVENT_TYPE == "standby_recovery" -a $SUCCESS -eq 1 ] ; then
  log_info "attach node $NODE_ID because $EVENT_TYPE"
  pcp_attach_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
fi

if [ "$REPMGRD_FAILOVER_MODE" == "manual" ] ; then
  exit 0
fi

if [ $EVENT_TYPE == "repmgrd_failover_promote" ] ; then
  pcp_promote_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
fi
if [ $EVENT_TYPE == "repmgrd_failover_follow" ] ; then
  log_info "attach node $NODE_ID because $EVENT_TYPE"
  pcp_attach_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
fi
if [ $EVENT_TYPE == "standby_failure" ] ; then
  log_info "detach node $NODE_ID because $EVENT_TYPE" 
  pcp_detach_node -h pgpool -p 9898 -w $(( NODE_ID-1 ))
fi
