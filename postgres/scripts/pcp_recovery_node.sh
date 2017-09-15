#!/bin/sh

if [ $# -ne 1 ] ; then
  echo Please supply node id to be recovered
  exit 1
fi
pcp_recovery_node -h pgpool01 -p 9898 -w $1
