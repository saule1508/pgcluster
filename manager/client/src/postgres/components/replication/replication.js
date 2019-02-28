import React, { Component } from "react";
import propTypes from 'prop-types';

import DBStatesContainer from "../DBStatesContainer.js";
import PgpoolContainer from "../PgpoolContainer.js";
import ReplContainer from "../ReplContainer.js";
import ReplicationStatsContainer from "./replicationstatscontainer.js";
//import SupervisorCtlContainer from "./supervisorctlcontainer.js";
import NodesChecksContainer from "./nodescheckscontainer.js";
import PgpoolWatchDogContainer from "./pgpool_watchdogcontainer.js";
class Replication extends Component {

  render() {
    console.log(this.props);
    return (
      <div>
        {this.props.withWatchDog ? (
          <div className="row" style={{ marginBottom: 20, marginTop: 20 }}>
            <div className="col-md-12">
              <PgpoolWatchDogContainer />
            </div>
          </div>) : ''
        }
        
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
            <NodesChecksContainer />
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

Replication.propTypes = {
  withWatchdog: propTypes.bool
}
Replication.defaultProps = {
  withWatchDog: true
}
export default Replication;
