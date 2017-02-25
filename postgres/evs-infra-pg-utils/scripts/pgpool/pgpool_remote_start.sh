#!/bin/bash

##
# Parameters are position-based and include:
#
# 1 - Host name of remote server to start.
# 2 - Path to data directory on remote server.

echo "Exec pgpool_remote_start.sh at `date`" >> /opt/evs-infra-pg-utils/logs/pgpool_remote_start.log
PATH=$PATH:/usr/pgsql-9.6/bin/pg_ctl

#for x in {1..3}; do
#  PATH=$PATH:/usr/lib/postgresql/9.$x/bin
#done

if [ $# -lt 2 ]; then
    echo "Start a remote PostgreSQL server within pgpool."
    echo
    echo "Usage: $0 REMOTE_HOST REMOTE_PATH"
    echo
    exit 1
fi

remote_host=$1
remote_path=$2
echo "remote_host: ${remote_host}" >> /opt/evs-infra-pg-utils/logs/pgpool_remote_start.log
echo "remote_path: ${remote_path}" >> /opt/evs-infra-pg-utils/logs/pgpool_remote_start.log

#options=$(cat postmaster.opts | sed 's/[^ ]* //;')
#ssh postgres@$remote_host -T "pg_ctl -D $remote_path -o '$options' start" &>/dev/null &
ssh postgres@$remote_host -T "sudo systemctl restart postgresql-9.6" &>/dev/null &
