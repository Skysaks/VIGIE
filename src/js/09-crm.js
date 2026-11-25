/* ---------- CRM : pipeline, sociétés, tâches, chiffres ---------- */
function eur(n){return Math.round(n||0).toLocaleString("fr-FR")+" €"}
function when(iso){return iso?new Date(iso).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}):""}
function dueLabel(d){var t=new Date().toISOString().slice(0,10);return d<t?'<span class="late">en retard · '+esc(when(d))+"</span>":d===t?"aujourd'hui":esc(when(d))}
function crmNav(){return'<div class="actions" style="justify-content:space-between"><div class="seg" role="tablist" aria-label="CRM">'+[["board","Pipeline"],["companies","Sociétés"],["tasks","Tâches"],["report","Chiffres"]].map(function(v){return'<button role="tab" data-cv="'+v[0]+'" aria-selected="'+(C.view===v[0]&&!C.deal&&!C.company)+'">'+v[1]+"</button>"}).join("")+"</div>"}
function crmFail(e){fail(e);C.deal=null;C.company=null}
function renderCrm(){
  if(C.deal)return api("/api/crm/deal?id="+C.deal).then(paintDeal).catch(crmFail);
  if(C.company)return api("/api/crm/company?id="+C.company).then(paintCompany).catch(crmFail);
  if(C.view==="companies")return api("/api/crm/companies?q="+encodeURIComponent(C.q)).then(paintCompanies).catch(fail);
  if(C.view==="tasks")return api("/api/crm/tasks").then(paintTasks).catch(fail);
  if(C.view==="report")return api("/api/crm/report").then(paintReport).catch(fail);
  return api("/api/crm/board").then(paintBoard).catch(fail);
}
function addDealForm(company){
  return'<form class="group" id="newDeal" style="background:var(--field);border-radius:16px;padding:14px"><div class="fields">'+(company?'<input type="hidden" id="nd_cid" value="'+company.id+'">':'<label class="f"><span>Société</span><input id="nd_company" required></label>')+'<label class="f"><span>Opportunité</span><input id="nd_title" placeholder="Ce que vous vendez"></label><label class="f"><span>Montant (€)</span><input id="nd_amount" inputmode="decimal"></label></div><div class="actions"><button class="btn sm primary" type="submit">Créer</button><button class="link" type="button" data-cadd="0">Annuler</button></div></form>';
}
function kcard(d,st){
  var i=st.map(function(x){return x.id}).indexOf(d.stage),nx=st[i+1];
  return'<div class="kcard" draggable="true" data-kd="'+d.id+'"><button class="t" data-deal="'+d.id+'">'+esc(d.company)+'</button><span class="s">'+esc(d.title)+(d.contact&&d.contact.name?" · "+esc(d.contact.name):"")+'</span><div class="a"><span>'+eur(d.amount)+"</span>"+(nx?'<button class="chip" style="min-height:28px;padding:0 10px" data-adv="'+d.id+'" data-to="'+esc(nx.id)+'" aria-label="Passer à '+esc(nx.label)+'">→</button>':"")+"</div>"+(d.alert?'<span class="pill warn">'+esc(d.alert)+"</span>":d.next_task?'<span class="s">'+esc(d.next_task.title)+" · "+dueLabel(d.next_task.due)+"</span>":"")+"</div>";
}
function paintBoard(b){
  C.stages=b.stages;C.lost=b.raisons_perte;
  var h=crmNav()+'<button class="btn sm primary" data-cadd="1">Nouvelle opportunité</button></div>';
  h+='<div class="tiles"><div><b>'+eur(b.total)+"</b>en cours</div><div><b>"+eur(b.pondere)+"</b>prévision pondérée</div><div><b>"+b.deals.length+"</b>opportunités ouvertes</div><div><b>"+b.taches_dues+"</b>tâches à faire aujourd'hui</div></div>";
  if(C.add)h+=addDealForm(null);
  if(!b.deals.length&&!C.add)h+='<div class="empty"><h1>Votre pipeline se remplit seul.</h1><p>Chaque réponse positive à un message validé ouvre ici une opportunité, avec son signal d\'origine et sa prochaine action. Vous pouvez aussi en créer une à la main.</p></div>';
  else h+='<div class="kan">'+b.stages.map(function(s){return'<div class="kcol" data-col="'+esc(s.id)+'"><h3><span>'+esc(s.label)+" · "+s.n+"</span><span>"+eur(s.total)+"</span></h3>"+b.deals.filter(function(d){return d.stage===s.id}).map(function(d){return kcard(d,b.stages)}).join("")+"</div>"}).join("")+"</div>";
  $("main").innerHTML=h;
}
function tlHtml(items){
  var lab={note:"Note",appel:"Appel",email:"E-mail",rdv:"Rendez-vous",signal:"Signal",systeme:"Suivi",moteur:"Moteur"};
  return items.length?'<div class="tl">'+items.map(function(x){return'<div><small>'+esc(when(x.at))+"<br>"+esc(x.actor)+'</small><div><span class="k '+esc(x.kind)+'">'+(lab[x.kind]||esc(x.kind))+"</span><br>"+esc(x.text).replace(/\((https?:\/\/[^\s)]+)\)/,function(_,u){return'· <a href="'+u+'" target="_blank" rel="noopener noreferrer">source</a>'})+"</div></div>"}).join("")+"</div>":'<p class="note">Rien pour l\'instant.</p>';
}
function tasksHtml(ts){return ts.map(function(t){return'<div class="task"><button class="ck" data-tdone="'+t.id+'" aria-label="Terminer : '+esc(t.title)+'"></button><div style="flex:1"><b>'+esc(t.title)+"</b>"+(t.company?'<br><span class="note">'+esc(t.company)+(t.deal?" · "+esc(t.deal):"")+"</span>":"")+'</div><span class="note">'+dueLabel(t.due)+"</span></div>"}).join("")}
function composer(cid,did){
  return'<div class="group"><h3>Consigner</h3><div class="seg" role="tablist" aria-label="Type">'+[["note","Note"],["appel","Appel"],["email","E-mail"],["rdv","Rendez-vous"]].map(function(k){return'<button role="tab" data-ck="'+k[0]+'" aria-selected="'+(C.kind===k[0])+'">'+k[1]+'</button>'}).join("")+'</div><div class="msg"><textarea id="act_text" data-grow="1" data-nosave="1" rows="1" aria-label="Ce qui s\'est dit" placeholder="Ce qui s\'est dit, ce qui a été convenu"></textarea></div><div class="actions"><button class="btn sm primary" data-act="'+cid+'" data-did="'+(did||"")+'">Consigner</button></div></div><div class="group"><h3>Prochaine action</h3><div class="actions"><label class="f" style="flex:1 1 240px"><span>À faire</span><input id="task_title" data-nosave="1" placeholder="Rappeler, envoyer la proposition…"></label>'+[["0","Aujourd\'hui"],["1","Demain"],["3","Dans 3 j"],["7","Dans 7 j"]].map(function(x){return'<button class="chip" data-tadd="'+cid+'" data-did="'+(did||"")+'" data-due="'+x[0]+'">'+x[1]+"</button>"}).join("")+"</div></div>";
}
function paintDeal(v){
  var d=v.deal,c=v.company,open=d.status==="ouvert";C.lost=v.raisons_perte;
  var h='<button class="link" data-cback="1">← Pipeline</button><article class="card">';
  h+='<div class="meta"><span class="pill '+(d.status==="gagne"?"ok":d.status==="perdu"?"warn":"")+'">'+(d.status==="gagne"?"Gagnée":d.status==="perdu"?"Perdue : "+esc(d.lost_reason):"Ouverte")+"</span><span>"+d.days_in_stage+" j à cette étape</span>"+(d.alert?'<span class="urgent">'+esc(d.alert)+"</span>":"")+"</div>";
  h+='<div><h1 class="company"><button data-company="'+c.id+'" style="text-align:left">'+esc(c.name)+'</button></h1><input class="inl signal" style="margin-top:6px" data-df="title" aria-label="Titre de l\'opportunité" value="'+esc(d.title)+'"></div>';
  h+='<div class="fields"><label class="f"><span>Montant (€)</span><input data-df="amount" inputmode="decimal" value="'+esc(d.amount||"")+'"></label><label class="f"><span>Signature prévue</span><input type="date" data-df="close_date" value="'+esc(d.close_date||"")+'"></label><label class="f"><span>Responsable</span><input data-df="owner" value="'+esc(d.owner||"")+'"></label><label class="f"><span>Interlocuteur</span><select data-df="contact_id"><option value="">Aucun</option>'+v.contacts.map(function(x){return'<option value="'+x.id+'"'+(x.id===d.contact_id?" selected":"")+">"+esc(x.name||x.email)+"</option>"}).join("")+"</select></label></div>";
  if(open){
    h+='<div class="seg" role="tablist" aria-label="Étape" style="flex-wrap:wrap;border-radius:18px">'+v.stages.map(function(s){return'<button role="tab" data-stage="'+esc(s.id)+'" aria-selected="'+(s.id===d.stage)+'">'+esc(s.label)+"</button>"}).join("")+"</div>";
    h+='<div class="actions"><button class="btn go" data-close="gagne">Gagnée</button><button class="btn" data-lose="1">Perdue</button></div>';
    if(C.lose)h+='<div class="reasons"><span>Pourquoi :</span>'+v.raisons_perte.map(function(r){return'<button class="chip" data-close="perdu" data-reason="'+esc(r)+'">'+esc(r)+"</button>"}).join("")+"</div>";
  }else h+='<div class="actions"><button class="link" data-close="rouvrir">Rouvrir cette opportunité</button></div>';
  if(v.origine)h+='<div class="group"><h3>Pourquoi cette opportunité existe</h3><p class="note">'+link(v.origine.signal_url,v.origine.signal_title)+" · "+esc(v.origine.signal_source||"")+" · "+esc(when(v.origine.signal_date))+" · score "+v.origine.total+"/100</p></div>";
  if(v.tasks.length)h+='<div class="group"><h3>À faire</h3>'+tasksHtml(v.tasks)+"</div>";
  h+=composer(c.id,d.id)+'<div class="group"><h3>Historique</h3>'+tlHtml(v.timeline)+"</div></article>";
  $("main").className="";$("main").innerHTML=h;grow();
}
function paintCompany(v){
  var c=v.company,f=function(k,l,ph){return'<label class="f"><span>'+l+'</span><input data-cf="'+k+'" value="'+esc(c[k]||"")+'"'+(ph?' placeholder="'+ph+'"':"")+"></label>"};
  var h='<button class="link" data-cback="2">← Sociétés</button><article class="card"><div><h1 class="company">'+esc(c.name)+"</h1>"+(c.blocked?'<p class="urgent" style="margin-top:6px">A demandé à ne plus être contactée.</p>':"")+"</div>";
  h+='<div class="fields">'+f("domain","Site","exemple.fr")+f("sector","Secteur")+f("city","Ville")+f("size","Taille")+f("owner","Responsable")+'</div><label class="f"><span>Notes</span><textarea data-cf="notes" data-grow="1" rows="1">'+esc(c.notes||"")+"</textarea></label>";
  h+='<div class="group"><h3>Contacts</h3>'+v.contacts.map(function(x){return'<div class="row"><div class="who"><b>'+esc(x.name||x.email)+"</b><span>"+[x.role,x.email,x.phone].filter(Boolean).map(esc).join(" · ")+"</span></div>"+(/^https?:/.test(x.linkedin||"")?'<div class="do">'+link(x.linkedin,"profil")+"</div>":"")+"</div>"}).join("")+'<form id="newContact" class="actions"><label class="f" style="flex:1 1 130px"><span>Nom</span><input id="nc_name" data-nosave="1"></label><label class="f" style="flex:1 1 120px"><span>Fonction</span><input id="nc_role" data-nosave="1"></label><label class="f" style="flex:1 1 170px"><span>E-mail</span><input id="nc_email" type="email" data-nosave="1"></label><label class="f" style="flex:1 1 120px"><span>Téléphone</span><input id="nc_phone" data-nosave="1"></label><button class="btn sm" type="submit">Ajouter</button></form></div>';
  h+='<div class="group"><div class="actions" style="justify-content:space-between"><h3>Opportunités</h3><button class="link" data-cadd="1">Nouvelle opportunité</button></div>'+(C.add?addDealForm(c):"")+v.deals.map(function(d){return'<div class="row"><div class="who"><b>'+esc(d.title)+"</b><span>"+(d.status==="ouvert"?esc((v.stages.filter(function(s){return s.id===d.stage})[0]||{label:d.stage}).label):d.status==="gagne"?"Gagnée":"Perdue")+" · "+eur(d.amount)+'</span></div><div class="do"><button class="chip" data-deal="'+d.id+'">Ouvrir</button></div></div>'}).join("")+(v.deals.length||C.add?"":'<p class="note">Aucune opportunité.</p>')+"</div>";
  if(v.tasks.length)h+='<div class="group"><h3>À faire</h3>'+tasksHtml(v.tasks)+"</div>";
  if(v.signals.length)h+='<div class="group"><h3>Signaux repérés par le moteur</h3>'+v.signals.map(function(g){return'<p class="note">'+link(g.signal_url,g.signal_title)+" · "+esc(when(g.signal_date))+" · "+g.total+"/100 · "+esc(STATUS[g.status]||g.status)+"</p>"}).join("")+"</div>";
  h+=composer(c.id,null)+'<div class="group"><h3>Historique</h3>'+tlHtml(v.timeline)+"</div></article>";
  $("main").className="";$("main").innerHTML=h;grow();
}
function paintCompanies(r){
  var h=crmNav()+(MOCK?"":'<span class="actions"><a class="link" href="/api/crm/export.csv?what=societes" download>Sociétés (CSV)</a><a class="link" href="/api/crm/export.csv?what=contacts" download>Contacts (CSV)</a><a class="link" href="/api/crm/export.csv?what=opportunites" download>Opportunités (CSV)</a></span>')+"</div>";
  h+='<div class="card"><label class="f"><span>Chercher une société, un contact, un e-mail</span><input id="crm_q" data-nosave="1" value="'+esc(C.q)+'"></label>';
  h+=r.companies.length?'<div class="scroll"><table><thead><tr><th>Société</th><th class="num">Contacts</th><th class="num">En cours</th><th class="num">Gagné</th><th>Dernière activité</th></tr></thead><tbody>'+r.companies.map(function(c){return'<tr><td><button class="rowbtn" data-company="'+c.id+'"><b>'+esc(c.name)+"</b></button>"+(c.blocked?' <span class="pill warn">opposition</span>':"")+'</td><td class="num">'+c.contacts+'</td><td class="num">'+(c.ouvertes?eur(c.en_cours):"–")+'</td><td class="num">'+(c.gagne?eur(c.gagne):"–")+"</td><td>"+esc(when(c.derniere||c.created_at))+"</td></tr>"}).join("")+"</tbody></table></div>":'<p class="note">'+(C.q?"Aucun résultat.":"Les sociétés entrent ici dès qu\'un message validé part. Vous pouvez aussi importer vos contacts.")+"</p>";
  h+='<details><summary>Importer des contacts</summary><div class="group" style="margin-top:12px"><p class="note">Une ligne par contact : société ; contact ; fonction ; e-mail ; téléphone.</p><label class="f"><span>Lignes à importer</span><textarea id="crm_imp" data-grow="1" data-nosave="1" rows="2"></textarea></label><div class="actions"><button class="btn sm" data-cimp="1">Importer</button></div></div></details></div>';
  $("main").innerHTML=h;grow();var q=$("crm_q");if(C.q&&q){q.focus();q.setSelectionRange(C.q.length,C.q.length)}
}
function paintTasks(r){
  var g=function(k){return r.tasks.filter(function(t){return t.quand===k})},sec=function(t,l){return l.length?'<div class="group"><h3>'+t+" · "+l.length+"</h3>"+tasksHtml(l)+"</div>":""};
  var h=crmNav()+"</div>"+'<div class="card">'+(r.tasks.length?sec("En retard",g("retard"))+sec("Aujourd\'hui",g("aujourdhui"))+sec("À venir",g("avenir")):'<div class="empty" style="padding:30px 0"><h1>Rien à faire.</h1><p>Vigie crée une tâche à chaque message envoyé, à chaque réponse et à chaque nouveau signal chez une société suivie.</p></div>')+"</div>";
  $("main").innerHTML=h;
}
function paintReport(r){
  var h=crmNav()+"</div>"+'<div class="card"><h1 class="h2">Chiffres</h1>';
  h+='<div class="tiles"><div><b>'+eur(r.en_cours)+"</b>en cours</div><div><b>"+eur(r.pondere)+"</b>prévision pondérée</div><div><b>"+eur(r.montant_gagne)+"</b>gagné</div><div><b>"+eur(r.gagne_ce_mois)+"</b>gagné ce mois</div><div><b>"+(r.taux_gain==null?"–":r.taux_gain+" %")+"</b>taux de gain</div><div><b>"+(r.cycle_moyen_jours==null?"–":r.cycle_moyen_jours+" j")+"</b>cycle moyen</div></div>";
  h+='<div class="group"><h3>Ce que rapporte chaque signal</h3><p class="note">Du fait de presse au chiffre d\'affaires : c\'est ce tableau qui dit quels signaux méritent votre temps.</p>'+(r.par_signal.length?'<div class="scroll"><table><thead><tr><th>Signal d\'origine</th><th class="num">Opportunités</th><th class="num">Gagnées</th><th class="num">Perdues</th><th class="num">En cours</th><th class="num">Gagné</th></tr></thead><tbody>'+r.par_signal.map(function(x){return"<tr><td>"+esc(x.signal==="manuel"?"Créées à la main":sig(x.signal))+'</td><td class="num">'+x.opportunites+'</td><td class="num">'+x.gagnees+'</td><td class="num">'+x.perdues+'</td><td class="num">'+eur(x.en_cours)+'</td><td class="num">'+eur(x.montant_gagne)+"</td></tr>"}).join("")+"</tbody></table></div>":'<p class="note">Aucune opportunité pour l\'instant.</p>')+"</div>";
  if(r.a_surveiller.length)h+='<div class="group"><h3>À surveiller</h3>'+r.a_surveiller.map(function(d){return'<div class="row"><div class="who"><b>'+esc(d.company)+"</b><span>"+esc(d.title)+" · "+eur(d.amount)+" · "+esc(d.alert)+'</span></div><div class="do"><button class="chip" data-deal="'+d.id+'">Ouvrir</button></div></div>'}).join("")+"</div>";
  if(r.raisons_perte.length)h+='<div class="group"><h3>Pourquoi vous perdez</h3><p class="note">'+r.raisons_perte.map(function(x){return esc(x.raison)+" · "+x.n}).join(" &nbsp; ")+"</p></div>";
  $("main").innerHTML=h+"</div>";
}
function crmReload(){return api("/api/state").then(function(st){S.st=st;render()})}

