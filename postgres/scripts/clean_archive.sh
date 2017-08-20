#!/bin/bash

#Date: 28-Feb-2017
#Author: PTI
#Desc: clean-up archive files

if [ ! -f /opt/cl-pg-utils/lib/cl_pg_utils_lib.sh ] ; then
 echo ERROR clean_archive: file /opt/cl-pg-utils/lib/cl_pg_utils_lib.sh does not exist
 exit 1
fi
source /opt/cl-pg-utils/lib/cl_pg_utils_lib.sh

if [ ! -d /var/log/cl-pg-utils ] ; then
 sudo mkdir /var/log/cl-pg-utils
 sudo chown postgres:postgres /var/log/cl-pg-utils
fi

LOGFILE=/var/log/cl-pg-utils/clean_archive.log
PROJECT="clean_archive"

EVSPGARCHIVE=${EVSPGARCHIVE:-/u02/archive}
if [ ! -d ${EVSPGARCHIVE} ] ; then
 log_error $PROJECT "Directory ${EVSPGARCHIVE} does not exist"
 exit 1
fi
EVSPGARCHIVERETENTION=${EVSPGARCHIVERETENTION:-5}
log_info $PROJECT "Clean archive directory ${EVSPGARCHIVE} older than ${EVSPGARCHIVERETENTION} "
find ${PGARCHIVE} -name ???????????????????????? -maxdepth 1 -mtime +${EVSPGARCHIVERETENTION} -type f -delete
