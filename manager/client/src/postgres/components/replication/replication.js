/* eslint-disable linebreak-style */
import React from "react";
import PropTypes from 'prop-types';

import DBStatesContainer from "../DBStatesContainer";
import PgpoolContainer from "../PgpoolContainer";
import ReplContainer from "../ReplContainer";
import ReplicationStatsContainer from "./replicationstatscontainer";
//import SupervisorCtlContainer from "./supervisorctlcontainer";
import NodesChecksContainer from "./nodescheckscontainer";
import PgpoolWatchDogContainer from "./pgpool_watchdogcontainer";

const Replication = ({ withWatchDog }) => (
  <div>
    {withWatchDog ? (
      <div className="row" style={{ marginBottom: 20, marginTop: 20 }}>
        <div className="col-md-12">
          <PgpoolWatchDogContainer />
        </div>
      </div>
    ) : (
        ''
      )}

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

Replication.propTypes = {
  withWatchDog: PropTypes.bool,
};

Replication.defaultProps = {
  withWatchDog: false,
};

export default Replication;
