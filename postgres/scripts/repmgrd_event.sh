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
EVENT_TYPE=$2
SUCCESS=$3

if [ $EVENT_TYPE == "repmgrd_failover_promote" ] ; then
  echo promote node $NODE_ID
  pcp_promote_node -h pgpool01 -p 9898 -w $(( NODE_ID-1 ))
fi
if [ $EVENT_TYPE == "repmgrd_failover_follow" ] ; then
  echo attach node $NODE_ID 
  pcp_attach_node -h pgpool01 -p 9898 -w $(( NODE_ID-1 ))
fi


