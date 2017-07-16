let Pool = require('pg').Pool;
let config = require('../config/config.js').pg;

let pools = [];
config.map((el,idx)=>{
  pools.push({pool: new Pool(el), host: el.host});
})

const query = (idx = 0,text, values, callback) => {
  return pools[idx].pool.query(text, values, callback);
};

// the pool also supports checking out a client for
// multiple operations, such as a transaction
const connect = (idx = 0,callback) => {
  return pools[idx].pool.connect(callback);
};

module.exports = {
  pools: pools,
  query: query,
  connect: connect
}