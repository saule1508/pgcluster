#!/bin/bash

# this will start the manager container

set -o allexport
source /etc/pgwatchdog/pgwatchdog.conf
set +o allexport

docker run -d \
  --privileged
  --net=host \
  -p 8080:8080 \
  -e PG_BACKEND_NODE_LIST=${PG_BACKEND_NODE_LIST}
  -e REPMGRDPWD=${REPMGRDPWD:-rep123} \
  --restart=always \
  --name=manager \
  {{ docker_url }}manager:{{ images.manager.tag }}
