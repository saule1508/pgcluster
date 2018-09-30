const express = require("express");

const app = express();
const expressWs = require("express-ws")(app);
const routesDocker = require("./routes/docker.js");
const routesPostgres = require("./routes/postgres.js");
const routesWs = require("./routes/ws.js");

app.use(express.static("app"));

app.use("/api/docker", routesDocker);
app.use("/api/postgres", routesPostgres);
app.use("/ws", routesWs);
app.use("*", (req, res) => {
  if (!(req.path.startsWith("/api") || req.path.startsWith("/ws"))) {
    res.sendFile(`${__dirname}/app/index.html`);
  }
});

app.listen(process.env.PORT || 8080);
