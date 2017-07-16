const SQL_ACTIVITY_STAT = 'select * from pg_stat_activity;';
const SQL_REPL_NODES = 'select * from repl_nodes;'
const SQL_SHOW_POOL_NODES = 'show pool_nodes;'

const getStatActivity = () => {
	let pool = require('./pgppool.js');
	let q = new Promise((resolve,reject)=>{
		pool.query(SQL_ACTIVITY_STAT, [], (error,result)=>{
			if (error){
				reject(error);
			} else {
				resolve(result);
			}
		})
	});
	return q;
}

const getReplNodes = () => {
	let pgpool = require('./pgppool').pool;
	let q = new Promise((resolve,reject)=>{
		pgpool.connect().
			then((client)=>{
				client.query(SQL_REPL_NODES)
					.then((res)=>{
						client.release();
					  resolve(res);
					})
					.catch((err)=>{
						client.release();
						reject(err);
					})
			})
			.catch((err)=>{
				console.log('pool connect error', err);
				reject(err);
			})
	});
	return q;
}

const getPoolNodes = () => {
	let pgppool = require('./pgppool').pool;
	let q = new Promise((resolve,reject)=>{
		pgppool.connect().
			then((client)=>{
				client.query(SQL_SHOW_POOL_NODES)
					.then((res)=>{
						client.release();
				  	resolve(res);
					})
					.catch((err)=>{
						client.release();
						reject(err);
					})
			})
			.catch((err)=>{
				console.log('pool connect error', err);
				reject(err);
			})
	});
	return q;
}

const dbStates = () => {
	let pools = require('./pgpool').pools;

	let pool = require('./pgpool');
	let states = [];
	return new Promise((resolve,reject)=>{
		pools.forEach((el,idx)=>{
			console.log('query in idx ' + idx);
			
			pool.query(idx,'select pg_is_in_recovery() as in_recovery',{},(err,result)=>{
				if (err){
					states.push({idx: idx, host: el.host, status:'red'});
				} else {
					console.log(result.rows[0]);
					states.push({idx: idx, host: el.host,status: 'green', in_recovery: result.rows[0].in_recovery})
				}
				if (states.length === pools.length){
					return resolve(states);
				}			
			})
		})
	})
}


module.exports = {
	'getStatActivity': getStatActivity,
	'getReplNodes': getReplNodes,
	'getPoolNodes': getPoolNodes,
	dbStates: dbStates
}

