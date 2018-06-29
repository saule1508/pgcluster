import {connect} from 'react-redux'  
import Replication from './replication'

const mapStateToProps = (state) => {
  return {
    withWatchDog: state.postgres.pgp_watchdog.withWatchDog,
  }
}

const ReplicationStatsContainer = connect(
  mapStateToProps,
)(Replication)


export default ReplicationContainer
