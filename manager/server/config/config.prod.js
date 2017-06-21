/*
 if running outside the swarm, i.e. no access to the docker socket
 you will have to expose the docker remote API
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
		'url': 'http://unix:/var/run/docker.sock:',
		'version': 'v1.27'
	},
	pollInterval: 5000
}
