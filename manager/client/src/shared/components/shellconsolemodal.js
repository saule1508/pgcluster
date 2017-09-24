import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Modal } from 'react-bootstrap';
import ShellConsole from './shellconsole.js'

class ShellConsoleModal extends Component {
  constructor(props){
    super(props);
    this.renderButtons = this.renderButtons.bind(this);
  }


  renderButtons(){
    
    let btns = [];

    btns.push(
      <button key={0} type="button" className="btn btn-default" onClick={this.props.handleHideModal}>Close</button>);

    return (
      btns
    )
  }


  render(){
    return (
      <Modal show={this.props.modalActive} onHide={this.handleHideModal} >
        <Modal.Header closeButton>
            <Modal.Title>{this.props.action}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ShellConsole {...this.props} />
        </Modal.Body>
        <Modal.Footer>
          {this.renderButtons() }
        </Modal.Footer>
      </Modal>
    )
  }
}

ShellConsoleModal.propTypes = {
  action: PropTypes.string.isRequired,
  args : PropTypes.shape(), // arguments to be passed to the shell script
  'onClose': PropTypes.func.isRequired,
  'onSuccess': PropTypes.func.isRequired,  
  prompt: PropTypes.string, // If a confirmation is required, the message to prompt
  modalActive: PropTypes.bool,
  handleHideModal: PropTypes.func.isRequired
}

export default ShellConsoleModal
