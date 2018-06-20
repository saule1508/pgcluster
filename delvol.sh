#!/bin/sh

docker volume ls | grep pgcluster | awk '{print $2}' | xargs docker volume rm
