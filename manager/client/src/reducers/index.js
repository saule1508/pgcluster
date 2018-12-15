import { combineReducers } from 'redux';
import docker from '../docker/reducers';
import postgres from '../postgres/reducers';
import health from '../health/reducers';

const rootReducer = combineReducers({
  docker,
  postgres,
  health,
});

export default rootReducer;
