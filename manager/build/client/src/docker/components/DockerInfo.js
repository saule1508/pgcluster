import React , { Component } from 'react'
import { getDockerInfo } from '../api/index.js'

const STYLE = {
  'numberCell' : {'textAlign': 'right'}
}



class DockerInfo extends Component{
  constructor(props){
    super(props)
    this.state={'loading': true}
    this.renderContent = this.renderContent.bind(this);
  }

  renderContent(info){
    if (this.state.loading){
      return(
          <div className="loader" style={{ 'margin': 50}} ></div>
      )
    }
    let swarm = info.Swarm;
    return (
      <div>
        <table className="table table-condensed">
          <tbody>
            <tr className="success">
              <td>Server Version</td><td>{info.ServerVersion}</td>
            </tr>
            <tr>
              <td>Containers</td>
              <td>
                <ul>
                  <li>Total: {info.Containers}</li>
                  <li>Paused: {info.ContainersPaused}</li>
                  <li>Running: {info.ContainersRunning}</li>
                  <li>Stopped: {info.ContainersStopped}</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>Device driver</td><td>{info.Driver}</td>
            </tr>
            <tr>
              <td>Driver status</td>
              <td>
                <table className="table table-condensed">
                  <tbody>
                    {info.DriverStatus.map((el,idx)=>{
                      return (
                        <tr key={idx}>
                          <td>{el[0]}</td>
                          <td style={STYLE.numberCell}>{el[1]}</td>
                        </tr>
                      )
                      })
                    }
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>ID</td><td>{info.ID}</td>
            </tr>            
            <tr>
              <td>Images</td><td>{info.Images}</td>
            </tr>
            <tr>
              <td>Name</td><td>{info.Name}</td>
            </tr>
          </tbody>
        </table>
        <h3>Swarm Cluster</h3>
        <table className="table table-condensed">
          <tbody>
            <tr>
              <td>Created at</td><td>{swarm.Cluster.CreatedAt}</td>
            </tr>
            <tr><td>LocalNodeState</td><td>{swarm.LocalNodeState}</td></tr>
            <tr><td>Managers</td><td>{swarm.Managers}</td></tr>
            <tr><td>Nodes</td><td>{swarm.Nodes}</td></tr>
            <tr><td>Node Addr</td><td>{swarm.NodeAddr}</td></tr>
            <tr><td>Node Id</td><td>{swarm.NodeID}</td></tr>
            <tr>
              <td>Remote Managers</td>
              <td>
                <ul>
                {swarm.RemoteManagers.map((el,idx)=>{
                  return(
                  <li key={idx}>
                    {el.Addr} (NodeID: {el.NodeID})
                  </li>
                  )
                })}
                </ul>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

    )
  }

  componentDidMount(){
    getDockerInfo().then((response)=>{
      console.log(response);
      this.setState({loading: false, info: response});
    })
  }

  render(){
    return (
      <div className="row">
        <div className="col-md-6">
          <h3>Docker info</h3>
          {this.renderContent(this.state.info)}
        </div>
      </div>
    )
  }

}

export default DockerInfo