// v162 (Joe): con v161 en vivo, las compras que Carlos envía (le sale «Enviado»)
// siguen sin salir en 📥. Carlos escribe en shares/<token de SU enlace>/inbox y la
// app de Joe lee shares/<S.links.Carlos.t>/inbox, solo si el enlace está «Activo».
// No hay filtros, orden, índices ni límites en esa lectura, y las reglas dejan
// leer al dueño. Si el token guardado en la app de Joe no es el de la página de
// Carlos (el estado volvió a una copia vieja, otro dispositivo creó otro token)
// o el enlace quedó «Desactivado» sin borrarse, Carlos envía bien y Joe nunca lo
// lee. Y si la lectura de un enlace fallaba, el error se tragaba en silencio.
// Aquí: además del token actual, se lee el buzón de los tokens anteriores que
// este teléfono conoce (los que la app escribió alguna vez) y de un enlace
// desactivado; lo que llegue ahí sale en 📥 igual. El token que tenga envíos se
// recuerda (S.links.<w>.alt) y su página se mantiene al día. En 📥 se ve, por
// persona, cuántas llegaron y si hubo error al leer.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "{0}: {1}":"{0}: {1}",
  "no se pudo leer ({0})":"couldn't read ({0})",
  "enlace desactivado":"link off",
  "sin enlace":"no link",
  "enlace anterior":"previous link",
  "Llegó por un enlace anterior de {0}. Envíale el enlace nuevo (☰ › Enlaces › Compartir).":"Arrived through an old link for {0}. Send them the new link (☰ › Links › Share)."
});
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};
const PPL=['Tony','Carlos'],TOKRE=/^[A-Za-z0-9_-]{20,}$/;
const ST=window.__v162st={};
function knownTokens(w){
  const L=(typeof S!=='undefined'&&S&&S.links)||{},x=L[w]||{},out=new Set();
  (Array.isArray(x.alt)?x.alt:[]).forEach(t=>{if(TOKRE.test(t||''))out.add(t)});
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(!k.startsWith('finanzas-link-h-'))continue;const t=k.slice(16);if(!TOKRE.test(t))continue;
    try{const d=JSON.parse(localStorage.getItem(k)||'{}');if(d&&d.who===w)out.add(t)}catch(e){}}}catch(e){}
  if(x.t)out.delete(x.on?x.t:'__none__');
  return [...out];
}
function errCode(e){return String((e&&(e.code||e.name))||e||'error').replace(/^firestore\//,'').slice(0,40)}
function remember(w,t){
  const L=(S.links=S.links||{}),x=(L[w]=L[w]||{});if(t===x.t&&x.on)return false;
  x.alt=Array.isArray(x.alt)?x.alt:[];if(x.alt.includes(t))return false;x.alt.push(t);x.alt=x.alt.slice(-5);return true;
}
async function readAll(){
  if(!(window.fbUser&&fbUser())||typeof window.fbInbox!=='function')return false;
  const L=(S&&S.links)||{},have=typeof inbHave==='function'?inbHave():new Set();
  const cur=new Set((typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).map(x=>x&&x.id));
  let add=[],changed=false;
  for(const w of PPL){
    const x=L[w]||{},st=ST[w]={on:!!x.on,t:x.t||'',n:(INBOX||[]).filter(d=>d&&d.link===w&&d.kind!=='bills').length,err:'',alt:0};
    // el actual, si está desactivado (la página puede seguir viva)
    const toks=knownTokens(w);if(x.t&&!x.on)toks.unshift(x.t);
    if(x.t&&x.on){
      // la lectura del token actual ya la hizo inboxLoad; si falló, se repite aquí para ver el error
      try{if(!st.n){await window.fbInbox(x.t)}}catch(e){st.err=errCode(e)}
    }else if(!x.t&&!toks.length)st.none=true;
    for(const t of toks){
      try{
        const docs=await window.fbInbox(t);
        const mine=docs.filter(d=>d&&d.kind!=='bills'&&!have.has(d.id)&&!cur.has(d.id));
        if(docs.length&&remember(w,t))changed=true;
        mine.forEach(d=>{add.push({...d,link:w,t,v162alt:!(x.on&&t===x.t)});cur.add(d.id)});
        st.alt+=mine.length;st.n+=mine.length;
      }catch(e){/* token borrado o ajeno: se ignora */}
    }
  }
  if(changed&&typeof save==='function')try{save()}catch(e){}
  if(add.length){
    const at=typeof inbAt==='function'?inbAt:(d=>+d.at||0);
    INBOX=[...INBOX,...add].sort((a,b)=>at(b)-at(a)||String(b.date||'').localeCompare(String(a.date||'')));
    return true;
  }
  return false;
}
if(typeof inboxLoad==='function'){
  const prev=inboxLoad;
  inboxLoad=async function(){
    const a0=typeof inboxAt!=='undefined'?inboxAt:0;
    const r=await prev.apply(this,arguments);
    let ch=false;
    const loaded=typeof inboxAt==='undefined'||inboxAt!==a0;
    if(loaded)try{ch=await readAll()}catch(e){console.warn('v162',e)}
    // sin reabrir la lista (v161 la vuelve a pintar si cambió); en Hoy se repinta
    try{const d=dlg();if(ch&&typeof tab!=='undefined'&&(tab==='ini'||tab==='mov')&&!(d&&d.open))render();paintStatus()}catch(e){}
    return r;
  };
}
function statusTxt(){
  return PPL.map(w=>{const s=ST[w];if(!s)return '';const nm=typeof DN==='function'?DN(w):w;
    let v=String(s.n||0);
    if(s.err)v=tt('no se pudo leer ({0})',s.err);
    else if(s.none)v=tt('sin enlace');
    else if(!s.on)v=v+' · '+tt('enlace desactivado');
    if(s.alt)v+=' · '+tt('enlace anterior');
    return tt('{0}: {1}',nm,v)}).filter(Boolean).join('  ·  ');
}
function paintStatus(){
  const d=typeof dlg==='function'&&dlg();if(!d||!d.open)return;const h=d.querySelector('h2');if(!h||!/📥/.test(h.textContent||''))return;
  let el=document.getElementById('v162st');const txt=statusTxt();if(!txt)return;
  if(!el){el=document.createElement('div');el.id='v162st';el.className='muted';el.style.cssText='font-size:13px;margin:0 0 8px';const bar=document.getElementById('v161bar');(bar||h).insertAdjacentElement('afterend',el)}
  el.textContent=txt;
  const anyErr=PPL.some(w=>ST[w]&&ST[w].err);el.style.color=anyErr?'#b91c1c':'';
}
if(typeof inboxList==='function'){
  const prev=inboxList;
  inboxList=function(){prev.apply(this,arguments);paintStatus();
    // marca las que llegaron por un enlace anterior
    (INBOX||[]).forEach(x=>{if(!x||!x.v162alt)return;document.querySelectorAll('#dlg button[onclick*="'+x.id+'"]').forEach(b=>{const row=b.closest('.row');const n=row&&row.querySelector('.n .muted');if(n&&!n.querySelector('.v162a'))n.insertAdjacentHTML('beforeend',` · <span class="v162a" style="color:#b45309">${esc(tt('enlace anterior'))}</span>`)})});
  };
}
function altNote(){
  try{if(!D||!D._inbox)return;const ib=D._inbox,x=((S&&S.links)||{})[ib.link]||{};
    if(x.on&&ib.t===x.t)return;const box=document.getElementById('inbbox');
    if(box&&!document.getElementById('v162alt'))box.insertAdjacentHTML('beforeend',`<div id="v162alt" style="color:#b45309;margin-top:4px">${esc(tt('Llegó por un enlace anterior de {0}. Envíale el enlace nuevo (☰ › Enlaces › Compartir).',typeof DN==='function'?DN(ib.link):ib.link))}</div>`)}catch(e){}
}
if(typeof drawP==='function'){const prev=drawP;drawP=function(){const r=prev.apply(this,arguments);altNote();return r}}
// la página del enlace anterior que aún usa alguien se mantiene al día
if(typeof linksSync==='function'){
  const prev=window.linksSync;
  let tm=null;
  window.linksSync=function(force){
    prev.apply(this,arguments);
    clearTimeout(tm);tm=setTimeout(async()=>{
      if(!(window.fbUser&&fbUser())||typeof window.fbShareSet!=='function'||typeof snapFor!=='function')return;
      const L=(S&&S.links)||{};
      for(const w of PPL){const x=L[w]||{};if(!x.on)continue;
        for(const t of (Array.isArray(x.alt)?x.alt:[])){if(t===x.t||!TOKRE.test(t))continue;
          const d=snapFor(w),h=JSON.stringify(d),k='finanzas-link-h-'+t;if(!force&&localStorage.getItem(k)===h)continue;
          try{await window.fbShareSet(t,{...d,updatedAt:Date.now()});localStorage.setItem(k,h)}catch(e){console.warn('v162 alt',w,e)}}}
    },force?50:1200);
  };
}
// el ✕ del recordatorio 📥 solo oculta las compras que había en ese momento;
// una compra nueva vuelve a mostrarlo (antes quedaba oculto todo el día)
const RIK='finanzas-rem-inbox-ids';
const inbIds=()=>(typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).filter(x=>x&&x.kind!=='bills').map(x=>x.id);
if(typeof remHide==='function'){
  const prev=remHide;
  remHide=function(id){if(id==='inbox')try{localStorage.setItem(RIK,JSON.stringify({d:typeof today==='function'?today():'',ids:inbIds()}))}catch(e){}return prev.apply(this,arguments)};
}
if(typeof remList==='function'&&typeof remHidden==='function'){
  const prev=remList;
  remList=function(){
    let R=prev.apply(this,arguments);
    const ids=inbIds();
    if(ids.length&&!R.some(r=>r.id==='inbox')){
      let seen=[];try{const o=JSON.parse(localStorage.getItem(RIK)||'{}');seen=o&&o.d===(typeof today==='function'?today():'')?o.ids||[]:[]}catch(e){}
      if(ids.some(i=>!seen.includes(i))){
        const n=ids.length;R.push({id:'inbox',u:1,t:n===1?T('📥 1 compra por revisar'):T('📥 {0} compras por revisar',n),go:'inboxList()'});
        R.sort((a,b)=>a.u-b.u);
      }
    }
    return R;
  };
}

// ---- Mensaje para Carlos / Tony: total en primera persona y parte de las cuentas ----
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "EN TOTAL ME DEBES {0}":"IN TOTAL YOU OWE ME {0}","En total me debes {0}":"In total you owe me {0}",
  "EN TOTAL TE TRANSFIERO {0}":"IN TOTAL I'LL TRANSFER YOU {0}","En total te transfiero {0}":"In total I'll transfer you {0}",
  "No me debes nada ✅":"You don't owe me anything ✅","En total te debo {0}":"In total I owe you {0}",
  "TU PARTE DE LAS CUENTAS (se la pagas a Tony)":"YOUR SHARE OF THE BILLS (you pay it to Tony)",
  "Total tu parte de las cuentas":"Total your share of the bills","La hoja de cuentas de Tony aún no está aprobada.":"Tony's bill sheet isn't approved yet.",
  "Compras − lo que ya pagaste. Tu parte de las cuentas ({0}) se la pagas a Tony.":"Purchases − what you already paid. Your share of the bills ({0}) you pay to Tony.",
  "Cuentas − lo que ya te transferí.":"Bills − what I already transferred."
});
function carlosBills(k){
  const m=S.months[k];if(!m)return {rows:[],tot:0,ok:false};
  const rows=(m.bills||[]).filter(b=>b&&b.sheet&&b.sheet.sp&&Math.abs(+b.sheet.sp.Carlos||0)>0.004).map(b=>({n:typeof billLbl==='function'?billLbl(b):DN(b.name),a:r2(+b.sheet.sp.Carlos||0)}));
  return {rows,tot:r2(rows.reduce((s,x)=>s+x.a,0)),ok:(m.bills||[]).some(b=>b&&b.sheet&&b.sheet.sp)};
}
function oweLine(who,k,caps){
  const c=calc(S.months[k]);
  if(who==='carlos'){
    if(c.carlosDue>0.005)return tt(caps?'EN TOTAL ME DEBES {0}':'En total me debes {0}',f(c.carlosDue));
    if(c.joeOwesCarlos>0.004)return tt('En total te debo {0}',f(c.joeOwesCarlos));
    return tt('No me debes nada ✅');
  }
  return c.tonyDue>0.005?tt(caps?'EN TOTAL TE TRANSFIERO {0}':'En total te transfiero {0}',f(c.tonyDue)):'';
}
window.v162Owe=oweLine;
if(typeof msgShort==='function'&&typeof calc==='function'){
  const prev=msgShort;
  msgShort=function(who,k){
    let s=prev(who,k);
    try{
      const L=s.split('\n');
      if(who==='carlos'){
        const B=carlosBills(k),ins=['',tt('TU PARTE DE LAS CUENTAS (se la pagas a Tony)')];
        if(B.rows.length){B.rows.forEach(x=>ins.push(mLine(x.n,f(x.a))));ins.push(mLine(tt('Total tu parte de las cuentas'),f(B.tot)))}
        else if(!B.ok)ins.push(tt('La hoja de cuentas de Tony aún no está aprobada.'));
        // tras el bloque de compras (antes de «ENTRE TÚ Y TONY» si existe)
        const j=L.findIndex(x=>/^(ENTRE TÚ Y TONY|BETWEEN YOU AND TONY)/.test(x));
        if(B.rows.length||!B.ok){if(j>0)L.splice(j-1,0,...ins);else L.push(...ins)}
      }
      const o=oweLine(who,k,false),O=oweLine(who,k,true);
      if(o){L.splice(1,0,o);L.push('',O)}
      s=L.join('\n');
    }catch(e){console.warn('v162 msg',e)}
    return s;
  };
}
if(typeof msgPdfText==='function'){
  const prev=msgPdfText;
  msgPdfText=function(who,k){const s=prev(who,k);try{const o=oweLine(who,k,false);if(!o)return s;const L=s.split('\n');L.splice(1,0,o);return L.join('\n')}catch(e){return s}};
}
// PDF de Carlos/Tony: el total en primera persona, en amarillo, a la derecha de la franja azul
if(typeof rep3PDF==='function'){
  const prev=rep3PDF;
  window.rep3PDF=rep3PDF=function(R,extra){
    const who=R&&R.who;let k=R&&(R.k||R.month);
    if(!k&&typeof S!=='undefined'&&S&&S.months){const hit=Object.keys(S.months||{}).find(x=>typeof lbl==='function'&&lbl(x)===R.label);k=hit||S.cur}
    if(typeof S==='undefined'||typeof calc!=='function'||!(who==='Carlos'||who==='Tony')||!S.months[k])return prev(R,extra);
    const w=who==='Carlos'?'carlos':'tony',line=oweLine(w,k,false);if(!line)return prev(R,extra);
    const asc=s=>String(s).replace(/[−–]/g,'-').replace(/✅/g,'').replace(/[^\x00-\xFF]/g,'').trim();
    const J=window.jspdf,Orig=J&&J.jsPDF;if(!Orig)return prev(R,extra);
    J.jsPDF=function(){const d=new Orig(...arguments);const out=d.output;
      d.output=function(){try{const cur=d.getCurrentPageInfo?d.getCurrentPageInfo().pageNumber:null;d.setPage(1);
        d.setFont('helvetica','bold');d.setFontSize(14);d.setTextColor(254,240,138);d.text(asc(line),564,30,{align:'right'});
        if(cur)d.setPage(cur)}catch(e){console.warn('v162 pdf',e)}return out.apply(this,arguments)};
      return d};
    Object.setPrototypeOf(J.jsPDF,Orig);J.jsPDF.prototype=Orig.prototype;
    try{return prev(R,extra)}finally{J.jsPDF=Orig}
  };
}
window._v162={carlosBills,oweLine,knownTokens,readAll,statusTxt,ST};
})();
