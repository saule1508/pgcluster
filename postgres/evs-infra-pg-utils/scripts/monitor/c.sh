#!/bin/bash
#Author: PTI
#Date: Feb 2017

source /etc/evs-infra-pg-utils.conf
source /opt/evs-infra-pg-utils/scripts/evs_infra_pg_utils_lib.sh
echo List of nodes: $NODE_LIST

NBRNODES=`echo $NODE_LIST | awk 'BEGIN {FS=","}{print NF}'`
if [[ $NBRNODES -le 1 ]]; then
 echo "No replication set-up or wrong config in /etc/evs-infra-pg-utils"
 exit 1
fi
THISNODE=`hostname | tr [A-Z] [a-z]`
echo $THISNODE
echo $NODE_LIST | tr [A-Z] [a-z] | grep -q $THISNODE
if [ $? -ne 0 ] ; then
 echo "wrong config in /etc/evs-infra-pg-utils: this node $THISNODE is not in the list $NODE_LIST"
fi 
for node in `echo $NODE_LIST | tr "," " "`
do
 echo "doing $node"

 if [[ $node == ${THISNODE} ]] ; then
   ISPRIMARY=`is_primary`
   DBROLE=`get_db_role`
   echo $DBROLE 
   if [[ $DBROLE == 'STANDBY' ]] ; then
     RECEIVED=`ps aux | egrep 'wal\sreceiver' | awk '{print $NF}'`
     STANDBYNODE=$node
   else
     SENT=`ps aux | egrep 'wal\ssender'`
     PRIMARYNODE=$node
   fi
 else
   echo "$node"
 fi
done
echo standby=$STANDBYNODE, received=$RECEIVED, primary= $PRIMARYNODE, sent=$SENT
