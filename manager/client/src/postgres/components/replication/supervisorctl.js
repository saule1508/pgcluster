import React, { Component } from "react";
import StateUpDown from "../../../shared/components/stateupdown";
import propTypes from "prop-types";

const SupervisorForNode = props => {
  console.log(props);
  if (!props.node) {
    return null;
  }
  return (
    <div className="col-md-3">
      Node: {props.node}
      <table className="table table-condensed table-bordered">
        <thead />
        <tbody>
          {props.processes.map((el, idx) => {
            return (
              <tr key={idx}>
                <td>
                  <StateUpDown
                    color={el.state === "RUNNING" ? "green" : "red"}
                  />
                </td>
                <td>
                  {el.name} {el.state} {el.info}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

class SupervisorCtl extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.fetchSupervisorCtl();
    this.interval = setInterval(this.props.fetchSupervisorCtl, 5000);
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
        <div className="panel-heading">SupervisorCtl</div>
        <div className="panel-body">
          {this.props.nodes.map((el, idx) => {
            return <SupervisorForNode key={idx} {...el} />;
          })}
        </div>
      </div>
    );
  }
}

SupervisorCtl.propTypes = {
  loading: propTypes.bool,
  fetchSupervisorCtl: propTypes.func.isRequired,
  error: propTypes.string,
  nodes: propTypes.array.isRequired
};

export default SupervisorCtl;
