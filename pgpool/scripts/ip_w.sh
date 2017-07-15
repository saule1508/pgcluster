#!/bin/sh

if [ ! -d /var/log/pg ] ; then
 sudo mkdir /var/log/pg
 sudo chown postgres:postgres /var/log/pg
fi

LOGFILE=/var/log/pg/ip_w.log
echo "Exec ip with params $@ at `date`" | tee -a ${LOGFILE}
sudo /usr/sbin/ip $@
exit 0
