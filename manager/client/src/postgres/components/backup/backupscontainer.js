import {connect} from 'react-redux'  
import { fetchBackups } from '../../actions'
import { getHostsFromBackups } from '../../reducers'
import Backups from './backups'



const mapStateToProps = (state) => {
  return {
    data: state.postgres.backups.data,
    hosts: getHostsFromBackups(state),
    loading: state.postgres.backups.loading,
    error: state.postgres.backups.error
  }
}

const mapDispatchToProps = (dispatch,state) => {
  return {
    fetchBackups: () => {
      return dispatch(fetchBackups())
    }
  }
}

const BackupsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Backups)


export default BackupsContainer
