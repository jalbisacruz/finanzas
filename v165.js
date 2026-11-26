// v165 (Joe): con v164 en vivo sigue sin ver las 3 compras de Carlos y quiere rechazarlas.
// Lo que dice el código (sin datos reales):
//  - 📥 solo se podía abrir desde la línea de Hoy (que el ✕ oculta todo el día; desde v162,
//    hasta que llegue una compra nueva) o desde Operaciones › Compras, y solo si había
//    algo en la lista. Con la lista vacía no había forma de mirar el buzón.
//  - «📤 Tony / 📤 Carlos» en Por hacer abren el Mensaje, no el buzón.
//  - «Cambiar enlace» y «Desactivar» borran shares/<token> y la marca local del token, sin
//    recordarlo. Lo que quedaba sin revisar bajo ese token ya no se puede leer ni borrar
//    (las reglas piden que shares/<token> exista con owner = Joe), y la lectura de un enlace
//    anterior o desactivado fallaba en silencio (v162).
//  - Una compra cuyo id está en una compra guardada (p.inboxId, también desde otro
//    dispositivo por la nube) se oculta del buzón.
// Aquí:
//  - Hoy siempre tiene la línea «🧾 Compras por revisar (N) · Ver todas» (sin ✕).
//  - Por hacer (Operaciones) tiene la misma fila; los botones de mensaje pasan a «✉️ Mensaje Tony/Carlos».
//  - «Ver todas»: cada token conocido (actual, anteriores, desactivado, los que este teléfono
//    vio alguna vez y uno pegado a mano), con la ruta, cuántos documentos hay y el error si
//    no se pudo leer; cada documento con su estado (pendiente, guardada, oculta) y
//    «Rechazar» (borra solo ese, tras confirmar). Si un token anterior da permission-denied,
//    «Recuperar acceso» vuelve a crear su shares/<token> para poder leer y rechazar.
//  - Antes de «Cambiar enlace» o «Desactivar», el token se apunta para no perderlo.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "🧾 Compras por revisar ({0})":"🧾 Purchases to review ({0})","Ver todas":"See all","Revisar":"Review",
  "🧾 Buzón: todo lo que llegó":"🧾 Inbox: everything received",
  "Todos los enlaces que este teléfono conoce y lo que hay en cada uno. Rechazar borra solo ese envío.":"Every link this phone knows and what is in each one. Reject deletes only that submission.",
  "enlace actual":"current link","enlace desactivado":"link off","enlace anterior":"previous link","enlace pegado":"pasted link",
  "{0} documentos":"{0} documents","1 documento":"1 document","sin documentos":"no documents",
  "no se pudo leer ({0})":"couldn't read ({0})","copia guardada en el teléfono":"copy saved on this phone",
  "pendiente":"pending","guardada":"saved","oculta":"hidden","hoja de cuentas":"bill sheet","aviso de pago":"payment notice",
  "guardada: {0}":"saved: {0}","Rechazar":"Reject","Recuperar acceso":"Restore access",
  "¿Rechazar este envío de {0}? {1}\nSe borra del buzón y no se puede deshacer.":"Reject this submission from {0}? {1}\nIt is deleted from the inbox and can't be undone.",
  "Rechazado":"Rejected","No se pudo rechazar ({0})":"Couldn't reject ({0})",
  "Este enlace se borró (Cambiar enlace o Desactivar). Recuperar acceso lo vuelve a crear para poder leer y rechazar lo que quedó; la página anterior vuelve a abrir.":"This link was deleted (Change link or Turn off). Restore access re-creates it so you can read and reject what is left; the old page opens again.",
  "¿Recuperar acceso a este enlace anterior de {0}? Su página anterior volverá a abrir.":"Restore access to this previous link for {0}? Their old page will open again.",
  "Pega el enlace que usa {0} (v.html?t=…)":"Paste the link {0} uses (v.html?t=…)","Buscar":"Search","Enlace no válido":"Invalid link",
  "Último motivo: {0}":"Last reason: {0}","Último error: {0}":"Last error: {0}","Actualizar":"Refresh","Cerrar":"Close",
  "✉️ Mensaje {0}":"✉️ Message {0}","🧾 Buzón":"🧾 Inbox","Nada en ningún enlace.":"Nothing in any link."
});
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};
const TOK=/^[A-Za-z0-9_-]{20,}$/,PPL=['Carlos','Tony'],RK='finanzas-inbox-tokens';
const jget=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
const jset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const nm=w=>typeof DN==='function'?DN(w):w;
const tail=t=>'…'+String(t).slice(-6);
const pend=()=>(typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).filter(x=>x&&x.kind!=='bills'&&x.kind!=='settle');
// registro de tokens vistos (no se borra nunca)
function reg(t,who,src){if(!TOK.test(t||''))return;const R=jget(RK,{});const o=R[t]||{};R[t]={who:who||o.who||'',src:o.src||src,at:o.at||Date.now()};jset(RK,R)}
function regNow(){try{const L=(typeof S!=='undefined'&&S&&S.links)||{};PPL.forEach(w=>{const x=L[w]||{};if(x.t)reg(x.t,w,'actual');(x.alt||[]).forEach(t=>reg(t,w,'anterior'))})}catch(e){}}
function tokens(){
  const L=(typeof S!=='undefined'&&S&&S.links)||{},out=new Map(),add=(t,who,kind)=>{if(!TOK.test(t||''))return;const o=out.get(t);if(!o||(o.kind!=='actual'&&kind==='actual'))out.set(t,{t,who:who||(o&&o.who)||'',kind:o&&o.kind==='actual'?'actual':kind})};
  PPL.forEach(w=>{const x=L[w]||{};if(x.t)add(x.t,w,x.on?'actual':'off');(Array.isArray(x.alt)?x.alt:[]).forEach(t=>add(t,w,'anterior'))});
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(!k.startsWith('finanzas-link-h-'))continue;const t=k.slice(16);let who='';try{who=JSON.parse(localStorage.getItem(k)||'{}').who||''}catch(e){}add(t,who,'anterior')}}catch(e){}
  const A=jget('finanzas-inbox-alt',{});Object.keys(A).forEach(w=>(A[w]||[]).forEach(t=>add(t,w,'anterior')));
  Object.keys(jget('finanzas-inbox-cache',{})).forEach(t=>add(t,'','anterior'));
  const R=jget(RK,{});Object.keys(R).forEach(t=>add(t,R[t].who,R[t].src==='pegado'?'pegado':'anterior'));
  const rank={actual:0,off:1,pegado:2,anterior:3};
  return [...out.values()].sort((a,b)=>(PPL.indexOf(a.who)+1||9)-(PPL.indexOf(b.who)+1||9)||rank[a.kind]-rank[b.kind]);
}
// ---- vista «Ver todas» ----
let VIEW=null; // {rows:[{tok,docs,err,stale}]}
async function readTok(o){
  if(typeof window.fbInbox!=='function')return {...o,docs:[],err:'sin-sesion'};
  try{const docs=await window.fbInbox(o.t);const E=window.__v163err||{};const stale=docs.some(d=>d&&d.v163stale);
    return {...o,docs,err:stale?(E[o.t]||'error'):'',stale}}
  catch(e){return {...o,docs:[],err:String((e&&(e.code||e.name))||e||'error').replace(/^firestore\//,'').slice(0,40)}}
}
function savedInfo(id){
  for(const [k,m] of Object.entries((S&&S.months)||{}))for(const p of (m.purchases||[]))if(p&&p.inboxId===id)return {k,p};
  return null;
}
function docState(d){
  if(d.kind==='bills')return {s:'hoja de cuentas'};if(d.kind==='settle')return {s:'aviso de pago'};
  const sv=savedInfo(d.id);if(sv)return {s:'guardada',sv};
  if(pend().some(x=>x.id===d.id))return {s:'pendiente'};
  return {s:'oculta'};
}
const kindTxt=k=>tt(k==='actual'?'enlace actual':k==='off'?'enlace desactivado':k==='pegado'?'enlace pegado':'enlace anterior');
const dl=d=>`${d.date?(typeof fdate==='function'?fdate(d.date):d.date)+' · ':''}${esc(String(d.store||(d.kind==='bills'?tt('hoja de cuentas'):d.kind==='settle'?tt('aviso de pago'):'?')).slice(0,60))}`;
function draw(){
  const d=dlg();if(!VIEW)return;
  const blocks=VIEW.rows.map((r,ri)=>{
    const n=r.docs.length,cnt=r.err&&!r.stale?`<b style="color:#b91c1c">${esc(tt('no se pudo leer ({0})',r.err))}</b>`:(n?esc(n===1?tt('1 documento'):tt('{0} documentos',n)):esc(tt('sin documentos')))+(r.stale?` · <span style="color:#b45309">${esc(tt('no se pudo leer ({0})',r.err))} · ${esc(tt('copia guardada en el teléfono'))}</span>`:'');
    const lost=r.err==='permission-denied'&&r.kind!=='actual';
    const docs=r.docs.map((x,di)=>{const st=docState(x);const col=st.s==='pendiente'?'#15803d':st.s==='guardada'?'#64748b':'#b45309';
      const extra=st.sv?' · '+esc(tt('guardada: {0}',(typeof fdate==='function'?fdate(st.sv.p.date):st.sv.p.date)+' '+String(st.sv.p.store||'')+' '+f(+st.sv.p.total||0))):'';
      const canRev=!x.kind&&st.s!=='guardada';
      return `<div class="row v165doc" data-id="${esc(x.id)}" style="gap:6px;align-items:center"><span class="n">${dl(x)}<div class="muted">${x.by?esc(tt('Compró: {0}',String(x.by).slice(0,20)))+' · ':''}<span style="color:${col};font-weight:600">${esc(tt(st.s))}</span>${extra}</div></span><b>${+x.total?f(+x.total):''}</b>
        ${canRev?`<button class="sec" style="min-height:34px;padding:0 10px;font-size:14px" onclick="v165Rev(${ri},${di})">${esc(tt('Revisar'))}</button>`:''}
        <button class="del v165rej" style="min-height:34px;padding:0 10px;font-size:14px" onclick="v165Rej(${ri},${di})">${esc(tt('Rechazar'))}</button></div>`}).join('');
    return `<div class="v165tok" data-t="${esc(r.t)}" style="border-top:1px solid #e2e8f0;padding:8px 0">
      <div><b>${esc(r.who?nm(r.who):'?')}</b> · <span class="muted">${esc(kindTxt(r.kind))}</span></div>
      <div class="muted" style="font-size:12px;font-family:ui-monospace,monospace">shares/${esc(tail(r.t))}/inbox · ${cnt}</div>
      ${lost?`<div class="muted" style="font-size:13px;color:#b45309">${esc(tt('Este enlace se borró (Cambiar enlace o Desactivar). Recuperar acceso lo vuelve a crear para poder leer y rechazar lo que quedó; la página anterior vuelve a abrir.'))}</div><button class="sec v165rec" style="min-height:34px;font-size:14px;margin-top:4px" onclick="v165Recover(${ri})">${esc(tt('Recuperar acceso'))}</button>`:''}
      ${docs}</div>`}).join('');
  const dr=jget('finanzas-inbox-drops',[]).slice(-1)[0],le=jget('finanzas-inbox-lasterr',null);
  const why=dr?`<div class="muted" style="font-size:12px">${esc(tt('Último motivo: {0}',new Date(dr.at).toLocaleString()+' · '+dr.items.map(i=>(i.store||'?')+' → '+i.why).join(', ')))}</div>`:'';
  const er=le?`<div class="muted" style="font-size:12px">${esc(tt('Último error: {0}',new Date(le.at).toLocaleString()+' · '+le.where+' · '+le.msg))}</div>`:'';
  d.innerHTML=`<h2>${esc(tt('🧾 Buzón: todo lo que llegó'))}</h2>
   <div class="muted" style="margin-bottom:6px">${esc(tt('Todos los enlaces que este teléfono conoce y lo que hay en cada uno. Rechazar borra solo ese envío.'))}</div>
   <div id="v165all">${blocks||`<div class="muted">${esc(tt('Nada en ningún enlace.'))}</div>`}</div>
   <div style="border-top:1px solid #e2e8f0;padding-top:8px;margin-top:4px"><div class="muted" style="font-size:13px">${esc(tt('Pega el enlace que usa {0} (v.html?t=…)',nm('Carlos')))}</div>
    <div style="display:flex;gap:6px;margin-top:4px"><input id="v165paste" placeholder="https://…/v.html?t=…" style="flex:1;min-width:0"><button class="sec" id="v165go" onclick="v165Paste()">${esc(tt('Buscar'))}</button></div></div>
   ${why}${er}
   <div class="grid" style="margin-top:10px"><button class="sec" id="v165ref" onclick="inboxAll()">${esc(tt('Actualizar'))}</button><button class="sec" onclick="dlg().close()">${esc(tt('Cerrar'))}</button></div>`;
  if(!d.open)d.showModal();
}
window.inboxAll=async function(){
  regNow();
  const d=dlg();d.innerHTML=`<h2>${esc(tt('🧾 Buzón: todo lo que llegó'))}</h2><div class="muted">…</div>`;if(!d.open)d.showModal();
  const rows=[];for(const o of tokens())rows.push(await readTok(o));
  VIEW={rows};window.__v165view=VIEW;draw();
};
window.v165Rej=async function(ri,di){
  const r=VIEW&&VIEW.rows[ri],x=r&&r.docs[di];if(!x)return;
  const desc=`${x.date||''} · ${x.store||''}${+x.total?' · '+f(+x.total):''}`;
  if(!confirm(tt('¿Rechazar este envío de {0}? {1}\nSe borra del buzón y no se puede deshacer.',String(x.by||nm(r.who)||'?').slice(0,20),desc)))return;
  try{await window.fbInboxDel(r.t,x.id)}catch(e){toast(tt('No se pudo rechazar ({0})',String((e&&(e.code||e.message))||e).slice(0,60)));return}
  try{const s=jget('finanzas-inbox-rejected',[]);s.push(x.id);jset('finanzas-inbox-rejected',s.slice(-50));const C=jget('finanzas-inbox-cache',{});if(C[r.t]){C[r.t].docs=(C[r.t].docs||[]).filter(d=>d.id!==x.id);jset('finanzas-inbox-cache',C)}}catch(e){}
  if(typeof INBOX!=='undefined')INBOX=INBOX.filter(y=>y.id!==x.id);
  r.docs.splice(di,1);toast(tt('Rechazado'));draw();
};
window.v165Rev=function(ri,di){
  const r=VIEW&&VIEW.rows[ri],x=r&&r.docs[di];if(!x)return;
  if(!INBOX.some(y=>y.id===x.id))INBOX=[{...x,t:r.t,link:r.who||x.by||'Carlos',v162alt:r.kind!=='actual'},...INBOX];
  try{dlg().close()}catch(e){}inboxOpen(x.id);
};
window.v165Recover=async function(ri){
  const r=VIEW&&VIEW.rows[ri];if(!r)return;const who=r.who||'Carlos';
  if(!confirm(tt('¿Recuperar acceso a este enlace anterior de {0}? Su página anterior volverá a abrir.',nm(who))))return;
  try{await window.fbShareSet(r.t,{...snapFor(who),updatedAt:Date.now()})}catch(e){toast(String((e&&(e.code||e.message))||e).slice(0,80));return}
  VIEW.rows[ri]=await readTok(r);draw();
};
window.v165Paste=function(){
  const v=(document.getElementById('v165paste')||{}).value||'';let t='';
  try{t=new URL(v.trim(),location.origin).searchParams.get('t')||''}catch(e){}
  if(!t&&TOK.test(v.trim()))t=v.trim();
  if(!TOK.test(t)){toast(tt('Enlace no válido'));return}
  reg(t,'Carlos','pegado');const R=jget(RK,{});R[t].src='pegado';jset(RK,R);inboxAll();
};
// ---- tokens: apuntarlos antes de Cambiar enlace / Desactivar, y en cada carga ----
if(typeof linkRegen==='function'){const prev=linkRegen;linkRegen=function(w){try{const x=S.links[w];if(x&&x.t)reg(x.t,w,'anterior')}catch(e){}return prev.apply(this,arguments)};window.linkRegen=linkRegen}
if(typeof linkToggle==='function'){const prev=linkToggle;linkToggle=function(w,on){try{const x=S.links[w];if(x&&x.t)reg(x.t,w,on?'actual':'anterior')}catch(e){}return prev.apply(this,arguments)};window.linkToggle=linkToggle}
if(typeof inboxLoad==='function'){const prev=inboxLoad;inboxLoad=async function(){regNow();return prev.apply(this,arguments)}}
// ---- entradas: Hoy (siempre), Por hacer y la lista 📥 ----
const entry=(id)=>{const n=pend().length;
  // si la línea 📥 de Hoy ya dice cuántas hay, aquí no se repite
  let dup=false;try{dup=id==='v165hoy'&&n>0&&typeof remList==='function'&&remList().some(r=>r&&r.id==='inbox')}catch(e){}
  const lab=dup?tt('🧾 Buzón'):tt('🧾 Compras por revisar ({0})',n);
  return `<div class="card" id="${id}" style="padding:10px 14px"><div style="display:flex;gap:8px;align-items:center;justify-content:space-between">
  <button class="lnk" id="${id}-rev" style="all:unset;cursor:pointer;font-size:15px;font-weight:${n&&!dup?700:400};${n&&!dup?'color:#a16207':''}" onclick="inboxList()">${esc(lab)}</button>
  <button class="sec" id="${id}-all" style="min-height:32px;padding:0 10px;font-size:14px" onclick="inboxAll()">${esc(tt('Ver todas'))}</button></div></div>`};
window.v165Entry=entry;
if(typeof todoCard==='function'){const prev=todoCard;todoCard=function(){return entry('v165hoy')+prev.apply(this,arguments)}}
const relabel=h=>String(h).replace(/>📤 (Tony|Carlos)</g,(m,w)=>'>'+tt('✉️ Mensaje {0}',w)+'<').replace(/>📤</g,'>✉️<');
if(typeof opsTodo==='function'){const prev=opsTodo;opsTodo=function(){let h=relabel(prev.apply(this,arguments));const n=pend().length;
  const bs='display:inline-block;min-height:34px;padding:0 10px;font-size:14px;width:auto;margin:0;flex:0 0 auto;white-space:nowrap';
  const row=`<div id="v165ops" style="display:flex;flex-wrap:nowrap;align-items:center;gap:6px;padding:8px 0;border-bottom:1px solid #eef2f6"><span style="flex:1 1 auto;min-width:0;font-weight:${n?700:400}${n?';color:#a16207':''}">${esc(tt('🧾 Compras por revisar ({0})',n))}</span><span style="display:flex;gap:6px;flex:0 0 auto"><button type="button" class="${n?'pay':'sec'}" id="v165ops-rev" style="${bs}" onclick="inboxList()">${esc(tt('Revisar'))}</button><button type="button" class="sec" id="v165ops-all" style="${bs}" onclick="inboxAll()">${esc(tt('Ver todas'))}</button></span></div>`;
  return h.replace(/(<div class="card" id="todocard"><h2>[^<]*<\/h2>)/,'$1'+row)}}
if(typeof closeCard==='function'){const prev=closeCard;closeCard=function(){return relabel(prev.apply(this,arguments))}}
// el botón «Ver todas» dentro de 📥 (v161 vuelve a pintar la lista tras recargar: se repone)
function listBtn(){try{const d=typeof dlg==='function'&&dlg(),h=d&&d.open&&d.querySelector('h2');if(!h||!/📥/.test(h.textContent||'')||document.getElementById('v165list-all'))return;
  const b=document.createElement('button');b.id='v165list-all';b.className='sec';b.type='button';b.style.cssText='width:100%;margin:0 0 8px;min-height:36px';b.textContent=tt('Ver todas');b.onclick=()=>inboxAll();
  const a=document.getElementById('v163st')||document.getElementById('v162st')||document.getElementById('v161bar')||h;a.insertAdjacentElement('afterend',b)}catch(e){}}
if(typeof inboxList==='function'){const prev=inboxList;inboxList=function(){prev.apply(this,arguments);listBtn()}}
try{const d=typeof dlg==='function'&&dlg();if(d&&window.MutationObserver)new MutationObserver(()=>listBtn()).observe(d,{childList:true})}catch(e){}
window._v165={tokens,readTok,docState,reg,entry};
})();
