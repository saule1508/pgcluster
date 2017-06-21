import React, { Component } from 'react'
import PropTypes from 'prop-types';

class HealthCheck extends Component{
  constructor(props){
    super(props);
  }

  componentDidMount(){
    this.props.fetchHealth(this.props.service);
    //this.interval = setInterval(this.props.fetchHealth(this.props.service), 5000);
  }

  componentWillUnmount(){
    clearInterval(this.interval);
  }

  render(){
    console.log(this.props);
    let data = this.props.health;
    console.log(data);
    return (
      <div>status</div>
    )
  }

}
  
HealthCheck.PropTypes = {
  'service': PropTypes.string
}

export default HealthCheck