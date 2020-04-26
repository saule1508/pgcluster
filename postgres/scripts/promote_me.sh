#!/bin/bash

PGVER=${PGVER:-12}
/usr/pgsql-${PGVER}/bin/repmgr --log-to-file -f /etc/repmgr/${PGVER}/repmgr.conf standby promote -v 
exit $?
