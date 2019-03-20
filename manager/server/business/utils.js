const { spawn } = require('child_process');

const getFilesForHost = (host, directory) => {
  let stdout = '';
  let stderr = '';
  return new Promise((resolve,reject)=>{

    let cmdArr = ['-p',`${process.env.SSHPORT||222}`,'-o','StrictHostKeyChecking=no','-o','UserKnownHostsFile=/dev/null', `postgres@${host}`,'-C',
       'ls',directory];
    let cmd = spawn('ssh',cmdArr);
    cmd.stdout.on('data',(data)=>{
     stdout += data.toString();
    })
    cmd.stderr.on('data',(data)=>{
      stderr += data.toString();
    })

    cmd.on('error', (error)=>{
      return reject({'result': null, 'error': error});
    })

    cmd.on('close',(code)=>{
      if (code !== 0){
        return reject({result: null, error: stderr});
      }
      let myarr = stdout.split('\n');
      let files = [];
      myarr.forEach((el)=>{
       if (el !== ''){
         files.push(el);
       }
      })
      return resolve({result: files,error: null});
    })
  })
}

/*
* extract args from a csv string, for ex. parameter name=mybackup,host:pg01
* will return an object {name: 'mybackup', host: 'pg01'}
*/
const getArgsFromString = (msg) => {
    let myargs = msg.split(',');
    let args = {};
    myargs.forEach((e,idx)=>{
      let kv = e.split(':');
      args[kv[0].trim()] = kv[1].trim();
    })
    return args;
}

module.exports = {
  getFilesForHost: getFilesForHost,
  getArgsFromString: getArgsFromString
}
