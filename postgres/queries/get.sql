select 'pg01',t1.node_id,t1.node_name,t1.type,t1.active
from dblink('host=pg01 password=rep123 user=repmgr dbname=repmgr',
            'select node_id,node_name,type,active from nodes order by node_id') as t1(node_id int,node_name varchar,type varchar,active varchar)
union
select 'pg02',t2.node_id,t2.node_name,t2.type,t2.active
from dblink('host=pg02 password=rep123 user=repmgr dbname=repmgr',
            'select node_id,node_name,type,active from nodes order by node_id') as t2(node_id int,node_name varchar,type varchar,active varchar)
union
select 'pg03',t3.node_id,t3.node_name,t3.type,t3.active
from dblink('host=pg03 password=rep123 user=repmgr dbname=repmgr',
            'select node_id,node_name,type,active from nodes order by node_id') as t3(node_id int,node_name varchar,type varchar,active varchar)

select t1.node_id,t1.node_name,t1.type,t1.active,t2.node_name,t2.type,t2.active
from dblink('host=pg01 password=rep123 user=repmgr dbname=repmgr',
            'select node_id,node_name,type,active from nodes order by node_id') as t1(node_id int,node_name varchar,type varchar,active varchar)
, dblink('host=pg02 password=rep123 user=repmgr dbname=repmgr',
            'select node_id,node_name,type,active from nodes order by node_id') as t2(node_id int,node_name varchar,type varchar,active varchar)
where t1.node_id = t2.node_id


