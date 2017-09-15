import {connect} from 'react-redux'  
import { fetchReplicationStats } from '../../actions'
import { getReplicationStatsSorted } from '../../reducers/index'
import { getReplNodesSorted } from '../../reducers/index'
import { getReplicationStatus } from '../../reducers/index'

import ReplicationStats from './replicationstats'

const mapStateToProps = (state) => {
  return {
    stats: getReplicationStatsSorted(state),
    repl_nodes: getReplNodesSorted(state),
    pool_nodes: state.postgres.pool_nodes.rows,
    replication_status: getReplicationStatus(state),
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
