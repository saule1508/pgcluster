const { replicationStats, dbStates } = require('./pg.js');
const { closeAll } = require('../config/pgpool');
/*
it('replicationStats with 3 nodes should return an array of 3 and for the master contains stats for all standbyes', () => {
  expect.assertions(1);

  return replicationStats()
    .then((data) => {
      closeAll();
      const primary = data.filter(el => el.host === 'pg01');
      console.log(primary[0].data[0]);
      expect(data).toHaveLength(3);
    })
    .catch((error) => {
      closeAll();
      console.log(error);
    });
});
*/

it('dbStates returns 3 nodes', () => {
  expect.assertions(1);
  return dbStates()
    .then((data) => {
      console.log(data);
      expect(data).toHaveLength(3);
    })
    .catch((error) => {
      console.log(error);
    });
});
