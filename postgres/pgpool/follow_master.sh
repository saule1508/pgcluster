#!/bin/bash

#put keys on the remote AND on the local server
#NOT TESTED

if [ ! -d /var/log/cl-pg-utils ] ; then
 sudo mkdir /var/log/cl-pg-utils
 sudo chown postgres:postgres /var/log/cl-pg-utils
fi
LOGFILE=/var/log/cl-pg-utils/follow_master.log
if [ ! -f $LOGFILE ] ; then
 > $LOGFILE
fi

echo "executing follow_master.sh at `date`"  | tee -a $LOGFILE

NODEID=$1
HOSTNAME=$2
NEW_MASTER_ID=$3
PORT_NUMBER=$4
NEW_MASTER_HOST=$5
OLD_MASTER_ID=$6
OLD_PRIMARY_ID=$7


(
echo NODEID=${NODEID} 
echo HOSTNAME=${HOSTNAME}
echo NEW_MASTER_ID=${NEW_MASTER_ID}
echo PORT_NUMBER=${PORT_NUMBER}
echo NEW_MASTER_HOST=${NEW_MASTER_HOST}
echo OLD_MASTER_ID=${OLD_MASTER_ID}
echo OLD_PRIMARY_ID=${OLD_PRIMARY_ID}
if [ $NODEID -eq $OLD_PRIMARY_ID ] ; then
  echo "We could prevent failed master to restart here, so that we can investigate the issue"
else
  ssh_options="ssh -n -T -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
  set -x
  $ssh_options postgres@${HOSTNAME} "/usr/pgsql-9.6/bin/repmgr --log-to-file -f /etc/repmgr/9.6/repmgr.conf -h ${NEW_MASTER_HOST} -D /u01/pg96/data -U repmgr -d repmgr standby follow -v "
fi
) 2>&1 | tee -a $LOGFILE
