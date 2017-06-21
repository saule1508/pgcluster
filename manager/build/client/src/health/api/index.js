
export const getHealth = (s) => {
  const URL = `/api/health?service=${s}`;
  return fetch(URL, { method: 'GET'})
     .then( response => { 
        if (! response.ok){
          if (response.statusCode === 503){
            return response.json().then((json)=>{
                throw json
              });
          } else {
            throw response.statusText;
          }
        }
      })
     .catch((err)=>{

        throw err;
     });
}
