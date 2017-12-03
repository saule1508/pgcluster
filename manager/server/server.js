var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var routes_docker = require('./routes/docker.js');
var routes_postgres = require('./routes/postgres.js');
var routes_ws = require('./routes/ws.js');


var expressWs = require('express-ws')(app)

app.use(express.static('app'));

app.use('/api/docker', routes_docker);
app.use('/api/postgres', routes_postgres);
app.use("/ws", routes_ws);
app.use('*', (req, res) => {
  if ( !(req.path.startsWith('/api') || req.path.startsWith('/ws')) ){
    res.sendfile(__dirname + '/app/index.html');
  }
});


app.listen(process.env.PORT || 8080);
