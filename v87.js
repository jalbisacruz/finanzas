// v87: 🤝 Dinero de terceros. Dinero de otra persona que entra a una cuenta de Joe (p. ej. $152 de un amigo en el débito) y que él va
// enviando por partes. No es ingreso ni gasto: no entra en ingresos, gastos, presupuestos, plan, Kalshi, reembolsos ni reportes.
// Guardado en S.held (en el estado: viaja con respaldos, restaurar y sincronización). Cada depósito sube la cuenta; cada envío la baja.
// Mi balance: lo pendiente va como línea en «Lo que debo» (está en tu débito pero no es tuyo). Disponible ahora/proyectado lo excluyen.
Object.assign(EN,{"🤝 Dinero de terceros":"🤝 Money held for others","Dinero de terceros":"Money held for others","Dinero de otras personas que está en tu cuenta y vas a enviar. No es ingreso ni gasto.":"Other people's money that's in your account and you'll send on. Not income, not an expense.",
 "+ Nuevo depósito":"+ New deposit","Nuevo depósito":"New deposit","Editar depósito":"Edit deposit","Persona / descripción":"Person / description","Ej.: Mi amigo":"E.g. My friend","Monto $":"Amount $","Fecha":"Date","Cuenta":"Account","Nota (opcional)":"Note (optional)",
 "Cómo lo recibí":"How I received it","Cómo lo envié":"How I sent it","Otro":"Other","Efectivo":"Cash","Transferencia bancaria":"Bank transfer",
 "Pendiente por enviar: {0} de {1}":"Left to send: {0} of {1}","📤 Enviar parte":"📤 Send part","Enviar parte · {0}":"Send part · {0}","Editar envío":"Edit transfer","✏️ Editar":"✏️ Edit","Depósito":"Deposit","Enviado":"Sent","Enviado a {0}":"Sent to {0}","Depósito de {0}":"Deposit from {0}",
 "✅ Completado":"✅ Completed","✅ Completados ({0})":"✅ Completed ({0})","📦 Archivar":"📦 Archive","📦 Archivados ({0})":"📦 Archived ({0})","Desarchivar":"Unarchive","Sin dinero de terceros.":"No money held for others.",
 "Pon un nombre o descripción":"Enter a name or description","No puedes enviar más de lo pendiente ({0})":"You can't send more than what's left ({0})","Ya enviaste {0}; el monto no puede ser menor.":"You already sent {0}; the amount can't be lower.",
 "No alcanza en {0}. Disponible: {1}":"Not enough in {0}. Available: {1}","¿Borrar el depósito de {0}? Se quita {1} de {2} (lo que queda sin enviar).":"Delete the deposit from {0}? {1} is taken out of {2} (what's still unsent).",
 "¿Borrar este envío de {0}? Vuelve {1} a {2}.":"Delete this transfer of {0}? {1} goes back to {2}.","Depósito guardado":"Deposit saved","Envío registrado":"Transfer recorded","Borrado":"Deleted",
 "Tuyo: {0} · sin {1} de terceros":"Yours: {0} · without {1} held for others","Incluye dinero de terceros":"Includes money held for others","Disponible ahora sin dinero de terceros":"Available now without money held for others"});
const HELD_CAT='🤝 Dinero de terceros',VIAS=['Western Union','Zelle','Efectivo','Transferencia bancaria','Otro'];
const HL=()=>S.held||[];  // datos viejos sin S.held = lista vacía (no se toca el estado hasta que hay un depósito)
const hSent=e=>r2((e.sends||[]).reduce((s,x)=>s+(+x.amount||0),0)),hPend=e=>r2((+e.amount||0)-hSent(e));
window.heldPend=()=>r2(HL().reduce((s,e)=>s+Math.max(0,hPend(e)),0));
const hAcctN=m=>methName(m||'deb').replace(/<[^>]*>/g,'');
const hLine=m=>{const L2=L();return m&&m.startsWith('money:')?L2.income.find(x=>x.name===m.slice(6)):debE(L2)};
function hNoFunds(method,out){if(!(out>0.004))return false;if((method||'deb')==='deb')return noDeb(out);const ln=hLine(method),av=r2(+(ln&&ln.amount)||0);
 if(r2(out)>av+0.004){alert(T('No alcanza en {0}. Disponible: {1}',hAcctN(method),f(av)));return true}return false}
const viaSel=(id,cur)=>`<select id="${id}" aria-label="${T('Cómo')}">${VIAS.map(v=>`<option value="${esc(v)}"${v===cur?' selected':''}>${esc(T(v))}</option>`).join('')}${cur&&!VIAS.includes(cur)?`<option selected>${esc(cur)}</option>`:''}</select>`;
// ---------- calc: Mi balance ----------
const _calcV87=calc;calc=function(m){const r=_calcV87(m);if(m&&m===L()){const h=heldPend();if(h>0.004){r.held=h;r.debt=r2(r.debt+h);r.bal=r2(r.bal-h)}}return r};
// Mi balance (detalle): línea propia bajo «Lo que debo»
const _balBoxV87=balBox;balBox=function(){let o=_balBoxV87();const c=calc(L());if(c.held&&o.includes('id="baldet"')){
 o=o.replace(/(<div class="row bsub"><span class="n">[^<]*<\/span><span>[^<]*<\/span><\/div>)(?![\s\S]*<div class="row bsub">)/,`$1<div class="row bsub" id="balheld"><span class="n">${T('Dinero de terceros')}</span><span>${f(c.held)}</span></div>`)}return o};
// Disponible ahora: sin lo de terceros (la línea de cuentas sigue mostrando lo que hay en el banco)
// v88: el número grande es lo REAL en tu cuenta (incluye terceros); debajo, lo que es tuyo
const _heroV87=hero;hero=function(){let o=_heroV87();const h=heldPend();if(!(h>0.004))return o;const m=L(),disp=r2(sum(m.income,x=>x.amount)),mine=r2(disp-h);
 return o.replace(/<div class="big xl ([^"]*)">([^<]*)<\/div>/,(_,cl,v)=>`<div class="big xl ${cl}" id="dispv" title="${T('Incluye dinero de terceros')}">${v}</div><div id="heldnote" style="font-size:15.5px;font-weight:600;color:#e0e7ff;margin:2px 0 4px;line-height:1.3">${T('Tuyo: {0} · sin {1} de terceros',`<b style="color:#fff">${f(mine)}</b>`,f(h))}</div>`)};
// ---------- Operaciones › 🤝 Dinero de terceros ----------
let HELD_OPEN=null;
function heldRow(e){const p=hPend(e),done=p<=0.004,sent=hSent(e),pct=e.amount>0?Math.min(100,sent/e.amount*100):0;
 const H=[{k:'d',date:e.date,a:+e.amount,at:e.at||0,via:e.via,note:e.note},...(e.sends||[]).map(s=>({k:'s',id:s.id,date:s.date,a:-s.amount,at:s.at||0,via:s.via,note:s.note}))].sort((x,y)=>cmpS(dKey(y.date),dKey(x.date))||(y.at-x.at));
 return `<div class="hcard" data-id="${e.id}" style="border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin:10px 0;background:${done?'#f0fdf4':'#faf5ff'}">
 <div class="row" style="border:0;padding:0"><span class="n"><b style="font-size:16px">${esc(e.who)}</b><div class="muted">${esc(hAcctN(e.method))}${e.via?' · '+esc(T(e.via)):''}</div></span>${done?`<b class="pos">${T('✅ Completado')}</b>`:''}</div>
 <div class="hpend" style="font-size:18px;font-weight:700;margin:6px 0 4px;color:${done?'#15803d':'#6d28d9'}">${T('Pendiente por enviar: {0} de {1}',f(Math.max(0,p)),f(e.amount))}</div>
 <div class="bt"><div style="width:${Math.max(2,pct)}%;background:${done?'#16a34a':'#7c3aed'}"></div></div>
 ${e.note?`<div class="muted" style="margin-top:4px">${esc(e.note)}</div>`:''}
 <div class="grid" style="margin-top:8px">${done?(e.archived?`<button class="sec" onclick="heldArch('${e.id}',false)">${T('Desarchivar')}</button>`:`<button class="sec" id="harch-${e.id}" onclick="heldArch('${e.id}',true)">${T('📦 Archivar')}</button>`):`<button id="hsend-${e.id}" onclick="sendDlg('${e.id}')">${T('📤 Enviar parte')}</button>`}<button class="sec" id="hedit-${e.id}" onclick="heldDlg('${e.id}')">${T('✏️ Editar')}</button></div>
 <div class="hhist" style="margin-top:6px">${H.map(x=>`<div class="row" ${x.k==='s'?`onclick="if(!event.target.closest('button'))sendDlg('${e.id}','${x.id}')" role="button"`:''}><span class="n">${x.k==='d'?T('Depósito'):T('Enviado')} · ${esc(T(x.via||'—'))}<div class="muted">${fdate(x.date)}${x.note?' · '+esc(x.note):''}</div></span><b class="${x.a>0?'pos':''}">${x.a>0?'+':'−'}${f(Math.abs(x.a))}</b>${x.k==='s'?`<button class="del" aria-label="✕" onclick="sendDel('${e.id}','${x.id}')">✕</button>`:''}</div>`).join('')}</div></div>`}
function opsHeld(){const all=HL(),act=all.filter(e=>hPend(e)>0.004),done=all.filter(e=>hPend(e)<=0.004&&!e.archived),arch=all.filter(e=>hPend(e)<=0.004&&e.archived),byN=a=>byNew(a);
 return `<div class="card defcol" id="heldcard"><h2>${T('🤝 Dinero de terceros')}<span>${f(heldPend())}</span></h2><div class="muted">${T('Dinero de otras personas que está en tu cuenta y vas a enviar. No es ingreso ni gasto.')}</div>
 <button id="heldnew" style="width:100%;margin-top:8px" onclick="heldDlg()">${T('+ Nuevo depósito')}</button>
 ${byN(act).map(heldRow).join('')||(done.length||arch.length?'':`<div class="muted" style="margin-top:8px">${T('Sin dinero de terceros.')}</div>`)}
 ${done.length?`<details id="helddone" style="margin-top:8px"><summary>${T('✅ Completados ({0})',done.length)}</summary>${byN(done).map(heldRow).join('')}</details>`:''}
 ${arch.length?`<details id="heldarch" style="margin-top:8px"><summary class="muted">${T('📦 Archivados ({0})',arch.length)}</summary>${byN(arch).map(heldRow).join('')}</details>`:''}</div>`}
mov=function(){return opsTodo()+opsCompras()+opsIngresos()+`<div class="muted opsh">🏦 ${T('Banco')}</div>`+opsDeb()+opsCred()+opsHeld()+opsMov()+opsBills()};
// ---------- ventanas ----------
function heldDlg(id){const e=id?HL().find(x=>x.id===id):null,acct=e?e.method||'deb':'deb',names=[...new Set(HL().map(x=>x.who))];
 dlg().innerHTML=`<h2>🤝 ${e?T('Editar depósito'):T('Nuevo depósito')}</h2>
 <label>${T('Persona / descripción')}<input id="hwho" class="name" list="hwhol" value="${esc(e?e.who:'')}" placeholder="${T('Ej.: Mi amigo')}"></label><datalist id="hwhol">${names.map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
 <label>${T('Monto $')}<input id="hamt" type="number" inputmode="decimal" step="0.01" value="${e?e.amount:''}" style="font-size:22px"></label>
 <div class="grid"><label>${T('Fecha')}<input id="hdate" type="date" value="${esc(e?e.date:today())}"></label><label>${T('Cuenta')}<select id="hacct">${methOpt(e).map(([v,l])=>`<option value="${esc(v)}"${v===acct?' selected':''}>${esc(l)}</option>`).join('')}</select></label></div>
 <label>${T('Cómo lo recibí')}${viaSel('hvia',e?e.via:'Western Union')}</label>
 <label>${T('Nota (opcional)')}<input id="hnote" class="name" value="${esc(e&&e.note||'')}"></label>
 ${e&&hSent(e)>0?`<div class="muted">${T('Ya enviaste {0}; el monto no puede ser menor.',f(hSent(e)))}</div>`:''}
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="hsave" onclick="heldSave(${e?`'${e.id}'`:''})">${T('Guardar')}</button></div>
 ${e?`<button class="del" id="hdel" style="width:100%;margin-top:8px" onclick="heldDel('${e.id}')">${T('Borrar')}</button>`:''}`;if(!dlg().open)dlg().showModal()}
function heldSave(id){const g=k=>document.getElementById(k).value,who=g('hwho').trim(),a=r2(g('hamt')),date=g('hdate')||today(),method=g('hacct')||'deb',via=g('hvia'),note=g('hnote').trim();
 if(!who)return alert(T('Pon un nombre o descripción'));if(!(a>0))return alert(T('Pon un monto'));
 if(!id){spend(method,-a);(S.held=S.held||[]).push({id:uid(),who,amount:a,date,method,via,note,at:Date.now(),sends:[]});save();dlg().close();render();toast(T('Depósito guardado'));return}
 const e=HL().find(x=>x.id===id);if(!e)return;const sent=hSent(e);if(a<sent-0.004)return alert(T('Ya enviaste {0}; el monto no puede ser menor.',f(sent)));
 const om=e.method||'deb',oNet=r2((+e.amount||0)-sent),nNet=r2(a-sent);
 if(om===method){if(hNoFunds(om,r2(oNet-nNet)))return}else if(hNoFunds(om,oNet))return;
 spend(om,oNet);spend(method,-nNet);Object.assign(e,{who,amount:a,date,method,via,note});save();dlg().close();render();toast(T('Depósito guardado'))}
function heldDel(id){const e=HL().find(x=>x.id===id);if(!e)return;const net=Math.max(0,hPend(e)),m=e.method||'deb';
 if(!confirm(T('¿Borrar el depósito de {0}? Se quita {1} de {2} (lo que queda sin enviar).',e.who,f(net),hAcctN(m))))return;if(hNoFunds(m,net))return;
 spend(m,net);S.held=HL().filter(x=>x.id!==id);save();if(dlg().open)dlg().close();render();toast(T('Borrado'))}
function heldArch(id,on){const e=HL().find(x=>x.id===id);if(!e)return;if(on)e.archived=true;else delete e.archived;save();render()}
function sendDlg(eid,sid){const e=HL().find(x=>x.id===eid);if(!e)return;const s=sid?(e.sends||[]).find(x=>x.id===sid):null,max=r2(hPend(e)+(s?+s.amount:0));
 dlg().innerHTML=`<h2>📤 ${s?T('Editar envío'):T('Enviar parte · {0}',esc(e.who))}</h2><div class="muted">${T('Pendiente por enviar: {0} de {1}',f(hPend(e)),f(e.amount))} · ${esc(hAcctN(e.method))}</div>
 <label>${T('Monto $')}<input id="hsa" type="number" inputmode="decimal" step="0.01" value="${s?s.amount:''}" placeholder="${r2(max)}" style="font-size:22px"></label>
 <div class="grid"><label>${T('Fecha')}<input id="hsd" type="date" value="${esc(s?s.date:today())}"></label><label>${T('Cómo lo envié')}${viaSel('hsv',s?s.via:'Zelle')}</label></div>
 <label>${T('Nota (opcional)')}<input id="hsn" class="name" value="${esc(s&&s.note||'')}"></label>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="hssave" onclick="sendSave('${eid}'${s?`,'${s.id}'`:''})">${T('Guardar')}</button></div>
 ${s?`<button class="del" id="hsdel" style="width:100%;margin-top:8px" onclick="sendDel('${eid}','${s.id}')">${T('Borrar')}</button>`:''}`;if(!dlg().open)dlg().showModal()}
function sendSave(eid,sid){const e=HL().find(x=>x.id===eid);if(!e)return;const g=k=>document.getElementById(k).value,a=r2(g('hsa')),date=g('hsd')||today(),via=g('hsv'),note=g('hsn').trim(),m=e.method||'deb';
 e.sends=e.sends||[];const s=sid?e.sends.find(x=>x.id===sid):null,old=s?+s.amount:0,max=r2(hPend(e)+old);
 if(!(a>0))return alert(T('Pon un monto'));if(a>max+0.004)return alert(T('No puedes enviar más de lo pendiente ({0})',f(max)));if(hNoFunds(m,r2(a-old)))return;
 spend(m,r2(a-old));if(s)Object.assign(s,{amount:a,date,via,note});else e.sends.push({id:uid(),amount:a,date,via,note,at:Date.now()});
 if(hPend(e)>0.004)delete e.archived;save();dlg().close();render();toast(T('Envío registrado'))}
function sendDel(eid,sid){const e=HL().find(x=>x.id===eid),s=e&&(e.sends||[]).find(x=>x.id===sid);if(!s)return;const m=e.method||'deb';
 if(!confirm(T('¿Borrar este envío de {0}? Vuelve {1} a {2}.',f(s.amount),f(s.amount),hAcctN(m))))return;
 spend(m,-s.amount);e.sends=e.sends.filter(x=>x.id!==sid);delete e.archived;save();if(dlg().open)dlg().close();render();toast(T('Borrado'))}
// ---------- Movimientos: 🤝, lo más nuevo primero; ✕ revierte igual que en la sección ----------
const _movesV87=moves;moves=function(m){const r=_movesV87(m),MK=Object.keys(S.months).find(k=>S.months[k]===m)||'',inM=d=>MK&&dKey(d).slice(0,7)===MK,add=[];
 HL().forEach(e=>{if(inM(e.date))add.push({id:'hd:'+e.id,kind:'held',date:e.date,amount:+e.amount,cat:HELD_CAT,desc:'🤝 '+T('Depósito de {0}',e.who)+(e.via?' · '+T(e.via):''),method:e.method||'deb',at:e.at||0});
  (e.sends||[]).forEach(s=>{if(inM(s.date))add.push({id:'hs:'+e.id+':'+s.id,kind:'heldsend',date:s.date,amount:-s.amount,cat:HELD_CAT,desc:'🤝 '+T('Enviado a {0}',e.who)+(s.via?' · '+T(s.via):''),method:e.method||'deb',at:s.at||0})})});
 if(!add.length)return r;add.sort((x,y)=>(y.at||0)-(x.at||0));return [...add,...r].sort((a,b)=>cmpS(dKey(b.date),dKey(a.date)))};
const _delMoveV87=delMove;delMove=function(kind,id){if(kind==='held')return heldDel(id.slice(3));if(kind==='heldsend'){const p=id.split(':');return sendDel(p[1],p[2])}return _delMoveV87(kind,id)};
