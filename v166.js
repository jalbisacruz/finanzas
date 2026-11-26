// v166 (Joe): «Quita del historial las rechazadas; las que aprobé ya están en Movimientos. Solo deja las
// pendientes por revisar. Si dice cero, no hay nada que ver.»
//  - Una sola entrada: «🧾 Compras por revisar (N)» (Hoy, si la línea 📥 no lo dice ya, y Por hacer) que abre 📥.
//  - 📥 junta las pendientes de TODOS los enlaces que el teléfono conoce (actual, anteriores, desactivado,
//    pegado), no solo del actual; así N es de verdad. Sin «Ver todas», sin rutas ni conteos.
//  - Nunca se listan las aprobadas (ya son una compra: p.inboxId) ni las rechazadas.
//  - Con 0: «No hay compras pendientes». Solo si una lectura falla sale una línea roja (y «Recuperar
//    acceso» si es un enlace anterior borrado). Un enlace pegado a mano sigue disponible, discreto.
// La copia en la nube de una aprobada NO se borra al guardar (v110: si la compra se pierde por un estado
// viejo de la nube, vuelve a salir en vez de perderse); se borra sola a los 60 días y no se muestra nunca.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "No hay compras pendientes":"No pending purchases","🧾 Compras por revisar ({0})":"🧾 Purchases to review ({0})",
  "No se pudo leer un enlace de {0} ({1}).":"Couldn't read a link for {0} ({1}).","¿Falta una? Pegar enlace":"Missing one? Paste link",
  "Recuperar acceso":"Restore access","Revisar":"Review"
});
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};
const V=window._v165||{};
const jget=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
const rej=()=>new Set(jget('finanzas-inbox-rejected',[]));
const isPurch=x=>x&&x.kind!=='bills'&&x.kind!=='settle';
const ERR={};window.__v166err=ERR;   // token -> {who,kind,err}
const pendList=()=>{const r=rej(),h=typeof inbHave==='function'?inbHave():new Set();return (typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).filter(x=>isPurch(x)&&!r.has(x.id)&&!h.has(x.id))};
const cnt=()=>pendList().length+(typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).filter(x=>x&&x.kind==='settle').length;
window.v166Pending=cnt;
// fuera de 📥: rechazadas (por si la nube aún las devuelve) y aprobadas
function clean(){if(typeof INBOX==='undefined'||!Array.isArray(INBOX))return;const r=rej(),h=typeof inbHave==='function'?inbHave():new Set();INBOX=INBOX.filter(x=>!(x&&(r.has(x.id)||(isPurch(x)&&h.has(x.id)))))}
// leer todos los tokens conocidos y sumar sus pendientes
async function scanAll(){
  if(!(window.fbUser&&fbUser())||typeof V.tokens!=='function'||typeof V.readTok!=='function')return false;
  const L=(S&&S.links)||{},cur=new Set(['Tony','Carlos'].map(w=>L[w]&&L[w].on&&L[w].t).filter(Boolean));
  const have=new Set((INBOX||[]).map(x=>x&&x.id)),h=typeof inbHave==='function'?inbHave():new Set(),r=rej();let add=[];
  for(const o of V.tokens()){
    const res=await V.readTok(o);
    if(res.err){ERR[o.t]={who:o.who||'Carlos',kind:o.kind,err:res.err};if(!res.stale)continue}
    else delete ERR[o.t];
    if(cur.has(o.t))continue; // ya lo lee inboxLoad
    (res.docs||[]).forEach(d=>{if(!isPurch(d)||have.has(d.id)||h.has(d.id)||r.has(d.id))return;have.add(d.id);add.push({...d,t:o.t,link:o.who||d.by||'Carlos',v162alt:true})});
  }
  if(add.length){INBOX=[...INBOX,...add];const at=typeof inbAt==='function'?inbAt:(x=>+x.at||0);INBOX.sort((a,b)=>at(b)-at(a));return true}
  return false;
}
if(typeof inboxLoad==='function'){
  const prev=inboxLoad;let busy=null;
  inboxLoad=async function(){
    const a0=typeof inboxAt!=='undefined'?inboxAt:0;
    const r=await prev.apply(this,arguments);
    const loaded=typeof inboxAt==='undefined'||inboxAt!==a0;
    let ch=false;
    if(loaded){try{if(!busy)busy=scanAll();ch=await busy}catch(e){console.warn('v166',e)}finally{busy=null}}
    clean();
    try{const d=dlg();if(d&&d.open&&/📥/.test((d.querySelector('h2')||{}).textContent||''))tidy();else if(ch&&typeof tab!=='undefined'&&(tab==='ini'||tab==='mov'))render()}catch(e){}
    return r;
  };
}
// 📥: solo pendientes; sin diagnósticos salvo error
function errHtml(){
  const E=Object.entries(ERR);if(!E.length)return '';
  return E.map(([t,o])=>{const lost=o.err==='permission-denied'&&o.kind!=='actual';
    return `<div class="v166err" style="color:#b91c1c;font-size:13px;margin:0 0 6px">${esc(tt('No se pudo leer un enlace de {0} ({1}).',typeof DN==='function'?DN(o.who||'Carlos'):(o.who||'Carlos'),o.err))}${lost?` <button type="button" class="sec v166rec" style="min-height:30px;padding:0 8px;font-size:13px;width:auto" onclick="v166Recover('${esc(t)}')">${esc(tt('Recuperar acceso'))}</button>`:''}</div>`}).join('');
}
function tidy(){
  try{
    const d=dlg(),h=d&&d.open&&d.querySelector('h2');if(!h||!/📥/.test(h.textContent||''))return;
    const n=cnt();
    const want=tt('📥 Compras por revisar ({0})',n);if(h.textContent!==want)h.textContent=want;
    const all=document.getElementById('v165list-all');if(all){all.hidden=true;all.style.display='none'}
    const s2=document.getElementById('v162st');if(s2)s2.style.display=/no se pudo leer|couldn't read/i.test(s2.textContent||'')?'':'none';
    const s3=document.getElementById('v163st');if(s3){const keep=(s3.textContent||'').split(' · ').filter(p=>/No se pudo actualizar|Couldn't refresh/.test(p));if(keep.length)s3.textContent=keep.join(' · ');else s3.style.display='none'}
    // filas de aprobadas o rechazadas fuera
    const r=rej(),hv=typeof inbHave==='function'?inbHave():new Set();
    d.querySelectorAll('button[onclick*="inboxOpen("]').forEach(b=>{const m=(b.getAttribute('onclick')||'').match(/inboxOpen\('([^']+)'\)/);if(!m)return;const row=b.closest('.row');if(!row)return;
      if(r.has(m[1])||hv.has(m[1])){row.remove();return}
      if(!row.querySelector('.v166rej')){const rb=document.createElement('button');rb.type='button';rb.className='del v166rej';rb.style.cssText='min-height:34px;padding:0 10px;font-size:14px;width:auto';rb.textContent=tt('Rechazar');rb.setAttribute('onclick',"v166Rej('"+esc(m[1])+"')");b.after(rb)}});
    // vacío
    const empty=!n;
    let e=document.getElementById('v166empty');
    if(empty){d.querySelectorAll('.muted').forEach(m=>{if(/Sin compras por revisar|Nothing to review/.test(m.textContent||''))m.style.display='none'});
      if(!e){e=document.createElement('div');e.id='v166empty';e.style.cssText='padding:14px 0;text-align:center;font-size:16px';e.textContent=tt('No hay compras pendientes');(document.getElementById('v161bar')||h).insertAdjacentElement('afterend',e)}}
    else if(e)e.remove();
    let x=document.getElementById('v166errs');const eh=errHtml();
    if(eh){if(!x){x=document.createElement('div');x.id='v166errs';(document.getElementById('v161bar')||h).insertAdjacentElement('afterend',x)}if(x.innerHTML!==eh)x.innerHTML=eh}else if(x)x.remove();
    if(!document.getElementById('v166paste')){
      const p=document.createElement('details');p.id='v166paste';p.style.cssText='margin:6px 0 0;font-size:13px';
      p.innerHTML=`<summary class="muted" style="cursor:pointer">${esc(tt('¿Falta una? Pegar enlace'))}</summary><div style="display:flex;gap:6px;margin-top:6px"><input id="v166url" placeholder="https://…/v.html?t=…" style="flex:1;min-width:0"><button type="button" class="sec" id="v166go" style="width:auto" onclick="v166Paste()">OK</button></div>`;
      const last=[...d.querySelectorAll('button')].filter(b=>/Cerrar|Close/.test(b.textContent||'')).pop();
      if(last)(last.closest('.grid')||last).insertAdjacentElement('beforebegin',p);else d.appendChild(p);
    }
  }catch(e){console.warn('v166 tidy',e)}
}
if(typeof inboxList==='function'){const prev=inboxList;inboxList=function(){clean();prev.apply(this,arguments);tidy()}}
try{const d=typeof dlg==='function'&&dlg();if(d&&window.MutationObserver){let q=false;new MutationObserver(()=>{if(q)return;q=true;Promise.resolve().then(()=>{q=false;tidy()})}).observe(d,{childList:true})}}catch(e){}
// «Ver todas» ya no existe aparte: abre 📥
window.inboxAll=function(){return inboxList()};
window.v166Paste=async function(){
  const v=((document.getElementById('v166url')||{}).value||'').trim();let t='';
  try{t=new URL(v,location.origin).searchParams.get('t')||''}catch(e){}
  if(!t&&/^[A-Za-z0-9_-]{20,}$/.test(v))t=v;
  if(!/^[A-Za-z0-9_-]{20,}$/.test(t)){toast(T('Enlace no válido'));return}
  if(V.reg)V.reg(t,'Carlos','pegado');
  try{if(typeof inboxAt!=='undefined')inboxAt=0;await inboxLoad(true)}catch(e){}
  inboxList();
};
window.v166Recover=async function(t){
  const o=ERR[t]||{};const who=o.who||'Carlos';
  if(!confirm(T('¿Recuperar acceso a este enlace anterior de {0}? Su página anterior volverá a abrir.',typeof DN==='function'?DN(who):who)))return;
  try{await window.fbShareSet(t,{...snapFor(who),updatedAt:Date.now()})}catch(e){toast(String((e&&(e.code||e.message))||e).slice(0,80));return}
  delete ERR[t];try{if(typeof inboxAt!=='undefined')inboxAt=0;await inboxLoad(true)}catch(e){}inboxList();
};
window.v166Rej=async function(id){
  const x=(INBOX||[]).find(y=>y&&y.id===id);if(!x)return;
  if(!confirm(T('¿Rechazar esta compra? Se borra del buzón.')))return;
  try{await window.fbInboxDel(x.t,x.id)}catch(e){toast(T('No se pudo rechazar ({0})',String((e&&(e.code||e.message))||e).slice(0,60)));return}
  try{const s=jget('finanzas-inbox-rejected',[]);s.push(id);localStorage.setItem('finanzas-inbox-rejected',JSON.stringify(s.slice(-50)));const C=jget('finanzas-inbox-cache',{});Object.keys(C).forEach(t=>{if(C[t]&&C[t].docs)C[t].docs=C[t].docs.filter(d=>d.id!==id)});localStorage.setItem('finanzas-inbox-cache',JSON.stringify(C))}catch(e){}
  INBOX=INBOX.filter(y=>y.id!==id);toast(T('Compra rechazada'));inboxList();
  try{if(typeof tab!=='undefined'&&(tab==='ini'||tab==='mov'))render()}catch(e){}
};
// entradas: una sola, «🧾 Compras por revisar (N)», que abre 📥
if(typeof V.entry==='function'){
  window.v165Entry=function(id){const n=cnt();
    let dup=false;try{dup=id==='v165hoy'&&n>0&&typeof remList==='function'&&remList().some(r=>r&&r.id==='inbox')}catch(e){}
    if(dup)return '';
    return `<div class="card" id="${id}" style="padding:10px 14px"><button class="lnk" id="${id}-rev" style="all:unset;cursor:pointer;display:block;width:100%;font-size:15px;font-weight:${n?700:400};${n?'color:#a16207':''}" onclick="inboxList()">${esc(tt('🧾 Compras por revisar ({0})',n))}</button></div>`};
}
if(typeof todoCard==='function'){const prev=todoCard;todoCard=function(){const h=prev.apply(this,arguments);return h.replace(/<div class="card" id="v165hoy"[\s\S]*?<\/button><\/div><\/div>/,window.v165Entry('v165hoy'))}}
if(typeof opsTodo==='function'){const prev=opsTodo;opsTodo=function(){const h=prev.apply(this,arguments),n=cnt();
  const bs='display:inline-block;min-height:34px;padding:0 12px;font-size:14px;width:auto;margin:0;flex:0 0 auto';
  const row=`<div id="v165ops" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #eef2f6"><span style="flex:1 1 auto;min-width:0;font-weight:${n?700:400}${n?';color:#a16207':''}">${esc(tt('🧾 Compras por revisar ({0})',n))}</span>${n?`<button type="button" class="pay" id="v165ops-rev" style="${bs}" onclick="inboxList()">${esc(tt('Revisar'))}</button>`:''}</div>`;
  return h.replace(/<div id="v165ops"[\s\S]*?<\/span><\/div>/,row)}}
// remList (línea 📥 de Hoy) y Operaciones › Compras: el mismo N
if(typeof remList==='function'){const prev=remList;remList=function(){const R=prev.apply(this,arguments);const n=cnt();
  return R.filter(r=>r.id!=='inbox'||n>0).map(r=>r.id==='inbox'?{...r,t:n===1?T('📥 1 compra por revisar'):T('📥 {0} compras por revisar',n)}:r)}}
window._v166={scanAll,pendList,clean,tidy,ERR};
})();
