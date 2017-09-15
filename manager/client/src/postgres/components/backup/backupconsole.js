import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConnectedStatus from '../../../shared/components/ConnectedStatus'

const STYLES = {
  console: {
    padding: 20,
    backgroundColor: '#101010',
    color: '#ffffff'
  },
  pre: {
    padding: 20 
  }
}


class BackupConsole extends Component{
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
      host = (process.env.REACT_APP_SERVERIP || 'localhost') + ':8080';
    }
    this.ws = new WebSocket(protocolPrefix + '//' + host + '/ws/backup');
  
    this.ws.onopen = () => {
      console.log('ws onopen, set state to connected');
      this.setState({'connected': true});
      this.ws.send(`action:${this.props.action},name:${this.props.name},
         host:${this.props.host},
         to_host: ${this.props.to_host},
         force: ${this.props.force ? 'yes':'no'},
         butype:${this.props.butype || ''}`);
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
    
    this.ws.onclose = e => {
      if (e.wasClean){
          this.props.onSuccess();
          this.setState({error: null, connected: false})
        } else {
          this.setState({ error: `WebSocket error: ${e.code} ${e.reason}`, 'connected': false });
        }
    }
  
  }

  componentWillUnmount() {
    this.ws.close()
  }


  render(){
    return(
      <div className="row">
        <div className="col-md-12">
          <div className="panel panel-default">
            <div className="panel-heading">
              {this.props.action} Backup <ConnectedStatus connected={this.state.connected} />
            </div>
            <div className="panel-body" style={STYLES.console} >
              <pre style={STYLES.pre} >
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

BackupConsole.propTypes = {
  'onClose': PropTypes.func.isRequired,
  'onSuccess': PropTypes.func.isRequired,  
  action: PropTypes.oneOf(['backup', 'restore', 'delete']).isRequired,
  'name': PropTypes.string,
  'host': PropTypes.string,
  'butype': PropTypes.string
}

export default BackupConsole