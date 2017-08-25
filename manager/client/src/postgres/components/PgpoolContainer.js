import {connect} from 'react-redux'  
import { fetchPgpool,fetchPgpoolSuccess, fetchPgpoolFailure } from '../actions'
import { getPoolNodesSorted } from '../reducers/index'

import Pgpool from './Pgpool'


const mapStateToProps = (state) => {
  return {
    pool_nodes: getPoolNodesSorted(state),
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
