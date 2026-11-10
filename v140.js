// v140 (Joe): hoja de cuentas para Tony.
// Tony, desde su enlace, pone el TOTAL de cada cuenta del mes y marca Fija/Variable (el reparto ya viene puesto; «Cambiar reparto»
// solo si hace falta). Lo que envía llega a 📥 Compras por revisar como «🧾 Cuentas de <mes>». NADA cambia hasta que Joe aprueba.
// Al aprobar: cada cuenta enviada guarda total + reparto (b.sheet) y su monto en la app pasa a ser la PARTE DE JOE (lo que Joe
// le debe a Tony), así Transferir a Tony, Plan y PDF siguen igual y sin doble conteo. Lo ya pagado (b.paid) y las transferencias
// no se tocan. Cuentas en blanco no se tocan. Aprobar dos veces el mismo envío no hace nada (idempotente).
// Comida NO entra en la hoja: Tony ya no pasa factura de comida; los recibos (y los abonos) siguen en el libro de
// compras como hasta ahora. Esta capa no crea una obligación paralela ni toca b.amount/b.tfood/b.paid de Comida.
// Flujo habitual del resto: se salda al cerrar el mes con «Transferir a Tony». Los únicos pagos parciales antes de
// fin de mes suelen ser abonos de Comida (se conservan y se restan de lo pendiente). «Generalmente» no prohíbe un
// abono excepcional en otra cuenta: si ya había b.paid, no se toca. Sin controles de pago parcial por cuenta.
Object.assign(EN,{"🧾 Cuentas de {0}":"🧾 Bills for {0}","Enviada por Tony":"Sent by Tony","Aprobar":"Approve","Cuentas aprobadas":"Bills approved",
 "Ya estaba aprobada":"Already approved","Se hizo con una versión anterior de la hoja. Revisa antes de aprobar.":"Made from an older version of the sheet. Review before approving.",
 "Aprobar igual":"Approve anyway","Tu parte antes":"Your share before","Tu parte ahora":"Your share now","Ya pagado":"Already paid","Te queda por pagar":"Left to pay",
 "Reparto de cuentas":"Bill split","sin cambios":"no change","nueva":"new","Lo paga Tony":"Paid by Tony","Responsable":"Responsible",
 "Joe → Tony":"Joe → Tony","Carlos → Tony":"Carlos → Tony","Arianna (lo paga Tony)":"Arianna (paid by Tony)","Tony (suyo)":"Tony (own)",
 "Solo referencia: la app no lleva lo que Carlos le paga a Tony.":"Reference only: the app doesn't track what Carlos pays Tony.",
 "Abono de comida":"Food advance","Abonos de comida":"Food advances","Queda":"Left","Incluye abonos de comida {0} (queda {1} en Comida)":"Includes food advances {0} ( {1} left on Food)","Hoja rechazada":"Sheet rejected","¿Rechazar esta hoja de cuentas? Se borra del buzón.":"Reject this bill sheet? It will be removed from the inbox.",
 "No hay cambios para aplicar.":"Nothing to apply.","Hay un reparto que no cuadra":"A split doesn't add up"});
const bsS=()=>{S.bsheet=S.bsheet||{months:{}};S.bsheet.months=S.bsheet.months||{};return S.bsheet};
const bsMonth=k=>{const B=bsS();return B.months[k]=B.months[k]||{rev:0,rows:{},applied:{},hist:[]}};
const bsRow=key=>BS.ROWS.find(r=>r.key===key);
const bsNm=b=>String(b&&b.name||'').replace(/^[^\p{L}\p{N}]+/u,'').trim();
function bsIsFood(b){return typeof isComidaBill==='function'?isComidaBill(b):/^(food|comida)$/i.test(bsNm(b))}
function bsBill(m,key,create){if(!key||key==='comida')return null;const R=bsRow(key);if(!R)return null;
 let b=(m.bills||[]).find(x=>x.sheetKey===key)||(m.bills||[]).find(x=>!x.sheetKey&&!bsIsFood(x)&&(R.re.test(bsNm(x))||R.re.test(bsNm({name:DN(x.name)}))));
 if(b&&bsIsFood(b))return null;
 if(!b&&create){b={id:uid(),name:R.name,amount:0,fixed:false,cat:R.group==='auto'?'🚗 Transporte':'🏠 Hogar'};m.bills.push(b)}
 if(b&&!b.sheetKey)b.sheetKey=key;return b}
// lo que ve Tony: este mes si ya tiene datos aprobados; si no, lo último que Tony envió y Joe aprobó (meses anteriores); si no, en blanco
function bsSheetFor(k){const B=bsS(),cur=B.months[k];let src=null,from=null;
 if(cur&&Object.keys(cur.rows||{}).length){src=cur.rows;from=k}
 else{const ks=Object.keys(B.months).filter(x=>x<k&&Object.keys(B.months[x].rows||{}).length).sort();if(ks.length){from=ks.at(-1);src=B.months[from].rows}}
 const own=from===k;
 return {k,rev:cur?cur.rev:0,from,rows:BS.ROWS.map(R=>{const x=src&&src[R.key];
  return {key:R.key,name:R.name,group:R.group,total:x&&x.total!=null?x.total:null,fixed:x&&typeof x.fixed==='boolean'?x.fixed:null,
   alloc:x&&x.alloc?x.alloc:BS.def(R.key),review:!!(x&&!own&&x.fixed===false),def:!x&&!!BS.DEF_NOTE[R.key]}})}}
// enlace de Tony: añade SOLO la hoja (nombres, totales que él puso, reparto). Nada de saldos ni movimientos.
{const _s=snapFor0;snapFor0=function(who){const d=_s(who);if(who==='Tony'){const k=keys().at(-1),sh=bsSheetFor(k);d.billSheet={k,label:lbl(k),rev:sh.rev,from:sh.from,rows:sh.rows}}return d}}
// valida y normaliza una fila enviada por Tony
function bsClean(r){if(!r||r.key==='comida')return null;const R=bsRow(r.key);if(!R)return null;const t=r.total;if(t===null||t===undefined||t==='')return null;const total=r2(+t);if(!(total>=0)||!isFinite(total)||total>100000)return {key:R.key,err:'monto'};
 const fixed=typeof r.fixed==='boolean'?r.fixed:null;let alloc=r.alloc&&typeof r.alloc==='object'?{who:(r.alloc.who||[]).filter(p=>BS.PEOPLE.includes(p)),mode:['pct','eq','amt','one'].includes(r.alloc.mode)?r.alloc.mode:'pct',pct:r.alloc.pct||{},amt:r.alloc.amt||{}}:BS.def(R.key);
 const sp=BS.split(total,alloc);if(sp.err)return {key:R.key,err:sp.err};return {key:R.key,total,fixed,alloc,sp}}
function bsPlan(doc){const k=doc.month,m=S.months[k];if(!m)return {err:'mes'};const sh=bsMonth(k),rows=(Array.isArray(doc.rows)?doc.rows:[]).slice(0,20).map(bsClean).filter(Boolean);
 return {k,m,sh,rows,bad:rows.filter(r=>r.err),stale:(+doc.rev||0)!==sh.rev,done:!!sh.applied[doc.id]}}
function bsApplyTo(m,rows){rows.forEach(r=>{if(!r||r.key==='comida'||r.err)return;const b=bsBill(m,r.key,true);if(!b)return;
 b.amount=r2(r.sp.Joe);if(typeof r.fixed==='boolean')b.fixed=r.fixed;
 b.sheet={total:r.total,alloc:r.alloc,sp:r.sp,fixed:r.fixed}})}
// vista previa: antes / después con calc() (mismas cifras que Transferir a Tony)
function bsPreview(doc){const P=bsPlan(doc);if(P.err)return P;const k=P.k,real=S.months[k],cl=JSON.parse(JSON.stringify(real)),c0=calc(real);
 const before={};BS.ROWS.forEach(R=>{const b=bsBill(cl,R.key,false);before[R.key]=b?{a:r2(+b.amount||0),p:r2(+b.paid||0)}:null});
 bsApplyTo(cl,P.rows.filter(r=>!r.err));S.months[k]=cl;let c1;try{c1=calc(cl)}finally{S.months[k]=real}
 const sumP={Joe:0,Tony:0,Carlos:0,Arianna:0};P.rows.filter(r=>!r.err).forEach(r=>BS.PEOPLE.forEach(p=>sumP[p]=r2(sumP[p]+r.sp[p])));
 return {...P,c0,c1,before,sumP}}
function bsApprove(id,force){const x=INBOX.find(y=>y.id===id);if(!x)return {err:'nodoc'};const P=bsPlan(x);if(P.err)return P;
 if(P.done){toast(T('Ya estaba aprobada'));return {done:true}}
 if(P.bad.length)return {err:'bad'};if(P.stale&&!force)return {err:'stale'};const ok=P.rows;if(!ok.length)return {err:'empty'};
 bsApplyTo(P.m,ok);const sh=P.sh;ok.forEach(r=>{sh.rows[r.key]={total:r.total,fixed:r.fixed,alloc:r.alloc}});sh.rev++;sh.applied[x.id]=sh.rev;
 sh.hist.push({rev:sh.rev,at:Date.now(),by:'Tony',inbox:x.id,rows:ok.map(r=>({key:r.key,total:r.total,fixed:r.fixed,joe:r.sp.Joe}))});
 save();INBOX=INBOX.filter(y=>y.id!==id);return {ok:true,rev:sh.rev}}
// buzón: ocultar las ya aplicadas; fila propia en la lista
{const _l=inboxLoad;inboxLoad=async function(){const r=await _l.apply(this,arguments);const A=new Set(Object.values(bsS().months).flatMap(m=>Object.keys(m.applied||{})));
 if(typeof INBOX!=='undefined'&&INBOX.some(x=>x.kind==='bills'&&A.has(x.id))){INBOX=INBOX.filter(x=>!(x.kind==='bills'&&A.has(x.id)));try{render()}catch(e){}}return r}}
{const _il=inboxList;inboxList=function(){const B=INBOX.filter(x=>x.kind==='bills');INBOX=INBOX.filter(x=>x.kind!=='bills');try{_il()}finally{INBOX=[...B,...INBOX]}
 if(!B.length)return;const h=dlg().querySelector('h2');if(h)h.textContent=T('📥 Compras por revisar ({0})',INBOX.length);
 const nm=dlg().querySelector('h2+.muted');if(nm&&/Sin compras/.test(nm.textContent)&&INBOX.length===B.length)nm.remove();
 h.insertAdjacentHTML('afterend',B.map(x=>`<div class="row" id="bsrow-${esc(x.id)}"><span class="n">${esc(T('🧾 Cuentas de {0}',S.months[x.month]?lbl(x.month):inbStr(x.month,7)))}<div class="muted">${T('Enviada por Tony')} · ${(x.rows||[]).filter(r=>r&&r.total!=null&&r.total!=='').length} ✏️</div></span><button class="sec" onclick="bsReview('${esc(x.id)}')">${T('Revisar')}</button></div>`).join(''))}}
function bsReview(id,force){const x=INBOX.find(y=>y.id===id);if(!x)return;const V=bsPreview(x);if(V.err)return alert(V.err);
 const nmOf=key=>{const R=bsRow(key);return R?R.name:key};
 const rows=V.rows.map(r=>{if(r.err)return `<tr class="bad"><td>${esc(nmOf(r.key))}</td><td colspan="3">⚠️ ${T('Hay un reparto que no cuadra')}</td></tr>`;
  const b=V.before[r.key],old=b?b.a:0,nw=r2(r.sp.Joe);
  const paid=b?r2(b.p||0):0,queda=r2(Math.max(0,nw-paid));
  const abono=paid>0.005?`<div class="muted">${T('Ya pagado')} ${f(paid)} · ${T('Queda')} ${f(queda)}</div>`:'';
  return `<tr><td>${esc(nmOf(r.key))}<div class="muted">${f(r.total)} · ${r.fixed===true?T('Fija'):r.fixed===false?T('Var.'):'—'}</div><div class="muted">${esc(BS.txt(r.alloc))}</div>${abono}</td><td>${b?f(old):'<span class="muted">'+T('nueva')+'</span>'}</td><td><b>${f(nw)}</b></td><td class="muted">${Math.abs(nw-old)<0.005?T('sin cambios'):(nw>old?'+':'−')+f(Math.abs(nw-old))}</td></tr>`}).join('');
 const p0=r2(V.c0.xfer||0);
 dlg().innerHTML=`<h2>${esc(T('🧾 Cuentas de {0}',lbl(V.k)))}</h2><div class="muted">${T('Enviada por Tony')}</div>
 ${V.stale?`<div id="bsstale" style="background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:8px;margin:8px 0;font-size:14px">⚠️ ${T('Se hizo con una versión anterior de la hoja. Revisa antes de aprobar.')}</div>`:''}
 <table id="bsdiff" style="width:100%;font-size:13px;border-collapse:collapse;margin-top:6px"><tr class="muted"><td></td><td>${T('Tu parte antes')}</td><td>${T('Tu parte ahora')}</td><td></td></tr>${rows}</table>
 <div class="card" id="bssum" style="margin-top:10px;padding:10px">
  <div class="row"><span class="n">${T('Cuentas de Tony')} (${T('Tu parte')})</span><span>${f(V.c0.bills)} → <b>${f(V.c1.bills)}</b></span></div>
  <div class="row"><span class="n">${T('Ya pagado')}</span><span>${f(p0)}</span></div>
  <div class="row"><span class="n"><b>${T('Te queda por pagar')}</b></span><span>${f(V.c0.tonyDue)} → <b>${f(V.c1.tonyDue)}</b></span></div>
  <div class="muted" style="margin-top:6px">${T('Responsable')} (${T('solo lo enviado')}): Joe ${f(V.sumP.Joe)} · Tony ${f(V.sumP.Tony)} · Carlos ${f(V.sumP.Carlos)} · ${T('Arianna (lo paga Tony)')} ${f(V.sumP.Arianna)}</div></div>
 <div class="grid" style="margin-top:10px"><button class="del" id="bsrej" onclick="bsReject('${esc(id)}')">${T('Rechazar')}</button>
 ${V.stale&&!force?`<button id="bsforce" onclick="bsReview('${esc(id)}',true)">${T('Aprobar igual')}</button>`:`<button id="bsok" ${V.bad.length||!V.rows.length?'disabled':''} onclick="bsOk('${esc(id)}',${force?'true':'false'})">${T('Aprobar')}</button>`}</div>
 <button class="sec" style="width:100%;margin-top:8px" onclick="dlg().close()">${T('Cancelar')}</button>`;if(!dlg().open)dlg().showModal()}
Object.assign(EN,{"solo lo enviado":"submitted only"});
function bsOk(id,force){const r=bsApprove(id,force);if(r.ok||r.done){dlg().close();render();if(r.ok)toast(T('Cuentas aprobadas'))}else if(r.err==='stale')bsReview(id)}
async function bsReject(id){const x=INBOX.find(y=>y.id===id);if(!x||!confirm(T('¿Rechazar esta hoja de cuentas? Se borra del buzón.')))return;try{if(window.fbInboxDel)await fbInboxDel(x.t,x.id)}catch(e){console.warn(e)}
 INBOX=INBOX.filter(y=>y.id!==id);dlg().close();render();toast(T('Hoja rechazada'))}
// Operaciones: reparto por persona del mes (lo aprobado de la hoja)
function bsShareCard(){const k=S.cur,m=S.months[k];if(!m)return'';const L2=(m.bills||[]).filter(b=>b.sheet&&b.sheet.sp);if(!L2.length)return'';
 const t={Joe:0,Tony:0,Carlos:0,Arianna:0};L2.forEach(b=>BS.PEOPLE.forEach(p=>t[p]=r2(t[p]+(+b.sheet.sp[p]||0))));const c=calc(m);
 const food=typeof comidaBill==='function'?comidaBill(m,false):null,foodPaid=food?r2(Math.min(+food.paid||0,+food.amount||0)):0,foodRem=food?r2(Math.max(0,(+food.amount||0)-foodPaid)):0;
 const foodNote=foodPaid>0.005?`<div class="muted">${T('Incluye abonos de comida {0} (queda {1} en Comida)',f(foodPaid),f(foodRem))}</div>`:'';
 return `<div class="card" id="bscard"><h2>🧾 ${T('Reparto de cuentas')}<span class="muted" style="font-size:13px">${lbl(k)}</span></h2>
 <div class="row"><span class="n">${T('Joe → Tony')}<div class="muted">${T('Ya pagado')} ${f(c.xfer||0)}</div>${foodNote}</span><span>${f(c.bills)} · <b>${T('Pendiente')} ${f(c.tonyDue)}</b></span></div>
 <div class="row"><span class="n">${T('Carlos → Tony')}<div class="muted">${T('Solo referencia: la app no lleva lo que Carlos le paga a Tony.')}</div></span><b>${f(t.Carlos)}</b></div>
 <div class="row"><span class="n">${T('Arianna (lo paga Tony)')}</span><span>${f(t.Arianna)}</span></div>
 <div class="row"><span class="n">${T('Tony (suyo)')}</span><span>${f(t.Tony)}</span></div></div>`}
{const _m=mov;mov=function(){return _m()+bsShareCard()}}
