#!/bin/bash

# this should start the stack in pgpool watchdog mode

#TODO: check if we are on manager node (stack deploy is not allowed on worker node
set -o allexport
source /etc/pgcluster/pgcluster.conf
source /etc/pgwatchdog/pgwatchdog.conf
set +o allexport

NETWORK_NAME="pgcluster_network"
docker network create --driver overlay $NETWORK_NAME 2> /dev/null
#export DOCKERHOST=$(ifconfig | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{ print $2 }' | cut -f2 -d: | head -1)
export DOCKERHOST=$(ip addr show dev docker0 | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{ print $2 }' | cut -f2 -d: | head -1 | cut -f1 -d"/")
docker stack deploy -c /opt/pgcluster/docker-compose-watchdog.yml pgcluster
