import React, { Component} from 'react'
import ServicesContainer from '../../docker/components/ServicesContainer.js'
import NodesContainer from '../../docker/components/NodesContainer.js'
import DBStates from '../../postgres/components/DBStates.js'
import PgpoolContainer from '../../postgres/components/PgpoolContainer.js'
import ReplContainer from '../../postgres/components/ReplContainer.js'

class Home extends Component {

  
  render() {
    return (
      <div>
      
        <div className="row"  style={{'marginBottom': 20}} >
          <DBStates  />
        </div>
      
        <div className="row" style={{'marginBottom': 20}}>  
          <div className="col-md-6">
            <ReplContainer /> 
          </div>
          <div className="col-md-6">
            <PgpoolContainer />
          </div>
        </div>
        {/*
        <div className="row" style={{'marginBottom': 20}} >
          <div className="col-md-12">
            <NodesContainer />
          </div>
        </div>
        
        <div className="row" style={{'marginTop': 20}} >
          <div className="col-md-12">          
            <ServicesContainer />
          </div>
        </div>
        */}
      
      </div>
    )
  }
}

export default Home
