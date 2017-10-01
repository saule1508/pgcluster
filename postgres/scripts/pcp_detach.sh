#!/bin/sh

if [ $# -ne 1 ] ; then
  echo Please supply node id to be detached
  exit 1
fi
echo Find host from node_id $1
pcp_host=$(pcp_node_info -h pgpool01 -p 9898 -w $1 | cut -f1 -d" ")
echo Found host $pcp_host
echo Find the state of this host in repl_nodes
> /tmp/repl_nodes.tmp
psql -U repmgr -h pgpool01 -p 9999 repmgr -t -c "select * from repl_nodes;" > /tmp/repl_nodes.tmp
repl_active=$(cat /tmp/repl_nodes.tmp | grep "| ${pcp_host} |" | cut -f9 -d"|")
repl_status=$(cat /tmp/repl_nodes.tmp | grep "| ${pcp_host} |" | cut -f2 -d"|")
echo repl_active = ${repl_active} - repl_status = ${repl_status}
if [ $repl_active == 't' -a $repl_status == 'master' ] ; then
 echo ERROR: you are going to detach an active master
 exit 1
fi

pcp_detach_node -h pgpool01 -p 9898 -w $1
exit $?

