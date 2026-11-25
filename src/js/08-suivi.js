/* ---------- suivi ---------- */
function loadSuivi(){
  Promise.all([api("/api/report?ws="+S.ws),api("/api/journal?ws="+S.ws)]).then(function(r){
    var p=r[0],j=r[1].journal,w=p.semaine;
    var h='<div class="card"><div><p class="meta">Sept derniers jours</p><h1 class="h2">Suivi hebdomadaire</h1></div>';
    h+='<div class="tiles"><div><b>'+w.decouvert+"</b>découverts</div><div><b>"+p.en_attente+"</b>en attente de vous</div><div><b>"+w.valide+"</b>validés</div><div><b>"+w.rejete+"</b>écartés</div><div><b>"+w.envoye+"</b>envoyés</div><div><b>"+w.repondu+"</b>réponses</div></div>";
    if((p.suggestions||[]).length)h+='<div class="group"><h3>Vigie a appris de vos décisions</h3><p class="note">Rien ne change sans vous : chaque réglage attend votre accord.</p>'+p.suggestions.map(function(g,i){return'<div class="sug"><div><b>'+esc(g.texte)+"</b><span>"+esc(g.raison)+'</span></div><button class="btn sm primary" data-sug="'+i+'">'+(g.action.kind==="ouvrir"?"Y aller":"Appliquer")+"</button></div>"}).join("")+"</div>";
    S.sugs=p.suggestions||[];
    h+='<div class="group"><h3>À décider</h3>'+(p.conseils.length?p.conseils.map(function(c){return'<p class="note">'+esc(c)+"</p>"}).join(""):'<p class="note">Rien à signaler.</p>')+"</div>";
    h+='<div class="group"><h3>Par type de signal</h3><div class="scroll"><table><thead><tr><th>Signal</th><th class="num">Leads</th><th class="num">Validés</th><th class="num">Écartés</th><th class="num">Envoyés</th><th class="num">Réponses</th><th class="num">Taux</th></tr></thead><tbody>'+p.par_signal.map(function(s){return"<tr><td>"+esc(s.label)+'</td><td class="num">'+s.leads+'</td><td class="num">'+s.valides+'</td><td class="num">'+s.rejetes+'</td><td class="num">'+s.envoyes+'</td><td class="num">'+s.reponses+'</td><td class="num">'+(s.taux_reponse==null?"–":s.taux_reponse+" %")+"</td></tr>"}).join("")+"</tbody></table></div></div>";
    if(p.raisons_rejet.length)h+='<div class="group"><h3>Vos raisons d\'écart</h3><p class="note">'+p.raisons_rejet.map(function(x){return esc(x.raison)+" · "+x.n}).join(" &nbsp; ")+"</p></div>";
    h+='<details><summary>Journal de veille : ce qui a été lu, et pourquoi c\'est retenu ou non ('+j.length+')</summary><div class="scroll"><table><tbody>'+j.map(function(x){return"<tr><td>"+link(x.url,x.title)+"</td><td>"+esc(day(x.published_at))+"</td><td>"+esc(x.outcome)+"</td></tr>"}).join("")+"</tbody></table></div></details></div>";
    $("main").innerHTML=h;
  }).catch(fail);
}

