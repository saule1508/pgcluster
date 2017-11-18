#!/bin/bash

if [ $INITIAL_NODE_TYPE == "single" ] ; then
  echo "single node type, do not start repmgr"
  tail -f /scripts/start_repmgr.sh
else
  echo "sleep 60 before starting repmgrd"
  sleep 60
  exec /usr/pgsql-10/bin/repmgrd -f /etc/repmgr/10/repmgr.conf --verbose --monitoring-history
fi
