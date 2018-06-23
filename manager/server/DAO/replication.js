const isInRecovery = async (db) => {
  const { pools } = require('../config/pgpool');
  const pool = pools.filter((p)=>(p.host === db))[0].pool;
  try {
     const res = await pool.query('select pg_is_in_recovery() as in_recovery');
     return res.rows[0].in_recovery;
  } catch (e) {
     throw(e);
  }
}

const replicationStats = async () => {
  let pools = require('../config/pgpool').pools;

  let pool = require('../config/pgpool');
  let states = [];
  return new Promise((resolve, reject) => {
    pools.forEach((el, idx) => {
      let res;
      isInRecovery(el.host)
      .then(async (isInRecovery)=>{
        const SQL = `select * from ${
              isInRecovery ? 'pg_stat_wal_receiver' : 'pg_stat_replication'
            }`;
        console.log(`in then of isInRecovery with ${el.host}`);
        try{
          const stats = await el.pool.query(SQL);
          states.push({
             idx: idx,
             host: el.host,
             status: 'green',
             in_recovery: isInRecovery,
             data: stats.rows
          });
        } catch(e){
          console.log(`error in ${SQL} for ${el.host}`);
          states.push({
             idx: idx,
             host: el.host,
             status: 'green',
             in_recovery: isInRecovery,
             error: e
           });
        }
        if (states.length === pools.length) {
           return resolve(states);
        }
      })
      .catch((e)=>{
          states.push({
             idx: idx,
             host: el.host,
             status: 'red',
             in_recovery: null,
             data: null
          });
          if (states.length === pools.length) {
             return resolve(states);
          }
      })
    })
  });
};

