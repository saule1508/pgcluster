# pg-cluster

Postgres streaming replication with pgpool and/or repmgr for the automated failover. The images can be used in docker swarm cluster or via docker run outside the swarm. When running the images in a docker swarm, the HA of pgpool can be either via the traditional pgpool watchdog mode (with a VIP) or via the swarm (but I found too many edge cases in this case). When the docker images are used outside docker swarm then pgpool is made HA via the traditional watchdog mode (with a VIP).

The postgres docker image contains:

* ssh server
* repmgr
* postgres (!)
* supervisord.

Postgres is replicated with streaming replication, repmgr is used because it brings well documented and tested scripts and it adds some metadata about the cluster that ease monitoring. Automatic failover of postgres can be done either by **repmgr** (repmgrd) or by **pgpool**. Both options seem to have some pros and cons. The recommandation for now is to use ***pgpool*** for automatic failover. After much experimentation I have settled for using pgpool in watchdog mode (VIP), even when using docker swarm. There were simply too much edge cases otherwise.

There is a graphical monitoring/operational interface available (written in nodejs / react).

There are two different ways to use those docker images:

1. In docker swarm together with pgpool watchdog. In this case each postgres service (pg01, pg02, pg03) is sticky to a swarm node. The same for each pgpool service (pgpool01, pgpool02, pgpool03). When the system starts, the 3 pgpool will elect a leader and this one will acquire the VIP. Acquiring the VIP in the context of a swarm is a bit strange: the pgpool instance will connect to the host via ssh.

2. The non swarm set-up is closer to a traditional pgpool setup in watchdog mode is documented in [pgpool watchdog](doc/pgpoolwatchdog.md). In this non-swarm pgpool watchdog mode there are two nodes (can be 3), postgres is made HA via streaming replication and pgpool itself is made HA via the watchdog functionality, based on a virtual IP. postgres, pgpool and the monitoring tool all run in docker but *not* in a swarm.

(A third way that I abandonned; a docker swarm with one pgpool instance running (no watchdog) and it is made high available via swarm. When pgpool starts it rebuilds the node availability (file `/tmp/pgpool_status`) by looking at repmgr's nodes table. This is not very well tested and I fount it too difficult.)

In both case some ansible scripts are available to automate the deployment on two or three virtual machines (centos 7). The automatic failover is optional. It can either be done by pgpool or by repmgr (**abandoned** for me see [repmgr failover](doc/repmgr_auto.md)).

The rest of this README is for the docker swarm scenario, there is another README for the non docker swarm mode.

## docker swarm with pgpool watchdog

In the swarm, each of the postgres service (pg01 and pg02 and pg03) is sticky to one docker swarm node, this is so because those service are statefull as the data is stored on the host. This stickyness is done via the docker-compose file

```
   deploy:
      placement:
        constraints:
          - node.id == docker_node_x
```
The same applies to the pgpool services.

You must of course replace the value of docker_node_x by the corresponding node id (if you use the ansible scripts it is done for you).

There is a manager application, written in nodejs (the front-end is written in react). This small web application on top of pgpool lets visualize the cluster state and will to allow fail-over, switch-over, etc.

![Pgcluster gui interface](./doc/manager_overview.png?raw=true "GUI for pgcluster")

What's worth mentioning and that is specific to docker is that everytime the container is started (postgres container or pgpool container), it is configured again based on the environment variables. So `repmgr.conf` and `pgpool.conf` are rebuild, among others. Similarly the file `/etc/pgpool-II/pool_passwd` is rebuild again, by querying the postgres database. Most important, the file `/tmp/pgpool_status` must also be re-created based on repmgr and based on if the db's are up or not.

### Run

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

`entrypoint: tail -f /etc/passwd`

You can then enter the container (with `docker exec -ti <container_id> /bin/bash`), then start manually the node app (node server) or pgpool (see /entrypoint.sh) without having the container restarted by swarm.

### build

see the script `build.sh`, it build the image postgres (pg) and the image pgpool and the manager image (the manager image contains both the server and the client app). To provision a test set-up with ansible you must push the images to a registry (for example on your host PC)

### develop client

To develop the manager application, you can start the stack and then, on your workstation start the client application.

In the `package.json` of the client one has to set the IP of the server for proxying. For the websocket, it is necessary to give the IP of the server as well

```
cd client
export REACT_APP_SERVERIP=<ip of the server>
yarn start
```

### develop server

Use a docker compose containing two postgres, one pgpool and the manager. In the manager section, maps your source directory from your source desktop
to `/opt/manager`. Put also a dummy command, like bash, to keep the container running.

To change the server part, one can change the docker-compose and put a dummy command for the manager service in order to keep it running: `command: tail -f /etc/passwd` and then get into the manager container with `docker exec -ti`. One can stop/start the backend manager app with node `server.js`. But before the env variable PG_BACKEND_NODE_LIST must be set.

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
don't forget to adapt `package.json` for the proxying of API calls to the backend.

#### get inside the container

you can exec a shell in the container to look around (`docker exec -ti pgpool01 /bin/bash`). You can also ssh into the container.

### run pgpool

When the container starts the configuration `/etc/pgpool-II/pgpool.conf` is build based on environment variables passed in the run command.

pgpool can also be used in the traditional active/passive node, i.e. the watchdog mode.

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

Any environment variable prefixed with PGPOOL_ will be injected in the pgpool config file, for example PGPOOL_LOAD_BALANCE_MODE=off will inject load_balance_mode=off in the config.

### database users and passwords

* the users are created via the script initdb.sh, have a look at it.
* the postgres entrypoint creates a DB called phoenix
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
