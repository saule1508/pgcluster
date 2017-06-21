import {FETCH_HEALTH_REQUEST, FETCH_HEALTH_FAILURE, FETCH_HEALTH_SUCCESS } from '../actions'

const HEALTH_INITIAL_STATE = {
  
}

export default(state = HEALTH_INITIAL_STATE, action) => {
    let nstate = {};
    switch (action.type) {
        case FETCH_HEALTH_REQUEST:
          nstate[action.payload.service] = {'loading': true}
          return Object.assign({},state, nstate);
        case FETCH_HEALTH_FAILURE:
          nstate[action.payload.service] = {'loading': false, error: action.payload.error};
          return Object.assign({},state, nstate);
        case FETCH_HEALTH_SUCCESS:
          nstate[action.payload.service] = {'loading': false, error: null, timestamp: action.payload.timestamp, data: action.payload.data};
          return Object.assign({},state, nstate);
        default:
            return state;
    }
};
