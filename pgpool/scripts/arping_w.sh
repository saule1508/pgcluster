#!/bin/bash 

echo "Exec arping with params $@ at `date`"
/usr/sbin/arping $@
exit $?

