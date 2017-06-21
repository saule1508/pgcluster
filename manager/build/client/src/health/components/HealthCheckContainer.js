import {connect} from 'react-redux'  
import { fetchHealth } from '../actions'
import HealthCheck from './HealthCheck'

const mapStateToProps = (state, ownProps) => {
  return {
    service: ownProps.service,
    health: state.health[ownProps.service]
  }
}

const mapDispatchToProps = (dispatch,ownProps ) => {
  return {
    fetchHealth: () => {
      dispatch(fetchHealth(ownProps.service))
    }
  }
}

const HealthCheckContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(HealthCheck)


export default HealthCheckContainer
/*



import {connect} from 'react-redux'  
import { fetchHealth } from '../actions'
import HealthCheck from './HealthCheck'

const mapStateToProps = (state) => {
  return {
    'health': state.health
  }
}

const mapDispatchToProps = (dispatch,state) => {
  return {
    fetchHealth: () => {
      dispatch(fetchHealth())
    }
}

const HealthCheckContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(HealthCheck)

export default HealthCheckContainer
*/
