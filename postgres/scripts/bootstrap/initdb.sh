#!/bin/bash

LOGFILE=/opt/cl-pg-utils/logs/initdb.log
if [ ! -d /opt/cl-pg-utils/logs ] ; then
 sudo mkdir /opt/cl-pg-utils/logs
 sudo chown postgres:postgres /opt/cl-pg-utils/logs
fi

log_info(){
 echo `date` - $1 | tee -a ${LOGFILE}
}

create_user(){
 MS=${1}
 MSOWNER=${1}_owner
 MSUSER=${1}_user
 MSOWNER_PWD=${2}
 MSUSER_PWD=${3}
 log_info "create ${MSOWNER} with password ${MSOWNER_PWD} and MSUSER with password ${MSUSER_PWD}"
 psql --dbname phoenix <<-EOF
   create user ${MSOWNER} with login password '${MSOWNER_PWD}';
   create schema ${MSOWNER} authorization ${MSOWNER};
   create user ${MSUSER} with login password '${MSUSER_PWD}';
   alter user ${MSUSER} set search_path to "\$user","${MSOWNER}", public;
   \q
EOF
 psql --username ${MSOWNER} --dbname phoenix <<-EOF
   grant usage on schema ${MSOWNER} to ${MSUSER};
   alter default privileges in schema ${MSOWNER} grant select,insert,update,delete on tables to ${MSUSER};
   alter default privileges in schema ${MSOWNER} grant select on sequences to ${MSUSER};
   alter default privileges in schema ${MSOWNER} grant execute on functions to ${MSUSER};
   \q
EOF
}

wait_for_master(){
 SLEEP_TIME=5
 HOST=pg01
 PORT=5432
 MAX_TRIES=10

 psql --username=repmgr -h ${HOST} -p ${PORT} repmgr -c "select 1;" > /dev/null
 ret=$?
 if [ $ret -eq 0 ] ; then
  echo "server ready"
  return 0
 fi
 until [[ $ret -eq 0 ]] || [[ "$MAX_TRIES" == "0" ]]; do
  echo "$(date) - waiting for postgres..."
  sleep $SLEEP_TIME
  MAX_TRIES=`expr "$MAX_TRIES" - 1`
  psql --username=repmgr -h ${HOST} -p ${PORT} repmgr -c "select 1;" > /dev/null
  ret=$?
 done
 psql --username=repmgr -h ${HOST} -p ${PORT} repmgr -c "select 1;" > /dev/null
 return $?
}

> $LOGFILE
log_info "Start initdb on host `hostname`"
log_info "MSLIST: ${MSLIST}" 
log_info "MSOWNERPWDLIST: ${MSOWNERPWDLIST}" 
log_info "MSUSERPWDLIST: ${MSUSERPWDLIST}" 
log_info "PGDATA: ${PGDATA}" 
log_info "INITIAL_NODE_TYPE: ${INITIAL_NODE_TYPE}" 
log_info "NODE_ID: ${NODE_ID}"
log_info "NODE_NAME: ${NODE_NAME}"
INITIAL_NODE_TYPE=${INITIAL_NODE_TYPE:-single} 
ARCHIVELOG=${ARCHIVELOG:-1}
log_info "ARCHIVELOG: ${ARCHIVELOG}" 
export PATH=$PATH:/usr/pgsql-9.6/bin
MSLIST=${MSLIST-"asset,ingest,playout"}
log_info "MSLIST: ${MSLIST}"
REPMGRPWD=${REPMGRPWD:-repmgr}
log_info "REPMGRPWD=${REPMGRPWD}"
sed -i -e "/^NODE_ID=/d" -e "/^NODE_NAME=/d" /opt/cl-pg-utils/lib/cl_pg_utils.env
echo "NODE_ID=${NODE_ID}" >> /opt/cl-pg-utils/lib/cl_pg_utils.env
echo "NODE_NAME=${NODE_NAME}" >> /opt/cl-pg-utils/lib/cl_pg_utils.env


create_microservices(){
 IFS=',' read -ra MSERVICES <<< "$MSLIST"
 IFS=',' read -ra MSOWNERPASSWORDS <<< "$MSOWNERPWDLIST"
 IFS=',' read -ra MSUSERPASSWORDS <<< "$MSUSERPWDLIST"
 for((i=0;i<${#MSERVICES[@]};i++))
 do
    if [ ! -z ${MSOWNERPASSWORDS[$i]} ] ; then
      OWNERPWD=${MSOWNERPASSWORDS[$i]}
    else
      OWNERPWD=${MSERVICES[$i]}"_owner"
    fi
    if [ ! -z ${MSUSERPASSWORDS[$i]} ] ; then
      USERPWD=${MSUSERPASSWORDS[$i]}
    else
      USERPWD=${MSERVICES[$i]}"_user"
    fi
    log_info "creating postgres users for microservice: ${MSERVICES[$i]} with password ${OWNERPWD} and ${USERPWD}"
    create_user  ${MSERVICES[$i]} ${OWNERPWD} ${USERPWD}
 done
}

#repmgr.conf
sudo touch /etc/repmgr/9.6/repmgr.conf && sudo chown postgres:postgres /etc/repmgr/9.6/repmgr.conf
cat <<EOF > /etc/repmgr/9.6/repmgr.conf
cluster=critlib
node=${NODE_ID}
node_name=${NODE_NAME}
conninfo='host=${NODE_NAME} dbname=repmgr user=repmgr password=${REPMGRPWD}'
use_replication_slots=1
restore_command = cp /u02/archive/%f %p
logfile='/var/log/repmgr/repmgr.log'
failover=manual
monitor_interval_secs=30
pg_bindir = '/usr/pgsql-9.6/bin'
EOF
if [ -f /etc/supervisor/supervisord.conf ] ; then
  cat <<EOF >> /etc/repmgr/9.6/repmgr.conf
service_start_command = pg_ctl start
service_stop_command = pg_ctl stop
service_restart_command = pg_ctl restart
service_reload_command = pg_ctl reload
EOF
else
  cat <<EOF >> /etc/repmgr/9.6/repmgr.conf
service_start_command = sudo systemctl start postgresql-9.6
service_stop_command = sudo systemctl stop postgresql-9.6
service_restart_command = sudo systemctl restart postgresql-9.6
service_reload_command = sudo systemctl reload postgresql-9.6
EOF
fi

if [ $INITIAL_NODE_TYPE = "single" ] ; then
  if [ -f /etc/supervisor/supervisord.conf ] ; then
    log_info "Single node set-up, disable repmgr in supervisord.conf"
    awk '/program:repmgr/ {l=5}; (l-- > 0) {$0="# "$0} 1' /etc/supervisor/supervisord.conf > /tmp/supervisor.patched
    sudo cp /tmp/supervisor.patched /etc/supervisor/supervisord.conf
    rm /tmp/supervisor.patched
  else
    log_info "Single node set-up, disable service repmgrd"
    sudo systemctl disable rempgr96
  fi
fi

touch /home/postgres/.pgpass
cat <<EOF >> /home/postgres/.pgpass 
*:*:repmgr:repmgr:${REPMGRPWD}
*:*:replication:repmgr:${REPMGRPWD}
EOF
chmod 600 /home/postgres/.pgpass

if [ ! -f ${PGDATA}/postgresql.conf ] ; then
  log_info "$PGDATA/postgresql.conf does not exist"
  if [[ "a$INITIAL_NODE_TYPE" = "amaster" || "a$INITIAL_NODE_TYPE" = "asingle" ]] ; then
    log_info "This node is the master or it is a single DB setup, initdb"
    pg_ctl initdb -D ${PGDATA} -o "--encoding='UTF8' --locale='en_US.UTF8'"
    log_info "Adding include_dir in $PGDATA/postgresql.conf"
    echo "include_dir = '/opt/cl-pg-utils/pgconfig'" >> $PGDATA/postgresql.conf
    if [ $INITIAL_NODE_TYPE = "master" ] ; then
      cat <<-EOF >> $PGDATA/pg_hba.conf
# replication manager
local  replication   repmgr                      trust
host   replication   repmgr       127.0.0.1/32    trust
host   replication   repmgr       0.0.0.0/0   md5
local   repmgr        repmgr                     trust
host    repmgr        repmgr      127.0.0.1/32   trust
host    repmgr        repmgr      0.0.0.0/0  md5
EOF
    fi
    echo "host all all 0.0.0.0/0 md5" >> $PGDATA/pg_hba.conf
    pg_ctl -D ${PGDATA} start -w 
    psql --command "create database phoenix ENCODING='UTF8' LC_COLLATE='en_US.UTF8';"
    create_microservices
    log_info "Creating repmgr database and user"
    createuser -s repmgr
    createdb repmgr -O repmgr
    psql --username=repmgr -d repmgr -c "alter user repmgr login password '${REPMGRPWD}';"
    psql --username=repmgr -d repmgr -c "ALTER USER repmgr SET search_path TO repmgr_critlib, \"\$user\", public;"
    log_info "Register master in repmgr"
    repmgr -f /etc/repmgr/9.6/repmgr.conf -v master register
    log_info "Stopping database"
    pg_ctl -D ${PGDATA} stop -w
    echo "ARCHIVELOG=${ARCHIVELOG}" > $PGDATA/override.env
  else
    log_info "Wait that master is up and running"
    wait_for_master
    if [ $? -eq 0 ] ; then
     log_info "Master is ready, sleep 10 seconds before cloning slave"
     sleep 10
     sudo rm -rf ${PGDATA}/*
     repmgr -h pg01 -U repmgr -d repmgr -D ${PGDATA} -f /etc/repmgr/9.6/repmgr.conf standby clone
     pg_ctl -D ${PGDATA} start -w
     repmgr -f /etc/repmgr/9.6/repmgr.conf standby register
     pg_ctl stop -w 
    else
     log_info "Master is not ready, standby will not be initialized"
    fi
  fi
else
  log_info "File ${PGDATA}/postgresql.conf already exist"
  touch $PGDATA/override.env
  sed -i -e "/^ARCHIVELOG=/d" $PGDATA/override.env
  echo "ARCHIVELOG=${ARCHIVELOG}" >> $PGDATA/override.env
fi
