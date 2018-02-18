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
      "/usr/pgpool-10/bin/pcp_watchdog_info",
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
/*
module.exports = {
  getPgpoolWDStatus: getBackups
}
*/

module.exports = {
  bus_health: bus_health,
  getPgpoolWDStatusFromDB: getPgpoolWDStatusFromDB
};
