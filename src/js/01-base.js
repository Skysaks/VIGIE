
"use strict";
var MOCK=!!window.VIGIE_SEED;
var C={view:"board",deal:null,company:null,q:"",add:false,lose:false,kind:"note"};
var S={st:null,ws:null,tab:"today",leads:[],i:0,open:null,filter:"",data:null,sec:"espace",ch:"mail",authMode:"login"};
var STATUS={qualifie:"Qualifié",enrichi:"Enrichi",a_valider:"À valider",observe:"Sous observation",ecarte:"Écarté par le moteur",valide:"Prêt à partir",envoye:"Envoyé",repondu:"Répondu",rejete:"Écarté par vous",expire:"Périmé"};
var EMAIL={verifie:["Vérifié","ok"],publie:["Publié sur le site","ok"],saisi:["Saisi par vous","ok"],generique:["Adresse générique","warn"],deduit:["Déduit, non vérifié","warn"],inconnu:["Adresse manquante","warn"]};
var REASONS=["Hors cible","Signal trop faible","Déjà client","Mauvais décideur","Mauvais moment"];
var FIELDS=["contact_name","contact_role","contact_email","draft_subject","draft_body","draft_call","draft_linkedin"];
var PH=/\[[A-ZÀ-Ý' ]{3,}\]/g;
function $(id){return document.getElementById(id)}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function link(u,t){return /^https?:\/\//.test(u||"")?'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(t||u)+"</a>":esc(t||u||"")}
function day(iso){if(!iso)return"";var d=new Date(iso);return isNaN(d)?"":d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
function ago(iso){if(!iso)return"date inconnue";var n=Math.max(0,Math.floor((Date.now()-new Date(iso))/864e5));return n===0?"aujourd'hui":"il y a "+n+" j"}
function cur(){return S.st.workspaces.filter(function(w){return w.id===S.ws})[0]}
function sig(t){var w=cur(),s=w&&w.config.signals.filter(function(x){return x.type===t})[0];return s?s.label:(t||"")}
function by(st){return S.leads.filter(function(l){return l.status===st})}
function daysLeft(l){return l.expires_at?Math.ceil((new Date(l.expires_at)-Date.now())/864e5):null}
/* La file du jour : ce qui périme bientôt d'abord, puis les meilleurs scores, dans la limite du nombre de fiches par jour. */
function queueAll(){return by("a_valider").sort(function(a,b){var ua=daysLeft(a),ub=daysLeft(b),sa=ua!==null&&ua<=7?0:1,sb=ub!==null&&ub<=7?0:1;return sa-sb||(b.total||0)-(a.total||0)})}
function queue(){var w=cur(),n=(w&&w.config.daily_focus)||10;return queueAll().slice(0,n)}

