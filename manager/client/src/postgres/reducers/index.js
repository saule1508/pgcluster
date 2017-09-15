import { combineReducers } from 'redux'

import {
  FETCH_DBSTATES_REQUEST, FETCH_DBSTATES_FAILURE, FETCH_DBSTATES_SUCCESS,
  FETCH_REPLICATION_STATS_REQUEST, FETCH_REPLICATION_STATS_FAILURE, FETCH_REPLICATION_STATS_SUCCESS,
  FETCH_PGPOOL_REQUEST, FETCH_PGPOOL_FAILURE, FETCH_PGPOOL_SUCCESS,
  FETCH_REPL_REQUEST, FETCH_REPL_FAILURE, FETCH_REPL_SUCCESS,
  FETCH_STAT_ACTIVITY_REQUEST,FETCH_STAT_ACTIVITY_FAILURE,FETCH_STAT_ACTIVITY_SUCCESS } from '../actions'

import {FETCH_BACKUPS_REQUEST, FETCH_BACKUPS_FAILURE, FETCH_BACKUPS_SUCCESS } from '../actions'


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

const REPLICATION_STATS_INITIAL_STATE = {
  loading: false,
  rows: [],
  error: null,
  timeStamp: null
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

export const getReplicationStatsSorted = ( state ) => {
  return state.postgres.replication_stats.rows.sort((el1,el2)=>{
    return el1.idx - el2.idx
  })
}


export const getReplicationStatus = ( state ) => {
  let backends = {};
  let repl_nodes = getReplNodesSorted(state);
  repl_nodes.forEach((el)=>{
    if (! backends[el.name]){
      backends[el.name] = {}
    }
    backends[el.name].id = el.id;
    backends[el.name].role = el.type;
    backends[el.name].slot_name = el.slot_name;
    backends[el.name].active = el.active;
  });
  let stats = getReplicationStatsSorted(state);
  stats.forEach((el)=>{
    if (! backends[el.host]){
      backends[el.host] = {}
    }
    backends[el.host].data = el.data || null;
    backends[el.host].status = el.status;
    backends[el.host].status = el.status;
    backends[el.host].in_recovery = el.in_recovery;
  })
  state.postgres.pool_nodes.rows.forEach((el)=>{
    if (! backends[el.hostname]){
      backends[el.hostname] = {}
    }
    backends[el.hostname].pgpool_node_id = el.node_id;
    backends[el.hostname].pgpool_status = el.status;
    backends[el.hostname].pgpool_role = el.role;
    backends[el.hostname].pgpool_replication_delay = el.replication_delay;
  })
  return backends;
}

const replication_stats = (state = REPLICATION_STATS_INITIAL_STATE, action) => {
  switch (action.type) {
    case FETCH_REPLICATION_STATS_REQUEST:
      return Object.assign({},state, {'loading': true});
    case FETCH_REPLICATION_STATS_FAILURE:
      return Object.assign({},state, {'loading': false, 'error': action.payload});
    case FETCH_REPLICATION_STATS_SUCCESS:
      return Object.assign({},state, 
        {loading: false, error: null, rows: action.payload.data, timeStamp: action.payload.timeStamp});
    default:
      return state;
  }
}

export const getReplNodesSorted  = (state) => {
  return state.postgres.repl_nodes.rows.sort((el1,el2)=>{
    return el1.id - el2.id 
  })
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

export const getPoolNodesSorted  = (state) => {
  return state.postgres.pool_nodes.rows.sort((el1,el2)=>{
    return parseInt(el1.node_id) - parseInt(el2.node_id) 
  })
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

export const getHostsFromBackups = (state) => {
  let hosts = [];
  for (var h in state.postgres.backups.data){
    hosts.push(h);
  }
  return hosts.sort((el1,el2)=>{ return (el1 < el2) ? -1 : ( (el1 === el2) ? 0 : 1)});
}

let backups = (state = {loading: false, error: null, data: {}}, action) => {
  switch (action.type) {
    case FETCH_BACKUPS_REQUEST:
      return Object.assign({},state, {'loading': true});
    case FETCH_BACKUPS_FAILURE:
      return Object.assign({},state, {'loading': false, 'error': action.payload});
    case FETCH_BACKUPS_SUCCESS:
      return Object.assign({},state, {'loading': false, 'error': null, data: action.payload});
    default:
      return state;
  }
}


export default combineReducers({
  pool_nodes: pool_nodes,
  repl_nodes: repl_nodes,
  stat_activity: stat_activity,
  replication_stats: replication_stats,
  dbstates: dbstates,
  backups: backups
})
