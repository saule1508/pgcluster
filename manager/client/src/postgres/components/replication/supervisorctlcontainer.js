import { connect } from "react-redux";
import { fetchSupervisorCtl } from "../../actions";
import { getSupervisorCtlSorted } from "../../reducers/index";

import SupervisorCtl from "./supervisorctl";

const mapStateToProps = state => {
  return {
    nodes: getSupervisorCtlSorted(state),
    timeStamp: state.postgres.supervisorctl.timeStamp,
    loading: state.postgres.supervisorctl.loading,
    error: state.postgres.supervisorctl.error
  };
};

const mapDispatchToProps = (dispatch, state) => {
  return {
    fetchSupervisorCtl: () => {
      dispatch(fetchSupervisorCtl());
    }
  };
};

const SupervisorCtlContainer = connect(mapStateToProps, mapDispatchToProps)(
  SupervisorCtl
);

export default SupervisorCtlContainer;
