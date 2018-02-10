import React, { Component } from "react";
import DBStatesContainer from "../DBStatesContainer.js";
import PgpoolContainer from "../PgpoolContainer.js";
import ReplContainer from "../ReplContainer.js";
import ReplicationStatsContainer from "./replicationstatscontainer.js";

class Replication extends Component {
  render() {
    return (
      <div>
        <div className="row" style={{ marginBottom: 20, marginTop: 20 }}>
          <div className="col-md-4 col-lg-4">
            <DBStatesContainer />
          </div>
          <div className="col-md-4 col-lg-4">
            <ReplContainer /> 
          </div>
          <div className="col-md-4 col-lg-4">
            <PgpoolContainer />
          </div>
        </div>
        <div className="row" style={{ marginBottom: 20, marginTop: 20 }}>
          <div className="col-md-12">
            <ReplicationStatsContainer />
          </div>
        </div>
      </div>
    );
  }
}

export default Replication;
