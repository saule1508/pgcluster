#!/bin/bash

# this will start the manager container

set -o allexport
source /etc/pgwatchdog/pgwatchdog.conf
set +o allexport

docker run -d \
  --net=host \
  --log-driver=journald --log-opt tag=manager \
  -v /var/run/docker:/var/run/docker \
  -e PG_BACKEND_NODE_LIST=${PG_BACKEND_NODE_LIST} \
  -e REPMGRDPWD=${REPMGRDPWD:-rep123} \
  -e DBHOST=pgpool \
  -e PORT=8080 \
  --restart=always \
  --name=manager \
  {{ docker_url }}manager:{{ images.manager.tag }}
