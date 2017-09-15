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


wsrouter.ws('/shell', (ws,req) => {
  const { spawn } = require('child_process');
  ws.on('message', (msg)=>{
    console.log('shell message is %s', msg);
    let myargs = msg.split(',');
    let args = {};
    myargs.forEach((e,idx)=>{
      let kv = e.split(':');
      args[kv[0].trim()] = kv[1].trim();
    })
    console.log(args);
    ws.send(`about to call ${args.action} on host ${args.pcp_host} for node id ${args.pcp_node_id}`)
    let cmd = spawn('ssh',
        ['-o','StrictHostKeyChecking=no','-o','UserKnownHostsFile=/dev/null', 
          `postgres@${args.pcp_host}`,'-C', `/scripts/${args.action}.sh`,`${args.pcp_node_id}`]);

    cmd.stdout.on('data',(data)=>{
      ws.send(data.toString());
    })
    cmd.stderr.on('data',(data)=>{
      ws.send(data.toString());
    })
    cmd.on('close',(code)=>{
      console.log(`shell command exited with code ${code}`);
      ws.send(`shell exited with code ${code}`);
    })
    cmd.on('error',(code)=>{
      console.log(`shell on error with code ${code}`);
      ws.send(`shell on error with code ${code}`);
    })
    
      
  });

  ws.on('close', function(msg) {
    console.log('client close with ' + msg);
  });

  ws.on('error', (err)=>{
    console.log('web socker error in /shell');
    console.log(err);
  })


});


wsrouter.ws('/backup', function(ws, req) {

  const { spawn } = require('child_process');
  const getArgsFromString = require('../business/utils.js').getArgsFromString;
  console.log('in /backup');
  ws.on('message', (msg)=>{
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
      default:
        ws.send('Invalid backup action '+ args.action);
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
      console.log(`bu exited with code ${code}`);
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
