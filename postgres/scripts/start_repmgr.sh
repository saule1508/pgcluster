#!/bin/bash
PGVER=${PGVER:-12}
if [ "$INITIAL_NODE_TYPE" == "single" -o "a${REPMGRD}" == "afalse" -o "a${REPMGRD}" == "ano" ] ; then
  echo "single node type is $INITIAL_NODE_TYPE or REPMGRD is ${REPMGRD}: do not start repmgr"
  exec tail -f /scripts/start_repmgr.sh
else
  echo "sleep 60 before starting repmgrd"
  sleep 60
  exec /usr/pgsql-${PGVER}/bin/repmgrd -f /etc/repmgr/${PGVER}/repmgr.conf --verbose --monitoring-history --daemonize=false
fi
