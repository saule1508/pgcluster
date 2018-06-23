const { pools } = require('../config/pgpool');
const { getPoolForHost } = require('../config/pgpool');
const parse = require('postgres-interval');

const isInRecovery = async (db) => {
  const pool = getPoolForHost(db);
  try {
    const res = await pool.query('select pg_is_in_recovery() as in_recovery');
    return res.rows[0].in_recovery;
  } catch (e) {
    throw e;
  }
};

const getStats = async () => {
  const states = [];
  return new Promise((resolve) => {
    pools.forEach((el, idx) => {
      isInRecovery(el.host)
        .then(async (inRecovery) => {
          const SQL = `select * from ${
            inRecovery ? 'pg_stat_wal_receiver' : 'pg_stat_replication'
          }`;
          try {
            const stats = await el.pool.query(SQL);
            const newRows = !inRecovery
              ? stats.rows.map(row =>
                Object.assign({}, row, {
                  write_lag_str: parse(row.write_lag).toPostgres(),
                  flush_lag_str: parse(row.flush_lag).toPostgres(),
                  replay_lag_str: parse(row.replay_lag).toPostgres(),
                }))
              : stats.rows;
            states.push({
              idx,
              host: el.host,
              status: 'green',
              in_recovery: inRecovery,
              data: newRows,
            });
          } catch (e) {
            console.log(`error in ${SQL} for ${el.host}`);
            states.push({
              idx,
              host: el.host,
              status: 'green',
              in_recovery: inRecovery,
              error: e,
            });
          }
          if (states.length === pools.length) {
            return resolve(states);
          }
        })
        .catch(() => {
          states.push({
            idx,
            host: el.host,
            status: 'red',
            in_recovery: null,
            data: null,
          });
          if (states.length === pools.length) {
            return resolve(states);
          }
        });
    });
  });
};

module.exports = {
  getStats,
  isInRecovery,
};
