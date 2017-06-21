import React , { Component } from 'react'
import { getSystemDf } from '../api/index.js'

const STYLE = {
  'numberCell' : {'textAlign': 'right'}
}

const Images = ({rows})=> {
  let sumSharedSize = 0;
  let sumVirtualSize = 0;
  let sumSize = 0;

  return (
    <table className="table table-condensed">
      <thead>
        <tr>
          <th>Image</th>
          <th>SharedSize MB</th>
          <th>VirtualSize MB</th>
          <th>Size MB</th>
        </tr>
      </thead>
      <tbody>
      {
        rows.map((el,idx)=>{
          let desc = el.RepoTags ? el.RepoTags[0] : ( el.RepoDigests ? el.RepoDigests[0] : 'NA');
          sumSharedSize += el.SharedSize;
          sumVirtualSize += el.VirtualSize;
          sumSize += el.Size;
          return(

            <tr key={el.Id}>
              <td key={0}>{desc}</td>
              <td key={1} style={STYLE.numberCell}>{Math.round(el.SharedSize/(1024*1024))}</td>
              <td key={2} style={STYLE.numberCell}>{Math.round(el.VirtualSize/(1024*1024))}</td>
              <td key={3} style={STYLE.numberCell}>{Math.round(el.Size/(1024*1024))}</td>
            </tr>
          )
        })
      }
        <tr key={"sum"}>
          <td key={0}>Total</td>
          <td key={1} style={STYLE.numberCell}>{Math.round(sumSharedSize/(1024*1024))}</td>
          <td key={2} style={STYLE.numberCell}>{Math.round(sumVirtualSize/(1024*1024))}</td>
          <td key={3} style={STYLE.numberCell}>{Math.round(sumSize/(1024*1024))}</td>
        </tr>
      </tbody>

    </table>
  )
}

const Containers = ({rows})=> {
  return (
    <table className="table table-condensed">
      <thead>
        <tr>
          <th>Container</th>
          <th>State</th>
          <th>Sizerw MB</th>
          <th>SizeRootFS MB</th>
        </tr>
      </thead>
      <tbody>
      {
        rows.map((el,idx)=>{
          let desc = el.Names[0];
          let rowClass = el.State !== 'running' ? 'warning' : 'success';
          let sizeRw = el.SizeRw ? Math.round(el.SizeRw/(1024*1024)) : '';
          return(

            <tr key={el.Id} className={rowClass} >
              <td key={0}>{desc}</td>
              <td key={'state'}>{el.State}</td>
              <td key={1} style={STYLE.numberCell}>{sizeRw}</td>
              <td key={2} style={STYLE.numberCell}>{Math.round(el.SizeRootFs/(1024*1024))}</td>
            </tr>
          )
        })
      }
      </tbody>

    </table>
  )
}

const Volumes = ({rows})=> {
  return (
    <table className="table table-condensed">
      <thead>
        <tr>
          <th>Driver</th>
          <th>Name</th>
          <th>RefCount</th>
          <th>Size MB</th>
        </tr>
      </thead>
      <tbody>
      {
        rows.map((el,idx)=>{
          let desc = el.Labels ? el.Labels : el.Name;
          return(

            <tr key={idx}>
              <td key={'driver'}>{el.Driver}</td>
              <td key={0}>{desc}</td>
              <td key={1} style={STYLE.numberCell}>{el.UsageData.RefCount}</td>
              <td key={2} style={STYLE.numberCell}>{Math.round(el.UsageData.Size/(1024*1024))}</td>
            </tr>
          )
        })
      }
      </tbody>

    </table>
  )
}


class DF extends Component{
  constructor(props){
    super(props)
    this.state={'loading': true}
    this.renderContent = this.renderContent.bind(this);
  }

  renderContent(){
    if (this.state.loading){
      return(
        <div className="col-md-12">
          <div className="loader" style={{ 'margin': 50}} ></div>
        </div>
      )
    }
    return (
      <div>
        <div className="row">
          <div className="col-md-6">
            LayersSize: {Math.round(this.state.df.LayersSize/(1024*1024*1024))} GB
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <Images rows={this.state.df.Images} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <Containers rows={this.state.df.Containers} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <Volumes rows={this.state.df.Volumes} />
          </div>
        </div>
      </div>

    )
  }

  componentDidMount(){
    getSystemDf().then((response)=>{
      this.setState({loading: false, df: response});
    })
  }

  render(){

    return (
      <div className="row">
        <div className="col-md-12">
          <h3>Disk usage</h3>
          {this.renderContent()}
        </div>
      </div>
    )
  }

}

export default DF