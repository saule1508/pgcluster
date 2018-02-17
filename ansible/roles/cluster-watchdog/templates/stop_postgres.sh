#!/bin/bash

# this will stop the postgres container

set -o allexport
source /etc/pgwatchdog/pgwatchdog.conf
set +o allexport
CONT=$( docker ps -a | grep pg0${NODE_ID} | awk '{print $1}' )
if [ "a${CONT}" != "a" ] ; then
 echo Stopping $CONT
 docker stop $CONT
 sleep 5
 echo Removing $CONT
 docker rm $CONT
else
 echo No container pg0${NODE_ID}
fi
