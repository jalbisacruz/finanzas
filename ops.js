// v79 (plan v78, fases 3 y 4): Movimientos pasa a ser Operaciones (Por hacer arriba, Compras, Ingresos, Banco, Movimientos,
// Cuentas de Tony), se quita la pantalla Mes (su contenido ya está en Hoy, Operaciones y Reportes), barra nueva
// Hoy · Operaciones · Reportes · Configuración, Reportes con Resumen y Gastos del mes, Configuración con todo cerrado.
// Solo interfaz: no cambia datos ni cálculos (usa calc(), spent(), earned() y las funciones de siempre).
Object.assign(EN,{"Operaciones":"Operations","Banco":"Bank","Débitos":"Debits","Créditos":"Credits","Ingresos":"Income","Por hacer":"To do",
 "+ Nueva compra":"+ New purchase","🛒 Nueva compra":"🛒 New purchase","+ Registrar ingreso":"+ Record income","Este mes, sin reembolsos ni transferencias entre tus cuentas.":"This month, without reimbursements or transfers between your accounts.",
 "Ver todas las compras ({0}) ›":"See all purchases ({0}) ›","Ver todos los movimientos ({0}) ›":"See all transactions ({0}) ›","‹ Ver menos":"‹ Show less",
 "Resumen":"Summary","👁️ Ver PDF":"👁️ View PDF","PDF de Tony":"Tony's PDF","PDF de Carlos":"Carlos's PDF",
 "Gastos del mes: {0} (ya restados de tus saldos)":"Spending this month: {0} (already subtracted from your balances)",
 "No se resta otra vez del balance: cada gasto ya bajó tu débito o tu efectivo, o subió tu tarjeta.":"It isn't subtracted from your balance again: each expense already lowered your debit or cash, or raised your card.",
 "Efectivo":"Cash","✅ Transferido a Tony: {0}":"✅ Transferred to Tony: {0}","Transferir a Tony {0}":"Transfer to Tony {0}","Nada pendiente.":"Nothing pending.",
 "Sin compras este mes.":"No purchases this month.","Los nombres se cambian en Configuración › Tarjetas.":"Names are changed in Settings › Cards.","Los nombres se cambian en Configuración › Cuentas.":"Names are changed in Settings › Accounts."});
// ---------- barra de abajo ----------
{const nv=document.querySelector('nav');if(nv)nv.innerHTML=[['ini','🏠','Hoy'],['mov','📝','Operaciones'],['rep','📈','Reportes'],['cfg','⚙️','Configuración']].map(([t,i,l])=>`<button data-t="${t}" data-l="${l}"${t===tab?' class="on"':''}><b>${i}</b>${T(l)}</button>`).join('');
 document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;filt='';render();scrollTo(0,0)})}
const _navLblV79=navLbl;navLbl=function(){_navLblV79();const fb=document.getElementById('fab');if(fb){fb.setAttribute('aria-label',T('Nuevo'));fb.title=T('Nuevo')}};
// ---------- Por hacer (con el cierre del mes y los pendientes de meses anteriores) ----------
function opsGoTodo(){tab='mov';filt='';render();scrollTo(0,0)}
function cierreRows(k){const m=S.months[k];if(!m)return'';const c=calc(m),tp=c.tonyDue>0.005,cp=c.carlosDue>0.005,empty=m.bills.filter(b=>!(+b.amount));
 return `<div class="muted" style="margin:10px 0 2px;font-weight:700">${T('Cierre {0}',lbl(k))}</div>
 <div class="row"><span class="n">➡️ ${T('Transferir a Tony')}<div class="muted">${T('Cuentas {0} − por cobrar Tony {1}',f(c.bills),f(c.tony))}${c.xfer?T(' − ya transferido {0}',f(c.xfer)):''}</div></span><b>${tp?f(c.tonyDue):'✅ '+f(c.xfer)}</b>${tp?`<button class="pay" id="tonybtn" onclick="payDlg('tony','${k}')">${T('Transferir')}</button>`:''}</div>
 ${empty.length?`<div class="muted">⏳ ${T('Sin monto aún')}: ${empty.map(b=>esc(DN(b.name))).join(', ')}${tp?T(' — si transfieres ahora, se paga solo lo que tiene monto'):''}</div>`:''}
 <div class="row"><span class="n">💰 ${T('Carlos te debe')}${c.recv&&cp?`<div class="muted">${T('Ya pagó {0}',f(c.recv))}</div>`:''}</span><b>${cp?f(c.carlosDue):'✅ '+f(c.recv)}</b>${cp?`<button class="pay dep" id="carlosbtn" onclick="payDlg('carlos','${k}')">${T('Cobrar')}</button>`:''}</div>
 <div class="grid" style="margin-top:8px">${shBtn('tony',k).replace('📤','📤 Tony')}${shBtn('carlos',k).replace('📤','📤 Carlos')}</div>`}
function opsTodo(){const kL=keys().at(-1),c=calc(L()),rows=[];
 L().cards.filter(x=>+x.amount>0.004).map(x=>({x,i:dueInfo(x)})).filter(o=>o.i&&o.i.days<=5).sort((a,b)=>a.i.days-b.i.days).forEach(({x,i})=>rows.push(`<div class="row"><span class="n">🔔 ${dueTxt(x,i)}<div class="muted">${f(x.amount)}</div></span><button class="pay" onclick="S.cur=keys().at(-1);cardPayDlg('${x.id}')">${T('PAGAR')}</button></div>`));
 const pr=(who,kk,amt)=>`<div class="row"><span class="n">${who==='tony'?'➡️ '+T('Transferir a Tony'):'💰 '+T('Cobrar a Carlos')}<div class="muted">${lbl(kk)} · ${T('Pendientes de meses anteriores')}</div></span><b>${f(amt)}</b>${shBtn(who,kk)}<button class="pay${who==='carlos'?' dep':''}" onclick="payDlg('${who}','${kk}')">${who==='tony'?T('Transferir'):T('Cobrar')}</button></div>`;
 prevPend().forEach(({k:kk,c:cc})=>{if(kk===S.cur)return;if(cc.tonyDue>0.005)rows.push(pr('tony',kk,cc.tonyDue));if(cc.carlosDue>0.005)rows.push(pr('carlos',kk,cc.carlosDue))});
 const ks=[...new Set([S.cur,kL])].filter(k=>S.months[k]).sort().reverse();
 return `<div class="card" id="todocard"><h2>📌 ${T('Por hacer')}</h2>${rows.join('')}${ks.map(cierreRows).join('')}</div>`}
// ---------- Compras, Ingresos ----------
let OPS_ALLP=false,OPS_ALLM=false;const OPS_N=3;
function opsHtml(h){const t=document.createElement('template');t.innerHTML=h;return t.content}
function opsCompras(){const c=calc(M()),full=OPS_ALLP||hRange!=='cur';let n=0,list='';
 const fr=opsHtml(com()),head=fr.firstElementChild;n=fr.querySelectorAll('.hrow').length;
 if(head)head.remove();
 if(!full){fr.querySelectorAll('.hrow').forEach((e,i)=>{if(i>=OPS_N)e.remove()});fr.querySelectorAll(':scope>.muted').forEach(e=>e.remove())}
 const d=document.createElement('div');d.appendChild(fr);list=d.innerHTML;
 const chips=full&&head?(head.querySelector('#hrange')?.outerHTML||''):'',info=full&&head?(head.querySelector(':scope>.muted')?.outerHTML||''):'';
 const lnk=full?`<button class="lnk opsl" id="comless" onclick="OPS_ALLP=false;hRange='cur';render()">${T('‹ Ver menos')}</button>`:`<button class="lnk opsl" id="comall" onclick="OPS_ALLP=true;render()">${T('Ver todas las compras ({0}) ›',n)}</button>`;
 return `<div class="card" id="comcard"><h2>🛒 ${T('Compras')}<span class="muted" style="font-size:13px">Tony ${f(c.tony)} · Carlos ${f(c.carlos)}</span></h2>
 <button style="width:100%" onclick="editP()">${T('+ Nueva compra')}</button>${chips}${info}<div id="comlist">${list||(full?'':`<div class="muted" style="margin-top:8px">${T('Sin compras este mes.')}</div>`)}</div>${lnk}</div>`}
function opsIngresos(){const er=earned(M());return `<div class="card" id="opinc"><h2>💵 ${T('Ingresos')}<span class="pos">${f(er.total)}</span></h2>
 <button style="width:100%" id="opincb" onclick="incDlg()">${T('+ Registrar ingreso')}</button><div class="muted" style="margin-top:6px">${lbl(S.cur)} · ${T('Este mes, sin reembolsos ni transferencias entre tus cuentas.')}</div></div>`}
// ---------- Banco ----------
function opsDeb(){const m=M(),L2=depChecks(),fr=opsHtml(balCard('income')),cd=fr.firstElementChild;
 cd.id='bal-income';cd.classList.add('defcol');cd.querySelector('h2').innerHTML=`💵 ${T('Débitos')}<span>${f(sum(m.income,x=>x.amount))}</span>`;
 if(!m.income.some(x=>x!==debE(m))){const r=document.createElement('div');r.className='row';r.id='cash0';r.innerHTML=`<span class="n">${T('Efectivo')}</span><span class="amt ro" style="min-width:84px;text-align:right;font-weight:600">${f(0)}</span>`;const rs=cd.querySelectorAll(':scope>.row');(rs[rs.length-1]||cd.querySelector('h2')).after(r)}
 cd.insertAdjacentHTML('beforeend',`<div id="chkcard" style="margin-top:10px"><div class="muted" style="font-weight:700;display:flex;justify-content:space-between"><span>💼 ${T('Cheques depositados')}</span><span>${f(sum(L2,c=>c.amount))}</span></div>${L2.map(c=>`<div class="row"><span class="n">${wd(c.date)}<div class="muted">✅ ${T('Depositado')}${c.legacy?' · '+T('importado'):''}</div></span>${f(c.amount)}</div>`).join('')||'<div class="muted">'+T('Nada aquí.')+'</div>'}</div>`);
 return cd.outerHTML}
function opsCred(){const fr=opsHtml(balCard('cards')),cd=fr.firstElementChild;cd.classList.add('defcol');const sp=cd.querySelector('h2>span');cd.querySelector('h2').innerHTML=`💳 ${T('Créditos')}`+(sp?sp.outerHTML:'');return cd.outerHTML}
// ---------- Movimientos (3 últimos + Ver todos) ----------
function opsMov(){const full=OPS_ALLM||filt||movQ.trim(),fr=opsHtml(movList()),cd=fr.firstElementChild,rs=cd.querySelectorAll(':scope>.row'),n=rs.length;
 if(!full){const g=cd.querySelector(':scope>.grid');if(g)g.remove();rs.forEach((e,i)=>{if(i>=OPS_N)e.remove()})}
 cd.insertAdjacentHTML('beforeend',full?`<button class="lnk opsl" id="movless" onclick="OPS_ALLM=false;filt='';movQ='';render()">${T('‹ Ver menos')}</button>`:n>OPS_N?`<button class="lnk opsl" id="movall" onclick="OPS_ALLM=true;render()">${T('Ver todos los movimientos ({0}) ›',n)}</button>`:'');return cd.outerHTML}
// ---------- Cuentas de Tony del mes (cerrado; Comida con recibos + ajuste, Transferir a Tony) ----------
function opsBills(){const c=calc(M()),tp=c.tonyDue>0.005;return billsMonth().replace('<div class="card" id="billsm">','<div class="card defcol" id="billsm">').replace(/<\/div>$/,
 `<div style="margin-top:10px">${tp?`<button style="width:100%" id="billsxfer" onclick="payDlg('tony','${S.cur}')">${T('Transferir a Tony {0}',f(c.tonyDue))}</button>`:`<div class="muted" id="billsxfer">${T('✅ Transferido a Tony: {0}',f(c.xfer))}</div>`}</div></div>`)}
mov=function(){return opsTodo()+opsCompras()+opsIngresos()+`<div class="muted opsh">🏦 ${T('Banco')}</div>`+opsDeb()+opsCred()+opsMov()+opsBills()};
// el título de la ventana de compra nueva: "Compra", no "Compra compartida"
const _editPV79=editP;editP=function(id){const r=_editPV79.apply(this,arguments);if(!id){const h=dlg().querySelector('h2');if(h&&h.textContent.trim()===T('Compra compartida'))h.textContent=T('🛒 Nueva compra')}return r};
// ---------- Reportes ----------
const _repV79=rep;rep=function(){let o=_repV79().replace(/<div style="display:flex;justify-content:flex-end;margin:0 2px 8px"><button class="sec" id="pdfbtn"[\s\S]*?<\/div>(?=<div class="card" id="gpcard">)/,'');
 o=o.replace('<div class="card" id="gpcard">','<div class="card defcol" id="gpcard">');
 const b=(id,t,js)=>`<button class="sec rlink" id="${id}" onclick="${js}">${T(t)}</button>`;
 return `<div class="card" id="rescard"><h2>📄 ${T('Resumen')}<span class="muted" style="font-size:13px">${lbl(S.cur)}</span></h2><div class="rlinks">${b('pdfbtn','👁️ Ver PDF','pdfMes()')}${b('pdfdl','⬇️ Descargar PDF',"pdfDl('mes')")}${b('pdft','PDF de Tony',"pdfDl('tony',S.cur)")}${b('pdfc','PDF de Carlos',"pdfDl('carlos',S.cur)")}</div></div>
 <div class="card" id="gastocard"><div style="font-size:16px">${T('Gastos del mes: {0} (ya restados de tus saldos)',`<b>${f(spent(M()).total)}</b>`)}</div><div class="muted" style="margin-top:4px">${T('No se resta otra vez del balance: cada gasto ya bajó tu débito o tu efectivo, o subió tu tarjeta.')}</div></div>`+o};
// ---------- Hoy: la línea de Por hacer lleva a Operaciones ----------
{const _tc=todoCard;todoCard=function(){return _tc().replace('onclick="todoOpen()"','onclick="opsGoTodo()"')}}
// ---------- render: sin pantalla Mes; Configuración con todo cerrado ----------
const _renderV79=render;render=function(){if(tab==='res')tab='mov';const r=_renderV79.apply(this,arguments);
 if(tab==='cfg')document.querySelectorAll('#v>.card').forEach(c=>{if(c.querySelector(':scope>h2'))c.classList.add('defcol')});return r};
document.head.insertAdjacentHTML('beforeend',`<style>.opsh{margin:16px 4px 6px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.lnk.opsl{display:block;width:100%;margin-top:8px;min-height:40px;background:none;color:#2563eb;font-weight:600;text-align:center}
#comlist .card.p{margin:8px 0 0;box-shadow:none}
.rlinks{display:grid;grid-template-columns:1fr 1fr;gap:8px}.rlink{min-height:44px;font-size:15px;padding:6px 8px}</style>`);
