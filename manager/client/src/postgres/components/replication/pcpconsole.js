import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConnectedStatus from '../../../shared/components/ConnectedStatus'

class PCPConsole extends Component{
  constructor(props){
    super(props);
    this.state = {'connected': false, 'stdout': null, error: null};
    this.close = this.close.bind(this);
  }

  close(){
    if (this.state.connected && this.ws){
      this.ws.close();  
    }
    this.props.onClose();
  }

  componentDidMount(){
    const protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    let host = window.location.host;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      host = process.env.REACT_APP_SERVERIP + ':8081';
    }

    this.ws = new WebSocket(protocolPrefix + '//' + host + '/ws/shell');
  
    this.ws.onopen = () => {
      console.log('ws onopen, set state to connected');
      this.setState({'connected': true});
      this.ws.send(`action: ${this.props.action},pcp_node_id:${this.props.pcp_node_id},pcp_host:${this.props.pcp_host}`);
      this.ws.onmessage = e => {
        //console.log(e)        
        this.setState({'stdout': this.state.stdout + e.data});
      }
    }

    this.ws.onerror = e => {
      console.log('on error');
      console.log(e);
      this.setState({ error: 'WebSocket error' , 'connected': false});
      
    }
    
    this.ws.onclose = e => !e.wasClean && this.setState({ error: `WebSocket error: ${e.code} ${e.reason}`, 'connected': false });
  
  }

  componentWillUnmount() {
    this.ws.close()
  }


  render(){
    return(
      <div className="row">
        <div className="col-md-6">
          <div className="panel panel-default">
            <div className="panel-heading">
              PCP console <ConnectedStatus connected={this.state.connected} />
            </div>
            <div className="panel-body">
              <pre>
                {this.state.stdout}
              </pre>
              <div>
                <button type="button" className="btn btn-primary" onClick={this.props.onClose}>Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>

        )
  }
}

PCPConsole.propTypes = {
  onClose: PropTypes.func.isRequired,
  action: PropTypes.oneOf(['pcp_attach', 'pcp_detach']).isRequired,
  pcp_node_id: PropTypes.number.isRequired,
  pcp_host: PropTypes.string.isRequired
}

export default PCPConsole