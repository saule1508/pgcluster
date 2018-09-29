# Ansible playbook for a postgres master/slave with pgpool in docker swarm or with pgpool watchdog

This is WIP. Currently learning ansible which can greatly help provision and maintain servers

## provision 3 servers to set-up a docker swarm cluster with pgpool in watchdog mode (VIP)

the playbook is postgres-swarm-watchdog.yml

the inventory file looks like this on my set-up (3 VM using virsh on fedora)

```
[phoenix]
pgcluster01 ansible_host=192.168.122.146  ansible_connection=ssh ansible_user=ansible ansible_become_user=root
pgcluster02 ansible_host=192.168.122.209  ansible_connection=ssh ansible_user=ansible ansible_become_user=root
pgcluster03 ansible_host=192.168.122.40  ansible_connection=ssh ansible_user=ansible ansible_become_user=root
```

ansible will connect (via ssh) to each of the target machine with the user ansible: one must create this user on all VM's with password less sudo. On the host (or on the machine used to run the ansible-playbook command, the user must be able to connect to the 3 servers with user ansible.

So create a ssh key pair on your host, then install the public key on all 3 servers. For example, top put my public key in the authorized file of the first VM, I had to run
```
ssh-copy-id ansible@192.168.122.146
```

There are 3 docker images: manager, pgpool and pg. Those images must be loaded on the 3 VM's. So they must be pushed to a private registry, for example on the host. So for the current version 0.7.6 (see file version.txt), one must run the build script (that will do the docker build) and then make sure the 3 images are on the private registry

```
[pierre@romero ansible]$ docker images | grep 0.7.6

192.168.1.39:5000/pg                       0.7.6               bf1d8c535fff        12 days ago         619MB
pg                                         0.7.6               bf1d8c535fff        12 days ago         619MB
192.168.1.39:5000/manager                  0.7.6               1df033793360        13 days ago         467MB
manager                                    0.7.6               1df033793360        13 days ago         467MB
192.168.1.39:5000/pgpool                   0.7.6               f2ce567bb644        13 days ago         508MB
pgpool                                     0.7.6               f2ce567bb644        13 days ago         508MB
```

which shows that for the postgres image for example (pg), the image is stored on the registry 192.168.1.39:5000/pg:0.7.6 (and there is a local image as well)

in order to be able to load the images from this private registry inside the VM's, the ansible playbook will add 192.168.1.39 (in my case) to the list of insecure registries.

Ansible needs variables during the playbook. Some variables are defined in the playbook itself (for example pgpool failover ip) and others are defined in group_vars/all. Particularly important in group_vars/all are the disks
that will be used for the docker thinpool and for postgres. On my VM's I have an empty disk available called vdb of size 25G

group_vars/all
```
storage:
  docker:
    disk: 'vdb'
    #if the volume group does not exist, it will be created otherwise it will expanded with the disk above
    vg: vg_01
    #this is the size of the lv volume that will be created
    size_gb: "16"
  postgres:
    data:
      disk: "vdb"
      vg: vg_01
      size_gb: "3"
    backup:
      disk: "vdb"
      vg: vg_01
      size_gb: "3"
```
The result of that will be a that a volume group vg_01 will be created using disk vdb. The docker thinpool and the file systems /u01 and /u02 will be created in it.

variables defined inside the playbook are (of course one can override them via the extra-vars argument)

* docker_url: 192.168.1.39:5000/ : this is needed so that docker inside the VM can load the image in my private registry on my host
* insecure_registries: ["192.168.1.39:5000"] : same
* images: the tags of the images for manager, pgpool and pg. Those images must be build on the host and stored in the registry defined above

* pgpool_ip_failover: 192.168.122.250
* pgpool_ip_failover_netmask: 24
* pgpool_ip_failover_interface: eth0
* pgpool_trusted_servers: 192.168.1.39

One this is all set-up it is a good idea to take a snapshot of the 3 VM's. Even though ansible must be idempotent it is good to be able to start from scratch also !

One should now run the playbook

``` 
ansible-playbook -i hosts.3virt postgres-swarm-watchdog.yml 2>&1 | tee -a pg_swarm_wd_ansible.log
```

Once the playbook has run it might be better to reboot the 3 servers. Then connect to each of them and check

```
[root@pgcluster01 ~]# firewall-cmd --list-ports
2376/tcp 2377/tcp 7946/tcp 7946/udp 4789/udp 8080/tcp 9999/tcp 9898/tcp
```

```
root@pgcluster01 ~]# docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS      ENGINE VERSION
1s437r0flcvvvep3ken5wez6m *   pgcluster01         Ready               Active              Reachable           18.06.1-ce
p6351v3sz5pqh1snyaiokz03b     pgcluster02         Ready               Active              Reachable           18.06.1-ce
0a6hzczju8rk2r87p90f0xeiy     pgcluster03         Ready               Active              Leader              18.06.1-ce
```

```
systemctl status haproxy
```

there is a user pgadmin created that can be used instead of root

the script to deploy the docker stack is

```
/opt/pgcluster/start_pgcluster_watchdog.sh
```

the script will deploy the stack described in docker-compose-watchdog.yml. It uses environment variables defined in 

* /etc/pgcluster/pgcluster.conf
* /etc/pgwatchdog/pgwatchdog.conf

the config are very important and must be reviewed with care, especially the settings related to the VIP in pgwatchdog.cong

check the doc in running.md for more on how to start and operate.

## provision two servers for use with pgpool watchdog

the playbook is postgres-watchdog.yml

the inventory file will look like this

```
[watchdog]
pgcluster01 ansible_host=192.168.122.146  ansible_connection=ssh ansible_user=ansible ansible_become_user=root consul_advertise_address=192.168.122.146
pgcluster02 ansible_host=192.168.122.209  ansible_connection=ssh ansible_user=ansible ansible_become_user=root consul_advertise_address=192.168.122.209
```

Most variables are defined in group_vars/all, take care on the disks defined for create the volume groups that will host postgres data

some variables are defined inside the playbook, of course one can override them via the extra-vars argument

* docker_url: 192.168.1.39:5000/ : this is needed so that docker inside the VM can load the image in my private registry on my host
* insecure_registries: ["192.168.1.39:5000"] : same
* images: the tags of the images for manager, pgpool and pg. Those images must be build on the host and stored in the registry defined above

* pgpool_ip_failover: 192.168.122.250
* pgpool_ip_failover_netmask: 24
* pgpool_ip_failover_interface: eth0
* pgpool_trusted_servers: 192.168.1.39

once you have reviewed the variables (disks for ex, and the various IP's), you can run the playbook

``` 
ansible-playbook -i hosts.2virt postgres-watchdog.yml 2>&1 | tee -a ansible.log
``` 
