// v154 (Joe): al abrir la app salía «No se pudo actualizar el enlace».
// Causa: el snapshot de Carlos (v152) incluye el desglose del PDF con
// arreglos dentro de arreglos; Firestore los rechaza. El de Tony sí se
// escribía, por eso su página ya mostraba las cifras nuevas. No hace falta
// cambiar las reglas. Se limpia el documento (sin undefined ni arreglos
// anidados), se reintenta en silencio y solo se avisa si sigue fallando.
// En «Quién transfiere a quién» (app, página de Tony y PDF) siempre sale
// Carlos → Joe (o Joe → Carlos) por las compras entre ellos.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "No se pudo actualizar el enlace. Revisa la conexión e inténtalo de nuevo.":
  "Couldn't update the link. Check your connection and try again."
});

function rr(n){n=+n||0;return Math.round(n*100)/100}
function hasNestedArray(v){
  if(!v||typeof v!=='object')return false;
  if(Array.isArray(v))return v.some(x=>Array.isArray(x)||hasNestedArray(x));
  for(const k of Object.keys(v)){if(hasNestedArray(v[k]))return true}
  return false;
}
function fireSafe(v){
  if(v===undefined||typeof v==='function')return undefined;
  if(typeof v==='number')return isFinite(v)?v:null;
  if(v===null||typeof v!=='object')return v;
  if(Array.isArray(v)){
    const out=[];
    for(let i=0;i<v.length;i++){
      const item=v[i];
      if(item===undefined)continue;
      if(Array.isArray(item)){
        const inner=fireSafe(item);
        out.push({c:Array.isArray(inner)?inner:[]});
      }else{
        const x=fireSafe(item);
        if(x!==undefined)out.push(x);
      }
    }
    return out;
  }
  const o={};
  Object.keys(v).forEach(k=>{
    const x=fireSafe(v[k]);
    if(x!==undefined)o[k]=x;
  });
  return o;
}
function cells(row){
  if(!row)return [];
  if(Array.isArray(row))return row;
  if(Array.isArray(row.c))return row.c;
  return Object.keys(row).sort((a,b)=>Number(a)-Number(b)).map(k=>row[k]);
}
function normBreakDown(B){
  if(!B||!Array.isArray(B.sections))return B;
  return Object.assign({},B,{sections:B.sections.map(sec=>{
    if(!sec)return sec;
    const o=Object.assign({},sec);
    if(Array.isArray(o.rows))o.rows=o.rows.map(cells);
    if(o.tot&&!Array.isArray(o.tot)&&Array.isArray(o.tot.c))o.tot=o.tot.c;
    return o;
  })});
}

function cjAmount(R){
  if(!R)return 0;
  const tr=R.transfers||[];
  const hit=tr.find(x=>(x.from==='Carlos'&&x.to==='Yo')||(x.from==='Yo'&&x.to==='Carlos'));
  if(hit)return hit.from==='Carlos'?rr(+hit.amount||0):-rr(+hit.amount||0);
  const fl=R.carlosFlows;
  if(fl&&Math.abs(+fl.pendJoe||0)>0.004)return rr(+fl.pendJoe||0);
  const p=(R.pairs||[]).find(x=>(x.a==='Carlos'&&x.b==='Yo')||(x.a==='Yo'&&x.b==='Carlos'));
  if(p&&Math.abs(+p.pend||0)>0.004){
    return (p.a==='Carlos'&&p.b==='Yo')?rr(+p.pend||0):-rr(+p.pend||0);
  }
  return 0;
}
function ensureCj(R){
  if(!R)return R;
  const v=cjAmount(R);
  if(Math.abs(v)<0.005)return R;
  const from=v>0?'Carlos':'Yo',to=v>0?'Yo':'Carlos',amt=rr(Math.abs(v));
  R.transfers=R.transfers||[];
  if(!R.transfers.some(x=>(x.from==='Carlos'&&x.to==='Yo')||(x.from==='Yo'&&x.to==='Carlos'))){
    R.transfers.push({from,to,amount:amt});
    R.people=R.people||{};
    ['Yo','Tony','Carlos'].forEach(p=>{R.people[p]=R.people[p]||{pays:0,gets:0,part:0,bills:0}});
    if(R.people[from])R.people[from].pays=rr((+R.people[from].pays||0)+amt);
    if(R.people[to])R.people[to].gets=rr((+R.people[to].gets||0)+amt);
  }
  return R;
}

if(typeof r3Data==='function'){
  const _r=r3Data;
  r3Data=function(k,who){return ensureCj(_r(k,who))};
}

if(typeof rep3PDF==='function'){
  const _pdf=rep3PDF;
  rep3PDF=function(R,extra){
    if(R){R=ensureCj(R);if(R.breakDown)R=Object.assign({},R,{breakDown:normBreakDown(R.breakDown)})}
    return _pdf(R,extra);
  };
}

if(typeof r3CardHtml==='function'){
  const _h=r3CardHtml;
  r3CardHtml=function(R){return _h(ensureCj(R))};
}

function cjLabel(R,x){
  const N=p=>(R&&R.names&&R.names[p])||(p==='Yo'?'Joe':p);
  const fl=(s,...a)=>String(s||'').replace(/\{(\d)\}/g,(_,i)=>a[i]);
  const L=(window.R3L||{})[(R&&R.lang)==='en'?'en':'es']||{};
  return fl(L.x1||'{0} le transfiere a {1}',N(x.from),N(x.to));
}
function injectCjRow(){
  let R=null;
  try{
    const D=window.__DOC;if(!D||!D.months)return;
    const tabs=document.querySelectorAll('.tabs button');
    let i=0;tabs.forEach((b,n)=>{if(b.classList.contains('on'))i=n});
    const mo=D.months[i]||D.months[0];
    R=mo&&mo.r3?ensureCj(mo.r3):null;
  }catch(e){return}
  if(!R)return;
  const x=(R.transfers||[]).find(t=>(t.from==='Carlos'&&t.to==='Yo')||(t.from==='Yo'&&t.to==='Carlos'));
  if(!x)return;
  const box=document.getElementById('vsum');if(!box)return;
  if(box.querySelector('#r3cj'))return;
  const row=document.createElement('div');
  row.className='row r3x';row.id='r3cj';
  const f=typeof window.f==='function'?window.f:(n=>(n<-0.004?'-':'')+'$'+Math.abs(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));
  row.innerHTML='<span></span><b class="big"></b>';
  row.querySelector('span').textContent=cjLabel(R,x);
  row.querySelector('b').textContent=f(x.amount);
  const people=box.querySelector('.r3p');
  const pend=box.querySelector('#vsumpend');
  if(people)box.insertBefore(row,pend&&pend.parentNode===box?pend:people);
  else if(pend)box.insertBefore(row,pend);
  else box.append(row);
}

function hookTonyDraw(){
  const wrap=name=>{
    const fn=window[name];if(typeof fn!=='function'||fn.__v154)return;
    const w=function(){const r=fn.apply(this,arguments);try{injectCjRow()}catch(e){}return r};
    w.__v154=1;window[name]=w;
  };
  wrap('vBillsDraw');wrap('vRedraw');
}
hookTonyDraw();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{hookTonyDraw();try{injectCjRow()}catch(e){}});
else setTimeout(()=>{hookTonyDraw();try{injectCjRow()}catch(e){}},0);

// ---------- escritura del enlace: limpiar, reintentar, avisar solo si persiste ----------
const linkToast={n:0,t0:0};
function isLinkToast(m){return /No se pudo actualizar el enlace|Couldn't update the link/i.test(String(m||''))}
function shouldShowLinkToast(){
  return linkToast.n>=2 && (Date.now()-(linkToast.t0||0))>=2000;
}
function patchToast(){
  const _t=window.toast;if(typeof _t!=='function'||_t.__v154)return;
  const w=function(m){
    if(isLinkToast(m)){
      if(!shouldShowLinkToast())return;
      if(typeof T==='function')m=T('No se pudo actualizar el enlace. Revisa la conexión e inténtalo de nuevo.');
    }
    return _t.apply(this,arguments);
  };
  w.__v154=1;window.toast=w;
}
patchToast();
const _ti=setInterval(patchToast,250);
setTimeout(()=>clearInterval(_ti),20000);

function retryable(e){
  const s=String((e&&e.code)||'')+' '+String((e&&e.message)||e||'');
  return /auth|unauthor|unauthentic|permission-denied|permission_denied|unavailable|network|fetch|offline|deadline|aborted|app.?check|resource-exhausted|not-found/i.test(s);
}
function delay(ms){return new Promise(r=>setTimeout(r,ms))}
const inflight={};
function patchShareSet(){
  const _set=window.fbShareSet;if(typeof _set!=='function'||_set.__v154)return;
  const w=async function(t,d){
    const clean=fireSafe(d)||{};
    const run=async()=>{
      let last;
      for(let i=0;i<3;i++){
        if(i)await delay(400*i);
        if(!(window.fbUser&&fbUser())){last=last||new Error('no-auth');if(!retryable(last)&&i)break;continue}
        try{const r=await _set(t,clean);linkToast.n=0;linkToast.t0=0;return r}
        catch(e){last=e;if(!retryable(e))break}
      }
      linkToast.t0=linkToast.t0||Date.now();
      linkToast.n++;
      throw last||new Error('share-write');
    };
    const key=String(t||'');
    if(inflight[key])try{await inflight[key]}catch(e){}
    const p=run();inflight[key]=p;
    try{return await p}finally{if(inflight[key]===p)delete inflight[key]}
  };
  w.__v154=1;window.fbShareSet=w;
}
patchShareSet();
(function waitSet(){
  let n=0;const tick=()=>{n++;patchShareSet();patchToast();if(n<80&&!(window.fbShareSet&&window.fbShareSet.__v154))setTimeout(tick,200)};
  tick();
})();

window._v154={fireSafe,hasNestedArray,ensureCj,cjAmount,normBreakDown,cells,patchShareSet,patchToast,linkToast,shouldShowLinkToast};
})();
