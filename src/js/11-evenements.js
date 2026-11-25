/* ---------- événements ---------- */
document.addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;var d=b.dataset,l;
  if(d.tab){S.tab=d.tab;S.open=null;return render()}
  if(d.auth){S.authMode=d.auth;return render()}
  if(d.cv){C.view=d.cv;C.deal=null;C.company=null;C.add=false;return render()}
  if(d.cback){C.deal=null;C.company=null;C.add=false;C.lose=false;C.view=d.cback==="2"?"companies":"board";return render()}
  if(d.deal){C.deal=parseInt(d.deal,10);C.company=null;C.add=false;C.lose=false;S.tab="crm";window.scrollTo(0,0);return render()}
  if(d.company){C.company=parseInt(d.company,10);C.deal=null;C.add=false;window.scrollTo(0,0);return render()}
  if(d.cadd!==undefined){C.add=d.cadd==="1";return render()}
  if(d.ck){C.kind=d.ck;var keep=$("act_text")?$("act_text").value:"";render();return setTimeout(function(){var a=$("act_text");if(a){a.value=keep;a.focus()}},60)}
  if(d.adv)return api("/api/crm/deal/move",{id:parseInt(d.adv,10),to:d.to}).then(crmReload).catch(fail);
  if(d.stage)return api("/api/crm/deal/move",{id:C.deal,to:d.stage}).then(crmReload).catch(fail);
  if(d.lose){C.lose=!C.lose;return render()}
  if(d.close)return api("/api/crm/deal/move",{id:C.deal,to:d.close,reason:d.reason}).then(function(){C.lose=false;toast(d.close==="gagne"?"Gagnée. Bravo.":d.close==="perdu"?"Notée comme perdue.":"Rouverte.");return crmReload()}).catch(fail);
  if(d.act)return api("/api/crm/activity/add",{company_id:parseInt(d.act,10),deal_id:d.did?parseInt(d.did,10):null,kind:C.kind,text:$("act_text").value}).then(function(){toast("Consigné.");return crmReload()}).catch(fail);
  if(d.tadd)return api("/api/crm/task/add",{company_id:parseInt(d.tadd,10),deal_id:d.did?parseInt(d.did,10):null,title:$("task_title").value,due:d.due}).then(function(){toast("Tâche ajoutée.");return crmReload()}).catch(fail);
  if(d.tdone){var tid=parseInt(d.tdone,10);return api("/api/crm/task/done",{id:tid}).then(function(){toast("Fait.","Annuler",function(){api("/api/crm/task/done",{id:tid,done:false}).then(crmReload).catch(fail)},5000);return crmReload()}).catch(fail)}
  if(d.cimp)return api("/api/crm/import",{text:$("crm_imp").value}).then(function(r){toast(r.societes+" société(s) et "+r.contacts+" contact(s) ajoutés.");return crmReload()}).catch(fail);
  if(d.onb!==undefined){S.onb=d.onb==="1";window.scrollTo(0,0);return render()}
  if(d.ch){S.ch=d.ch;return render()}
  if(d.copy){l=cardLead(b);var ta=b.closest("[data-card]").querySelector('[data-f="'+d.copy+'"]'),txt=ta?ta.value:(l[d.copy]||"");
    return (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){toast("Copié.")}).catch(function(){if(ta){ta.focus();ta.select()}toast("Sélectionné : copiez avec ⌘C.")})}
  if(d.sug){var g=(S.sugs||[])[parseInt(d.sug,10)];if(!g)return;
    if(g.action.kind==="ouvrir"){S.tab="config";S.sec=g.action.cible==="import"?"compte":"services";return render()}
    return api("/api/suggestions/apply",{ws:S.ws,action:g.action}).then(function(r){toast("Réglé : "+r.detail);return refresh()}).catch(fail)}
  if(d.import)return api("/api/import/exclusions",{text:$("imp_text").value}).then(function(r){toast(r.societes+" société(s) et "+r.adresses+" adresse(s) exclues.");return refresh()}).catch(fail);
  if(d.hook)return api("/api/settings",{webhook:{url:$("c_hook").value}}).then(function(r){S.st.settings=r.settings;if(!$("c_hook").value){toast("Webhook retiré.");return}return api("/api/settings/test",{what:"webhook"}).then(function(){toast("Webhook enregistré et joint.")})}).catch(fail);
  if(d.team)return api("/api/team/add",{name:$("t_name").value,email:$("t_email").value}).then(function(r){return refresh().then(function(){var o=$("teamOut");if(o)o.textContent="Mot de passe provisoire de "+r.member.name+" : "+r.mot_de_passe_provisoire+" (affiché une seule fois, à lui transmettre).";})}).catch(fail);
  if(d.unteam)return api("/api/team/remove",{id:parseInt(d.unteam,10)}).then(refresh).catch(fail);
  if(d.logout)return api("/api/auth/logout",{}).then(function(){S.ws=null;return refresh()}).catch(fail);
  if(d.pw)return api("/api/auth/password",{old:$("pw_old").value,new:$("pw_new").value}).then(function(){toast("Mot de passe changé.");render()}).catch(fail);
  if(d.delacc){if(S.confirmDel!==true){S.confirmDel=true;return toast("Tout sera effacé, sans retour possible.","Supprimer définitivement",function(){api("/api/account/delete",{confirmation:"SUPPRIMER"}).then(function(){S.ws=null;S.confirmDel=false;return refresh()}).catch(fail)},9000,true)}S.confirmDel=false;return}
  if(d.delws)return toast("Supprimer cet espace et ses fiches ?","Supprimer",function(){api("/api/workspace/delete",{id:S.ws}).then(function(){S.ws=null;return refresh()}).catch(fail)},8000,true);
  if(d.back){S.open=null;return render()}
  if(d.open){S.open=parseInt(d.open,10);window.scrollTo(0,0);return render()}
  if(d.filter!==undefined){S.filter=d.filter;return render()}
  if(d.sec){S.sec=d.sec;return render()}
  if(b.id==="run"||d.run)return startRun();
  if(d.demo)return api("/api/run",{ws:S.ws,demo:true}).then(function(r){if(r.ws)S.ws=r.ws;S.onb=false;return api("/api/state")}).then(function(st){S.st=st;render();poll()}).catch(fail);
  if(d.go){l=cardLead(b);return l&&go(d.go,l)}
  if(d.reject){l=cardLead(b);return l&&reject(l,d.reject)}
  if(d.ship){l=S.leads.filter(function(x){return x.id===parseInt(d.ship,10)})[0];return l&&ship(l).then(next).catch(fail)}
  if(d.reply)return api("/api/lead/reply",{id:parseInt(d.id,10),kind:d.reply}).then(function(){toast("Réponse enregistrée."+(d.reply==="stop"?" Adresse ajoutée à la liste d'opposition.":""));return refresh()}).catch(fail);
  if(d.follow)return api("/api/lead/followup",{id:parseInt(d.follow,10)}).then(function(){S.i=0;toast("Relance préparée. Elle attend votre validation.");return refresh()}).catch(fail);
  if(d.test)return saveSettings().then(function(){return api("/api/settings/test",{what:d.test})}).then(function(r){toast(d.test==="domaine"?r.detail:"Test réussi : "+r.detail,null,null,9000)}).catch(fail);
  if(d.supp)return api("/api/suppression/add",{value:$("c_supp").value}).then(function(){toast("Ajouté à la liste d'opposition.");render()}).catch(fail);
  if(d.newws){S.onb=true;window.scrollTo(0,0);return render()}
});
document.addEventListener("submit",function(e){
  var id=e.target.id,v=function(x){var el=$(x);return el?el.value:""};
  if(id==="newDeal"){e.preventDefault();var body={title:v("nd_title"),amount:v("nd_amount")};if($("nd_cid"))body.company_id=parseInt(v("nd_cid"),10);else body.company=v("nd_company");
    return api("/api/crm/deal/save",body).then(function(r){C.add=false;C.deal=r.deal.id;C.company=null;return crmReload()}).catch(fail)}
  if(id==="newContact"){e.preventDefault();return api("/api/crm/contact/save",{company_id:C.company,name:v("nc_name"),role:v("nc_role"),email:v("nc_email"),phone:v("nc_phone")}).then(crmReload).catch(fail)}
  if(id==="auth"){e.preventDefault();var up=S.authMode==="signup";
    return api(up?"/api/auth/signup":"/api/auth/login",{email:v("au_email"),password:v("au_pass"),name:v("au_name"),company:v("au_company"),code:v("au_code")}).then(refresh).catch(fail)}
  if(id==="onboard"){e.preventDefault();
    return api("/api/setup",{name:v("ob_name")||S.st.settings.user_name,company:v("ob_company"),phone:v("ob_phone"),offer:v("ob_offer"),metier:v("ob_metier"),sectors:v("ob_sectors")}).then(function(r){S.ws=r.ws;S.onb=false;S.tab="today";S.i=0;return refresh()}).then(function(){startRun()}).catch(fail)}
  if(id!=="setup")return;e.preventDefault();
  api("/api/setup",{name:$("su_name").value,company:$("su_company").value,phone:$("su_phone").value}).then(function(){toast("C'est noté. Vos brouillons portent votre signature.");return refresh()}).catch(fail);
});
document.addEventListener("change",function(e){
  var t=e.target;
  if(t.id==="wsSel"){S.ws=parseInt(t.value,10);S.i=0;S.open=null;return refresh()}
  if(t.id==="ob_metier"){var o=t.options[t.selectedIndex];$("ob_offer").placeholder=o.dataset.ex||"";return}
  if(t.closest("#auth")||t.closest("#onboard")||t.closest("#newDeal")||t.closest("#newContact"))return;
  if(t.dataset.df){var bd={id:C.deal};bd[t.dataset.df]=t.dataset.df==="contact_id"?(parseInt(t.value,10)||null):t.value;return api("/api/crm/deal/save",bd).then(function(){toast("Enregistré.")}).catch(fail)}
  if(t.dataset.cf){var bc={id:C.company};bc[t.dataset.cf]=t.value;return api("/api/crm/company/save",bc).then(function(){toast("Enregistré.")}).catch(fail)}
  if(t.id==="crm_q"){C.q=t.value;return render()}
  if(t.dataset.f)return autosave(t);
  if(t.dataset.nosave)return;
  var form=t.closest("[data-form]");if(!form)return;
  return form.dataset.form==="space"?saveSpace():saveSettings().catch(fail);
});
document.addEventListener("input",function(e){if(e.target.dataset.grow){e.target.style.height="auto";e.target.style.height=(e.target.scrollHeight+2)+"px"}});
document.addEventListener("toggle",function(e){
  var d=e.target;if(!d.dataset||!d.dataset.history||!d.open)return;
  api("/api/lead?id="+d.dataset.history).then(function(r){$("hist"+d.dataset.history).innerHTML=r.events.map(function(ev){return"<div><span>"+esc(new Date(ev.at).toLocaleString("fr-FR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}))+" · "+esc(ev.actor)+'</span><span class="pts">'+esc(ev.kind)+"</span><span>"+esc(ev.detail)+"</span></div>"}).join("")}).catch(fail);
},true);
/* glisser-déposer du pipeline (les flèches → font la même chose au clavier et au doigt) */
document.addEventListener("dragstart",function(e){var k=e.target.closest&&e.target.closest("[data-kd]");if(k){C.drag=parseInt(k.dataset.kd,10);e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",String(C.drag))}catch(x){}}});
document.addEventListener("dragover",function(e){var c=e.target.closest&&e.target.closest("[data-col]");if(c&&C.drag){e.preventDefault();c.classList.add("over")}});
document.addEventListener("dragleave",function(e){var c=e.target.closest&&e.target.closest("[data-col]");if(c)c.classList.remove("over")});
document.addEventListener("drop",function(e){var c=e.target.closest&&e.target.closest("[data-col]");if(!c||!C.drag)return;e.preventDefault();var id=C.drag;C.drag=null;api("/api/crm/deal/move",{id:id,to:c.dataset.col}).then(crmReload).catch(fail)});
document.addEventListener("keydown",function(e){
  if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){var b=document.querySelector('[data-go="ship"]');if(b){e.preventDefault();b.click()}}
});

