var express = require('express')
var router = express.Router();
let pg = require('../DAO/pg.js');

router.get('/repl_nodes', function (req, res) {
	
	pg.getReplNodes()
		.then((data)=>{
			return res.status(200).send(data);
		})
		.catch((err)=>{
			console.log(err);
			res.status(500).send(err);
		})
	;
	
})

router.get('/stat_activity',(req,res)=>{

	pg.getStatActivity()
		.then((data)=>{
			return res.status(200).send(data);
		})
		.catch((err)=>{
			res.status(500).send(err);
		})
	;
});

router.get('/pool_nodes', (req, res) => {
	pg.getPoolNodes()
		.then((data)=>{
			return res.status(200).send(data);
		})
		.catch((err)=>{
			res.status(500).send(err);
		})
	;  
})

router.get('/replication_stats', (req, res) => {
	pg.replicationStats()
		.then((data)=>{
			return res.status(200).send(data);
		})
		.catch((err)=>{
			res.status(500).send(err);
		})
	;  
})


module.exports = router