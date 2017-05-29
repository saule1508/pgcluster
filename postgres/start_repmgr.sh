#!/bin/bash

if [ $INITIAL_NODE_TYPE == "single" ] ; then
  echo "single node type, do not start repmgr"
  tail -f /opt/scripts/start_repmgr.sh
else
  sleep 10
  exec /usr/pgsql-9.6/bin/repmgrd -f /etc/repmgr/9.6/repmgr.conf --verbose --monitoring-history
fi
