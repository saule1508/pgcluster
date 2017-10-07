#!/bin/bash
#Description: clean-up postgres log files
#Author: Me

source /scripts/lib/pg_utils.sh

PGDATA=${PGDATA:-/u01/pg10/data}
if [ -z $EVSPGLOG ] ; then
 EVSPGLOG=${PGDATA}/pg_log
fi
if [ ! -d ${EVSPGLOG} ] ; then
 log_error clean_log "Cannot find directory $EVSPGLOG"
 exit 1
fi

log_info clean_log "Deleting logfile older than 2 days in $EVSPGLOG"

find $EVSPGLOG -name "postgresql*.log" -o -name "postgresql*.csv" -mtime +2 -delete
find $EVSPGLOG -name "postgresql*.log" -o -name "postgresql*.csv" -mtime +1 -exec gzip {} \;
