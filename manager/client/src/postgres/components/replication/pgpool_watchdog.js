import React, { Component } from "react";

const PgpoolNode = ( {idx, host_name,delegate_ip,status_name} ) => {
  return (
    <div className="col-md-3" style={{marginTop: 10}} >
      <table className="table table-condensed table-bordered">
        <thead>
        </thead>
        <tbody>
          <tr>
            <td>Index</td><td>{idx}</td>
          </tr>
          <tr>
            <td>Host name</td><td>{host_name}</td>
          </tr>
          <tr>
            <td>Delegate IP</td><td>{delegate_ip}</td>
          </tr>
          <tr className={status_name === 'MASTER' ? 'success' : 
            status_name === 'STANDBY' ? '' : 'danger'}>
            <td>Status</td><td>{status_name}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

class PgpoolWatchDog extends Component {
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
    let nodeSorted = this.props.pgpool_watchdog.nodes.sort((a,b)=>{
      if (a.host_name < b.host_name){
        return -1;
      }
      if (a.host_name > b.host_name){
        return 1;
      }
      return 0
    })
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          PGPOOL WatchDog 
        </div>
        <div className="panel-body">
          Master: {this.props.pgpool_watchdog.master_host_name}
          <br/>Quorum: {this.props.pgpool_watchdog.quorum_state} 
          <br/>VIP up on local node: {this.props.pgpool_watchdog.vip_up_on_local_node} 
          <div className="row">
            {nodeSorted.map((el,idx)=>{
              return (
              <PgpoolNode key={el.idx} {...el} />)
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default PgpoolWatchDog;
