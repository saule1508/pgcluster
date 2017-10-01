#!/bin/sh
#
# Desc: Restore script for psx platform
# Date: 13-Sep-17
# Author: PTI
#########################################

source /scripts/lib/pg_utils.sh

#############################
# Functions
#############################

help(){
 cat <<EOF
  Usage is restore.sh -n <name>
  -n: name of the backup (i.e. the directory in /u02/backup)
  -t: type of backup, either backup or dump (only backup is supported now)
  -f: force
  -h: this screen
EOF
}

while getopts n:fh ARG
do
   case $ARG in
      n ) BUNAME=${OPTARG};;
      f ) FORCE=1;; 
      t ) BUTYPE=${OPTARG};;
      h ) help ;;
      * ) echo "invalid parameter"
          help
          exit;;
   esac
done
if [ -z $BUNAME ] ; then
 echo Missing parameter 
 help
 exit 1
fi
if [ -z $FORCE ] ; then
 FORCE=0
fi
BUTYPE=${BUTYPE:-backup}
if [ $BUTYPE != "backup" ] ; then
 echo Only binary backups (butype backup) are supported
 exit 1
fi

BUDIR=/u02/backup

if [ ! -d ${BUDIR}/${BUNAME} ] ; then
 echo directory ${BUDIR}/${BUNAME} does not exist
 exit 1
fi
if [ ! -f ${BUDIR}/${BUNAME}/base.tar.gz ] ; then
 echo Backup base.tar.gz not found in ${BUDIR}/${BUNAME}
 exit 1
fi
echo Role is $(get_db_role)
echo Check if postgres is running
is_running
if [ $? -eq 1 ] ; then
 echo Postgres is running
 if [ ${FORCE} -eq 1 ] ; then
   WASRUNNING=1
   echo Stopping postgres
   pg_ctl stop -w --mode=fast
   if [ $? -ne 0 ] ; then
     echo Cannot stop postgres..
     exit 1
   fi
 else
   echo Need the -f option to restore when postgres is running
   exit 1
 fi
fi
rm -rf /u01/pg96/data/*
tar -xf ${BUDIR}/${BUNAME}/base.tar.gz --directory=/u01/pg96/data
echo You may restart postgres now. Edit the recovery file if you want to roll forward
exit $?
