/*
 if running outside the swarm, i.e. when developping
 you will have to expose the docker remote API
 to do that, edit the file 
/lib/systemd/system/docker.server
		ExecStart=/usr/bin/dockerd -H tcp://10.129.76.192:2375 -H unix:///var/run/docker.sock (change the IP accordingly !!)
systemctl daemon-reload
 then
 firewall-cmd --add-port 2375/tcp 

*/
module.exports = {
	pg: {
		'host': 'pg01',
		'port': 5432,
		'user': 'repmgr',
		'password': 'rep123',
		'database': 'repmgr'
	},
	pgp: {
		'host': 'pgpool01',
		'port': 9999,
		'user': 'repmgr',
		'password': 'rep123',
		'database': 'repmgr'		
	},
	docker: {
		'url': 'http://10.129.76.192:2375',
		'version': 'v1.27'
	},
	pollInterval: 5000
}
