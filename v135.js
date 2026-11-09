// v135 (Joe): EarlyPay = ingresos con categoría OnePay (también EarlyPay / Pago adelantado).
// 1) Bajo el próximo cheque Walmart en la caja azul: línea «EarlyPay» con el total del mes.
// 2) Esos OnePay del ciclo (después del último Walmart cobrado, hasta el próximo) bajan el
//    próximo cheque (caja azul, plan, proyectado y depósito auto a las 4:00 AM). No baja de $0.
// 3) EarlyPay entra en «Real cobrado» (YoWash + Walmart cobrados + OnePay del mes).
//    Ingresos esperados = real + estimados restantes (sin sumar EarlyPay otra vez).
// 4) Si el próximo está Pendiente (sin monto), la caja sigue en Pendiente; el plan estima con
//    (último cobrado − EarlyPay del ciclo). Tras cobrar, los EarlyPay nuevos van al ciclo siguiente.
Object.assign(EN,{
 "EarlyPay":"EarlyPay",
 "del mes":"this month",
 "ya descontado del próximo cheque":"already taken from next check"
});
function epIs(c){const t=String(c||'').replace(/^\S+\s/,'').trim().toLowerCase().replace(/[\s_-]+/g,'');
 return t==='onepay'||t==='earlypay'||t==='pagoadelantado'||t==='pagodelantado'}
function epAll(){const out=[];Object.keys(S.months||{}).forEach(k=>{(S.months[k].events||[]).forEach(e=>{
  if(e.type==='income'&&epIs(e.concept)&&+e.amount>0)out.push(e)})});return out}
function epMonthSum(k){k=k||S.cur;return r2(sum(epAll().filter(e=>(e.date||'').startsWith(k)),e=>+e.amount))}
function epLastPaid(){const P=(S.wm||{}).paid||{},ks=Object.keys(P).filter(d=>+P[d]>0).sort();return ks.length?ks.at(-1):null}
function epCycleSum(pd){const nx=pd||wmNext(),last=epLastPaid();
 return r2(sum(epAll().filter(e=>{const d=e.date||'';return d&&(!last||d>last)&&(!nx||d<=nx)}),e=>+e.amount))}
const _wmAmtV135=wmAmt;
wmGross=function(pd){return _wmAmtV135(pd)};
wmAmt=function(pd){const g=_wmAmtV135(pd);if(!(g>0))return 0;const nx=wmNext();if(!nx||pd!==nx)return g;return r2(Math.max(0,g-epCycleSum(nx)))};
wmUnitNet=function(){const nx=wmNext(),g=nx?_wmAmtV135(nx):0;if(g>0)return wmAmt(nx);const last=(()=>{const p=(S.wm||{}).paid||{},ks=Object.keys(p).filter(k=>+p[k]>0).sort();return ks.length?r2(+p[ks.at(-1)]):0})();
 if(!(last>0))return 0;return r2(Math.max(0,last-epCycleSum(nx)))};
{const _b=chkBox;chkBox=function(){const h=_b();if(chkEdit)return h;const ep=epMonthSum(S.cur);if(!(ep>0.004))return h;
 const t=document.createElement('template');t.innerHTML=h;const w=t.content.querySelector('#wmhero');if(!w)return h;
 const cy=epCycleSum(),sub=cy>0.004?`${T('del mes')} · ${T('ya descontado del próximo cheque')}`:T('del mes');
 w.insertAdjacentHTML('afterend',`<div class="row" id="ephero" style="border:0;margin-top:2px;align-items:center;gap:8px"><span class="n" style="color:#cbd5e1;min-width:0;line-height:1.25"><span style="white-space:nowrap">⚡ ${T('EarlyPay')} <b style="color:#fbbf24;margin-left:4px">${f(ep)}</b></span><div style="font-size:12px;color:#94a3b8;margin-top:2px;white-space:nowrap">${sub}</div></span></div>`);
 return t.innerHTML}}
{const _p=planNums;planNums=function(){const P=_p(),k=P.k,ep=epMonthSum(k),nx=wmNext();
 const left=(P.wmLines||[]).slice();
 if(left.length){const u=wmUnitNet(),g=nx?_wmAmtV135(nx):0;const full=g>0?g:(()=>{const p=(S.wm||{}).paid||{},ks=Object.keys(p).filter(x=>+p[x]>0).sort();return ks.length?r2(+p[ks.at(-1)]):0})();
  left[0]={d:left[0].d,a:u};for(let i=1;i<left.length;i++)left[i]={d:left[i].d,a:full>0?r2(full):left[i].a}}
 const wmEst=r2(sum(left,x=>x.a)),real=r2((P.real||0)+ep),inc=r2(real+(P.ywEst||0)+wmEst);
 return {...P,wmLines:left,wmEst,real,ep,inc,plan:r2(inc-P.bud)}}
}
{const _pv=planV78;planV78=function(){const h=_pv(),ep=epMonthSum(S.cur);if(!(ep>0.004))return h;
 // EarlyPay como desglose bajo Real cobrado (ya incluido en ese total; no es ingreso extra).
 const row=`<div class="row pl-ib d" id="pl-ep"><span class="n">⚡ ${T('EarlyPay')}</span><span>${f(ep)}</span></div>`;
 if(/pl-ib real/.test(h))return h.replace(/(<div class="row pl-ib real">[\s\S]*?<\/div>)/,'$1'+row);
 return h.replace(/(<div id="pl-inc-break">)/,'$1'+`<div class="row pl-ib real"><span class="n">${T('Real cobrado')}</span><b>${f(planNums().real)}</b></div>`+row)}}
