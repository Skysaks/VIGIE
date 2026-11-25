/* ---------- messages ---------- */
var toastT;
function toast(text,label,fn,ms,err){
  var t=$("toast");clearTimeout(toastT);
  t.className="toast"+(err?" err":"");t.innerHTML="<span>"+esc(text)+"</span>"+(label?'<button id="toastBtn">'+esc(label)+"</button>":"");t.hidden=false;
  if(label)$("toastBtn").onclick=function(){t.hidden=true;clearTimeout(toastT);fn()};
  toastT=setTimeout(function(){t.hidden=true},ms||(err?7000:3200));
}
function fail(e){toast(e.message||String(e),null,null,null,true)}

