#!/bin/bash
#set -x
DOCKER_REGISTRY=192.168.1.39:5000

THISDIR=`pwd`
NOCACHE=false
APPNAME=manager

BRANCH=${1:-develop}
echo BRANCH is $BRANCH

VERSION=`cat ../version.txt`
echo version is $VERSION
rm -rf server client 2>/dev/null
cp -r ../server ./
cp -r ../client ./
rm -rf client/node_modules server/node_modules
docker build --no-cache=${NOCACHE} --file Dockerfile -t ${APPNAME}:${VERSION} .
if [ $? -eq 0 ] ;  then
 docker tag ${APPNAME}:${VERSION} $DOCKER_REGISTRY/${APPNAME}:${VERSION}
 docker pull $DOCKER_REGISTRY/${APPNAME}:${VERSION}
 
fi
rm -rf server client 2>/dev/null
