[postgres@a2f85447505e ~]$ pcp_node_info -h pgpool -p 9898 -w 0 -v
Hostname   : pg01
Port       : 5432
Status     : 3
Weight     : 0.333333
Status Name: down
Role       : standby

postgres@a2f85447505e ~]$ psql -h pgpool -p 9999 -U repmgr -c "select * from nodes;"
 node_id | upstream_node_id | active | node_name |  type   | location | priority |                               conninfo                                | repluser |   slot_name   |        config_file
---------+------------------+--------+-----------+---------+----------+----------+-----------------------------------------------------------------------+----------+---------------+----------------------------
       1 |                  | f      | pg01      | primary | default  |      100 | host=pg01 dbname=repmgr user=repmgr password=rep123 connect_timeout=2 | repmgr   | repmgr_slot_1 | /etc/repmgr/10/repmgr.conf
       2 |                  | t      | pg02      | primary | default  |      100 | host=pg02 dbname=repmgr user=repmgr password=rep123 connect_timeout=2 | repmgr   | repmgr_slot_2 | /etc/repmgr/10/repmgr.conf
       3 |                2 | t      | pg03      | standby | default  |      100 | host=pg03 dbname=repmgr user=repmgr password=rep123 connect_timeout=2 | repmgr   | repmgr_slot_3 | /etc/repmgr/10/repmgr.conf

[postgres@a2f85447505e ~]$ psql -h pg01 -U repmgr -c "select pg_is_in_recovery()"
 pg_is_in_recovery
-------------------
 f
(1 row)

if (
pgpool status = down and pgpool role = standby
  and repmgr_active = f and repmgr_type = primary and is_in_recovery = false ) then
 it is a degenerated master
 
)

[postgres@a2f85447505e ~]$ psql -h pgpool -p 9999 -U repmgr -c "show pool_nodes;"
 node_id | hostname | port | status | lb_weight |  role   | select_cnt | load_balance_node | replication_delay
---------+----------+------+--------+-----------+---------+------------+-------------------+-------------------
 0       | pg01     | 5432 | down   | 0.333333  | standby | 394        | false             | 0
 1       | pg02     | 5432 | up     | 0.333333  | primary | 433        | true              | 0
 2       | pg03     | 5432 | up     | 0.333333  | standby | 17         | false             | 0

there is a primary: pg02

[postgres@a2f85447505e ~]$ psql -h pg02  -U repmgr -c "select pg_is_in_recovery();"
 pg_is_in_recovery
-------------------
 f
(1 row)

the primary is *not* in recovery

==> perform pcp_node_recovery or node rejoin



