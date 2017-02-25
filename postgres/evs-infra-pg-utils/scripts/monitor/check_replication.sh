#!/bin/bash

source /opt/evs-infra-pg-utils/lib/utils.sh

echo This host: `hostname`
echo Role: `get_db_role`

echo "List of nodes in repl_nodes table"
psql --username=repmgr repmgr -F "," -A -c "select * from repl_nodes;" | egrep -v "^id|^\(" | while read line
do
  host=`echo $line | awk 'BEGIN {FS=","} {print $5}'`
  echo $line | awk 'BEGIN {FS=","} {printf("\t***nodeid:%d role: %s host: %s***\n",$1,$2,$5)}'
  echo "check wal process on $host"
  if [ $host == `hostname` ] ; then
    ps -ef | grep wal | grep postgres | grep -v grep
  else
    ssh -n postgres@${host} "ps -ef | grep wal | grep postgres | grep -v grep"
  fi 
  echo "check repmgrd on $host"
  if [ $host == `hostname` ] ; then
    ps -ef | grep repmgrd | grep -v grep
  else
    ssh -n postgres@${host} "ps -ef | grep repmgrd | grep -v grep"
  fi 
  echo "pg_stat_replication (will be empty if not master)"
  psql -h ${host} -c "select * from pg_stat_replication;"
done
echo "*** Cluster show from repmgr ****"
repmgr -f /etc/repmgr/9.6/repmgr.conf cluster show
#psql --username=repmgr repmgr -c "select * from repl_monitor order by last_monitor_time desc limit 1;"
echo "*** pgpool show pool_nodes ***"
psql --username=repmgr -h 172.23.14.70 -p 9999 repmgr -c "show pool_nodes;"
echo "*** repmgr monitoring ***"
psql --username=repmgr repmgr -c "select * from repl_monitor order by last_monitor_time desc limit 1";
echo "*** check ip failover ***"
ip addr | grep ens192:0
if [ $? -ne 0 ] ; then
 echo "No IP failover on ens192:0"
fi
