#!/bin/bash

# Failback to a master server
# No clue what this script is supposed to do and when it is called...
# TODO: remove it if not used

if [ $# -ne 4 ]
then
    echo "Expecting 4 parameters: failback falling_node oldprimary_node new_primary"
    exit 1
fi

FALLING_NODE=$1         # %d
FALLING_HOST=$2         # %h
OLDPRIMARY_NODE=$3      # %P
NEW_PRIMARY=$4          # %H
#REPL_PASS=$5
#TRIGGER_FILE=$6

echo "failback.sh FALLING_NODE: ${FALLING_NODE}; FALLING_HOST: ${FALLING_HOST}; OLDPRIMARY_NODE: ${OLDPRIMARY_NODE}; NEW_PRIMARY: ${NEW_PRIMARY}; at $(date)\n" >> //tmp/failback.log

if [ $FALLING_NODE = $OLDPRIMARY_NODE ]; then
    if [ $UID -eq 0 ]
    then
#        sudo -u postgres ssh -T postgres@$NEW_PRIMARY /etc/postgresql/9.6/main/replication/scripts/promote.sh -f -p $REPL_PASS -d $FALLING_HOST
      echo "DEBUG: UID != 0"
    else
      echo "DEBUG: UID = 0"
#        ssh -T postgres@$NEW_PRIMARY /etc/postgresql/9.6/main/replication/scripts/promote.sh -f -p $REPL_PASS -d $FALLING_HOST
# -d was previously $OLDPRIMARY_NODE
    fi
    exit 0;
fi
exit 0
