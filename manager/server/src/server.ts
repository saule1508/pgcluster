import express from "express";

const app = express();
const expressWs = require("express-ws")(app);
import routesDocker from "./routes/docker";
import routesPostgres from "./routes/postgres.js";
import routesWs from "./routes/ws.js";

app.use(express.static("app"));

app.use("/api/docker", routesDocker);
app.use("/api/postgres", routesPostgres);
app.use("/ws", routesWs);
app.use("*", (req, res) => {
  if (!(req.path.startsWith("/api") || req.path.startsWith("/ws"))) {
    res.sendfile(`${__dirname}/app/index.html`);
  }
});

app.listen(process.env.PORT || 8080);
