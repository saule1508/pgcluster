const request = require('request-promise');

const bus_health = ( service ) => {
  return request.get({uri: 'http://' + service + ':8080/health', json: true})
     .then((response)=>{
       console.log('in then');
       return response;
     })
     .catch((error)=>{
       console.log('in catch');
       throw error;
     })
}


module.exports = {
  'bus_health': bus_health
}