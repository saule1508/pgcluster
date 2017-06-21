import {connect} from 'react-redux'  
import { fetchNodes } from '../actions'
import Nodes from './Nodes'

const mapStateToProps = (state) => {
  return {
    nodes: state.docker.nodes.rows,
    loading: state.docker.nodes.loading,
    error: state.docker.nodes.error
  }
}

const mapDispatchToProps = (dispatch,state) => {
  return {
    fetchNodes: () => {
      dispatch(fetchNodes())
    }
  }
}

const NodesContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Nodes)

export default NodesContainer
