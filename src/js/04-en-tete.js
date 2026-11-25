/* ---------- en-tête ---------- */
function renderHead(){
  if(S.st.auth===false||!S.ws||S.onb){$("nav").innerHTML="";$("run").hidden=true;$("runInfo").textContent="";return}
  $("run").hidden=false;
  var q=by("a_valider").length;
  var tabs=[["today","À valider",q],["leads","Leads"],["crm","CRM",S.st.taches_dues],["suivi","Suivi"],["config","Réglages"]];
  var sw=S.st.workspaces.length>1?'<select id="wsSel" class="sel" aria-label="Espace de travail">'+S.st.workspaces.map(function(x){return'<option value="'+x.id+'"'+(x.id===S.ws?" selected":"")+">"+esc(x.name)+"</option>"}).join("")+"</select>":"";
  $("nav").innerHTML=sw+tabs.map(function(t){return'<button data-tab="'+t[0]+'" aria-current="'+(S.tab===t[0])+'">'+t[1]+(t[2]?'<span class="n">'+t[2]+"</span>":"")+"</button>"}).join("");
  var r=S.st.run;
  $("run").textContent=r.running?"Veille en cours…":(MOCK?"Rejouer la démo":"Lancer la veille");
  $("run").disabled=r.running;
  $("runInfo").textContent=r.running?r.message:(r.error?"Veille interrompue : "+r.error:"");
}
function poll(){api("/api/state").then(function(st){S.st=st;if(st.auth===false)return render();renderHead();if(st.run.running){setTimeout(poll,1000)}else{var s=st.run.stats;refresh().then(function(){if(s)toast(s.a_valider+" nouvelles fiches à valider, "+s.observe+" sous observation"+(s.perimes?", "+s.perimes+" périmées retirées":"")+(s.erreurs_flux?", "+s.erreurs_flux+" flux en erreur":""))})}}).catch(fail)}
function startRun(){if(!S.ws)return;api("/api/run",{ws:S.ws}).then(function(){S.st.run.running=true;S.st.run.message="Démarrage";renderHead();poll()}).catch(fail)}

