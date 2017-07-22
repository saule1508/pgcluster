import { combineReducers } from 'redux'

import {
  FETCH_DBSTATES_REQUEST, FETCH_DBSTATES_FAILURE, FETCH_DBSTATES_SUCCESS,
  FETCH_PGPOOL_REQUEST, FETCH_PGPOOL_FAILURE, FETCH_PGPOOL_SUCCESS,
  FETCH_REPL_REQUEST, FETCH_REPL_FAILURE, FETCH_REPL_SUCCESS,
  FETCH_STAT_ACTIVITY_REQUEST,FETCH_STAT_ACTIVITY_FAILURE,FETCH_STAT_ACTIVITY_SUCCESS } from '../actions'

const REPL_NODES_INITIAL_STATE = {
  loading: false, 
  error: null, 
  rows:[] 
}
const POOL_NODES_INITIAL_STATE = {
  loading: false, 
  error: null, 
  rows:[] 
}
const STAT_ACTIVITY_INITIAL_STATE = {
  loading: false, 
  error: null, 
  timeStamp: null, 
  rows: []
}

export const getDBStatesSorted = ( state ) => {
  return state.postgres.dbstates.rows.sort((el1,el2)=>{
    return el1.idx - el2.idx
  })
}

const dbstates = (state = {loading: false, error: null, rows: []}, action) => {
  switch (action.type) {
    case FETCH_DBSTATES_REQUEST:
      return Object.assign({},state, {'loading': true});
    case FETCH_DBSTATES_FAILURE:
      return Object.assign({},state, {'loading': false, 'error': action.payload});
    case FETCH_DBSTATES_SUCCESS:
      return Object.assign({},state, {'loading': false, 'error': null, 'rows': action.payload});
    default:
      return state;
  }
}


const repl_nodes = (state = REPL_NODES_INITIAL_STATE, action) => {
  switch (action.type) {
    case FETCH_REPL_REQUEST:
      return Object.assign({},state, {'loading': true});
    case FETCH_REPL_FAILURE:
      return Object.assign({},state, {'loading': false, 'error': action.payload});
    case FETCH_REPL_SUCCESS:
      return Object.assign({},state, {'loading': false, 'error': null, 'rows': action.payload});
    default:
      return state;
  }
}

const pool_nodes = (state = POOL_NODES_INITIAL_STATE, action) => {
  switch (action.type) {
    case FETCH_PGPOOL_REQUEST:
      return Object.assign({},state, {'loading': true});
    case FETCH_PGPOOL_FAILURE:
      return Object.assign({},state, {'loading': false, 'error': action.payload});
    case FETCH_PGPOOL_SUCCESS:
      return Object.assign({},state, {'loading': false, 'error': null, 'rows': action.payload});
    default:
      return state;
  }

}

const stat_activity = (state = STAT_ACTIVITY_INITIAL_STATE, action) => {
  switch (action.type) {
    case FETCH_STAT_ACTIVITY_REQUEST:
      return Object.assign({},state,{'loading': true});
    case FETCH_STAT_ACTIVITY_FAILURE:
      return Object.assign({},state,{'loading': false,error: action.payload});
    case FETCH_STAT_ACTIVITY_SUCCESS:
      return Object.assign({},state,
              {'loading': false,error: null, timeStamp: action.payload.timeStamp, rows: action.payload.rows});
    default:
      return state;
  }
};

export default combineReducers({
  pool_nodes: pool_nodes,
  repl_nodes: repl_nodes,
  stat_activity: stat_activity,
  dbstates: dbstates
})
