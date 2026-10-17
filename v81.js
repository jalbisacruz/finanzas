// v81: los reembolsos NO son ingreso. "↩️ Reembolso" y el cash back ("💳 Reembolso en efectivo") salen de los ingresos
// (Ingresos por concepto, ingresos del mes, Acumulado, Plan del mes, PDF). Los saldos no cambian: el dinero sigue entrando a la cuenta.
// Los cobros a Carlos ya no eran ingreso (tipo 'carlos', fuera de INC_KINDS). Sin migración de datos.
Object.assign(EN,{"Lo que te devuelven Carlos o Tony y el cash back de tus tarjetas. No es ingreso; el dinero sí entra a tu cuenta.":"What Carlos or Tony pay you back and your cards' cash back. It isn't income; the money does go into your account.",
 "Cash back":"Cash back","Total reembolsos":"Total reimbursements"});
// (1) el nombre vuelve a ser solo "↩️ Reembolso"
NM.es['↩️ Reembolso']='↩️ Reembolso';NM.en['↩️ Reembolso']='↩️ Reimbursement';
// (2) fuera de los ingresos
const isReembInc=c=>isReemb(c)||isCB(c);
const _earnedV81=earned,_spentV81=spent;window.earnedRaw=_earnedV81;window.spentRaw=_spentV81; // los de antes, para comparar en las pruebas
// Kalshi neto del mes: ingresos Kalshi − gastos Kalshi. Si es positivo cuenta como ingreso; si es negativo, como gasto (una sola vez).
function kalNet(m){return r2((_earnedV81(m).by[KAL]||0)-(_spentV81(m).by[KAL]||0))}
const totOf=by=>Object.values(by).reduce((a,b)=>a+b,0);
earned=function(m){const r=_earnedV81(m),by={};Object.entries(r.by).forEach(([k,v])=>{if(!isReembInc(k)&&k!==KAL)by[k]=v});const n=kalNet(m);if(n>0.004)by[KAL]=n;return {by,total:totOf(by)}};
spent=function(m){const r=_spentV81(m),by={...r.by};delete by[KAL];const n=kalNet(m);if(n<-0.004)by[KAL]=-n;return {by,total:totOf(by)}};
// Plan del mes: "Ingresos esperados" = solo cheques (recibidos + pendientes + estimados). Sobrante real usa el ingreso real (cheques, propinas, Kalshi neto > 0, otros).
const _planNumsV81=planNums;planNums=function(){const P=_planNumsV81(),cheq=r2(earned(L()).by['💼 Cheque']||0),inc=r2(P.inc-(P.rec-cheq));return {...P,inc,plan:r2(inc-P.bud),cheq}};
// (3) Reportes › Reembolsos: cobros a Carlos + "↩️ Reembolso" + cash back (con tarjeta), lo más nuevo primero
function reembList(m){return byNew([...(m.events||[])].reverse().filter(e=>e.type==='carlos'||(e.type==='income'&&isReembInc(e.concept))))}
function reembCard(){const m=M(),L2=reembList(m),t=sum(L2,e=>+e.amount||0);
 const nm=e=>e.type==='carlos'?'↩️ '+T('Cobrado a Carlos'):isCB(e.concept)?'💳 '+T('Cash back')+(e.card?' · '+esc(DN(e.card)):''):esc(DN(e.concept));
 return `<div class="card" id="reemcard"><h2>↩️ ${T('Reembolsos')}<span>${f(t)}</span></h2><div class="muted">${lbl(S.cur)} · ${T('Lo que te devuelven Carlos o Tony y el cash back de tus tarjetas. No es ingreso; el dinero sí entra a tu cuenta.')}</div>
 ${L2.map(e=>`<div class="row" data-id="${e.id}"><span class="n">${nm(e)}<div class="muted">${fdate(e.date)}${e.desc&&e.type!=='carlos'&&!isCB(e.concept)?' · '+esc(e.desc):''}</div></span>${f(+e.amount||0)}</div>`).join('')||`<div class="muted">${T('Sin reembolsos este mes.')}</div>`}
 ${L2.length?`<div class="tot"><span>${T('Total reembolsos')}</span><span id="reemtot">${f(t)}</span></div>`:''}</div>`}
