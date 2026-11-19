// v147 (Joe): NINGÚN cheque entra solo al débito. Siempre confirmas tú.
// 1) Se quita el depósito automático de las 4:00 AM (YoWash todos los jueves, Walmart jueves alternos).
// 2) Desde las 4:00 AM (America/New_York) del día de cobro, y hasta confirmar (también días después), en Hoy sale
//    «Cheques por confirmar» con cada cheque vencido: monto estimado ya escrito, editable, y «Confirmar».
//    Solo al confirmar entra al débito, con la fecha del cobro y los mismos datos de siempre
//    (YoWash: S.checks + evento «check»; Walmart: S.wm.paid + ingreso «🏪 Walmart»), así que reportes,
//    «Cheques depositados», «Real cobrado», EarlyPay y los próximos estimados siguen igual.
// 3) Se quita el botón «Ya se depositó» de YoWash (ya no hace falta). Lo ya registrado como adelantado se conserva y se cuenta.
// 4) Migración de una sola vez: un cheque cargado AUTOMÁTICAMENTE (sin confirmar) en el cobro de esta semana vuelve a
//    «por confirmar» y se le quita el efecto en el débito. No toca meses ni semanas anteriores ni lo que tú confirmaste.
// 5) «Cheques depositados» (pestaña Movimientos): toca una línea para corregir su monto (débito y reportes se ajustan).
Object.assign(EN,{
 "Cheques por confirmar":"Checks to confirm",
 "Confirmar":"Confirm",
 "Pon el monto que de verdad llegó.":"Enter the amount that really arrived.",
 "Cheque de {0} confirmado":"Check of {0} confirmed",
 "Cheque Walmart de {0} confirmado":"Walmart check of {0} confirmed",
 "{0} cheque(s) vuelven a «por confirmar»":"{0} check(s) are back to «to confirm»",
 "Editar cheque":"Edit check",
 "Toca para corregir el monto":"Tap to fix the amount",
 "Cambia el monto en el débito y en los reportes. Nada más cambia.":"Changes the amount in debit and in reports. Nothing else changes.",
 "Cuando llegue ese día te pediré confirmar el monto.":"On that day I will ask you to confirm the amount."
});
(function(){
 const PRE=()=>{S.pay147=S.pay147||{};S.pay147.pre=S.pay147.pre||{};return S.pay147.pre};
 // hora de Nueva York (no UTC ni la zona del teléfono)
 function nyNow(x){x=x instanceof Date?x:new Date();
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(x),g=t=>p.find(y=>y.type===t).value;
  return {d:g('year')+'-'+g('month')+'-'+g('day'),h:+g('hour')%24}}
 function payDue(date,now){if(!date)return false;const n=nyNow(now);return n.d>date||(n.d===date&&n.h>=4)}
 window.v147NY=nyNow;window.v147PayDue=payDue;

 // ¿ya está registrado este cobro? (cheque adelantado de antes, otro dispositivo, etc.) → nunca se cuenta dos veces
 function ywBooked(c){const evs=[];Object.values(S.months||{}).forEach(m=>(m.events||[]).forEach(e=>{if(e.type==='check')evs.push(e)}));
  if(evs.some(e=>e.checkId===c.id||e.payday===c.date))return true;
  return (S.checks||[]).some(x=>x!==c&&x.status==='deposited'&&x.date===c.date)}
 function wmBooked(d){const P=(S.wm||{}).paid||{};if(+P[d]>0)return true;
  return Object.values(S.months||{}).some(m=>(m.events||[]).some(e=>e.type==='income'&&epIsWm(e.concept)&&e.date===d&&+e.amount>0))}

 // ---- cheques vencidos pendientes de confirmar ----
 function dueList(now){const out=[],pre=(S.pay147||{}).pre||{};
  const yw=(S.checks||[]).filter(c=>c.status==='pending'&&c.date&&payDue(c.date,now)&&!ywBooked(c)).sort((a,b)=>a.date<b.date?-1:1)[0];
  if(yw){const k='yw:'+yw.id,est=+pre[k]>0?r2(pre[k]):(+yw.amount>0&&!yw.amtPending?r2(yw.amount):(typeof chkEst==='function'?r2(chkEst()):0));
   out.push({kind:'yw',key:k,id:yw.id,date:yw.date,est,label:'💼 YoWash'})}
  const d=typeof wmNext==='function'?wmNext():null;
  if(d&&d>=((S.wm&&S.wm.anchor)||WM_ANCHOR)&&payDue(d,now)&&!wmBooked(d)){const k='wm:'+d,a=+pre[k]>0?r2(pre[k]):r2(wmAmt(d)||0);
   out.push({kind:'wm',key:k,id:d,date:d,est:a,label:'🏪 Walmart'})}
  return out}
 window.v147Due=dueList;
 const sigOf=L2=>L2.map(x=>x.key).join('|');
 function noticeHtml(){const L2=dueList();if(!L2.length)return'';
  return `<div class="card" id="paynotice" data-keys="${esc(sigOf(L2))}" style="border:2px solid #15803d;padding:10px 12px"><div style="font-weight:700;font-size:15px">💵 ${T('Cheques por confirmar')}</div>
  ${L2.map(x=>`<div class="row pn" data-k="${esc(x.key)}" style="align-items:center;gap:8px"><span class="n">${x.label}<div class="muted">${wd(x.date)}</div></span>
   <input class="pnamt" type="number" inputmode="decimal" step="0.01" min="0" value="${x.est>0?x.est:''}" placeholder="$" style="width:104px;font-size:18px" aria-label="${T('Monto del cheque')}">
   <button class="pnok" onclick="v147Confirm('${x.kind}','${esc(x.id)}')" style="min-height:40px;padding:4px 14px">${T('Confirmar')}</button></div>`).join('')}
  <div class="muted" style="font-size:12px;margin-top:4px">${T('Pon el monto que de verdad llegó.')}</div></div>`}
 {const _i=ini;ini=function(){const h=_i(),c=noticeHtml();if(!c)return h;const j=h.indexOf('<div class="card');return j<0?c+h:h.slice(0,j)+c+h.slice(j)}}
 // el aviso viejo «¿cuánto fue?» (que depositaba al poner el monto) se reemplaza por este
 {const _n=chkAmtNote;chkAmtNote=function(){const pc=typeof pcAmtPend==='function'?pcAmtPend():null;if(pc&&payDue(pc.date))return'';return _n()}}
 {const _d=chkAmtDlg;chkAmtDlg=function(){_d();const pc=pcAmtPend();if(pc&&!payDue(pc.date)){const m=dlg().querySelector('.muted');if(m)m.textContent=T('Cuando llegue ese día te pediré confirmar el monto.');
   const b=document.getElementById('cka2ok');if(b)b.textContent=T('Guardar')}}}

 // ---- confirmar ----
 let busy=0;
 function amtFor(key){const row=[...document.querySelectorAll('#paynotice .pn')].find(r=>r.dataset.k===key);return row?r2(row.querySelector('.pnamt').value):0}
 function confirmYW(id,a){const c=(S.checks||[]).find(x=>x.id===id);
  if(!c||c.status!=='pending'||ywBooked(c))return false;
  c.amount=a;delete c.amtPending;c.status='deposited';c.depositedOn=today();c.ok=true;
  debE(L()).amount=r2((+debE(L()).amount||0)+a);
  S.months[monthFor(c.date)].events.push({id:uid(),type:'check',date:c.date,amount:a,desc:'Cheque '+fdate(c.date),checkId:c.id});
  delete PRE()['yw:'+id];
  if(typeof v127NextYW==='function')v127NextYW();
  return true}
 function confirmWM(d,a){if(wmBooked(d))return false;const w=v116W(),cn='🏪 Walmart';
  if(!S.incCats.includes(cn))S.incCats.push(cn);
  debE(L()).amount=r2((+debE(L()).amount||0)+a);
  S.months[monthFor(d)].events.push({id:uid(),type:'income',date:d,amount:a,concept:cn,desc:'Walmart '+fdate(d),method:'deb'});
  w.paid[d]=a;const nx=addD(d,14);w.chk[nx]=0;if(w.pendCleared===nx)delete w.pendCleared;
  delete PRE()['wm:'+d];return true}
 function v147Confirm(kind,id){if(busy)return;const key=kind+':'+id,a=amtFor(key);
  if(!(a>0))return alert(T('Pon el monto del cheque'));
  busy=1;try{const done=kind==='yw'?confirmYW(id,a):confirmWM(id,a);
   if(done){save();toast(T(kind==='yw'?'Cheque de {0} confirmado':'Cheque Walmart de {0} confirmado',f(a)))}
   render()}finally{busy=0}}
 window.v147Confirm=v147Confirm;

 // ---- migración de una sola vez ----
 function migrate(){if(!S||!S.checks)return 0;S.pay147=S.pay147||{};if(S.pay147.mig)return 0;
  const tdy=nyNow().d,lo=addD(tdy,-6),inWin=d=>d&&d>=lo&&d<=tdy;let n=0;const pre=PRE();
  (S.checks||[]).filter(c=>c.status==='deposited'&&c.auto===true&&!c.ok&&!c.early&&inWin(c.date)).forEach(c=>{
   const hits=[];Object.values(S.months||{}).forEach(m=>(m.events||[]).forEach(e=>{if(e.type==='check'&&e.checkId===c.id&&e.auto)hits.push([m,e])}));
   if(!hits.length)return;
   const tot=r2(sum(hits,h=>h[1].amount));debE(L()).amount=r2((+debE(L()).amount||0)-tot);
   hits.forEach(([m,e])=>{m.events=m.events.filter(y=>y!==e)});
   pre['yw:'+c.id]=r2(+c.amount||tot);
   c.status='pending';delete c.auto;delete c.depositedOn;if(!(+c.amount>0))c.amount=r2(tot);
   // el siguiente «pendiente» que el depósito automático dejó listo se vuelve a crear al confirmar
   S.checks=S.checks.filter(x=>!(x!==c&&x.status==='pending'&&x.amtPending&&!(+x.amount>0)&&x.date===addD(c.date,7)));
   n++});
  const w=S.wm;
  if(w&&w.paid)Object.values(S.months||{}).forEach(m=>{(m.events||[]).slice().forEach(e=>{
   if(e.type==='income'&&e.auto===true&&epIsWm(e.concept)&&inWin(e.date)&&+w.paid[e.date]>0&&r2(+w.paid[e.date])===r2(+e.amount)){
    debE(L()).amount=r2((+debE(L()).amount||0)-e.amount);
    m.events=m.events.filter(y=>y!==e);pre['wm:'+e.date]=r2(+e.amount);delete w.paid[e.date];n++}})});
  // un ingreso de Walmart de esta semana que ya corregiste a mano: «Cheques cobrados» toma ese monto
  if(w&&w.paid)Object.values(S.months||{}).forEach(m=>(m.events||[]).forEach(e=>{
   if(e.type==='income'&&epIsWm(e.concept)&&inWin(e.date)&&+e.amount>0&&+w.paid[e.date]>0&&r2(+w.paid[e.date])!==r2(+e.amount))w.paid[e.date]=r2(+e.amount)}));
  S.pay147.mig=1;S.pay147.migAt=tdy;S.pay147.migN=n;
  if(typeof autoNote!=='undefined')autoNote=null;
  save();return n}
 window.v147Migrate=migrate;

 // ---- ya no hay depósito automático: solo migración una vez y refrescar el aviso ----
 autoDeposit=function(){
  if(window.FB_CONFIG&&localStorage.getItem('finanzas-sync-uid')&&!window.__syncReady){clearTimeout(window.__adT);window.__adT=setTimeout(()=>autoDeposit(),3000);return}
  if(!S)return;let n=0;try{n=migrate()}catch(e){console.warn('v147 migrate',e)}
  if(!unlocked)return;
  if(n>0){render();toast(T('{0} cheque(s) vuelven a «por confirmar»',n));return}
  // aviso nuevo (llegaron las 4:00) o confirmado en otro dispositivo: solo si no estás escribiendo
  if(tab==='ini'&&!dlg().open&&!(document.activeElement&&document.activeElement.classList&&document.activeElement.classList.contains('pnamt'))){
   const el=document.getElementById('paynotice'),now=sigOf(dueList()),shown=el?el.dataset.keys:'';
   if(now!==shown)render()}};

 // ---- se quita «Ya se depositó» (YoWash) ----
 const closeDlg=()=>{try{if(dlg().open)dlg().close()}catch(e){}};
 ywEarlyDlg=function(){closeDlg()};ywEarlySave=function(){closeDlg()};
 window.ywEarlyDlg=ywEarlyDlg;window.ywEarlySave=ywEarlySave;
 {const _b=chkBox;chkBox=function(){const h=_b();if(!/ywearly/.test(h))return h;const t=document.createElement('template');t.innerHTML=h;
  t.content.querySelectorAll('#ywearly').forEach(x=>x.remove());return t.innerHTML}}

 // ---- «Cheques depositados»: corregir el monto ----
 const depRow=id=>depChecks().find(x=>x.id===id);
 function depEvents(id){const out=[];
  if(id.startsWith('wm-')){const d=id.slice(3);Object.values(S.months||{}).forEach(m=>(m.events||[]).forEach(e=>{if(e.type==='income'&&epIsWm(e.concept)&&e.date===d&&(e.method||'deb')==='deb')out.push([m,e])}))}
  else Object.values(S.months||{}).forEach(m=>(m.events||[]).forEach(e=>{if(e.type==='check'&&e.checkId===id)out.push([m,e])}));
  return out}
 function depEditDlg(id){const r=depRow(id);if(!r||r.legacy)return;
  dlg().innerHTML=`<h2>✏️ ${T('Editar cheque')}</h2><div class="muted">${r.src||''} · ${wd(r.date)}</div>
   <label style="display:block;margin-top:8px">${T('Monto del cheque')}<input id="depa" type="number" inputmode="decimal" step="0.01" min="0" value="${r2(r.amount).toFixed(2)}" style="font-size:24px"></label>
   <div class="muted" style="margin-top:8px">${T('Cambia el monto en el débito y en los reportes. Nada más cambia.')}</div>
   <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="depok" onclick="depEditSave('${esc(id)}')">${T('Guardar')}</button></div>`;
  if(!dlg().open)dlg().showModal();setTimeout(()=>document.getElementById('depa')?.focus(),50)}
 function depEditSave(id){const a=r2((document.getElementById('depa')||{}).value);if(!(a>0))return alert(T('Pon un monto'));
  const wm=id.startsWith('wm-'),d=wm?id.slice(3):null,c=wm?null:(S.checks||[]).find(x=>x.id===id),evs=depEvents(id);
  if(!wm&&!c)return dlg().close();
  const old=evs.length?r2(sum(evs,h=>h[1].amount)):r2(wm?+((S.wm||{}).paid||{})[d]||0:+c.amount||0),diff=r2(a-old);
  if(diff<-0.004&&noDeb(-diff))return;
  debE(L()).amount=r2((+debE(L()).amount||0)+diff);
  if(evs.length){evs[0][1].amount=a;evs.slice(1).forEach(([m,e])=>{m.events=m.events.filter(y=>y!==e)})}
  if(wm)v116W().paid[d]=a;else{c.amount=a;c.ok=true}
  save();dlg().close();render();toast(T('Cheque corregido'))}
 window.depEditDlg=depEditDlg;window.depEditSave=depEditSave;
 function depEditable(h){const t=document.createElement('template');t.innerHTML=h;const card=t.content.querySelector('#chkcard');if(!card)return h;const L2=depChecks();
  [...card.querySelectorAll(':scope > .row')].forEach((r,i)=>{const x=L2[i];if(!x||x.legacy)return;const n=r.querySelector('.n');if(!n)return;
   n.setAttribute('role','button');n.setAttribute('title',T('Toca para corregir el monto'));n.setAttribute('onclick',`depEditDlg('${esc(x.id)}')`);n.style.cursor='pointer';n.insertAdjacentText('afterbegin','✏️ ')});
  return t.innerHTML}
 {const _c=chkCard;chkCard=function(){return depEditable(_c())}}
 {const _o=opsDeb;opsDeb=function(){return depEditable(_o())}}
 // corregir un ingreso de Walmart desde Movimientos también actualiza «Cheques cobrados»; borrarlo lo vuelve a pedir
 {const _s=incEditSave;incEditSave=function(id){const m=findMonth('events',id),e=m&&m.events.find(x=>x.id===id),d=e&&epIsWm(e.concept)?e.date:null;
  const r=_s.apply(this,arguments);
  if(d&&e&&e.date===d&&S.wm&&S.wm.paid&&(d in S.wm.paid)&&+e.amount>0&&r2(S.wm.paid[d])!==r2(e.amount)){S.wm.paid[d]=r2(e.amount);save();render()}
  return r}}
 {const _d=delMove;delMove=function(kind,id){const m=kind==='income'?findMonth('events',id):null,e=m&&m.events.find(x=>x.id===id),d=e&&epIsWm(e.concept)?e.date:null;
  const r=_d.apply(this,arguments);
  if(d&&S.wm&&S.wm.paid&&(d in S.wm.paid)&&!findMonth('events',id)){delete S.wm.paid[d];save();render()}
  return r}}
})();
