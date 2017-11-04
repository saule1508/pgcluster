import React, { Component } from 'react'
import ConnectedStatus from '../../shared/components/ConnectedStatus'


const Backend = ( {backend} ) => {

	let color= backend.status === 'up' || backend.status === 'waiting' ? '#89C35C' : 'red';
  let strokeW = backend.role === 'primary' ? 5 : 2;
	let strokeC = backend.role === 'primary' ? 'blue' : 'grey';

	return (
		<svg width="180" height="100">
			
			<rect width={160} height={100} style={{fill : color,strokeWidth: strokeW, stroke: strokeC}} />
			<text x={40} y={20} style={{fontSize: '110%'}} fill={strokeC}>** {backend.role} **</text>
			<text x={10} y={40} style={{fontSize: '80%'}} fill='black'>
				ID: {backend.node_id} - Host:{backend.hostname} 
				<tspan x={10} y={60}>State:{backend.status}</tspan>
        <tspan x={10} y={70}>Select count: {backend.select_cnt}</tspan>
				<tspan x={10} y={80}>Load balance node? {backend.load_balance_node}</tspan>
			</text>
		</svg>
	)
}

class Pgpool extends Component{

	constructor(props){
		super(props);
		this.state = {'serverTimeStamp': null, 'connected': false};
		this.renderContent = this.renderContent.bind(this);
	}

	componentDidMount(){
		//this.props.fetchPgpool();
    const protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    let host = window.location.host;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      host = process.env.REACT_APP_SERVERIP ? process.env.REACT_APP_SERVERIP + ':8080' : 'localhost:8080';
    }
    this.ws = new WebSocket(protocolPrefix + '//' + host + '/ws/pool_nodes');
 	
    this.ws.onopen = () => {
      console.log('ws onopen, set state to connected');
      this.setState({'connected': true});
      this.ws.send('I just connected');
      this.ws.onmessage = e => {
        //console.log('on message');
      	let result = JSON.parse(e.data);
        this.setState({'serverTimeStamp': result.timestamp});
        if (result && result.error ){
          this.props.fetchPgpoolFailure(result.message || 'server error');
        } else {
          this.props.fetchPgpoolSuccess(result.result);
        }
      }
    };

    this.ws.onerror = e => {
    	console.log('on error');
      console.log(e);
    	this.setState({ error: 'WebSocket error' , 'connected': false});
      this.props.fetchPgpoolFailure('websocker error !');
    }
    
    this.ws.onclose = e => !e.wasClean && this.setState({ error: `WebSocket error: ${e.code} ${e.reason}`, 'connected': false });
	
	}

	componentWillUnmount() {
    this.ws.close()
  }

	renderContent(){
		if (this.props.error){
			return (<div className="alert alert-danger">{this.props.error}</div>);
		}
    if (! this.state.connected){
      return (<div className="alert alert-danger">Disconnected from server</div>)
    }
		if (this.props.pool_nodes.length === 0){
			return (<div className="loader"></div>);
		}
		let content = this.props.pool_nodes.map((el,idx)=>{

			return(
				<Backend key={el.node_id} backend={el} />
			)
		});
		return content;
	}

	render(){

		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					PGPOOL database back-ends <ConnectedStatus serverTimeStamp={this.state.serverTimeStamp} connected={this.state.connected} />
				</div>
				<div className="panel-body">
					{this.renderContent()}
				</div>
			</div>
		)
	}
}

export default Pgpool