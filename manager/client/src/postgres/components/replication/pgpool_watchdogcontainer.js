import { connect } from "react-redux";
import { fetchPgpoolWatchDog } from "../../actions";

import PgpoolWatchDog from "./pgpool_watchdog";

const mapStateToProps = state => {
  return {
    pgpool_watchdog: state.postgres.pgpool_watchdog,
    loading: state.postgres.pgpool_watchdog.loading,
    error: state.postgres.pgpool_watchdog.error
  };
};

const mapDispatchToProps = (dispatch, state) => {
  return {
    fetchPgpoolWatchDog: () => {
      dispatch(fetchPgpoolWatchDog());
    }
  };
};

const PgpoolWatchDogContainer = connect(mapStateToProps, mapDispatchToProps)(
  PgpoolWatchDog
);

export default PgpoolWatchDogContainer;
