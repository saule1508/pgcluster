import {connect} from 'react-redux'  
import { fetchPgpool,fetchPgpoolSuccess, fetchPgpoolFailure } from '../actions'
import Pgpool from './Pgpool'


const mapStateToProps = (state) => {
  return {
    pool_nodes: state.postgres.pool_nodes.rows,
    loading: state.postgres.pool_nodes.loading,
    error: state.postgres.pool_nodes.error
  }
}

const mapDispatchToProps = (dispatch,state) => {
  return {
    fetchPgpool: () => {
      dispatch(fetchPgpool())
    },
    fetchPgpoolSuccess: (rows) => {
      dispatch(fetchPgpoolSuccess(rows))
    },
    fetchPgpoolFailure: (error) => {
      dispatch(fetchPgpoolFailure(error))
    }}
}

const PgpoolContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Pgpool)


export default PgpoolContainer
