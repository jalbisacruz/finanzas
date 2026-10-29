// v114 (Joe): (1) alertas de presupuesto en una sola línea (detalle al tocar); (2) diseño más limpio: todas las secciones
// cerradas por defecto (título + un número), fila de atajos en cada pestaña; (3) 🏪 Walmart: estimado semanal los viernes,
// cobro cada 2 semanas en jueves (primer cheque 5 nov 2026); los jueves sin cobrar se suman a "Ingresos esperados".
Object.assign(EN,{"{0} presupuestos al límite":"{0} budgets near limit","1 presupuesto al límite":"1 budget near limit","Presupuestos":"Budgets","excedido":"over",
 "Atajos":"Shortcuts","Compra":"Purchase","Recibo":"Receipt","Ingreso":"Income","Cobro":"Collect","Cuadrar banco":"Bank check","Compartida":"Shared","Transferencia":"Transfer",
 "Mi resumen":"My summary","Envíos":"Sends","Respaldo":"Backup","Presupuesto":"Budget","Suscripciones":"Subscriptions","Categorías":"Categories",
 "🏪 Walmart":"🏪 Walmart","Semana Walmart":"Walmart week","Próximo cheque Walmart":"Next Walmart check","Estimado de la semana":"Week estimate",
 "Viernes de la semana trabajada":"Friday of the week worked","Semanas":"Weeks","Cobro el {0}":"Paid on {0}","Llegó el cheque Walmart":"Walmart check arrived",
 "Monto que llegó":"Amount received","Pon el estimado de la semana":"Enter the week estimate","Sin semanas todavía.":"No weeks yet.","Cobrado":"Received",
 "pendiente":"pending","Walmart guardado":"Walmart saved","Cheque Walmart depositado":"Walmart check deposited","Borrar":"Delete","Walmart":"Walmart"});
// ---------- 1. alertas de presupuesto: una línea ----------
function v114Bud(){const by=budBy(L()).by;return Object.keys(S.budgets).map(c=>[c,bPct(by,c)]).filter(([,p])=>p!==null&&p>=80).sort((a,b)=>b[1]-a[1])}
budWarn=function(){const L2=v114Bud();if(!L2.length)return'';const over=L2.some(([,p])=>p>100),top=L2[0];
 return `<button id="budchip" class="budw" onclick="v114BudDlg()" style="display:flex;width:100%;align-items:center;gap:6px;min-height:36px;margin:0 0 10px;padding:6px 12px;border-radius:18px;font-size:14px;font-weight:600;text-align:left;${over?'background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5':'background:#fef3c7;color:#92400e;border:1px solid #fcd34d'}">
 ${over?'⛔':'⚠️'} <span style="flex:1">${L2.length>1?T('{0} presupuestos al límite',L2.length):T('1 presupuesto al límite')} · ${esc(DN(top[0]))} ${top[1]}%</span><span>›</span></button>`};
function v114BudDlg(){const by=budBy(L()).by;dlg().innerHTML=`<h2>🎯 ${T('Presupuestos')}</h2>`+v114Bud().map(([c,p])=>{const col=p>100?'#dc2626':'#f59e0b';
 return `<div class="row"><span class="n">${esc(DN(c))}<div style="height:6px;background:#e2e8f0;border-radius:3px;margin-top:4px"><div style="height:6px;width:${Math.min(p,100)}%;background:${col};border-radius:3px"></div></div><div class="muted">${f(by[c]||0)} / ${f(+S.budgets[c])}</div></span><b style="color:${col}">${p}%${p>100?' '+T('excedido'):''}</b></div>`}).join('')+
 `<div class="grid" style="margin-top:12px"><span></span><button class="sec" onclick="dlg().close()">${T('Cerrar')}</button></div>`;if(!dlg().open)dlg().showModal()}
// ---------- 3. Walmart ----------
const WM_ANCHOR='2026-11-05';
const v114wm=()=>{const w=S.wm||{};return {anchor:w.anchor,weeks:w.weeks||{},paid:w.paid||{}}};
const wmW=()=>{S.wm=S.wm||{};S.wm.weeks=S.wm.weeks||{};S.wm.paid=S.wm.paid||{};return S.wm};
const addD=(d,n)=>{const x=new Date(d+'T12:00');x.setDate(x.getDate()+n);return x.toLocaleDateString('en-CA')};
function wmPaydays(from,to){const out=[];let d=S.wm&&S.wm.anchor||WM_ANCHOR;while(d>from)d=addD(d,-14);while(d<from)d=addD(d,14);while(d<=to){out.push(d);d=addD(d,14)}return out}
// cada jueves de cobro paga los 2 viernes anteriores (−6 y −13 días). Viernes antes de la 1.ª semana = 0; futuros sin estimado = último estimado.
function wmAmt(pd){const w=v114wm().weeks,ks=Object.keys(w).sort();if(!ks.length)return 0;const last=+w[ks.at(-1)]||0;
 return r2([addD(pd,-6),addD(pd,-13)].reduce((a,fr)=>a+(fr in w?+w[fr]||0:fr<ks[0]?0:last),0))}
function wmPend(fromD,toD){const P=v114wm().paid;return wmPaydays(fromD,toD).filter(d=>!(d in P)).map(d=>({date:d,amount:wmAmt(d)})).filter(x=>x.amount>0)}
function wmNext(){const P=v114wm().paid,t=today();return wmPaydays(addD(t,-42),addD(t,28)).find(d=>!(d in P)&&wmAmt(d)>0)}
const _planNumsV114=planNums;planNums=function(){const P=_planNumsV114();if(!S.wm)return P;const k=P.k,L2=wmPend(k+'-01',k+'-31');
 const add=r2(sum(L2,x=>x.amount));if(!add)return P;const inc=r2(P.inc+add);return {...P,inc,plan:r2(inc-P.bud),n:P.n+L2.length,wm:add}};
const lastFri=()=>{const d=new Date(today()+'T12:00');while(d.getDay()!==5)d.setDate(d.getDate()-1);return d.toLocaleDateString('en-CA')};
function wmCard(){const w=v114wm(),nx=wmNext(),ks=Object.keys(w.weeks).sort().reverse(),due=nx&&nx<=today();
 return `<div class="card" id="wmcard"><h2>${T('🏪 Walmart')}<span>${nx?f(wmAmt(nx)):'—'}</span></h2>
 ${nx?`<div class="row"><span class="n">${T('Próximo cheque Walmart')}<div class="muted">${wd(nx)} · ${T('Semanas')}: ${fdate(addD(nx,-13))} + ${fdate(addD(nx,-6))}</div></span><b>~${f(wmAmt(nx))}</b></div>`:''}
 ${due?`<button id="wmgot" style="width:100%;margin-top:8px" onclick="wmGotDlg('${nx}')">✅ ${T('Llegó el cheque Walmart')}</button>`:''}
 <button id="wmweek" class="sec" style="width:100%;margin-top:8px" onclick="wmWeekDlg()">＋ ${T('Semana Walmart')}</button>
 ${ks.length?ks.slice(0,6).map(fr=>`<div class="row"><span class="n">${T('Viernes')} ${fdate(fr)}</span>${f(+w.weeks[fr]||0)}</div>`).join(''):`<div class="muted" style="margin-top:6px">${T('Sin semanas todavía.')}</div>`}</div>`}
EN["Viernes"]="Friday";
function wmWeekDlg(){const w=v114wm(),fr=lastFri();dlg().innerHTML=`<h2>${T('🏪 Walmart')}</h2>
 <label>${T('Estimado de la semana')}<input id="wma" type="number" inputmode="decimal" step="0.01" value="${w.weeks[fr]||''}" style="font-size:24px"></label>
 <label>${T('Viernes de la semana trabajada')}<input id="wmf" type="date" value="${fr}"></label>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="wmsave" onclick="wmWeekSave()">${T('Guardar')}</button></div>`;if(!dlg().open)dlg().showModal();setTimeout(()=>document.getElementById('wma')?.focus(),50)}
function wmWeekSave(){const a=r2(document.getElementById('wma').value),fr=document.getElementById('wmf').value;if(!(a>0)||!fr)return alert(T('Pon el estimado de la semana'));
 wmW().weeks[fr]=a;save();dlg().close();render();toast(T('Walmart guardado'))}
function wmGotDlg(pd){dlg().innerHTML=`<h2>${T('Llegó el cheque Walmart')}</h2><div class="muted">${wd(pd)}</div>
 <label>${T('Monto que llegó')}<input id="wmg" type="number" inputmode="decimal" step="0.01" value="${wmAmt(pd)}" style="font-size:24px"></label>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="wmgok" onclick="wmGotSave('${pd}')">${T('Depositar')}</button></div>`;if(!dlg().open)dlg().showModal()}
function wmGotSave(pd){const a=r2(document.getElementById('wmg').value);if(!(a>0))return alert(T('Pon un monto'));const c='🏪 Walmart';
 if(!S.incCats.includes(c))S.incCats.push(c);spend('deb',-a);S.months[monthFor(pd)].events.push({id:uid(),type:'income',date:pd,amount:a,concept:c,desc:'Walmart',method:'deb'});
 wmW().paid[pd]=a;save();dlg().close();render();toast(T('Cheque Walmart depositado'))}
{const _i=ini;ini=function(){const h=_i(),c=wmCard(),j=h.indexOf('<div class="card" id="plancard"');return j<0?h+c:h.slice(0,j)+c+h.slice(j)}}
// ---------- 2. diseño: atajos por pestaña + todo cerrado por defecto ----------
const v114go=t=>{const c=[...document.querySelectorAll('#v>.card')].find(x=>(x.dataset.sec||'').includes(t));if(c)goSec(c.id)};
const V114SC={ini:[['🧾','Compra','quick()'],['📷','Recibo','scanReceipt()'],['🏪','Walmart','wmWeekDlg()'],['💵','Cobro','cobDlg()'],['🏦','Cuadrar banco','rcDlg()']],
 mov:[['🧾','Compra','quick()'],['🛒','Compartida','editP()'],['➕','Ingreso','incDlg()'],['🔁','Transferencia','xferDlg()'],['💵','Cobro','cobDlg()']],
 rep:[['📄','Mi resumen',"pdfAbrir('mes')"],['📄','Tony',"pdfAbrir('tony')"],['📄','Carlos',"pdfAbrir('carlos')"],['🏦','Cuadrar banco','rcDlg()']],
 cfg:[['💾','Respaldo','exp()'],['🎯','Presupuesto',"v114go(T('Presupuesto'))"],['🔄','Suscripciones',"v114go(T('Suscripciones'))"],['🏷️','Categorías',"v114go(T('Categorías'))"]]};
function v114Row(){const L2=V114SC[tab];if(!L2)return'';return `<div id="scrow" role="toolbar" aria-label="${T('Atajos')}">${L2.map(([e,t,js],i)=>`<button class="scb" id="sc-${tab}-${i}" onclick="${js.replace(/"/g,'&quot;')}"><b>${e}</b><span>${T(t)}</span></button>`).join('')}</div>`}
function v114Nav(){const V114K='finanzas-v114col';if(!localStorage.getItem(V114K)){Object.keys(navCol).forEach(k=>delete navCol[k]);localStorage.setItem(NAV_COL,'{}');localStorage.setItem(V114K,'1')}
window.navCollapsibles=navCollapsibles=function(){document.querySelectorAll('#v>.card').forEach(c=>{const h=c.querySelector(':scope>h2'),t=c.dataset.sec;if(!h||!t||c.children.length<2)return;
 const k=tab+':'+c.id;c.dataset.ck=k;c.classList.add('colb');c.classList.toggle('col',k in navCol?!!navCol[k]:window.V114_LEGACY_OPEN?c.classList.contains('defcol'):true);
 if(!h.querySelector('.cv')){const s=document.createElement('i');s.className='cv';s.textContent='▾';s.setAttribute('aria-hidden','true');h.prepend(s)}
 if(!h.querySelector(':scope>span')){const b=c.querySelector('.big,.tot>span:last-child,.tot b');if(b&&b.textContent.trim().length<16){const s=document.createElement('span');s.className='v114n';s.textContent=b.textContent.trim();h.append(s)}}
 h.title=T('Plegar o desplegar');
 h.onclick=e=>{if(e.target.closest('button,input,select,a,label,textarea'))return;const on=!c.classList.contains('col');c.classList.toggle('col',on);navCol[k]=on?1:0;localStorage.setItem(NAV_COL,JSON.stringify(navCol))}})};
try{if(typeof unlocked!=='undefined'&&unlocked)render()}catch(e){}}
if(typeof navCol!=='undefined')v114Nav();else addEventListener('DOMContentLoaded',v114Nav);
{const _r=render;render=function(){const r=_r.apply(this,arguments);try{const v=document.getElementById('v');if(v&&!document.getElementById('scrow'))v.insertAdjacentHTML('afterbegin',v114Row());if(tab==='rep'&&!window.V114_LEGACY_OPEN)document.getElementById('rescard')?.remove()}catch(e){console.error(e)}return r}}
(function(){const st=document.createElement('style');st.textContent=`
#scrow{display:flex;gap:8px;overflow-x:auto;margin:0 0 12px;padding:2px 0 4px;scrollbar-width:none}#scrow::-webkit-scrollbar{display:none}
.scb{flex:none;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:74px;min-height:62px;padding:8px 6px;border-radius:16px;background:#fff;color:#0f172a;border:1px solid #e2e8f0;box-shadow:0 1px 3px #0f172a12;font-size:12px;font-weight:600}
.scb b{font-size:22px;line-height:1}
#v>.card{border-radius:18px;box-shadow:0 1px 4px #0f172a14;border:1px solid #eef2f6}
.card.colb.col{padding-top:14px;padding-bottom:14px}.card.colb>h2>span,.v114n{font-weight:800;font-size:18px;margin-left:auto}
body.locked #scrow{display:none}`;document.head.appendChild(st)})();
try{if(typeof unlocked!=='undefined'&&unlocked)render()}catch(e){}
