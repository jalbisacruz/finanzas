// v137 (Joe): el EarlyPay del ciclo solo descuenta el PRÓXIMO cheque de Walmart.
// Antes, epLastPaid() miraba solo S.wm.paid. Si el 5/11 se cobró por la tarjeta de confirmar
// o como ingreso «🏪 Walmart» (antes de v134) y no quedó en paid, el ciclo empezaba vacío
// y los dos EarlyPay del mes se restaban del siguiente cheque.
// Ahora el último cobro es el más reciente de: S.wm.paid, un ingreso Walmart, o el jueves de
// cobro que corresponda a esa fecha. EarlyPays en esa fecha o antes ya se usaron; solo los
// posteriores bajan el próximo. El acumulado del mes y Real cobrado siguen sumando todos.
function epIsWm(c){const t=String(c||'').replace(/^\S+\s/,'').trim().toLowerCase();return t==='walmart'||/(^|\s)walmart$/.test(t)}
function epWmPaydayOnOrBefore(d){if(!d)return null;const from=(S.wm&&S.wm.anchor)||WM_ANCHOR;if(d<from)return null;let p=from;while(addD(p,14)<=d)p=addD(p,14);return p}
function epCollectedPaydays(){const out=new Set(),P=(S.wm||{}).paid||{};
 Object.keys(P).forEach(d=>{if(+P[d]>0)out.add(d)});
 Object.keys(S.months||{}).forEach(k=>{(S.months[k].events||[]).forEach(e=>{
  if(e.type==='income'&&epIsWm(e.concept)&&+e.amount>0&&e.date){const pd=epWmPaydayOnOrBefore(e.date);if(pd)out.add(pd)}})});
 return out}
epLastPaid=function(){const ks=[...epCollectedPaydays()].sort();return ks.length?ks.at(-1):null};
{const _n=wmNext;wmNext=function(){const C=epCollectedPaydays();let d=(S.wm&&S.wm.anchor)||WM_ANCHOR;while(C.has(d))d=addD(d,14);return d}}
{const _p=planNums;planNums=function(){const P=_p(),C=epCollectedPaydays(),nx=wmNext();
 const left=(P.wmLines||[]).filter(x=>!C.has(x.d));
 if(left.length){const u=wmUnitNet(),g=nx?wmGross(nx):0;const full=g>0?g:(()=>{const p=(S.wm||{}).paid||{},ks=Object.keys(p).filter(x=>+p[x]>0).sort();return ks.length?r2(+p[ks.at(-1)]):0})();
  left[0]={d:left[0].d,a:u};for(let i=1;i<left.length;i++)left[i]={d:left[i].d,a:full>0?r2(full):left[i].a}}
 const wmEst=r2(sum(left,x=>x.a)),inc=r2((P.real||0)+(P.ywEst||0)+wmEst);
 return {...P,wmLines:left,wmEst,inc,plan:r2(inc-P.bud)}}}
