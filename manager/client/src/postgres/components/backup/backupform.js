import React from 'react'
import {Component} from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'


class BackupForm extends Component{
  constructor(props){
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this._buname = '';
    this.handleHostChange = this.handleHostChange.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.state = {selectedHost: null, butype: 'backup'}
  }

  onSubmit(evt){
    evt.preventDefault();
    this.props.onSubmit(this._buname.value, this.state.selectedHost, this.state.butype);
  }

  componentWillReceiveProps(nextProps){
    if (! this.state.selectedHost){
      this.setState({selectedHost: nextProps.hosts[0]});
    }
  }

  handleHostChange(val){
    this.setState({'selectedHost': val.target.value});
  }

  handleTypeChange(val){
    this.setState({'butype': val.target.value});
  }

  render(){
    let btnClass = this.props.enabled ? "btn btn-primary" : "btn btn-primary disabled"
    return (
      <div className="panel panel-default">
        <div className="panel-heading"> 
          Take a backup
        </div>
        <div className="panel-body">
          <div className="row">
            <div className="col-md-6" style={{margin: 10}}>
              <form >
                <div className="row">
                  <div className="col-group">
                    <div className="col-md-4" style={{'maxWidth': '280px'}}>
                      <label htmlFor="buname">Name: </label>
                      <input className="form-control" type="text" 
                        placeholder="<current date time>"
                        id="buname" ref={(input)=>{this._buname = input}} />
                    </div>
                    <div className="col-md-4" style={{'maxWidth': '180px'}}>
                      <label htmlFor="host">Host</label>
                      <select name="host" className="form-control" onChange={this.handleHostChange}
                        defaultValue={this.state.selectedHost} >
                        {this.props.hosts.map((el,idx)=>{
                          return (
                            <option value={el} key={el}>{el}</option>
                          )
                        })}
                      </select>
                    </div>
                    <div className="col-md-4" style={{'maxWidth': '180px'}}>
                      <label htmlFor="host">Type</label>
                      <select name="butype" className="form-control" onChange={this.handleTypeChange}
                        defaultValue={this.state.butype} >
                            <option value={'backup'} key={0}>Backup</option>
                            <option value={'dump'} key={1}>Dump</option>
                      </select>
                    </div>
                  </div>
                  
                </div>
                <div className="row">
                  <div className="col-md-4" style={{marginTop: 10}}>
                    <button type="submit" className={btnClass} onClick={this.onSubmit}>Go</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

BackupForm.propTypes = {
  hosts: PropTypes.array,
  onSubmit: PropTypes.func.isRequired,
  enabled: PropTypes.bool.isRequired
}

export default BackupForm