/* ---------- rendu ---------- */
function render(){
  renderHead();
  if(S.st.auth===false)return renderAuth();
  if(!S.ws||S.onb)return renderOnboard();
  var m=$("main");m.className=(S.tab==="leads"||S.tab==="suivi"||S.tab==="crm")&&!S.open?"wide":"";
  if(S.open){var l=S.leads.filter(function(x){return x.id===S.open})[0];if(l){m.innerHTML='<button class="link" data-back="1">← Retour</button>'+card(l,null);grow();return}S.open=null}
  if(S.tab==="today")return renderToday();
  if(S.tab==="leads")return renderLeads();
  if(S.tab==="suivi")return loadSuivi();
  if(S.tab==="crm")return renderCrm();
  return renderConfig();
}
function grow(){Array.prototype.forEach.call(document.querySelectorAll("textarea[data-grow]"),function(t){t.style.height="auto";t.style.height=(t.scrollHeight+2)+"px"})}

function renderAuth(){
  var up=S.authMode==="signup",open=S.st.inscription!=="fermee";
  var h='<form class="card" id="auth" style="margin-top:6vh"><div><h1 class="hero">'+(up?"Créez votre compte":"Bon retour")+'</h1><p class="signal" style="font-size:16px;margin-top:8px">'+(up?"Quatorze jours d'essai, sans carte bancaire.":"Vos fiches du jour vous attendent.")+'</p></div><div class="fields">';
  if(up)h+='<label class="f"><span>Votre nom</span><input id="au_name" required autocomplete="name"></label><label class="f"><span>Société</span><input id="au_company" autocomplete="organization"></label>';
  h+='<label class="f"><span>E-mail professionnel</span><input id="au_email" type="email" required autocomplete="email"></label><label class="f"><span>Mot de passe'+(up?" (10 caractères au moins)":"")+'</span><input id="au_pass" type="password" required minlength="'+(up?10:1)+'" autocomplete="'+(up?"new-password":"current-password")+'"></label>';
  if(up&&String(S.st.inscription||"").indexOf("code")===0)h+='<label class="f"><span>Code d\'invitation</span><input id="au_code" required></label>';
  h+='</div><div class="actions"><button class="btn primary" type="submit">'+(up?"Commencer l'essai":"Se connecter")+"</button>"+(open?'<button class="link" type="button" data-auth="'+(up?"login":"signup")+'">'+(up?"J'ai déjà un compte":"Créer un compte")+"</button>":"")+"</div></form>";
  $("main").className="";$("main").innerHTML=h;
}
function renderOnboard(){
  var st=S.st,named=st.settings.user_name,ms=st.metiers||[];
  var h='<form class="card" id="onboard"><div><h1 class="hero">Dites ce que vous vendez. Vigie trouve à qui l\'écrire, et pourquoi maintenant.</h1><p class="signal" style="font-size:16px;margin-top:10px">Une phrase et un métier suffisent. Tout reste modifiable ensuite.</p></div>';
  h+='<label class="f"><span>Ce que vous vendez, en une phrase</span><textarea id="ob_offer" data-grow="1" rows="1" required placeholder="'+esc((ms[0]||{}).exemple||"")+'"></textarea></label>';
  h+='<div class="fields"><label class="f"><span>Votre métier</span><select id="ob_metier">'+ms.map(function(m){return'<option value="'+esc(m.id)+'" data-ex="'+esc(m.exemple)+'">'+esc(m.label)+"</option>"}).join("")+'</select></label><label class="f"><span>Secteurs de vos clients (facultatif)</span><input id="ob_sectors" placeholder="industrie, santé, distribution"></label></div>';
  h+='<div class="fields">'+(named&&st.mode==="serveur"?"":'<label class="f"><span>Votre nom</span><input id="ob_name" required autocomplete="name" value="'+esc(named)+'"></label>')+'<label class="f"><span>Votre société</span><input id="ob_company" autocomplete="organization"></label><label class="f"><span>Téléphone (facultatif)</span><input id="ob_phone" autocomplete="tel"></label></div>';
  h+='<div class="actions"><button class="btn go" type="submit">Lancer ma première veille</button>'+(S.ws?'<button class="link" type="button" data-onb="0">Retour</button>':'<button class="link" type="button" data-demo="1">Voir d\'abord un exemple avec des données fictives</button>')+"</div></form>";
  $("main").className="";$("main").innerHTML=h;grow();
}
function setupCard(){
  return'<form class="card" id="setup"><div><h1 class="h2">Une seule chose avant de commencer</h1><p class="signal" style="font-size:16px;margin-top:6px">Chaque validation porte votre nom, et vos messages votre signature.</p></div><div class="fields"><label class="f"><span>Votre nom</span><input id="su_name" required autocomplete="name"></label><label class="f"><span>Société (facultatif)</span><input id="su_company" autocomplete="organization"></label><label class="f"><span>Téléphone (facultatif)</span><input id="su_phone" autocomplete="tel"></label></div><div class="actions"><button class="btn primary" type="submit">Continuer</button></div></form>';
}
function renderToday(){
  var all=queueAll(),q=queue(),ready=by("valide"),sent=by("envoye"),h="";
  if(MOCK)h+='<p class="demo">Démonstration : sociétés fictives, aucun e-mail réel ne part de cette page.</p>';
  var isDemo=!MOCK&&cur().config._demo;
  if(isDemo)h+='<p class="demo">Espace de démonstration, sociétés fictives. <button class="link" data-onb="1">Régler ma vraie offre</button></p>';
  if(!S.st.settings.user_name)h+=setupCard();
  if(S.i>=q.length)S.i=Math.max(0,q.length-1);
  if(q.length){h+=card(q[S.i],{pos:S.i,n:q.length});if(all.length>q.length)h+='<p class="demo">'+(all.length-q.length)+" autres fiches en réserve : elles arrivent quand celles-ci sont traitées.</p>"}
  else{
    var rs=S.st.run.stats,t1=S.leads.length?"Tout est traité.":"Aucune fiche pour l'instant.",t2=S.leads.length?"Rien n'attend votre validation. La prochaine veille remplira cette file.":"Lancez la veille : Vigie lit la presse, note chaque société et prépare les brouillons.";
    if(!S.leads.length&&rs&&S.st.run.ws===S.ws){
      if(rs.flux&&rs.erreurs_flux>=rs.flux){t1="Les sources de presse sont injoignables.";t2="Aucun des "+rs.flux+" flux n'a répondu. Vérifiez la connexion à Internet, puis relancez la veille."}
      else{t1="Rien d'exploitable cette fois.";t2=rs.breves+" articles lus, aucun ne réunit une société identifiable et un signal suivi. Élargissez vos secteurs ou activez d'autres signaux dans Réglages : le journal de veille (onglet Suivi) montre pourquoi chaque article a été écarté."}
    }
    h+='<div class="empty"><h1>'+t1+"</h1><p>"+t2+'</p><button class="btn primary" data-run="1">'+(MOCK?"Rejouer la démo":"Lancer la veille")+"</button>"+(!MOCK&&!S.leads.length&&!isDemo?'<button class="link" data-demo="1">Voir un exemple avec des données fictives</button>':"")+"</div>";
  }
  if(ready.length)h+='<div class="section"><h2>Prêts à partir · '+ready.length+"</h2>"+ready.map(function(l){return'<div class="row"><div class="who"><b>'+esc(l.company)+"</b><span>"+esc(l.contact_email||"adresse manquante")+" · validé par "+esc(l.validated_by)+'</span></div><div class="do"><button class="chip" data-open="'+l.id+'">Ouvrir</button><button class="btn sm go" data-ship="'+l.id+'"'+(l.contact_email?"":" disabled")+">"+shipLabel()+"</button></div></div>"}).join("")+"</div>";
  if(sent.length)h+='<div class="section"><h2>En attente de réponse · '+sent.length+"</h2>"+sent.map(function(l){var old=l.sent_at&&(Date.now()-new Date(l.sent_at))>7*864e5;return'<div class="row"><div class="who"><b>'+esc(l.company)+"</b><span>"+esc(l.contact_name||l.contact_email||"")+" · envoyé le "+esc(day(l.sent_at))+(l.step>1?" · relance "+(l.step-1):"")+'</span></div><div class="do"><span class="note">Réponse :</span>'+[["positif","Positive"],["neutre","Neutre"],["negatif","Négative"],["stop","STOP"]].map(function(k){return'<button class="chip" data-reply="'+k[0]+'" data-id="'+l.id+'">'+k[1]+"</button>"}).join("")+(l.step<3?'<button class="chip" data-follow="'+l.id+'"'+(old?' aria-pressed="true"':"")+">Relancer</button>":"")+"</div></div>"}).join("")+"</div>";
  $("main").innerHTML=h;grow();
}
function shipLabel(){return S.st.smtp_ready?"Envoyer":(MOCK?"Envoyer (simulé)":"Ouvrir dans Mail")}

function card(l,pos){
  var em=EMAIL[l.email_status||"inconnu"]||EMAIL.inconnu,editable=["a_valider","observe","ecarte","valide","qualifie","enrichi"].indexOf(l.status)>=0,dis=editable?"":" disabled";
  var h='<article class="card" data-card="'+l.id+'">';
  h+='<div class="meta">'+(pos?'<span class="dots" aria-hidden="true">'+Array.apply(null,Array(Math.min(pos.n,12))).map(function(_,k){return'<i class="'+(k===pos.pos?"on":"")+'"></i>'}).join("")+"</span><span>"+(pos.pos+1)+" sur "+pos.n+"</span>":'<span class="pill">'+esc(STATUS[l.status]||l.status)+"</span>")+"<span>"+esc(sig(l.signal_type))+"</span><span>"+esc(ago(l.signal_date))+"</span><span>"+link(l.signal_url,l.signal_source||"source")+"</span>"+(function(){var d=daysLeft(l);if(d===null||["a_valider","observe"].indexOf(l.status)<0)return"";return'<span class="'+(d<=7?"urgent":"")+'">'+(d<=0?"périme aujourd\'hui":d<=7?"périme dans "+d+" j":"à traiter avant le "+esc(day(l.expires_at)))+"</span>"})()+"</div>";
  h+='<div><h1 class="company">'+esc(l.company)+'</h1><p class="signal" style="margin-top:8px">'+esc(l.signal_title)+"</p></div>";
  h+='<div><div class="score"><div class="big">'+(l.total==null?"–":l.total)+"<small> /100</small></div>";
  h+='<div class="meter"><span>Adéquation</span><span class="track"><i style="width:'+Math.round((l.fit||0)/40*100)+'%"></i></span><b>'+(l.fit||0)+"/40</b></div>";
  h+='<div class="meter"><span>Besoin</span><span class="track"><i style="width:'+Math.round((l.need||0)/60*100)+'%"></i></span><b>'+(l.need||0)+"/60</b></div></div>";
  h+='<details style="margin-top:10px"><summary><span class="tier '+esc(l.tier||"")+'">RANG '+esc(l.tier==="E"?"–":l.tier||"–")+'</span> Pourquoi ce score</summary><div class="why">'+(l.score_detail||[]).map(function(d){return"<div><span>"+esc(d.critere)+'</span><span class="pts'+(d.points?"":" zero")+'">'+d.points+" / "+d.max+'</span><span class="'+(d.points?"":"zero")+'">'+esc(d.preuve)+(/^https?:/.test(d.source||"")?" · "+link(d.source,"source"):"")+"</span></div>"}).join("")+"</div></details></div>";
  h+='<div class="group"><div class="fields"><label class="f"><span>Décideur</span><input data-f="contact_name" value="'+esc(l.contact_name)+'" placeholder="Nom"'+dis+'></label><label class="f"><span>Fonction</span><input data-f="contact_role" value="'+esc(l.contact_role)+'" placeholder="Fonction"'+dis+'></label><label class="f'+(l.contact_email?"":" need")+'"><span>E-mail</span><input data-f="contact_email" type="email" value="'+esc(l.contact_email)+'" placeholder="Ajoutez l\'adresse"'+dis+"></label></div>";
  h+='<p class="note"><span class="pill '+em[1]+'">'+em[0]+"</span> "+esc(l.email_note||"")+(/^https?:/.test(l.contact_source||"")?" · "+link(l.contact_source,"profil du décideur"):"")+"</p></div>";
  var chs=[["mail","E-mail"],["call","Appel"],["in","LinkedIn"]];
  h+='<div class="seg" role="tablist" aria-label="Canal">'+chs.map(function(c){return'<button type="button" role="tab" data-ch="'+c[0]+'" aria-selected="'+(S.ch===c[0])+'">'+c[1]+"</button>"}).join("")+"</div>";
  if(S.ch==="call")h+='<div class="msg"><textarea data-f="draft_call" data-grow="1" aria-label="Accroche d\'appel" placeholder="Aucune accroche. Régénérez le brouillon."'+dis+">"+esc(l.draft_call)+'</textarea></div><div class="actions"><button class="btn sm" type="button" data-copy="draft_call">Copier l\'accroche</button><span class="note">Vos premières phrases au téléphone, tirées du même signal.</span></div>';
  else if(S.ch==="in")h+='<div class="msg"><textarea data-f="draft_linkedin" data-grow="1" aria-label="Note LinkedIn" placeholder="Aucune note. Régénérez le brouillon."'+dis+">"+esc(l.draft_linkedin)+'</textarea></div><div class="actions"><button class="btn sm" type="button" data-copy="draft_linkedin">Copier la note</button>'+(/^https?:/.test(l.linkedin_url||"")?link(l.linkedin_url,"Ouvrir le profil"):'<span class="note">Note courte pour une demande de mise en relation.</span>')+"</div>";
  else h+='<div class="msg"><input data-f="draft_subject" aria-label="Objet" value="'+esc(l.draft_subject)+'" placeholder="Objet"'+dis+'><hr><textarea data-f="draft_body" data-grow="1" aria-label="Message" placeholder="Aucun brouillon. Écrivez le message, ou régénérez-le."'+dis+">"+esc(l.draft_body)+"</textarea></div>";
  if((l.draft_warnings||[]).length)h+='<div class="alert"><b>À corriger avant de valider</b><ul>'+l.draft_warnings.map(function(w){return"<li>"+esc(w)+"</li>"}).join("")+"</ul></div>";
  if(l.status==="a_valider"||l.status==="observe"||l.status==="ecarte"){
    h+='<div class="actions"><button class="btn go" data-go="ship">Valider et '+shipLabel().toLowerCase().replace(" (simulé)","")+' <kbd style="border-color:currentColor;color:inherit;opacity:.7">⌘↵</kbd></button><button class="btn" data-go="only">Valider seulement</button><button class="link" data-go="redraft">Régénérer</button>'+(pos&&pos.n>1?'<button class="link" data-go="skip">Plus tard</button>':"")+"</div>";
    h+='<div class="reasons"><span>Écarter :</span>'+REASONS.map(function(r){return'<button class="chip" data-reject="'+esc(r)+'">'+esc(r)+"</button>"}).join("")+(l.status!=="observe"?'<button class="chip" data-go="observe">Observer</button>':"")+"</div>";
  }else if(l.status==="valide"){
    h+='<div class="actions"><button class="btn go" data-ship="'+l.id+'"'+(l.contact_email?"":" disabled")+">"+shipLabel()+'</button><button class="link" data-go="cancel">Annuler la validation</button><span class="note">Validé par '+esc(l.validated_by)+"</span></div>";
  }else if(l.status==="rejete"){
    h+='<div class="actions"><span class="note">Écarté : '+esc(l.reject_reason)+'</span><button class="link" data-go="cancel">Reprendre ce lead</button></div>';
  }else if(l.status==="envoye"||l.status==="repondu"){
    h+='<div class="actions"><span class="pill ok">Envoyé le '+esc(day(l.sent_at))+"</span>"+(l.reply_kind?'<span class="pill">Réponse '+esc(l.reply_kind)+"</span>":"")+"</div>";
  }
  h+='<details data-history="'+l.id+'"><summary>Historique</summary><div class="why" id="hist'+l.id+'"></div></details>';
  return h+"</article>";
}
function cardLead(el){var c=el.closest("[data-card]");var id=c&&parseInt(c.dataset.card,10);return S.leads.filter(function(l){return l.id===id})[0]}
function cardFields(l){var f={},c=document.querySelector('[data-card="'+l.id+'"]');if(!c)return f;FIELDS.forEach(function(k){var el=c.querySelector('[data-f="'+k+'"]');if(el&&!el.disabled&&(el.value||"")!==(l[k]||""))f[k]=el.value});return f}

