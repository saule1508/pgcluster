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
INITIAL_NODE_TYPE=${INITIAL_NODE_TYPE:-single} 
NOARCHIVELOG=${NOARCHIVELOG:-0}
log_info "NOARCHIVELOG: ${NOARCHIVELOG}" 
export PATH=$PATH:/usr/pgsql-9.6/bin
MSLIST=${MSLIST-"asset,ingest,playout"}

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


master_slave_mode = on
if [[ $INITIAL_NODE_TYPE = "single" ]] ; then
  log_info "Single node set-up, disable repmgr in supervisord.conf"
  awk '/program:repmgr/ {l=5}; (l-- > 0) {$0="# "$0} 1' /etc/supervisor/supervisord.conf > /tmp/supervisor.patched
  sudo cp /tmp/supervisor.patched /etc/supervisor/supervisord.conf
  rm /tmp/supervisor.patched
else
  cat <<EOF >> /home/postgres/.pgpass 
*:*:repmgr:repmgr:repmgrpwd
*:*:replication:repmgr:repmgrpwd
EOF
  chmod 600 /home/postgres/.pgpass
fi

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
    if [ $INITIAL_NODE_TYPE = "master" ] ; then
      log_info "Creating repmgr database and user"
      createuser -s repmgr
      createdb repmgr -O repmgr
      psql --username=repmgr -d repmgr -c "alter user repmgr login password 'repmgrpwd';"
      psql --username=repmgr -d repmgr -c "ALTER USER repmgr SET search_path TO repmgr_critlib, \"\$user\", public;"
      log_info "Register master in repmgr"
      repmgr -f /etc/repmgr/9.6/repmgr.conf -v master register
    fi
    log_info "Stopping database"
    pg_ctl -D ${PGDATA} stop -w
  else
    log_info "This node is a slave, fix repmgr.conf"
    sudo sed -i -e "s/pg01/pg02/" -e "/^node=/s/1/2/" /etc/repmgr/9.6/repmgr.conf
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
fi
