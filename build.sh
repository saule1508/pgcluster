#!/bin/bash

DOCKER_REGISTRY=192.168.1.57:5000
VER=`cat version.txt`

# remove volumes so we start from scratch
docker volume ls | grep pgcluster | awk '{print $2}' | xargs docker volume rm
docker build -t pg:${VER} --no-cache=false -f postgres/Dockerfile ./postgres
if [ $? -eq 0 ] ; then
 echo pushing to local registry
 docker tag pg:$VER $DOCKER_REGISTRY/pg:$VER
 docker push $DOCKER_REGISTRY/pg:$VER
fi
docker build -t pgpool:${VER} -f pgpool/Dockerfile ./pgpool
if [ $? -eq 0 ] ; then
 echo pushing to local registry
 docker tag pgpool:$VER $DOCKER_REGISTRY/pgpool:$VER
 docker push $DOCKER_REGISTRY/pgpool:$VER
fi
thisdir=$(pwd)
cd manager/build
./build.bash
cd $thisdir
cd test_services/nodejs-dbinserter/
./build.bash
cd $thisdir
