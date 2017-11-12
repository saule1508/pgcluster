#!/bin/bash

/usr/pgsql-10/bin/repmgr --log-to-file -f /etc/repmgr/10/repmgr.conf standby promote -v 
exit $?
