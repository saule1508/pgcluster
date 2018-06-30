import {connect} from 'react-redux'  
import Replication from './replication'

const mapStateToProps = (state) => {
  return {
    withWatchDog: state.postgres.pgpool_watchdog.withWatchdog,
  }
}

const mapDispatchToProps = (dispatch, state) => {
  return {
    }
};


const ReplicationContainer = connect(
  mapStateToProps,mapDispatchToProps
)(Replication)


export default ReplicationContainer
