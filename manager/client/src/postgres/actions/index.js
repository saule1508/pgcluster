import { getDBStates, getReplicationStats, getPgpool, getRepl, getStatActivity,getBackups } from '../api/index.js'

export const FETCH_DBSTATES_REQUEST = 'FETCH_DBSTATES_REQUEST';
export const FETCH_DBSTATES_FAILURE = 'FETCH_DBSTATES_FAILURE';
export const FETCH_DBSTATES_SUCCESS = 'FETCH_DBSTATES_SUCCESS';

export const FETCH_PGPOOL_REQUEST = 'FETCH_PGPOOL_REQUEST';
export const FETCH_PGPOOL_FAILURE = 'FETCH_PGPOOL_FAILURE';
export const FETCH_PGPOOL_SUCCESS = 'FETCH_PGPOOL_SUCCESS';

export const FETCH_REPL_REQUEST = 'FETCH_REPL_REQUEST';
export const FETCH_REPL_FAILURE = 'FETCH_REPL_FAILURE';
export const FETCH_REPL_SUCCESS = 'FETCH_REPL_SUCCESS';

export const FETCH_REPLICATION_STATS_REQUEST = 'FETCH_REPLICATION_STATS_REQUEST';
export const FETCH_REPLICATION_STATS_FAILURE = 'FETCH_REPLICATION_STATS_FAILURE';
export const FETCH_REPLICATION_STATS_SUCCESS = 'FETCH_REPLICATION_STATS_SUCCESS';

export const FETCH_STAT_ACTIVITY_REQUEST = 'FETCH_STAT_ACTIVITY_REQUEST';
export const FETCH_STAT_ACTIVITY_FAILURE = 'FETCH_STAT_ACTIVITY_FAILURE';
export const FETCH_STAT_ACTIVITY_SUCCESS = 'FETCH_STAT_ACTIVITY_SUCCESS';

export const FETCH_BACKUPS_REQUEST = 'FETCH_BACKUPS_REQUEST';
export const FETCH_BACKUPS_FAILURE = 'FETCH_BACKUPS_FAILURE';
export const FETCH_BACKUPS_SUCCESS = 'FETCH_BACKUPS_SUCCESS';


const fetchDBStatesRequest = () => ({
	'type': FETCH_DBSTATES_REQUEST
});

export const fetchDBStatesFailure = (error) => ({
	'type': FETCH_DBSTATES_FAILURE,
	'payload': error
});

export const fetchDBStatesSuccess = (rows) => ({
	'type': FETCH_DBSTATES_SUCCESS,
	'payload': rows
});

export const fetchDBStates = () => {
	return (dispatch,getStore) => {
		dispatch(fetchDBStatesRequest());
		getDBStates()
			.then((result)=>{
				dispatch(fetchDBStatesSuccess(result.rows));
			})
			.catch((error)=>{
				let errorStr = (error && error.detail) ? error.detail : 'Internal error';
				if (error && error.hint){
					errorStr += ' (hint: ' + error.hint + ')';
				}
				dispatch(fetchDBStatesFailure(errorStr));
			})
	}
};

const fetchReplicationStatsRequest = () => ({
	'type': FETCH_REPLICATION_STATS_REQUEST
});

export const fetchReplicationStatsFailure = (error) => ({
	'type': FETCH_REPLICATION_STATS_FAILURE,
	'payload': error
});

export const fetchReplicationStatsSuccess = (data) => ({
	'type': FETCH_REPLICATION_STATS_SUCCESS,
	'payload': {data: data, timeStamp: new Date()}
});

export const fetchReplicationStats = () => {
	return (dispatch,getStore) => {
		dispatch(fetchReplicationStatsRequest());
		getReplicationStats()
			.then((result)=>{
				dispatch(fetchReplicationStatsSuccess(result));
			})
			.catch((error)=>{
				let errorStr = (error && error.detail) ? error.detail : 'Internal error';
				if (error && error.hint){
					errorStr += ' (hint: ' + error.hint + ')';
				}
				dispatch(fetchReplicationStatsFailure(errorStr));
			})
	}
};

const fetchPgpoolRequest = () => ({
	'type': FETCH_PGPOOL_REQUEST
});

export const fetchPgpoolFailure = (error) => ({
	'type': FETCH_PGPOOL_FAILURE,
	'payload': error
});

export const fetchPgpoolSuccess = (rows) => ({
	'type': FETCH_PGPOOL_SUCCESS,
	'payload': rows
});

export const fetchPgpool = () => {
	return (dispatch,getStore) => {
		dispatch(fetchPgpoolRequest());
		getPgpool()
			.then((result)=>{
				dispatch(fetchPgpoolSuccess(result.rows));
			})
			.catch((error)=>{
				let errorStr = (error && error.detail) ? error.detail : 'Internal error';
				if (error && error.hint){
					errorStr += ' (hint: ' + error.hint + ')';
				}
				dispatch(fetchPgpoolFailure(errorStr));
			})
	}
};

const fetchReplRequest = () => ({
	'type': FETCH_REPL_REQUEST
});

export const fetchReplFailure = (error) => ({
	'type': FETCH_REPL_FAILURE,
	'payload': error
});

export const fetchReplSuccess = (rows) => ({
	'type': FETCH_REPL_SUCCESS,
	'payload': rows
});

export const fetchRepl = () => {
	return (dispatch,getStore) => {
		dispatch(fetchReplRequest());
		getRepl()
			.then((result)=>{
				dispatch(fetchReplSuccess(result.rows));
			})
			.catch((error)=>{
				dispatch(fetchReplFailure(error));
			})
	}
};

const fetchStatActivityRequest = () => ({
	'type': FETCH_STAT_ACTIVITY_REQUEST
});

export const fetchStatActivityFailure = (error) => ({
	'type': FETCH_STAT_ACTIVITY_FAILURE,
	'payload': error
});

export const fetchStatActivitySuccess = (rows) => ({
	'type': FETCH_STAT_ACTIVITY_SUCCESS,
	'payload': {'rows': rows, timeStamp: new Date()}
});

export const fetchStatActivity = () => {
	return (dispatch,getStore) => {
		dispatch(fetchStatActivityRequest());
		getStatActivity()
			.then((result)=>{
				dispatch(fetchStatActivitySuccess(result.rows));
			})
			.catch((error)=>{
				let errorStr = (error && error.detail) ? error.detail : 'Internal error';
				if (error && error.hint){
					errorStr += ' (hint: ' + error.hint + ')';
				}
				dispatch(fetchStatActivityFailure(errorStr));
			})
	}
};

const fetchBackupsRequest = () => ({
                'type': FETCH_BACKUPS_REQUEST
})

const fetchBackupsFailure = (error) => ({
                'type': FETCH_BACKUPS_FAILURE,
                'payload': error
})

const fetchBackupsSuccess = (rows) => ({
                'type': FETCH_BACKUPS_SUCCESS,
                'payload': rows
})

export const fetchBackups = () => {
        return (dispatch,getStore) => {
                dispatch(fetchBackupsRequest());
                getBackups()
                        .then((result)=>{
                                dispatch(fetchBackupsSuccess(result));
                        })
                        .catch((error)=>{
                                dispatch(fetchBackupsFailure(error));
                        })
        }
};
