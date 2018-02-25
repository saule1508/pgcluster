# Pgpool in watchdog with postgres in streaming replication

This documents a set-up composed of two nodes in which postgres is made redundant via streaming replication (repmgr is used) and pgpool is made redundant via the pgpool watchdog mode (based on a VIP, virtual ip, which is moved from node to node when pgpool fails on one node)

Provisioning of the two nodes can be done via the ansible playbook postgres-watchdog.yml
