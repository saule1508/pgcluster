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

PATH=$PATH:/usr/pgsql-9.6/bin

if [ ! -d /var/log/pg-utils ] ; then
 sudo mkdir /var/log/pg-utils
 sudo chown postgres:postgres /var/log/pg-utils
fi
LOGFILE=/var/log/pg-utils/pgpool_recovery.log
echo "Exec pgpool_recovery.sh at `date`" | tee -a $LOGFILE

if [ $# -lt 3 ]; then
    echo "Create a replica PostgreSQL from the primary within pgpool."
    echo
    echo "Usage: $0 PRIMARY_PATH HOST_NAME COPY_PATH"
    echo
    exit 1
fi

primary_host=$(hostname -i)
replica_host=$2
replica_path=$3
(
echo "primary_host: ${primary_host}" 
echo "replica_host: ${replica_host}" 
echo "replicat_path: ${replica_path}" 

ssh_copy="ssh postgres@$replica_host -T -n -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
$ssh_copy "sudo systemctl stop postgresql-9.6"
$ssh_copy rm -Rf $replica_path
$ssh_copy "repmgr -h ${primary_host} --username=repmgr -d repmgr -D ${replica_path} -f /etc/repmgr/9.6/repmgr.conf standby clone -v"
$ssh_copy "/usr/pgsql-9.6/bin/pg_ctl start -w"
$ssh_copy "repmgr -f /etc/repmgr/9.6/repmgr.conf standby register -F"
$ssh_copy "/usr/pgsql-9.6/bin/pg_ctl stop -w"
) 2>&1 | tee -a ${LOGFILE}
