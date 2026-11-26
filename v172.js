// v172 (Joe):
// AB-8: Teléfono e internet iban 100% a Joe (Carlos 0%). Joe ya había transferido
// el resto a Tony; lo único pendiente eran los $650 de la letra del auto (cuenta
// mensual de Tony, no el módulo de Préstamos). Al corregir el reparto, calc()
// baja lo pendiente (toTony − ya transferido), pero el diálogo Transferir seguía
// ofreciendo los $650 enteros porque el pago de más queda en b.paid de teléfono/
// internet y no se descuenta de la letra. Aquí, tras aprobar la hoja corregida
// (o con un botón), se ofrece descontar ese pago de más de la letra pendiente,
// con el monto prellenado, y se registra «Ajuste: pago de más en cuentas de {mes}»
// sin volver a tocar el débito ni tXfer. La parte corregida de Carlos se ve en
// Reparto (Carlos → Tony) y en el mensaje (sus cuentas).
// AB-9: el Mensaje para Carlos (y el de Tony, por consistencia) ya no lista
// compras tienda por tienda; deja las cuentas, el TOTAL de compras, y los
// totales/pendientes de v164. El detalle por tienda sigue en el PDF.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "Ajuste: pago de más en cuentas de {0}":"Adjustment: overpayment on {0} bills",
  "Pagaste de más {0} al corregir el reparto de las cuentas.":"You overpaid {0} when the bill split was corrected.",
  "¿Lo descontamos de {0}?":"Apply it to {0}?",
  "Quedaría pendiente {0} (de {1})":"It would leave {0} pending (of {1})",
  "Descontar pago de más":"Apply overpayment",
  "Se descontaron {0} de {1}. Quedan {2}.":"{0} was applied to {1}. {2} left.",
  "No hay una cuenta pendiente a la que descontar el pago de más ({0}).":"There is no pending bill to apply the overpayment ({0}) to.",
  "Pago de más (reparto corregido)":"Overpayment (corrected split)",
  "− Pago de más":"− Overpayment"
});
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};
const rr=n=>typeof r2==='function'?r2(n):Math.round((+n||0)*100)/100;
const ff=n=>typeof f==='function'?f(n):'$'+(+n||0).toFixed(2);
const mesOf=k=>typeof lbl==='function'?lbl(k):k;
function remOf(b){return rr((+b.amount||0)-(+b.paid||0))}
function excessOf(b){return rr(Math.max(0,(+b.paid||0)-(+b.amount||0)))}
function billExcess(m){return rr((m&&m.bills||[]).reduce((s,b)=>s+excessOf(b),0))}
function pendingBills(m){return (m&&m.bills||[]).filter(b=>remOf(b)>0.005)}
function isCarBill(b){return /letra|carro|auto|car\s*(letter|loan|payment)?/i.test(String((b&&b.name)||'')+' '+(b&&b.sheetKey||''))}
function preferPend(pend){return pend.find(isCarBill)||pend[0]||null}
function overplan(m){
  if(!m)return {excess:0,pend:[],target:null,overBills:[]};
  const overBills=(m.bills||[]).filter(b=>excessOf(b)>0.004);
  const pend=pendingBills(m),target=preferPend(pend),excess=billExcess(m);
  return {excess,pend,target,overBills,can:excess>0.004&&!!target};
}
function overDesc(k){return tt('Ajuste: pago de más en cuentas de {0}',mesOf(k))}

function applyOverpay(k,billId,amt){
  const m=S.months[k];if(!m)return {err:'mes'};
  const plan=overplan(m),b=(m.bills||[]).find(x=>x.id===billId);
  if(!b)return {err:'cuenta'};
  const use=rr(Math.min(+amt||0,plan.excess,remOf(b)));
  if(!(use>0.004))return {err:'nada'};
  const changes=[];
  let left=use;
  (m.bills||[]).forEach(x=>{
    const ex=excessOf(x);if(!(ex>0.004)||!(left>0.004))return;
    const take=rr(Math.min(ex,left)),prev=+x.paid||0,next=rr(prev-take);
    changes.push({id:x.id,prev,next,role:'excess'});
    if(next>0.004)x.paid=next;else delete x.paid;
    left=rr(left-take);
  });
  const prevT=+b.paid||0,nextT=rr(prevT+use);
  b.paid=nextT;
  changes.push({id:b.id,prev:prevT,next:nextT,role:'credit'});
  m.events=m.events||[];
  m.events.push({id:typeof uid==='function'?uid():('ov'+Date.now()),type:'tonyOver',date:typeof today==='function'?today():new Date().toISOString().slice(0,10),amount:use,desc:overDesc(k),billId:b.id,bills:changes});
  if(typeof save==='function')save();
  if(typeof render==='function')render();
  return {ok:true,use,name:b.name,left:remOf(b)};
}

function offerOverpay(k,after){
  const m=S.months[k];if(!m)return;
  const plan=overplan(m);
  if(!(plan.excess>0.004)){if(after)after();return}
  const names=plan.overBills.map(b=>(typeof DN==='function'?DN(b.name):b.name)+' '+ff(excessOf(b))).join(', ');
  if(!plan.target){
    dlg().innerHTML=`<h2>${esc(tt('Descontar pago de más'))}</h2>
      <div id="v172msg" style="font-size:15px;margin:8px 0 14px">${esc(tt('Pagaste de más {0} al corregir el reparto de las cuentas.',ff(plan.excess)))}
        ${names?`<div class="muted" style="margin-top:6px">${esc(names)}</div>`:''}
        <div style="margin-top:8px">${esc(tt('No hay una cuenta pendiente a la que descontar el pago de más ({0}).',ff(plan.excess)))}</div></div>
      <button class="sec" style="width:100%" onclick="dlg().close()">${T('Cerrar')}</button>`;
    if(!dlg().open)dlg().showModal();
    return;
  }
  const t=plan.target,room=remOf(t),pre=rr(Math.min(plan.excess,room)),left=rr(room-pre);
  const nm=typeof DN==='function'?DN(t.name):t.name;
  dlg().innerHTML=`<h2>${esc(tt('Descontar pago de más'))}</h2>
    <div id="v172msg" style="font-size:15px;margin:8px 0">${esc(tt('Pagaste de más {0} al corregir el reparto de las cuentas.',ff(plan.excess)))}
      ${names?`<div class="muted" style="margin-top:6px">${esc(names)}</div>`:''}
      <div style="margin-top:8px">${esc(tt('¿Lo descontamos de {0}?',nm))}</div>
      <div class="muted" id="v172left">${esc(tt('Quedaría pendiente {0} (de {1})',ff(left),ff(+t.amount||0)))}</div>
    </div>
    <p><input id="v172amt" class="name" type="number" inputmode="decimal" step="0.01" min="0" max="${room}" value="${pre}" style="font-size:24px"></p>
    <div class="grid" style="margin-top:12px"><button class="sec" id="v172no">${T('Cancelar')}</button>
      <button id="v172ok">${T('Aplicar')}</button></div>`;
  if(!dlg().open)dlg().showModal();
  const inp=document.getElementById('v172amt'),lab=document.getElementById('v172left');
  const sync=()=>{const v=rr(Math.max(0,Math.min(+inp.value||0,room)));if(lab)lab.textContent=tt('Quedaría pendiente {0} (de {1})',ff(rr(room-v)),ff(+t.amount||0))};
  if(inp)inp.addEventListener('input',sync);
  document.getElementById('v172no').onclick=()=>{dlg().close()};
  document.getElementById('v172ok').onclick=()=>{
    const v=rr(+document.getElementById('v172amt').value||0);
    const r=applyOverpay(k,t.id,v);
    if(r.ok){dlg().close();if(typeof toast==='function')toast(tt('Se descontaron {0} de {1}. Quedan {2}.',ff(r.use),typeof DN==='function'?DN(r.name):r.name,ff(r.left)));if(after)after()}
    else if(typeof alert==='function')alert(r.err||'');
  };
}
window.v172Offer=offerOverpay;
window.v172Apply=applyOverpay;

function overBtnHtml(k){
  k=k||(typeof S!=='undefined'?S.cur:'');
  const m=S.months&&S.months[k];if(!m)return '';
  const plan=overplan(m);if(!plan.can)return '';
  const nm=typeof DN==='function'?DN(plan.target.name):plan.target.name;
  return `<div class="card" id="v172over" style="border:2px solid #d97706">
    <div class="row"><span class="n">${esc(tt('Pagaste de más {0} al corregir el reparto de las cuentas.',ff(plan.excess)))}
      <div class="muted">${esc(tt('¿Lo descontamos de {0}?',nm))} · ${esc(tt('Quedaría pendiente {0} (de {1})',ff(rr(remOf(plan.target)-Math.min(plan.excess,remOf(plan.target)))),ff(+plan.target.amount||0)))}</div></span>
      <button type="button" class="pay" id="v172btn" onclick="v172Offer('${k}')">${esc(tt('Descontar pago de más'))}</button></div></div>`;
}
function adjNoteHtml(k){
  const m=S.months&&S.months[k||S.cur];if(!m)return '';
  const ev=(m.events||[]).filter(e=>e&&e.type==='tonyOver');if(!ev.length)return '';
  return ev.map(e=>`<div class="muted" id="v172note">📝 ${esc(e.desc||overDesc(k))} · ${ff(e.amount)}</div>`).join('');
}

// Reportes: botón de ajuste + Reparto (Carlos → Tony) junto a Cuentas de Tony
if(typeof rep==='function'){
  const prev=rep;
  rep=function(){
    const k=typeof S!=='undefined'?S.cur:'';
    return prev.apply(this,arguments)+overBtnHtml(k)+adjNoteHtml(k)+(typeof bsShareCard==='function'?bsShareCard():'');
  };
}

// Tras aprobar una hoja: si hay pago de más y una cuenta pendiente (p. ej. la letra), ofrecer el descuento
if(typeof bsOk==='function'){
  const prev=bsOk;
  bsOk=function(id,force){
    const x=typeof INBOX!=='undefined'?INBOX.find(y=>y.id===id):null;
    const k=x&&x.month;
    const r=prev.apply(this,arguments);
    try{
      if(k&&S.months[k]&&overplan(S.months[k]).excess>0.004){
        setTimeout(()=>offerOverpay(k),50);
      }
    }catch(e){console.warn('v172',e)}
    return r;
  };
}

// Diálogo Transferir: si aún no se aplicó el ajuste, se descuenta el pago de más del total
if(typeof tonyTot==='function'){
  const prev=tonyTot;
  tonyTot=function(){
    const t=prev.apply(this,arguments);
    try{
      const m=typeof TK!=='undefined'&&S.months[TK];
      const ex=m?billExcess(m):0;
      if(ex>0.004){
        const n=rr(Math.max(0,t-ex));
        const e=document.getElementById('pa');if(e)e.textContent=ff(n);
        let row=document.getElementById('v172payex');
        if(!row){row=document.createElement('div');row.id='v172payex';row.className='row';
          const box=document.getElementById('pa')&&document.getElementById('pa').closest('div');
          if(box&&box.parentNode)box.parentNode.insertBefore(row,box)}
        row.innerHTML=`<span class="n">${esc(tt('− Pago de más'))}<div class="muted">${esc(tt('Pago de más (reparto corregido)'))}</div></span><span>−${ff(ex)}</span>`;
        return n;
      }
    }catch(e){}
    return t;
  };
}
if(typeof payDlg==='function'){
  const prev=payDlg;
  payDlg=function(who,k){
    if(who==='tony'&&S.months[k]&&overplan(S.months[k]).can){
      offerOverpay(k,()=>prev.call(this,'tony',k));
      return;
    }
    return prev.apply(this,arguments);
  };
}

// Deshacer el ajuste: restablece b.paid; no toca el débito
if(typeof delMove==='function'){
  const prev=delMove;
  delMove=function(kind,id){
    if(kind!=='tonyOver'&&kind!=='events'){
      // try to find by id
    }
    const m=typeof findMonth==='function'?(()=>{try{return findMonth('events',id)}catch(e){return null}})():null;
    const e=m&&(m.events||[]).find(x=>x.id===id);
    if(e&&e.type==='tonyOver'){
      if(!confirm(T('¿Borrar este movimiento? Se revierte el saldo.')))return;
      (e.bills||[]).forEach(p=>{const b=m.bills.find(x=>x.id===p.id);if(!b)return;if(p.prev>0.004)b.paid=p.prev;else delete b.paid});
      m.events=m.events.filter(y=>y.id!==id);
      if(typeof save==='function')save();
      if(typeof render==='function')render();
      return;
    }
    return prev.apply(this,arguments);
  };
}

// AB-9: quitar líneas de compra por tienda; dejar totales y cuentas
function isStoreLine(x){
  if(!x)return false;
  if(/le transfiere a|transfers .* to |^TOTAL:|PENDIENTE|YA LE PAGASTE|YA TRANSFERIDO|YA PAGASTE|El detalle está|Todo al día|Hola |^CUENTAS|^COMPRAS|TU PARTE|ENTRE TÚ|BETWEEN YOU|Total compras|Total tu parte|Total cuentas|^\(cuentas|^\(bills /i.test(x))return false;
  // "12 oct · Costco — $50.00" o "Costco — $50.00"
  return / — (−)?\$[\d,]+\.\d{2}\s*$/.test(x) && !x.startsWith('TOTAL');
}
function stripStores(s){
  const L=String(s||'').split('\n').filter(x=>!isStoreLine(x));
  const out=[];
  for(const x of L){if(x===''&&out.length&&out[out.length-1]==='')continue;out.push(x)}
  while(out.length&&out[0]==='')out.shift();
  while(out.length&&out[out.length-1]==='')out.pop();
  return out.join('\n');
}
if(typeof msgShort==='function'){
  const prev=msgShort;
  msgShort=function(who,k){const s=prev(who,k);try{return stripStores(s)}catch(e){console.warn('v172 msg',e);return s}};
}
// msgPdfText ya es corto; no se toca el PDF

window._v172={billExcess,pendingBills,overplan,applyOverpay,offerOverpay,stripStores,isStoreLine,overBtnHtml,isCarBill};
})();
