const bus_health = service => {
  const request = require("request-promise");
  return request
    .get({ uri: "http://" + service + ":8080/health", json: true })
    .then(response => {
      console.log("in then");
      return response;
    })
    .catch(error => {
      console.log("in catch");
      throw error;
    });
};

const formatPgpoolWD = arr => {
  let result = {};
  let currentItem;
  let nodeIndex = -1;
  let nodeArray = [];
  arr.forEach(el => {
    if (el.startsWith("Watchdog Cluster Information")) {
      currentItem = "wd_cluster_info";
    }
    if (el.startsWith("Watchdog Node Information")) {
      currentItem = "wd_node_info";
    }
    if (currentItem === "wd_node_info" && el.startsWith("Node Name")) {
      nodeIndex++;
      nodeArray.push({ idx: nodeIndex });
    }
    line = el.split(":");
    if (line.length !== 2) {
      return;
    }
    let k = line[0]
      .trim()
      .toLowerCase()
      .replace(/ /g, "_");
    if (currentItem === "wd_node_info") {
      nodeArray[nodeIndex][k] = line[1].trim().replace(",", "");
    } else {
      result[k] = line[1].trim().replace(",", "");
    }
  });
  result["nodes"] = nodeArray;
  return result;
};

const getFromSSH = (dbhost, args) => {
  const { spawn } = require("child_process");

  //  const pools = require('../config/pgpool').pools;
  //  const getFilesForHost = require('./utils.js').getFilesForHost;
  //  const directory = '/u02/backup';
  return new Promise((resolve, reject) => {
    let response = "";
    const cmdArgs = [
      "-p",
      "222",
      "-o",
      "StrictHostKeyChecking=no",
      "-o",
      "UserKnownHostsFile=/dev/null",
      `postgres@${dbhost}`,
      "-C"
    ].concat(args);

    const shell = spawn("ssh", cmdArgs);
    shell.stdout.on("data", data => {
      response = `${response}${data.toString()}`;
    });
    shell.stderr.on("data", data => {
      console.log(`got error ${data.toString()}`);
    });
    shell.on("close", code => {
      console.log(`shell exited with code ${code}`);
      if (code === 0) {
        resolve({ node: dbhost, rows: response.split("\n") });
      } else {
        reject({ error: code });
      }
    });
    shell.on("error", error => {
      console.log(`spawn error ${error}`);
    });
  });
};

const getPgpoolWDStatusFromDB = dbhost => {
  const { spawn } = require("child_process");

  //  const pools = require('../config/pgpool').pools;
  //  const getFilesForHost = require('./utils.js').getFilesForHost;
  //  const directory = '/u02/backup';
  return new Promise((resolve, reject) => {
    let response = "";
    const cmdArgs = [
      "-p",
      "222",
      "-o",
      "StrictHostKeyChecking=no",
      "-o",
      "UserKnownHostsFile=/dev/null",
      `postgres@${dbhost}`,
      "-C",
      "pcp_watchdog_info",
      "-h",
      "pgpool",
      "-p",
      "9898",
      "-w",
      "-v"
    ];
    const shell = spawn("ssh", cmdArgs);
    shell.stdout.on("data", data => {
      response = `${response}${data.toString()}`;
    });
    shell.stderr.on("data", data => {
      console.log(`got error ${data.toString()}`);
    });
    shell.on("close", code => {
      console.log(`shell exited with code ${code}`);
      if (code === 0) {
        resolve(formatPgpoolWD(response.split("\n")));
      } else {
        reject({ error: code });
      }
    });
    shell.on("error", error => {
      console.log(`spawn error ${error}`);
    });
  });
};

const getPgpoolWDStatus = async () => {
  const dblist = require("../config/config.js").pg;
  let response;
  let done = false;
  for (var i = 0; i < dblist.length && !done; i++) {
    try {
      let result = await getPgpoolWDStatusFromDB(dblist[i].host);
      done = true;
      result.node_fetched_from = dblist[i].host;
      response = result;
    } catch (e) {
      console.log(e);
      response = e;
    }
  }
  return response;
};

const getSupervisorCtl = async () => {
  const dblist = require("../config/config.js").pg;
  let response = [];
  for (var i = 0; i < dblist.length; i++) {
    try {
      let result = await getFromSSH(dblist[i].host, [
        "sudo",
        "/usr/bin/supervisorctl",
        "status",
        "all"
      ]);
      let processes = result.rows.map((el, idx) => {
        let elem = el.replace(/\s\s+/g, " ").split(" ");
        if (elem[0]) {
          return {
            name: elem[0],
            state: elem[1],
            info: el.substr(el.indexOf("pid"))
          };
        }
      });
      response.push({
        node: result.node,
        processes: processes.filter(el => {
          if (el) {
            return el;
          }
        })
      });
    } catch (e) {
      console.log(e);
      response.push(e);
    }
  }
  return response;
};

const getRepmgrNodesCheck = async () => {
  const dblist = require("../config/config.js").pg;
  let response = [];
  for (var i = 0; i < dblist.length; i++) {
    try {
      let result = await getFromSSH(dblist[i].host, [
        "repmgr",
        "-f",
        "/etc/repmgr/10/repmgr.conf",
        "node",
        "check"
      ]);
      let r = result.rows.map((el, idx) => {
        return el.replace(/\t/g, "");
      });
      response.push({
        node: result.node,
        checks: r.filter((el, idx) => {
          if (idx > 0 && el) {
            return el;
          }
        })
      });
    } catch (e) {
      console.log(e);
      response.push(e);
    }
  }
  return response;
};

module.exports = {
  bus_health: bus_health,
  getPgpoolWDStatus: getPgpoolWDStatus,
  getSupervisorCtl: getSupervisorCtl,
  getRepmgrNodesCheck: getRepmgrNodesCheck
};
