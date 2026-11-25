/* ---------- accès aux données : serveur local, ou moteur de démonstration embarqué ---------- */
function api(path,body){
  if(MOCK){return new Promise(function(ok,ko){try{ok(JSON.parse(JSON.stringify(mock(path,body))))}catch(e){ko(e)}})}
  var o=body===undefined?{}:{method:"POST",headers:{"Content-Type":"application/json","X-Vigie":"1"},body:JSON.stringify(body)};
  return fetch(path,o).then(function(r){return r.json().then(function(j){
    if(r.status===401&&S.st&&S.st.auth!==false){S.st={auth:false,mode:"serveur"};render()}
    if(!r.ok)throw new Error(j.error||"Erreur");return j})});
}
function refresh(){
  return api("/api/state").then(function(st){
    S.st=st;if(st.auth===false){S.leads=[];render();return}
    if(!S.ws||!cur())S.ws=st.workspaces.length?st.workspaces[0].id:null;
    if(!S.ws){S.leads=[];render();return}
    return api("/api/leads?ws="+S.ws+"&status=").then(function(r){S.leads=r.leads;render()});
  });
}

