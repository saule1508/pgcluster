#!/bin/bash

# Some utilities for operating postgres
# Author: PTI
# Date : 28-Feb-2017

source /opt/cl-pg-utils/lib/cl_pg_utils.env

if [ ! -d /var/log/cl-pg-utils ] ; then
 sudo mkdir /var/log/cl-pg-utils
 sudo chown postgres:postgres /var/log/cl-pg-utils
fi

LOGFILE=/var/log/cl-pg-utils/cl_pg_utils.log

log_info(){
 str="INFO - $1 - `date +\"%Y-%m-%d %H:%M\"` - $2"
 echo $str | tee -a $LOGFILE
}

log_warning(){
 str="WARN - $1 - `date +\"%Y-%m-%d %H:%M\"` - $2"
 echo $str | tee -a $LOGFILE
 WITHWARNING=1
}

log_error(){
 str="ERROR - $1 - `date +\"%Y-%m-%d %H:%M\"` - $2"
 echo $str | tee -a $LOGFILE
 WITHERROR=1
}

log_debug(){
 if [ ! -z $DEBUG ] ; then
  str="DEBUG - $1 - `date +\"%Y-%m-%d %H:%M\"` - $2"
  echo $str | tee -a $LOGFILE
 fi
}


is_primary(){
  str=`psql -q postgres <<EOF | grep -v "^$" | sed -e "s/ //g"
\t
select pg_is_in_recovery();
EOF`
  if [[ $str == "t" ]] ; then
   return 0;
  else
   return 1;
  fi
}

get_db_role(){
 is_primary
 if [ $? -eq 1 ] ; then
   echo "PRIMARY"
 else
   echo "STANDBY"
 fi
}
