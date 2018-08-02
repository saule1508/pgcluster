#!/bin/bash

# This script erase an existing replica and re-base it based on
# the current primary node. Parameters are position-based and include:
#
# 1 - Path to primary database directory.
# 2 - Host name of new node.
# 3 - Path to replica database directory
#
# Be sure to set up public SSH keys and authorized_keys files.
# this script must be in PGDATA

PATH=$PATH:/usr/pgsql-10/bin
ARCHIVE_DIR=/u02/archive

if [ ! -d /var/log/pg ] ; then
 sudo mkdir -p /var/log/pg
 sudo chown postgres:postgres /var/log/pg
fi
LOGFILE=/var/log/pg/pgpool_recovery.log
if [ ! -f $LOGFILE ] ; then
 > $LOGFILE
fi

echo "Exec pgpool_recovery.sh at `date`" | tee -a $LOGFILE

if [ $# -lt 3 ]; then
    echo "Create a replica PostgreSQL from the primary within pgpool."
    echo
    echo "Usage: $0 PRIMARY_PATH HOST_NAME COPY_PATH"
    echo
    exit 1
fi

#primary_host=$(hostname -i)
primary_host=$NODE_NAME
replica_host=$2
replica_path=$3
(
echo "primary_host: ${primary_host}" 
echo "replica_host: ${replica_host}" 
echo "replicat_path: ${replica_path}" 

ssh_copy="ssh -p 222 postgres@$replica_host -T -n -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
echo "Stopping postgres on ${replica_host}"
#$ssh_copy "/usr/pgsql-10/bin/pg_ctl -D ${replica_path} stop"
$ssh_copy "/scripts/pg_stop.sh"
echo sleeping 20
sleep 20
echo "delete database and archive directories on ${replica_host}"
$ssh_copy "rm -Rf $replica_path/* ${ARCHIVE_DIR}/*"
echo let us use repmgr on the replica host to force it to sync again
$ssh_copy "/usr/pgsql-10/bin/repmgr -h ${primary_host} --username=repmgr -d repmgr -D ${replica_path} -f /etc/repmgr/10/repmgr.conf standby clone -v"
echo "Start database on ${replica_host} "
# -s -l /dev/null is needed otherwise ssh hangs
#$ssh_copy "/usr/pgsql-10/bin/pg_ctl -s -l /dev/null -D ${replica_path} start"
$ssh_copy "/scripts/pg_start.sh"
echo sleeping 20
sleep 20
echo "Register standby database"
$ssh_copy "/usr/pgsql-10/bin/repmgr -f /etc/repmgr/10/repmgr.conf standby register -F -v"
$ssh_copy "sudo supervisor status all"
) 2>&1 | tee -a ${LOGFILE}
