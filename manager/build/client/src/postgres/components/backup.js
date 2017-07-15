import React, { Component } from 'react'
import ConnectedStatus from '../../shared/components/ConnectedStatus'


class Backup extends Component{

	constructor(props){
		super(props);
		this.state = {'serverTimeStamp': null, 'connected': false, 'console': ''};
	}

	componentDidMount(){
  	/* this.props.fetchRepl();*/
    const protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    let host = window.location.host;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      host = 'localhost:8081';
    }
		this.ws = new WebSocket(protocolPrefix + '//' + host + '/ws/backup');
    this.ws.onopen = () => {
      console.log('ws onopen');
      this.ws.send('start backup');
      this.setState({'connected': true});
      this.ws.onmessage = e => {
        console.log('got onmessage');
        console.log(e.data);
      	this.setState({'serverTimeStamp': new Date(), 'error': null, 'console' : this.state.console + e.data});
      }
    };

    this.ws.onerror = e => {
    	console.log(e);
    	this.setState({ 'error': 'WebSocket error', 'connected': false });
    }
    
    this.ws.onclose = e => !e.wasClean && this.setState({ error: `WebSocket error: ${e.code} ${e.reason}`, 'connected': false });
	
	}

	componentWillUnmount() {
    this.ws.close();
  }


	render(){

		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					DB backup <ConnectedStatus serverTimeStamp={this.state.serverTimeStamp} connected={this.state.connected} />
				</div>
				<div className="panel-body">				
					{this.state.error && (
            <div className="alert alert-danger">
              {this.state.error}
            </div>)
          }
          <div className="row">
            <div className="col-md-6">
              <pre>
              {this.state.console}
              </pre>
            </div>
          </div>
				</div>
			</div>
		)
	}
}

export default Backup