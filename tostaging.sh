#!/bin/bash

STAGE_DIR=/data1/staging
VER=$(cat version.txt)
sudo docker save --output=$STAGE_DIR/pg.$VER.tar pg:$VER
sudo docker save --output=$STAGE_DIR/pgpool.$VER.tar pgpool:$VER
ID=$(sudo docker images -q pg:$VER | head -1)
cat <<EOF > $STAGE_DIR/content.yml
postgres:
  name: pg
  tag: $VER
  file: pg.$VER.tar
  id: $ID
EOF
ID=$(sudo docker images -q pgpool:$VER | head -1)
cat <<EOF >> $STAGE_DIR/content.yml
pgpool:
  name: pgpool
  tag: $VER
  file: pgpool.$VER.tar
  id: $ID
EOF
VER=$(cat manager/version.txt)
sudo docker save --output=$STAGE_DIR/manager.$VER.tar manager:$VER
ID=$(sudo docker images -q manager:$VER | head -1)
cat <<EOF >> $STAGE_DIR/content.yml
manager:
  name: manager
  tag: $VER
  file: manager.$VER.tar
  id: $ID
EOF
sudo chown pierre:pierre /data1/staging/*
sudo chmod 777 /data1/staging/*
