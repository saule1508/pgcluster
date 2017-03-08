#!/bin/bash

#put keys on the remote AND on the local server
#NOT TESTED

if [ ! -d /var/log/evs-pg-utils ] ; then
 sudo mkdir /var/log/evs-pg-utils
 sudo chown postgres:postgres /var/log/evs-pg-utils
fi
LOGFILE=/var/log/evs-pg-utils/follow_master.log

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
ssh_options="ssh -n -T -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
set -x
$ssh_options postgres@${HOSTNAME} "/usr/pgsql-9.6/bin/repmgr --log-to-file -f /etc/repmgr/9.6/repmgr.conf -h ${NEW_MASTER_HOST} -U repmgr -d repmgr standby follow -v "
) 2>&1 | tee -a $LOGFILE


#follow_master_command = '/opt/evs-infra-pg-utils/scripts/pgpool/follow_master.sh %d %h %m %p %H %M %P'
#                                   # Executes this command after master failover
#                                   # Special values:
#                                   #   %d = node id
#                                   #   %h = host name
#                                   #   %p = port number
#                                   #   %D = database cluster path
#                                   #   %m = new master node id
#                                   #   %H = hostname of the new master node
#                                   #   %M = old master node id
#                                   #   %P = old primary node id
