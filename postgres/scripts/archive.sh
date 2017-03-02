#!/bin/bash

source /opt/evs-pg-utils/lib/evs_pg_utils_lib.sh
THISHOST=`hostname`
log_info archive "archiving $1 $2 to pg02"
/bin/rsync -ac %p postgres@pg02:/u02/archive/%f
return $?
