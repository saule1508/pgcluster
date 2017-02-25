source /etc/evs-infra-pg-utils.conf

is_primary(){
  str=`psql -q postgres <<EOF | grep -v "^$" | sed -e "s/ //g"
\t
select pg_is_in_recovery();
EOF`
  if [[ $str == "t" ]] ; then
   return 0;
  else
   return 1;
  fi
}

get_db_role(){
 is_primary
 if [ $? -eq 1 ] ; then
   echo "PRIMARY"
 else
   echo "STANDBY"
 fi
}
