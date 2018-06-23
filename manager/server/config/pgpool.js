let Pool = require('pg').Pool;
let config = require('./config.js').pg;

let pools = [];
config.map((el,idx)=>{
	let p = new Pool(el);
	p.on('error',(err)=>{
		console.log('pool %d emitted error',idx);
		console.log(err);
	})
  pools.push({pool: p, host: el.host});
})

const query = (idx = 0,text, values, callback) => {
  return pools[idx].pool.query(text, values, callback);
};

// the pool also supports checking out a client for
// multiple operations, such as a transaction
const connect = (idx = 0,callback) => {
  return pools[idx].pool.connect(callback);
};

// give the pool for one host
const getPoolForHost = (host) => {
  const pool = pools.filter((el)=>{
    return (el.host === host)
  });
  if (pool.length !== 1){
    return null;
  }
  return pool[0].pool;
}

module.exports = {
  pools: pools,
  query: query,
  connect: connect,
  getPoolForHost
}
