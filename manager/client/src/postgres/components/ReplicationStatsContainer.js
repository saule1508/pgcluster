import {connect} from 'react-redux'  
import { fetchReplicationStats } from '../actions'
import { getReplicationStatsSorted } from '../reducers/index'
import ReplicationStats from './ReplicationStats'

const mapStateToProps = (state) => {
  return {
    rows: getReplicationStatsSorted(state),
    loading: state.postgres.replication_stats.loading,
    error: state.postgres.replication_stats.error
  }
}

const mapDispatchToProps = (dispatch,state) => {
  return {
    fetchReplicationStats: () => {
      dispatch(fetchReplicationStats())
    }
  }
}

const ReplicationStatsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ReplicationStats)


export default ReplicationStatsContainer
