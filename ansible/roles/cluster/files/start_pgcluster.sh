#!/bin/bash

# this should start the stack

#TODO: check if we are on manager node (stack deploy is not allowed on worker node
set -o allexport
source /etc/pgcluster/pgcluster.conf
set +o allexport

NETWORK_NAME="phoenix_network"
export HOST_GATEWAY_IP=$(docker network inspect $NETWORK_NAME | jq -r ".[0].IPAM.Config[0].Gateway" | grep -m 1 -o "[0-9.]*" | head -n1)
export DOCKERHOST=$(ifconfig | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{ print $2 }' | cut -f2 -d: | head -1)
docker stack deploy -c /opt/pgcluster/docker-compose.yml phoenix
