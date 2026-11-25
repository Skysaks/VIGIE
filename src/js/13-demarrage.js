/* ---------- démarrage ---------- */
refresh().then(function(){
  if(MOCK)return;
  if(S.st.auth===false||!S.ws)return;
  var w=cur(),last=w&&w.counts.last_run;
  if(S.st.auth!==false&&S.st.mode!=="serveur"&&S.st.settings.user_name&&last&&Date.now()-new Date(last)>12*36e5&&!S.st.run.running)startRun(); // veille automatique à l'ouverture
}).catch(fail);
