const directory = '/u02/backup';

const getBackups = () => {

  const pools = require('../config/pgpool').pools;
  const getFilesForHost = require('./utils.js').getFilesForHost;

  let backups = {};
  return new Promise((resolve,reject)=>{
    let done = 0;
    pools.forEach((el,idx)=>{
      
      getFilesForHost(el.host,directory).then((result)=>{
        backups[el.host] = result;
        done++;
        if (done === pools.length){
          return resolve(backups);
        }
      })
      .catch((error)=>{
        console.log('got error from ' + el.host);
        backups[el.host] = error;
        done++;
        console.log(error);
        if (done === pools.length){
          return resolve(backups);
        }
      })
    })
  })
}

const backupExists = async (host,backup) => {
  const getFilesForHost = require('./utils.js').getFilesForHost;
  
  let data;
  try {
    data = await getFilesForHost(host,`${directory}`);
  } catch(error){
    throw(error);
  }
  let found = data.result.some((el)=>{
    return (el === backup);
  });
  return found;

  /*
  return new Promise((resolve,reject)=>{
    getFilesForHost(host,`${directory}`)
    .then((data)=>{
      let found = data.result.some((el)=>{
        return (el === backup);
      });
      return resolve(found);
    })
    .catch((error)=>{
      console.log('catched in business ' + error);
      return reject(error.error);
    })
  })
  */
}

module.exports = {
  getBackups: getBackups,
  backupExists: backupExists
}
