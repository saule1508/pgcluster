import {connect} from 'react-redux'  
import { fetchRepl, fetchReplSuccess, fetchReplFailure } from '../actions'
import Repl from './Repl'
import { getReplNodesSorted } from '../reducers/index.js'

const mapStateToProps = (state) => {
  return {
    repl_nodes: getReplNodesSorted(state),
    loading: state.postgres.repl_nodes.loading,
    error: state.postgres.repl_nodes.error
  }
}

const mapDispatchToProps = (dispatch,state) => {
  return {
    fetchRepl: () => {
      dispatch(fetchRepl())
    },
    fetchReplSuccess: (rows) => {
      dispatch(fetchReplSuccess(rows));
    },
    fetchReplFailure: (error) => {
      dispatch(fetchReplFailure(error));
    }
  }
}

const ReplContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Repl)


export default ReplContainer
