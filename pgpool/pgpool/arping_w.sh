if [ ! -d /var/log/evs-pg-utils ] ; then
 sudo mkdir /var/log/evs-pg-utils
 sudo chown postgres:postgres /var/log/evs-pg-utils
fi
LOGFILE=/var/log/evs-pg-utils/arping_w.log

echo "Exec arping with params $@ at `date`" | tee -a $LOGFILE
sudo /usr/sbin/arping $@
exit

