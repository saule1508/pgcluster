#!/bin/bash

echo "Calling script /opt/evs-infra-pg-utils/script/initdb.sh"
su postgres /opt/evs-infra-pg-utils/scripts/initdb.sh
if [ $? -ne 0 ] ; then
 echo initdb.sh FAILURE
 exit 1
else
 echo initdb OK, starting init
fi
exec /usr/sbin/init
