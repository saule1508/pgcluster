
export const getImages = () => {
  const URL = "/api/docker/images";
  return fetch(URL, { method: 'GET'})
     .then( response => Promise.all([response, response.json()]));
}

export const getServices = () => {

  const URL = "/api/docker/services";
  return fetch(URL, { method: 'GET'})
     .then( response => { 
     		if (! response.ok){
     			throw response.status;
     		}
     		return response.json();
     	})
     .catch((err)=>{
     		throw err;
     });
}

export const getNodes = () => {

  const URL = "/api/docker/nodes";
  return fetch(URL, { method: 'GET'})
     .then( response => { 
        if (! response.ok){
          throw response.status;
        }
        return response.json();
      })
     .catch((err)=>{
        throw err;
     });
}

export const getSystemDf = () => {

  const URL = "/api/docker/df";
  return fetch(URL, { method: 'GET'})
     .then( response => { 
        if (! response.ok){
          throw response.status;
        }
        return response.json();
      })
     .catch((err)=>{
        throw err;
     });
}

export const getDockerInfo = () => {

  const URL = "/api/docker/info";
  return fetch(URL, { method: 'GET'})
     .then( response => { 
        if (! response.ok){
          throw response.status;
        }
        return response.json();
      })
     .catch((err)=>{
        throw err;
     });
}
