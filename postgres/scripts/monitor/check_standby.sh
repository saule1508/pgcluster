#!/bin/bash
#Author: PTI
#Date: Feb 2017

# WIP

source /opt/evs-pg-utils/lib/evs_pg_utils_lib.sh
NODE_LIST=`get_node_list`
echo List of nodes: $NODE_LIST

NBRNODES=`echo $NODE_LIST | awk 'BEGIN {FS=","}{print NF}'`
if [[ $NBRNODES -le 1 ]]; then
 echo "No replication set-up or wrong config in /opt/evs-pg-utils/lib/evs_pg_utils.env"
 exit 1
fi
THISNODE=`hostname | tr [A-Z] [a-z]`
echo $THISNODE
echo $NODE_LIST | tr [A-Z] [a-z] | grep -q $THISNODE
if [ $? -ne 0 ] ; then
 echo "wrong config: this node $THISNODE is not in the list $NODE_LIST"
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
     SENT=`ps aux | egrep 'wal\ssender' | awk '{print $NF}'`
     PRIMARYNODE=$node
   fi
 else
   echo "$node"
   ssh $node "ls $PGDATA/im_the_master" 2>/dev/null
   if [ $? -eq 0 ] ; then
     echo $node is the master
     SENT=`ssh $node "ps aux | egrep 'wal\ssender'" | awk '{print $NF}'`
     PRIMARYNODE=$node
   else
     echo $node is a standby
     RECEIVED=`ssh $node "ps aux | egrep 'wal\sreceiver'" | awk '{print $NF}'`
     STANDBYNODE=$node
   fi     
 fi
done
echo standby=$STANDBYNODE, received=$RECEIVED, primary= $PRIMARYNODE, sent=$SENT
