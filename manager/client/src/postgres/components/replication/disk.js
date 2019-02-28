import React from 'react';
import StateUpDown from '../../../shared/components/stateupdown';
import propTypes from 'prop-types';

export const Disk = props => {
  if (!props.node) {
    return null;
  }
  return (
    <table className="table table-condensed table-bordered">
      <thead>
        <tr>
          <th />
          <th>FS</th>
          <th>Total</th>
          <th>Used</th>
          <th>% used</th>
        </tr>
      </thead>
      <tbody>
        {props.rows.map((el, idx) => {
          const perc = parseInt(el.percused.replace('%', ''));
          return (
            <tr key={idx}>
              <td>
                <StateUpDown
                  color={perc < 60 ? 'green' : perc < 80 ? 'orange' : 'red'}
                />
              </td>
              <td>{el.fs}</td>
              <td>{el.kbtotal}</td>
              <td>{el.kbused}</td>
              <td>{el.percused}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

Disk.propTypes = {
  rows: propTypes.array.isRequired
};

export default Disk;
