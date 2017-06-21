import React, { Component } from 'react'



const Node = ( {node} ) => {
	console.log(node);
	let color= node.Status.State === 'ready' ? 'green' : 'red';
	let leader = node.ManagerStatus.Leader ? 'leader' : 'non-leader';
	return (
		<div className="col-md-4">
			<svg width="500" height="100">
   			<circle cx="30" cy="30" r="20" stroke="blue" strokeWidth="2" fill={color} />		
   			<text x={60} y={25}>
   				<tspan x={60} y={25}>{leader}</tspan>
   				<tspan x={60} y={45}>
   					{node.Description.Hostname}{'  '}
   					{Math.round(node.Description.Resources.MemoryBytes/(1024*1024*1024))} GB
   				</tspan>
   				<tspan x={60} y={65}>{node.ManagerStatus.Reachability} {node.ManagerStatus.Addr}</tspan>
   			</text>
			</svg> 
		</div>
	)
}

class Nodes extends Component{

	componentDidMount(){
		this.props.fetchNodes();
	}

	render(){
		let { nodes } = this.props;
		if (this.props.loading && nodes.length === 0){
			return (
				<div className="loader"></div>
			)
		}
		if (this.props.error){
			return (
				<div className="panel panel-default">
					<div className="panel-heading">
						Cluster Nodes
					</div>
					<div className="panel-body">
						<div className="row">
							<div className="alert alert-danger col-md-2">
								{this.props.error}
							</div>
						</div>
					</div>
				</div>
			)			
		}
		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					Cluster Nodes
				</div>
				<div className="panel-body">
					<div className="row">
					{nodes.map((el,idx)=>{
							return (<Node key={idx} node={el} />)
						})
					}
					</div>
				</div>
			</div>
		)
	}
}

export default Nodes