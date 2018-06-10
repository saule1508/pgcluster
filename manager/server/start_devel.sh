#!/bin/sh

docker stack rm pgcluster
sleep 5
docker volume ls | grep pgcluster_ | awk '{print $2}' | xargs docker volume rm
docker stack deploy -c docker-compose-devel.yml pgcluster
