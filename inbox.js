// v72: compras enviadas desde los enlaces (shares/{token}/inbox/{id}). Joe las revisa: Aceptar / Editar / Rechazar.
// Una compra con p.paidBy (quién compró) NO toca los saldos de Joe (method '') y no entra en "Por cobrar":
// Joe le debe su parte a quien compró ("Le debes"). La compensación (netting) queda pendiente de que Joe decida.
Object.assign(EN,{"📥 Compras por revisar ({0})":"📥 Purchases to review ({0})","Compró: {0}":"Bought by: {0}","Enviada desde el enlace de {0}":"Sent from {0}'s link",
 "Rechazar":"Reject","¿Rechazar esta compra? Se borra del buzón.":"Reject this purchase? It will be removed from the inbox.","Compra rechazada":"Purchase rejected",
 "No toca tus cuentas: la pagó {0}. Tu parte es lo que le debes.":"Doesn't touch your accounts: {0} paid. Your share is what you owe them.",
 "No toca tus cuentas: la pagó {0}. Tu parte se suma a las Cuentas de Tony (Comida).":"Doesn't touch your accounts: {0} paid. Your share is added to Tony's bills (Food).","Compras que pagaron otros este mes (tu parte)":"Purchases others paid this month (your share)",
 "Pagada por otra persona: no entra en el Total del mes. Si compró Tony o Arianna, la parte de Joe va a las Cuentas de Tony (Comida).":"Paid by someone else: not in the Month total. If Tony or Arianna bought it, Joe's share goes to Tony's bills (Food).",
 "Revisar":"Review","Le debes a {0}":"You owe {0}","{0} le debe a {1}":"{0} owes {1}","entre ellos":"between them","🛒 Comida (compras de Tony/Arianna)":"🛒 Food (Tony/Arianna purchases)","🧾 Deudas de compras":"🧾 Purchase debts","Sin compras por revisar.":"Nothing to review."});
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
// línea real (variable) en las Cuentas de Tony, así se puede transferir y marcar pagada como las demás
function syncTFood(m){if(!m||!m.bills)return false;const a=tonyFood(m),i=m.bills.findIndex(b=>b.id==='_tfood');
 if(a>0.004){if(i<0){m.bills.push({id:'_tfood',name:T('🛒 Comida (compras de Tony/Arianna)'),amount:a,fixed:false});return true}if(r2(m.bills[i].amount)!==a){m.bills[i].amount=a;return true}return false}
 if(i>=0&&!(+m.bills[i].paid>0)){m.bills.splice(i,1);return true}if(i>=0&&+m.bills[i].amount){m.bills[i].amount=0;return true}return false}
const syncAllTFood=()=>{let ch=false;Object.values(S.months).forEach(m=>{if(syncTFood(m))ch=true});if(ch)save()};
const _calcV72=calc;calc=function(m){const r=_calcV72(m);const P=paidOther(m);if(!P.length)return r;
 const dT=r2(P.reduce((s,p)=>s+(+(p.shares||{}).Tony||0),0)),dC=r2(P.reduce((s,p)=>s+(+(p.shares||{}).Carlos||0),0));
 const tony=r2(r.tony-dT),carlos=r2(r.carlos-dC),toTony=r2(r.bills-tony),tonyDue=Math.max(0,r2(toTony-r.xfer)),carlosDue=Math.max(0,r2(carlos-r.recv)),money=r.inc+tony+carlosDue;
 return {...r,tony,carlos,carlosOwes:carlos,toTony,tonyDue,carlosDue,money,bal:money-r.debt}};
const _delPV72=delP;delP=function(){_delPV72();syncAllTFood();render()};
function owesBy(m){const o=[],add=(a,b,v)=>{v=r2(v);if(v>0.004){const x=o.find(y=>y.a===a&&y.b===b);x?x.v=r2(x.v+v):o.push({a,b,v})}};
 paidOther(m).forEach(p=>{const sh=p.shares||{};if(TFAM.includes(p.paidBy))add('Carlos','Tony',+sh.Carlos||0);else if(p.paidBy==='Carlos'){add('Yo','Carlos',+sh.Yo||0);add('Tony','Carlos',+sh.Tony||0)}});return o}
function inboxList(){dlg().innerHTML=`<h2>${T('📥 Compras por revisar ({0})',INBOX.length)}</h2>${INBOX.length?INBOX.map(x=>`<div class="row"><span class="n">${esc(inbStr(x.store,60))}<div class="muted">${esc(fdate(x.date))} · ${T('Compró: {0}',esc(inbStr(x.by,20)))}</div></span><b>${f(+x.total||0)}</b><button class="sec" onclick="inboxOpen('${esc(x.id)}')">${T('Revisar')}</button></div>`).join(''):`<div class="muted">${T('Sin compras por revisar.')}</div>`}
 <div class="grid" style="margin-top:10px"><button class="sec" onclick="dlg().close()">${T('Cerrar')}</button></div>`;if(!dlg().open)dlg().showModal()}
const _renderV72=render;render=function(){_renderV72();if(typeof tab==='undefined'||tab!=='ini')return;const v=document.getElementById('v');if(!v)return;setTimeout(()=>inboxLoad(),0);
 const oe=owesBy(M()||{});let h='';
 if(INBOX.length)h+=`<div class="card" style="padding:10px"><button id="inbbtn" style="width:100%;background:#ca8a04" onclick="inboxList()">${T('📥 Compras por revisar ({0})',INBOX.length)}</button></div>`;
 if(oe.length)h+=`<div class="card" id="owecard"><h2>${T('🧾 Deudas de compras')}</h2>${oe.map(x=>`<div class="row"><span class="n">${x.a==='Yo'?T('Le debes a {0}',esc(DN(x.b))):T('{0} le debe a {1}',esc(DN(x.a)),esc(DN(x.b)))}${x.a==='Yo'?'':` <span class="muted">(${T('entre ellos')})</span>`}</span><b>${f(x.v)}</b></div>`).join('')}<div class="muted">${T('Compras que pagaron otros este mes')}</div></div>`;
 if(h){const c=v.querySelector('.card');c?c.insertAdjacentHTML('afterend',h):v.insertAdjacentHTML('afterbegin',h)}};
