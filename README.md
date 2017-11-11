# cl-pg-cluster
Postgres database 10 on Centos 7.4 with streaming replication. The postgres image contains a ssh server, repmgr and supervisord. Postgres is replicated with streaming replication and repmgr on top of it.

This set-up is designed for a docker swarm: therefore there is one pgpool instance running (no watchdog) and it is made high available via swarm. When pgpool starts it rebuilds the node availability (file /tmp/pgpool_status) by looking at repmgr's repl_nodes table. 

One hedge case is when both the master and pgpool are running on the same swarm node: if this node goes down then pgpool will be restarted on another node but the old master will not be restarted (it is sticky to its node). To take care of this case, the entrypoint of pgpool will inspect the repl_nodes table and promote a standby if the master (as indicated by repmgr) is not reachable.

There is a manager application, written in nodejs (the front-end is written in react). This small web application on top of pgpool lets visualize the cluster state and will to allow fail-over, switch-over, etc. 

What's worth mentioning and that is specific to docker is that everytime the container is started (postgres container or pgpool container), it is configured again based on the environment variables. So repmgr.conf and pgpool.conf are rebuild, among others. Similarly the file /etc/pgpool-II/pool_passwd is rebuild again, by querying the postgres database. Most important, the file /tmp/pgpool_status must also be re-created based on repmgr and based on if the db's are up or not.

To test it is best to make a swarm, even with one single node, and use the docker-compose files provided.

if one want to play with the pgpool container, to experiment, a good trick is to adapt the docker-compose and add in the pgpool definition a dummy command like

command: tail -f /etc/passwd

and then you can enter in the container (with docker exec -ti) and stop/start pgpool without having the container restarted by swarm.


## build

see the script build.sh, it build the image postgres (pg) and the image pgpool and the manager image (the manager image contains both the server and the client app).

## run 

It is easy to make a swarm and then start the containers with docker compose. To make a multi-nodes swarm one can use the ansible scripts in directory ansible (to be documented)

```
docker network create --driver=overlay --attachable pgcluster_network
docker stack deploy -c docker-compose.yml pgcluster
```

wait that all services are running

```
watch docker service ls
```

The GUI is available on port 8080


The entrypoint of the docker image is entrypoint.sh. This script calls initdb.sh (directory bootstrap). initdb.sh tests if the file $PGDATA/postgresql.conf exists, and if not it creates the database with the users corresponding to MSLIST. For each micro-service in the list, a _owner and _user user are created. passwords can be given via MSOWNERPWDLIST and MSUSERPWDLIST

## develop

To develop the manager application, you can start the stack and then, on your workstation start the client application. 

In the package.json of the client one has to set the IP of the server for proxying. For the websocket, it is necessary to give the IP of the server as well

```
cd client
export REACT_APP_SERVERIP=<ip of the server>
yarn start
```

to change the server part, one can change the docker-compose and put a dummy command for the manager service in order to keep it running

```
command: tail -f /etc/passwd
```

and then get into the manager container with docker exec -ti. One can stop/start the backend manager app with node server.js But before the env variable PG_BACKEND_NODE_LIST must be set.

```
export PG_BACKEND_NODE_LIST=0:pg01:5432:1:/u01/pg96/data:ALLOW_TO_FAILOVER,1:pg02:5432:1:/u01/pg96/data:ALLOW_TO_FAILOVER
export REPMGRPWD=rep123

cd /opt/manager/server
npm start
```

after that start the client application (react application build using create-react-app)

```
cd /Users/pierre/git/pgcluster/manager/client
export REACT_APP_SERVERIP=<ip server>
yarn npm start
```
don't forget to adapt package.json for the proxying of API calls to the backend.


### get inside the container

you can exec a shell in the container to look around

```
docker exec -ti pgpool01 /bin/bash
```
you can also ssh into the container

## run pgpool

When the container starts the configuration /etc/pgpool-II/pgpool.conf is build based on environment variables passed in the run command.

pgpool can also be used in the traditional active/passive node, i.e. the watchdog mode. But then one must exclude the two containers from the swarm, or one must make two different pgpool services and make each  sticky to one node.

The following environment variables are important to properly set-up pgpool

* PGMASTER_NODE_NAME: pg01. Node name of the postgres database. Needed so that the container can query the list of users and build the pool_passwd list
* PG_BACKEND_NODE_LIST: 0:pg01:9999:1:/u01/pg96/data:ALLOW_TO_FAILOVER, 1:pg02, etc.
                # csv list of backend postgres databases, each backend db contains (separated by :)
                # number (start with 0):host name:pgpool port (default 9999):data dir (default /u01/pg96/data):flag ALLOW_TO_FAILOVER or DISALLOW_TO_FAILOVER
                # not needed when there is a single postgres DB
* PGP_NODE_NAME: pgpool01
* REPMGRPWD: repmgr_pwd (must correspond to the value in postgres of course)
* DELEGATE_IP: 172.18.0.100 Only if you want the watchdog mode. Note that this watchdog mode does not make a lot of sense inside docker, it is probably better to use the HA functionality of docker swarm
* TRUSTED_SERVERS: 172.23.1.250 When using the watchdog, it helps prevent split-brain. Again not for the normal swarm usage
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

if pgpool failovers on his own (for example it was running on a different node than any of the two postgres) then there is no issue at all. If pgpool fails and it was on the same node as the slave, then there is no problem either: pgpool will be restarted on another node and the slave will remains down.

some tests done

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


To solve this issue, I have added logic to the entrypoint script of pgpool. It detects if the master (as seen in repmgr's repl_nodes table) is down and in this case it promotes the first standby. The old master is then marked down in pgpool_status.








