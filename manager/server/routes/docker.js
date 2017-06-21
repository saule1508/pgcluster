var express = require('express')
var router = express.Router()

const headers={'Content-type': 'json', 'host': null}

/*  
// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
});
*/

router.get('/services', (req, res) => {
	let request = require('request');
	let config = require('../config/config.js').docker;

	let filters = {"desired-state": ["running","pending"]}; 
	let qs = 'filters=' + JSON.stringify(filters);

	let nbrCall = 2;
	let services ;
	let tasks ;
	
	const processResponse = () => {
		response = {
			'services' : services,
			'tasks' : tasks
		}
		return res.status(200).send(response);
	}

  request({'uri': config.url + '/v1.27/services', 'headers': headers}, (error, response, body) => {
  	if (error){
	 		console.log('error:', error); // Print the error if one occurred
	 		if (nbrCall !== -1){			
				nbrCall = -1;
	 			return res.status(500).send(error);
		 	}			
			return;
  	}
		services = JSON.parse(body);
		nbrCall --;
		if (nbrCall === 0){
			processResponse();
		}
	});

	request({'uri':config.url + '/v1.27/tasks', 'headers': headers}, (error, response, body) => {
  	if (error){
	 		console.log('error:', error); // Print the error if one occurred
	 		if (nbrCall !== -1){			
				nbrCall = -1;
	 			return res.status(500).send(error);
		 	}
			 return;
		}
  	console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  	tasks = JSON.parse(body);
  	nbrCall --;
  	if (nbrCall === 0){
  		processResponse();
  	}
	});
  
})

router.get('/nodes',(req,res)=>{
	let request = require('request');
	let config = require('../config/config.js').docker;
	try {
		request({'uri': config.url + '/' + config.version + '/nodes',
			'headers': headers}, (error, response, body) => {
			if (error){
				console.log(error);
				let resp = {'message': 'error executing request to ' + config.url,'code': error.code || 500}
				return res.status(500).send(resp);
			}
			//console.log('statusCode:', response && response.statusCode); 			
			res.send(JSON.parse(body));
		});
	} catch (error){
		console.log('catched');
		console.log(error);
	}


})

router.get('/tasks', (req, res) => {
	let request = require('request');
	let config = require('../config/config.js').docker;
	let filters = {"desired-state": ["running","pending"]}; 
	let qs = 'filters=' + JSON.stringify(filters);

  request({'uri':config.url + '/v1.27/tasks?' + qs, 'headers': headers}, (error, response, body) => {
  	if (error){
	  	console.log('error:', error); // Print the error if one occurred
	  	return res.status(500).send(error);
  	}
  	//console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  	res.send(body); 
	});
  
})

router.get('/df', (req, res) => {
	let request = require('request');
	let config = require('../config/config.js').docker;

  request({'uri':config.url + '/v1.27/system/df', 'headers': headers}, (error, response, body) => {
  	if (error){
	  	console.log('error:', error); // Print the error if one occurred
	  	return res.status(500).send(error);
  	}
  	//console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  	res.send(body); 
	});
  
})

router.get('/info', (req, res) => {
	let request = require('request');
	let config = require('../config/config.js').docker;

  request({'uri':config.url + '/v1.27/info', 'headers': headers}, (error, response, body) => {
  	if (error){
	  	console.log('error:', error); // Print the error if one occurred
	  	return res.status(500).send(error);
  	}
  	//console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  	return res.send(body); 
	});
  
})

module.exports = router
