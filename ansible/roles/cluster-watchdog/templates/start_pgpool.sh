#!/bin/bash

# this will start the pgpool container

set -o allexport
source /etc/pgwatchdog/pgwatchdog.conf
set +o allexport

docker run -d \
  --privileged \
  --net=host \
  --log-driver=journald --log-opt tag=pgpool \
  -p 9999:9999 \
  -v /tmp:/tmp \
  -e PG_BACKEND_NODE_LIST=${PG_BACKEND_NODE_LIST} \
  -e PGP_NODE_NAME=${PGP_NODE_NAME} \
  -e DELEGATE_IP=${DELEGATE_IP} \
  -e DELEGATE_IP_INTERFACE=${DELEGATE_IP_INTERFACE} \
  -e TRUSTED_SERVERS=${TRUSTED_SERVERS} \
  -e PGP_HEARTBEATS=${PGP_HEARTBEATS} \
  -e PGP_OTHERS=${PGP_OTHERS} \
  -e REPMGRDPWD=${REPMGRDPWD:-rep123} \
  -e FAILOVER_MODE=${PGPOOL_FAILOVER_MODE:-automatic} \
  -e PGPOOL_LOAD_BALANCE_MODE=off \
  -e PGPOOL_FAIL_OVER_ON_BACKEND_ERROR=off \
  -e PGPOOL_HEALTH_CHECK_PERIOD=10 \
  -e PGPOOL_HEALTH_CHECK_INTERVAL=1 \
  -e PGPOOL_HEALTH_CHECK_MAX_RETRY=3 \
  --restart=always \
  --name=pgpool0${NODE_ID} \
  {{ docker_url }}pgpool:{{ images.pgpool.tag }}
