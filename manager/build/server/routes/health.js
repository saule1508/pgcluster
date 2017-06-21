var express = require('express')
var router = express.Router();

router.get('/', (req, res) => {
 let bus_health = require('../business/health.js').bus_health;
 let s = req.query.service;
 bus_health(s).then((data)=>{
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
 })
 .catch((error)=>{
  res.setHeader('Content-Type', 'application/json');
  if (error.statusCode)
  res.status(error.statusCode).send(error);
 })
});

module.exports = router;
