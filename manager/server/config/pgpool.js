const Pool = require('pg').Pool;
const config = require('./config.js').pg;

const pools = [];
config.map((el, idx) => {
  const p = new Pool(el);
  p.on('error', (err) => {
    console.log('pool %d emitted error', idx);
    console.log(err);
  });
  pools.push({ pool: p, host: el.host });
});

const query = (idx = 0, text, values, callback) => pools[idx].pool.query(text, values, callback);

// the pool also supports checking out a client for
// multiple operations, such as a transaction
const connect = (idx = 0, callback) => pools[idx].pool.connect(callback);

// give the pool for one host
const getPoolForHost = (host) => {
  const pool = pools.filter(el => el.host === host);
  if (pool.length !== 1) {
    return null;
  }
  return pool[0].pool;
};

const closeAll = () => {
  pools.forEach(p => p.pool.end());
};

module.exports = {
  pools,
  query,
  connect,
  getPoolForHost,
  closeAll,
};
