if [ ! -d /var/log/pg ] ; then
 sudo mkdir /var/log/pg
 sudo chown postgres:postgres /var/log/pg
fi
LOGFILE=/var/log/pg/arping_w.log

echo "Exec arping with params $@ at `date`" | tee -a $LOGFILE
sudo /usr/sbin/arping $@
exit

