import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConnectedStatus from './ConnectedStatus'

const STYLES = {
  console: {
    padding: 20,
  },
  pre: {
    padding: 20 ,
    backgroundColor: '#101010',
    fontWeigth: 'bold',
    color: '#ffff00'
  }
}

let Prompt = ({prompt, onClick, confirmed})=>{
  if (! prompt || confirmed){
    return (<div></div>)
  }
  return (
    <div className="row" style={{padding: 10}}>
      <div className="col-md-12">
          {prompt}
      </div>
      <div className="col-md-12">
          <button className="btn btn" onClick={onClick.bind(null,true)} style={{marginRight: 10}}>Yes</button>
          <button className="btn btn-primary" onClick={onClick.bind(null,false)}>No</button>
      </div>
    </div>

  )

}


class ShellConsole extends Component{
  constructor(props){
    super(props);
    this.startShell = this.startShell.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
    this.state = {'connected': false, 'stdout': null, error: null, prompt : this.props.prompt, confirmed: this.props.prompt ? false : true};
    this.close = this.close.bind(this);
  }

  close(){
    if (this.state.connected && this.ws){
      this.ws.close();  
    }
    this.props.onClose();
  }

  onConfirm(answer, evt){
    evt.preventDefault();
    this.setState({'confirmed': answer});
    if (answer){
      this.startShell();
    } else {
      this.close();
    }
  }

  componentDidMount(){
    if (! this.state.prompt){
      this.startShell();
    }
  }

  startShell(){
    const protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    let host = window.location.host;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      host = process.env.REACT_APP_SERVERIP + ':8080';
    }
    this.ws = new WebSocket(protocolPrefix + '//' + host + '/ws/shell');

    // build string of action + csv list of parameters
    let command = `action:${this.props.action}`;
    for (var arg in this.props.args){
      if (this.props.args.hasOwnProperty(arg)){
        if (this.props.args[arg]){
          command = `${command},${arg}:${this.props.args[arg]}`;
        }
      }
    } 
    console.log('ready to fire this command');
    console.log(command);
    
    this.ws.onopen = () => {
      console.log('ws onopen, set state to connected');
      this.setState({'connected': true});
      this.ws.send(command);
      this.ws.onmessage = e => {
        //console.log(e)        
        this.setState({'stdout': this.state.stdout + e.data});
      }
    }

    this.ws.onerror = e => {
      console.log('on error');
      console.log(e);
      this.setState({ error: 'WebSocket error' , 'connected': false});
      
    }
    
    this.ws.onclose = e => {
      console.log('on close');

      if (e.wasClean){
          console.log('was clean');
          console.log(`WebSocket error: ${e.code} ${e.reason}`)
          this.setState({error: null, connected: false})
          //this.props.onSuccess();
        } else {
          this.setState({ error: `WebSocket error: ${e.code} ${e.reason}`, 'connected': false });
        }
    }
    
  
  }

  componentWillUnmount() {
    if (this.ws){
      this.ws.close()
    }
  }


  render(){
    return(
      <div className="row">
        <div className="col-md-12">
          <div className="panel panel-default">
            <div className="panel-heading">
              {this.props.action} Backup 
                {this.props.prompt && ! this.state.confirmed ? '' : <ConnectedStatus connected={this.state.connected} /> }
            </div>
            <Prompt prompt={this.props.prompt} onClick={this.onConfirm} confirmed={this.state.confirmed} />
            {this.state.confirmed && (
            <div className="panel-body" style={STYLES.console} >
              <pre style={STYLES.pre} >
                {this.state.stdout}
              </pre>
              <div>
                <button type="button" className="btn btn-primary" onClick={this.props.onClose}>Close</button>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

        )
  }
}

ShellConsole.propTypes = {
  action: PropTypes.string.isRequired,
  args : PropTypes.shape(), // arguments to be passed to the shell script
  'onClose': PropTypes.func.isRequired,
  'onSuccess': PropTypes.func.isRequired,  
  prompt: PropTypes.string // If a confirmation is required, the message to prompt
}

export default ShellConsole