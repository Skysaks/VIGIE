/* ---------- leads ---------- */
function renderLeads(){
  var keys=Object.keys(STATUS).filter(function(k){return by(k).length});
  var list=S.filter?by(S.filter):S.leads;
  var h='<div class="card"><div class="actions" style="justify-content:space-between"><h1 class="h2">Leads</h1>'+(MOCK?"":'<a class="link" href="/api/export.csv?ws='+S.ws+"&status="+encodeURIComponent(S.filter)+'" download>Exporter en CSV</a>')+'</div><div class="reasons"><button class="chip" data-filter="" aria-pressed="'+(S.filter==="")+'">Tous · '+S.leads.length+"</button>"+keys.map(function(k){return'<button class="chip" data-filter="'+k+'" aria-pressed="'+(S.filter===k)+'">'+STATUS[k]+" · "+by(k).length+"</button>"}).join("")+"</div>";
  h+=list.length?'<div class="scroll"><table><thead><tr><th>Société</th><th>Signal</th><th class="num">Score</th><th>Décideur</th><th>Statut</th></tr></thead><tbody>'+list.map(function(l){return'<tr><td><button class="rowbtn" data-open="'+l.id+'"><b>'+esc(l.company)+"</b></button></td><td>"+esc(sig(l.signal_type))+" · "+esc(ago(l.signal_date))+'</td><td class="num">'+(l.total==null?"–":l.total)+" "+esc(l.tier==="E"?"":l.tier||"")+"</td><td>"+esc(l.contact_name||"–")+"</td><td>"+esc(STATUS[l.status]||l.status)+"</td></tr>"}).join("")+"</tbody></table></div>":'<p class="note">Aucun lead.</p>';
  $("main").innerHTML=h+"</div>";
}

