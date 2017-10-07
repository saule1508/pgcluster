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


#if we want to use automatic failover of repmgrd, uncomment lines below (it will simply exit 0)
#echo "failover.sh detected, will just exit 0 so that pgpool reconfigure itself"  | tee -a $LOGFILE
#echo "FALLING_NODE: $FALLING_NODE" | tee -a $LOGFILE
#echo "FALLING_HOST: $FALLING_HOST" | tee -a $LOGFILE
#echo "OLD_PRIMARY_ID: $OLD_PRIMARY_ID" | tee -a $LOGFILE
#echo "NEW_PRIMARY_ID: $NEW_PRIMARY_ID" | tee -a $LOGFILE
#echo "NEW_PRIMARY_HOST: $NEW_PRIMARY_HOST" | tee -a $LOGFILE
#echo "NEW_MASTER_PGDATA: $NEW_MASTER_PGDATA" | tee -a $LOGFILE
#exit 0

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
  $ssh_options postgres@${NEW_PRIMARY_HOST} "/usr/pgsql-10/bin/repmgr --log-to-file -f /etc/repmgr/10/repmgr.conf standby promote -v "
fi
exit 0;
) 2>&1 | tee -a ${LOGFILE}
