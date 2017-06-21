import {FETCH_PGPOOL_REQUEST, FETCH_PGPOOL_FAILURE, FETCH_PGPOOL_SUCCESS,
        FETCH_REPL_REQUEST, FETCH_REPL_FAILURE, FETCH_REPL_SUCCESS,
        FETCH_STAT_ACTIVITY_REQUEST,FETCH_STAT_ACTIVITY_FAILURE,FETCH_STAT_ACTIVITY_SUCCESS } from '../actions'

const POSTGRES_INITIAL_STATE = {
  'loading': false,
  'repl_nodes': {'loading': false, 'error': null, rows:[] },
  'pool_nodes': {'loading': false, 'error': null, rows:[]},
  'stat_activity': {'loading': false, error: null, timeStamp: null, rows: []}

}

export default(state = POSTGRES_INITIAL_STATE, action) => {
    let repl_nodes;
    let pool_nodes;
    let stat_activity;
    switch (action.type) {
        case FETCH_REPL_REQUEST:
          repl_nodes = Object.assign({},state.repl_nodes, {'loading': true});
          return Object.assign({},state, {'repl_nodes': repl_nodes});
        case FETCH_REPL_FAILURE:
          repl_nodes = Object.assign({},state.repl_nodes, {'loading': false, 'error': action.payload});
          return Object.assign({},state, {'repl_nodes': repl_nodes});
        case FETCH_REPL_SUCCESS:
          repl_nodes = Object.assign({},state.repl_nodes, {'loading': false, 'error': null, 'rows': action.payload});
          return Object.assign({},state, {'repl_nodes': repl_nodes});
        case FETCH_PGPOOL_REQUEST:
          pool_nodes = Object.assign({},state.pool_nodes, {'loading': true});
          return Object.assign({},state, {'pool_nodes': pool_nodes});
        case FETCH_PGPOOL_FAILURE:
          pool_nodes = Object.assign({},state.pool_nodes, {'loading': false, 'error': action.payload});
          return Object.assign({},state, {'pool_nodes': pool_nodes});
        case FETCH_PGPOOL_SUCCESS:
          pool_nodes = Object.assign({},state.pool_nodes, {'loading': false, 'error': null, 'rows': action.payload});
          return Object.assign({},state, {'pool_nodes': pool_nodes});
        case FETCH_STAT_ACTIVITY_REQUEST:
          stat_activity = Object.assign({},state.stat_activity,{'loading': true});
          return Object.assign({},state, {'stat_activity': stat_activity});
        case FETCH_STAT_ACTIVITY_FAILURE:
          stat_activity = Object.assign({},state.stat_activity,{'loading': false,error: action.payload});
          return Object.assign({},state, {'stat_activity': stat_activity});
        case FETCH_STAT_ACTIVITY_SUCCESS:
          stat_activity = Object.assign({},state.stat_activity,
              {'loading': false,error: null, timeStamp: action.payload.timeStamp, rows: action.payload.rows});
          return Object.assign({},state, {'stat_activity': stat_activity});
        default:
            return state;
    }
};
