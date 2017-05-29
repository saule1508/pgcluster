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
cp $1 /u02/archive/$2
ret=$?
# get slave node
upstream_node=$( psql -U repmgr repmgr -t -c "select name from repl_nodes where uptstream_node_id=${NODE_ID} limit 1;" )
if [ "a$upstream_node" != "a" ] ; then
  /bin/rsync -ac $1 postgres@${upstream_node}:/u02/archive/$2
  if [ $? -eq 0 ] ; then
    echo "rsynced $1 to upstream node $upstream_node"
  else
    echo "failed to rsync $1 to $upstream_node"
  fi
fi
exit $ret
