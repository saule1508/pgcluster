const { getPoolForHost } = require('./pgpool');

test('it returns a pool for host pg01',()=>{
  const pool = getPoolForHost('pg01');
  expect(pool).toBe(expect.anything());
})

test('it returns null for host pg05',()=>{
  const pool = getPoolForHost('pg05');
  expect(pool).toBe(null);
})

