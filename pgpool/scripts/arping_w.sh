#!/bin/bash 

echo "Exec arping with params $@ at `date`"
if [ -z $DOCKERHOST ] ; then
  /usr/sbin/arping $@
else
  # we are in a swarm cluster
  ssh root@${DOCKERHOST} -C "/usr/sbin/arping $@"
fi
exit $?

