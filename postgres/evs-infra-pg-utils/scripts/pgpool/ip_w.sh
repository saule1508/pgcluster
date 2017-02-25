#!/bin/sh

echo "Exec ip with params $@ at `date`" >> /opt/evs-infra-utils/logs/ip_w.log
sudo /usr/sbin/ip $@
exit 0
