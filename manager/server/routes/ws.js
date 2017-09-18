var express = require('express')
var wsrouter = express.Router();



wsrouter.ws('/dbstates', function(ws, req) {
  let interval ;
  let pollInterval = require('../config/config.js').pollInterval;
  let pg = require('../DAO/pg.js');

  let getStates = () => {
    pg.dbStates()
      .then((data)=>{
        let response = {'result': data, 'timestamp': new Date()};    
        console.log(response);
        ws.send(JSON.stringify(response));
      })
      .catch((err)=>{
        console.log('got error');
        console.log(err);
        let msg = err.detail ? err.detail : null;
        if (! msg){
          msg = 'server error ' + (err.code ? err.code + ' - ' : ' - ' ) + (err.errno ? err.errno : '');
        }
        ws.send(JSON.stringify({'message': msg,'error': err } ));
      })
  }

  getStates();
  interval = setInterval(getStates, pollInterval);

  ws.on('close', function(msg) {
    console.log('close with ' + msg);
    if (interval){
      clearInterval(interval);
    } else {
      console.log('no interval to clear ??');
    }
  });

  ws.on('error', (err)=>{
    if (interval){
      clearInterval(interval);
    }
    console.log('web socker error in /dbstates');
    console.log(err);
  })
  

});


wsrouter.ws('/repl_nodes', function(ws, req) {
  let interval ;
  let pollInterval = require('../config/config.js').pollInterval;
  let pg = require('../DAO/pg.js');

	let getData = () => {
    pg.getReplNodes()
			.then((data)=>{
				let response = {'result': data.rows, 'timestamp': new Date()};		
				ws.send(JSON.stringify(response));
			})
			.catch((err)=>{
        let msg = err.detail ? err.detail : null;
        if (! msg){
          msg = 'server error ' + (err.code ? err.code + ' - ' : ' - ' ) + (err.errno ? err.errno : '');
        }
				ws.send(JSON.stringify({'message': msg,'error': err } ));
			})
  }


  ws.on('message', (msg)=>{
    //console.log('message %s',msg);
    //ws.send(new Date().toString());
  })
  getData();
  interval = setInterval(getData, pollInterval);

  ws.on('close', function(msg) {
  	console.log('close with ' + msg);
    if (interval){
      clearInterval(interval);
    } else {
      console.log('no interval to clear ??');
    }
  });

  ws.on('error', (err)=>{
    if (interval){
      clearInterval(interval);
    }
    console.log('web socker error in /repl_nodes');
    console.log(err);
  })
  

});

wsrouter.ws('/pool_nodes', function(ws, req) {
  let interval ;
  let pollInterval = require('../config/config.js').pollInterval;
  let pg = require('../DAO/pg.js');

	let getData = () => {
    pg.getPoolNodes()
			.then((data)=>{
				let response = {'result': data.rows, 'timestamp': new Date()};		
				ws.send(JSON.stringify(response));
			})
			.catch((err)=>{
        console.log('catched from from getPoolNodes');
        let msg = err.detail ? err.detail : null;
        if (! msg){
          msg = 'server error' + (err.code ? err.code + ' - ' : ' - ' ) + (err.errno ? err.errno : '');
        }
				ws.send(JSON.stringify({'message': msg,'error': err } ));
			})
  }


  ws.on('message', (msg)=>{
    console.log('message %s',msg);
    //ws.send(new Date().toString());
  })
  getData();
  interval = setInterval(getData, pollInterval);

  ws.on('close', function(msg) {
  	console.log('close with ' + msg);
    if (interval){
      clearInterval(interval);
    } else {
      console.log('no interval to clear ??');
    }
  });
  ws.on('error', (err)=>{
    if (interval){
      clearInterval(interval);
    }
    console.log('web socker error in /pool_nodes');
    console.log(err);
  })
  

});

wsrouter.ws('/bus_health', function(ws, req) {
  let interval ;
  let pollInterval = require('../config/config.js').pollInterval;
  let bus_health = require('../services/index.js').bus_health;

  ws.on('message', (msg)=>{
    console.log('message %s',msg);
    //ws.send(new Date().toString());
  })

  interval = setInterval(()=>{
    let service=req.query.service;
    bus_health(service)
     .then((data)=>{
				let response = {'result': data, 'timestamp': new Date()};
				ws.send(JSON.stringify(response));
     })
		.catch((err)=>{
				console.log(err);
				ws.send(JSON.stringify(err));
			})
	}, pollInterval);

  ws.on('close', function(msg) {
  	console.log('close with ' + msg);
    if (interval){
      clearInterval(interval);
    } else {
      console.log('no interval to clear ??');
    }
  });
  

});

wsrouter.ws('/shell', function(ws, req) {

  const { spawn } = require('child_process');
  const getArgsFromString = require('../business/utils.js').getArgsFromString;
  console.log('in /shell');
  ws.on('message', (msg)=>{
    console.log(`message is ${msg}`);
    let args = getArgsFromString(msg);
    console.log(args);
    let cmdArgs = ['-o','StrictHostKeyChecking=no','-o','UserKnownHostsFile=/dev/null', `postgres@${args.host}`,'-C'];
    switch (args.action){
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
      default:
        ws.send('Invalid shell action '+ args.action);
        return ws.close();
    }
    if (args.name){
      cmdArgs.push('-n',args.name);
    }
    if (args.butype && args.action !== 'delete'){
      cmdArgs.push('-t',args.butype);
    }
    if (args.force === 'yes'){
      cmdArgs.push('-f');
    }
    console.log(cmdArgs);

    const bu = spawn('ssh',cmdArgs);
    
    bu.stdout.on('data',(data)=>{
      ws.send(data.toString());
    })
    bu.stderr.on('data',(data)=>{
      ws.send(data.toString());
    })
    bu.on('close',(code)=>{
      console.log(`shell exited with code ${code}`);
      ws.send(`bu exited with code ${code}`);
      ws.close();
    })
    bu.on('error',(error)=>{
      console.log(`spawn error ${error}`);
      ws.send('bu error');
      ws.close();
    })
    
  })

  ws.on('close', function(msg) {
  	console.log('client close with ' + msg);
  });
  
  ws.on('error', (err)=>{
    console.log('web socker error in /backup');
    console.log(err);
  })

});


module.exports = wsrouter
