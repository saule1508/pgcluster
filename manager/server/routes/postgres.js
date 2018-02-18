var express = require("express");
var router = express.Router();
let pg = require("../DAO/pg.js");

router.get("/repl_nodes", function(req, res) {
  pg
    .getReplNodes()
    .then(data => {
      return res.status(200).send(data);
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.get("/stat_activity", (req, res) => {
  pg
    .getStatActivity()
    .then(data => {
      return res.status(200).send(data);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.get("/pool_nodes", (req, res) => {
  pg
    .getPoolNodes()
    .then(data => {
      return res.status(200).send(data);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.get("/dbstates", (req, res) => {
  pg
    .dbStates()
    .then(data => {
      return res.status(200).send({ result: data, timestamp: new Date() });
    })
    .catch(err => {
      console.log(err);
      let msg = err.detail ? err.detail : null;
      if (!msg) {
        msg =
          "server error " +
          (err.code ? err.code + " - " : " - ") +
          (err.errno ? err.errno : "");
      }
      res.status(500).send({ message: msg, error: err });
    });
});

router.get("/replication_stats", (req, res) => {
  pg
    .replicationStats()
    .then(data => {
      return res.status(200).send(data);
    })
    .catch(err => {
      console.log("error from replicationStats");
      console.log(err);
      res.status(500).send(err);
    });
});

router.get("/backups", (req, res) => {
  const getBackups = require("../business/backup.js").getBackups;
  getBackups()
    .then(result => {
      return res.status(200).send(result);
    })
    .catch(error => {
      return res.status(501).send(error);
    });
});

router.get("/pgp_watchdog", (req, res) => {
  const dblist = require("../config/config.js").pg;
  const getPgpoolWDStatusFromDB = require("../business/index")
    .getPgpoolWDStatusFromDB;
  let result;
  let response;
  let done = 0;

  dblist.some((el, idx) => {
    console.log("doing " + el.host);
    result = getPgpoolWDStatusFromDB(el.host)
      .then(data => {
        console.log("then for " + el.host);
        if (!done) {
          done++;
          return res.status(200).send(data);
        }
      })
      .catch(error => {
        if (done === dblist.length) {
          return res.status(500).send(error);
        }
      });
  });
});

module.exports = router;
