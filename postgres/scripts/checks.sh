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
  res=$(echo $line | cut -f2- -d":")
  echo repmgr,$ck,$res
done
df -k ${PGDATA} | grep -v "^Filesystem" | awk '{print "disk,"$NF","$5","$2","$3}'
df -k /backup | grep -v "^Filesystem" | awk '{print "disk,"$NF","$5","$2","$3}'
df -k /archive | grep -v "^Filesystem" | awk '{print "disk,"$NF","$5","$2","$3}'

