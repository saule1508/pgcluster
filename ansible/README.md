# Ansible playbook for a postgres master/slave with pgpool in docker swarm or with pgpool watchdog

This is WIP. Currently learning ansible which can greatly help provision and maintain servers

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
