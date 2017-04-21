#!/bin/bash

source /etc/evs/config

# start postgres outside the docker-compose because swarm does not allow privileged container
sudo docker run -d --name pg01 \
  -v /u01/pg96/data:/u01/pg96/data  \
  -v /u02/backup:/u02/backup   \
  -v /u02/archive:/u02/archive \
  -e INITIAL_NODE_TYPE=${INITIAL_NODE_TYPE} \
  -e NODE_ID=${NODE_ID} \
  -e NODE_NAME=${NODE_NAME} \
  -e ARCHIVELOG=0 \
  -e MSLIST=${MSLIST} \
  -p 5432:5432 \
  --privileged=true \
  --network=phoenix_network \
  --label="com.evs.deployment.ansible.role: postgres" \
  registry.docker.evs.tv/evs-phoenix-postgres:0.1.2

