import {connect} from 'react-redux'  
import { fetchServices } from '../actions'
import { getTasksForService, getNodeById } from '../reducers/index.js'
import Services from './Services'

const mapStateToProps = (state) => {
  return {
    services: state.docker.services,
    tasks: state.docker.tasks,
    getTasksForService: (serviceID) => {
    	return getTasksForService(state.docker,serviceID);
    },
    getNodeById: (ID) => {
      return getNodeById(state.docker,ID);
    }
  }
}

const mapDispatchToProps = (dispatch,state) => {
  return {
    fetchServices: () => {
      dispatch(fetchServices())
    }
  }
}

const ServicesContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Services)

export default ServicesContainer
