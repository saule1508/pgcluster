#!/bin/bash

#Date: 28-Feb-2017
#Author: PTI
#Desc: clean-up archive files

if [ ! -f /scripts/lib/pg_utils.sh ] ; then
 echo ERROR clean_archive: file /scripts/lib/pg_utils.sh does not exist
 exit 1
fi
source /scripts/lib/pg-utils.sh

if [ ! -d /var/log/pg-utils ] ; then
 sudo mkdir /var/log/pg-utils
 sudo chown postgres:postgres /var/log/pg-utils
fi

LOGFILE=/var/log/pg-utils/clean_archive.log
PROJECT="clean_archive"

PGARCHIVE=${PGARCHIVE:-/u02/archive}
if [ ! -d ${PGARCHIVE} ] ; then
 log_error $PROJECT "Directory ${PGARCHIVE} does not exist"
 exit 1
fi
PGARCHIVERETENTION=${PGARCHIVERETENTION:-5}
log_info $PROJECT "Clean archive directory ${PGARCHIVE} older than ${PGARCHIVERETENTION} "
find ${PGARCHIVE} -name ???????????????????????? -maxdepth 1 -mtime +${PGARCHIVERETENTION} -type f -delete
