// v155 (Joe): en la página de Tony, Carlos → Joe salía dos veces y abajo.
// Causa: tras v154 el snapshot ya trae esa línea y v.js la pinta en #vsum;
// después injectCjRow la volvía a añadir porque solo buscaba #r3cj.
// Cada pareja se muestra una sola vez, Carlos → Joe (o Joe → Carlos) va
// arriba, y se ve igual de fuerte que las demás. Igual en la app y en los PDF.
// También: Kalshi (📈) es a la vez ingreso y gasto. v81 los neteaba en el mes
// (si las ganancias superan las pérdidas, el gasto no entraba al presupuesto).
// Ahora cada movimiento se queda en su tipo: pérdidas/apuestas = gasto (y
// cuentan en el presupuesto); ganancias = ingreso. No se tocan los asientos.
(function(){
function isCj(x){
  if(!x)return false;
  const a=x.from||x.a,b=x.to||x.b;
  return (a==='Carlos'&&b==='Yo')||(a==='Yo'&&b==='Carlos');
}
function pairKey(x){
  const a=x.from||x.a||'',b=x.to||x.b||'';
  return [a,b].sort().join('|');
}
function fixTransfers(R){
  if(!R)return R;
  try{
    if(window._v154&&typeof _v154.ensureCj==='function')_v154.ensureCj(R);
  }catch(e){}
  const src=R.transfers||[];
  const seen=new Set(),cj=[],rest=[];
  src.forEach(x=>{
    if(!x)return;
    const k=pairKey(x);if(!k||k==='|')return;
    if(seen.has(k))return;seen.add(k);
    (isCj(x)?cj:rest).push(x);
  });
  R.transfers=cj.concat(rest);
  return R;
}
function isCjRow(el){
  const t=(el&&el.innerText||'').replace(/\s+/g,' ');
  return /Carlos.+(Joe|Yo)|Joe.+Carlos|(Carlos|Joe).+transfers.+(Joe|Carlos)/i.test(t);
}
function normalizeVsum(){
  const box=document.getElementById('vsum');if(!box)return;
  const rows=[...box.querySelectorAll('.row.r3x')];
  if(!rows.length)return;
  const seen=new Set(),uniq=[];
  rows.forEach(r=>{
    const k=(r.innerText||'').replace(/\s+/g,' ').trim().toLowerCase();
    if(!k||seen.has(k)){r.remove();return}
    seen.add(k);uniq.push(r);
  });
  const ordered=uniq.filter(isCjRow).concat(uniq.filter(r=>!isCjRow(r)));
  const anchor=box.querySelector('#vsumpend, .r3p');
  const h2=box.querySelector('h2');
  ordered.forEach(r=>{
    r.classList.add('r3x');
    if(anchor)box.insertBefore(r,anchor);
    else if(h2)h2.after(r);
    else box.appendChild(r);
  });
}

if(typeof r3Data==='function'){
  const _r=r3Data;
  r3Data=function(k,who){return fixTransfers(_r(k,who))};
}
if(typeof rep3PDF==='function'){
  const _pdf=rep3PDF;
  rep3PDF=function(R,extra){return _pdf(R?fixTransfers(R):R,extra)};
}
if(typeof r3CardHtml==='function'){
  const _h=r3CardHtml;
  r3CardHtml=function(R){return _h(fixTransfers(R))};
}
function hookR3Card(){
  if(typeof r3Card!=='function'||r3Card.__v155)return;
  const _c=r3Card;
  const w=function(R,N){return _c(fixTransfers(R||{}),N)};
  w.__v155=1;r3Card=w;window.r3Card=w;
}
function hookDraw(){
  hookR3Card();
  const wrap=name=>{
    const fn=window[name];if(typeof fn!=='function'||fn.__v155)return;
    const w=function(){const r=fn.apply(this,arguments);try{normalizeVsum()}catch(e){}return r};
    w.__v155=1;window[name]=w;
  };
  wrap('vBillsDraw');wrap('vRedraw');
}
hookDraw();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{hookDraw();try{normalizeVsum()}catch(e){}});
else setTimeout(()=>{hookDraw();try{normalizeVsum()}catch(e){}},0);

document.head.insertAdjacentHTML('beforeend','<style>#vsum .r3x span{font-weight:700}</style>');
// ---------- Kalshi: no netear; gasto e ingreso por separado ----------
const KAL_CAT=typeof KAL!=='undefined'?KAL:'📈 Kalshi';
function kalExp(m){
  return (typeof r2==='function'?r2:n=>Math.round((+n||0)*100)/100)(((m&&m.personal)||[]).reduce((s,x)=>s+((x.cat||'')===KAL_CAT?(+x.amount||0):0),0));
}
function kalInc(m){
  return (typeof r2==='function'?r2:n=>Math.round((+n||0)*100)/100)(((m&&m.events)||[]).reduce((s,e)=>s+(e&&e.type==='income'&&(e.concept||'')===KAL_CAT?(+e.amount||0):0),0));
}
function totOf155(by){return (typeof r2==='function'?r2:n=>Math.round((+n||0)*100)/100)(Object.values(by||{}).reduce((a,b)=>a+(+b||0),0))}
if(typeof spent==='function'){
  const _sp=spent;
  spent=function(m){
    const r=_sp(m),by={...((r&&r.by)||{})};
    const k=kalExp(m);
    if(k>0.004)by[KAL_CAT]=k;else delete by[KAL_CAT];
    return {by,total:totOf155(by)};
  };
}
if(typeof earned==='function'){
  const _er=earned;
  earned=function(m){
    const r=_er(m),by={...((r&&r.by)||{})};
    const k=kalInc(m);
    if(k>0.004)by[KAL_CAT]=k;else delete by[KAL_CAT];
    return {by,total:totOf155(by)};
  };
}

window._v155={fixTransfers,normalizeVsum,isCj,isCjRow,hookDraw,kalExp,kalInc};
})();
