#!/bin/sh
#
# Desc: backup script in the psx platform
# Date: 13-Sep-17
# Author: PTI


#############################
# Functions
#############################

help(){
 cat <<EOF
  Usage is backup.sh [-n <name>] [-t <backup|export>]
  -n: name of the backup
      If not given, we use the datetime
  -t: type of backup, per default it is a basebackup but a pg_dump is also possible
  -h: this screen
EOF
}

while getopts n:t: ARG
do
   case $ARG in
      n ) BUNAME=${OPTARG};;
      t ) BUTYPE=${OPTARG};;
      h ) help ;;
      * ) echo "invalid parameter"
          help
          exit;;
   esac
done
TIME=`date "+%Y%m%d%H%M"`
BUNAME=${BUNAME:-$TIME}
BUTYPE=${BUTYPE:-backup}
DIR=${BUNAME}_${BUTYPE}
rm -rf /u02/backup/${DIR}
if [ ${BUTYPE} == 'backup' ] ; then
  echo Doing base backup in /u02/backup/${DIR}
  pg_basebackup -D /u02/backup/${DIR} --username=repmgr --format=tar --write-recovery-conf --xlog --gzip --label ${BUNAME} --verbose
  exit $?
elif [ ${BUTYPE} == 'dump' ] ; then
  echo Doing pg_dump in /u02/backup/${DIR}
  mkdir /u02/backup/${DIR}
  pg_dump --format=c phoenix | gzip > /u02/backup/${DIR}/phoenix.dump.gz
  exit $?
else
  echo Invalid backup type ${BUTYPE}
  help
  exit 1
fi
