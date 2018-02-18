import React, { Component } from "react";

class PgpoolWatchDog extends Component {
  constructor(props) {
      super(props);
  }
  componentDidMount() {
    this.props.fetchPgpoolWatchDog();
    this.interval = setInterval(this.props.fetchPgpoolWatchDog, 5000);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  render() {
    console.log(this.props.pgpool_watchdog);
    return (
      <div>
        <div className="row" style={{ marginBottom: 20 }}>
          <div className="col-md-4 col-lg-4" />
          <div className="col-md-4 col-lg-4" />
        </div>
      </div>
    );
  }
}

export default PgpoolWatchDog;
