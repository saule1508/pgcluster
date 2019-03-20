#!/bin/sh
#
# Desc: delete a backup in the psx platform
# Date: 14-Sep-17
# Author: Me


#############################
# Functions
#############################

help(){
 cat <<EOF
  Usage is $0 [-n <name>] 
  -n: name of the backup
  -h: this screen
EOF
}

while getopts n: ARG
do
   case $ARG in
      n ) BUNAME=${OPTARG};;
      h ) help ;;
      * ) echo "invalid parameter"
          help
          exit;;
   esac
done
if [ -z $BUNAME ] ; then
 echo "backup name is mandatory"
 exit 1
fi
if [ ! -d /backup/${BUNAME} ] ; then
 echo /backup/${BUNAME} does not exist
 exit 1
fi
rm -rf /backup/${BUNAME}
exit $?
