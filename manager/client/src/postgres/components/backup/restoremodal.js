import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Modal } from 'react-bootstrap';


class RestoreModal extends Component {
  constructor(props){
    super(props);
    this.renderButtons = this.renderButtons.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this._forceChange = this._forceChange.bind(this);
    this.state = {force: false};
  }


  renderButtons(){
    
    let btns = [];

    btns.push(<button key={0} type="button" className="btn btn-default" onClick={this.props.handleHideModal}>Close</button>);

    return (
      btns
    )
  }

  onSubmit(evt){
    evt.preventDefault();
    this.props.onSubmit(this.props.name,this.props.host,this.props.host,this.state.force)

  }

  _forceChange(){
    this.setState({force: !this.state.force});
  }

  render(){
    return (
      <Modal show={this.props.restoreModalActive} onHide={this.props.handleHideModal} >
        <Modal.Header closeButton>
            <Modal.Title>Restore backup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
              <form >
                <div className="row">
                  <div className="col-group">
                    <div className="col-md-4" style={{'maxWidth': '280px'}}>
                      <label htmlFor="buname">Name: </label>
                      <p className="form-control-static">{this.props.name}</p>
                    </div>
                    <div className="col-md-4" style={{'maxWidth': '280px'}}>
                      <label htmlFor="fromhost">From Host: </label>
                      <p className="form-control-static">{this.props.host}</p>
                    </div>
                    <div className="col-md-4" style={{'maxWidth': '180px'}}>
                      <label htmlFor="host">To Host</label>
                      <select name="host" className="form-control" onChange={this.handleHostChange}
                        defaultValue={this.props.host} disabled >
                        {this.props.hosts.map((el,idx)=>{
                          return (
                            <option value={el} key={el}>{el}</option>
                          )
                        })}
                      </select>
                    </div>
                  </div>
                </div>
                <div className='row'>
                  <div className="col-md-8" >
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" defaultChecked={this.state.force} onChange={this._forceChange} />
                                      Force restore even when primary and running ?
                      </label>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4" style={{marginTop: 10}}>
                    <button type="submit" className="form-control btn btn-primary" 
                      onClick={this.onSubmit}>Submit</button>
                  </div>
                </div>
              </form>
        </Modal.Body>
        <Modal.Footer>
          {this.renderButtons() }
        </Modal.Footer>
      </Modal>
    )
  }
}

RestoreModal.propTypes = {
  onSubmit : PropTypes.func.isRequired,
  handleHideModal : PropTypes.func.isRequired,
  name : PropTypes.string.isRequired,
  hosts: PropTypes.array,
  host: PropTypes.string.isRequired
}

export default RestoreModal
