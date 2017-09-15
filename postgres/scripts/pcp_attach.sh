#!/bin/sh

if [ $# -ne 1 ] ; then
  echo Please supply node id to be attached
  exit 1
fi
pcp_attach_node -h pgpool01 -p 9898 -w $1
exit $?
