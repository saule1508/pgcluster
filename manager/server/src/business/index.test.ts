const getPgpoolWDStatus = require('./index').getPgpoolWDStatus;

test('it should throw an exception when there is no watchdog mode',()=>{

  expect.assertions(1);
  return getPgpoolWDStatus()
    .then((data) => {
      console.log(data);
    })
    .catch((e) => {
      expect(e.message).toBe('watchdog disabled');
    })
});
