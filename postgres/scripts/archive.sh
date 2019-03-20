#!/bin/bash

if [ -f $PGDATA/override.env ] ; then
  source $PGDATA/override.env
fi
THISHOST=`hostname`
if [ $ARCHIVELOG -eq 0 ] ; then
  echo "archiving $1 skipped because ARCHIVELOG is 0"
  exit 0
fi
echo "archiving $1"
cp $1 /archive/$2
ret=$?
exit $ret
