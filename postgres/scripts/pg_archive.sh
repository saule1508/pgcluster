#!/bin/bash

#Author: Me
#Desc. super important script which is refered to by the archive_command
# it should copy over the archive to a destination depending on the role of this server
mkdir /opt/evs-infra-pg-utils/logs > /dev/null
echo `date`" It should archive file path $1 to /u02/archive/$2 on server pg02" | tee -a /opt/evs-infra-pg-utils/logs/archive.log"
#archive_command = '/bin/rsync -ac %p postgres@pg02:/u02/archive/%f'
exit 0

