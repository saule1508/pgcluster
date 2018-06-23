const { replicationStats } = require('./pg.js');

it('replicationStats with 3 nodes should return an array of 3 and for the master contains stats for all standbyes', () => {
  expect.assertions(1);

  return replicationStats()
    .then((data) => {
      console.log(data);
      expect(data).toHaveLength(3);
    })
    .catch((error) => {
      console.log(error);
    });
});

