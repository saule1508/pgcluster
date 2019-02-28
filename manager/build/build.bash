#!/bin/sh
#set -x
# DOCKER_REGISTRY=192.168.1.57:5000
unset DOCKER_REGISTRY

THISDIR=`pwd`
NOCACHE=true
APPNAME=manager

VERSION=$( cat ../../version.txt )
echo version is $VERSION
rm -rf server client 2>/dev/null
cp -r ../server ./
cp -r ../client ./
rm -rf client/node_modules server/node_modules
docker build --no-cache=${NOCACHE} --file Dockerfile -t ${APPNAME}:${VERSION} .
if [ $? -eq 0 ] && [ ! -z $DOCKER_REGISTRY ] ;  then
 docker tag ${APPNAME}:${VERSION} $DOCKER_REGISTRY/${APPNAME}:${VERSION}
 docker push $DOCKER_REGISTRY/${APPNAME}:${VERSION}
fi
rm -rf server client 2>/dev/null
