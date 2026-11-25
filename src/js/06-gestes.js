/* ---------- gestes ---------- */
function next(){S.open=null;return refresh()}
function ship(l){
  // Le lead est déjà validé par vous. Reste à le faire partir.
  if(S.st.smtp_ready){
    var cancelled=false,t=setTimeout(function(){if(!cancelled)api("/api/lead/send",{id:l.id,confirm:true}).then(function(){toast("Envoyé à "+l.contact_email);refresh()}).catch(function(e){fail(e);refresh()})},5000);
    toast("Envoi à "+l.contact_email+" dans 5 s","Annuler",function(){cancelled=true;clearTimeout(t);toast("Envoi annulé. Le message reste prêt à partir.")},5200);
    return Promise.resolve();
  }
  return api("/api/lead/send",{id:l.id,confirm:true,external:true}).then(function(){
    if(!MOCK){window.location.href="mailto:"+encodeURIComponent(l.contact_email)+"?subject="+encodeURIComponent(l.draft_subject||"")+"&body="+encodeURIComponent(l.draft_body||"")}
    toast(MOCK?"Démo : envoi simulé, rien n'est parti.":"Ouvert dans votre messagerie et noté comme envoyé.","Annuler",function(){api("/api/lead/decision",{id:l.id,decision:"annuler"}).then(refresh).catch(fail)},8000);
  });
}
function go(a,l){
  var f=cardFields(l);
  if(a==="ship"){
    var email=f.contact_email!==undefined?f.contact_email:l.contact_email;
    if(!email){var e=document.querySelector('[data-card="'+l.id+'"] [data-f="contact_email"]');if(e)e.focus();return fail(new Error("Ajoutez l'adresse e-mail du décideur, ou validez seulement."))}
    return api("/api/lead/go",{id:l.id,fields:f,mode:"valider"}).then(function(r){return ship(r.lead)}).then(next).catch(fail);
  }
  if(a==="only")return api("/api/lead/go",{id:l.id,fields:f,mode:"valider"}).then(function(){toast("Validé. Prêt à partir.","Annuler",function(){api("/api/lead/decision",{id:l.id,decision:"annuler"}).then(refresh).catch(fail)},6000);return next()}).catch(fail);
  if(a==="redraft")return api("/api/lead/redraft",{id:l.id}).then(function(){toast("Brouillon régénéré.");return refresh()}).catch(fail);
  if(a==="skip"){S.i=(S.i+1)%queue().length;return render()}
  if(a==="observe")return api("/api/lead/decision",{id:l.id,decision:"observer"}).then(function(){toast("Sous observation.");return next()}).catch(fail);
  if(a==="cancel")return api("/api/lead/decision",{id:l.id,decision:"annuler"}).then(function(){S.open=null;S.tab="today";return refresh()}).catch(fail);
}
function reject(l,reason){
  return api("/api/lead/decision",{id:l.id,decision:"rejeter",reason:reason}).then(function(){
    toast(l.company+" écarté.","Annuler",function(){api("/api/lead/decision",{id:l.id,decision:"annuler"}).then(refresh).catch(fail)},6000);return next();
  }).catch(fail);
}
function autosave(el){
  var l=cardLead(el);if(!l)return;var f={};f[el.dataset.f]=el.value;
  if((el.value||"")===(l[el.dataset.f]||""))return;
  var before=l.status;api("/api/lead/update",{id:l.id,fields:f}).then(function(r){for(var k in r.lead)l[k]=r.lead[k];if(l.status!==before)render()}).catch(fail);
}

