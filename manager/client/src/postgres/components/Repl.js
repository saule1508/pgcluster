import React, { Component } from 'react'
import ConnectedStatus from '../../shared/components/ConnectedStatus'

const Backend = ( {backend} ) => {
	//console.log(backend);
	let color= backend.active  ? '#89C35C' : 'red';
  let strokeW = backend.type === 'primary' ? 5 : 2;
	let strokeC = backend.type === 'primary' ? 'blue' : 'grey';

	return (
		<svg width="180" height="100">
			
			<rect width={160} height={100} style={{fill : color,strokeWidth: strokeW, stroke: strokeC}} />
			<text x={40} y={20} style={{fontSize: '110%'}} fill={strokeC}>** {backend.type} **</text>
			<text x={10} y={40} style={{fontSize: '80%'}} fill='black'>
				ID: {backend.id} - Host:{backend.node_name}
        <tspan x={10} y={60}>State:{backend.active ? 'active' :'inactive'}</tspan>
				<tspan x={10} y={70}>Slot name: {backend.slot_name}</tspan>
				<tspan x={10} y={80}>Upstream node id: {backend.upstream_node_id}</tspan>
			</text>
		</svg>
	)
	
}

class Repl extends Component{

	constructor(props){
		super(props);
		this.renderContent = this.renderContent.bind(this);
		this.state = {'serverTimeStamp': null, 'connected': false};
	}

	componentDidMount(){
  	/* this.props.fetchRepl();*/
    const protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    let host = window.location.host;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      host = process.env.REACT_APP_SERVERIP ? process.env.REACT_APP_SERVERIP + ':8080' : 'localhost:8080';
    }
		this.ws = new WebSocket(protocolPrefix + '//' + host + '/ws/repl_nodes');
    this.ws.onopen = () => {
      console.log('ws onopen');
      this.ws.send('I just connected');
      this.setState({'connected': true});
      this.ws.onmessage = e => {
      	let result = JSON.parse(e.data);
      	this.setState({'serverTimeStamp': result.timestamp});
        if (result && result.error ){
          this.props.fetchReplFailure(result.message || 'server error');
        } else {
          this.props.fetchReplSuccess(result.result);
        }
      }
    };

    this.ws.onerror = e => {
    	console.log(e);
    	this.setState({ 'error': 'WebSocket error', 'connected': false });
      this.props.fetchReplFailure('websocket error !');

    }
    
    this.ws.onclose = e => !e.wasClean && this.setState({ error: `WebSocket error: ${e.code} ${e.reason}`, 'connected': false });
	
	}

	renderContent(){
		
		if (this.props.error){
			return (<div className="alert alert-danger">{this.props.error}</div>);
		}
		if (this.props.repl_nodes.length === 0){
			return (<div className="loader"></div>);
		}
    if (! this.state.connected){
      return (<div className="alert alert-danger">Disconnected from server</div>)
    }

		let content = this.props.repl_nodes.map((el,idx)=>{

			return(
				<Backend key={el.id} backend={el} />
			)
		});
		
		return content;
	}

	componentWillUnmount() {
    this.ws.close();
  }


	render(){

		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					DB Replication <ConnectedStatus serverTimeStamp={this.state.serverTimeStamp} connected={this.state.connected} />
				</div>
				<div className="panel-body">				
					{this.renderContent()}
				</div>
			</div>
		)
	}
}

export default Repl