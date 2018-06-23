import React, { Component } from 'react';
import StateUpDown from '../../../shared/components/stateupdown';
import propTypes from 'prop-types';

export const SupervisorForNode = props => {
  if (!props.node) {
    return null;
  }
  return (
    <table className="table table-condensed table-bordered">
      <thead />
      <tbody>
        {props.processes.map((el, idx) => {
          return (
            <tr key={idx}>
              <td>
                <StateUpDown color={el.state === 'RUNNING' ? 'green' : 'red'} />
              </td>
              <td>{el.process}</td>
              <td>{el.state}</td>
              <td>{el.info}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

SupervisorForNode.propTypes = {
  processes: propTypes.array.isRequired
};

export default SupervisorForNode;
