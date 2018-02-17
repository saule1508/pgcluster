#!/bin/bash

# this will stop the manager container

CONT=$( docker ps -a | grep manager | awk '{print $1}' )
if [ "a${CONT}" != "a" ] ; then
 echo Stopping $CONT
 docker stop $CONT
 sleep 5
 echo Removing $CONT
 docker rm $CONT
else
 echo No container manager
fi
