// v36: recordatorios de tarjetas, respaldo semanal, presupuestos, metas de ahorro, resumen del jueves
Object.assign(EN,{"🔔 {0} vence en {1} días · saldo {2}":"🔔 {0} due in {1} days · balance {2}","🔔 {0} vence mañana · saldo {1}":"🔔 {0} due tomorrow · balance {1}","🔔 {0} vence hoy · saldo {1}":"🔔 {0} due today · balance {1}","🔔 {0} venció hace {1} días · saldo {2}":"🔔 {0} was due {1} days ago · balance {2}",
"Fechas de vencimiento":"Due dates","Día del mes en que vence cada tarjeta (1–31). Vacío = sin recordatorio.":"Day of the month each card is due (1–31). Empty = no reminder.","Día":"Day",
"⚠️ {0}: {1}% del presupuesto":"⚠️ {0}: {1}% of budget","⛔ {0}: {1}% del presupuesto (excedido)":"⛔ {0}: {1}% of budget (over)","Presupuesto mensual":"Monthly budget","Límite por categoría (tu parte). Vacío = sin límite. Se mantiene cada mes.":"Limit per category (your share). Empty = no limit. Kept every month.","Presupuesto por categoría":"Budget by category","{0} de {1}":"{0} of {1}","Sin presupuestos. Ponlos en Ajustes.":"No budgets. Set them in Settings.","incl. Tony {0}":"incl. Tony {0}",
"Metas de ahorro":"Savings goals","+ Nueva meta":"+ New goal","Meta":"Goal","Monto objetivo $":"Target amount $","Fecha objetivo (opcional)":"Target date (optional)","Aportar":"Contribute","Retirar":"Withdraw","Aportar a {0}":"Contribute to {0}","Retirar de {0}":"Withdraw from {0}","Aporte a {0}":"Contribution to {0}","Retiro de {0}":"Withdrawal from {0}","Ahorrado {0} de {1}":"Saved {0} of {1}","para el {0}":"by {0}","Ahorro registrado":"Savings recorded","Retiro registrado":"Withdrawal recorded","No hay tanto ahorrado. Ahorrado: {0}":"Not that much saved. Saved: {0}","¿Eliminar la meta {0}?":"Delete goal {0}?","Retira primero el saldo de la meta.":"Withdraw the goal balance first.","Editar":"Edit","Sale del débito y queda apartado en la meta. No cuenta como gasto ni como ingreso.":"Taken from debit and set aside in the goal. Not counted as expense or income.","Vuelve al débito.":"Goes back to debit.","El dinero ahorrado no se cuenta en “Disponible ahora”. Úsalo así si lo tienes en una cuenta aparte (ahorros); si se queda en tu débito de BOA, el débito de la app ya no cuadrará con BOA.":"Saved money is not counted in “Available now”. Use it this way if you keep it in a separate (savings) account; if it stays in your BOA debit, the app's debit won't match BOA.","Aún no hay metas.":"No goals yet.","Ahorro":"Savings",
"Resumen del jueves":"Thursday summary","Resumen del cheque":"Paycheck summary","Cheque":"Check","Pendiente a Tony":"Owed to Tony","Saldo de tarjetas":"Card balances","Gastos del mes":"Expenses this month","Te queda":"Left over","Disponible ahora − Tony − tarjetas":"Available now − Tony − cards","Ocultar hoy":"Hide today",
"Respaldo automático semanal":"Automatic weekly backup","Último respaldo: {0}":"Last backup: {0}","Aún no hay respaldos en la nube.":"No cloud backups yet.","Cada 7 días se guarda una copia en tu cuenta (se conservan las 8 últimas).":"Every 7 days a copy is saved to your account (last 8 kept).","Restaurar":"Restore","Cargando…":"Loading…","¿Restaurar el respaldo del {0}? Primero se descargará una copia de tus datos actuales.":"Restore the backup from {0}? A copy of your current data will be downloaded first.","Respaldo restaurado":"Backup restored","No se pudo restaurar":"Couldn't restore","Sin sesión: exporta un JSON cada semana como respaldo.":"Not signed in: export a JSON every week as a backup.","Última exportación: {0}":"Last export: {0}","Nunca":"Never","⚠️ Hace más de 7 días que no exportas un respaldo.":"⚠️ It's been over 7 days since your last backup export.","Respaldo ahora":"Back up now","Respaldo guardado":"Backup saved"});
NM.en['🐷 Ahorro']='🐷 Savings';
S.cardDue=S.cardDue||{};S.budgets=S.budgets||{};S.goals=S.goals||[];
const _setState=window.setState;window.setState=o=>{o.cardDue=o.cardDue||{};o.budgets=o.budgets||{};o.goals=o.goals||[];_setState(o)};
const dayMs=864e5,tdy=()=>new Date(today()+'T12:00');
// ---------- 1. vencimientos ----------
function dueInfo(card){const d=+S.cardDue[card.name];if(!(d>=1&&d<=31))return null;const t=tdy();
 const mk=(y,m)=>new Date(y,m,Math.min(d,new Date(y,m+1,0).getDate()),12);let due=mk(t.getFullYear(),t.getMonth());let days=Math.round((due-t)/dayMs);
 if(days<0){const s=new Date(due-25*dayMs).toLocaleDateString('en-CA');
  const paid=keys().some(k=>(S.months[k].events||[]).some(e=>e.type==='cardpay'&&e.desc==='Pago '+card.name&&(e.date||'')>=s));
  if(paid){due=mk(t.getFullYear(),t.getMonth()+1);days=Math.round((due-t)/dayMs)}}
 return {days,due}}
function dueBanners(){return L().cards.filter(c=>+c.amount>0.004).map(c=>({c,i:dueInfo(c)})).filter(x=>x.i&&x.i.days<=5).sort((a,b)=>a.i.days-b.i.days).map(({c,i})=>{
 const n=esc(DN(c.name)),s=f(c.amount),txt=i.days<0?T('🔔 {0} venció hace {1} días · saldo {2}',n,-i.days,s):i.days===0?T('🔔 {0} vence hoy · saldo {1}',n,s):i.days===1?T('🔔 {0} vence mañana · saldo {1}',n,s):T('🔔 {0} vence en {1} días · saldo {2}',n,i.days,s);
 return `<div class="card duebn" style="border:2px solid ${i.days<0?'#dc2626':'#f59e0b'};display:flex;gap:8px;align-items:center"><span style="flex:1">${txt}</span><button class="pay" onclick="S.cur=keys().at(-1);cardPayDlg('${c.id}')">${T('PAGAR')}</button></div>`}).join('')}
function dueCard(){const cs=L().cards.filter(c=>c.name);if(!cs.length)return'';return `<div class="card" id="duecard"><h2>📅 ${T('Fechas de vencimiento')}</h2><div class="muted">${T('Día del mes en que vence cada tarjeta (1–31). Vacío = sin recordatorio.')}</div>
 ${cs.map(c=>`<div class="row"><span class="n">${esc(DN(c.name))}</span><input type="number" inputmode="numeric" min="1" max="31" style="width:80px" placeholder="${T('Día')}" value="${S.cardDue[c.name]||''}" onchange="setDue('${esc(c.name).replace(/'/g,"\\'")}',this.value)"></div>`).join('')}</div>`}
function setDue(n,v){v=parseInt(v,10);if(v>=1&&v<=31)S.cardDue[n]=v;else delete S.cardDue[n];save();render()}
// ---------- 3. presupuestos ----------
// categoría de bills de Tony
const TCAT=[[/rent|renta|purif|water|agua|electric/i,'🏠 Hogar'],[/car letter|insur|seguro/i,'🚗 Transporte'],[/^\s*gas|gasolina/i,'⛽ Gasolina'],[/phone|tel[eé]f|internet/i,'📡 Comunicaciones'],[/food|comida/i,'🛒 Comida/Supermercado']];
function billCat(b){if(b.cat)return b.cat;const n=b.name||'';const h=TCAT.find(([r])=>r.test(n));return h?h[1]:'📦 Otros'}
function tonyBy(m){const o={};(m.bills||[]).forEach(b=>{const p=Math.min(+b.paid||0,+b.amount||0);if(p>0){const c=billCat(b);o[c]=r2((o[c]||0)+p)}});return o}
function budBy(m){const by={...spent(m).by},t=tonyBy(m);Object.entries(t).forEach(([c,v])=>by[c]=r2((by[c]||0)+v));return {by,t}}
function catPick(id){const b=M().bills.find(x=>x.id===id);if(!b)return;const cur=billCat(b);document.getElementById('catpk')?.remove();
 const d=document.createElement('div');d.id='catpk';d.style.cssText='position:fixed;inset:0;background:#0006;z-index:99;display:flex;align-items:center;justify-content:center';
 d.onclick=ev=>{if(ev.target===d)d.remove()};
 d.innerHTML=`<div class="card" style="max-width:340px;margin:12px"><h2>${esc(DN(b.name)||'—')}</h2><div class="chips">${S.cats.filter(c=>c!=='🤝 Tony').map(c=>`<button class="chip ${c===cur?'on':''}" data-c="${esc(c)}">${esc(DN(c))}</button>`).join('')}</div></div>`;
 d.querySelectorAll('.chip').forEach(x=>x.onclick=()=>{b.cat=x.dataset.c;save();d.remove();render()});document.body.appendChild(d)}
const bPct=(by,c)=>{const l=+S.budgets[c];return l>0?Math.round((by[c]||0)/l*100):null};
function budWarn(){const by=budBy(L()).by;return Object.keys(S.budgets).map(c=>[c,bPct(by,c)]).filter(([,p])=>p!==null&&p>=80).sort((a,b)=>b[1]-a[1]).map(([c,p])=>
 `<div class="card budw" style="${p>100?'background:#fee2e2;border:2px solid #dc2626;color:#b91c1c':'background:#fef3c7;border:2px solid #f59e0b'}">${p>100?T('⛔ {0}: {1}% del presupuesto (excedido)',esc(DN(c)),p):T('⚠️ {0}: {1}% del presupuesto',esc(DN(c)),p)}</div>`).join('')}
function budRep(m){const{by,t}=budBy(m),ent=Object.entries(S.budgets).filter(([,l])=>+l>0);
 return `<div class="card" id="budcard"><h2>🎯 ${T('Presupuesto por categoría')}</h2><div class="muted">${lbl(S.cur)} · ${T('compras compartidas cuentan solo tu parte')}</div>${ent.map(([c,l])=>{const v=by[c]||0,p=v/l*100,col=p>100?'#dc2626':p>=80?'#f59e0b':'#16a34a';
  return `<div class="bar"><div class="bl"><span>${esc(DN(c))}</span><b style="color:${col}">${T('{0} de {1}',f(v),f(l))} · ${Math.round(p)}%</b></div>${t[c]?`<div class="muted" style="text-align:right">${T('incl. Tony {0}',f(t[c]))}</div>`:''}<div style="display:none"></div><div class="bt"><div style="width:${Math.min(100,Math.max(2,p))}%;background:${col}"></div></div></div>`}).join('')||'<div class="muted">'+T('Sin presupuestos. Ponlos en Ajustes.')+'</div>'}</div>`}
function budCfg(){return `<div class="card" id="budcfg"><h2>🎯 ${T('Presupuesto mensual')}</h2><div class="muted">${T('Límite por categoría (tu parte). Vacío = sin límite. Se mantiene cada mes.')}</div>
 ${S.cats.filter(c=>c!=='🤝 Tony').map((c,i)=>`<div class="row"><span class="n">${esc(DN(c))}</span><input type="number" inputmode="decimal" step="0.01" placeholder="—" value="${S.budgets[c]||''}" data-c="${esc(c)}" onchange="setBud(this.dataset.c,this.value)"></div>`).join('')}</div>`}
function setBud(c,v){v=r2(v);if(v>0)S.budgets[c]=v;else delete S.budgets[c];save()}
// toast al cruzar 80%/100% (llamar con by antes del cambio)
function budToast(before,cats){const after=spent(L()).by;let msg='';[...new Set(cats)].forEach(c=>{const l=+S.budgets[c];if(!(l>0))return;const a=(before[c]||0)/l*100,b=(after[c]||0)/l*100;
 if(a<=100&&b>100)msg=T('⛔ {0}: {1}% del presupuesto (excedido)',DN(c),Math.round(b));else if(a<80&&b>=80&&!msg)msg=T('⚠️ {0}: {1}% del presupuesto',DN(c),Math.round(b))});
 if(msg)setTimeout(()=>toast(msg),1900)}
const _sq=saveQuick;saveQuick=function(){const b={...spent(L()).by},c=document.querySelector('#qcats .chip.on')?.dataset.c;_sq();if(!dlg().open)budToast(b,[c])};
const _sp=saveP;saveP=function(){const b={...spent(L()).by};_sp();if(!dlg().open)budToast(b,[SHARED_CAT])};
// ---------- 4. metas de ahorro ----------
const gBy=id=>S.goals.find(g=>g.id===id);
function goalCards(){if(!S.goals.length)return'';return `<div class="card" id="goalcard"><h2>🐷 ${T('Metas de ahorro')}</h2>${S.goals.map(g=>{const p=g.target>0?Math.min(100,(+g.bal||0)/g.target*100):0;
 return `<div class="bar"><div class="bl"><span><b>${esc(g.name)}</b>${g.date?` <span class="muted">${T('para el {0}',fdate(g.date))}</span>`:''}</span><b>${Math.round(p)}%</b></div><div class="bt"><div style="width:${Math.max(2,p)}%;background:#16a34a"></div></div>
 <div class="muted" style="margin:4px 0">${T('Ahorrado {0} de {1}',f(+g.bal||0),f(g.target))}</div><div class="grid"><button class="pay" style="background:#16a34a" onclick="saveDlg('${g.id}',1)">${T('Aportar')}</button><button class="sec" onclick="saveDlg('${g.id}',-1)" ${+g.bal>0?'':'disabled'}>${T('Retirar')}</button></div></div>`}).join('')}</div>`}
function saveDlg(id,dir){const g=gBy(id);dlg().innerHTML=`<h2>${dir>0?T('Aportar a {0}',esc(g.name)):T('Retirar de {0}',esc(g.name))}</h2><div class="muted">${dir>0?T('Sale del débito y queda apartado en la meta. No cuenta como gasto ni como ingreso.')+' '+T('Disponible en débito: {0}',f(debAvail())):T('Vuelve al débito.')+' '+T('Ahorrado {0} de {1}',f(+g.bal||0),f(g.target))}</div>
 <p><input id="sva" class="name" type="number" inputmode="decimal" step="0.01" placeholder="${T('Monto $')}" style="font-size:24px"></p><input id="svf" class="name" type="date" value="${today()}">
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="svok" onclick="doSave('${id}',${dir})">${T('Confirmar')}</button></div>`;dlg().showModal()}
function doSave(id,dir){const g=gBy(id),a=r2(document.getElementById('sva').value),d=document.getElementById('svf').value||today();if(!(a>0))return alert(T('Pon un monto'));
 if(dir>0){if(noDeb(a))return}else if(a>r2(g.bal)+0.004)return alert(T('No hay tanto ahorrado. Ahorrado: {0}',f(g.bal)));
 g.bal=r2((+g.bal||0)+dir*a);spend('deb',dir*a);
 S.months[monthFor(d)].events.push({id:uid(),type:'saving',date:d,amount:r2(dir*a),goalId:id,goalName:g.name,desc:(dir>0?'Aporte a ':'Retiro de ')+g.name});
 save();dlg().close();render();toast(dir>0?T('Ahorro registrado'):T('Retiro registrado'))}
function goalCfg(){return `<div class="card" id="goalcfg"><h2>🐷 ${T('Metas de ahorro')}<span><button class="add" onclick="goalDlg()">+</button></span></h2><div class="muted">${T('El dinero ahorrado no se cuenta en “Disponible ahora”. Úsalo así si lo tienes en una cuenta aparte (ahorros); si se queda en tu débito de BOA, el débito de la app ya no cuadrará con BOA.')}</div>
 ${S.goals.map(g=>`<div class="row"><span class="n">${esc(g.name)}<div class="muted">${T('Ahorrado {0} de {1}',f(+g.bal||0),f(g.target))}${g.date?' · '+T('para el {0}',fdate(g.date)):''}</div></span><button class="sec adj" onclick="goalDlg('${g.id}')">${T('Editar')}</button><button class="del" onclick="delGoal('${g.id}')">${T('Eliminar')}</button></div>`).join('')||'<div class="muted">'+T('Aún no hay metas.')+'</div>'}</div>`}
function goalDlg(id){const g=id?gBy(id):{};dlg().innerHTML=`<h2>${T('Meta')}</h2><label>${T('Nombre')}<input id="gn" class="name" value="${esc(g.name||'')}"></label><label>${T('Monto objetivo $')}<input id="gt" class="name" type="number" inputmode="decimal" step="0.01" value="${g.target||''}"></label><label>${T('Fecha objetivo (opcional)')}<input id="gd" class="name" type="date" value="${g.date||''}"></label>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="gok" onclick="doGoal('${id||''}')">${T('Guardar')}</button></div>`;dlg().showModal()}
function doGoal(id){const n=document.getElementById('gn').value.trim(),t=r2(document.getElementById('gt').value),d=document.getElementById('gd').value;if(!n)return alert(T('Pon un nombre'));if(!(t>0))return alert(T('Pon un monto'));
 if(id)Object.assign(gBy(id),{name:n,target:t,date:d});else S.goals.push({id:uid(),name:n,target:t,date:d,bal:0});save();dlg().close();render()}
function delGoal(id){const g=gBy(id);if(+g.bal>0.004)return alert(T('Retira primero el saldo de la meta.'));if(!confirm(T('¿Eliminar la meta {0}?',g.name)))return;S.goals=S.goals.filter(x=>x.id!==id);save();render()}
// ---------- 5. resumen del jueves ----------
const THK='finanzas-thu-hide';
function thuCard(){const t=today(),isThu=tdy().getDay()===4,depToday=S.checks.filter(c=>c.status==='deposited'&&c.depositedOn===t);
 if(!(isThu||depToday.length)||localStorage.getItem(THK)===t)return'';
 const wk=new Date(tdy()-6*dayMs).toLocaleDateString('en-CA'),recent=S.checks.filter(c=>c.status==='deposited'&&(c.date||'')>=wk&&(c.date||'')<=t),chk=depToday.length?sum(depToday,c=>c.amount):sum(recent,c=>c.amount),pc=pendingCheck();
 const m=L(),c=calc(m),disp=sum(m.income,x=>x.amount),tony=r2(c.tonyDue+sum(prevPend(),p=>p.c.tonyDue)),left=r2(disp-tony-c.credit);
 return `<div class="card" id="thucard" style="border:2px solid #2563eb"><h2>🗓️ ${isThu?T('Resumen del jueves'):T('Resumen del cheque')}<button class="sec" style="min-height:32px;padding:2px 10px;font-size:13px" onclick="localStorage.setItem('${THK}',today());render()">${T('Ocultar hoy')}</button></h2>
 <div class="row"><span class="n">💼 ${chk?T('Cheque'):T('Próximo cheque')}</span>${f(chk||(pc?pc.amount:0))}</div>
 <div class="row"><span class="n">🤝 ${T('Pendiente a Tony')}</span>−${f(tony)}</div><div class="row"><span class="n">💳 ${T('Saldo de tarjetas')}</span>−${f(c.credit)}</div>
 <div class="row"><span class="n">🧾 ${T('Gastos del mes')}</span>${f(spent(m).total)}</div>
 <div class="tot" style="font-size:20px"><span>${T('Te queda')}</span><span class="${left>=0?'pos':'neg'}">${f(left)}</span></div><div class="muted">${T('Disponible ahora − Tony − tarjetas')}</div></div>`}
// ---------- 2. respaldo ----------
const LEK='finanzas-last-export';
const _exp=exp;exp=function(){_exp();localStorage.setItem(LEK,today())};
function bkCfg(){const signed=window.fbUser&&window.fbUser(),le=localStorage.getItem(LEK),old=!le||(tdy()-new Date(le+'T12:00'))>7*dayMs;
 return `<div class="card" id="bkcfg"><h2>${T('Respaldo')}</h2>${signed?`<div><b>${T('Respaldo automático semanal')}</b></div><div class="muted">${T('Cada 7 días se guarda una copia en tu cuenta (se conservan las 8 últimas).')}</div><div id="bklist" class="muted" style="margin:6px 0">${T('Cargando…')}</div>`:
 `<div class="muted" style="font-size:13px">${T('Sin sesión: exporta un JSON cada semana como respaldo.')}</div><div class="muted">${T('Última exportación: {0}',le?fdate(le):T('Nunca'))}</div>${old?`<div style="color:#b45309;font-size:14px;margin:4px 0">${T('⚠️ Hace más de 7 días que no exportas un respaldo.')}</div>`:''}`}
 <div class="grid" style="margin-top:6px"><button onclick="exp()">${T('Exportar JSON')}</button><button class="sec" onclick="document.getElementById('imp').click()">${T('Importar JSON')}</button></div>
 <input type="file" id="imp" accept="application/json,.json" hidden onchange="imp(this.files[0])"></div>`}
async function loadBk(){const el=document.getElementById('bklist');if(!el||!window.fbBackups)return;let L2;try{L2=await window.fbBackups()}catch(e){L2=[]}const el2=document.getElementById('bklist');if(!el2)return;
 el2.innerHTML=(L2&&L2.length?`<div style="font-size:14px;color:#0f172a">${T('Último respaldo: {0}',fdate(L2[0].id))}</div>`+L2.map(b=>`<div class="row"><span class="n">${fdate(b.id)} ${b.id.slice(0,4)}</span><button class="sec adj" onclick="restoreBk('${b.id}')">${T('Restaurar')}</button></div>`).join(''):T('Aún no hay respaldos en la nube.'))+
 `<button class="sec" style="width:100%;margin-top:6px" onclick="window.fbBackupNow().then(()=>{toast(T('Respaldo guardado'));loadBk()})">${T('Respaldo ahora')}</button>`}
async function restoreBk(id){if(!confirm(T('¿Restaurar el respaldo del {0}? Primero se descargará una copia de tus datos actuales.',fdate(id)+' '+id.slice(0,4))))return;
 exp();try{await window.fbRestore(id);toast(T('Respaldo restaurado'))}catch(e){console.warn(e);alert(T('No se pudo restaurar'))}}
