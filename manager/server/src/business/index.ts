const { spawn } = require('child_process');
import { pg as dblist } from '../config/config';


const formatPgpoolWD = (arr) => {
  const result = {};
  let currentItem;
  let nodeIndex = -1;
  let nodeArray = [];
  arr.forEach((el) => {
    if (el.startsWith('Watchdog Cluster Information')) {
      currentItem = 'wd_cluster_info';
    }
    if (el.startsWith('Watchdog Node Information')) {
      currentItem = 'wd_node_info';
    }
    if (currentItem === 'wd_node_info' && el.startsWith('Node Name')) {
      nodeIndex++;
      nodeArray.push({ idx: nodeIndex });
    }
    const line = el.split(':');
    if (line.length !== 2) {
      return;
    }
    const k = line[0]
      .trim()
      .toLowerCase()
      .replace(/ /g, '_');
    if (currentItem === 'wd_node_info') {
      nodeArray[nodeIndex][k] = line[1].trim().replace(',', '');
    } else {
      result[k] = line[1].trim().replace(',', '');
    }
  });
  result.nodes = nodeArray;
  return result;
};

const getFromSSH = (dbhost, args) => {

  return new Promise((resolve, reject) => {
    let response = '';
    const cmdArgs = [
      '-p',
      '222',
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'UserKnownHostsFile=/dev/null',
      `postgres@${dbhost}`,
      '-C',
    ].concat(args);

    const shell = spawn('ssh', cmdArgs);
    let error = '';
    shell.stdout.on('data', (data) => {
      response = `${response}${data.toString()}`;
    });
    shell.stderr.on('data', (data) => {
      console.log(`got error ${data.toString()}`);
      error = `${error}${data.toString()}`;
    });
    shell.on('close', (code) => {
      console.log(`shell exited with code ${code}`);
      if (code === 0) {
        resolve({ node: dbhost, rows: response.split('\n') });
      } else {
        reject(new Error(`code ${code} ${error}`));
      }
    });
    shell.on('error', (e) => {
      console.log(`spawn error ${e}`);
    });
  });
};

const getPgpoolWDStatus = async () => {
  let response = null;
  let error = null;
  let done = false;
  for (var i = 0; i < dblist.length && !done; i++) {
    try {
      let result = await getPgpoolWDStatusFromDB(dblist[i].host);
      done = true;
      result.node_fetched_from = dblist[i].host;
      response = result;
    } catch (e) {
      error = e;
    }
  }
  if (done) {
    return Promise.resolve(response);
  }
  return Promise.reject(error);
};

const getPgpoolWDStatusFromDB = (dbhost) => {
  let noWatchDog = false;

  return new Promise((resolve, reject) => {
    let response = '';
    const cmdArgs = [
      '-p',
      '222',
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'UserKnownHostsFile=/dev/null',
      `postgres@${dbhost}`,
      '-C',
      'pcp_watchdog_info',
      '-h',
      'pgpool',
      '-p',
      '9898',
      '-w',
      '-v'
    ];
    const shell = spawn('ssh', cmdArgs);
    // if no connection after 5 secs, kill it so an error is returned
    setTimeout(() => {
      shell.kill();
    }, 5000);

    shell.stdout.on('data', (data) => {
      response = `${response}${data.toString()}`;
    });
    shell.stderr.on('data', (data) => {
      const msg = data.toString();
      console.log(`got error ${msg}`);
      if (msg.includes('watcdhog is not enabled')) {
        noWatchDog = true;
      }
    });
    shell.on('close', (code) => {
      console.log(`shell exited with code ${code}`);
      if (noWatchDog) {
        return reject(new Error('watchdog disabled'));
      }
      if (code === 0) {
        return resolve(formatPgpoolWD(response.split('\n')));
      }
      return reject(new Error(`error: ${code}`));
    });
    shell.on('error', (error) => {
      console.log(`spawn error ${error}`);
    });
  });
};

const getChecks = async () => {
  const dblist = require('../config/config.js').pg;
  let response = [];
  for (var i = 0; i < dblist.length; i++) {
    let nodechecks = {
      node: dblist[i].host,
      serverTimeStamp: new Date(),
      supervisor: [],
      repmgr: [],
      disk: [],
      error: null
    };
    try {
      let result = await getFromSSH(dblist[i].host, ['/scripts/checks.sh']);
      result.rows.forEach((el, idx) => {
        const cols = el.split(',');
        if (cols[0] === 'supervisor') {
          nodechecks.supervisor.push({
            process: cols[1],
            state: cols[2],
            info: cols[3]
          });
        }
        if (cols[0] === 'repmgr') {
          nodechecks.repmgr.push({ check: cols[1], result: cols[2] });
        }
        if (cols[0] === 'disk') {
          nodechecks.disk.push({
            fs: cols[1],
            percused: cols[2],
            kbtotal: cols[3],
            kbused: cols[4]
          });
        }
      });
      response.push(nodechecks);
    } catch (e) {
      console.log('catched error');
      console.log(e);
      nodechecks.error = e;
      response.push(nodechecks);
    }
  }
  return response;
};

module.exports = {
  getChecks,
  getPgpoolWDStatus
}
