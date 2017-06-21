import {connect} from 'react-redux'  
import { fetchRepl, fetchReplSuccess, fetchReplFailure } from '../actions'
import Repl from './Repl'


const mapStateToProps = (state) => {
  return {
    repl_nodes: state.postgres.repl_nodes.rows,
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
