const backupExists = require('./backup').backupExists;
const utils = require('./utils.js');


it('backupExists() should throw an error when not stubbed',async () =>{
  expect.assertions(1);
  try {
    const found = await backupExists('pg09','20180604_backup');
  } catch(e){
    expect(e.error).toMatch(/ssh: Could not resolve hostname pg09/);
  }
});

it('backupExists() should return true when stubbed',async () =>{
  const expectedResponse = {result: ['20180604_backup','20180605_backup','test'], error: null};
  utils.getFilesForHost = jest.fn().mockReturnValueOnce(expectedResponse);
  const found = await backupExists('pg01','20180604_backup');
  expect(utils.getFilesForHost).toHaveBeenCalledWith('pg01','/u02/backup');
  expect(found).toBe(true);
});

it('backupExists() should return false when directory does not exist',async () =>{
  const expectedResponse = {result: ['20180604_backup','20180605_backup','test'], error: null};
  utils.getFilesForHost = jest.fn().mockReturnValueOnce(expectedResponse);
  const found = await backupExists('pg01','99920180604_backup');
  expect(found).toBe(false);
});


