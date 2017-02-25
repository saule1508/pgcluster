#!/bin/bash

NODEID=$1
HOSTNAME=$2
NEW_MASTER_ID=$3
PORT_NUMBER=$4
NEW_MASTER_HOST=$5
OLD_MASTER_ID=$6
OLD_PRIMARY_ID=$7



echo "Executing follow-master at `date`" >> /opt/evs-infra-pg-utils/logs/follow-master.log
echo "NODEID: ${NODEID}" >> /opt/evs-infra-pg-utils/logs/follow-master.log
echo "HOSTNAME: ${HOSTNAME}" >> /opt/evs-infra-pg-utils/logs/follow-master.log
echo "NEW_MASTER_ID: ${NEW_MASTER_ID}" >> /opt/evs-infra-pg-utils/logs/follow-master.log
echo "PORT_NUMBER: ${PORT_NUMBER}" >> /opt/evs-infra-pg-utils/logs/follow-master.log
echo "NEW_MASTER_HOST: ${NEW_MASTER_HOST}" >> /opt/evs-infra-pg-utils/logs/follow-master.log
echo "OLD_MASTER_ID: ${OLD_MASTER_ID}" >> /opt/evs-infra-pg-utils/logs/follow-master.log
echo "OLD_PRIMARY_ID: ${OLD_PRIMARY_ID}" >> /opt/evs-infra-pg-utils/logs/follow-master.log

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

