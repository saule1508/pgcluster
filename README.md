# pg-cluster

Postgres streaming replication with pgpool and/or repmgr for the automated failover and docker swarm for the failover of pgpool. 

The postgres image contains a ssh server, repmgr, postgres (!) and supervisord. Postgres is replicated with streaming replication, repmgr is used because it brings well documented and tested scripts and it adds some metadata about the cluster that ease monitoring. Automatic failover of postgres can be done either by repmgr (repmgrd) or by pgpool. I did not manage to get automatic failover via repmgrd work well with pgpool so the recommandation for now is to use pgpool for automatic failover.

There is a graphical monitoring/operational interface available (written in nodejs / react).

There are two different ways to use those docker images:

* In a docker swarm: in this case there is one pgpool instance running (no watchdog) and it is made high available via swarm. When pgpool starts it rebuilds the node availability (file /tmp/pgpool_status) by looking at repmgr's nodes table. This is not very well tested.

* The more classical pgpool setup in watchdog mode is documented in [pgpool watchdog](doc/pgpoolwatchdog.md). In pgpool watchdog mode there are two nodes, postgres is made HA via streaming replication and pgpool itself is made HA via the watchdog functionality, based on a virtual IP. postgres, pgpool and the monitoring tool all run in docker but not in a swarm.

In both case some ansible scripts are available to automate the deployment on two or three virtual machines (centos 7).

In both case the automatic failover is optional. It can either be done by pgpool or by repmgr (but not both at the same time). If one chose to let repmgrd do the automatic failover (REPMGRD_FAILOVER_MODE=automatic), then pgpool failover_command will be left empty: in this case pgpool will not do the failover when it detects a primary failure but will wait until a new master is promoted (by repmgrd). If repmgrd is responsible for the failover then it is important that the grace period before failover (depends on REPMGRD_RECONNECT_ATTEMPTS and REPMGRD_RECONNECT_INTERVAL env variables passed to the postgres containers) must be shorter than the period defined for PGPOOL (PGPOOL_HEALTH_CHECK_MAX_RETRIES and PGPOOL_HEALTH_CHECK_RETRY_DELAY env variables given to pgpool's container). 

When repmgrd is responsible for the automatic failover, I see two ways to have pgpool notified of actions by repmgrd:

* A script /script/repmgrd_event.sh is hooked in the config of repmgr so that when a repmgrd_failover_promote event occurs the pcp_promote_node command is executed. In this case the flag DISABLE_TO_FAILOVER must be used in pgpool config
* The flag ENABLE_TO_FAILOVER is used in pgpool but the failover_command is left empty; when pgpool detects a primary failure it will search for a new primary until if finds it (because repmgrd did a failover)

both solutions seems to me fragile in unexpected scenarios so that more testing is needed. For now I am using pgpool for automatic failover. In order to have automatic reconfiguration of a failed master or of a failed standby, there is a script /scripts/check_state.sh in the docker image that could be scheduled via cron (cron on the host, executing the script check_state via docker exec in each container)

The rest of this README is for the docker swarm scenario, there is another README for the watchdog mode.

In the swarm, each of the postgres service (pg01 and pg02 and pg03) is sticky to one docker swarm node, this is so because those service are statefull as the data is stored on the host. This stickyness is done via the docker-compose file

```
   deploy:
      placement:
        constraints:
          - node.id == docker_node_x 
```

You must of course replace the value of docker_node_x by the corresponding node id (if you use the ansible scripts it is done for you).


In case pgpool is doing the automatic failover, there is one edge case when both the primary database and pgpool are running on the same swarm node: if this server goes down then docker swarm will start a new instance of pgpool on another node while the primary database will not be restarted (it is sticky to its node). To take care of this case, the entrypoint of pgpool will inspect the repmgr metada - nodes - and promote a standby if the primary database (as indicated by repmgr) is not reachable. Note that if the pgpool service is configured with FAILOVER_MODE=manual (either because repmgrd is responsible for automated failover or because one prefer manual failover - see below) no promotion will take place. To avoid this use case it would be better to force pgpool to run on another node than any of the postgres nodes but of course this implies a bigger cluster size.

There is a manager application, written in nodejs (the front-end is written in react). This small web application on top of pgpool lets visualize the cluster state and will to allow fail-over, switch-over, etc. 

![Pgcluster gui interface](./doc/manager_overview.png?raw=true "GUI for pgcluster")

pgpool can be configured for automatic failover (the default) or not. This is via the FAILOVER_MODE environment variable (auto or manual). If manual then the configuration failover_command is left empty in pgpool.config file, if the master goes down then pgpool will not do the failover script but will simply continuously try to find a new master. Once the promotion is done (manually) then pgpool will be available again. Note that this automatic failover or not can be changed at runtime (change the parameter in pgpool.conf and run pgpool_ctl reload command)

What's worth mentioning and that is specific to docker is that everytime the container is started (postgres container or pgpool container), it is configured again based on the environment variables. So repmgr.conf and pgpool.conf are rebuild, among others. Similarly the file /etc/pgpool-II/pool_passwd is rebuild again, by querying the postgres database. Most important, the file /tmp/pgpool_status must also be re-created based on repmgr and based on if the db's are up or not.

## Run

First build the docker images (see script build.sh)

To run in test one can create a single node swarm and use the docker-compose-test.yml


```
export pg_version=$(cat version.txt)
docker swarm init --advertise-addr=<ip machine>
docker network create --driver=overlay --attachable=true pgcluster_network
docker stack deploy -c docker-compose-test.yml pgcluster
```
you can then go on <ipaddress>:8080 to see the manager GUI. (NB: using localhost or 127.0.0.1 might not work, in this case type the IP of the PC).

To run on a real cluster one can use the scripts in the ansible directory.

In test mode, it is sometimes usefull to stop/start pgpool or the nodejs application in the manager. A trick is is to adapt the docker-compose and add in the pgpool service definition (or the manager) a dummy command like

command: tail -f /etc/passwd

You can then enter the container (with docker exec -ti <container_id> /bin/bash), then stop/start pgpool or nodejs without having the container restarted by swarm.
 

## build

see the script build.sh, it build the image postgres (pg) and the image pgpool and the manager image (the manager image contains both the server and the client app).

## develop client

To develop the manager application, you can start the stack and then, on your workstation start the client application. 

In the package.json of the client one has to set the IP of the server for proxying. For the websocket, it is necessary to give the IP of the server as well

```
cd client
export REACT_APP_SERVERIP=<ip of the server>
yarn start
```

## develop server

Use a docker compose containing two postgres, one pgpool and the manager. In the manager section, maps your source directory from your source desktop
to /opt/manager. Put also a dummy command, like bash, to keep the container running


to change the server part, one can change the docker-compose and put a dummy command for the manager service in order to keep it running

```
command: tail -f /etc/passwd
```

and then get into the manager container with docker exec -ti. One can stop/start the backend manager app with node server.js But before the env variable PG_BACKEND_NODE_LIST must be set.

```
export PG_BACKEND_NODE_LIST=0:pg01:5432:1:/u01/pg10/data:ALLOW_TO_FAILOVER,1:pg02:5432:1:/u01/pg10/data:ALLOW_TO_FAILOVER
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

* PG_BACKEND_NODE_LIST: 0:pg01:9999:1:/u01/pg10/data:ALLOW_TO_FAILOVER, 1:pg02, etc.
                # csv list of backend postgres databases, each backend db contains (separated by :)
                # number (start with 0):host name:pgpool port (default 9999):data dir (default /u01/pg10/data):flag ALLOW_TO_FAILOVER or DISALLOW_TO_FAILOVER
                # not needed when there is a single postgres DB
* PGP_NODE_NAME: pgpool01
* REPMGRPWD: repmgr_pwd (must correspond to the value in postgres of course)
* DELEGATE_IP: 191.168.1.45/24 for example. Only if you want the watchdog mode. Note that this watchdog mode does not make sense inside a docker swarm cluster, it is probably better to use the HA functionality of docker swarm
* DELEGATE_IP_INTERFACE: interface on which the delegate ip (the VIP) will be brought on. Default to eth0
* TRUSTED_SERVERS: 172.23.1.250 When using the watchdog, it helps prevent split-brain. Again not for the normal swarm usage
* PGP_HEARTBEATS: "0:pgpool01:9694,1:pgpool02:9694" When using the watchdog
* PGP_OTHERS: "0:pgpool02:9999" on the first pgpool, "0:pgpool01:9999" on the other pgpool. Only in watchdog mode. 


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

TODO: document scenarios in doc directory
