import {  getServices, getNodes } from '../api/index.js'

export const FETCH_SERVICES_REQUEST = 'FETCH_SERVICES_REQUEST';
export const FETCH_SERVICES_FAILURE = 'FETCH_SERVICES_FAILURE';
export const FETCH_SERVICES_SUCCESS = 'FETCH_SERVICES_SUCCESS';

export const FETCH_TASKS_REQUEST = 'FETCH_TASKS_REQUEST';
export const FETCH_TASKS_FAILURE = 'FETCH_TASKS_FAILURE';
export const FETCH_TASKS_SUCCESS = 'FETCH_TASKS_SUCCESS';

export const FETCH_NODES_REQUEST = 'FETCH_NODES_REQUEST';
export const FETCH_NODES_FAILURE = 'FETCH_NODES_FAILURE';
export const FETCH_NODES_SUCCESS = 'FETCH_NODES_SUCCESS';



const fetchServicesRequest = () => ({
	'type': FETCH_SERVICES_REQUEST
});

const fetchServicesFailure = (error) => ({
	'type': FETCH_SERVICES_FAILURE,
	'payload': error
});

const fetchServicesSuccess = (data) => ({
	'type': FETCH_SERVICES_SUCCESS,
	'payload': { data: data, timeStamp : new Date() }
});

export const fetchServices = () => {
	return (dispatch,getStore) => {
		dispatch(fetchServicesRequest());
		getServices()
			.then((result)=>{
				dispatch(fetchServicesSuccess(result));
			})
			.catch((error)=>{
				dispatch(fetchServicesFailure(error));
			})
	}
};

const fetchNodesRequest = () => ({
	'type': FETCH_NODES_REQUEST
});

const fetchNodesFailure = (error) => ({
	'type': FETCH_NODES_FAILURE,
	'payload': error
});

const fetchNodesSuccess = (rows) => ({
	'type': FETCH_NODES_SUCCESS,
	'payload': rows
});

export const fetchNodes = () => {
	return (dispatch,getStore) => {
		dispatch(fetchNodesRequest());
		getNodes()
			.then((result)=>{
				dispatch(fetchNodesSuccess(result));
			})
			.catch((error)=>{
				console.log(error);
				let msg = error && error.message ? error.message : 'Internal error';
				dispatch(fetchNodesFailure(msg));
			})
	}
};

