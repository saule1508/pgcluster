#!/bin/bash

# this will start the postgres container

set -o allexport
source /etc/pgcluster/pgcluster.conf
set +o allexport


docker run -d \
  --privileged
  --net=host \
  -p 5432:5421 \
  -p 222:222 \
  -v /u01/pg10/data:/u01/pg10/data \
  -v /u02/archive:/u02/archive \
  -v /u02/backup:/u02/backup \
  -e MSLIST=${MSLIST} \
  -e MSOWNERPADLIST=${MSOWNERPWDLIST} \
  -e MSUSERPWDLIST=${MSUSERPWDLIST} \
  -e INITIAL_NODE_TYPE=${INITIAL_NODE_TYPE} \
  -e NODE_ID=${NODE_ID} \
  -e ARCHIVELOG=${ARCHIVELOG} \
  -e REPMGRD_FAILOVER_MODE=${REPMGRD_FAILOVER_MODE:-manual} \
  --restart=always \
  --name=pg0${NODE_ID} \
  pg:${pg_version}
