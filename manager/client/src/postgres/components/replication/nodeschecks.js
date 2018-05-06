import React, { Component } from 'react';
import StateUpDown from '../../../shared/components/stateupdown';
import SupervisorForNode from './supervisorfornode';
import RepmgrNodeChecks from './repmgrnodechecks';
import Disk from './disk';
import propTypes from 'prop-types';

const ChecksForNode = props => {
  console.log(props);
  if (!props.node) {
    return null;
  }
  return (
    <div className="col-md-4">
      <h3>Node: {props.node}</h3>
      <h5>Supervisor</h5>
      <SupervisorForNode node={props.node} processes={props.supervisor} />
      <h5>Node checks</h5>
      <RepmgrNodeChecks node={props.node} rows={props.repmgr} />
      <h5>Disk</h5>
      <Disk node={props.node} rows={props.disk} />
    </div>
  );
};

class NodesChecks extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.fetchNodesChecks();
    this.interval = setInterval(this.props.fetchNodesChecks, 5000);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  render() {
    if (this.props.error) {
      return <div className="alert alert-danger">{this.props.error}</div>;
    }
    return (
      <div className="panel panel-default">
        <div className="panel-heading">Nodes Checks</div>
        <div className="panel-body">
          {this.props.nodes.map((el, idx) => {
            return <ChecksForNode key={idx} {...el} />;
          })}
        </div>
      </div>
    );
  }
}

NodesChecks.propTypes = {
  loading: propTypes.bool,
  fetchNodesChecks: propTypes.func.isRequired,
  error: propTypes.string,
  nodes: propTypes.array.isRequired
};

export default NodesChecks;
