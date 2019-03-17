#!/bin/sh

docker volume ls | grep pgcluster | awk '{print $2}' | xargs docker volume rm
docker volume ls | grep pgcluster
if [ $? -eq 0 ] ; then
  echo "some volumes not removed...remove exited containers"
  docker ps  --filter="status=exited" | grep pgcluster | awk '{print $1}' | xargs docker rm
  echo sleep 5
  sleep 5
  docker volume ls | grep pgcluster | awk '{print $2}' | xargs docker volume rm
fi
docker volume ls | grep pgcluster
if [ $? -eq 0 ] ; then
  echo "some volumes not removed...sorry"
  exit 1
fi
exit 0
