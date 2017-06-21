
export const getPgpool = () => {
  const URL = "/api/postgres/pool_nodes";
  return fetch(URL, { method: 'GET'})
     .then( response => { 
        if (! response.ok){
          return response.json().then((json)=>{
            throw json;
          });
        }
        return response.json();
      })
     .catch((err)=>{
        throw err;
     });
}

export const getRepl = () => {

  const URL = "/api/postgres/repl_nodes";
  return fetch(URL, { method: 'GET'})
     .then( response => { 
     		if (! response.ok){
              throw response.statusText;
     		}
     		return response.json();
     	})
     .catch((err)=>{
     		throw err;
     });
}

export const getStatActivity = () => {

  const URL = "/api/postgres/stat_activity";
  return fetch(URL, { method: 'GET'})
     .then( response => { 
        if (! response.ok){
          throw response.statusText;
        }
        return response.json();
      })
     .catch((err)=>{
        throw err;
     });
}