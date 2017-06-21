import docker from '../docker/reducers';
import postgres from '../postgres/reducers';
import health from '../health/reducers';
import { combineReducers } from 'redux';



const rootReducer = combineReducers({
    'docker': docker,
    'postgres': postgres,
    'health': health
});

export default rootReducer;
