import React, { Component } from 'react'
import ShellConsoleModal from '../../../shared/components/shellconsolemodal.js'
import StateUpDown from '../../../shared/components/stateupdown'

const Stats = ( data ) => {
	let rows = [];
	for (var prop in data){
		rows.push(
							<tr key={prop} >
								<td>{prop}</td><td>{data[prop]}</td>
							</tr>
						)
	}
	return (
		<table className="table table-bordered table-condensed">
			<thead>
			</thead>
			<tbody>
				{rows}
			</tbody>
		</table>

	)
}


const StateStatus = ({color}) => {
	/*
	return (
		<svg width="40" height="30">
   			<circle cx="20" cy="20" r="10" fill={color} />		
			</svg>
	) 
	*/
	if (color === 'green'){
		return <span style={{color: 'green', fontWeight: 'bold'}}>V</span>
	}
	if (color === 'red'){
		return <span style={{color: 'red'}}>X</span>
	}
}



const Backend = ( {host,backend, onConsoleAction } ) => {
	
	let pgpoolColor = (backend.pgpool_status === 'up' || backend.pgpool_status === 'waiting') ? "success" : "danger";
	let pcpAttachClass = backend.pgpool_status === 'down' ? 'btn btn-primary enabled' : 'btn btn-primary disabled' ;
	let pcpDetachClass = backend.pgpool_status === 'up' || backend.pgpool_status === 'waiting' ? 'btn btn-primary enabled' : 'btn btn-primary disabled' ;
	
	return (
		<div className="col-md-4">
			<table className="table table-bordered table-condensed">
				<thead>
				</thead>
				<tbody>
					<tr >
						<td><StateUpDown color={backend.status} /></td>
						<td>{host}</td><td>{backend.status}</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td>Repmgr role</td><td>{backend.role}</td>
						<td></td>
					</tr>
					<tr>
						<td><StateStatus color={backend.active ? 'green' : 'red'} /></td>
						<td>Repmgr active</td><td>{backend.active ? 'yes': 'no'}</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td>In recovery</td><td>{backend.in_recovery && backend.in_recovery.toString()}</td><td></td>
					</tr>
					<tr >
						<td><StateStatus color={backend.pgpool_status === 'up' || backend.pgpool_status === 'waiting' ? 'green' : 'red'} /></td>
						<td>PGPool status</td><td>{backend.pgpool_status}</td>
						<td>
							<div className="btn-group" role="group" aria-label="pgpool actions">
								<button className={pcpAttachClass} style={{marginRight: 5}}
									onClick={onConsoleAction.bind(null,host,'pcp_attach')}>Attach</button>		
								<button className={pcpDetachClass} 
									onClick={onConsoleAction.bind(null,host,'pcp_detach')}>Detach</button>
							</div>
						</td>
					</tr>
					<tr >
						<td></td>					
						<td>PGPool role</td><td>{backend.pgpool_role}</td>
						<td></td>
					</tr>
					<tr >
						<td></td>
						<td>PGPool replication delay</td><td>{backend.pgpool_replication_delay}</td>
						<td></td>
					</tr>
				</tbody>
			</table>
			<Stats {...backend.data} /> 
		</div>
		
	)
	
}

class ReplicationStats extends Component{

	constructor(props){
		super(props);
		this.renderContent = this.renderContent.bind(this);
		this.onConsoleAction = this.onConsoleAction.bind(this);
		this.onCloseConsole = this.onCloseConsole.bind(this);
		this.state = {
			console_action: null,
			pcp_node_id: null,
			pcp_host: null
		}
	}

	componentDidMount(){
		this.props.fetchReplicationStats();
  	this.interval = setInterval(this.props.fetchReplicationStats,5000);
	}

	componentWillUnmount(){
  	if (this.interval){
  		clearInterval(this.interval);
  	}
	}

	onConsoleAction(host, action){
		let node_info = this.props.replication_status[host];
		console.log(node_info);
		if (! this.state.console_action){
				this.setState({console_action: action, pcp_node_id: node_info.pgpool_node_id, pcp_host: host});
		}

	}

	onCloseConsole(){
		// console_action determines if the modal is showned or not
		this.setState({console_action: null, pcp_node_id: null, pcp_host: null})
	}

	renderContent(){
		
		if (this.props.error){
			return (<div className="alert alert-danger">{this.props.error}</div>);
		}
		/*
		if (this.props.stats.length === 0){
			return (<div className="loader"></div>);
		}
		

		let content = this.props.stats.map((el,idx)=>{

			return(
				<Backend key={el.host} backend={el} />
			)
		});
		*/
		let content = [];

		let args = {pcp_node_id: this.state.pcp_node_id,host: this.state.pcp_host }
		
		content.push(	
					<ShellConsoleModal key='console' action={this.state.console_action} 
						modalActive={this.state.console_action}
						handleHideModal={this.onCloseConsole}
						onClose={this.onCloseConsole} 
						onSuccess={this.onCloseConsole}
						args={args} 
						prompt={this.state.console_action === 'pcp_detach' ? 'Are you sure you want to detach' : null} />
			)
		

		for (var e in this.props.replication_status){
			if (this.props.replication_status.hasOwnProperty(e)){
				content.push(
					<Backend key={e} host={e} backend={this.props.replication_status[e]} onConsoleAction={this.onConsoleAction} />
				)
			}
		}
		return content;
	}

	
	render(){

		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					Replication Stats
				</div>

				<div className="panel-body">				
					{this.renderContent()}
				</div>
			</div>
		)
	}
}

export default ReplicationStats
