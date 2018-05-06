#!/bin/bash

str=`psql -U repmgr repmgr -t -c "select name from nodes where type='primary' and active='t';"`
echo $str
