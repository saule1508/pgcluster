import React, { Component } from 'react'

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

const Backend = ( {backend} ) => {
	console.log(backend);
	return (
		<div className="col-md-4">
			<br/>Host:{backend.host}
			<br/>In recovery:{backend.in_recovery.toString()}
			<br/>Status:{backend.status}
			<Stats {...backend.data} /> 
		</div>
		
	)
	
}

class ReplicationStats extends Component{

	constructor(props){
		super(props);
		this.renderContent = this.renderContent.bind(this);

	}

	componentDidMount(){
  	this.interval = setInterval(this.props.fetchReplicationStats,5000);
	}

	componentWillUnMount(){
  	if (this.inverval){
  		clearInterval(this.inverval);
  	}
	}


	renderContent(){
		
		if (this.props.error){
			return (<div className="alert alert-danger">{this.props.error}</div>);
		}
		if (this.props.rows.length === 0){
			return (<div className="loader"></div>);
		}

		let content = this.props.rows.map((el,idx)=>{

			return(
				<Backend key={el.host} backend={el} />
			)
		});
		
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