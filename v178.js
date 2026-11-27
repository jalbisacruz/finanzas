// v178 (Joe): Mi balance neto con Tony, igual que «Reparto de cuentas».
// Antes Mi balance mostraba en bruto: «Por cobrar Tony» = parte de Tony en compras que pagó Joe (c.tony) y
// «Cuentas de Tony» = cuentas − ya transferido. Pero el Pendiente del reparto (c.tonyDue) YA resta esa parte de
// compras, así que Joe le debe a Tony solo el neto y Tony no le debe nada. Ahora:
//   neto = cuentas − parte de Tony en compras − ya transferido   (= toTony − xfer)
//   «Cuentas de Tony» = máx(0, neto)  (= Pendiente del reparto)   ·   «Por cobrar Tony» = máx(0, −neto) (solo si Tony debe de verdad)
// El balance total no cambia; solo A mi favor / Lo que debo y sus líneas. Igual en el PDF (Mis finanzas).
(function(){
if(typeof calc!=='function')return;
if(typeof EN==='object'&&EN)Object.assign(EN,{
 "= Pendiente del reparto (ya resta {0} de compras que pagaste por Tony)":"= Pending in bill split (already subtracts {0} of purchases you paid for Tony)",
 "Cuentas de Tony (pendiente)":"Tony's bills (pending)"});
const rr=x=>Math.round((+x||0)*100)/100;
const _c=calc;calc=function(m){const r=_c.apply(this,arguments);
 if(!r||typeof r!=='object'||!isFinite(+r.bills)||!isFinite(+r.tony))return r;
 const toT=isFinite(+r.toTony)?+r.toTony:rr(r.bills-r.tony),xf=+r.xfer||0,n=rr(toT-xf);
 const owe=Math.max(0,n),recv=Math.max(0,rr(-n));
 const money=rr((+r.money||0)-(+r.tony||0)+recv),debt=rr((+r.debt||0)-rr((+r.bills||0)-xf)+owe);
 return {...r,tonyGross:r.tony,tonyNet:n,tonyOwe:owe,tonyRecv:recv,money,debt,bal:rr(money-debt)}};
// --- Hoy › Mi balance ---
function rowAt(h,label){const k=`<div class="row bsub"><span class="n">${label}</span>`,i=h.indexOf(k);if(i<0)return null;const j=h.indexOf('</div>',i+k.length);return j<0?null:[i,j+6]}
if(typeof balBox==='function'){const _b=balBox;balBox=function(){let h=_b.apply(this,arguments);if(!h||!h.includes('id="baldet"'))return h;
  const c=calc(L()),sub=(l,v,x)=>`<div class="row bsub" id="${x}"><span class="n">${l}</span><span>${f(v)}</span></div>`;
  let p=rowAt(h,T('Por cobrar Tony'));if(p)h=h.slice(0,p[0])+(c.tonyRecv>0.004?sub(T('Por cobrar Tony'),c.tonyRecv,'baltrecv'):'')+h.slice(p[1]);
  p=rowAt(h,T('Cuentas de Tony'));if(p){const note=c.tonyGross>0.004?`<div class="row bsub" style="border:0;padding-top:0"><span class="n muted" style="font-size:12px">${T('= Pendiente del reparto (ya resta {0} de compras que pagaste por Tony)',f(c.tonyGross))}</span></div>`:'';
    h=h.slice(0,p[0])+sub(T('Cuentas de Tony'),c.tonyOwe,'baltowe')+note+h.slice(p[1])}
  return h}}
// --- PDF «Mis finanzas» (resumen de Joe y resumen mensual) ---
if(typeof pdfMine==='function'){const _pm=pdfMine;pdfMine=function(D2,k){const c=calc(S.months[k]||L()),row=D2.row,seen={};
  D2.row=function(l,v,o){const once=x=>{if(seen[x]||l!==T(x))return false;seen[x]=1;return true};
    if(once('Por cobrar Tony'))return c.tonyRecv>0.004?row.call(this,l,f(c.tonyRecv),o):undefined;
    if(once('Cuentas de Tony'))return row.call(this,T('Cuentas de Tony (pendiente)'),f(c.tonyOwe),o);
    if(once('− Ya transferido a Tony'))return;                       // ya está restado en el pendiente
    return row.apply(this,arguments)};
  try{return _pm.apply(this,arguments)}finally{D2.row=row}}}
window._v178={rowAt,base:_c};
})();
