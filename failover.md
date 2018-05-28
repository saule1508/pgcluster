# expericences with failover

experiments made with a docker stack deployed on a single machine. the docker compose files used are in directory pgpool

## failover via pgpool

docker-compose file is docker-compose-testpgpoolfailover.yml (in directory pgpool)

the following parameters are given via env variables to the postgres containers

* REPMGRD_FAILOVER_MODE: manual
* REPMGRD_RECONNECT_ATTEMPS: 5
* REPMGRD_INTERVAL: 1

the following parameters are given via env variables to the pgpool container

* PG_BACKEND_NODE_LIST: 0:pg01:5432:1:/u01/pg10/data:ALLOW_TO_FAILOVER,1:pg02:5432:1:/u01/pg10/data:ALLOW_TO_FAILOVER,2:pg03:5432:1:/u01/pg10/data:ALLOW_TO_FAILOVER
* FAILOVER_MODE: automatic
* PGPOOL_HEALTH_CHECK_PERIOD: 20
* PGPOOL_FAILOVER_ON_BACKEND_ERROR: "no"
* PGPOOL_HEALTH_CHECK_MAX_RETRIES: 5
* PGPOOL_HEALTH_CHECK_RETRY_DELAY: 2

use the script test_pgpool.sh with parameter pgpool to launch the stack and perform a few test

```
cd pgpool
./test_pgpool.sh pgpool
```

you can go on 127.0.0.1:8080 to see graphically what is going on (you might need to replace 127.0.0.1 by the IP of your PC)

### use case: lost of a standby

stop standby database pg03 (clean shutdown)

repmgr detects db down (event: standby_failure) and set to inactive, pgpool detects db down and execute failover => db is detached from pool

start it again

repmgr detects it is up (event : standby_recovery) and set to active. pgpool does nothing. We could re-attach the db via the event of repmgrd.






