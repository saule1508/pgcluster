import React, { Component } from 'react'

class LiveReplication extends Component{
	constructor(props) {
    super(props)

    this.state = {
      timestamp: 'none',
      error: null
    }
  }

	componentDidMount(){
    console.log('componentDidMount');
		this.ws = new WebSocket('ws://localhost:3001/ws');
    this.ws.onopen = () => {
      console.log('ws onopen');
      this.ws.send('I just connected');
      this.ws.onmessage = e => {

        this.setState({ timestamp: e.data });
      }
    };

    this.ws.onerror = e => {
    	console.log(e);
    	this.setState({ error: 'WebSocket error' });
    }
    
    this.ws.onclose = e => !e.wasClean && this.setState({ error: `WebSocket error: ${e.code} ${e.reason}` });

	}

	componentWillUnmount() {
    console.log('Unmout');
    this.ws.close()
  }

  render(){
  	return (
  		<div className="row">
  			<div className="col-md-12">
  				<h1>Live timestamp</h1>
  				{this.state.timestamp}
  			</div>
  		</div>

  	)
  }
}

export default LiveReplication