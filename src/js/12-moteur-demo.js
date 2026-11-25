/* ---------- moteur de démonstration embarqué (mêmes règles que le serveur local) ---------- */
var M=null;
function mockReset(){M=JSON.parse(JSON.stringify(window.VIGIE_SEED));M.nextEv=1}
function refus(m){throw new Error(m)}
function mNow(){return new Date().toISOString()}
function mLead(id){var l=M.leads.filter(function(x){return x.id===id})[0];if(!l)refus("Lead introuvable.");return l}
function mEv(id,actor,kind,detail){(M.events[id]=M.events[id]||[]).push({at:mNow(),actor:actor,kind:kind,detail:detail||""})}
function mWarn(l){var w=[],cfg=M.state.workspaces[0].config,ok=(l._text+" "+cfg.offer+" "+cfg.value_prop+" "+cfg.tone.signature+" "+cfg.tone.optout).match(/\d+/g)||[];
  ((l.draft_body||"").match(/\d+/g)||[]).filter(function(n,i,a){return a.indexOf(n)===i}).forEach(function(n){if(ok.indexOf(n)<0)w.push("Le nombre « "+n+" » n'apparaît ni dans le signal ni dans votre offre.")});
  ((l.draft_body||"").match(PH)||[]).filter(function(n,i,a){return a.indexOf(n)===i}).forEach(function(p){w.push("Champ à compléter : "+p)});l.draft_warnings=w}
function mActor(){var a=M.state.settings.user_name;if(!a)refus("Indiquez votre nom : une validation est toujours nominative.");return a}
function mDecide(l,dec,reason){
  var a=mActor();
  if(dec==="valider"){
    if(["a_valider","observe","ecarte"].indexOf(l.status)<0)refus("Ce lead n'est pas en attente de validation.");
    if(!(l.draft_body||"").trim())refus("Aucun brouillon à valider. Rédigez ou générez le message d'abord.");
    var miss=((l.draft_subject||"")+l.draft_body).match(PH);
    if(miss)refus("Le message contient des champs à compléter : "+miss.filter(function(n,i,x){return x.indexOf(n)===i}).join(", ")+".");
    l.status="valide";l.validated_by=a;l.validated_at=mNow();mEv(l.id,a,"valide","étape "+l.step);
  }else if(dec==="rejeter"){l.status="rejete";l.reject_reason=reason||"non précisé";mEv(l.id,a,"rejete",l.reject_reason)}
  else if(dec==="observer"){l.status="observe";mEv(l.id,a,"observe","remis sous observation")}
  else if(dec==="annuler"){
    if(l.status==="envoye"){l.status="valide";l.sent_at=null;mEv(l.id,a,"annule","envoi annulé");cUnsent(l);return}
    if(["valide","rejete"].indexOf(l.status)<0)refus("Seule une validation ou un écart non envoyé peut être annulé.");
    l.status=l.draft_body?"a_valider":"observe";l.validated_by=null;l.validated_at=null;l.reject_reason=null;mEv(l.id,a,"annule","retour en attente de validation");
  }
}
function mEdit(l,f){
  if(l.status==="envoye"||l.status==="repondu")refus("Ce message est déjà parti : il ne peut plus être modifié.");
  var touched=false;
  for(var k in f){if(FIELDS.indexOf(k)<0)continue;var v=(f[k]||"").trim()||null;if(v===(l[k]||null))continue;
    if(k==="contact_email"){l.email_status=v?"saisi":"inconnu";l.email_note="saisi à la main par "+(M.state.settings.user_name||"vous")}
    if(k==="contact_name"){l.contact_source=v?"saisi à la main":null}
    if(["draft_subject","draft_body","contact_email"].indexOf(k)>=0)touched=true;l[k]=v}
  if(l.status==="valide"&&touched){l.status="a_valider";l.validated_by=null;l.validated_at=null}
  mWarn(l);
}
function mTemplate(l,step){
  var c=M.state.workspaces[0].config,hi=l.contact_name?"Bonjour "+l.contact_name.split(" ")[0]+",":"Bonjour,";
  var body=step>1?hi+"\n\nJe reviens vers vous au sujet de mon message précédent : "+l.signal_summary+"\n\nEst-ce un sujet pour vous en ce moment, ou préférez-vous que je revienne plus tard ?":hi+"\n\nJ'ai lu dans "+l.signal_source+" : « "+(l.signal_quote||l.signal_title).replace(/[ .]+$/,"")+" ».\n\n"+c.value_prop+"\n\nEst-ce un sujet sur lequel un échange de quinze minutes vous serait utile ?";
  if(step>1)l.draft_subject="Re: "+(l.draft_subject||l.company);else l.draft_subject=l.signal_title;
  l.draft_body=body+"\n\n"+c.tone.signature+"\n\n"+c.tone.optout;l.step=step;l.status="a_valider";l.validated_by=null;l.validated_at=null;mWarn(l);
}
function mReport(){
  var c=M.state.workspaces[0].config,L=M.leads,cnt=function(f){return L.filter(f).length},k={decouvert:L.length,valide:0,rejete:0,envoye:0,repondu:0};
  Object.keys(M.events).forEach(function(id){M.events[id].forEach(function(e){if(k[e.kind]!==undefined&&e.kind!=="decouvert")k[e.kind]++})});
  var types=L.map(function(l){return l.signal_type}).filter(function(t,i,a){return a.indexOf(t)===i});
  var per=types.map(function(t){var x=L.filter(function(l){return l.signal_type===t}),s=function(a){return x.filter(function(l){return a.indexOf(l.status)>=0}).length},env=s(["envoye","repondu"]),rep=s(["repondu"]);
    return{label:(c.signals.filter(function(g){return g.type===t})[0]||{label:t}).label,leads:x.length,valides:s(["valide","envoye","repondu"]),rejetes:s(["rejete"]),envoyes:env,reponses:rep,taux_reponse:env?Math.round(1000*rep/env)/10:null}});
  var rs={};L.filter(function(l){return l.status==="rejete"}).forEach(function(l){rs[l.reject_reason]=(rs[l.reject_reason]||0)+1});
  return{semaine:k,par_signal:per,conseils:per.some(function(p){return p.envoyes})?[]:["Aucun envoi enregistré : pas encore de quoi comparer les signaux entre eux."],raisons_rejet:Object.keys(rs).map(function(r){return{raison:r,n:rs[r]}}),en_attente:cnt(function(l){return l.status==="a_valider"}),a_relancer:[],remontes:[]};
}
/* CRM de démonstration : mêmes règles que crm.py, en mémoire */
function cDay(n){return new Date(Date.now()+n*864e5).toISOString().slice(0,10)}
function cKey(n){return(n||"").toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g,"")}
function cCo(name,create){var k=cKey(name);if(!k)refus("Nom de société manquant.");var c=M.crm.companies.filter(function(x){return x.key===k})[0];if(!c&&create!==false){c={id:M.crm.n++,name:name,key:k,blocked:0,created_at:mNow()};M.crm.companies.push(c)}return c}
function cGet(list,id,msg){var x=M.crm[list].filter(function(y){return y.id===id})[0];if(!x)refus(msg);return x}
function cLog(cid,kind,text,did,lid){if(!(text||"").trim())refus("Écrivez quelques mots.");M.crm.acts.push({id:M.crm.n++,company_id:cid,deal_id:did||null,lead_id:lid||null,kind:kind,text:text,at:mNow(),actor:M.state.settings.user_name||"moteur"})}
function cTask(cid,title,due,did,lid,auto){if(!(title||"").trim())refus("Donnez un titre à la tâche.");M.crm.tasks.push({id:M.crm.n++,company_id:cid,deal_id:did||null,lead_id:lid||null,title:title,due:cDay(parseInt(due,10)||0),done_at:null,auto:auto?1:0})}
function cContact(cid,l){if(!l.contact_name&&!l.contact_email)return null;var x=M.crm.contacts.filter(function(c){return c.company_id===cid&&(c.email===l.contact_email||c.name===l.contact_name)})[0];if(!x){x={id:M.crm.n++,company_id:cid,name:l.contact_name,role:l.contact_role,email:l.contact_email,phone:l.phone||null,linkedin:l.linkedin_url};M.crm.contacts.push(x)}return x}
function cRich(d){var o={};for(var k in d)o[k]=d[k];var c=cGet("companies",d.company_id,"Société introuvable."),t=cDay(0);o.company=c.name;o.contact=M.crm.contacts.filter(function(x){return x.id===d.contact_id})[0]||null;
  o.next_task=M.crm.tasks.filter(function(x){return!x.done_at&&(x.deal_id===d.id||(!x.deal_id&&x.company_id===d.company_id))}).sort(function(a,b){return a.due<b.due?-1:1})[0]||null;
  var last=M.crm.acts.filter(function(a){return a.company_id===d.company_id}).map(function(a){return a.at}).sort().pop()||d.created_at;o.idle_days=Math.floor((Date.now()-new Date(last))/864e5);o.days_in_stage=Math.floor((Date.now()-new Date(d.stage_at))/864e5);
  o.alert=d.status!=="ouvert"?null:o.next_task&&o.next_task.due<t?"action en retard":!o.next_task&&o.idle_days>=14?"sans nouvelle depuis "+o.idle_days+" j":!o.next_task?"pas de prochaine action":null;return o}
function cTl(cid){return M.crm.acts.filter(function(a){return a.company_id===cid}).sort(function(a,b){return a.at<b.at?1:-1})}
function cOpenTasks(cid){return M.crm.tasks.filter(function(t){return t.company_id===cid&&!t.done_at}).sort(function(a,b){return a.due<b.due?-1:1})}
function cDue(){var t=cDay(0);return M.crm.tasks.filter(function(x){return!x.done_at&&x.due<=t}).length}
function cProb(){var p={};M.crm.stages.forEach(function(s){p[s.id]=s.prob});return p}
function cNewDeal(c,o){var d={id:M.crm.n++,company_id:c.id,contact_id:o.contact_id||null,lead_id:o.lead_id||null,title:o.title||c.name,stage:o.stage||M.crm.stages[0].id,status:"ouvert",amount:o.amount||0,close_date:null,owner:M.state.settings.user_name,signal_type:o.signal_type||null,source:o.source||"manuel",lost_reason:null,created_at:mNow(),stage_at:mNow(),closed_at:null};M.crm.deals.push(d);cLog(c.id,"systeme","Opportunité créée : "+d.title,d.id);return d}
function cSent(l){var c=cCo(l.company);cContact(c.id,l);cLog(c.id,"email",(l.step===1?"Message envoyé":"Relance "+(l.step-1)+" envoyée")+" : "+(l.draft_subject||""),null,l.id);M.crm.tasks.forEach(function(t){if(t.lead_id===l.id&&t.auto&&!t.done_at)t.done_at=mNow()});if(l.step<3)cTask(c.id,"Relancer "+l.company+" si pas de réponse",7,null,l.id,true)}
function cUnsent(l){var a=M.crm.acts.filter(function(x){return x.lead_id===l.id&&x.kind==="email"}).pop();if(a)M.crm.acts.splice(M.crm.acts.indexOf(a),1);M.crm.tasks=M.crm.tasks.filter(function(t){return!(t.lead_id===l.id&&t.auto&&!t.done_at)})}
function cReply(l,kind){var c=cCo(l.company),ct=cContact(c.id,l);cLog(c.id,"email",{positif:"Réponse positive",neutre:"Réponse neutre",negatif:"Réponse négative",stop:"Opposition : ne plus contacter"}[kind],null,l.id);
  M.crm.tasks.forEach(function(t){if(t.lead_id===l.id&&t.auto&&!t.done_at)t.done_at=mNow()});if(kind==="stop"){c.blocked=1;return}if(kind!=="positif"&&kind!=="neutre")return;
  var d=M.crm.deals.filter(function(x){return x.company_id===c.id&&x.status==="ouvert"})[0]||cNewDeal(c,{contact_id:ct&&ct.id,lead_id:l.id,title:l.company+" · "+sig(l.signal_type),stage:"discussion",signal_type:l.signal_type,source:"moteur"});
  cTask(c.id,(kind==="positif"?"Proposer un rendez-vous à ":"Répondre à ")+(l.contact_name||l.company)+(kind==="positif"?"":" et préciser son besoin"),kind==="positif"?1:2,d.id,l.id,true)}
function cBoard(){var pr=cProb(),ds=M.crm.deals.filter(function(d){return d.status==="ouvert"}).map(cRich).sort(function(a,b){return b.amount-a.amount});
  return{stages:M.crm.stages.map(function(s){var x=ds.filter(function(d){return d.stage===s.id});return{id:s.id,label:s.label,prob:s.prob,n:x.length,total:x.reduce(function(t,d){return t+d.amount},0)}}),deals:ds,total:ds.reduce(function(t,d){return t+d.amount},0),pondere:Math.round(ds.reduce(function(t,d){return t+d.amount*(pr[d.stage]||0)/100},0)),taches_dues:cDue(),raisons_perte:M.crm.lost}}
function cReport(){var pr=cProb(),D=M.crm.deals,op=D.filter(function(d){return d.status==="ouvert"}),won=D.filter(function(d){return d.status==="gagne"}),lost=D.filter(function(d){return d.status==="perdu"}),sum=function(a){return a.reduce(function(t,d){return t+d.amount},0)},by={},rs={},m=new Date().toISOString().slice(0,7);
  D.forEach(function(d){var k=d.signal_type||"manuel",r=by[k]=by[k]||{signal:k,opportunites:0,gagnees:0,perdues:0,montant_gagne:0,en_cours:0};r.opportunites++;if(d.status==="gagne"){r.gagnees++;r.montant_gagne+=d.amount}else if(d.status==="perdu")r.perdues++;else r.en_cours+=d.amount});
  lost.forEach(function(d){rs[d.lost_reason||"non précisé"]=(rs[d.lost_reason||"non précisé"]||0)+1});
  var cy=won.map(function(d){return Math.max(0,Math.round((new Date(d.closed_at)-new Date(d.created_at))/864e5))});
  return{ouvertes:op.length,en_cours:sum(op),pondere:Math.round(op.reduce(function(t,d){return t+d.amount*(pr[d.stage]||0)/100},0)),gagnees:won.length,montant_gagne:sum(won),gagne_ce_mois:sum(won.filter(function(d){return(d.closed_at||"").slice(0,7)===m})),perdues:lost.length,taux_gain:won.length+lost.length?Math.round(1000*won.length/(won.length+lost.length))/10:null,cycle_moyen_jours:cy.length?Math.round(cy.reduce(function(a,b){return a+b},0)/cy.length):null,
    par_signal:Object.keys(by).map(function(k){return by[k]}).sort(function(a,b){return b.montant_gagne-a.montant_gagne||b.opportunites-a.opportunites}),raisons_perte:Object.keys(rs).map(function(k){return{raison:k,n:rs[k]}}),a_surveiller:op.map(cRich).filter(function(d){return d.alert}),taches_en_retard:0}}
function cMock(p,q,b){
  var id=function(x){return parseInt(x,10)||0};
  if(b===undefined){
    if(p==="/api/crm/board")return cBoard();
    if(p==="/api/crm/deal"){var d=cGet("deals",id(q.id),"Opportunité introuvable."),ld=M.leads.filter(function(l){return l.id===d.lead_id})[0];return{deal:cRich(d),company:cGet("companies",d.company_id,""),stages:M.crm.stages,contacts:M.crm.contacts.filter(function(c){return c.company_id===d.company_id}),timeline:cTl(d.company_id),tasks:cOpenTasks(d.company_id),origine:ld?{id:ld.id,signal_title:ld.signal_title,signal_url:ld.signal_url,signal_source:ld.signal_source,signal_date:ld.signal_date,total:ld.total}:(d.origine||null),raisons_perte:M.crm.lost}}
    if(p==="/api/crm/companies"){var s=(q.q||"").toLowerCase();return{companies:M.crm.companies.filter(function(c){return!s||c.name.toLowerCase().indexOf(s)>=0||M.crm.contacts.some(function(x){return x.company_id===c.id&&((x.name||"")+" "+(x.email||"")).toLowerCase().indexOf(s)>=0})}).map(function(c){var ds=M.crm.deals.filter(function(d){return d.company_id===c.id}),o={};for(var k in c)o[k]=c[k];o.contacts=M.crm.contacts.filter(function(x){return x.company_id===c.id}).length;o.ouvertes=ds.filter(function(d){return d.status==="ouvert"}).length;o.en_cours=ds.filter(function(d){return d.status==="ouvert"}).reduce(function(t,d){return t+d.amount},0);o.gagne=ds.filter(function(d){return d.status==="gagne"}).reduce(function(t,d){return t+d.amount},0);o.derniere=(cTl(c.id)[0]||{}).at||null;return o}).sort(function(a,b){return(b.derniere||b.created_at)>(a.derniere||a.created_at)?1:-1})}}
    if(p==="/api/crm/company"){var c=cGet("companies",id(q.id),"Société introuvable.");return{company:c,contacts:M.crm.contacts.filter(function(x){return x.company_id===c.id}),deals:M.crm.deals.filter(function(d){return d.company_id===c.id}).map(cRich),tasks:cOpenTasks(c.id),signals:M.leads.filter(function(l){return cKey(l.company)===c.key}),timeline:cTl(c.id),stages:M.crm.stages}}
    if(p==="/api/crm/tasks"){var t=cDay(0);return{tasks:M.crm.tasks.filter(function(x){return!x.done_at}).sort(function(a,b){return a.due<b.due?-1:1}).map(function(x){var o={};for(var k in x)o[k]=x[k];o.company=cGet("companies",x.company_id,"").name;o.deal=x.deal_id?cGet("deals",x.deal_id,"").title:null;o.quand=x.due<t?"retard":x.due===t?"aujourdhui":"avenir";return o})}}
    if(p==="/api/crm/report")return cReport();
    refus("Indisponible dans la démonstration.");
  }
  if(p==="/api/crm/deal/save"){var amt=b.amount===undefined||b.amount===""?null:parseFloat(String(b.amount).replace(/\s/g,"").replace(",","."));if(amt!==null&&isNaN(amt))refus("Montant invalide.");
    if(b.id){var d2=cGet("deals",b.id,"Opportunité introuvable.");if(b.title)d2.title=b.title;if(amt!==null)d2.amount=Math.max(0,amt);if("close_date" in b)d2.close_date=b.close_date||null;if("owner" in b)d2.owner=b.owner;if("contact_id" in b)d2.contact_id=b.contact_id;return{deal:d2}}
    var co=b.company_id?cGet("companies",b.company_id,"Société introuvable."):cCo(b.company);return{deal:cNewDeal(co,{title:b.title,amount:amt||0})}}
  if(p==="/api/crm/deal/move"){var d3=cGet("deals",b.id,"Opportunité introuvable."),lb={};M.crm.stages.forEach(function(s){lb[s.id]=s.label});
    if(b.to==="gagne"||b.to==="perdu"){d3.status=b.to;d3.closed_at=mNow();d3.lost_reason=b.to==="perdu"?(b.reason||"non précisé"):null;cLog(d3.company_id,"systeme",b.to==="gagne"?"Opportunité gagnée : "+d3.title:"Opportunité perdue : "+d3.lost_reason,d3.id);M.crm.tasks.forEach(function(t){if(t.deal_id===d3.id&&!t.done_at)t.done_at=mNow()})}
    else if(b.to==="rouvrir"){d3.status="ouvert";d3.closed_at=null;d3.lost_reason=null;cLog(d3.company_id,"systeme","Opportunité rouverte",d3.id)}
    else if(lb[b.to]){if(b.to!==d3.stage){cLog(d3.company_id,"systeme","Étape : "+lb[d3.stage]+" → "+lb[b.to],d3.id);d3.stage=b.to;d3.stage_at=mNow()}}else refus("Étape inconnue.");return{deal:d3}}
  if(p==="/api/crm/activity/add"){cGet("companies",b.company_id,"Société introuvable.");cLog(b.company_id,["note","appel","email","rdv"].indexOf(b.kind)>=0?b.kind:"note",b.text,b.deal_id);return{id:1}}
  if(p==="/api/crm/task/add"){cGet("companies",b.company_id,"Société introuvable.");cTask(b.company_id,b.title,b.due,b.deal_id);return{id:1}}
  if(p==="/api/crm/task/done"){cGet("tasks",b.id,"Tâche introuvable.").done_at=b.done===false?null:mNow();return{ok:true}}
  if(p==="/api/crm/company/save"){var c2=cGet("companies",b.id,"Société introuvable.");for(var k in b)if(k!=="id")c2[k]=b[k];return{company:c2}}
  if(p==="/api/crm/contact/save"){cGet("companies",b.company_id,"Société introuvable.");if(!b.name&&!b.email)refus("Indiquez un nom ou un e-mail.");var nc={id:M.crm.n++,company_id:b.company_id,name:b.name,role:b.role,email:b.email,phone:b.phone};M.crm.contacts.push(nc);return{contact:nc}}
  if(p==="/api/crm/import"){var nco=0,nct=0;(b.text||"").split("\n").forEach(function(line){var x=line.split(/[;\t]/).map(function(y){return y.trim()});if(!x[0]||/^soci[ée]t[ée]$/i.test(x[0]))return;var had=M.crm.companies.length,c3=cCo(x[0]);nco+=M.crm.companies.length-had;if(x[1]||x[3]){M.crm.contacts.push({id:M.crm.n++,company_id:c3.id,name:x[1],role:x[2],email:x[3],phone:x[4]});nct++}});return{societes:nco,contacts:nct}}
  refus("Indisponible dans la démonstration.");
}
function mock(path,b){
  if(!M)mockReset();
  var p=path.split("?")[0],q={};(path.split("?")[1]||"").split("&").forEach(function(x){var y=x.split("=");q[y[0]]=decodeURIComponent(y[1]||"")});
  var view=function(l){var o={};for(var k in l)if(k!=="_text")o[k]=l[k];return o};
  if(p.indexOf("/api/crm/")===0)return cMock(p,q,b);
  if(b===undefined){
    if(p==="/api/state"){M.state.taches_dues=cDue();return M.state}
    if(p==="/api/leads")return{leads:M.leads.filter(function(l){return!q.status||l.status===q.status}).sort(function(a,c){return(c.total||0)-(a.total||0)}).map(view)};
    if(p==="/api/lead")return{lead:view(mLead(parseInt(q.id,10))),events:M.events[q.id]||[]};
    if(p==="/api/journal")return{journal:M.journal};
    if(p==="/api/report"){var rp=mReport();rp.suggestions=M.suggestions||[];return rp}
    if(p==="/api/suppression")return{items:M.suppression};
    refus("Indisponible dans la démonstration.");
  }
  var l=b.id!=null&&p.indexOf("/api/lead/")===0?mLead(b.id):null;
  if(p==="/api/setup"){
    var n=(b.name||"").trim();if(!n)refus("Votre nom est nécessaire : chaque validation est nominative.");
    M.state.settings.user_name=n;var second=[b.company,b.phone].filter(Boolean).join(" · "),sg=n+(second?"\n"+second:"");
    M.state.workspaces.forEach(function(w){w.config.tone.signature=sg;w.config.tone.sender_name=n;if(b.company)w.config.tone.sender_company=b.company});
    M.leads.forEach(function(x){if(x.draft_body){x.draft_body=x.draft_body.replace("[VOTRE NOM]\n[VOTRE SOCIÉTÉ] · [VOTRE TÉLÉPHONE]",sg);mWarn(x)}});
    return{settings:M.state.settings};
  }
  if(p==="/api/lead/go"){var f=b.fields||{};if(Object.keys(f).length)mEdit(l,f);if(l.status!=="valide")mDecide(l,"valider");return{lead:view(l)}}
  if(p==="/api/lead/decision"){mDecide(l,b.decision,b.reason);return{lead:view(l)}}
  if(p==="/api/lead/update"){mEdit(l,b.fields||{});return{lead:view(l)}}
  if(p==="/api/lead/redraft"){if(l.status==="envoye"||l.status==="repondu")refus("Ce message est déjà parti.");mTemplate(l,l.step);return{lead:view(l)}}
  if(p==="/api/lead/followup"){if(l.status!=="envoye")refus("Une relance ne se prépare que pour un message envoyé.");if(l.step>=3)refus("Deux relances au maximum par lead.");mTemplate(l,l.step+1);return{lead:view(l)}}
  if(p==="/api/lead/send"){
    if(l.status!=="valide"||!l.validated_by)refus("Rien ne part sans l'humain : ce lead n'a pas été validé.");
    if(!l.contact_email)refus("Aucune adresse e-mail pour ce lead.");
    if(M.suppression.some(function(s){return s.value===l.contact_email.toLowerCase()||s.value===l.contact_email.split("@")[1]}))refus("Destinataire présent dans la liste d'opposition.");
    l.status="envoye";l.sent_at=mNow();mEv(l.id,l.validated_by,"envoye","envoi simulé (démonstration)");cSent(l);return{lead:view(l)}}
  if(p==="/api/lead/reply"){if(l.status!=="envoye")refus("Aucun message envoyé pour ce lead.");l.status="repondu";l.reply_kind=b.kind;l.replied_at=mNow();mEv(l.id,mActor(),"repondu",b.kind);cReply(l,b.kind);if(b.kind==="stop"&&l.contact_email)M.suppression.unshift({value:l.contact_email.toLowerCase(),reason:"a répondu STOP"});return{lead:view(l)}}
  if(p==="/api/suppression/add"){var v=(b.value||"").trim().toLowerCase();if(!v)refus("Adresse ou domaine vide.");M.suppression.unshift({value:v,reason:"ajout manuel"});return{ok:true}}
  if(p==="/api/settings"){["user_name","llm","search","verifier","smtp","webhook"].forEach(function(k){if(b[k]!==undefined)M.state.settings[k]=b[k]});return{settings:M.state.settings}}
  if(p==="/api/workspace/save"){var w=M.state.workspaces[0];w.name=b.name||w.name;w.config=b.config;return{id:w.id}}
  if(p==="/api/run"){var keep=M.state.settings;mockReset();M.state.settings.user_name=keep.user_name;if(keep.user_name)mock("/api/setup",{name:keep.user_name});M.state.run.stats=window.VIGIE_SEED.stats;S.i=0;return{ok:true}}
  if(p==="/api/suggestions/apply"){var g=b.action||{},cf=M.state.workspaces[0].config,sg2=cf.signals.filter(function(x){return x.type===g.type})[0];if(!sg2)refus("Réglage inconnu.");mActor();var old=sg2.weight;if(g.kind==="weight")sg2.weight=Math.max(0,Math.min(30,old+g.delta));else sg2.active=false;M.suggestions=(M.suggestions||[]).filter(function(x){return x.action.type!==g.type});return{detail:sg2.label+" : "+old+" → "+sg2.weight+" points"}}
  if(p==="/api/import/exclusions"){var items=(b.text||"").split(/[\n;,]+/).map(function(x){return x.trim()}).filter(Boolean),co=0,ad=0;items.forEach(function(x){if(x.indexOf("@")>=0||/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(x)){M.suppression.unshift({value:x.toLowerCase(),reason:"import"});ad++}else{M.state.workspaces[0].config.exclusions.companies.push(x);co++}});return{societes:co,adresses:ad}}
  if(p==="/api/settings/test")refus("Les services externes ne sont pas joignables depuis la démonstration.");
  refus("Indisponible dans la démonstration.");
}

