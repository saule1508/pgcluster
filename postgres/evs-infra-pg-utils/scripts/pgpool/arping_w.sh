echo "Exec arping with params $@ at `date`" >> /opt/evs-infra-utils/logs/arping_w.log
sudo /usr/sbin/arping $@
exit

