#!/bin/bash

#put keys on the remote AND on the local server

echo "executing failover.sh at `date`"  | tee -a /opt/evs-infra-pg-utils/logs/failover.log
if [ $# -ne 6 ]
then
    echo "$0 expecting 6 parameters but received only $#" | tee -a /opt/evs-infra-pg-utils/logs/failover.log
    exit 1
fi

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
  #ssh -n postgres${NEW_PRIMARY_HOST} "/usr/pgsql-9.6/bin/repmgr -f /etc/repmgr/9.6/repmgr.conf standby promote -v 2>/dev/null 1>/dev/null <&-"
  $ssh_options postgres@${NEW_PRIMARY_HOST} "/usr/pgsql-9.6/bin/repmgr --log-to-file -f /etc/repmgr/9.6/repmgr.conf standby promote -v "
  #sleep 5
  #if [ $UID -eq 0 ]
  #    then su postgres -c  "/usr/bin/ssh -T -l postgres $new_master \"pcp_attach_node -p 9898 -U pgpooladmin -w -n $new_master_id\""
  #    else /usr/bin/ssh -T -l postgres $new_master "/usr/bin/ssh -T -l postgres $new_master \"pcp_attach_node -p 9898 -U pgpooladmin -w -n $new_master_id\""
  #fi
fi
exit 0;
) 2>&1 | tee -a  /opt/evs-infra-pg-utils/logs/failover.log
