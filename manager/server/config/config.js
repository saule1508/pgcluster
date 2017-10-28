/*
 if running outside the swarm, i.e. no access to the docker socket
 you will have to expose the docker remote API
*/
const dbs=process.env.PG_BACKEND_NODE_LIST.split(',');
let pg = dbs.map((el)=>{
 let elem = el.split(':');
 return {host: elem[1], port: 5432,user: 'repmgr',password: process.env.REPMGRPWD || 'rep123',database:'repmgr'}
});

module.exports = {
	pg: pg,
	pgp: {
		'host': 'pgpool01',
		'port': 9999,
		'user': 'repmgr',
		'password': process.env.REPMGRPWD || 'rep123',
		'database': 'repmgr'		
	},
	docker: {
		'url': 'http://unix:/var/run/docker.sock:',
		'version': 'v1.27'
	},
	pollInterval: 5000
}
