#!/bin/bash

#put keys on the remote AND on the local server
#NOT TESTED

if [ ! -d /var/log/pg ] ; then
 sudo mkdir -p /var/log/pg
 sudo chown postgres:postgres /var/log/pg
fi
LOGFILE=/var/log/pgfollow_master.log
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
PGDATA=${PGDATA:-/u01/pg96/data}


(
echo NODEID=${NODEID} 
echo HOSTNAME=${HOSTNAME}
echo NEW_MASTER_ID=${NEW_MASTER_ID}
echo PORT_NUMBER=${PORT_NUMBER}
echo NEW_MASTER_HOST=${NEW_MASTER_HOST}
echo OLD_MASTER_ID=${OLD_MASTER_ID}
echo OLD_PRIMARY_ID=${OLD_PRIMARY_ID}
echo PGDATA=${PGDATA}
if [ $NODEID -eq $OLD_PRIMARY_ID ] ; then
  echo "Do nothing as this is the failed master. We could prevent failed master to restart here, so that we can investigate the issue" | tee -a $LOGFILE
else
  ssh_options="ssh -n -T -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
  set -x
  $ssh_options postgres@${HOSTNAME} "/usr/pgsql-9.6/bin/repmgr --log-to-file -f /etc/repmgr/9.6/repmgr.conf -h ${NEW_MASTER_HOST} -D ${PGDATA} -U repmgr -d repmgr standby follow -v "
fi
) 2>&1 | tee -a $LOGFILE
