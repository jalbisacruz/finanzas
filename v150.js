// v150 (Joe): aviso claro cuando Tony envía la hoja de cuentas, etiqueta de montos
// copiados del mes anterior, y un error visible si el buzón no carga.
(function(){
Object.assign(typeof EN!=='undefined'?EN:{},{
  "🧾 Tony envió las cuentas de {0}":"🧾 Tony sent the {0} bills",
  "Revisar y aprobar":"Review and approve",
  "copia del mes anterior · falta la hoja de Tony":"copy from last month · waiting for Tony's sheet",
  "No se pudo cargar el buzón. Inténtalo otra vez.":"Couldn't load the inbox. Try again.",
  "Reintentar":"Try again"
});

function appliedIds(){
  try{return new Set(Object.values((typeof bsS==='function'?bsS():{months:{}}).months||{}).flatMap(m=>Object.keys(m.applied||{})))}
  catch(e){return new Set()}
}
function pendingSheets(){
  const A=appliedIds(),L=(typeof INBOX!=='undefined'&&Array.isArray(INBOX))?INBOX:[];
  return L.filter(x=>x&&x.kind==='bills'&&!A.has(x.id));
}
function monthLabel(k){
  if(k&&typeof S!=='undefined'&&S.months&&S.months[k]&&typeof lbl==='function')return lbl(k);
  if(typeof inbStr==='function')return inbStr(k||'',7);
  return k||'';
}
function isFood(b){
  if(!b)return false;
  if(typeof isComidaBill==='function')return isComidaBill(b);
  return /^(food|comida)$/i.test(String(b.name||'').replace(/^[^\p{L}\p{N}]+/u,'').trim());
}
function monthUnapproved(k){
  const m=typeof S!=='undefined'&&S.months&&S.months[k];
  if(!m)return false;
  if((m.bills||[]).some(b=>b&&b.sheet&&b.sheet.sp))return false;
  try{
    const sh=(typeof bsS==='function'?bsS():{months:{}}).months[k];
    if(sh&&((sh.hist&&sh.hist.length)||Object.keys(sh.rows||{}).length||Object.keys(sh.applied||{}).length))return false;
  }catch(e){}
  return (m.bills||[]).some(b=>!isFood(b));
}
function copyLabelHtml(){
  const k=typeof S!=='undefined'?S.cur:'';
  if(!monthUnapproved(k))return '';
  return `<div class="muted" id="bscopy">${T('copia del mes anterior · falta la hoja de Tony')}</div>`;
}
function bsPendingNotice(){
  const L=pendingSheets();if(!L.length)return '';
  const rows=L.map(x=>{
    const mes=monthLabel(x.month);
    return `<div class="row" style="align-items:center;gap:8px"><span class="n">${esc(T('🧾 Tony envió las cuentas de {0}',mes))}</span>
      <button type="button" class="sec bsrev" id="bsrev-${esc(x.id)}" onclick="bsReview('${esc(x.id)}')">${T('Revisar y aprobar')}</button></div>`;
  }).join('');
  return `<div class="card" id="bsnotice">${rows}</div>`;
}
function inboxErrHtml(){
  if(!window.__inboxErr)return '';
  return `<div class="card" id="inberr"><span class="muted">⚠️ ${T('No se pudo cargar el buzón. Inténtalo otra vez.')}</span>
    <button type="button" class="sec" id="inbretry" onclick="v150RetryInbox()">${T('Reintentar')}</button></div>`;
}
function hookFbInbox(){
  const fb=window.fbInbox;
  if(typeof fb!=='function'||fb.__v150)return;
  const wrap=async function(){
    try{return await fb.apply(this,arguments)}
    catch(e){window.__inboxErr=true;throw e}
  };
  wrap.__v150=true;
  window.fbInbox=wrap;
}
window.v150RetryInbox=async function(){
  window.__inboxErr=false;
  try{if(typeof inboxLoad==='function')await inboxLoad(true)}catch(e){}
  try{render()}catch(e){}
};
window._v150={pendingSheets,monthUnapproved,copyLabelHtml,bsPendingNotice};

if(typeof remList==='function'){
  const _rl=remList;
  remList=function(){
    let R=_rl().filter(r=>r.id!=='inbox');
    const nI=(typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).filter(x=>x&&x.kind!=='bills').length;
    if(nI){
      const hid=typeof remHidden==='function'?remHidden():[];
      if(!hid.includes('inbox')) R.push({id:'inbox',u:3,t:nI===1?T('📥 1 compra por revisar'):T('📥 {0} compras por revisar',nI),go:'inboxList()'});
    }
    return R.sort((a,b)=>a.u-b.u);
  };
}
if(typeof inboxLoad==='function'){
  const _il=inboxLoad;
  inboxLoad=async function(){
    hookFbInbox();
    const r=await _il.apply(this,arguments);
    if(window.__inboxErr&&!document.getElementById('inberr')){
      try{if(typeof tab!=='undefined'&&(tab==='ini'||tab==='mov'))render()}catch(e){}
    }
    return r;
  };
}
if(typeof ini==='function'){
  const _ini=ini;
  ini=function(){
    const h=_ini(),extra=inboxErrHtml()+bsPendingNotice();
    if(!extra)return h;
    const j=h.indexOf('<div class="card');
    return j<0?extra+h:h.slice(0,j)+extra+h.slice(j);
  };
}
if(typeof billsMonth==='function'){
  const _bm=billsMonth;
  billsMonth=function(){
    let h=_bm();
    const note=copyLabelHtml();
    if(note)h=h.replace('</h2>','</h2>'+note);
    const head=inboxErrHtml()+bsPendingNotice();
    if(head)h=head+h;
    return h;
  };
}

document.head.insertAdjacentHTML('beforeend',`<style>
#bsnotice{border:2px solid #d97706;padding:10px 12px}
#bsnotice .bsrev{min-height:44px;flex:none;white-space:nowrap}
#bscopy{margin:2px 0 8px;font-size:13px}
#inberr{padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px}
#inberr .sec{min-height:40px;flex:none}
</style>`);
})();
