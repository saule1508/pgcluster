const bus_health = service => {
  const request = require('request-promise');
  return request
    .get({ uri: 'http://' + service + ':8080/health', json: true })
    .then(response => {
      console.log('in then');
      return response;
    })
    .catch(error => {
      console.log('in catch');
      throw error;
    });
};

const formatPgpoolWD = arr => {
  let result = {};
  let currentItem;
  let nodeIndex = -1;
  let nodeArray = [];
  arr.forEach(el => {
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
    line = el.split(':');
    if (line.length !== 2) {
      return;
    }
    let k = line[0]
      .trim()
      .toLowerCase()
      .replace(/ /g, '_');
    if (currentItem === 'wd_node_info') {
      nodeArray[nodeIndex][k] = line[1].trim().replace(',', '');
    } else {
      result[k] = line[1].trim().replace(',', '');
    }
  });
  result['nodes'] = nodeArray;
  return result;
};

const getFromSSH = (dbhost, args) => {
  const { spawn } = require('child_process');

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
      '-C'
    ].concat(args);

    const shell = spawn('ssh', cmdArgs);
    let error = '';
    shell.stdout.on('data', data => {
      response = `${response}${data.toString()}`;
    });
    shell.stderr.on('data', data => {
      console.log(`got error ${data.toString()}`);
      error = `${error}${data.toString()}`;
    });
    shell.on('close', code => {
      console.log(`shell exited with code ${code}`);
      if (code === 0) {
        resolve({ node: dbhost, rows: response.split('\n') });
      } else {
        reject(`code ${code} ${error}`);
      }
    });
    shell.on('error', error => {
      console.log(`spawn error ${error}`);
    });
  });
};

const getPgpoolWDStatusFromDB = dbhost => {
  const { spawn } = require('child_process');

  //  const pools = require('../config/pgpool').pools;
  //  const getFilesForHost = require('./utils.js').getFilesForHost;
  //  const directory = '/u02/backup';
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
    shell.stdout.on('data', data => {
      response = `${response}${data.toString()}`;
    });
    shell.stderr.on('data', data => {
      console.log(`got error ${data.toString()}`);
    });
    shell.on('close', code => {
      console.log(`shell exited with code ${code}`);
      if (code === 0) {
        resolve(formatPgpoolWD(response.split('\n')));
      } else {
        reject({ error: code });
      }
    });
    shell.on('error', error => {
      console.log(`spawn error ${error}`);
    });
  });
};

const getPgpoolWDStatus = async () => {
  const dblist = require('../config/config.js').pg;
  let response;
  let done = false;
  for (var i = 0; i < dblist.length && !done; i++) {
    try {
      let result = await getPgpoolWDStatusFromDB(dblist[i].host);
      done = true;
      result.node_fetched_from = dblist[i].host;
      response = result;
    } catch (e) {
      console.log(e);
      response = e;
    }
  }
  return response;
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
  bus_health: bus_health,
  getPgpoolWDStatus: getPgpoolWDStatus,
  getChecks: getChecks
};
