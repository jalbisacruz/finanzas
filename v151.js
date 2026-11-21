// v151 (Joe + Tony):
// Joe: un solo aviso por mes (el envío más nuevo). Los anteriores se ocultan y, al aprobar
// o rechazar el nuevo, quedan marcados como atendidos (solo en este dispositivo; no se borran
// en Firestore). Tony: si ya envió el mes, se le pregunta si quiere actualizar los datos.
(function(){
Object.assign(typeof EN!=='undefined'?EN:{},{
  "Ya enviaste las cuentas de {0}. ¿Quieres actualizar los datos?":"You already sent the {0} bills. Do you want to update the data?",
  "Actualizar":"Update",
  "Cancelar":"Cancel"
});
const tr=(es,en)=>(typeof ES!=='undefined'&&ES===false)?en:es;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function handledMap(){
  try{const B=typeof bsS==='function'?bsS():null;if(!B)return {};B.handled=B.handled||{};return B.handled}
  catch(e){return {}}
}
function appliedIds(){
  try{return new Set(Object.values((typeof bsS==='function'?bsS():{months:{}}).months||{}).flatMap(m=>Object.keys(m.applied||{})))}
  catch(e){return new Set()}
}
function isHandled(id){
  if(!id)return false;
  if(appliedIds().has(id))return true;
  return !!handledMap()[id];
}
function markHandled(ids){
  const H=handledMap();
  (ids||[]).forEach(id=>{if(id)H[id]=Date.now()});
}
function sheetTime(x){
  const a=x&&x.at;
  if(!a)return 0;
  if(typeof a.toMillis==='function')return a.toMillis();
  if(a.seconds)return a.seconds*1000;
  return +a||0;
}
function newerSheet(a,b){
  if(!a)return b;
  if(!b)return a;
  const ra=+a.rev||0,rb=+b.rev||0;
  if(rb!==ra)return rb>ra?b:a;
  const ta=sheetTime(a),tb=sheetTime(b);
  if(tb!==ta)return tb>ta?b:a;
  return b;
}
function pendingAll(){
  const L=(typeof INBOX!=='undefined'&&Array.isArray(INBOX))?INBOX:[];
  return L.filter(x=>x&&x.kind==='bills'&&!isHandled(x.id));
}
function pendingSheetsLatest(){
  const by={};
  pendingAll().forEach(x=>{const k=x.month||'';by[k]=newerSheet(by[k],x)});
  return Object.keys(by).sort().reverse().map(k=>by[k]);
}
function sameMonthIds(id){
  const x=(typeof INBOX!=='undefined'?INBOX:[]).find(y=>y&&y.id===id);
  if(!x||!x.month)return [];
  return (INBOX||[]).filter(y=>y&&y.kind==='bills'&&y.month===x.month).map(y=>y.id);
}
function dropHandledFromInbox(){
  if(typeof INBOX==='undefined'||!Array.isArray(INBOX))return;
  INBOX=INBOX.filter(x=>!(x&&x.kind==='bills'&&isHandled(x.id)));
}
function monthLabel(k){
  if(k&&typeof S!=='undefined'&&S.months&&S.months[k]&&typeof lbl==='function')return lbl(k);
  if(typeof inbStr==='function')return inbStr(k||'',7);
  return k||'';
}
function bsNoticeOne(){
  const L=pendingSheetsLatest();if(!L.length)return '';
  const rows=L.map(x=>{
    const mes=monthLabel(x.month);
    return `<div class="row" style="align-items:center;gap:8px"><span class="n">${esc(T('🧾 Tony envió las cuentas de {0}',mes))}</span>
      <button type="button" class="sec bsrev" id="bsrev-${esc(x.id)}" data-month="${esc(x.month||'')}" onclick="bsReview('${esc(x.id)}')">${T('Revisar y aprobar')}</button></div>`;
  }).join('');
  return `<div class="card" id="bsnotice">${rows}</div>`;
}
function cutCard(h,id){
  const needle='id="'+id+'"';
  const mid=h.indexOf(needle);
  if(mid<0)return h;
  const open=h.lastIndexOf('<div',mid);
  if(open<0)return h;
  const tag=/<\/?div\b[^>]*>/gi;tag.lastIndex=open;
  let depth=0,m;
  while((m=tag.exec(h))){
    if(/^<\//.test(m[0]))depth--;else depth++;
    if(depth===0)return h.slice(0,open)+h.slice(m.index+m[0].length);
  }
  return h;
}
function insertNotice(h,extra){
  if(!extra)return h;
  const ie=h.indexOf('id="inberr"');
  if(ie>=0){
    const open=h.lastIndexOf('<div',ie);
    const tag=/<\/?div\b[^>]*>/gi;tag.lastIndex=open>=0?open:ie;
    let depth=0,m;
    while((m=tag.exec(h))){
      if(/^<\//.test(m[0]))depth--;else depth++;
      if(depth===0){const end=m.index+m[0].length;return h.slice(0,end)+extra+h.slice(end)}
    }
  }
  const j=h.indexOf('<div class="card');
  return j<0?extra+h:h.slice(0,j)+extra+h.slice(j);
}
function withOneNotice(h){
  h=cutCard(h,'bsnotice');
  return insertNotice(h,bsNoticeOne());
}

window._v151={pendingSheetsLatest,isHandled,markHandled,sameMonthIds,newerSheet};

if(typeof bsPlan==='function'){
  const _p=bsPlan;
  bsPlan=function(doc){
    const P=_p(doc);
    if(P&&!P.err)P.stale=(+doc.rev||0)<+(P.sh&&P.sh.rev||0);
    return P;
  };
}
if(typeof bsApprove==='function'){
  const _ap=bsApprove;
  bsApprove=function(id,force){
    const others=sameMonthIds(id).filter(i=>i!==id);
    const r=_ap(id,force);
    if(r&&(r.ok||r.done)){markHandled(others);if(typeof save==='function')save();dropHandledFromInbox()}
    return r;
  };
}
if(typeof bsReject==='function'){
  const _rj=bsReject;
  bsReject=async function(id){
    const others=sameMonthIds(id).filter(i=>i!==id);
    const r=await _rj.apply(this,arguments);
    if(!(INBOX||[]).some(x=>x&&x.id===id)){markHandled(others);if(typeof save==='function')save();dropHandledFromInbox()}
    return r;
  };
}
if(typeof inboxLoad==='function'){
  const _il=inboxLoad;
  inboxLoad=async function(){
    const r=await _il.apply(this,arguments);
    dropHandledFromInbox();
    return r;
  };
}
if(typeof inboxList==='function'){
  const _list=inboxList;
  inboxList=function(){
    _list.apply(this,arguments);
    const keep=new Set(pendingSheetsLatest().map(x=>x.id));
    document.querySelectorAll('[id^="bsrow-"]').forEach(el=>{
      const id=el.id.slice('bsrow-'.length);
      if(!keep.has(id))el.remove();
    });
  };
}
if(typeof ini==='function'){
  const _ini=ini;
  ini=function(){return withOneNotice(_ini())};
}
if(typeof billsMonth==='function'){
  const _bm=billsMonth;
  billsMonth=function(){return withOneNotice(_bm())};
}

// ---------- Tony: confirmar antes de reenviar el mismo mes ----------
function sentKey(ST){return 'vbills-sent-'+(window.__TOK||'')+'-'+(ST&&ST.k||'')}
function draftSent(ST){
  if(ST&&ST.sent)return true;
  try{const o=JSON.parse(localStorage.getItem('vbills-'+(window.__TOK||'')+'-'+(ST&&ST.k||''))||'{}');if(o&&o.sent)return true}catch(e){}
  try{if(localStorage.getItem(sentKey(ST)))return true}catch(e){}
  return false;
}
function lastSentRev(ST){
  try{const o=JSON.parse(localStorage.getItem(sentKey(ST))||'null');if(o&&isFinite(+o.rev))return +o.rev}catch(e){}
  return 0;
}
function rememberSent(ST,rev){
  try{localStorage.setItem(sentKey(ST),JSON.stringify({rev:+rev||0,at:Date.now()}))}catch(e){}
}
function closeAsk(){const m=$('vbsent');if(m)m.remove()}
function showAsk(ST){
  closeAsk();
  const mes=esc((ST&&ST.label)||ST.k||'');
  const m=document.createElement('div');m.id='vbsent';
  m.innerHTML=`<div class="vbbg" onclick="document.getElementById('vbcancel')&&document.getElementById('vbcancel').click()"></div>
    <div class="card vbbox" id="vbsentbox"><p style="margin:0 0 12px;font-size:16px;line-height:1.35">${esc(tr('Ya enviaste las cuentas de {0}. ¿Quieres actualizar los datos?','You already sent the {0} bills. Do you want to update the data?')).replace('{0}',mes)}</p>
    <div class="g2"><button type="button" class="chip" id="vbcancel" style="min-height:44px">${tr('Cancelar','Cancel')}</button>
    <button type="button" class="dl" id="vbupd" style="min-height:44px">${tr('Actualizar','Update')}</button></div></div>`;
  document.body.append(m);
  $('vbcancel').onclick=()=>{closeAsk()};
  $('vbupd').onclick=()=>{closeAsk();if(ST)ST._upd=true;if(typeof window.vbSend==='function')window.vbSend()};
}
if(typeof window!=='undefined'&&typeof window.vbSend==='function'){
  const _send=window.vbSend;
  window.vbSend=async function(){
    const ST=window.vbState&&window.vbState();
    if(!ST)return _send.apply(this,arguments);
    if(draftSent(ST)&&!ST._upd){showAsk(ST);return}
    const upd=!!ST._upd;
    const prev=ST.rev;
    if(upd)ST.rev=Math.max(+ST.rev||0,lastSentRev(ST))+1;
    try{
      const r=await _send.apply(this,arguments);
      if(ST.sent)rememberSent(ST,+ST.rev||0);
      return r;
    }finally{ST._upd=false;ST.rev=prev}
  };
}

document.head.insertAdjacentHTML('beforeend',`<style>
#vbsent{position:fixed;inset:0;z-index:80}
#vbsent .vbbg{position:absolute;inset:0;background:#0f172a88}
#vbsent .vbbox{position:absolute;left:10px;right:10px;bottom:10px;max-width:480px;margin:auto;padding:16px 16px 14px}
@media(min-width:800px){#vbsent .vbbox{bottom:auto;top:30%;}
}
</style>`);
})();
