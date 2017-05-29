#!/bin/bash

echo "id is : `id -un`"
if [ `id -un` != "postgres" ] ; then
 echo "This script must be run by user postgres"
 exit 1
fi

log_info(){
 echo `date` - $1 
}

#
# return 1 when user exists in postgres, 0 otherwise
#
user_exists(){
 USER=${1}
 psql -c "select usename from pg_user where usename=upper('${USER}')" | grep -q "(0 rows)"
 if  [ $? -eq 0  ] ; then
   echo 0
 else
   echo 1
 fi
}

#
# create two users for the micro-service given as parameter 1, passwords are given as param 2 and 3
# if the users already exist, the password is changed
#
create_user(){
 MS=${1}
 MSOWNER=${1}_owner
 MSUSER=${1}_user
 MSOWNER_PWD=${2}
 MSUSER_PWD=${3}
 USREXISTS=$(user_exists ${MSOWNER} )
 if [ $USREXISTS -eq 0 ] ; then
  log_info "create ${MSOWNER} with password ${MSOWNER_PWD}"
  psql --dbname phoenix <<-EOF
   create user ${MSOWNER} with login password '${MSOWNER_PWD}';
   create schema ${MSOWNER} authorization ${MSOWNER};
   \q
EOF
 else
  log_info "user ${MSOWNER} already exists, set password to ${MSOWNER_PWD}"
  psql --dbname phoenix -c "alter user ${MSOWNER} with login password '{MSOWNER_PWD}';"
 fi
 USREXISTS=$( user_exists ${MSUSER} )
 if [ $USREXISTS -eq 0 ] ; then
  log_info "create ${MSUSER} with password ${MSUSER_PWD}"
  psql --dbname phoenix <<-EOF
    create user ${MSUSER} with login password '${MSUSER_PWD}';
    alter user ${MSUSER} set search_path to "\$user","${MSOWNER}", public;
    \q
EOF
  psql --username=${MSOWNER} --dbname phoenix <<-EOF
    grant usage on schema ${MSOWNER} to ${MSUSER};
    alter default privileges in schema ${MSOWNER} grant select,insert,update,delete on tables to ${MSUSER};
    alter default privileges in schema ${MSOWNER} grant usage,select on sequences to ${MSUSER};
    alter default privileges in schema ${MSOWNER} grant execute on functions to ${MSUSER};
    \q
EOF
 else
  log_info "user ${MSUSER} already exists, set password to ${MSUSER_PWD}"
  psql --dbname phoenix -c "alter user ${MSUSER} with login password '{MSUSER_PWD}'";
 fi
}

wait_for_master(){
 SLEEP_TIME=10
 HOST=${PG_MASTER_NODE_NAME}
 PORT=5432
 NBRTRY=24

 log_info "waiting for master on ${HOST} to be ready"
 nbrlines=0
 while [ $nbrlines -lt 1 -a $NBRTRY -gt 0 ] ; do
  sleep $SLEEP_TIME
  echo "waiting for repl_nodes to be initialized with the master"
  ssh ${HOST} "psql -U repmgr repmgr -t -c 'select name,active from repl_nodes;'" > /tmp/repl_nodes
  if [ $? -ne 0 ] ; then
    echo "cannot connect to $HOST in psql.."
    nbrlines=0
  else
    nbrlines=$( grep -v "^$" /tmp/repl_nodes | wc -l )
  fi
  NBRTRY=$((NBRTRY-1))
 done

}

log_info "Start initdb on host `hostname`"
log_info "MSLIST: ${MSLIST}" 
log_info "MSOWNERPWDLIST: ${MSOWNERPWDLIST}" 
log_info "MSUSERPWDLIST: ${MSUSERPWDLIST}" 
log_info "PGDATA: ${PGDATA}" 
INITIAL_NODE_TYPE=${INITIAL_NODE_TYPE:-single} 
log_info "INITIAL_NODE_TYPE: ${INITIAL_NODE_TYPE}" 
export PATH=$PATH:/usr/pgsql-9.6/bin
MSLIST=${MSLIST-"keycloak,apiman,asset,ingest,playout"}
NODE_ID=${NODE_ID:-1}
NODE_NAME=${NODE_NAME:-"pg0${NODE_ID}"}
ARCHIVELOG=${ARCHIVELOG:-1}
PG_MASTER_NODE_NAME=${PG_MASTER_NODE_NAME:-pg01}
log_info "NODE_ID: $NODE_ID"
log_info "NODE_NAME: $NODE_NAME"
log_info "ARCHIVELOG: $ARCHIVELOG"
log_info "docker: ${docker}"

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
    log_info "creating postgres users for microservice ${MSERVICES[$i]} with passwords ${OWNERPWD} and ${USERPWD}"
    create_user  ${MSERVICES[$i]} ${OWNERPWD} ${USERPWD}
 done
}

#
# Note that the code below is executed everytime a container is created
# this is needed in order to patch some files that are not persisted accross run
# i.e. files that are outside the PGDATA directory (PGDATA being on shared volume)
#
if [ ! -z ${REPMGRPWD} ] ; then
  log_info "repmgr password set via env"
else
  REPMGRPWD=evs123
  log_info "repmgr password default to evs123"
fi
log_info "setup .pgpass for replication and for repmgr"
echo "*:*:repmgr:repmgr:${REPMGRPWD}" > /home/postgres/.pgpass
echo "*:*:replication:repmgr:${REPMGRPWD}" >> /home/postgres/.pgpass
chmod 600 /home/postgres/.pgpass

#build repmgr.conf
sudo touch /etc/repmgr/9.6/repmgr.conf && sudo chown postgres:postgres /etc/repmgr/9.6/repmgr.conf
cat <<EOF > /etc/repmgr/9.6/repmgr.conf
cluster=phoenix
node=${NODE_ID}
node_name=${NODE_NAME}
conninfo='host=${NODE_NAME} dbname=repmgr user=repmgr password=${REPMGRPWD}'
use_replication_slots=1
restore_command = cp /u02/archive/%f %p

logfile='/var/log/repmgr/repmgr.log'
failover=manual
monitor_interval_secs=30

pg_bindir='/usr/pgsql-9.6/bin'

service_start_command = pg_ctl start
service_stop_command = pg_ctl stop
service_restart_command = pg_ctl restart
service_reload_command = pg_ctl reload
EOF

#
# stuff below will be done only once, when the database has not been initialized
#
#
if [ ! -f ${PGDATA}/postgresql.conf ] ; then
  log_info "$PGDATA/postgresql.conf does not exist"
  if [[ "a$INITIAL_NODE_TYPE" != "aslave" ]] ; then
    log_info "This node is the master or we are in a single db setup, let us init the db"
    pg_ctl initdb -D ${PGDATA} -o "--encoding='UTF8' --locale='en_US.UTF8'"
    log_info "Adding include_dir in $PGDATA/postgresql.conf"
    mkdir $PGDATA/conf.d
    cp /opt/pgconfig/01evs.conf $PGDATA/conf.d
    echo "include_dir = './conf.d'" >> $PGDATA/postgresql.conf
    cat <<-EOF >> $PGDATA/pg_hba.conf
# replication manager
local  replication   repmgr                      trust
host   replication   repmgr      127.0.0.1/32    trust
host   replication   repmgr      0.0.0.0/0       md5
local   repmgr        repmgr                     trust
host    repmgr        repmgr      127.0.0.1/32   trust
host    repmgr        repmgr      0.0.0.0/0      md5
EOF
    echo "host     all           all        0.0.0.0/0            md5" >> $PGDATA/pg_hba.conf
    echo starting database
    ps -ef
    pg_ctl -D ${PGDATA} start -w 
    psql --command "create database phoenix ENCODING='UTF8' LC_COLLATE='en_US.UTF8';"
    create_microservices
    psql phoenix -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"";
    log_info "Creating repmgr database and user"
    # NB: super user needed for replication
    psql <<-EOF
     create user repmgr with superuser login password '${REPMGRPWD}' ;
     alter user repmgr set search_path to repmgr_phoenix,"\$user",public;
     \q
EOF
    log_info "set password for postgres"
    psql --command "alter user postgres with login password '${REPMGRPWD}';"
    psql --command "create database repmgr with owner=repmgr ENCODING='UTF8' LC_COLLATE='en_US.UTF8';"
    #if [ "a$INITIAL_NODE_TYPE" = "amaster" ] ; then
      log_info "Register master in repmgr"
      repmgr -f /etc/repmgr/9.6/repmgr.conf -v master register
    #fi
    if [ -f /usr/pgsql-9.6/share/extension/pgpool-recovery.sql ] ; then
      log_info "pgpool extensions"
      psql -f /usr/pgsql-9.6/share/extension/pgpool-recovery.sql -d template1
      psql -c "create extension pgpool_adm;"
    else
      log_info "pgpool-recovery.sql extension not found"
    fi
    cp /opt/scripts/pgpool/pgpool_recovery.sh /opt/scripts/pgpool/pgpool_remote_start ${PGDATA}/
    chmod 700 ${PGDATA}/pgpool_remote_start ${PGDATA}/pgpool_recovery.sh
    log_info "Create hcuser"
    psql -c "create user hcuser with login password 'hcuser';"
    echo "ARCHIVELOG=$ARCHIVELOG" > $PGDATA/override.env
  else
    log_info "This is a slave. Wait that master is up and running"
    wait_for_master
    if [ $? -eq 0 ] ; then
     log_info "Master ready, sleep 10 seconds before cloning slave"
     sleep 10
     sudo rm -rf ${PGDATA}/*
     repmgr -h ${PG_MASTER_NODE_NAME} -U repmgr -d repmgr -D ${PGDATA} -f /etc/repmgr/9.6/repmgr.conf standby clone
     pg_ctl -D ${PGDATA} start -w
     repmgr -f /etc/repmgr/9.6/repmgr.conf standby register
    else
     log_info "Master is not ready, standby will not be initialized"
    fi
  fi
else
  log_info "File ${PGDATA}/postgresql.conf already exist"
  log_info "create micro-services users if needed"
  pg_ctl -D ${PGDATA} start -w 
  create_microservices
fi
ps -ef
