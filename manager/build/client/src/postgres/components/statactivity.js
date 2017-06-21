import React, { Component } from 'react'
import moment from 'moment'

class StatActivity extends Component{


	componentDidMount(){
    this.props.fetchStatActivity();	
	}

	renderContent(){
		if (this.props.error){
			return (<div className="alert alert-danger">{this.props.error}</div>);
		}
		if (this.props.rows.length === 0){
			return (<div className="loader"></div>);
		}
    return (
      <table className="table table-condensed">
        <thead><tr>
          <th>DB</th>
          <th>pid</th>
          <th>User</th>
          <th>Backend start</th>
          <th>query start</th>
          <th>state change</th>
          <th>wait event</th>
          <th>state</th>
          <th>query</th>
          <th>Application</th>
          <th>Client addr</th>
        </tr></thead>
        <tbody>
		    {this.props.rows.map((el,idx)=>{
          let trClass = el.state === 'active' ? 'success' : '';
    			return(
            <tr key={el.pid} className={trClass}>
              <td>{el.datname}</td>
              <td>{el.pid}</td>
              <td>{el.usename}</td>
              <td>{moment(el.backend_start).from()}</td>
              <td>{moment(el.query_start).from()}</td>
              <td>{moment(el.state_change).from()}</td>
              <td>{el.wait_event}</td>
              <td>{el.state}</td>
              <td>{el.query}</td>
              <td>{el.application_name}</td>
              <td>{el.client_addr}</td>
            </tr>
    			)
          })
        }
        </tbody>
      </table>
		)
	}

	render(){

		return (
    <div>
			<div className="row">
				<div className="col-md-12">
          <div><button className="btn btn-link" onClick={this.props.fetchStatActivity}>Refresh</button></div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
					{this.renderContent()}
				</div>
			</div>
    </div>
		)
	}
}

export default StatActivity