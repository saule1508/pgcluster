#!/bin/bash
#Description: clean-up postgres log files
#Author: Me

source /etc/evs-infra-pg-utils.conf

PG_LOG=${PG_LOG:-/u01/pgdata/96/pg_log}
if [ ! -d ${PG_LOG} ] ; then
 echo "Cannot find directory $PG_LOG"
 exit 1
fi

find $PG_LOG -name "postgresql*.log" -o -name "postgresql*.csv" -mtime +2 -delete
find $PG_LOG -name "postgresql*.log" -o -name "postgresql*.csv" -mtime +1 -exec gzip {} \;
