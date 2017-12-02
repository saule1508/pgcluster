#!/bin/bash

# this will start the pgpool container

set -o allexport
source /etc/pgcluster/pgcluster.conf
set +o allexport

docker run -d \
  --privileged
  --net=host \
  -p 9999:9999 \
  -v /tmp:/tmp \
  -e PG_BACKEND_NODE_LIST=${PG_BACKEND_NODE_LIST}
  -e DELETEGATE_IP=${DELEGATE_IP} \
  -e DELEGATE_IP_INTERFACE=${DELEGATE_IP_INTERFACE} \
  -e TRUSTED_SERVERS=${TRUSTED_SERVERS} \
  -e PGP_HEARBEATS=${PGP_HEARTBEATS} \
  -e PGP_OTHERS=${PGP_OTHERS} \
  -e REPMGRDPWD=${REPMGRDPWD:-rep123} \
  -e FAILOVER_MODE=${PGPOOL_FAILOVER_MODE:-automatic} \
  --restart=always \
  --name=pgpool0${NODE_ID} \
  pgpool:${pgpool_version}
