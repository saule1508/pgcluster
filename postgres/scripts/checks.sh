#!/bin/bash

sudo supervisorctl status all | while read line
do
  proc=$( echo $line | cut -f1 -d" " )
  state=$( echo $line | cut -f2 -d" ")
  info=$( echo $line | sed -e "s/^.*pid/pid/" -e "s/,/ /g")
  echo supervisor,$proc,$state,$info
done
repmgr node check | grep -v "^Node" | while read line
do
  ck=$(echo $line | sed -e "s/\t//" -e "s/ /_/g" | cut -f1 -d":")
  res=$(echo $line | sed -e "s/^.*://")
  echo repmgr,$ck,$res
done
df -k ${PGDATA} | grep -v "^Filesystem" | awk '{print "disk,"$NF","$5","$3","$2}'
df -k /u02/backup | grep -v "^Filesystem" | awk '{print "disk,"$NF","$5","$3","$2}'
df -k /u02/archive | grep -v "^Filesystem" | awk '{print "disk,"$NF","$5","$3",$2}'

