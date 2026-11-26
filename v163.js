// v163 (Joe): en v162 el Mensaje para Carlos decía en primera persona «En total me debes $X»
// (y el de Tony «En total te transfiero $X»). Joe prefiere los nombres, como ya lo dicen el PDF
// («Quién transfiere a quién»: «Carlos le transfiere a Joe») y la hoja de cuentas («Carlos → Joe»).
// Ahora, en Solo texto, Enviar con PDF y el PDF:
//   Carlos: «Carlos le transfiere a Joe $X» (y «Carlos le transfiere a Tony $Y» si hay cuentas/compras de Tony),
//           al final «TOTAL: CARLOS LE TRANSFIERE A JOE $X»; «− Parte de Joe en tus compras».
//   Tony:   «Joe le transfiere a Tony $X», al final «TOTAL: JOE LE TRANSFIERE A TONY $X»
//           (sustituye «A TRANSFERIRTE» y «Te transfiero:»).
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "{0} le transfiere a {1} {2}":"{0} transfers {2} to {1}",
  "TOTAL: {0} LE TRANSFIERE A {1}":"TOTAL: {0} TRANSFERS TO {1}",
  "TU PARTE DE LAS CUENTAS (Carlos le transfiere a Tony)":"YOUR SHARE OF THE BILLS (Carlos transfers it to Tony)",
  "− Parte de Joe en tus compras":"− Joe's share of your purchases"
});
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};
const N=w=>typeof DN==='function'?DN(w):w;
const J0=()=>'Joe'; // igual que el PDF y la página del enlace (names.Yo='Joe')
// las transferencias de este mes para Carlos/Tony, con nombres (mismas cifras que Por hacer y el PDF)
function flows(who,k){
  const m=S.months[k];if(!m)return [];const c=calc(m),out=[];
  if(who==='carlos'){
    if(c.carlosDue>0.005)out.push({from:'Carlos',to:'Yo',a:c.carlosDue,main:1});
    else if(c.joeOwesCarlos>0.004)out.push({from:'Yo',to:'Carlos',a:c.joeOwesCarlos,main:1});
    const fl=window._v152&&typeof _v152.carlosFlows==='function'?_v152.carlosFlows(m):null;
    if(fl&&fl.toTony>0.004)out.push({from:'Carlos',to:'Tony',a:fl.toTony});
  }else if(c.tonyDue>0.005)out.push({from:'Yo',to:'Tony',a:c.tonyDue,main:1});
  return out;
}
const nm=w=>w==='Yo'?J0():N(w);
const lineOf=x=>tt('{0} le transfiere a {1} {2}',nm(x.from),nm(x.to),f(x.a));
const capsOf=x=>mLine(tt('TOTAL: {0} LE TRANSFIERE A {1}',nm(x.from).toUpperCase(),nm(x.to).toUpperCase()),f(x.a));
function nameLines(who,k){const F=flows(who,k);return {top:F.map(lineOf),main:F.find(x=>x.main)||null}}
window.v163Lines=nameLines;
const v162=window.v162Owe;
function fix(who,k,s,pdfShort){
  const L=s.split('\n'),{top,main}=nameLines(who,k);
  const o=v162?v162(who,k,false):null,O=v162?v162(who,k,true):null;
  // quita las líneas en primera persona de v162
  let out=L.filter(x=>!(o&&x===o)&&!(O&&x===O));
  // primera persona del original
  const tr=T('A TRANSFERIRTE'),te=T('Te transfiero')+':',debo=T('Te debo'),mi=T('− Mi parte de tus compras');
  out=out.map(x=>x.startsWith(mi)?x.replace(mi,tt('− Parte de Joe en tus compras')):x)
         .map(x=>x.replace(T('TU PARTE DE LAS CUENTAS (se la pagas a Tony)'),tt('TU PARTE DE LAS CUENTAS (Carlos le transfiere a Tony)')));
  out=out.filter(x=>!(x.startsWith(te)||x.startsWith(debo+'  ')||(main&&x.startsWith(tr+'  '))));
  if(pdfShort){const p=T('PENDIENTE')+':';out=out.filter(x=>!(main&&x.startsWith(p)))}
  // después del saludo, con nombres
  out.splice(1,0,...top);
  // al final (antes de «El detalle está en el PDF.» si está), el total en mayúsculas
  if(main&&!pdfShort){
    while(out.length&&out[out.length-1]==='')out.pop();
    const dt=T('El detalle está en el PDF.'),hasDt=out[out.length-1]===dt;if(hasDt)out.pop();
    while(out.length&&out[out.length-1]==='')out.pop();
    out.push('',capsOf(main));if(hasDt)out.push('',dt);
  }
  return out.join('\n').replace(/\n{3,}/g,'\n\n');
}
if(typeof msgShort==='function'&&typeof calc==='function'){
  const prev=msgShort;
  msgShort=function(who,k){const s=prev(who,k);try{return fix(who,k,s,false)}catch(e){console.warn('v163 msg',e);return s}};
}
if(typeof msgPdfText==='function'&&typeof calc==='function'){
  const prev=msgPdfText;
  msgPdfText=function(who,k){const s=prev(who,k);try{return fix(who,k,s,true)}catch(e){console.warn('v163 pdftext',e);return s}};
}
// PDF: v162 escribe «En total me debes …» en amarillo en la franja azul; aquí se cambia por la línea con nombres
if(typeof rep3PDF==='function'){
  const prev=rep3PDF;
  window.rep3PDF=rep3PDF=function(R,extra){
    const who=R&&R.who;
    if(typeof S==='undefined'||typeof calc!=='function'||!(who==='Carlos'||who==='Tony')||!window.jspdf||!window.jspdf.jsPDF)return prev(R,extra);
    let k=R.k||R.month;if(!k||!S.months[k]){const hit=Object.keys(S.months||{}).find(x=>typeof lbl==='function'&&lbl(x)===R.label);k=hit||S.cur}
    const w=who==='Carlos'?'carlos':'tony',{main}=nameLines(w,k);
    const asc=s=>String(s).replace(/[−–]/g,'-').replace(/✅/g,'').replace(/[^\x00-\xFF]/g,'').trim();
    const old=v162?v162(w,k,false):'';
    const J=window.jspdf,Orig=J.jsPDF;
    J.jsPDF=function(){const d=new Orig(...arguments),tx=d.text;
      d.text=function(s,x,y,o){
        if(old&&typeof s==='string'&&s===asc(old)&&y===30){
          if(!main)return d;
          // franja azul, a la derecha de la segunda línea (la del subtítulo); tamaño para que quepa
          const t=asc(lineOf(main));let fs=13;d.setFontSize(fs);while(fs>9&&d.getTextWidth(t)>230){fs-=0.5;d.setFontSize(fs)}
          return tx.call(d,t,x,51,o);
        }
        return tx.apply(d,arguments)};
      return d};
    Object.setPrototypeOf(J.jsPDF,Orig);J.jsPDF.prototype=Orig.prototype;
    try{return prev(R,extra)}finally{J.jsPDF=Orig}
  };
}

// ---- 📥: que nada desaparezca por un fallo de lectura (AB-3) ----
// Joe vio las 3 compras de Carlos, abrió una, tocó Cancelar y desaparecieron todas.
// Cancelar solo cierra el diálogo (no borra, no oculta, no guarda). Pero al volver a
// Hoy/la app, el buzón se recarga, y cada recarga REEMPLAZA la lista con lo que se leyó:
// si la lectura de un enlace fallaba (sin red, permiso, caché), ese enlace quedaba
// vacío (inbox.js solo lo decía en la consola; v162 ni eso en los enlaces anteriores).
// También un estado de la nube de otro dispositivo podía quitar los enlaces anteriores
// recordados (S.links.<w>.alt). Aquí:
//  - si falla la lectura de un token, se usan las últimas compras leídas de ese token
//    (guardadas en el teléfono) y se avisa en 📥;
//  - los enlaces anteriores se recuerdan también en el teléfono;
//  - si algo deja de salir, se apunta el motivo (guardada, rechazada, ya no está en la
//    nube, error) y se muestra en 📥.
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "No se pudo actualizar ({0}): se muestran las últimas que llegaron.":"Couldn't refresh ({0}): showing the last ones received.",
  "Ya no salen {0}: {1}":"No longer shown {0}: {1}",
  "guardada":"saved","rechazada":"rejected","ya no está en la nube":"no longer in the cloud","guardada en otro dispositivo":"saved on another device"
});
const CK='finanzas-inbox-cache',AK='finanzas-inbox-alt',DK='finanzas-inbox-drops',RJ='finanzas-inbox-rejected';
const jget=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
const jset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const ERR={};window.__v163err=ERR;
function wrapRead(){
  const fb=window.fbInbox;if(typeof fb!=='function'||fb.__v163)return;
  const w=async function(t){
    try{const docs=await fb(t);
      // si otra capa (v150) envuelve a esta, lo que llega puede ser ya la copia guardada: no es una lectura buena
      if(Array.isArray(docs)&&docs.some(d=>d&&d.v163stale))return docs;
      delete ERR[t];
      const C=jget(CK,{});C[t]={at:Date.now(),docs:docs.slice(0,40).map(d=>{const o={...d};if(o.at&&typeof o.at.toMillis==='function')o.at=o.at.toMillis();else if(o.at&&o.at.seconds)o.at=o.at.seconds*1000;return o})};
      const ks=Object.keys(C);if(ks.length>12)ks.sort((a,b)=>C[a].at-C[b].at).slice(0,ks.length-12).forEach(k=>delete C[k]);
      jset(CK,C);return docs}
    catch(e){
      const c=jget(CK,{})[t];ERR[t]=String((e&&(e.code||e.name))||e||'error').replace(/^firestore\//,'').slice(0,40);
      console.warn('v163 inbox read',t.slice(0,6),e);
      try{localStorage.setItem('finanzas-inbox-lasterr',JSON.stringify({where:'read',msg:ERR[t],at:Date.now(),v:typeof CODE_V!=='undefined'?CODE_V:''}))}catch(x){}
      if(c&&Array.isArray(c.docs)){const rj=rej();return c.docs.filter(d=>!rj.has(d.id)).map(d=>({...d,t,v163stale:1}))}
      throw e}
  };
  w.__v163=1;window.fbInbox=w;
}
// los enlaces anteriores también en el teléfono (un estado de la nube no los borra)
function altIn(){
  if(typeof S==='undefined'||!S)return;const A=jget(AK,{}),L=(S.links=S.links||{});
  ['Tony','Carlos'].forEach(w=>{const a=Array.isArray(A[w])?A[w]:[];if(!a.length)return;const x=(L[w]=L[w]||{});
    x.alt=[...new Set([...(Array.isArray(x.alt)?x.alt:[]),...a])].filter(t=>/^[A-Za-z0-9_-]{20,}$/.test(t)).slice(-5)});
}
function altOut(){
  if(typeof S==='undefined'||!S||!S.links)return;const A=jget(AK,{});
  ['Tony','Carlos'].forEach(w=>{const x=S.links[w];if(x&&Array.isArray(x.alt)&&x.alt.length)A[w]=[...new Set([...(A[w]||[]),...x.alt])].slice(-5)});jset(AK,A);
}
const rej=()=>new Set(jget(RJ,[]));
if(typeof inboxReject==='function'){
  const prev=inboxReject;
  inboxReject=async function(){const id=D&&D._inbox&&D._inbox.id;const before=(INBOX||[]).some(x=>x.id===id);const r=await prev.apply(this,arguments);
    if(id&&before&&!(INBOX||[]).some(x=>x.id===id)){const s=jget(RJ,[]);s.push(id);jset(RJ,s.slice(-50))}return r};
}
let lastDrop=null;
if(typeof inboxLoad==='function'){
  const prev=inboxLoad;
  inboxLoad=async function(){
    wrapRead();altIn();
    const pend=x=>x&&x.kind!=='bills'&&x.kind!=='settle';
    const before=(typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).filter(pend).map(x=>({id:x.id,by:x.by,store:x.store,t:x.t,link:x.link}));
    const r=await prev.apply(this,arguments);
    altOut();
    try{
      const now=new Set((INBOX||[]).map(x=>x&&x.id)),have=typeof inbHave==='function'?inbHave():new Set(),rj=rej();
      const gone=before.filter(x=>!now.has(x.id));
      if(gone.length){
        const why=x=>rj.has(x.id)?'rechazada':have.has(x.id)?(window.__v163saved&&window.__v163saved.has(x.id)?'guardada':'guardada en otro dispositivo'):ERR[x.t]?'error '+ERR[x.t]:'ya no está en la nube';
        const ev={at:Date.now(),items:gone.map(x=>({id:x.id,by:x.by,store:x.store,link:x.link,why:why(x)}))};
        const L=jget(DK,[]);L.push(ev);jset(DK,L.slice(-20));
        const unexpected=ev.items.filter(i=>i.why!=='rechazada'&&i.why!=='guardada');
        lastDrop=unexpected.length?{at:ev.at,items:unexpected}:null;
        if(unexpected.length)console.warn('v163 inbox drop',ev);
      }
    }catch(e){console.warn('v163 drop',e)}
    paint163();
    return r;
  };
}
// las que guardé en este teléfono (para distinguir de «guardada en otro dispositivo»)
window.__v163saved=new Set();
if(typeof saveP==='function'){
  const prev=saveP;
  saveP=function(){const id=D&&D._inbox&&D._inbox.id;const r=prev.apply(this,arguments);if(id)window.__v163saved.add(id);return r};
}
function paint163(){
  try{
    const d=typeof dlg==='function'&&dlg();if(!d||!d.open)return;const h=d.querySelector('h2');if(!h||!/📥/.test(h.textContent||''))return;
    let el=document.getElementById('v163st');
    const errs=Object.entries(ERR).filter(([t])=>(INBOX||[]).some(x=>x.t===t&&x.v163stale));
    const parts=[];
    if(errs.length)parts.push(tt('No se pudo actualizar ({0}): se muestran las últimas que llegaron.',errs.map(e=>e[1]).join(', ')));
    if(lastDrop&&Date.now()-lastDrop.at<10*60e3){
      const by={};lastDrop.items.forEach(i=>{const k=tt(i.why.startsWith('error')?'ya no está en la nube':i.why);by[k]=(by[k]||0)+1});
      parts.push(tt('Ya no salen {0}: {1}',String(lastDrop.items.length),Object.entries(by).map(([k,n])=>n+' '+k).join(', ')));
    }
    if(!parts.length){if(el)el.remove();return}
    if(!el){el=document.createElement('div');el.id='v163st';el.style.cssText='font-size:13px;margin:0 0 8px;color:#b45309';const a=document.getElementById('v162st')||document.getElementById('v161bar')||h;a.insertAdjacentElement('afterend',el)}
    el.textContent=parts.join(' · ');
  }catch(e){}
}
if(typeof inboxList==='function'){const prev=inboxList;inboxList=function(){prev.apply(this,arguments);paint163()}}
window._v163in={wrapRead,altIn,altOut,ERR,drops:()=>jget(DK,[])};
window._v163={flows,nameLines,fix};
})();
