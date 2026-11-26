// v161 (Joe): justo después de v160, Carlos envió una compra (le salió «Enviado»),
// apareció en 📥, al tocar Revisar no salió nada, y el reenvío no apareció.
// No se reprodujo un error de v160 con ninguna forma de envío (Chromium y WebKit).
// Lo que sí hacía el código:
//  - El buzón solo se recargaba desde Hoy y como mucho una vez por minuto; la
//    lista abierta no se actualizaba nunca y al volver a la app tampoco.
//  - Revisar, si la compra ya no estaba en la lista cargada, no hacía nada (sin aviso).
//  - Cualquier fallo al preparar la revisión dejaba la pantalla vacía.
//  - En la página del enlace, el escaneo no pasaba por las capas v159/v160
//    (window.vScan llamaba a una copia interna), así que los descuentos se
//    sumaban en una línea al enviar en vez de restarse de cada ítem.
// Aquí: la lista 📥 se recarga al abrirla (sin esperar el minuto), con botón
// «↻ Actualizar» y la hora; se recarga al volver a la app; Revisar recarga y
// reintenta, y si no está avisa; si preparar la revisión falla, se abre igual
// con los datos del envío y un aviso, nunca en blanco. El escaneo del enlace
// vuelve a pasar por todas las capas.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "↻ Actualizar":"↻ Refresh",
  "Actualizado {0}":"Updated {0}",
  "Actualizando…":"Refreshing…",
  "Esta compra ya no está en el buzón (¿ya la guardaste o la rechazaste?).":"This purchase is no longer in the inbox (already saved or rejected?).",
  "No se pudo preparar la revisión ({0}). Se muestran los datos tal como llegaron; revisa antes de guardar.":"Couldn't prepare the review ({0}). Showing the data as it arrived; check before saving."
});
const tt=(k,a)=>typeof T==='function'?(a!=null?T(k,a):T(k)):(a!=null?String(k).replace('{0}',a):k);
const hm=ms=>{try{return new Date(ms).toLocaleTimeString(typeof LANG!=='undefined'&&LANG==='en'?'en-US':'es-US',{hour:'numeric',minute:'2-digit'})}catch(e){return''}};
function logErr(where,e){
  try{console.error('v161 '+where,e);localStorage.setItem('finanzas-inbox-lasterr',JSON.stringify({where,msg:String(e&&e.message||e).slice(0,300),at:Date.now(),v:typeof CODE_V!=='undefined'?CODE_V:''}))}catch(x){}
}
let lastOk=0,busy=null;
async function reload(){
  if(busy)return busy;
  busy=(async()=>{
    try{if(typeof inboxAt!=='undefined')inboxAt=0}catch(e){}
    try{if(typeof inboxLoad==='function')await inboxLoad(true);lastOk=Date.now()}
    catch(e){logErr('load',e)}
    finally{busy=null}
  })();
  return busy;
}
function listOpen(){const d=typeof dlg==='function'&&dlg();return !!(d&&d.open&&/📥/.test((d.querySelector('h2')||{}).textContent||''))}
function paintBar(){
  if(!listOpen()||document.getElementById('v161bar'))return;
  const h=dlg().querySelector('h2');if(!h)return;
  h.insertAdjacentHTML('afterend',`<div id="v161bar" style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin:-2px 0 8px"><span class="muted" id="v161at" style="font-size:13px">${lastOk?esc(tt('Actualizado {0}',hm(lastOk))):''}</span><button type="button" class="sec" id="v161ref" style="min-height:34px;padding:0 12px;font-size:14px" onclick="v161Refresh()">${esc(tt('↻ Actualizar'))}</button></div>`);
}
const ids=()=>(typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).map(x=>x&&x.id).join(',');
window.v161Refresh=async function(){
  const b=document.getElementById('v161ref');if(b){b.disabled=true;b.textContent=tt('Actualizando…')}
  await reload();
  if(listOpen())_list();
  try{if(typeof render==='function')render()}catch(e){}
};
let _list=null;
if(typeof inboxList==='function'){
  const prev=inboxList;
  _list=function(){prev.apply(this,arguments);paintBar()};
  inboxList=function(){
    const before=ids();
    _list.apply(this,arguments);
    reload().then(()=>{if(listOpen()&&ids()!==before)_list();else{const a=document.getElementById('v161at');if(a&&lastOk)a.textContent=tt('Actualizado {0}',hm(lastOk))}});
  };
}
function fallbackOpen(x,e){
  // revisión mínima con los datos del envío, sin capas extra
  try{
    if(typeof editP==='function'){try{editP()}catch(z){}}
    if(!D)return;
    const ok3=['Yo','Tony','Carlos'],cats=typeof pCats==='function'?pCats():[];
    D.store=String(x.store||'').slice(0,60)||D.store;if(/^\d{4}-\d{2}-\d{2}$/.test(x.date||''))D.date=x.date;
    D.total=r2(+x.total||0);if(+x.tax>0&&+x.tax<D.total)D.tax=r2(+x.tax);
    D.list=(Array.isArray(x.items)?x.items:[]).slice(0,60).filter(i=>Math.abs(+i.a||0)>0.004).map(i=>{const own=(Array.isArray(i.own)?i.own:[]).filter(w=>ok3.includes(w));const o={a:r2(+i.a),n:String(i.n||'').slice(0,40),own:own.length?own:ok3};if(cats.includes(i.c))o.c=i.c;return o});
    D._io=D.list.length>0;D.paidBy=String(x.by||'').slice(0,20);D.method='';D._inbox={t:x.t,id:x.id,link:x.link};D.inboxId=String(x.id||'').slice(0,60);
    try{recomputeEq()}catch(z){}
    try{drawP()}catch(z){logErr('fallback-draw',z)}
    const d=dlg();if(d&&!d.open)try{d.showModal()}catch(z){}
    const h=d&&d.querySelector('h2');
    if(h&&!document.getElementById('v161warn'))h.insertAdjacentHTML('afterend',`<div id="v161warn" style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:14px">${esc(tt('No se pudo preparar la revisión ({0}). Se muestran los datos tal como llegaron; revisa antes de guardar.',String(e&&e.message||e).slice(0,80)))}</div>`);
  }catch(z){logErr('fallback',z)}
}
if(typeof inboxOpen==='function'){
  const prev=inboxOpen;
  const find=id=>(typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).find(y=>y&&y.id===id);
  const run=id=>{
    const x=find(id);
    // cerrar la lista antes de abrir la revisión: algunos WebKit fallan con showModal() sobre un diálogo ya abierto
    try{const d=dlg();if(d&&d.open)d.close()}catch(e){}
    try{prev(id)}catch(e){logErr('open',e);fallbackOpen(x,e);return}
    const d=dlg();
    if(!D||!D._inbox||D._inbox.id!==id||!(d&&d.open)){logErr('open-empty',new Error('review not shown'));fallbackOpen(x,new Error('vacía'))}
  };
  inboxOpen=function(id){
    if(find(id))return run(id);
    reload().then(()=>{
      if(find(id))run(id);
      else{try{if(listOpen())_list&&_list()}catch(e){}if(typeof toast==='function')toast(tt('Esta compra ya no está en el buzón (¿ya la guardaste o la rechazaste?).'))}
    });
  };
}
// volver a la app (o a la pestaña) recarga el buzón
let lastVis=0;
function onBack(){
  if(document.visibilityState&&document.visibilityState!=='visible')return;
  if(Date.now()-lastVis<15000)return;lastVis=Date.now();
  if(!(window.fbUser&&fbUser()))return;
  reload().then(()=>{try{if(listOpen())_list();else if(typeof tab!=='undefined'&&(tab==='ini'||tab==='mov')&&!(dlg()&&dlg().open))render()}catch(e){}});
}
document.addEventListener('visibilitychange',onBack);
window.addEventListener('focus',onBack);
window.addEventListener('pageshow',onBack);

// ---- página del enlace: el escaneo vuelve a pasar por window.vScanFile (v159/v160) ----
function installShare(){
  if(window._v161Share||typeof window.vScan!=='function'||typeof window.vScanFile!=='function')return;
  window._v161Share=true;
  if(typeof window.vAI==='function'){
    const ai=window.vAI;
    window.vAI=async function(){const txt=await ai.apply(this,arguments);try{window.__v161raw=String(txt||'')}catch(e){}return txt};
  }
  window.vScan=function(){
    const i=document.createElement('input');i.type='file';i.accept='image/*,application/pdf';i.style.display='none';
    i.onchange=async()=>{const file=i.files&&i.files[0];i.remove();if(file)await window.vScanFile(file)};
    document.body.appendChild(i);i.click();
  };
  const prev=window.vScanFile;
  window.vScanFile=async function(file){
    window.__v161raw=null;
    await prev(file);
    const R=window.REG,er=document.getElementById('rerr');
    if(!R||!R.scan||(er&&String(er.textContent||'').trim())||!window._v160)return;
    let o=null;try{const s=String(window.__v161raw||'');o=JSON.parse(s.slice(s.indexOf('{'),s.lastIndexOf('}')+1))}catch(e){return}
    const raw=(o&&Array.isArray(o.items)?o.items:[]).slice(0,60);
    if(!raw.some(x=>_v160.isDiscName(x&&x.name)||_v160.scanAmt(x&&x.amount)<0))return;
    const byN={};(R.items||[]).forEach(x=>{if(x&&x.n)byN[x.n]=x});
    const L=raw.map(x=>{const n=String(x.name||'').slice(0,40),p=byN[n];return {n,a:_v160.scanAmt(x.amount),own:p&&p.own?p.own.slice():['Yo','Tony','Carlos'],c:p&&p.c||(R.items&&R.items[0]&&R.items[0].c)||''}});
    const ap=_v160.applyList(L,{total:R.total,tax:R.tax},{noBalance:true});
    if(_v160.overage({total:R.total,tax:R.tax},ap.list)<=0.004){R.items=ap.list.map(x=>({n:x.n,a:x.a,own:x.own,c:x.c||''}));if(typeof window.regDraw==='function')window.regDraw()}
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installShare);else installShare();
window._v161={reload,fallbackOpen,installShare};
})();
