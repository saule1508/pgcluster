import React, { Component } from 'react'
import ShellConsole from '../../../shared/components/shellconsole.js'
import BackupForm from './backupform.js'
import RestoreModal from './restoremodal.js'
import PropTypes from 'prop-types'


const Backups = ( { host, rows, loading, onClickDelete, onClickRestore, processing } ) => {
  return (
      <div className="col-md-4">
        <h4>Backups on {host}</h4>
        <table className="table table-condensed">
          <thead>
            <tr><th>Name</th><th>Action</th></tr>
          </thead>
          <tbody>
            {
            rows.map((el,idx)=>{
              return (
                <tr key={el}>
                  <td>{el}</td>
                  <td>
                    <div className="btn-group" role="group" aria-label="pgpool actions">
                      <button className='btn btn-default' style={{marginRight: 5}}
                        onClick={onClickDelete.bind(null,el,host)} disabled={processing} >Delete</button>
                      <button className='btn btn-default'
                        onClick={onClickRestore.bind(null,el,host,'restore')}  disabled={processing} >Restore</button>
                    </div>
                  </td>
                </tr>
                )
              })
            }          
          </tbody>
        </table>
        {rows.length === 0 ? <div>No backups</div> : ''}
        
      </div>
  )
}



class Backup extends Component {
  constructor(props){
    super(props);
    this.state = {'processing': false, 'name': null, 'host': null, action: null}
    this.onBackupDone = this.onBackupDone.bind(this);
    this.onClickRestore = this.onClickRestore.bind(this);
    this.onClickDelete = this.onClickDelete.bind(this);
    this.onSubmitBackup = this.onSubmitBackup.bind(this);
    this.onSubmitRestore = this.onSubmitRestore.bind(this);
    this.renderRestoreModal = this.renderRestoreModal.bind(this);
    this.state = {restoreModalVisible: false}
  }

  componentDidMount(){
    this.props.fetchBackups();
  }

  onRestoreModal(buname,host){
    this.setState({'restoreModalVisible': true, 'buname' : buname, host: host});
  }

  stopRestoreModal(){
    this.setState({'restoreModalVisible': false, 'buname': null, host: null});
  }


  onBackupDone(){
    this.setState({processing: false});
    this.props.fetchBackups();
  }

  onClickRestore(buname,host,evt){
    console.log(  )
    evt.preventDefault();
    if (this.state.processing){
      return;
    }
    console.log(`user requested to ${action} backup ${buname} on host ${host}`);
    this.setState({restoreModalVisible: true, 'buname' : buname, host: host});
  }

  onClickDelete(buname,host,evt){
    evt.preventDefault();
    if (this.state.processing){
      return;
    }
    console.log(`user requested to delete backup ${buname} on host ${host}`);
    this.setState({processing: true, name : buname, host: host, action: 'delete'});
  }

  onSubmitRestore(buname,host,to_host, force, butype = 'backup'){
    if (! this.state.processing){
      console.log(`lets restore ${buname} on ${host} to ${to_host} type is ${butype} with force = ${force}`);

      this.setState({restoreModalVisible: false, 
          processing: true, name: buname, host: host, to_host: to_host, action: 'restore', butype: butype, force: force});
    }
  }

  onSubmitBackup(buname, host, butype){
    console.log(`execute backup ${buname} on ${host} of type ${butype} `);
    
    if (! this.state.processing){
      console.log('lets go');
      this.setState({processing: true, name: buname, host: host, butype: butype, action: 'backup'});
    }  
  }

  renderRestoreModal(){

    if (! this.state.restoreModalVisible){
      return
    }

    return(
      <RestoreModal handleHideModal={this.stopRestoreModal.bind(this)} 
        restoreModalActive={this.state.restoreModalVisible}
        onSubmit={this.onSubmitRestore.bind(this)} name={this.state.buname} 
          host={this.state.host} hosts={this.props.hosts} />
    )
  }


  render(){
    let hostelems = [];
    let { data, hosts } = this.props;
    hosts.forEach((el) => {
      if (data.hasOwnProperty(el)){
        hostelems.push(
          <Backups key={el} host={el} 
            onClickRestore={this.onClickRestore}
            onClickDelete={this.onClickDelete}
            processing={this.state.processing} /* so that we can disable buttons */
            rows={data[el].result} error={data[el].error} loading={this.props.loading} />
        )
      }
    })
    // compute arguments for the shell console
    let args = {
      name: this.state.name,
      host: this.state.host,
      to_host: this.state.to_host,
      force: this.state.force ? 'yes':'no',
      butype:this.state.butype || ''
    }
    console.log(args);
    let backupSubmitEnabled = (this.state.restoreModalVisible || this.state.processing) ? false : true;
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <h3>Backups</h3>
              <div className="row">
                { data && hostelems }  
              </div>          
          </div>
        </div>
        {this.renderRestoreModal()}
        <hr/>
        <div className="row">
          <div className="col-md-6">  
            <BackupForm name={this.state.name} enabled={backupSubmitEnabled}
              setName={this.setName} hosts={hosts ? hosts : []} onSubmit={this.onSubmitBackup} />
            
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            {this.state.processing && (
              <ShellConsole onClose={this.onBackupDone} 
                onSuccess={this.props.fetchBackups} 
                action={this.state.action} /* delete, backup, restore */
                args={ args }
                />
              )}
          </div>
        </div>
        
      </div>
    )
  }
}

Backup.propTypes = {
  data: PropTypes.shape(),
  hosts: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string
}

export default Backup
