import {connect} from 'react-redux'  
import { fetchStatActivity } from '../actions'
import StatActivity from './statactivity'


const mapStateToProps = (state) => {
  return {
    rows: state.postgres.stat_activity.rows,
    loading: state.postgres.stat_activity.loading,
    error: state.postgres.stat_activity.error,
    timeStamp: state.postgres.stat_activity.timeStamp
  }
}

const mapDispatchToProps = (dispatch,state) => {
  return {
    fetchStatActivity: () => {
      dispatch(fetchStatActivity())
    }
  }
}

const StatActivityContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(StatActivity)


export default StatActivityContainer
