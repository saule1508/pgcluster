#!/bin/bash

# make sure ssh keys are installed on the remote AND on the local server

if [ ! -d /var/log/evs-pg-utils ] ; then
 sudo mkdir /var/log/evs-pg-utils
 sudo chown postgres:postgres /var/log/evs-pg-utils
fi
LOGFILE=/var/log/evs-pg-utils/failover.log


echo "executing failover.sh at `date`"  | ${LOGFILE}
#if [ $# -ne 6 ]
#then
#    echo "$0 expecting 6 parameters but received only $#" | tee -a /opt/evs-infra-pg-utils/logs/failover.log
#    exit 1
#fi

FALLING_NODE=$1            # %d
FALLING_HOST=$2            # %h
OLD_PRIMARY_ID=$3          # %P
NEW_PRIMARY_ID=$4          # %m
NEW_PRIMARY_HOST=$5        # %H
NEW_MASTER_PGDATA=$5       # %R

(
date
echo "FALLING_NODE: $FALLING_NODE"
echo "FALLING_HOST: $FALLING_HOST"
echo "OLD_PRIMARY_ID: $OLD_PRIMARY_ID"
echo "NEW_PRIMARY_ID: $NEW_PRIMARY_ID"
echo "NEW_PRIMARY_HOST: $NEW_PRIMARY_HOST"
echo "NEW_MASTER_PGDATA: $NEW_MASTER_PGDATA"
 
ssh_options="ssh -n -T -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
set -x
 
if [ $FALLING_NODE = $OLD_PRIMARY_ID ] ; then
  $ssh_options postgres@${NEW_PRIMARY_HOST} "/usr/pgsql-9.6/bin/repmgr --log-to-file -f /etc/repmgr/9.6/repmgr.conf standby promote -v "
fi
exit 0;
) 2>&1 | tee -a ${LOGFILE}
