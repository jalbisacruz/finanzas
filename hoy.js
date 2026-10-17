// v78 (plan v78, fases 1 y 2): botón + con menú (Compra manual / Cargar recibo / Ingreso), Hoy sin barra de escanear,
// cuadro "Mi balance" (cerrado por defecto), Plan del mes en 5 líneas iguales, "Por hacer" como línea informativa.
// Solo interfaz: no cambia datos ni cálculos (usa calc() y planNums()).
Object.assign(EN,{"Nuevo":"New","🧾 Compra manual":"🧾 Manual purchase","📷 Cargar recibo":"📷 Upload receipt","➕ Ingreso":"➕ Income","Solo mía":"Just mine","Compartida (Tony/Carlos)":"Shared (Tony/Carlos)",
 "Gasto tuyo: tienda o descripción, monto y categoría.":"Your own expense: store or description, amount and category.","Foto, captura o PDF; la app llena la compra.":"Photo, screenshot or PDF; the app fills in the purchase.","Cheque, propinas, otros ingresos.":"Paycheck, tips, other income.",
 "⚖️ Mi balance":"⚖️ My balance","💰 A mi favor":"💰 In my favor","💳 Lo que debo":"💳 What I owe","Detalles":"Details","Cuentas de Tony":"Tony's bills","Cuentas de Carlos":"Carlos's bills",
 "Débito, efectivo y cheques":"Debit, cash and checks","Por cobrar Tony":"To collect from Tony","Por cobrar Carlos":"To collect from Carlos","Tarjetas de crédito":"Credit cards",
 "📌 {0} cosas por hacer":"📌 {0} things to do","📌 1 cosa por hacer":"📌 1 thing to do","📌 Por hacer: ✅ todo al día":"📌 To do: ✅ all caught up",
 "Presupuesto de gastos":"Spending budget","Sobrante real":"Real leftover","Disponible proyectado":"Projected available","Ingresos esperados":"Expected income","Sobrante planificado":"Planned leftover","Cerrar":"Close"});
// ---------- Fase 1: botón + ----------
function fabMenu(){const it=(id,t,sub,js)=>`<button id="${id}" class="sec" style="width:100%;text-align:left;min-height:60px;margin-top:8px;padding:10px 14px" onclick="${js}"><b style="font-size:17px">${T(t)}</b><div class="muted" style="font-size:13px;margin-top:2px">${T(sub)}</div></button>`;
 dlg().innerHTML=`<h2>${T('Nuevo')}</h2>`+it('fabman','🧾 Compra manual','Gasto tuyo: tienda o descripción, monto y categoría.','quick()')+it('fabscan','📷 Cargar recibo','Foto, captura o PDF; la app llena la compra.','dlg().close();scanReceipt()')+it('fabinc','➕ Ingreso','Cheque, propinas, otros ingresos.','incDlg()')+
 `<div class="grid" style="margin-top:12px"><span></span><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button></div>`;if(!dlg().open)dlg().showModal()}
{const fb=document.getElementById('fab');if(fb){fb.onclick=fabMenu;fb.setAttribute('aria-label',T('Nuevo'));fb.title=T('Nuevo')}}
function openShared(){dlg().close();editP()}
// Compra manual = el gasto de siempre ("Solo mía"); "Compartida" abre la compra compartida. Sin pestañas Gasto/Ingreso (ya están en el +).
const _quickV78=quick;quick=function(){_quickV78();const d=dlg(),tg=d.querySelector('#tabg');if(tg)tg.parentElement.outerHTML=`<div class="chips" id="qkind" style="margin-bottom:10px"><button id="kmine" class="chip on">${T('Solo mía')}</button><button id="kshared" class="chip" onclick="openShared()">🛒 ${T('Compartida (Tony/Carlos)')}</button></div>`;
 const h=d.querySelector('h2');if(h)h.textContent=T('🧾 Compra manual');[...d.querySelectorAll('button')].filter(b=>/editP\(\)/.test(b.getAttribute('onclick')||'')).forEach(b=>b.remove())};
const _incDlgV78=incDlg;incDlg=function(){_incDlgV78();const tg=dlg().querySelector('#tabg');if(tg)tg.parentElement.remove()};
// ---------- Fase 2: Hoy ----------
let BAL_OPEN=false;
function balBox(){const c=calc(L()),cl=v=>v>=-0.004?'pos':'neg',ln=(l,v,b)=>`<div class="row"><span class="n">${b?`<b>${l}</b>`:l}</span>${b?`<b>${f(v)}</b>`:f(v)}</div>`,sub=(l,v)=>`<div class="row bsub"><span class="n">${l}</span><span>${f(v)}</span></div>`;
 const tonyNet=r2(c.bills-c.xfer),carlosOw=r2(c.joeOwesCarlos||0);
 return `<div class="card" id="balcard"><div class="row" style="border:0;padding-top:0"><span class="n" style="font-weight:700;font-size:17px">${T('⚖️ Mi balance')}</span><b id="balv" class="${cl(c.bal)}" style="font-size:20px">${f(c.bal)}</b></div>
 ${BAL_OPEN?'':ln(T('💰 A mi favor'),c.money)+ln(T('💳 Lo que debo'),c.debt)}
 <button class="sec" id="baltog" aria-expanded="${BAL_OPEN}" style="width:100%;margin-top:8px;min-height:40px" onclick="BAL_OPEN=!BAL_OPEN;render()">${BAL_OPEN?'▴':'▾'} ${T('Detalles')}</button>
 ${BAL_OPEN?`<div id="baldet" style="margin-top:6px">${ln(T('💰 A mi favor'),c.money,1)}${sub(T('Débito, efectivo y cheques'),c.inc)}${sub(T('Por cobrar Tony'),c.tony)}${sub(T('Por cobrar Carlos'),c.carlosDue)}
  ${ln(T('💳 Lo que debo'),c.debt,1)}${sub(T('Tarjetas de crédito'),c.credit)}${sub(T('Cuentas de Tony'),tonyNet)}${carlosOw>0.004?sub(T('Cuentas de Carlos'),carlosOw):''}</div>`:''}</div>`}
const _heroV78=hero;hero=function(){return _heroV78()+balBox()};
// "Por hacer" sale de Hoy (irá a Operaciones en la fase 3). Mientras tanto la línea abre el mismo cuadro en una ventana.
const todoFull=todoCard;
const todoN=()=>(todoFull().match(/class="row"/g)||[]).length;
function todoOpen(){dlg().innerHTML=todoFull().replace('class="card"','class="card" style="box-shadow:none;padding:0"')+`<div class="grid" style="margin-top:12px"><span></span><button class="sec" onclick="dlg().close()">${T('Cerrar')}</button></div>`;if(!dlg().open)dlg().showModal()}
todoCard=function(){const n=todoN();return `<div class="card" id="todoline" style="padding:10px 14px"><button class="lnk" id="todobtn" style="all:unset;cursor:pointer;display:flex;justify-content:space-between;width:100%;font-size:15px;min-height:28px;align-items:center" onclick="todoOpen()"><span>${n?T(n===1?'📌 1 cosa por hacer':'📌 {0} cosas por hacer',n):T('📌 Por hacer: ✅ todo al día')}</span><span aria-hidden="true">›</span></button></div>`};
// Plan del mes: 5 líneas al mismo nivel, negativos en rojo, sin explicaciones
function planV78(){const P=planNums(),m=L(),k=keys().at(-1),c=calc(m),cl=v=>v>=-0.004?'':'neg',est=!!pcAmtPend(),tg=est?estTag():'';
 const disp=sum(m.income,x=>x.amount),pc=pendingCheck(),proj=r2(disp+(pc?pc.amount:0)-c.tonyDue-sum(prevPend(),p=>p.c.tonyDue)-c.credit);
 const ln=(id,l,v,ap)=>`<div class="row pl" id="${id}"><span class="n">${T(l)}</span><b class="${cl(v)}">${ap?'~':''}${f(v)}</b></div>`;
 const body=P.ent.length?ln('pl-inc','Ingresos esperados',P.inc,P.n)+ln('pl-bud','Presupuesto de gastos',P.bud)+ln('pl-plan','Sobrante planificado',P.plan,P.n)+ln('pl-real','Sobrante real',P.real)
  :`<div class="muted" id="planhint" style="margin:0 0 6px">🎯 ${T('Define un presupuesto para ver tu plan del mes.')} <a href="#" onclick="tab='cfg';render();setTimeout(()=>document.getElementById('budcfg')?.scrollIntoView(),50);return false">${T('Configuración › Categorías')}</a></div>`;
 return `<div class="card" id="plancard"${est?' data-est="1"':''}><h2>📋 ${T('Plan del mes')}<span class="muted" style="font-size:13px">${lbl(k)}</span></h2>${body}${ln('pl-proj','Disponible proyectado',proj).replace('</span><b',tg+'</span><b')}</div>`}
planV2=function(){return withEst(planV78)};
// estilo
document.head.insertAdjacentHTML('beforeend','<style>#balcard .bsub{padding:3px 0 3px 18px;border:0;font-size:14px;color:#334155}#plancard .row.pl{font-size:16px;padding:7px 0}#plancard .row.pl b{font-size:16px}#fab{font-weight:300}</style>');
