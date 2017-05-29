#!/bin/bash

str=`psql -U repmgr repmgr -t -c "select name from repl_nodes where type='master' and active='t';"`
echo $str
