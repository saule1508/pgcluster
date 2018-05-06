import { connect } from "react-redux";
import { fetchNodesChecks } from "../../actions";
import { getNodesChecksSorted } from "../../reducers/index";

import NodesChecks from "./nodeschecks";

const mapStateToProps = state => {
  return {
    nodes: getNodesChecksSorted(state),
    timeStamp: state.postgres.nodes_checks.timeStamp,
    loading: state.postgres.nodes_checks.loading,
    error: state.postgres.nodes_checks.error
  };
};

const mapDispatchToProps = (dispatch, state) => {
  return {
    fetchNodesChecks: () => {
      dispatch(fetchNodesChecks());
    }
  };
};

const NodesChecksContainer = connect(mapStateToProps, mapDispatchToProps)(
  NodesChecks
);

export default NodesChecksContainer;
