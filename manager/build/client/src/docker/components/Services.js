import React, { Component } from 'react'
import moment from 'moment';


const Service = ( {service, tasks, getNodeById} )=> {
	return (
      <div>
				<span style={{fontSize: '120%'}}>
					{service.Spec.Name}
				</span>
				{' : '}
				<small>{service.Spec.Mode.Replicated.Replicas} replica(s)</small> 
				
				{/* service.CreatedAt} / Updated: {service.UpdatedAt */}
				<Tasks tasks={tasks} getNodeById={getNodeById} />
      </div>
	)
}

const Tasks = ( {tasks, getNodeById} ) => {
  if (tasks.length === 0){
    return (
      <div className="alert alert-danger">
        No tasks running for this service
      </div>
    )
  }
  let sorted = tasks.sort((el1,el2)=>{
    return (el1.DesiredState === 'running' ? -1 : 1)
  });
	return (
		<div>
			{sorted.map((el,idx)=>{
				let node=getNodeById(el.NodeID);	
				return (
					<Task key={idx} task={el} node={node} />
					)
				})
			}
		</div>
	)
}

const Task = ( {task, node} ) => {
	//console.log(task);
  let color = task.DesiredState === 'running' ? (task.Status.State === 'running' ? 'green' : 'red') : 'grey';
  
	//let sinceDate = timeSince(new Date(task.Status.Timestamp));
	let sinceDate = moment(task.Status.Timestamp).fromNow();
  let nodeDesc = node && node.Description && node.Description.Hostname ? node.Description.Hostname : '?';
  let containerId = 'N/A';
  if (task.Status.ContainerStatus && task.Status.ContainerStatus.ContainerID){
    containerId = task.Status.ContainerStatus.ContainerID.substr(1,8);
  }
	return (
			<svg width="450" height="100">
   				<circle cx="30" cy="50" r="15" stroke="black" strokeWidth="2" fill={color} />		
   				<text x={60} y={25} style={{fontSize: '80%'}} >
   					<tspan x={60} y={45}>
   						{task.Status.State} on Node: {nodeDesc} (DesiredState: {task.DesiredState})
   					</tspan>
   					<tspan x={60} y={65} >
   					 	since {sinceDate}
   					</tspan>
   					<tspan x={60} y={85}>
   						Container: {containerId}
   					</tspan>
   				</text>
			</svg> 
	)
}

class Services extends Component{
	constructor(props){
		super(props);
		this.interval = null;
	}

	componentDidMount(){
		this.props.fetchServices();
		this.interval = setInterval(this.props.fetchServices,5000);
	}

	componentWillUnmount(){
		clearInterval(this.interval);
	}

	render(){
		let { services } = this.props;
		//console.log(services);
		
		if (services.rows.length === 0 && services.loading){
			return (
				<div className="loader"></div>
			)
		}
    if (services.error){
      return (
        <div className="alert alert-danger col-md-2">{services.error}</div>
      )
    }
		if (services.rows.length === 0){
			return (
				<div>No data ?</div>
			)
		}
    let updatedAt = moment(services.timeStamp).format('HH:mm:ss');
		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					Services and tasks
          <span className="pull-right"><small>Updated: {updatedAt}</small></span>
				</div>
				<div className="panel-body">
					<div className="row">
						<div className="col-md-12">
              {/* <ul className={cl}> */}
    						{services.rows.map((service, idx)=>{
    							let tasks = this.props.getTasksForService(service.ID);
    							return (
    								<Service key={idx} service={service} tasks={tasks} getNodeById={this.props.getNodeById} />
    							)
    						})
    						}
              {/* </ul> */}
						</div>
					</div>
				</div>
			</div>
		)
	}
}

export default Services