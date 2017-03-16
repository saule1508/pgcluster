#!/bin/bash

wait_for_master(){
 SLEEP_TIME=5
 HOST=pg01
 PORT=5432
 MAX_TRIES=10

 ssh pg01 "psql -c \"select 1;\"" > /dev/null
 ret=$?
 if [ $ret -eq 0 ] ; then
  echo "server ready"
  return 0
 fi
 until [[ $ret -eq 0 ]] || [[ "$MAX_TRIES" == "0" ]]; do
  echo "$(date) - waiting for postgres..."
  sleep $SLEEP_TIME
  MAX_TRIES=`expr "$MAX_TRIES" - 1`
  ssh pg01 "psql -c \"select 1;\"" > /dev/null
  ret=$?
 done
 ssh pg01 "psql -c \"select 1;\"" > /dev/null
 return $?
}

echo "Waiting for master"
wait_for_master
echo "Sleep 10 seconds"
sleep 10
echo "Create user hcuser"
ssh pg01 "psql -c \"create user hcuser with login password 'hcuser';\""
echo "Generate pool_passwd file from pg01"
ssh postgres@pg01 "psql -c \"select rolname,rolpassword from pg_authid;\"" | awk 'BEGIN {FS="|"}{print $1" "$2}' | grep md5 | while read f1 f2
do
 echo $f1:$f2 >> /etc/pgpool-II/pool_passwd
done
if [ ! -z $TRUSTED_SERVERS ] ; then
 echo "Patching trusted_servers in pgpool.conf with $TRUSTED_SERVERS"
 sed -i -e "s/##TRUSTED_SERVERS##/${TRUSTED_SERVERS}/" /etc/pgpool-II/pgpool.conf
else
 echo "trusted servers is not set"
fi
if [ ! -z $DELEGATE_IP ] ; then
 echo "Patching delegate_IP in pgpool.conf with $DELEGATE_IP"
 sed -i -e "s/##DELEGATE_IP##/${DELEGATE_IP}/" /etc/pgpool-II/pgpool.conf
else
 echo "delegate IP is not set, turn off watch dog"
 sed -i -e "/^use_watchdog/s/on/off/" /etc/pgpool-II/pgpool.conf
fi
STREAMING_REPLICATION=${STREAMING_REPLICATION:-1}
if [ $STREAMING_REPLICATION -eq 0 ] ; then
  echo "No streaming replication"
  sed -i -e "/^master_slave_mode/s/on/off/" /etc/pgpool-II/pgpool.conf
fi

NODE_NAME=${NODE_NAME:-pgpool01}
echo "Node name is $NODE_NAME"
if [ $NODE_NAME != "pgpool01" ] ; then
  echo "Patching wd_hostname with ${NODE_NAME}"
  sed -i -e "/wd_hostname/s/pgpool01/${NODE_NAME}/" /etc/pgpool-II/pgpool.conf
  echo "Patching heartbeat_destination0 with pgpool01"
  sed -i -e "/heartbeat_destination0/s/pgpool02/pgpool01/" /etc/pgpool-II/pgpool.conf
  echo "Patching other_pgpool_hostname0 with pgpool01"
  sed -i -e "/other_pgpool_hostname0/s/pgpool02/pgpool01/" /etc/pgpool-II/pgpool.conf
fi
echo "Start pgpool in foreground"
/usr/bin/pgpool -f /etc/pgpool-II/pgpool.conf -n
