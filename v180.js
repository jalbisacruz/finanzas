// v180 (Joe): la cifra de «Compras por revisar» y la lista 📥 salen de la misma fuente;
// un aviso de pago (kind:settle, p. ej. «Carlos dice que ya pagó a Tony») ya no cuenta
// como «compra». Las listas de compras se ordenan por fecha (la más nueva primero),
// con la hora de creación como desempate; al guardar una compra manual se lee la fecha
// del campo (en el teléfono a veces no llega el change).
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "📥 Avisos de pago por revisar ({0})":"📥 Payment notices to review ({0})",
  "🧾 Avisos de pago por revisar ({0})":"🧾 Payment notices to review ({0})",
  "📥 Por revisar ({0})":"📥 To review ({0})",
  "🧾 Por revisar ({0})":"🧾 To review ({0})",
  "📥 1 aviso de pago por revisar":"📥 1 payment notice to review",
  "📥 {0} avisos de pago por revisar":"📥 {0} payment notices to review",
  "📥 {0} por revisar":"📥 {0} to review",
  "aviso de pago":"payment notice",
  "Ocultar":"Hide"
});
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};
const HK='finanzas-inbox-handled';
const jget=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
const jset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const handled=()=>new Set(jget(HK,[]));
const remember=id=>{if(!id)return;const s=jget(HK,[]);if(!s.includes(id)){s.push(id);jset(HK,s.slice(-80))}};
const atOf=p=>{const x=p&&p.p?p.p:p;if(!x)return 0;if(+x.at>0)return +x.at;return typeof inbAt==='function'?inbAt(x):0};
function sortByDate(a,d,mk){
  if(!a||!a.length)return [];
  d=d||(x=>x&&x.date);const n=a.length;
  const K=new Map(a.map(p=>[p,typeof dKey==='function'?dKey(d(p)):String(d(p)||'')]));
  mk=mk||(typeof domMonth==='function'?domMonth([...K.values()]):'');
  const Q=new Map(a.map(p=>[p,typeof sKey==='function'?sKey(K.get(p),mk):K.get(p)]));
  const R=new Map(a.map((p,i)=>[p,atOf(p)||(typeof cRank==='function'?cRank(p,i,n):n-i)]));
  const id=p=>String((p&&(p.id||(p.p&&p.p.id)||p.k))||'');
  const cmp=typeof cmpS==='function'?cmpS:(x,y)=>x<y?-1:x>y?1:0;
  return [...a].sort((x,y)=>cmp(Q.get(y),Q.get(x))||R.get(y)-R.get(x)||cmp(id(y),id(x)));
}
function pendingReview(){
  const r=new Set(jget('finanzas-inbox-rejected',[]));
  const h=typeof inbHave==='function'?inbHave():new Set();
  const hid=handled(),seen=new Set(),purchases=[],notices=[];
  (typeof INBOX!=='undefined'&&Array.isArray(INBOX)?INBOX:[]).forEach(x=>{
    if(!x||!x.id||seen.has(x.id)||hid.has(x.id))return;
    if(x.kind==='settle'){seen.add(x.id);notices.push(x);return}
    if(x.kind==='bills')return;
    if(r.has(x.id)||h.has(x.id))return;
    seen.add(x.id);purchases.push(x);
  });
  return {purchases,notices,n:purchases.length+notices.length};
}
function cardLabel(p){
  if(!p.purchases.length&&p.notices.length)return tt('🧾 Avisos de pago por revisar ({0})',p.n);
  if(p.purchases.length&&p.notices.length)return tt('🧾 Por revisar ({0})',p.n);
  return tt('🧾 Compras por revisar ({0})',p.n);
}
function listTitle(p){
  if(!p.purchases.length&&p.notices.length)return tt('📥 Avisos de pago por revisar ({0})',p.n);
  if(p.purchases.length&&p.notices.length)return tt('📥 Por revisar ({0})',p.n);
  return tt('📥 Compras por revisar ({0})',p.n);
}
function remLabel(p){
  if(!p.purchases.length&&p.notices.length)return p.n===1?tt('📥 1 aviso de pago por revisar'):tt('📥 {0} avisos de pago por revisar',p.n);
  if(p.purchases.length&&p.notices.length)return tt('📥 {0} por revisar',p.n);
  return p.n===1?T('📥 1 compra por revisar'):T('📥 {0} compras por revisar',p.n);
}
function fp(p){p=p||pendingReview();return p.n+'|'+(p.purchases||[]).map(x=>x.id).join(',')+'|'+(p.notices||[]).map(x=>x.id).join(',')}
function stripHandled(){if(typeof INBOX==='undefined'||!Array.isArray(INBOX))return;const hid=handled();INBOX=INBOX.filter(x=>!(x&&hid.has(x.id)))}

if(typeof v165Entry==='function'||typeof window.v165Entry==='function'){
  window.v165Entry=function(id){const p=pendingReview(),n=p.n;
    let dup=false;try{dup=id==='v165hoy'&&n>0&&typeof remList==='function'&&remList().some(r=>r&&r.id==='inbox')}catch(e){}
    if(dup)return '';
    return `<div class="card" id="${id}" style="padding:10px 14px"><button class="lnk" id="${id}-rev" style="all:unset;cursor:pointer;display:block;width:100%;font-size:15px;font-weight:${n?700:400};${n?'color:#a16207':''}" onclick="inboxList()">${esc(cardLabel(p))}</button></div>`};
}
if(typeof todoCard==='function'){
  const prev=todoCard;todoCard=function(){const h=prev.apply(this,arguments);return h.replace(/<div class="card" id="v165hoy"[\s\S]*?<\/button><\/div><\/div>/,window.v165Entry('v165hoy'))};
}
if(typeof opsTodo==='function'){
  const prev=opsTodo;opsTodo=function(){const h=prev.apply(this,arguments),p=pendingReview(),n=p.n;
    const bs='display:inline-block;min-height:34px;padding:0 12px;font-size:14px;width:auto;margin:0;flex:0 0 auto';
    const row=`<div id="v165ops" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #eef2f6"><span style="flex:1 1 auto;min-width:0;font-weight:${n?700:400}${n?';color:#a16207':''}">${esc(cardLabel(p))}</span>${n?`<button type="button" class="pay" id="v165ops-rev" style="${bs}" onclick="inboxList()">${esc(tt('Revisar'))}</button>`:''}</div>`;
    return h.replace(/<div id="v165ops"[\s\S]*?<\/div>/,row)};
}
if(typeof remList==='function'){
  const prev=remList;remList=function(){const R=prev.apply(this,arguments),p=pendingReview();
    return R.filter(r=>r.id!=='inbox'||p.n>0).map(r=>r.id==='inbox'?{...r,t:remLabel(p)}:r)};
}
if(typeof opsCompras==='function'){
  const prev=opsCompras;opsCompras=function(){const h=prev.apply(this,arguments),p=pendingReview(),n=p.n;
    const i=h.indexOf('id="inbbtn"'),btn=`<button id="inbbtn" style="width:100%;background:#ca8a04;margin:4px 0 8px" onclick="inboxList()">${esc(n&&!p.purchases.length&&p.notices.length?tt('📥 Avisos de pago por revisar ({0})',n):T('📥 Compras por revisar ({0})',n))}</button>`;
    if(i>=0){const a=h.lastIndexOf('<button',i),b=h.indexOf('</button>',i);if(a>=0&&b>=0)return h.slice(0,a)+(n?btn:'')+h.slice(b+9)}
    if(!n)return h;const j=h.indexOf('</h2>');if(j<0)return h;return h.slice(0,j+5)+btn+h.slice(j+5)};
}

function tidy180(){
  try{
    const d=typeof dlg==='function'&&dlg(),h=d&&d.open&&d.querySelector('h2');if(!h||!/📥/.test(h.textContent||''))return;
    const p=pendingReview();
    const want=listTitle(p);if(h.textContent!==want)h.textContent=want;
    const hid=handled(),rj=new Set(jget('finanzas-inbox-rejected',[])),hv=typeof inbHave==='function'?inbHave():new Set();
    d.querySelectorAll('.row').forEach(row=>{
      const b=row.querySelector('button[onclick*="inboxOpen("],button[onclick*="inboxSettle("]');
      const m=(b&&(b.getAttribute('onclick')||'').match(/inbox(?:Open|Settle)\('([^']+)'/)||[]);const id=m[1]||'';
      if(id&&(hid.has(id)||rj.has(id)||hv.has(id)))row.remove();
    });
    d.querySelectorAll('button[onclick*="inboxSettle("]').forEach(b=>{
      const row=b.closest('.row');if(!row||row.querySelector('.v180tag'))return;
      const n=row.querySelector('.n');if(n)n.insertAdjacentHTML('afterbegin',`<span class="v180tag" style="display:inline-block;font-size:11px;font-weight:700;color:#92400e;background:#fef3c7;border-radius:6px;padding:1px 6px;margin-right:6px">${esc(tt('aviso de pago'))}</span>`);
    });
    let e=document.getElementById('v166empty');
    if(!p.n){
      d.querySelectorAll('.muted').forEach(m=>{if(/Sin compras por revisar|Nothing to review/.test(m.textContent||''))m.style.display='none'});
      if(!e){e=document.createElement('div');e.id='v166empty';e.style.cssText='padding:14px 0;text-align:center;font-size:16px';e.textContent=tt('No hay compras pendientes');(document.getElementById('v161bar')||h).insertAdjacentElement('afterend',e)}
      else e.style.display='';
    }else if(e)e.remove();
  }catch(e){console.warn('v180 tidy',e)}
}
if(typeof inboxList==='function'){
  const prev=inboxList;inboxList=function(){stripHandled();prev.apply(this,arguments);tidy180()};
}
try{const d=typeof dlg==='function'&&dlg();if(d&&window.MutationObserver){let q=false;new MutationObserver(()=>{if(q)return;q=true;Promise.resolve().then(()=>{q=false;tidy180()})}).observe(d,{childList:true})}}catch(e){}

if(typeof inboxSettle==='function'){
  const prev=inboxSettle;inboxSettle=async function(id,ok){remember(id);const r=await prev.apply(this,arguments);
    try{if(typeof tab!=='undefined'&&(tab==='ini'||tab==='mov'))render()}catch(e){}return r};
}
window.v180Dismiss=function(id){remember(id);stripHandled();try{if(typeof inboxList==='function')inboxList()}catch(e){}try{if(typeof tab!=='undefined'&&(tab==='ini'||tab==='mov'))render()}catch(e){}};

if(typeof inboxLoad==='function'){
  const prev=inboxLoad;inboxLoad=async function(){
    const before=fp();
    const r=await prev.apply(this,arguments);
    stripHandled();
    try{
      const after=fp();
      const d=typeof dlg==='function'&&dlg(),open=d&&d.open&&/📥/.test((d.querySelector('h2')||{}).textContent||'');
      if(open)tidy180();
      else if(after!==before&&typeof tab!=='undefined'&&(tab==='ini'||tab==='mov')&&!(d&&d.open)&&typeof render==='function')render();
    }catch(e){}
    return r;
  };
}

if(typeof hList==='function'){
  const prev=hList;hList=function(){const L=prev.apply(this,arguments);try{return sortByDate(L,o=>o.p&&o.p.date,typeof S!=='undefined'&&S&&S.cur)}catch(e){return L}};
}
if(typeof osSearch==='function'){
  const prev=osSearch;osSearch=function(q){const L=prev.apply(this,arguments);try{return sortByDate(L,x=>x.d||x.date,typeof S!=='undefined'&&S&&S.cur)}catch(e){return L}};
}
if(typeof drawP==='function'){
  const prev=drawP;drawP=function(){const r=prev.apply(this,arguments);
    try{const box=typeof dlg==='function'&&dlg();const el=box&&box.querySelector('input[type=date]');
      if(el&&typeof D!=='undefined'&&D){if(!el.id)el.id='pdate';const sync=()=>{D.date=el.value};el.addEventListener('input',sync);el.addEventListener('change',sync)}}catch(e){}
    return r};
}
if(typeof saveP==='function'){
  const prev=saveP;saveP=function(){
    try{const box=typeof dlg==='function'&&dlg();const el=(document.getElementById('pdate'))||(box&&box.querySelector('input[type=date]'));
      if(el&&el.value&&typeof D!=='undefined'&&D)D.date=el.value;
      if(typeof D!=='undefined'&&D&&D.date&&typeof dKey==='function'){const k=dKey(D.date);if(/^\d{4}-\d{2}-\d{2}$/.test(k))D.date=k}}catch(e){}
    return prev.apply(this,arguments);
  };
}
if(typeof opsCred==='function'){
  const prev=opsCred;
  const lines=(name,id)=>{
    const meth='card:'+name,m=typeof M==='function'?M():null,out=[];if(!m)return [];
    (m.personal||[]).forEach(x=>{if(x.method===meth)out.push({kind:'cargo',date:x.date,label:x.desc||DN(x.cat)||T('Cargo'),amt:-r2(+x.amount||0),id:x.id,at:x.at})});
    (m.purchases||[]).forEach(p=>{if(p.method===meth)out.push({kind:'cargo',date:p.date,label:DN(p.store)||T('Compra'),amt:-r2(+p.total||0),id:p.id,at:p.at})});
    (m.events||[]).forEach(e=>{
      if(e.type==='cardpay'&&(e.cardId===id||e.card===name||(e.desc||'')==='Pago '+name||String(e.desc||'').indexOf(name)>=0))
        out.push({kind:'pago',date:e.date,label:e.desc||T('Pago'),amt:r2(+e.amount||0),id:e.id,at:e.at});
      if(e.type==='cardref'&&(e.cardName===name||e.card===name))
        out.push({kind:'devolucion',date:e.date,label:T('Devolución')+(e.store?' · '+e.store:''),amt:r2(+e.amount||0),id:e.id,at:e.at});
      if(e.type==='adjust'&&e.lineKind==='cards'&&e.lineName===name)
        out.push({kind:'ajuste',date:e.date,label:T('Ajuste de saldo')+(e.note?' · '+e.note:''),amt:-r2(+e.diff||0),id:e.id,at:e.at});
      if(e.type==='income'&&e.method===meth)
        out.push({kind:'devolucion',date:e.date,label:DN(e.concept)||T('Ingreso'),amt:r2(+e.amount||0),id:e.id,at:e.at});
    });
    return sortByDate(out);
  };
  opsCred=function(){
    const h=prev.apply(this,arguments);
    try{
      const t=document.createElement('template');t.innerHTML=h;
      (M().cards||[]).forEach((c,i)=>{
        const box=t.content.querySelector('#cardflows-'+(c.id||i));if(!box||!c)return;
        const L=lines(c.name,c.id);if(!L.length)return;
        box.innerHTML=L.map(x=>{
          const tag=x.kind==='cargo'?T('Cargo'):x.kind==='pago'?T('Pago'):x.kind==='devolucion'?T('Devolución'):(x.kind==='ajuste'?T('Ajuste de saldo'):'');
          const pos=+x.amt>=0;
          return `<div class="row"><span class="n">${esc(x.label)}<div class="muted">${typeof fdate==='function'?fdate(x.date):x.date}${tag?' · '+esc(tag):''}</div></span><b class="${pos?'pos':''}">${pos?'+':'−'}${f(Math.abs(+x.amt||0))}</b></div>`;
        }).join('');
      });
      const wrap=document.createElement('div');wrap.appendChild(t.content);return wrap.innerHTML;
    }catch(e){return h}
  };
}

window.v180Pending=pendingReview;
window._v180={pendingReview,sortByDate,tidy:tidy180,fp,handled,remember,stripHandled};
})();
