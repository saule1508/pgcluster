const getBackups = () => {

  const pools = require('../config/pgpool').pools;
  const getFilesForHost = require('./utils.js').getFilesForHost;
  const directory = '/u02/backup';

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

module.exports = {
  getBackups: getBackups
}
