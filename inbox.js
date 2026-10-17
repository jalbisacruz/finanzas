// v72: compras enviadas desde los enlaces (shares/{token}/inbox/{id}). Joe las revisa: Aceptar / Editar / Rechazar.
// Una compra con p.paidBy (quién compró) NO toca los saldos de Joe (method '') y no entra en "Por cobrar":
// Joe le debe su parte a quien compró ("Le debes"). La compensación (netting) queda pendiente de que Joe decida.
Object.assign(EN,{"📥 Compras por revisar ({0})":"📥 Purchases to review ({0})","Compró: {0}":"Bought by: {0}","Enviada desde el enlace de {0}":"Sent from {0}'s link",
 "Rechazar":"Reject","¿Rechazar esta compra? Se borra del buzón.":"Reject this purchase? It will be removed from the inbox.","Compra rechazada":"Purchase rejected",
 "No toca tus cuentas: la pagó {0}. Tu parte es lo que le debes.":"Doesn't touch your accounts: {0} paid. Your share is what you owe them.",
 "No toca tus cuentas: la pagó {0}. Tu parte se suma a las Cuentas de Tony (Comida).":"Doesn't touch your accounts: {0} paid. Your share is added to Tony's bills (Food).","Compras que pagaron otros este mes (tu parte)":"Purchases others paid this month (your share)",
 "Pagada por otra persona: no entra en el Total del mes. Si compró Tony o Arianna, la parte de Joe va a las Cuentas de Tony (Comida).":"Paid by someone else: not in the Month total. If Tony or Arianna bought it, Joe's share goes to Tony's bills (Food).",
 "Revisar":"Review","Pendiente entre Tony y Carlos ({0})":"Pending between Tony and Carlos ({0})","✅ Marcar pagado":"✅ Mark paid","Marcado como pagado":"Marked as paid","{0} dice que ya pagó a {1}":"{0} says they paid {1}","− Mi parte de tus compras":"− My share of your purchases","Te debo":"I owe you","− Parte de Joe en compras de Carlos":"− Joe's share of Carlos's purchases","Le debes a Carlos (neto)":"You owe Carlos (net)","Le debes a {0}":"You owe {0}","{0} le debe a {1}":"{0} owes {1}","entre ellos":"between them","Comida: {0} escrito + {1} de compras de Tony/Arianna = {2}":"Food: {0} typed + {1} from Tony/Arianna purchases = {2}","incl. {0} de compras de Tony/Arianna":"incl. {0} from Tony/Arianna purchases","🛒 Comida (compras de Tony/Arianna)":"🛒 Food (Tony/Arianna purchases)","🧾 Deudas de compras":"🧾 Purchase debts","Sin compras por revisar.":"Nothing to review."});
let INBOX=[],inboxAt=0;
async function inboxLoad(force){if(!(window.fbUser&&fbUser())||!window.fbInbox)return;if(!force&&Date.now()-inboxAt<60000)return;inboxAt=Date.now();
 const L=S.links||{},out=[];for(const w of ['Tony','Carlos']){const x=L[w];if(!x||!x.on||!x.t)continue;try{(await fbInbox(x.t)).forEach(d=>out.push({...d,link:w}))}catch(e){console.warn('inbox',e)}}
 const ch=JSON.stringify(out.map(x=>x.id))!==JSON.stringify(INBOX.map(x=>x.id));INBOX=out;if(ch&&typeof tab!=='undefined'&&tab==='ini')render()}
const inbStr=(v,n)=>String(v??'').slice(0,n);
function inboxOpen(id){const x=INBOX.find(y=>y.id===id);if(!x)return;editP();const cats=pCats(),ok3=['Yo','Tony','Carlos'];
 D.store=inbStr(x.store,60)||D.store;if(/^\d{4}-\d{2}-\d{2}$/.test(x.date||''))D.date=x.date;D.total=r2(+x.total||0);if(+x.tax>0&&+x.tax<D.total)D.tax=r2(+x.tax);
 D.list=(Array.isArray(x.items)?x.items:[]).slice(0,50).filter(i=>+i.a>0).map(i=>{const own=(Array.isArray(i.own)?i.own:[]).filter(w=>ok3.includes(w));const c=cats.includes(i.c)?i.c:null;return {a:r2(i.a),n:inbStr(i.n,40),own:own.length?own:ok3,...(c?{c}:{})}});
 D._io=D.list.length>0;D.paidBy=inbStr(x.by,20);D.method='';D._inbox={t:x.t,id:x.id,link:x.link};recomputeEq();drawP()}
const _drawPV72=drawP;drawP=function(){_drawPV72();if(!D||!D.paidBy)return;D.method='';
 const sel=[...dlg().querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='deb'));if(sel){sel.value='';sel.disabled=true;sel.style.opacity=.5}
 dlg().querySelector('h2').insertAdjacentHTML('afterend',`<div id="inbbox" style="background:#fef9c3;border:1px solid #facc15;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:14px">
  <b>${T('Compró: {0}',esc(D.paidBy))}</b>${D._inbox?` · <span class="muted">${T('Enviada desde el enlace de {0}',esc(DN(D._inbox.link)))}</span>`:''}<div class="muted">${(TFAM.includes(D.paidBy)?T('No toca tus cuentas: la pagó {0}. Tu parte se suma a las Cuentas de Tony (Comida).',esc(D.paidBy)):T('No toca tus cuentas: la pagó {0}. Tu parte es lo que le debes.',esc(D.paidBy)))}</div>
  ${D._inbox?`<button class="del" id="inbrej" style="margin-top:6px;min-height:34px;font-size:14px" onclick="inboxReject()">${T('Rechazar')}</button>`:''}</div>`)};
async function inboxSettle(id,ok){const x=INBOX.find(y=>y.id===id);if(!x)return;if(ok&&S.months[x.month])tcSettle(x.month,inbStr(x.by,20));try{await fbInboxDel(x.t,x.id)}catch(e){console.warn(e)}INBOX=INBOX.filter(y=>y.id!==id);inboxList();render()}
async function inboxReject(){if(!D||!D._inbox||!confirm(T('¿Rechazar esta compra? Se borra del buzón.')))return;const x=D._inbox;try{await fbInboxDel(x.t,x.id)}catch(e){console.warn(e)}
 INBOX=INBOX.filter(y=>y.id!==x.id);dlg().close();toast(T('Compra rechazada'));render()}
const _savePV72=saveP;saveP=function(){const ib=D&&D._inbox;if(D){if(D.paidBy)D.method='';delete D._inbox}const r=_savePV72();if(!dlg().open){syncAllTFood();render()}
 if(ib){if(dlg().open&&D)D._inbox=ib;else{fbInboxDel(ib.t,ib.id).catch(e=>console.warn(e));INBOX=INBOX.filter(y=>y.id!==ib.id);render()}}return r};
// Por cobrar: las compras que pagó otra persona no se cobran desde las cuentas de Joe
// Decisión de Joe: si compra Tony o Arianna, la parte de Joe va a las Cuentas de Tony como "Comida" (sube lo que Joe le transfiere); la parte de Tony es suya.
// Si compra Carlos: la parte de Joe es "Le debes a Carlos". Lo que Carlos/Tony se deben entre ellos solo se muestra (decisión pendiente).
const TFAM=['Tony','Arianna'];
const paidOther=m=>(m&&m.purchases||[]).filter(p=>p.paidBy);
const tonyFood=m=>r2(paidOther(m).filter(p=>TFAM.includes(p.paidBy)).reduce((s,p)=>s+(+(p.shares||{}).Yo||0),0));
// v74 (pedido de Joe): NO hay línea aparte. La parte de Joe de las compras de Tony/Arianna se suma a la cuenta variable "Comida" que Tony ya tiene ese mes
// (empieza en 0 cada mes). b.tfood = parte automática ya incluida en b.amount; lo que Joe escribe a mano = b.amount − b.tfood.
const LEGACY_TF=/compras de Tony\/Arianna|Tony\/Arianna purchases/i;
const isLegacyTF=b=>!!b&&(b.id==='_tfood'||LEGACY_TF.test(String(b.name||'')));
const nmPlain=s=>String(s||'').replace(/^[^\p{L}\p{N}]+/u,'').trim();
const isComidaBill=b=>!!b&&!isLegacyTF(b)&&(/^(food|comida)$/i.test(nmPlain(b.name))||/^(food|comida)$/i.test(nmPlain(DN(b.name))));
function comidaBill(m,create){if(!m||!m.bills)return null;let b=m.bills.find(isComidaBill)||m.bills.find(x=>!isLegacyTF(x)&&!x.fixed&&billCat(x)==='🛒 Comida/Supermercado');
 if(!b&&create){b={id:uid(),name:'Food',amount:0,fixed:false,cat:'🛒 Comida/Supermercado'};m.bills.push(b)}return b||null}
const tfManual=b=>r2((+b.amount||0)-(+b.tfood||0));
function syncTFood(m){if(!m||!m.bills)return false;const a=tonyFood(m),b=comidaBill(m,a>0.004);if(!b)return false;
 const man=tfManual(b),old=r2(+b.tfood||0);if(a<=0.004){if(b.tfood===undefined)return false;delete b.tfood;b.amount=man;return true}
 if(old===a&&b.tfood!==undefined)return false;b.tfood=a;b.amount=r2(man+a);return true}
const syncAllTFood=()=>{let ch=false;Object.values(S.months||{}).forEach(m=>{if(syncTFood(m))ch=true});if(ch)save();return ch};
// cada guardado recalcula la Comida de Tony (editar, borrar o aceptar una compra la ajusta sola)
const _saveV74=save;save=function(){try{foldLegacyTF(S);Object.values((S&&S.months)||{}).forEach(syncTFood)}catch(e){console.warn('tfood',e)}return _saveV74.apply(this,arguments)};
// v74: lo que Joe escribe en Comida es su monto manual; la parte automática se suma encima
const _updV74=upd;upd=function(k,id,fld,val){const m=M(),b=k==='bills'&&fld==='amount'&&m.bills.find(x=>x.id===id);
 if(b&&+b.tfood>0){b.amount=r2(Math.max(0,r2(val))+(+b.tfood));save();render();return}return _updV74.apply(this,arguments)};
const billLbl=b=>DN(b.name)+(+b.tfood>0?' ('+T('incl. {0} de compras de Tony/Arianna',f(+b.tfood))+')':'');
const billInVal=x=>+x.tfood>0?(tfManual(x)||''):(x.amount||'');
const tfNote=x=>+x.tfood>0?`<div class="muted tfnote" style="font-size:12px;margin:-4px 0 6px 44px">🛒 ${T('Comida: {0} escrito + {1} de compras de Tony/Arianna = {2}',f(tfManual(x)),f(+x.tfood),f(+x.amount||0))}</div>`:'';
// v74: la línea aparte de v72/v73 (si quedó en los datos) se une a Comida, con respaldo antes y control de totales
function foldLegacyTF(st){if(!st||!st.months)return false;const ms=Object.values(st.months).filter(m=>(m.bills||[]).some(isLegacyTF));if(!ms.length)return false;
 const snap=JSON.parse(JSON.stringify(st));let ok=true;
 for(const m of ms){const before=r2(m.bills.reduce((s,b)=>s+(+b.amount||0),0)),leg=m.bills.filter(isLegacyTF),legA=r2(leg.reduce((s,b)=>s+(+b.amount||0),0));
  const c=comidaBill({bills:m.bills.filter(b=>!isLegacyTF(b))},false)||(()=>{const b={id:uid(),name:'Food',amount:0,fixed:false,cat:'🛒 Comida/Supermercado'};m.bills.push(b);return b})();
  const prevPaid=+c.paid||0;let addPaid=0;leg.forEach(l=>{addPaid+=Math.min(+l.paid||0,+l.amount||0)});
  (m.events||[]).forEach(e=>{if(!Array.isArray(e.bills))return;const hasC=e.bills.some(p=>p.id===c.id);e.bills=e.bills.flatMap(p=>leg.some(l=>l.id===p.id)?(hasC?[]:[{id:c.id,prev:prevPaid}]):[p])});
  m.bills=m.bills.filter(b=>!isLegacyTF(b));if(c.tfood===undefined)c.tfood=0;  // Comida tenía solo el monto manual
  if(addPaid>0)c.paid=r2(prevPaid+addPaid);
  const a=tonyFood(m);c.amount=r2(tfManual(c)+a);if(a>0.004)c.tfood=a;else delete c.tfood;
  const after=r2(m.bills.reduce((s,b)=>s+(+b.amount||0),0));if(Math.abs(after-r2(before-legA+a))>0.005||m.bills.filter(isLegacyTF).length)ok=false}
 if(!ok){console.warn('v74 fold: totales no cuadran, no se cambia nada');Object.keys(st).forEach(k=>delete st[k]);Object.assign(st,snap);return false}
 try{queueBackup(snap)}catch(e){console.warn(e)}return true}
// Tony: en "Transferir" no se descuenta la parte de Tony de compras que él/Arianna pagaron (ya es suya)
tonyInfo=function(m){const food=r2(sum(m.purchases.filter(p=>!p.paidBy),x=>+(x.shares||{}).Tony||0)),P=r2(sum(m.bills,b=>Math.min(+b.paid||0,+b.amount||0))),X=tXfer(m);
 return {food,unapplied:Math.max(0,r2(food-Math.max(0,P-X)))}};
// presupuestos: la parte automática de Comida ya cuenta como gasto por la compra; no se cuenta otra vez al pagar la cuenta de Tony
tonyBy=function(m){const o={};(m.bills||[]).forEach(b=>{const p=Math.max(0,Math.min(+b.paid||0,+b.amount||0,tfManual(b)));if(p>0){const c=billCat(b);o[c]=r2((o[c]||0)+p)}});return o};
const _ssV74=window.setState;window.setState=o=>{const ch=foldLegacyTF(o);_ssV74(o);if(ch)setTimeout(()=>{save();render()},0)};
setTimeout(()=>{if(foldLegacyTF(S)){save();render()}else syncAllTFood()},0);
const _calcV72=calc;calc=function(m){const r=_calcV72(m);const P=paidOther(m);if(!P.length)return r;
 const dT=r2(P.reduce((s,p)=>s+(+(p.shares||{}).Tony||0),0)),dC=r2(P.reduce((s,p)=>s+(+(p.shares||{}).Carlos||0),0));
 // v73: si compró Carlos, la parte de Joe se descuenta de lo que Carlos le debe a Joe (netting)
 const joeCS=r2(P.filter(p=>p.paidBy==='Carlos').reduce((s,p)=>s+(+(p.shares||{}).Yo||0),0));
 const tony=r2(r.tony-dT),carlos=r2(r.carlos-dC),carlosOwes=r2(carlos-joeCS),net=r2(carlosOwes-r.recv),toTony=r2(r.bills-tony),tonyDue=Math.max(0,r2(toTony-r.xfer)),carlosDue=Math.max(0,net),joeOwesCarlos=Math.max(0,-net),money=r.inc+tony+carlosDue,debt=r2(r.debt+joeOwesCarlos);
 return {...r,tony,carlos,joeCS,carlosOwes,toTony,tonyDue,carlosDue,joeOwesCarlos,money,debt,bal:money-debt}};
// v73: cuentas entre Tony y Carlos por mes (Carlos le debe su parte de lo que compraron Tony/Arianna; Tony le debe su parte de lo que compró Carlos)
function tcOf(m){const P=paidOther(m),cT=r2(P.filter(p=>TFAM.includes(p.paidBy)).reduce((s,p)=>s+(+(p.shares||{}).Carlos||0),0)),tC=r2(P.filter(p=>p.paidBy==='Carlos').reduce((s,p)=>s+(+(p.shares||{}).Tony||0),0)),n=r2(cT-tC);
 if(Math.abs(n)<0.005)return null;return {from:n>0?'Carlos':'Tony',to:n>0?'Tony':'Carlos',amount:Math.abs(n),settled:!!(m.tcSettled&&Math.abs(+m.tcSettled.amount-Math.abs(n))<0.005),st:m.tcSettled||null}}
function tcSettle(k,by){const m=S.months[k],x=tcOf(m);if(!x)return;m.tcSettled={amount:x.amount,from:x.from,to:x.to,at:Date.now(),by:by||'Joe'};save();render();toast(T('Marcado como pagado'))}
const _delPV72=delP;delP=function(){_delPV72();syncAllTFood();render()};
function owesBy(m){const o=[],c=calc(m);if(c.joeOwesCarlos>0.004)o.push({a:'Yo',b:'Carlos',v:c.joeOwesCarlos});const x=tcOf(m);if(x&&!x.settled)o.push({a:x.from,b:x.to,v:x.amount,tc:1});return o}
function inboxList(){dlg().innerHTML=`<h2>${T('📥 Compras por revisar ({0})',INBOX.length)}</h2>${INBOX.length?INBOX.map(x=>x.kind==='settle'?`<div class="row"><span class="n">✅ ${T('{0} dice que ya pagó a {1}',esc(inbStr(x.by,20)),esc(DN(x.by==='Carlos'?'Tony':'Carlos')))}<div class="muted">${esc(S.months[x.month]?lbl(x.month):inbStr(x.month,7))}</div></span><b>${f(+x.amount||0)}</b><button class="sec" onclick="inboxSettle('${esc(x.id)}',true)">${T('Confirmar')}</button><button class="del" onclick="inboxSettle('${esc(x.id)}',false)">✕</button></div>`:`<div class="row"><span class="n">${esc(inbStr(x.store,60))}<div class="muted">${esc(fdate(x.date))} · ${T('Compró: {0}',esc(inbStr(x.by,20)))}</div></span><b>${f(+x.total||0)}</b><button class="sec" onclick="inboxOpen('${esc(x.id)}')">${T('Revisar')}</button></div>`).join(''):`<div class="muted">${T('Sin compras por revisar.')}</div>`}
 <div class="grid" style="margin-top:10px"><button class="sec" onclick="dlg().close()">${T('Cerrar')}</button></div>`;if(!dlg().open)dlg().showModal()}
const _renderV72=render;render=function(){_renderV72();if(typeof tab==='undefined'||tab!=='ini')return;const v=document.getElementById('v');if(!v)return;setTimeout(()=>inboxLoad(),0);
 const oe=owesBy(M()||{});let h='';
 const ks=keys(),pk=ks[ks.indexOf(S.cur)-1],px=pk&&tcOf(S.months[pk]);
 if(px&&!px.settled)h+=`<div class="card" id="tcprev" style="border-left:4px solid #f59e0b"><div class="row"><span class="n">⏳ ${T('Pendiente entre Tony y Carlos ({0})',lbl(pk))}<div class="muted">${T('{0} le debe a {1}',esc(DN(px.from)),esc(DN(px.to)))}</div></span><b>${f(px.amount)}</b></div><button class="sec" id="tcprevok" style="width:100%;margin-top:6px" onclick="tcSettle('${pk}')">${T('✅ Marcar pagado')}</button></div>`;
 if(INBOX.length)h+=`<div class="card" style="padding:10px"><button id="inbbtn" style="width:100%;background:#ca8a04" onclick="inboxList()">${T('📥 Compras por revisar ({0})',INBOX.length)}</button></div>`;
 if(oe.length)h+=`<div class="card" id="owecard"><h2>${T('🧾 Deudas de compras')}</h2>${oe.map(x=>`<div class="row"><span class="n">${x.a==='Yo'?T('Le debes a {0}',esc(DN(x.b))):T('{0} le debe a {1}',esc(DN(x.a)),esc(DN(x.b)))}${x.a==='Yo'?'':` <span class="muted">(${T('entre ellos')})</span>`}</span><b>${f(x.v)}</b>${x.tc?`<button class="sec" id="tcok" style="min-height:32px;font-size:13px;margin-left:6px" onclick="tcSettle(S.cur)">${T('✅ Marcar pagado')}</button>`:''}</div>`).join('')}<div class="muted">${T('Compras que pagaron otros este mes')}</div></div>`;
 if(h){const c=v.querySelector('.card');c?c.insertAdjacentHTML('afterend',h):v.insertAdjacentHTML('afterbegin',h)}};
