import { getHealth } from '../api/index.js'

export const FETCH_HEALTH_REQUEST = 'FETCH_HEALTH_REQUEST';
export const FETCH_HEALTH_FAILURE = 'FETCH_HEALTH_FAILURE';
export const FETCH_HEALTH_SUCCESS = 'FETCH_HEALTH_SUCCESS';



const fetchHealthRequest = (service) => ({
	'type': FETCH_HEALTH_REQUEST,
	'payload': {'service': service}
});

export const fetchHealthFailure = (service,error) => ({
	'type': FETCH_HEALTH_FAILURE,
	'payload': {'service': service, 'error': error}
});

export const fetchHealthSuccess = (service,data) => ({
	'type': FETCH_HEALTH_SUCCESS,
	'payload': {'timestamp': new Date(), 'data': data, 'service': service}
});

export const fetchHealth = (service) => {
	return (dispatch,getStore) => {
		dispatch(fetchHealthRequest(service));
		getHealth(service)
			.then((result)=>{
				dispatch(fetchHealthSuccess(service,result));
			})
			.catch((error)=>{
				console.log(error);
				if (error.statusCode === 503){
					console.log('got 503, i.e service unaivalable');
					return dispatch(fetchHealthSuccess(service,error.error));
				} else {
					return dispatch(fetchHealthFailure(service,error));
				}
			})
	}
}