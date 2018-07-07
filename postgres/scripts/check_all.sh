!/bin/bash

STATE_OK=0
STATE_WARNING=1
STATE_ERROR=2
STATE_UNKNOWN=3

STATE=-1
MSG=""

# params:
#  1: host to check
#  2: primary db
# return 1 (success) if host (standby) is streaming from primary
is_streaming_from(){
 HOST=$1
 PRIMARY=$2

 str=$(psql -h ${host} -U repmgr repmgr -t -c "select status||' from $PRIMARY' from pg_stat_wal_receiver where status='streaming' and conninfo like '%host=${PRIMARY}%';")
 echo $str | grep "streaming from $PRIMARY"
 if [ $? -eq 0 ] ; then
   return 1
 else
   return 0
 fi
}

lines=$(psql -U repmgr -h pgpool -p 9999 -t -c "show pool_nodes;" | grep -v "^$" | sed -e "s/ //g")
PRIMARY=$(echo "$lines" | grep primary | cut -f2 -d"|")
NBRSTDBY=$(echo "$lines" | grep standby | wc -l)
MSG="PRIMARY=$PRIMARY $NBRSTDBY standby"
while read line
do
  IFS='|' read nodeid host port status weight role select_cnt load_balance_node replication_lag <<<$line
  if [ "${status}" == "down" ] ; then
    if [ $STATE -lt $STATE_WARNING ] ; then
      STATE=$STATE_WARNING
    fi
    MSG="$MSG Host $host is down"
    continue
  fi
  in_reco=$(psql -h ${host} -U repmgr repmgr -t -c "select pg_is_in_recovery();")
  if [ "$role" == "primary" ] ; then
    if [ "$in_reco" != " f" ] ; then
      MSG="$MSG ERROR $host is primary but is_in_recovery is $in_reco"
      STATE=$STATE_ERROR
    else
      MSG="$MSG $host $role OK"
      if [ $STATE -lt $STATE_OK ] ; then
        STATE=$STATE_OK
      fi
    fi
    COUNT=$(psql -h ${host} -U repmgr repmgr -t -c "select count(*) from pg_stat_replication;")
    if [ $COUNT -eq $NBRSTDBY ] ; then
      MSG="$MSG streaming to $COUNT stdby"
    else
      STATE=$STATE_ERROR
      MSG="$MSG streaming to $COUNT stdby instead of $NBRSTDBY"
    fi
  fi
  if [ "$role" == "standby" ] ; then
    if [ "$in_reco" != " t" ] ; then
      MSG="$MSG ERROR $host is standby but is_in_recovery is $in_reco"
      STATE="ERROR"
    else
      MSG="$MSG $host $role OK"
      if [ $STATE -lt $STATE_OK ] ; then
        STATE=$STATE_OK
      fi
    fi
    ret=$(is_streaming_from $host $PRIMARY)
    if [ $? -eq 1 ] ; then
      MSG="$MSG $ret"
    else
      MSG"$MSG not streaming from $PRIMARY"
      STATE=$STATE_ERROR
    fi
  fi
done <<< "$(echo "$lines")"
echo STATE=$STATE $MSG
exit $STATE
