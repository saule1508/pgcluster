let Pool = require('pg').Pool;
let config = require('../config/config.js').pg;

let pools = [];
config.map((el,idx)=>{
  pools.push(new Pool(el));
})
module.exports.pools = pools;

module.exports.query = (idx = 0,text, values, callback) => {
  console.log('query on db idx:', text, values, idx);
  return pools[idx].query(text, values, callback);
};

// the pool also supports checking out a client for
// multiple operations, such as a transaction
module.exports.connect = (idx = 0,callback) => {
  return pool[idx].connect(callback);
};

module.exports.pool = pool;