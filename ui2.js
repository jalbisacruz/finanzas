// v52+: estructura nueva (Hoy · Movimientos · Mes · Reportes + Configuración desde ☰), catálogos uniformes, mejoras rápidas.
// Solo interfaz: el formato de datos no cambia (campos nuevos opcionales: storeMem, check.ok).
const APP_V='v52';
Object.assign(EN,{"Hoy":"Today","Transferir":"Transfer","Cobrar":"Collect","No se mezclan con el mes actual. Si llega un bill tarde, anótalo en su mes (Mes › Cuentas de Tony del mes) y aquí se actualiza.":"Kept separate from the current month. If a bill arrives late, enter it in its month (Month › Tony's bills this month) and this updates.","Configuración":"Settings","Versión":"Version","Por hacer":"To do","✅ Todo al día":"✅ All caught up",
"Cheque de {0} depositado. ¿Llegó ese monto?":"Check for {0} deposited. Did that amount arrive?","Sí":"Yes","Otro monto":"Other amount","Monto que llegó $":"Amount that arrived $","Cheque corregido":"Check corrected",
"Enviar mensaje":"Send message","Mensaje para {0}":"Message for {0}","Copiar":"Copy","Copiado":"Copied","Cerrar":"Close",
"Hola Tony, cuentas de {0}:":"Hi Tony, bills for {0}:","Total cuentas":"Total bills","− Tu parte de las compras":"− Your share of purchases","− Ya transferido":"− Already transferred","Te transfiero":"I'm transferring you",
"Hola Carlos, tu parte de las compras de {0}:":"Hi Carlos, your share of purchases for {0}:","Total":"Total","− Ya pagado":"− Already paid","Pendiente":"Pending",
"Tony – {0}":"Tony – {0}","Carlos – {0}":"Carlos – {0}","{0} vence en {1} días":"{0} due in {1} days","{0} vence hoy":"{0} due today","{0} vence mañana":"{0} due tomorrow","{0} venció hace {1} días":"{0} was due {1} days ago",
"+ Próximo cheque":"+ Next check","Saldos":"Balances","Los nombres se cambian en Configuración › Cuentas.":"Names are changed in Settings › Accounts.","Los nombres se cambian en Configuración › Tarjetas.":"Names are changed in Settings › Cards.",
"Cheques depositados":"Deposited checks","Buscar":"Search","Cuentas de Tony del mes":"Tony's bills this month","Los nombres, Fija/Var. y categorías se cambian en Configuración › Cuentas de Tony.":"Names, Fixed/Var. and categories are changed in Settings › Tony's bills.",
"Gasto y presupuesto por categoría":"Spending and budget by category","Más":"More","Ingresos del mes":"Income this month",
"Catálogos":"Catalogs","Categorías y presupuesto":"Categories and budget","Cuentas (dinero)":"Accounts (money)","Tarjetas":"Cards","Destinatarios de envíos":"Remittance recipients",
"Elige cuál editar":"Pick one to edit","Elige cuál eliminar":"Pick one to remove","Nuevo":"New","Ya existe":"It already exists","Guardado":"Saved","Eliminado":"Removed",
"Día de vencimiento (1–31)":"Due day (1–31)","Categoría":"Category","Tipo":"Type","Esta línea no se puede eliminar.":"This line can't be removed.","Se usa en {0} movimiento(s). Elige a cuál moverlos:":"Used in {0} transaction(s). Pick where to move them:",
"{0} se usa en compras compartidas y no se puede eliminar.":"{0} is used in shared purchases and can't be removed.","{0} tiene monto este mes. Ponlo en 0 en Mes antes de eliminar.":"{0} has an amount this month. Set it to 0 in Month before removing.",
"Los cambios de nombre se aplican a todos los meses.":"Name changes apply to all months.","Las de 🔒 las usa la app y no se pueden editar ni eliminar.":"Items with 🔒 are used by the app and can't be edited or removed.",
"Quitarla de la lista no borra las compras que ya la usan.":"Removing it from the list doesn't delete purchases that use it.","Datos":"Data","Datos de prueba: ninguno":"",
"vence día {0}":"due day {0}","Configuración › Categorías":"Settings › Categories","Disponible proyectado":"Projected available","Sin presupuesto":"No budget","Presupuesto":"Budget"});
const RS=()=>S.storeMem=S.storeMem||{};
// ---------- A1. recordar categoría y tarjeta por tienda ----------
const memK=s=>(s||'').trim().toLowerCase();
const _quick=quick;quick=function(){_quick();const d=document.getElementById('qd');if(!d)return;
 const names=[...new Set([...(S.stores||[]),...Object.values(RS()).map(x=>x.name).filter(Boolean)])];
 d.setAttribute('list','qstores');d.insertAdjacentHTML('afterend',`<datalist id="qstores">${names.map(n=>`<option value="${esc(n)}">`).join('')}</datalist>`);
 d.addEventListener('input',()=>{const mm=RS()[memK(d.value)];if(!mm)return;
  if(mm.cat){const b=[...document.querySelectorAll('#qcats .chip')].find(x=>x.dataset.c===mm.cat);if(b)b.click()}
  if(mm.method){const s=document.getElementById('qm');if([...s.options].some(o=>o.value===mm.method))s.value=mm.method}})};
const _saveQuick=saveQuick;saveQuick=function(){const d=(document.getElementById('qd')||{}).value||'',m=(document.getElementById('qm')||{}).value,c=document.querySelector('#qcats .chip.on')?.dataset.c;
 _saveQuick();if(!dlg().open&&d.trim()){RS()[memK(d)]={name:d.trim(),cat:c,method:m};save()}};
const _editP=editP;editP=function(id){_editP(id);if(D&&D.isNew){const mm=RS()[memK(D.store)];if(mm&&mm.method!==undefined){D.method=mm.method;drawP()}}};
const _drawP=drawP;drawP=function(){_drawP();const s=[...dlg().querySelectorAll('select')].find(x=>(x.getAttribute('onchange')||'').startsWith('D.store'));
 if(s)s.onchange=function(){D.store=this.value;const mm=RS()[memK(this.value)];if(D.isNew&&mm&&mm.method!==undefined){D.method=mm.method}drawP()}};
const _saveP=saveP;saveP=function(){const st=D.store,me=D.method;_saveP();if(!dlg().open&&st){const k=memK(st);RS()[k]={...(RS()[k]||{}),name:st,method:me};save()}};
// ---------- A2. cheque del jueves en 1 toque ----------
const chkToConfirm=()=>S.checks.filter(c=>c.status==='deposited'&&c.auto&&!c.ok&&c.depositedOn&&(tdy()-new Date(c.depositedOn+'T12:00'))<=3*dayMs);
function chkNote(){const L2=chkToConfirm();if(!L2.length)return'';return L2.map(c=>`<div class="card" id="chknote" style="background:#f0fdf4;border:1px solid #86efac">
 <div>💵 ${T('Cheque de {0} depositado. ¿Llegó ese monto?',`<b>${f(c.amount)}</b>`)} <span class="muted">${wd(c.date)}</span></div>
 <div class="grid" style="margin-top:8px"><button id="chkyes" onclick="chkOk('${c.id}')">${T('Sí')}</button><button class="sec" onclick="chkOther('${c.id}')">${T('Otro monto')}</button></div></div>`).join('')}
function chkOk(id){const c=S.checks.find(x=>x.id===id);if(!c)return;c.ok=true;autoNote=null;save();render()}
function chkOther(id){const c=S.checks.find(x=>x.id===id);if(!c)return;dlg().innerHTML=`<h2>${T('Otro monto')}</h2><label>${T('Monto que llegó $')}<input id="cka" type="number" inputmode="decimal" step="0.01" value="${c.amount}" style="font-size:24px"></label>
 <div class="grid" style="margin-top:10px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="ckok" onclick="chkFix('${id}')">${T('Guardar')}</button></div>`;dlg().showModal()}
function chkFix(id){const c=S.checks.find(x=>x.id===id),a=r2(document.getElementById('cka').value);if(!c)return;if(!(a>0))return alert(T('Pon un monto'));
 const diff=r2(a-c.amount);if(diff<0&&noDeb(-diff))return;const db=debE(L());db.amount=r2((+db.amount||0)+diff);c.amount=a;c.ok=true;
 keys().forEach(k=>(S.months[k].events||[]).forEach(e=>{if(e.type==='check'&&e.checkId===id)e.amount=a}));autoNote=null;save();dlg().close();render();toast(T('Cheque corregido'))}
// ---------- A3. mensaje para Tony / Carlos ----------
function msgFor(who,k){const m=S.months[k],c=calc(m),L2=[];
 if(who==='tony'){L2.push(T('Hola Tony, cuentas de {0}:',lbl(k)));m.bills.filter(b=>+b.amount).forEach(b=>L2.push(`• ${DN(b.name)}: ${f(b.amount)}`));
  L2.push(`${T('Total cuentas')}: ${f(c.bills)}`,`${T('− Tu parte de las compras')}: ${f(c.tony)}`);if(c.xfer)L2.push(`${T('− Ya transferido')}: ${f(c.xfer)}`);L2.push(`${T('Te transfiero')}: ${f(c.tonyDue)}`)}
 else{L2.push(T('Hola Carlos, tu parte de las compras de {0}:',lbl(k)));m.purchases.filter(p=>+p.shares.Carlos).forEach(p=>L2.push(`• ${p.store} ${p.date?fdate(p.date):''}: ${f(p.shares.Carlos)}`));
  L2.push(`${T('Total')}: ${f(c.carlos)}`);if(c.recv)L2.push(`${T('− Ya pagado')}: ${f(c.recv)}`);L2.push(`${T('Pendiente')}: ${f(c.carlosDue)}`)}
 return L2.join('\n')}
async function shareMsg(who,k){const t=msgFor(who,k);if(navigator.share){try{await navigator.share({text:t});return}catch(e){if(e&&e.name==='AbortError')return}}
 dlg().innerHTML=`<h2>${T('Mensaje para {0}',who==='tony'?'Tony':'Carlos')}</h2><textarea id="msgt" rows="9" style="width:100%;font-size:15px;border-radius:10px;border:1px solid #cbd5e1;padding:8px">${esc(t)}</textarea>
 <div class="grid" style="margin-top:10px"><button class="sec" onclick="dlg().close()">${T('Cerrar')}</button><button id="msgcp" onclick="copyMsg()">${T('Copiar')}</button></div>`;dlg().showModal()}
async function copyMsg(){const ta=document.getElementById('msgt');try{await navigator.clipboard.writeText(ta.value)}catch(e){ta.select();document.execCommand&&document.execCommand('copy')}toast(T('Copiado'))}
const shBtn=(who,k)=>`<button class="sec" title="${T('Enviar mensaje')}" aria-label="${T('Enviar mensaje')}" style="min-height:36px;padding:2px 10px" onclick="event.stopPropagation();shareMsg('${who}','${k}')">📤</button>`;
const _closeCard=closeCard;closeCard=function(m,k){const c=calc(m);const s=`<div class="grid" style="margin-top:8px">${shBtn('tony',k).replace('📤','📤 Tony')}${shBtn('carlos',k).replace('📤','📤 Carlos')}</div>`;return _closeCard(m,k).replace(/<\/div>$/,s+'</div>')};
// ---------- B/C. Hoy ----------
function chkBox(){const pc=pendingCheck();
 if(pc&&!chkEdit)return `<div class="row" style="border:0;margin-top:6px"><span class="n" style="color:#cbd5e1">${T('Próximo cheque')}: <b style="color:#fff">${f(pc.amount)}</b> · ${wd(pc.date)}</span><button id="chkadj" class="sec" style="min-height:34px;padding:4px 12px;font-size:14px" onclick="chkEdit=true;render()">${T('Ajustar')}</button></div>`;
 return `<div style="margin-top:8px;color:#cbd5e1">${T('Monto del próximo cheque')}</div><div class="grid" style="margin-top:6px"><input id="chk" type="number" inputmode="decimal" step="0.01" placeholder="${T('Monto $')}" value="${pc?pc.amount:''}"><input id="chkd" type="date" value="${pc?pc.date:nextCheckDate()}"></div>
 <div class="grid" style="margin-top:8px">${pc?`<button class="del" onclick="S.checks=S.checks.filter(x=>x.id!=='${pc.id}');chkEdit=false;save();render()">${T('Quitar')}</button>`:'<span></span>'}<button id="chkbtn" onclick="setCheck()">${T('Guardar')}</button></div>`}
function dueTxt(c,i){const n=esc(DN(c.name));return i.days<0?T('{0} venció hace {1} días',n,-i.days):i.days===0?T('{0} vence hoy',n):i.days===1?T('{0} vence mañana',n):T('{0} vence en {1} días',n,i.days)}
function todoCard(){const k=keys().at(-1),c=calc(L()),rows=[];
 L().cards.filter(x=>+x.amount>0.004).map(x=>({x,i:dueInfo(x)})).filter(o=>o.i&&o.i.days<=5).sort((a,b)=>a.i.days-b.i.days).forEach(({x,i})=>rows.push(`<div class="row"><span class="n">🔔 ${dueTxt(x,i)}<div class="muted">${f(x.amount)}</div></span><button class="pay" onclick="S.cur=keys().at(-1);cardPayDlg('${x.id}')">${T('PAGAR')}</button></div>`));
 const pr=(who,kk,amt,last)=>`<div class="row"><span class="n">${who==='tony'?'➡️ '+T('Transferir a Tony'):'💰 '+T('Cobrar a Carlos')}${last?'':`<div class="muted">${lbl(kk)} · ${T('Pendientes de meses anteriores')}</div>`}</span><b>${f(amt)}</b>${shBtn(who,kk)}<button class="pay${who==='carlos'?' dep':''}" onclick="payDlg('${who}','${kk}')">${who==='tony'?T('Transferir'):T('Cobrar')}</button></div>`;
 prevPend().forEach(({k:kk,c:cc})=>{if(cc.tonyDue>0.005)rows.push(pr('tony',kk,cc.tonyDue,false));if(cc.carlosDue>0.005)rows.push(pr('carlos',kk,cc.carlosDue,false))});
 if(c.tonyDue>0.005)rows.push(pr('tony',k,c.tonyDue,true));if(c.carlosDue>0.005)rows.push(pr('carlos',k,c.carlosDue,true));
 return `<div class="card" id="todocard"><h2>📌 ${T('Por hacer')}</h2>${rows.join('')||`<div class="muted">${T('✅ Todo al día')}</div>`}</div>`}
function planV2(){const m=L(),c=calc(m),disp=sum(m.income,x=>x.amount),pc=pendingCheck(),next=pc?pc.amount:0,oldT=sum(prevPend(),p=>p.c.tonyDue),proj=disp+next-c.tonyDue-oldT-c.credit;
 const rows=`<div style="margin-top:10px;padding-top:6px;border-top:1px solid #e2e8f0"><div class="row"><span class="n"><b>${T('Disponible proyectado')}</b></span><b class="${proj>=0?'pos':'neg'}">${f(proj)}</b></div>
 <div class="muted">${T('Disponible ahora')} ${f(disp)} ${T('+ Próximo cheque')} ${f(next)} ${T('− Transferencia a Tony')} ${f(c.tonyDue)}${oldT>0.005?' '+T('− Pendiente a Tony (meses anteriores)')+' '+f(oldT):''} ${T('− Pagos de tarjetas')} ${f(c.credit)}</div></div>`;
 let p=planCard();
 if(p.includes('id="planhint"'))return `<div class="card" id="plancard"><h2>📋 ${T('Plan del mes')}<span class="muted" style="font-size:13px">${lbl(keys().at(-1))}</span></h2>${rows}<div class="muted" style="margin-top:6px">${p.replace(/^<div[^>]*>|<\/div>$/g,'').replace(T('Ajustes › Presupuesto'),T('Configuración › Categorías'))}</div></div>`;
 p=p.replace(/ · [^·]*<span class="(pos|neg)">[^<]*<\/span><\/div><\/span>/,'</div></span>');return p.replace(/<\/div>$/,rows+'</div>')}
function hero(){const m=L(),disp=sum(m.income,x=>x.amount);return `<div class="card hero" id="herocard"><div class="muted">${T('Disponible ahora')}</div><div class="big xl ${disp>=0?'pos':'neg'}">${f(disp)}</div>
 <div class="muted">${m.income.map(x=>esc(DN(x.name)||'—')+' '+f(x.amount)).join(' · ')}</div>${chkBox()}</div>`}
ini=function(){const ss=window.syncStatus?`<div class="muted" id="syncst" style="text-align:right;margin:-4px 4px 6px">${window.syncStatus()}</div>`:'';
 return ss+chkNote()+thuCard()+budWarn()+hero()+todoCard()+planV2()+goalCards()};
// ---------- Movimientos ----------
function balCard(key){const m=M(),isC=key==='cards',t=sum(m[key],x=>x.amount);
 return `<div class="card" id="bal-${key}"><h2>${isC?'💳 '+T('Tarjetas de crédito'):'💵 '+T('Saldos')}<span>${f(t)}</span></h2>
 ${m[key].map(x=>{const di=isC?dueInfo(x):null;return `<div class="row"><span class="n">${esc(DN(x.name)||'—')}${di?`<div class="muted">${T('vence día {0}',S.cardDue[x.name])}</div>`:''}</span><span class="amt ro" style="min-width:84px;text-align:right;font-weight:600">${f(+x.amount||0)}</span><button class="sec adj" onclick="adjDlg('${key}','${x.id}')">${T('Ajustar')}</button>${!isC&&x!==debE(m)?`<button class="pay dep" ${+x.amount>0?'':'disabled'} onclick="depDlg('${x.id}')">${T('Depositar')}</button>`:''}${isC?`<button class="pay" ${+x.amount>0?'':'disabled'} onclick="cardPayDlg('${x.id}')">${T('PAGAR')}</button>`:''}</div>`}).join('')}
 <div class="muted">${T(isC?'Los nombres se cambian en Configuración › Tarjetas.':'Los nombres se cambian en Configuración › Cuentas.')}</div></div>`}
let movQ='';
function movList(){const m=M(),q=movQ.trim().toLowerCase(),all=moves(m),cats=[...new Set(all.map(x=>x.cat))],mv=all.filter(x=>(!filt||x.cat===filt)&&(!q||(x.desc+' '+DN(x.cat)+' '+x.amount).toLowerCase().includes(q)));
 return `<div class="card" id="movcard"><h2>📝 ${T('Movimientos')}</h2><div class="grid"><input id="movq" placeholder="🔍 ${T('Buscar')}" value="${esc(movQ)}" oninput="movQ=this.value;clearTimeout(window._mq);window._mq=setTimeout(()=>{render();const i=document.getElementById('movq');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)">
 <select onchange="filt=this.value;render()"><option value="">${T('Todas las categorías')}</option>${cats.map(c=>`<option value="${esc(c)}"${c===filt?' selected':''}>${esc(DN(c))}</option>`).join('')}</select></div>
 ${mv.map(x=>`<div class="row"><span class="n">${esc(x.desc)||esc(DN(x.cat))}<div class="muted">${fdate(x.date)} · ${esc(DN(x.cat))} · ${methName(x.method)}</div></span><b class="${x.kind==='todebit'||x.kind==='carlos'||x.kind==='saving'?'':x.amount>=0?'pos':''}">${x.kind==='todebit'||x.kind==='carlos'||x.kind==='saving'?'↔ ':x.amount>=0?'+':'−'}${f(Math.abs(x.amount))}</b>${x.kind==='compra'?'':`<button class="del" onclick="delMove('${x.kind}','${x.id}')">✕</button>`}</div>`).join('')||'<div class="muted">'+T('Nada aquí.')+'</div>'}</div>`}
function chkCard(){const L2=depChecks();return `<div class="card defcol" id="chkcard"><h2>💼 ${T('Cheques depositados')}<span>${f(sum(L2,c=>c.amount))}</span></h2>${L2.map(c=>`<div class="row"><span class="n">${wd(c.date)}<div class="muted">✅ ${T('Depositado')}${c.legacy?' · '+T('importado'):''}</div></span>${f(c.amount)}</div>`).join('')||'<div class="muted">'+T('Nada aquí.')+'</div>'}</div>`}
function mov(){return balCard('income')+balCard('cards')+com().replace('<div class="card">','<div class="card" id="comcard"><h2>🛒 '+T('Compras compartidas')+'</h2>')+movList()+chkCard()}
// ---------- Mes ----------
function billsMonth(){const m=M();return `<div class="card" id="billsm"><h2>🧾 ${T('Cuentas de Tony del mes')}<span>${f(sum(m.bills,x=>x.amount))}</span></h2>
 ${m.bills.map(x=>`<div class="row"><button class="tcat" title="${esc(DN(billCat(x)))}" onclick="catPick('${x.id}')">${esc(billCat(x).split(' ')[0])}</button><span class="n">${esc(DN(x.name)||'—')} <span class="muted">${x.fixed?T('Fija'):T('Var.')}</span></span><input type="number" inputmode="decimal" step="0.01" value="${x.amount||''}" placeholder="0" style="max-width:110px" onchange="upd('bills','${x.id}','amount',this.value)">${billSt(x)}</div>`).join('')}
 <div class="muted">${T('Los nombres, Fija/Var. y categorías se cambian en Configuración › Cuentas de Tony.')}</div></div>`}
const _res=res;res=function(){const o=_res(),i=o.lastIndexOf('<div class="card"><h2>'+T('Detalle'));return i<0?o+billsMonth():o.slice(0,i)+billsMonth()+o.slice(i)};
// ---------- Reportes ----------
rep=function(){const m=M(),sp=spent(m),{by:bb,t}=budBy(m),lim=S.budgets,er=earned(m),all=keys().map(k=>[k,spent(S.months[k]).total,earned(S.months[k]).total]),acc=all.reduce((a,[,x])=>a+x,0),accI=all.reduce((a,[,,i])=>a+i,0);
 const cats=[...new Set([...Object.keys(sp.by),...Object.keys(lim).filter(c=>+lim[c]>0)])].sort((a,b)=>(sp.by[b]||0)-(sp.by[a]||0)),mx=Math.max(1,...Object.values(sp.by));
 const rows=cats.map(c=>{const v=sp.by[c]||0,l=+lim[c]||0,bv=bb[c]||0,p=l?bv/l*100:0,col=p>100?'#dc2626':p>=80?'#f59e0b':'#16a34a';
  return `<div class="bar" onclick="filt='${esc(c)}';tab='mov';render();setTimeout(()=>goSec&&goSec('movcard'),50)"><div class="bl"><span>${esc(DN(c))}</span><b>${f(v)}</b></div><div class="bt"><div style="width:${Math.max(2,v/mx*100)}%"></div></div>
  ${l?`<div class="muted" style="display:flex;justify-content:space-between;margin-top:2px"><span>🎯 ${T('{0} de {1}',f(bv),f(l))}${t[c]?' · '+T('incl. Tony {0}',f(t[c])):''}</span><b style="color:${col}">${Math.round(p)}%</b></div>`:''}</div>`}).join('');
 return `<div class="card" id="gpcard"><h2>${T('Gasto y presupuesto por categoría')}<span>${f(sp.total)}</span></h2><div class="muted">${lbl(S.cur)} · ${T('compras compartidas cuentan solo tu parte')}</div>${rows||'<div class="muted">'+T('Sin gastos registrados.')+'</div>'}</div>
 <div class="card" id="inccard"><h2>${T('Ingresos por concepto')}<span class="pos">${f(er.total)}</span></h2><div class="muted">${lbl(S.cur)} · ${T('sin reembolsos, transferencias entre tus cuentas ni pagos de tarjeta')}</div>${bars(er.by,'pos')||'<div class="muted">'+T('Sin ingresos registrados.')+'</div>'}</div>
 ${[remCard(m),cbCard(cbBy([m]),lbl(S.cur),cbBy(keys().map(k=>S.months[k])))].map(x=>x.replace('<div class="card"','<div class="card defcol"')).join('')}
 <div class="card defcol" id="acccard"><h2>${T('Acumulado')}</h2><div class="row"><span class="n"><b>${T('Total')}</b></span><span class="pos">+${f(accI)}</span>&nbsp;<span>−${f(acc)}</span></div>${all.reverse().map(([k,x,i])=>`<div class="row"><span class="n">${lbl(k)}<div class="muted">${T('Neto {0}',f(i-x))}</div></span><span class="pos">+${f(i)}</span>&nbsp;<span>−${f(x)}</span></div>`).join('')}</div>`};
// ---------- D. Configuración: catálogos uniformes (+ ✏️ −), aún por nombre ----------
const CTL={};
const ctlHead=(id,title)=>`<h2>${title}<span><button class="add" onclick="CTL.${id}.add()" title="${T('+ Añadir')}" aria-label="${T('+ Añadir')}">+</button><button class="sec" onclick="ctlPick('${id}','edit')" title="${T('Editar')}" aria-label="${T('Editar')}" style="background:none;font-size:18px;min-width:36px;padding:0 4px">✏️</button><button class="rm" onclick="ctlPick('${id}','del')" title="${T('Eliminar')}" aria-label="${T('Eliminar')}">−</button></span></h2>`;
function ctlCard(id){const c=CTL[id],it=c.items();return `<div class="card" id="ctl-${id}">${ctlHead(id,c.title())}${c.hint?`<div class="muted">${c.hint()}</div>`:''}
 ${it.map(x=>`<div class="row"><span class="n">${esc(x.label)}${x.sub?`<div class="muted">${x.sub}</div>`:''}</span>${x.lock?'<span class="muted">🔒</span>':''}</div>`).join('')||`<div class="muted">${T('Nada aquí.')}</div>`}</div>`}
function ctlPick(id,mode){const c=CTL[id],it=c.items();
 dlg().innerHTML=`<h2>${T(mode==='edit'?'Elige cuál editar':'Elige cuál eliminar')}</h2><div style="max-height:60vh;overflow:auto">${it.map((x,i)=>`<div class="row"><span class="n">${esc(x.label)}</span>${x.lock||(mode==='del'&&x.nodel)?'<span class="muted">🔒</span>':`<button class="sec" onclick="CTL.${id}.${mode}(${i})">${T(mode==='edit'?'Editar':'Eliminar')}</button>`}</div>`).join('')}</div>
 <div class="muted">${T('Las de 🔒 las usa la app y no se pueden editar ni eliminar.')}</div><div class="grid"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button></div>`;dlg().showModal()}
// diálogo de nombre (con emoji opcional) + campos extra
function nameDlg({title,name='',emoji,extra='',onOk}){window._ndOk=onOk;
 dlg().innerHTML=`<h2>${esc(title)}</h2><input id="ndn" value="${esc(name)}" placeholder="${T('Nombre')}" style="width:100%;margin-bottom:8px">
 ${emoji!==undefined?`<div style="display:flex;gap:8px;align-items:center"><input id="nde" value="${esc(emoji)}" placeholder="${T('Emoji')}" maxlength="4" style="width:70px;font-size:22px;text-align:center"><span class="muted">${T('Toca uno o escribe el tuyo')}</span></div>
 <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin:8px 0">${EMOJIS.map(x=>`<button class="sec" style="font-size:20px;padding:4px 0;min-height:38px" onclick="document.getElementById('nde').value='${x}'">${x}</button>`).join('')}</div>`:''}${extra}
 <div class="grid" style="margin-top:10px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="ndok" onclick="_ndGo()">${T('Guardar')}</button></div>`;dlg().showModal();setTimeout(()=>document.getElementById('ndn')?.focus(),50)}
function _ndGo(){const n=document.getElementById('ndn').value.trim().replace(/\s+/g,' ');if(!n)return alert(T('Pon un nombre'));const e=document.getElementById('nde');
 if(window._ndOk({n,em:e?(e.value.trim()||'🏷️'):null})!==false){save();dlg().close();render();toast(T('Guardado'))}}
const same=(a,b)=>(a||'').trim().toLowerCase()===(b||'').trim().toLowerCase();
const eachMonth=fn=>keys().forEach(k=>fn(S.months[k],k));
// mover usos y borrar (lista de destinos)
function moveDlg(label,n,opts,onMove){window._mvGo=onMove;dlg().innerHTML=`<h2>${esc(label)}</h2><div class="muted" style="margin-bottom:8px">${T('Se usa en {0} movimiento(s). Elige a cuál moverlos:',n)}</div>
 <div class="chips" id="mvx">${opts.map(o=>`<button class="chip" data-v="${esc(o)}" onclick="document.querySelectorAll('#mvx .chip').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${esc(DN(o))}</button>`).join('')}</div>
 <div class="grid" style="margin-top:10px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button style="background:#b91c1c" onclick="const v=document.querySelector('#mvx .chip.on')?.dataset.v;if(!v)return alert(T('Elige una categoría'));_mvGo(v);save();dlg().close();render();toast(T('Eliminado'))">${T('Mover y eliminar')}</button></div>`;dlg().showModal()}
// 1) conceptos de ingreso
const INC_LOCK=c=>isCB(c)||c==='💵 Propinas'||c===KAL||c==='📦 Otros'||c==='💼 Cheque';
const incUses=c=>{let n=0;eachMonth(m=>m.events.forEach(e=>{if(e.type==='income'&&e.concept===c)n++}));return n};
CTL.inc={title:()=>'💵 '+T('Conceptos de ingreso'),items:()=>S.incCats.map(c=>({label:DN(c),lock:INC_LOCK(c),sub:incUses(c)?T('en uso')+': '+incUses(c):''})),
 add(){nameDlg({title:T('Nuevo'),emoji:'',onOk:({n,em})=>{const c=em+' '+n;if(S.incCats.some(x=>same(catSplit(x)[1],n)||same(catSplit(DN(x))[1],n))){alert(T('Ya existe'));return false}const i=S.incCats.indexOf('📦 Otros');S.incCats.splice(i<0?S.incCats.length:i,0,c)}})},
 edit(i){const c=S.incCats[i];if(INC_LOCK(c))return;const[em]=catSplit(c);nameDlg({title:T('Editar'),name:catSplit(DN(c))[1],emoji:em,onOk:({n,em})=>{const nc=em+' '+n;if(nc===c)return;
  if(S.incCats.some(x=>x!==c&&(same(catSplit(x)[1],n)||same(catSplit(DN(x))[1],n)))){alert(T('Ya existe'));return false}
  eachMonth(m=>m.events.forEach(e=>{if(e.type==='income'&&e.concept===c){if(e.desc===c.replace(/^\S+\s/,''))e.desc=n;e.concept=nc}}));S.incCats[i]=nc}})},
 del(i){const c=S.incCats[i];if(INC_LOCK(c))return;const u=incUses(c);
  if(!u){if(!confirm(T('¿Eliminar {0}?',DN(c))))return;S.incCats.splice(i,1);save();dlg().close();render();return}
  moveDlg(DN(c),u,S.incCats.filter(x=>x!==c),to=>{eachMonth(m=>m.events.forEach(e=>{if(e.type==='income'&&e.concept===c)e.concept=to}));S.incCats=S.incCats.filter(x=>x!==c)})}};
// 2) cuentas de dinero y 3) tarjetas (catálogo = líneas del mes vivo; renombrar actualiza todos los meses y referencias)
function renameLine(kind,oldN,newN){const pre=kind==='cards'?'card:':'money:',om=pre+oldN,nm=pre+newN;
 eachMonth(m=>{(m[kind]||[]).forEach(x=>{if(x.name===oldN)x.name=newN});
  const fx=o=>{if(o&&o.method===om)o.method=nm};m.personal.forEach(fx);m.purchases.forEach(fx);
  m.events.forEach(e=>{fx(e);if(kind==='cards'){if(e.card===oldN)e.card=newN;if(e.type==='cardpay'&&e.desc==='Pago '+oldN)e.desc='Pago '+newN}
   else{if(e.type==='todebit'&&e.desc==='Transferencia a débito ('+oldN+')')e.desc='Transferencia a débito ('+newN+')'}
   if(e.type==='adjust'&&e.lineKind===kind&&e.lineName===oldN)e.lineName=newN})});
 if(kind==='cards'&&S.cardDue[oldN]!==undefined){S.cardDue[newN]=S.cardDue[oldN];delete S.cardDue[oldN]}
 Object.values(RS()).forEach(x=>{if(x.method===om)x.method=nm})}
const lineDup=(kind,n,except)=>L()[kind].some(x=>x!==except&&(same(x.name,n)||same(DN(x.name),n)));
function lineCtl(kind){return {title:()=>kind==='cards'?'💳 '+T('Tarjetas'):'🏦 '+T('Cuentas (dinero)'),
 hint:()=>T('Los cambios de nombre se aplican a todos los meses.'),
 items:()=>L()[kind].map(x=>({label:DN(x.name)||'—',sub:f(+x.amount||0)+(kind==='cards'&&S.cardDue[x.name]?' · '+T('vence día {0}',S.cardDue[x.name]):'')+(kind==='income'&&x===debE(L())?' · '+DN('Débito'):''),nodel:kind==='income'&&x===debE(L())})),
 add(){S.cur=keys().at(-1);if(kind==='cards'){nameDlg({title:T('Nuevo'),extra:`<label>${T('Día de vencimiento (1–31)')}<input id="ndd" type="number" min="1" max="31" inputmode="numeric"></label>`,onOk:({n})=>{if(lineDup('cards',n)){alert(T('Ya existe'));return false}
   const d=+document.getElementById('ndd').value;L().cards.push({id:uid(),name:DNrev(n),amount:0});if(d>=1&&d<=31)S.cardDue[DNrev(n)]=d}})}else newLineDlg('income')},
 edit(i){const x=L()[kind][i];if(!x)return;nameDlg({title:T('Editar'),name:DN(x.name),extra:kind==='cards'?`<label>${T('Día de vencimiento (1–31)')}<input id="ndd" type="number" min="1" max="31" inputmode="numeric" value="${S.cardDue[x.name]||''}"></label>`:'',
  onOk:({n})=>{const nn=DNrev(n);if(nn!==x.name){if(lineDup(kind,n,x)){alert(T('Ya existe'));return false}renameLine(kind,x.name,nn)}
   if(kind==='cards'){const d=+document.getElementById('ndd').value;if(d>=1&&d<=31)S.cardDue[nn]=d;else delete S.cardDue[nn]}}})},
 del(i){S.cur=keys().at(-1);const x=L()[kind][i];if(!x)return;if(kind==='income'&&x===debE(L()))return alert(T('Esta línea no se puede eliminar.'));delAsk(kind,x.id)}}}
CTL.money=lineCtl('income');CTL.cards=lineCtl('cards');
// 4) cuentas de Tony (plantilla = mes vivo)
function billExtra(b){const cur=b?billCat(b):'📦 Otros';return `<label style="display:flex;align-items:center;gap:8px;margin:6px 0"><input type="checkbox" id="ndf" style="width:auto;transform:scale(1.3)" ${b&&b.fixed?'checked':''}> ${T('Fija')} <span class="muted">(${T('“Fija” pasa su monto al mes siguiente; “Var.” empieza en 0')})</span></label>
 <div class="muted">${T('Categoría')}</div><div class="chips" id="ndc">${S.cats.filter(c=>c!=='🤝 Tony').map(c=>`<button class="chip ${c===cur?'on':''}" data-c="${esc(c)}" onclick="document.querySelectorAll('#ndc .chip').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${esc(DN(c))}</button>`).join('')}</div>`}
CTL.bills={title:()=>'🧾 '+T('Cuentas de Tony'),hint:()=>T('Los cambios de nombre se aplican a todos los meses.'),
 items:()=>L().bills.map(b=>({label:DN(b.name)||'—',sub:`${billCat(b).split(' ')[0]} ${DN(billCat(b)).replace(/^\S+\s/,'')} · ${b.fixed?T('Fija'):T('Var.')}`})),
 add(){nameDlg({title:T('Nuevo'),extra:billExtra(null),onOk:({n})=>{if(L().bills.some(x=>same(x.name,n)||same(DN(x.name),n))){alert(T('Ya existe'));return false}
  L().bills.push({id:uid(),name:DNrev(n),amount:0,fixed:document.getElementById('ndf').checked,cat:document.querySelector('#ndc .chip.on')?.dataset.c||'📦 Otros'})}})},
 edit(i){const b=L().bills[i];if(!b)return;nameDlg({title:T('Editar'),name:DN(b.name),extra:billExtra(b),onOk:({n})=>{const nn=DNrev(n),old=b.name;
  if(nn!==old&&L().bills.some(x=>x!==b&&(same(x.name,n)||same(DN(x.name),n)))){alert(T('Ya existe'));return false}
  const cat=document.querySelector('#ndc .chip.on')?.dataset.c,fx=document.getElementById('ndf').checked;b.fixed=fx;if(cat&&cat!==billCat(b))b.cat=cat;
  if(nn!==old)eachMonth(m=>m.bills.forEach(x=>{if(x.name===old){if(!x.cat)x.cat=billCat(x);x.name=nn}}))}})},
 del(i){const b=L().bills[i];if(!b)return;if((+b.amount||0)>0.004||(+b.paid||0)>0.004)return alert(T('{0} tiene monto este mes. Ponlo en 0 en Mes antes de eliminar.',DN(b.name)));
  if(!confirm(T('¿Eliminar {0}?',DN(b.name))))return;L().bills.splice(i,1);save();dlg().close();render()}};
// 5) personas, 6) tiendas, 7) destinatarios
const PPL_LOCK=p=>['Yo','Tony','Carlos'].includes(p);
const pplUses=p=>{let n=0;eachMonth(m=>m.purchases.forEach(x=>{if(+((x.shares||{})[p])||(x.who||[]).includes(p))n++}));return n};
CTL.people={title:()=>'👥 '+T('Personas'),items:()=>S.people.map(p=>({label:DN(p),lock:PPL_LOCK(p)})),
 add(){nameDlg({title:T('Nuevo'),onOk:({n})=>{if(S.people.some(x=>same(x,n)||same(DN(x),n))){alert(T('Ya existe'));return false}S.people.push(n)}})},
 edit(i){const p=S.people[i];if(PPL_LOCK(p))return;nameDlg({title:T('Editar'),name:p,onOk:({n})=>{if(n===p)return;if(S.people.some(x=>x!==p&&(same(x,n)||same(DN(x),n)))){alert(T('Ya existe'));return false}
  eachMonth(m=>m.purchases.forEach(x=>{if(x.shares&&p in x.shares){x.shares[n]=x.shares[p];delete x.shares[p]}if(x.who)x.who=x.who.map(w=>w===p?n:w)}));S.people[i]=n}})},
 del(i){const p=S.people[i];if(PPL_LOCK(p))return;if(pplUses(p))return alert(T('{0} se usa en compras compartidas y no se puede eliminar.',p));if(!confirm(T('¿Eliminar {0}?',p)))return;S.people.splice(i,1);save();dlg().close();render()}};
function simpleCtl(key,icon,title,hint,ren){return {title:()=>icon+' '+T(title),hint:hint&&(()=>T(hint)),items:()=>(S[key]||[]).map(s=>({label:s})),
 add(){nameDlg({title:T('Nuevo'),onOk:({n})=>{S[key]=S[key]||[];if(S[key].some(x=>same(x,n))){alert(T('Ya existe'));return false}S[key].push(n)}})},
 edit(i){const s=S[key][i];nameDlg({title:T('Editar'),name:s,onOk:({n})=>{if(n===s)return;if(S[key].some(x=>x!==s&&same(x,n))){alert(T('Ya existe'));return false}ren(s,n);S[key][i]=n}})},
 del(i){const s=S[key][i];if(!confirm(T('¿Eliminar {0}?',s)))return;S[key].splice(i,1);save();dlg().close();render()}}}
CTL.stores=simpleCtl('stores','🏪','Tiendas','Quitarla de la lista no borra las compras que ya la usan.',(o,n)=>{eachMonth(m=>m.purchases.forEach(p=>{if(p.store===o)p.store=n}));const k=memK(o);if(RS()[k]){RS()[memK(n)]={...RS()[k],name:n};delete RS()[k]}});
CTL.recips=simpleCtl('recipients','💸','Destinatarios de envíos','',(o,n)=>eachMonth(m=>m.personal.forEach(x=>{if(x.recipient===o)x.recipient=n})));
const _cfg=cfg;cfg=function(){let o=_cfg();
 o=o.replace(/<div class="card"><h2>[^<]*<\/h2><div class="muted">[^<]*<\/div><textarea[\s\S]*?<\/textarea><\/div>/,'');
 o=o.replace(/\s*<div class="card"><h2>[^<]*<\/h2><input class="name" value="[^"]*" onchange="S\.(people|stores)=[^"]*"><\/div>/g,'');
 o=o.replace(/<div class="card"><h2>([^<]*)<\/h2><button class="del"/,'<div class="card defcol" id="datacard"><h2>🗂️ '+T('Datos')+'</h2><button class="del"');
 const b=budCfg().replace('🎯 '+T('Presupuesto mensual'),'🏷️ '+T('Categorías y presupuesto'));
 const cat=`<div class="muted" style="margin:14px 4px 6px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${T('Catálogos')}</div>`+b+['inc','money','cards','bills','people','stores','recips'].map(ctlCard).join('');
 o=o.replace(budCfg(),'');const mk=T('Se guarda solo en este dispositivo.')+'</div></div>',i=o.indexOf(mk)+mk.length;
 return o.slice(0,i)+cat+o.slice(i)+`<div class="muted" id="appver" style="text-align:center;margin:14px 0">${T('Versión')} ${APP_V}</div>`};
const _render=render;render=function(){if(tab==='cue'||tab==='com')tab='mov';return _render.apply(this,arguments)};
