const pg = require('../DAO/pg.js');
const { pollInterval } = require('../config/config.js');
const express = require('express');
const { spawn } = require('child_process');

const wsrouter = express.Router();

wsrouter.ws('/dbstates', (ws, req) => {
  const getStates = () => {
    pg.dbStates()
      .then((data) => {
        const response = { result: data, timestamp: new Date() };
        ws.send(JSON.stringify(response));
      })
      .catch((err) => {
        console.log('got error');
        console.log(err);
        let msg = err.detail ? err.detail : null;
        if (!msg) {
          msg = `server error
            ${err.code ? err.code : ''} - 
            ${err.errno ? err.errno : ''}`;
        }
        ws.send(JSON.stringify({ message: msg, error: err }));
      });
  };

  getStates();
  const interval = setInterval(getStates, pollInterval);

  ws.on('close', (msg) => {
    console.log(`close with ${msg}`);
    if (interval) {
      clearInterval(interval);
    } else {
      console.log('no interval to clear ??');
    }
  });

  ws.on('error', (err) => {
    if (interval) {
      clearInterval(interval);
    }
    console.log('web socker error in /dbstates');
    console.log(err);
  });
});

wsrouter.ws('/repl_nodes', (ws, req) => {
  const getData = () => {
    pg.getReplNodes()
      .then((data) => {
        const response = { result: data.rows, timestamp: new Date() };
        ws.send(JSON.stringify(response));
      })
      .catch((err) => {
        let msg = err.detail ? err.detail : null;
        if (!msg) {
          msg = `server error ${err.code ? `${err.code} - ` : ' - '}${err.errno ? err.errno : ''}`;
        }
        ws.send(JSON.stringify({ message: msg, error: err }));
      });
  };

  ws.on('message', () => {
    // console.log('message %s',msg);
    // ws.send(new Date().toString());
  });
  getData();
  const interval = setInterval(getData, pollInterval);

  ws.on('close', (msg) => {
    console.log(`close with ${msg}`);
    if (interval) {
      clearInterval(interval);
    } else {
      console.log('no interval to clear ??');
    }
  });

  ws.on('error', (err) => {
    if (interval) {
      clearInterval(interval);
    }
    console.log('web socker error in /repl_nodes');
    console.log(err);
  });
});

wsrouter.ws('/pool_nodes', (ws, req) => {
  const getData = () => {
    pg.getPoolNodes()
      .then((data) => {
        const response = { result: data.rows, timestamp: new Date() };
        ws.send(JSON.stringify(response));
      })
      .catch((err) => {
        console.log('catched from from getPoolNodes');
        let msg = err.detail ? err.detail : null;
        if (!msg) {
          msg = `server error${err.code ? `${err.code} - ` : ' - '}${err.errno ? err.errno : ''}`;
        }
        ws.send(JSON.stringify({ message: msg, error: err }));
      });
  };

  ws.on('message', (msg) => {
    console.log('message %s', msg);
    // ws.send(new Date().toString());
  });
  getData();
  const interval = setInterval(getData, pollInterval);

  ws.on('close', (msg) => {
    console.log(`close with ${msg}`);
    if (interval) {
      clearInterval(interval);
    } else {
      console.log('no interval to clear ??');
    }
  });
  ws.on('error', (err) => {
    if (interval) {
      clearInterval(interval);
    }
    console.log('web socker error in /pool_nodes');
    console.log(err);
  });
});

wsrouter.ws('/shell', (ws, req) => {
  const { getArgsFromString } = require('../business/utils.js');

  console.log('in /shell');
  ws.on('message', (msg) => {
    console.log(`message is ${msg}`);
    const args = getArgsFromString(msg);
    console.log(args);
    const cmdArgs = [
      '-p',
      '222',
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'UserKnownHostsFile=/dev/null',
      `postgres@${args.host}`,
      '-C',
    ];
    switch (args.action) {
      case 'backup':
        cmdArgs.push('/scripts/backup.sh');
        break;
      case 'restore':
        cmdArgs.push('/scripts/restore.sh');
        break;
      case 'delete':
        cmdArgs.push('/scripts/delete_backup.sh');
        break;
      case 'pcp_attach':
        cmdArgs.push('/scripts/pcp_attach.sh');
        cmdArgs.push(args.pcp_node_id);
        break;
      case 'pcp_detach':
        cmdArgs.push('/scripts/pcp_detach.sh');
        cmdArgs.push(args.pcp_node_id);
        break;
      case 'pcp_recovery_node':
        cmdArgs.push('/scripts/pcp_recovery_node.sh');
        cmdArgs.push(args.pcp_node_id);
        break;
      case 'pg_stop':
        cmdArgs.push('/scripts/pg_stop.sh');
        break;
      case 'pg_start':
        cmdArgs.push('/scripts/pg_start.sh');
        break;
      case 'repmgr_unregister':
        cmdArgs.push('/scripts/repmgr_unregister.sh');
        break;
      default:
        ws.send(`Invalid shell action  ${args.action}`);
        return ws.close();
    }
    if (args.name) {
      cmdArgs.push('-n', args.name);
    }
    if (args.butype && args.action !== 'delete') {
      cmdArgs.push('-t', args.butype);
    }
    if (args.force === 'yes') {
      cmdArgs.push('-f');
    }
    console.log(cmdArgs);

    const bu = spawn('ssh', cmdArgs);

    bu.stdout.on('data', (data) => {
      ws.send(data.toString());
    });
    bu.stderr.on('data', (data) => {
      ws.send(data.toString());
    });
    bu.on('close', (code) => {
      console.log(`shell exited with code ${code}`);
      ws.send(`shell exited with code ${code}`);
      ws.close();
    });
    bu.on('error', (error) => {
      console.log(`spawn error ${error}`);
      ws.send(`shell error: ${error}`);
      ws.close();
    });
  });

  ws.on('close', (msg) => {
    console.log(`client close with ${msg}`);
  });

  ws.on('error', (err) => {
    console.log('web socker error in shell');
    console.log(err);
  });
});

module.exports = wsrouter;
