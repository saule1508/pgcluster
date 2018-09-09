#!/bin/bash

STATE_OK=0
STATE_WARNING=1
STATE_ERROR=2
STATE_UNKNOWN=3

STATE=0
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

psql -U repmgr -h pgpool -p 9999 -t -c "show pool_nodes;" > /tmp/pool_nodes.tmp
if [ $? -ne 0 ] ; then
  echo "Cannot connect to pgpool"
  exit $STATE_ERROR
fi
lines=$(cat /tmp/pool_nodes.tmp | grep -v "^$" | sed -e "s/ //g")
echo $lines | grep -q FATAL
if [ $? -eq 0 ] ; then
  echo $lines
  exit $STATE_ERROR
fi
PRIMARY=$(echo "$lines" | grep primary | cut -f2 -d"|")
NBRSTDBY=$(echo "$lines" | grep standby | wc -l)
if [ $NBRSTDBY -eq 0 ] ; then
  echo "No database replication"
  exit $STATE_OK
fi
if [ $NBRSTDBY -eq 1 ] ; then
  MSG="PRIMARY database is $PRIMARY with $NBRSTDBY standby database - "
fi
if [ $NBRSTDBY -gt 1 ] ; then
  MSG="PRIMARY database is $PRIMARY with $NBRSTDBY standby databases - "
fi
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
    fi
    COUNT=$(psql -h ${host} -U repmgr repmgr -t -c "select count(*) from pg_stat_replication;" | sed -e "s/ //g")
    if [ $COUNT -eq $NBRSTDBY ] ; then
      MSG="$MSG ($COUNT downstream nodes)"
    else
      STATE=$STATE_ERROR
      MSG="$MSG ($COUNT downstream nodes, expected $NBRSTDBY)"
    fi
    str=$(psql -h ${host} -U repmgr repmgr -t -c "select string_agg(t.streaming,',') from (select state||' to '||application_name||' lag '||coalesce(write_lag,'0')  as streaming from pg_stat_replication) t;")
    MSG="$MSG $str"
  fi
  if [ "$role" == "standby" ] ; then
    if [ "$in_reco" != " t" ] ; then
      MSG="$MSG ERROR $host is standby but is_in_recovery is $in_reco"
      STATE=$STATE_ERROR
    else
      MSG="$MSG $host $role OK"
    fi
    ret=$(is_streaming_from $host $PRIMARY)
    if [ $? -eq 1 ] ; then
      MSG="$MSG $ret"
    else
      MSG="$MSG not streaming from $PRIMARY"
      STATE=$STATE_ERROR
    fi
  fi
  MSG="$MSG -"
done <<< "$(echo "$lines")"
MSG=$(echo $MSG | sed -e "s/ -$//")
echo $MSG
exit $STATE
