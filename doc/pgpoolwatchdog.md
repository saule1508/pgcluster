# Pgpool in watchdog mode with docker

This documents a set-up composed of two nodes in which postgres is made redundant via streaming replication and pgpool is made redundant via the pgpool watchdog mode (based on a VIP, virtual ip, which is moved from node to node when pgpool fails on one node). The automatic failover of postgres can be done either by pgpool or via repmgrd.

Provisioning of the two nodes can be done via the ansible playbook postgres-watchdog.yml

## provisioning

To provision the set-up one need two Centos 7 servers.

the inventory file looks like that on my set-up (call pgwatchdog.inventory)

```
[pgcluster]
pgcluster01 ansible_host=192.168.122.146  ansible_connection=ssh ansible_user=ansible ansible_become_user=root
pgcluster02 ansible_host=192.168.122.209  ansible_connection=ssh ansible_user=ansible ansible_become_user=root
```

for this to work one need on each host a user called ansible with passwordless sudo access. The public key of the user running ansible on the control machine must be copied over on each host, in user's ansible authorized_keys file. Use ssh-copy-id for that. So on the control machine,

```
ssh-copy-id ansible@192.168.122.146
```
Once the servers are ready (one need a Centos 7 base install on each server beside the ansible user with sudo access), you can run the playbook

```
ansible-playbook -i pgwatchdog.inventory postgres-watchdog.yml
```

variables needed for the provisioning are specified in the playbook, there are variables related to the docker registry where the images are available, the version of the images and the configuration of the pgpool watchdog mode (VIP information)

## configuration

Once the playbook has run the configuration information is stored in the following files

* /etc/pgwatchdog/pgwatchdog.conf
* /etc/hosts

while the start/stop scripts (start docker containers) are stored in /opt/pgwatchdog/bin

A user pgadmin is created: it is suggested to use it to start/stop the containers

The following configuration stored in /etc/pgwatchdog/pgwatchdog.conf is crucial for the configuration of pgpool. This is an example on a test set-up, on the first node of the cluster:

```
NODE_ID=1
PG_NODE_NAME=pg01
PGP_NODE_NAME=pgpool01
PG_INITIAL_NODE_TYPE=master
PG_BACKEND_NODE_LIST=0:pg01:5432:1:/u01/pg10/data:ALLOW_TO_FAILOVER,1:pg02:5432:1:/u01/pg10/data:ALLOW_TO_FAILOVER
NODE_LIST=pgcluster01,pgcluster02
DELEGATE_IP=192.168.122.250/24
DELEGATE_IP_INTERFACE=eth0
TRUSTED_SERVERS=192.168.1.39

PGP_HEARTBEATS=0:pgpool01:9694,1:pgpool02:9694
PGP_OTHERS=0:pgpool02:9999

CRITLIB_USER_PWD=critlib_user
CRITLIB_OWNER_PWD=critlib_owner
MSLIST=critlib
MSOWNERPWDLIST=critlib_owner
MSUSERPWDLIST=critlib_user
REPMGRPWD=rep123
ARCHIVELOG=1
```
