import React from 'react';
import PropTypes from 'prop-types';

const StateUpDown = ({ color }) => (
  <div style={{ fontWeight: 'bold', color: color }}>
    {color === 'green' ? 'V' : 'X'}
  </div>
);

StateUpDown.propTypes = {
  color: PropTypes.oneOf(['green', 'yellow', 'red'])
};

export default StateUpDown;
