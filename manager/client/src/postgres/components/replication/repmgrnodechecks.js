import React from 'react';
import StateUpDown from '../../../shared/components/stateupdown';
import propTypes from 'prop-types';

export const RepmgrNodeChecks = props => {
  if (!props.node) {
    return null;
  }
  return (
    <table className="table table-condensed table-bordered">
      <thead />
      <tbody>
        {props.rows.map((el, idx) => {
          return (
            <tr key={idx}>
              <td>
                <StateUpDown
                  color={el.result.indexOf(' OK ') >= 0 ? 'green' : 'red'}
                />
              </td>
              <td>{el.check.replace('_', ' ')}</td>
              <td>{el.result}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

RepmgrNodeChecks.propTypes = {
  rows: propTypes.array.isRequired
};

export default RepmgrNodeChecks;
