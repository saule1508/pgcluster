import React from 'react'
import moment from 'moment';

const renderConnectedState = ( { serverTimeStamp, connected } ) => {
    const connectStatus = (
      <span className="pull-right"><small>
        {(serverTimeStamp !== null) ?
          <span>received at {moment(serverTimeStamp).format('HH:ss')}</span> : ''
        }        
        {(connected) ? 
           <span> - connected</span> : 
           <span style={{'color': 'red'}}> X disconnected</span>
        }
      </small></span>);
    return connectStatus;
  }

export default renderConnectedState