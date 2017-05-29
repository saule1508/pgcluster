#!/bin/sh

if [ ! -d /var/log/evs-pg-utils ] ; then
 sudo mkdir /var/log/evs-pg-utils
 sudo chown postgres:postgres /var/log/evs-pg-utils
fi

LOGFILE=/var/log/evs-pg-utils/ip_w.log
echo "Exec ip with params $@ at `date`" | tee -a ${LOGFILE}
sudo /usr/sbin/ip $@
exit 0
