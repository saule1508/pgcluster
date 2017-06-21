import {FETCH_SERVICES_REQUEST, FETCH_SERVICES_FAILURE, FETCH_SERVICES_SUCCESS,
				FETCH_NODES_REQUEST, FETCH_NODES_FAILURE, FETCH_NODES_SUCCESS	} from '../actions'

const DOCKER_INITIAL_STATE = {
	'services': {'loading': false, 'error': null, 'rows': []},
	'tasks': {'loading': false, 'error': null, 'rows': []},
	'images': {'loading': false, 'error': null, 'rows': []},
	'nodes': {'loading': false, 'error': null, rows: []}
}

export const getTasksForService = (state,serviceID)=>{
	return state.tasks.rows.filter((el)=>{
		return (el.ServiceID === serviceID);
	});
}

export const getNodeById = (state,ID)=>{
	return state.nodes.rows.find((el)=>{
		return (el.ID === ID);
	});
}

export default(state = DOCKER_INITIAL_STATE, action) => {
		let nodes;
    let services;
    let tasks;
    switch (action.type) {
        case FETCH_SERVICES_REQUEST:
          services = Object.assign({},state.services, {'loading': true});
          tasks = Object.assign({},state.tasks, {'loading': true});
          return Object.assign({},state, {'services': services, 'tasks': tasks});
        case FETCH_SERVICES_FAILURE:
          services = Object.assign({},state.services, {'loading': false, 'error': action.payload || 'fatal error'});
          tasks = Object.assign({},state.tasks, {'loading': false, 'error': action.payload || 'fatal error'});
          return Object.assign({},state, {'services': services, 'tasks': tasks});
        case FETCH_SERVICES_SUCCESS:
          services = Object.assign({},state.services, {'loading': false,'timeStamp': action.payload.timeStamp, 'rows': action.payload.data.services});
          tasks = Object.assign({},state.tasks, {'loading': false, 'rows': action.payload.data.tasks});
          return Object.assign({},state, {'services': services, 'tasks': tasks});
        case FETCH_NODES_REQUEST:
        	nodes = Object.assign({},state.nodes, {'loading': true});
          return Object.assign({},state, {'nodes': nodes});
        case FETCH_NODES_FAILURE:
        	nodes = Object.assign({},state.nodes, {'loading': false, 'error': action.payload || 'fatal error'});
          return Object.assign({},state, {'nodes': nodes});
        case FETCH_NODES_SUCCESS:
        	nodes = Object.assign({},state.nodes, {'loading': false, 'error': null, 'rows': action.payload});
          return Object.assign({},state, {'nodes': nodes});
        default:
            return state;
    }
};
