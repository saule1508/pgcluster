const express = require('express');

const router = express.Router();
const pg = require('../DAO/pg.js');

router.get('/repl_nodes', (req, res) => {
  pg.getReplNodes()
    .then(data => res.status(200).send(data))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

router.get('/stat_activity', (req, res) => {
  pg.getStatActivity()
    .then(data => res.status(200).send(data))
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.get('/pool_nodes', (req, res) => {
  pg.getPoolNodes()
    .then(data => res.status(200).send(data))
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.get('/dbstates', (req, res) => {
  pg.dbStates()
    .then(data => res.status(200).send({ result: data, timestamp: new Date() }))
    .catch((err) => {
      console.log(err);
      let msg = err.detail ? err.detail : null;
      if (!msg) {
        msg =
          `server error ${err.code ? `${err.code} - ` : ' - '}${err.errno ? err.errno : ''}`;
      }
      res.status(500).send({ message: msg, error: err });
    });
});

router.get('/replication_stats', (req, res) => {
  pg.replicationStats()
    .then(data => res.status(200).send(data))
    .catch((err) => {
      console.log('error from replicationStats');
      console.log(err);
      res.status(500).send(err);
    });
});

router.get('/backups', (req, res) => {
  const getBackups = require('../business/backup.js').getBackups;
  getBackups()
    .then(result => res.status(200).send(result))
    .catch(error => res.status(501).send(error));
});

router.get('/backups/:host/:name', (req, res) => {
  const buExists = require('../business/backup.js').backupExists;
  backupExists(req.params.host, req.params.name)
    .then(result => res.status(200).send(result))
    .catch(error => res.status(404).send(error));
});

router.get('/pgp_watchdog', (req, res) => {
  const { getPgpoolWDStatus } = require('../business/index.js');

  getPgpoolWDStatus()
    .then(data => res.status(200).send(data))
    .catch((error) => {
      if (error.message === 'watchdog disabled') {
        return res.status(503).json({ status: 503, message: 'watchdog disabled' });
      }
      return res.status(500).send(error);
    });
});

router.get('/checks', (req, res) => {
  const { getChecks } = require('../business/index.js');
  getChecks()
    .then(data => res.status(200).send(data))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

module.exports = router;