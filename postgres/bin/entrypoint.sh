#!/bin/bash

echo "Calling script /scripts/initdb.sh"
su postgres /scripts/initdb.sh
if [ $? -ne 0 ] ; then
 echo initdb.sh FAILURE
 exit 1
else
 echo initdb OK, starting init
fi
exec /usr/sbin/init
