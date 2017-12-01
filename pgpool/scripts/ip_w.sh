#!/bin/bash

echo "Exec ip with params $@ at `date`"
/usr/sbin/ip $@
exit $?
