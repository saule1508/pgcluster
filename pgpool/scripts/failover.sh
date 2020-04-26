#!/bin/bash

# make sure ssh keys are installed on the remote AND on the local server

if [ ! -d /var/log/pg ] ; then
 sudo mkdir -p /var/log/pg
 sudo chown postgres:postgres /var/log/pg
fi
LOGFILE=/var/log/pg/failover.log
if [ ! -f $LOGFILE ] ; then
 > $LOGFILE
fi
PGVER=${PGVER:-12}
echo $@

# Special values:
#   %d = node id
#   %h = host name
#   %p = port number
#   %D = database cluster path
#   %m = new master node id
#   %H = hostname of the new master node
#   %M = old master node id
#   %P = old primary node id
#   %r = new master port number
#   %R = new master database cluster path


FALLING_NODE=$1            # %d
FALLING_HOST=$2            # %h
FALLING_PORT_NUMBER=$3     # %p
FALLING_CLUSTER_PATH=$4    # %D
NEW_MASTER_ID=$5           # %m
NEW_HOST=$6                # %H
OLD_MASTER_ID=$7           # %M
OLD_PRIMARY_ID=$8          # %P
NEW_PORT=$9                # %r
NEW_CLUSTER_PATH=$10       # %R

(
date
echo "FALLING_NODE: $FALLING_NODE"
echo "FALLING_HOST: $FALLING_HOST"
echo "FALLING_PORT_NUMBER: $FALLING_PORT_NUMBER"
echo "FALLING_CLUSTER_PATH: $FALLING_CLUSTER_PATH"
echo "NEW_MASTER_ID: $NEW_MASTER_ID"
echo "NEW_HOST: $NEW_HOST"
echo "OLD_MASTER_ID: $OLD_MASTER_ID"
echo "OLD_PRIMARY_ID: $OLD_PRIMARY_ID"
echo "NEW_PORT: $NEW_PORT"
echo "NEW_CLUSTER_PATH: $NEW_CLUSTER_PATH"
 
ssh_options="ssh -p 222 -n -T -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
set -x
 
if [ $FALLING_NODE = $OLD_PRIMARY_ID ] ; then
  $ssh_options postgres@${NEW_HOST} "/usr/pgsql-${PGVER}/bin/repmgr --log-to-file -f /etc/repmgr/${PGVER}/repmgr.conf standby promote -v "
else
  echo old primary id is $OLD_PRIMARY_ID and falling node is $FALLING_NODE
fi
exit 0;
) 2>&1 | tee -a ${LOGFILE}
