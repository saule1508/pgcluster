#!/bin/bash

source /opt/cl-pg-utils/lib/cl_pg_utils_lib.sh
THISHOST=`hostname`
if [ $NOARCHIVELOG -eq 1 ] ; then
  log_info archive "archiving $1 skipped because NOARCHIVELOG is 1"
  exit 0
fi
log_info archive "archiving $1"
cp $1 /u02/archive/$2
ret=$?
/bin/rsync -ac $1 postgres@pg02:/u02/archive/$2
if [ $? -eq 0 ] ; then
  log_info archive "rsynced $1 to pg02"
else
  log_info archive "failed to rsync $1 to pg02"
fi
return $ret
