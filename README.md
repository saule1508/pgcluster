# evs-pg-cluster
Postgres database 9.6 on Centos 7.3 with phoenix database with support for replication. This image will contain a ssh server and systemd (because we'll need multiple service running in the container)

The docker-compose file should be used to set all env variables and start the master and the slave container

** this is WIP: the end result will be 1 master, 2 slaves (with repmgr) and 2 pgpool **

## build

see the script build.sh

## run

The container should be started in detached mode with a bunch of environment variables

docker run -d -p 5432:5432 -v /sys/fs/cgroup:/sys/fs/cgroup --name pg evs-pg-cluster

The entrypoint of the image is the script initdb.sh. This script tests if the file $PGDATA/postgresql.conf exists and if not it creates the phoenix DB with the users. The logic is that if 
you don't mount an existing database onto /u01/pg96/data then a standard phoenix db is created (and it will be deleted when the container is removed)

* Note that it is possible to override initdb.sh, you can mount it with /tmp/initdb.sh (see below)
* The following microservices are initialized by initdb.sh: asset, ingest, playout. You can override this list via the environment variables MSLIST
```
docker run -d -p 543:5432 -v /sys/fs/cgroup:/sys/fs/cgroup --name pg -e "MSLIST=asset,playout,ats" evs-pg-cluster
```
with this MSLIST, the users and scheams asset_owner, playout_owner and ats_owner will be created plus the corresponfing _user accounts.

## example 

* with a host mount. In this case /home/evs/data must be owner by uid 50010 (postgres)

```
docker run -d -p 5432:5432 -v /sys/fs/cgroup:/sys/fs/cgroup -v /home/evs/data:/u01/pg96/data --name pg evs-pg-cluster
```

* without a volume. The database is created inside the container and is lost when the container is removed

```
docker run -d -p 5432:5432 -v /sys/fs/cgroup:/sys/fs/cgroup --name pg evs-pg-cluster
```

* to override the database creation script

```
docker run -v /home/evs/initdb.sh:/tmp/initdb.sh -v /sys/fs/cgroup:/sys/fs/cgroup --name pg -d -p 5432:5432 evs-pg-cluster
```

* with a docker volume (not advised on production)

first create the volume
```
docker create volume --name pg01data
```

then use it in the run command
```
docker run -d -v pg01data:/u01/pg96/data -v /sys/fs/cgroup:/sys/fs/cgroup --name pg01 -p 5432:5432 evs-pg-cluster
```


## get inside the container

you can exec a shell in the container to look around

```
docker exec -ti pg /bin/bash
```

but you can also ssh into the container

you can use the image to run a shell and have the binaries (psql, pg_dump, etc.)
```
docker run -ti --name pgclient --entrypoint=/bin/bash evs-phoenix-postgres
```

## users and passords

* the users are created via the script initdb.sh, have a look at it.(TODO: pwd should be given via ENV)
* postgres unix user has uid 50010
