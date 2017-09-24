#!/bin/bash
#set -x

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
sudo docker build --no-cache=${NOCACHE} --file Dockerfile -t ${APPNAME}:${VERSION} .
rm -rf server client 2>/dev/null
exit
if [ $? -eq 0 ] ;  then
 sudo docker tag ${APPNAME}:${VERSION} localhost:5000/${APPNAME}:${VERSION}
fi
