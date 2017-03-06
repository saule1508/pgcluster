#!/bin/bash

wait_for_master(){
 SLEEP_TIME=5
 HOST=pg01
 PORT=5432
 MAX_TRIES=10

 ssh pg01 "psql --username=repmgr -h ${HOST} -p ${PORT} repmgr -c \"select 1;\"" > /dev/null
 ret=$?
 if [ $ret -eq 0 ] ; then
  echo "server ready"
  return 0
 fi
 until [[ $ret -eq 0 ]] || [[ "$MAX_TRIES" == "0" ]]; do
  echo "$(date) - waiting for postgres..."
  sleep $SLEEP_TIME
  MAX_TRIES=`expr "$MAX_TRIES" - 1`
  ssh pg01 psql --username=repmgr -h ${HOST} -p ${PORT} repmgr -c \"select 1;\"" > /dev/null
  ret=$?
 done
 ssh pg01 psql --username=repmgr -h ${HOST} -p ${PORT} repmgr -c \"select 1;\"" > /dev/null
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
echo "Start pgpool in foreground"
/usr/bin/pgpool -f /etc/pgpool-II/pgpool.conf -n
