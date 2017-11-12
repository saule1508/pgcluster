## failover

pg01 is master, pg02 is slave

Stop pg01:
Pierres-MBP:n1 pierre$ docker exec -ti --user postgres pgcluster_pg01_1 /bin/bash
[postgres@704104e563b1 /]$ pg_ctl status
pg_ctl: server is running (PID: 53)
/usr/pgsql-9.6/bin/postgres "-D" "/u01/pg96/data"
[postgres@704104e563b1 /]$ pg_ctl stop

failover script is executed

repmgr=# select * from repl_nodes;
 id |  type  | upstream_node_id | cluster | name |                      conninfo                       |   slot_name   | priority | active 
----+--------+------------------+---------+------+-----------------------------------------------------+---------------+----------+--------
  1 | master |                  | phoenix | pg01 | host=pg01 dbname=repmgr user=repmgr password=rep123 | repmgr_slot_1 |      100 | f
  2 | master |                  | phoenix | pg02 | host=pg02 dbname=repmgr user=repmgr password=rep123 | repmgr_slot_2 |      100 | t
(2 rows)

## manual failover

Set search_primary_node_timeout = 0 and failover_command=''
