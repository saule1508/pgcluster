import React from 'react';
import { shallow } from 'enzyme';

import StateUpDown from './stateupdown.js';

describe('StateUpDown', () => {
  it('should render correctly', () => {
    const expectedStyle = {
      "color": "orange",
      "fontWeight": "bold",
    }
    const component = shallow(<StateUpDown color="orange" />);
  
    expect(component).toMatchSnapshot();
    /* implementation detail ?
    expect(component.text()).toEqual('X');
    expect(component.prop('style')).toEqual(expectedStyle);
    */
  });
});