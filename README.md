# cl-pg-cluster
Postgres database 9.6 on Centos 7.3 with streaming replication. The postgres image will contain a ssh server, repmgr and supervisord (there is a variant with systemd)

There is one pgpool; it works also with two pgpool in watch dog mode but since this set-up is targeted at a docker swarm cluster the normal case will be one pgpool container running which will be failed-over by swarm when needed.

There is a manager application, written in nodejs (the front-end is written in react). this small web application on top of pgpool let visualize the cluster state and will to allow fail-over, switch-over, etc. this is completly WIP for now. The backend will be nodejs with websocket and the front-end React+Redux. I will also make an electron app. 

What's worth mentioning that is specific to docker is that everytime the container is started (postgres container or pgpool container), it is configured again based on the environment variables (i.e. /etc/repmgr/9.6/repmgr.conf and /etc/pgpool-II/pgpool.conf are rebuild, among others). Similarly the file /etc/pgpool-II/pool_passwd is rebuild again, by querying the postgres database).

There are various instances of docker-compose files, to test various test cases. docker-compose files are convenient to set all env variables.

** this is WIP: the end result will be 1 master, 2 slaves (with repmgr) and 2 pgpool **

I don't have time to work on it now. However in the coming months I will have to do it for work and so will get time...

## build

see the script build.sh, it build the image postgres (pg) and the image pgpool and the manager image (the manager image contains both the server and the client app).

## run 

It is easy to start the containers with docker compose. For production one will need to use docker in swarm mode but to test on a single machine docker compose is perfect.

```
docker-compose up
```

The entrypoint of the docker image is entrypoint.sh. This script calls initdb.sh (directory bootstrap). initdb.sh tests if the file $PGDATA/postgresql.conf exists, and if not it creates the database with the users corresponding to MSLIST. For each micro-service in the list, a _owner and _user user are created. passwords can be given via MSOWNERPWDLIST and MSUSERPWDLIST

## develop

To develop the manager application, one should first run pg01, pg02 and pgpool01 via a docker-compose (remove the manager from docker-compose.yml).
```
docker-compose -f docker-compose-nomanager.yml up
```

Then start a nodejs container linked to the network of the compose above and with the sources host mounted, for example on my set-up

```
docker run -ti -v /Users/pierre/git/pgcluster/manager:/sources -v /var/run/docker.sock:/var/run/docker.sock \
  -p 8080:8080 --network=pgcluster_default --name manager manager:0.1.2 /bin/bash
```

once in the container

```
export PG_BACKEND_NODE_LIST=0:pg01:5432:1:/u01/pg96/data:ALLOW_TO_FAILOVER,1:pg02:5432:1:/u01/pg96/data:ALLOW_TO_FAILOVER
export REPMGRPWD=rep123

cd /sources/server
npm start
```

after that start the client application (react application build using create-react-app)

```
cd /Users/pierre/git/pgcluster/manager/client
npm start
```



### get inside the container

you can exec a shell in the container to look around

```
docker exec -ti pgpool01 /bin/bash
```
you can also ssh into the container

## run pgpool

When the container starts the configuration /etc/pgpool-II/pgpool.conf is build based on environment variables passed in the run command.

The following environment variables are important to properly set-up pgpool


* PGMASTER_NODE_NAME: pg01. Node name of the postgres database. Needed so that the container can query the list of users and build the pool_passwd list
* PG_BACKEND_NODE_LIST: 0:pg01:9999:1:/u01/pg96/data:ALLOW_TO_FAILOVER, 1:pg02, etc.
                # csv list of backend postgres databases, each backend db contains (separated by :)
                # number (start with 0):host name:pgpool port (default 9999):data dir (default /u01/pg96/data):flag ALLOW_TO_FAILOVER or DISALLOW_TO_FAILOVER
                # not needed when there is a single postgres DB
* PGP_NODE_NAME: pgpool01
* REPMGRPWD: repmgr_pwd (must correspond to the value in postgres of course)
* DELEGATE_IP: 172.18.0.100 Only if you want the watchdog mode. Note that this watchdog mode does not make a lot of sense inside docker, it is probably better to use the HA functionality of docker swarm
* TRUSTED_SERVERS: 172.23.1.250 When using the watchdog, it helps prevent split-brain
* PGP_HEARTBEATS: "0:pgpool01:9694,1:pgpool02:9694" When using the watchdog
* PGP_OTHERS: "0:pgpool02:9999" The other pgpool nodes, needed for the configuration


## users and passords

* the users are created via the script initdb.sh, have a look at it.
* postgres unix user has uid 50010

# use cases and scenarios


## failover

Stop the master database -> pgpool will execute the script failover.sh on the surviving node, the slave gets promoted and becomes the new master. The old master will be detached from pgpool and will be marked as inactive in repmgr repl_node table.

```
repmgr=# select * from repl_nodes;
 id |  type  | upstream_node_id | cluster | name |                      conninfo                       |   slot_name   | priority | active 
----+--------+------------------+---------+------+-----------------------------------------------------+---------------+----------+--------
  1 | master |                  | phoenix | pg01 | host=pg01 dbname=repmgr user=repmgr password=rep123 | repmgr_slot_1 |      100 | f
  2 | master |                  | phoenix | pg02 | host=pg02 dbname=repmgr user=repmgr password=rep123 | repmgr_slot_2 |      100 | t
(2 rows)

```

### failover pgpool

stop pgpool

set search_primary_node_timeout=30

stop master database (pg02): pg01 is up, repmgr standby pg02 is up repmgr master both active in repl_nodes

start pgpool: /tmp/pgpool_status up up (because both actives in repl_nodes) -> after 30 seconds failover is executed but this does nothing, because the falling node (1) is not the old primary id so it looks like the slave is failing and not the master.

2017-11-11 12:29:57: pid 144: LOG:  failed to connect to PostgreSQL server on "pg02:5432", getsockopt() detected error "Connection refused"
2017-11-11 12:29:57: pid 144: LOCATION:  pool_connection_pool.c:660
2017-11-11 12:29:57: pid 144: ERROR:  failed to make persistent db connection
2017-11-11 12:29:57: pid 144: DETAIL:  connection to host:"pg02:5432" failed
2017-11-11 12:29:57: pid 144: LOCATION:  child.c:1224
2017-11-11 12:29:57: pid 144: LOG:  setting backend node 1 status to NODE DOWN
2017-11-11 12:29:57: pid 144: LOCATION:  pgpool_main.c:600
2017-11-11 12:29:57: pid 144: LOG:  received degenerate backend request for node_id: 1 from pid [144]
2017-11-11 12:29:57: pid 144: LOCATION:  pgpool_main.c:1202
2017-11-11 12:29:57: pid 144: LOG:  starting degeneration. shutdown host pg02(5432)
2017-11-11 12:29:57: pid 144: LOCATION:  pgpool_main.c:1814
2017-11-11 12:29:57: pid 144: LOG:  Do not restart children because we are switching over node id 1 host: pg02 port: 5432 and we are in streaming replication mode
2017-11-11 12:29:57: pid 144: LOCATION:  pgpool_main.c:1888
2017-11-11 12:29:57: pid 144: LOG:  execute command: /opt/scripts/failover.sh  1 pg02 0 0 pg01 /u01/pg10/data
2017-11-11 12:29:57: pid 144: LOCATION:  pgpool_main.c:2877
Sat Nov 11 12:29:58 UTC 2017
FALLING_NODE: 1
FALLING_HOST: pg02
OLD_PRIMARY_ID: 0
NEW_PRIMARY_ID: 0
NEW_PRIMARY_HOST: pg01
NEW_MASTER_PGDATA: pg01
+ '[' 1 = 0 ']'
+ exit 0
2017-11-11 12:29:58: pid 144: LOG:  failover: no follow backends are degenerated
2017-11-11 12:29:58: pid 144: LOCATION:  pgpool_main.c:2033
2017-11-11 12:29:58: pid 144: LOG:  failover: set new primary node: -1
2017-11-11 12:29:58: pid 144: LOCATION:  pgpool_main.c:2067
2017-11-11 12:29:58: pid 144: LOG:  failover: set new master node: 0
2017-11-11 12:29:58: pid 144: LOCATION:  pgpool_main.c:2073
failover done. shutdown host pg02(5432)2017-11-11 12:29:58: pid 144: LOG:  failover done. shutdown host pg02(5432)
2017-11-11 12:29:58: pid 144: LOCATION:  pgpool_main.c:2177
2017-11-11 12:29:58: pid 208: LOG:  worker process received restart request
2017-11-11 12:29:58: pid 208: LOCATION:  pool_worker_child.c:154
2017-11-11 12:29:59: pid 207: LOG:  restart request received in pcp child process
2017-11-11 12:29:59: pid 207: LOCATION:  pcp_child.c:150
2017-11-11 12:29:59: pid 144: LOG:  PCP child 207 exits with status 0 in failover()
2017-11-11 12:29:59: pid 144: LOCATION:  pgpool_main.c:2219
2017-11-11 12:29:59: pid 144: LOG:  fork a new PCP child pid 217 in failover()
2017-11-11 12:29:59: pid 144: LOCATION:  pgpool_main.c:2223
2017-11-11 12:29:59: pid 144: LOG:  pgpool-II successfully started. version 3.6.6 (subaruboshi)
2017-11-11 12:29:59: pid 144: LOCATION:  pgpool_main.c:481
2017-11-11 12:29:59: pid 144: LOG:  worker child process with pid: 208 exits with status 256
2017-11-11 12:29:59: pid 144: LOCATION:  pgpool_main.c:2468
2017-11-11 12:29:59: pid 144: LOG:  fork a new worker child process with pid: 218
2017-11-11 12:29:59: pid 144: LOCATION:  pgpool_main.c:2554
2017-11-11 12:31:29: pid 153: LOG:  failback event detected
2017-11-11 12:31:29: pid 153: DETAIL:  restarting myself
2017-11-11 12:31:29: pid 153: LOCATION:  child.c:1843
2017-11-11 12:31:29: pid 144: LOG:  child process with pid: 153 exits with status 256
2017-11-11 12:31:29: pid 144: LOCATION:  pgpool_main.c:2468
2017-11-11 12:31:29: pid 144: LOG:  fork a new child process with pid: 219
2017-11-11 12:31:29: pid 144: LOCATION:  pgpool_main.c:2554
2017-11-11 12:31:30: pid 198: LOG:  new connection received
2017-11-11 12:31:30: pid 198: DETAIL:  connecting host=pgcluster_manager.1.jbs4f7cy14wnx7ygejjqu4scs.pgcluster_network port=33204
2017-11-11 12:31:30: pid 198: LOCATION:  child.c:2172
2017-11-11 12:31:30: pid 198: LOG:  selecting backend connection
2017-11-11 12:31:30: pid 198: DETAIL:  failback event detected, discarding existing connections
2017-11-11 12:31:30: pid 198: LOCATION:  child.c:2272
2017-11-11 12:31:50: pid 175: LOG:  failback event detected
2017-11-11 12:31:50: pid 175: DETAIL:  restarting myself
2017-11-11 12:31:50: pid 175: LOCATION:  child.c:1843
2017-11-11 12:31:50: pid 144: LOG:  child process with pid: 175 exits with status 256
2017-11-11 12:31:50: pid 144: LOCATION:  pgpool_main.c:2468
2017-11-11 12:31:50: pid 144: LOG:  fork a new child process with pid: 220
2017-11-11 12:31:50: pid 144: LOCATION:  pgpool_main.c:2554
2017-11-11 12:32:20: pid 184: LOG:  new connection received
2017-11-11 12:32:20: pid 184: DETAIL:  connecting host=10.255.0.2 port=54312
2017-11-11 12:32:20: pid 184: LOCATION:  child.c:2172

Same use case: stop pgpool, stop the master, this case remove the /tmp/pgpool_status --> same issue, failover does nothing because old primary = new primary
So master = pg01, running
   slave = pg02, running
stop pgpool
stop pg01
start pgpool with status up up and search_primary_node_timeout = 30 --> this times it works.

017-11-11 13:04:12: pid 721: LOCATION:  child.c:1224
2017-11-11 13:04:12: pid 721: LOG:  setting backend node 0 status to NODE DOWN
2017-11-11 13:04:12: pid 721: LOCATION:  pgpool_main.c:600
2017-11-11 13:04:12: pid 721: LOG:  received degenerate backend request for node_id: 0 from pid [721]
2017-11-11 13:04:12: pid 721: LOCATION:  pgpool_main.c:1202
2017-11-11 13:04:12: pid 721: LOG:  starting degeneration. shutdown host pg01(5432)
2017-11-11 13:04:12: pid 721: LOCATION:  pgpool_main.c:1814
2017-11-11 13:04:12: pid 721: LOG:  Restart all children
2017-11-11 13:04:12: pid 721: LOCATION:  pgpool_main.c:1930
2017-11-11 13:04:12: pid 721: LOG:  execute command: /opt/scripts/failover.sh  0 pg01 0 1 pg02 /u01/pg10/data
2017-11-11 13:04:12: pid 721: LOCATION:  pgpool_main.c:2877
Sat Nov 11 13:04:12 UTC 2017
FALLING_NODE: 0
FALLING_HOST: pg01
OLD_PRIMARY_ID: 0
NEW_PRIMARY_ID: 1
NEW_PRIMARY_HOST: pg02
NEW_MASTER_PGDATA: pg02
+ '[' 0 = 0 ']'
+ ssh -n -T -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no postgres@pg02 '/usr/pgsql-10/bin/repmgr --log-to-file -f /etc/repmgr/10/repmgr.conf standby promote -v '
[2017-11-11 13:04:12] [NOTICE] using configuration file "/etc/repmgr/10/repmgr.conf"
[2017-11-11 13:04:12] [NOTICE] Redirecting logging output to '/var/log/repmgr/repmgr.log'
waiting for server to promote.... done
server promoted
+ exit 0
2017-11-11 13:04:13: pid 721: LOG:  failover: no follow backends are degenerated
2017-11-11 13:04:13: pid 721: LOCATION:  pgpool_main.c:2033
2017-11-11 13:04:13: pid 721: LOG:  failover: set new primary node: -1
2017-11-11 13:04:13: pid 721: LOCATION:  pgpool_main.c:2067
2017-11-11 13:04:13: pid 721: LOG:  failover: set new master node: 1


Important note: some processes cannot connect, pgpool would have done a failover if it was not for fail_over_on_backend_error !!!
2017-11-11 13:03:40: pid 782: DETAIL:  connecting host=pgcluster_manager.1.jbs4f7cy14wnx7ygejjqu4scs.pgcluster_network port=35376
2017-11-11 13:03:40: pid 782: LOCATION:  child.c:2172
2017-11-11 13:03:40: pid 782: LOG:  failed to connect to PostgreSQL server on "pg01:5432", getsockopt() detected error "Connection refused"
2017-11-11 13:03:40: pid 782: LOCATION:  pool_connection_pool.c:660
2017-11-11 13:03:40: pid 782: FATAL:  failed to create a backend 0 connection
2017-11-11 13:03:40: pid 782: DETAIL:  not executing failover because fail_over_on_backend_error is off
2017-11-11 13:03:40: pid 782: LOCATION:  pool_connection_pool.c:878
2017-11-11 13:03:40: pid 721: LOG:  child process with pid: 782 exits with status 256
2017-11-11 13:03:40: pid 721: LOCATION:  pgpool_main.c:2468
2017-11-11 13:03:40: pid 721: LOG:  fork a new child process with pid: 784
2017-11-11 13:03:40: pid 721: LOCATION:  pgpool_main.c:2554

let's try the same but this time set pool_status to up/down
stop pgpool, stop the master, this case remove the /tmp/pgpool_status --> same issue, failover does nothing because old primary = new primary
So master = pg02, running
   slave = pg01, running
stop pgpool
stop pg02
in pool_status, set up down
in this case nothing happens, pg02 is marked down and pg01 is up but slave









