#!/bin/bash

LOGFILE=/opt/evs-infra-pg-utils/logs/initdb.log
if [ ! -d /opt/evs-infra-pg-utils/logs ] ; then
 mkdir /opt/evs-infra-pg-utils/logs
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


> $LOGFILE
log_info "Start initdb on host `hostname`"
log_info "MSLIST: ${MSLIST}" 
log_info "MSOWNERPWDLIST: ${MSOWNERPWDLIST}" 
log_info "MSUSERPWDLIST: ${MSUSERPWDLIST}" 
log_info "PGDATA: ${PGDATA}" 
log_info "INITIAL_NODE_TYPE: ${INITIAL_NODE_TYPE}" 
log_info "NODE_ID: ${NODE_ID}" 
INITIAL_NODE_TYPE=${INITIAL_NODE_TYPE:-master} 
if [ -z $NODE_ID -a "$INITAL_NODE_TYPE" = "master" ] ; then
  NODE_ID=1
  log_info "NODE_ID set to $NODE_ID because master"
fi
if [ -z $NODE_ID -a "$INITAL_NODE_TYPE" = "slave" ] ; then
  NODE_ID=2
  log_info "NODE_ID set to $NODE_ID because slave"
fi
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


if [ ! -f ${PGDATA}/postgresql.conf ] ; then
  log_info "$PGDATA/postgresql.conf does not exist"
  #echo First fix ownership of $PGDATA
  #sudo chown postgres:postgres $PGDATA
  if [ "a$INITIAL_NODE_TYPE" = "amaster" ] ; then
    log_info "This node is the master, initdb"
    pg_ctl initdb -D ${PGDATA} -o "--encoding='UTF8' --locale='en_US.UTF8'"
    pg_ctl -D ${PGDATA} start -w 
    psql --command "create database phoenix ENCODING='UTF8' LC_COLLATE='en_US.UTF8';"
    create_microservices
    # init repmgr
    createuser -s repmgr
    createdb repmgr -O repmgr 
    psql --username=repmgr repmgr -c "ALTER user repmgr set search_path to repmgr_phoenix,\"\$user\",public;"
    pg_ctl -D ${PGDATA} stop -w
  else
    log_info "This node is a slave, fix repmgr.conf to replace node 1 by ${NODE_ID}"
    sed  -e "/^node=/s/1/${NODE_ID}/" -e "/^node_name=/s/pg01/pg0${NODE_ID}/" -e "/^conninfo=/s/pg01/pg0${NODE_ID}/" /etc/repmgr/9.6/repmgr.conf
    log_info "Doing initial clone"
    repmgr -h pg01 -U repmgr -d repmgr -D ${PGDATA} -f /etc/repmgr/9.6/repmgr.conf standby clone
    pg_ctl -D ${PGDATA} start -w
    repmgr -f /etc/repmgr/9.6/repmgr.conf standby register
    pg_ctl -D ${PG_DATA} stop -w
  fi
  log_info "Adding include_dir in $PGDATA/postgresql.conf"
  echo "include_dir = '/opt/evs-infra-pg-utils/pgconfig'" >> $PGDATA/postgresql.conf
  echo "host all all all md5" >> $PGDATA/pg_hba.conf
else
  log_info "File ${PGDATA}/postgresql.conf already exist"
fi
exit 0
