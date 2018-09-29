# Automatic failover with repmgrd

NB: I gave up this track as there were too many edge cases and I decided to focus on pgpool

In both case the automatic failover is optional. It can either be done by pgpool or by repmgr (but not both at the same time). I started to use repmgrd for the automatic failover but abandonned this track in favor of pgpool. When using repmgrd for failover (REPMGRD_FAILOVER_MODE=automatic), then you must give the env variable FAILOVER_MODE=manual to the pgpool container and in this case the failover_command will be left empty in pgpool config: in this case pgpool will not do the failover when it detects a primary failure but will wait until a new master is promoted (by repmgrd). If repmgrd is responsible for the failover then it is important that the grace period before failover (depends on REPMGRD_RECONNECT_ATTEMPTS and REPMGRD_RECONNECT_INTERVAL env variables passed to the postgres containers) must be shorter than the period defined for PGPOOL (PGPOOL_HEALTH_CHECK_MAX_RETRIES and PGPOOL_HEALTH_CHECK_RETRY_DELAY env variables given to pgpool's container). But, again, using repmgrd for automatic failover was abandoned for me (see repmgrd_auto.md)

When repmgrd is responsible for the automatic failover, I see two ways to have pgpool notified of actions by repmgrd:

* A script /script/repmgrd_event.sh is hooked in the config of repmgr so that when a repmgrd_failover_promote event occurs the pcp_promote_node command is executed. In this case the flag ALLOW_TO_FAILOVER must be used in pgpool config
* the failover_command in pgpool config is left empty; when pgpool detects a primary failure it will search for a new primary until if finds it (because repmgrd did a failover)

Note that I tried to set the flag DISALLOW_TO_FAILOVER but there are problems: it is not allowed to use the pcp_detach_node command when DISALLOW_TO_FAILOVER is set. But when a standby fails it would remain attached to the pgpool (?)

For now I am using pgpool for automatic failover. In order to have automatic reconfiguration of a failed master or of a failed standby, there is a script /scripts/check_state.sh in the docker image that could be scheduled via cron (cron on the host, executing the script check_state via docker exec in each container)
