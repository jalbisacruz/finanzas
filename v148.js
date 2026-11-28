// v148 (Joe): PAGAR de tarjeta con lista de cargos.
// Pones el monto del pago y marcas los cargos pendientes de ESA tarjeta (compras, gastos con tarjeta, donaciones,
// ajustes/intereses/cargos de «Ajustar», devoluciones como línea negativa). Abajo: «Falta $X» / «Sobra $X» / «✅ Cuadra».
// «Confirmar pago» solo se activa cuando lo marcado suma EXACTO el monto (al centavo). El efecto es el de siempre
// (baja la tarjeta, sale del débito, con el bloqueo de débito negativo) y además cada cargo pagado queda marcado
// con el id del pago (cpay) para que no salga la próxima vez. Lo no marcado sigue pendiente.
// Historial anterior (sin marcas): la primera vez que se paga una tarjeta, se recorren los cargos del más reciente al más
// viejo sumando hasta llegar al saldo actual. Esos son los pendientes; los más viejos se dan por pagados (cpay='legacy').
// Si el corte no cae justo, el cargo incluido más viejo queda pendiente solo por lo que falta («Resto $X de $Y», cpart),
// así la lista siempre suma exactamente el saldo. Desde ese primer pago todo queda marcado y no se adivina nada.
Object.assign(EN,{
 "Monto del pago":"Payment amount",
 "Pon el monto del pago":"Enter the payment amount",
 "Marca los cargos que estás pagando. El botón se activa cuando suman exactamente el monto.":"Check the charges you are paying. The button turns on when they add up exactly to the amount.",
 "Cargos pendientes":"Pending charges",
 "Marcar todo":"Check all",
 "Quitar marcas":"Clear",
 "Marcadas {0}":"Checked {0}",
 "Falta {0}":"Short {0}",
 "Sobra {0}":"Over {0}",
 "✅ Cuadra":"✅ Matches",
 "Saldo sin detalle":"Balance without detail",
 "Resto {0} de {1}":"Remaining {0} of {1}",
 "Saldo anterior o cambios sin detalle":"Earlier balance or changes without detail",
 "Ajuste de saldo":"Balance adjustment",
 "Devolución":"Refund",
 "Compartida":"Shared",
 "Esa lista cambió. Revísala y vuelve a marcar.":"That list changed. Review it and check again.",
 "No hay cargos pendientes en esta tarjeta.":"No pending charges on this card.",
 "Saldo {0} · se descuenta del débito. Marca los cargos que pagas.":"Balance {0} · taken from debit. Check the charges you are paying."
});
(function(){
 const $=id=>document.getElementById(id);
 const liveKey=()=>keys().at(-1);
 const liveCard=name=>{const m=S.months[liveKey()];return m&&(m.cards||[]).find(c=>c.name===name)};
 const cents=x=>Math.round((+x||0)*100);
 const LG=()=>{S.cardLedger=S.cardLedger||{};return S.cardLedger};

 // ---- todos los movimientos de la tarjeta, con signo (cargo +, crédito −) ----
 function allLines(name){const meth='card:'+name,out=[];
  keys().forEach(k=>{const m=S.months[k];
   (m.personal||[]).forEach((x,i)=>{if(x.method!==meth)return;
    out.push({key:'g:'+x.id,obj:x,date:x.date||k+'-01',seq:(m.personal.length-i),amt:r2(+x.amount||0),
     label:esc(typeof v181GLabel==='function'?v181GLabel(x,T('Gasto')):String(x.desc||DN(x.cat)||T('Gasto'))),tag:''})});
   (m.purchases||[]).forEach((p,i)=>{if(p.method!==meth)return;
    out.push({key:'p:'+p.id,obj:p,date:p.date||k+'-01',seq:(m.purchases.length-i),amt:r2(+p.total||0),
     label:esc(DN(p.store)||T('Compra')),tag:(+(p.shares||{}).Tony||+(p.shares||{}).Carlos)?T('Compartida'):''})});
   (m.events||[]).forEach((e,i)=>{let a=null,label='',tag='';
    if(e.type==='adjust'&&e.lineKind==='cards'&&e.lineName===name){a=r2(+e.diff||0);label='🛠️ '+T('Ajuste de saldo')+(e.note?' · '+esc(e.note):'')}
    else if(e.type==='cardref'&&e.cardName===name){a=-r2(+e.amount||0);label='↩️ '+T('Devolución')+(e.store?' · '+esc(e.store):'')}
    else if(e.type==='income'&&e.method===meth){a=-r2(+e.amount||0);label=esc(DN(e.concept)||T('Ingreso'))+(e.desc&&e.desc!==String(e.concept||'').replace(/^\S+\s/,'')?' · '+esc(e.desc):'')}
    if(a===null||!a)return;
    out.push({key:'e:'+e.id,obj:e,date:e.date||k+'-01',seq:1e6+i,amt:a,label,tag})})});
  return out.sort((a,b)=>(b.date<a.date?-1:b.date>a.date?1:0)||(b.seq-a.seq))}

 // ---- pendientes: con marcas (cpay/cpart) o, la primera vez, del más reciente hacia atrás hasta el saldo ----
 const remOf=l=>l.obj&&l.obj.cpart!=null?r2(+l.obj.cpart):l.amt;
 function withPart(l,rem){const full=l.amt;return {...l,full,amt:rem,part:true,tag:T('Resto {0} de {1}',f(rem),f(full))}}
 function pending(name){const c=liveCard(name),P=r2(+(c&&c.amount)||0),all=allLines(name),init=!!LG()[name];
  let pend=[],legacy=[],partial=null;
  if(init){pend=all.filter(l=>!l.obj.cpay).map(l=>l.obj.cpart!=null?withPart(l,r2(+l.obj.cpart)):l)}
  else{let cum=0,i=0;
   for(;i<all.length&&P>0;i++){if(Math.abs(r2(cum-P))<0.005)break;const l=all[i];
    if(l.amt>0&&r2(cum+l.amt)>P+0.004){const rem=r2(P-cum);const pl=withPart(l,rem);pend.push(pl);partial=pl;cum=P;i++;break}
    pend.push(l);cum=r2(cum+l.amt)}
   legacy=all.slice(i).filter(l=>!l.obj.cpay)}
  const sumP=r2(pend.reduce((s,l)=>s+l.amt,0)),resid=r2(P-sumP);
  if(Math.abs(resid)>0.004)pend=pend.concat([{key:'resid',obj:null,date:'',seq:-1,amt:resid,label:T('Saldo sin detalle'),tag:T('Saldo anterior o cambios sin detalle'),resid:true}]);
  return {name,card:c,balance:P,lines:pend,legacy,init,partial}}
 window.cpPending=pending;

 // ---- diálogo ----
 function lineHtml(l){const neg=l.amt<0;
  return `<label class="cpl" style="display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #e2e8f0;cursor:pointer">
   <input type="checkbox" class="cpc" data-k="${esc(l.key)}" data-c="${cents(l.amt)}" style="width:24px;height:24px;min-height:0;flex:none;margin:0">
   <span style="flex:1;min-width:0"><div style="overflow-wrap:anywhere">${l.label}</div><div class="muted" style="font-size:12px">${l.date?fdate(l.date):''}${l.tag?(l.date?' · ':'')+esc(l.tag):''}</div></span>
   <b style="${neg?'color:#15803d':''}">${neg?'−':''}${f(Math.abs(l.amt))}</b></label>`}
 function cardPayDlg(id){const c0=(M().cards||[]).find(x=>x.id===id);if(!c0)return;const lc=liveCard(c0.name);if(!lc||!(+lc.amount>0))return;
  const pd=pending(c0.name);
  dlg().innerHTML=`<h2>${T('Pagar {0}',esc(DN(c0.name)))}</h2><div class="muted">${T('Saldo {0} · se descuenta del débito. Marca los cargos que pagas.',f(lc.amount))}</div>
  <div class="grid" style="margin-top:8px"><label>${T('Monto del pago')}<input id="cpa" class="name" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0.00" value="${r2(lc.amount).toFixed(2)}" style="font-size:24px"></label>
   <label>${T('Fecha')}<input id="cpf" class="name" type="date" value="${today()}"></label></div>
  <div id="cpsum" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:10px 0 4px;padding:8px 10px;border-radius:10px;background:#f1f5f9"><span class="muted" id="cpmark"></span><b id="cpst" style="font-size:17px"></b></div>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><span class="muted" style="white-space:nowrap">${T('Cargos pendientes')}</span><span style="white-space:nowrap"><button type="button" class="lnk" id="cpall" style="width:auto;display:inline-block;min-height:32px;padding:0 6px;margin:0;color:#1d4ed8;font-weight:600;font-size:14px">${T('Marcar todo')}</button> <button type="button" class="lnk" id="cpnone" style="width:auto;display:inline-block;min-height:32px;padding:0 6px;margin:0;color:#1d4ed8;font-weight:600;font-size:14px">${T('Quitar marcas')}</button></span></div>
  <div id="cplist" style="max-height:34vh;overflow:auto;-webkit-overflow-scrolling:touch">${pd.lines.map(lineHtml).join('')||`<div class="muted" style="padding:8px 0">${T('No hay cargos pendientes en esta tarjeta.')}</div>`}</div>
  <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="cpok" disabled onclick="cpGo('${esc(c0.name)}')">${T('Confirmar pago')}</button></div>`;
  const tick=()=>{const a=cents($('cpa').value),sel=[...document.querySelectorAll('#cplist .cpc:checked')],s=sel.reduce((t,x)=>t+(+x.dataset.c||0),0),d=a-s,st=$('cpst'),ok=$('cpok');
   $('cpmark').textContent=T('Marcadas {0}',(s<0?'−':'')+f(Math.abs(s)/100));
   if(!(a>0)){st.textContent=T('Pon el monto del pago');st.style.color='#64748b'}
   else if(d===0&&sel.length){st.textContent=T('✅ Cuadra');st.style.color='#15803d'}
   else if(d>0){st.textContent=T('Falta {0}',f(d/100));st.style.color='#b45309'}
   else if(d<0){st.textContent=T('Sobra {0}',f(-d/100));st.style.color='#dc2626'}
   else{st.textContent=T('Falta {0}',f(a/100));st.style.color='#b45309'}
   ok.disabled=!(a>0&&sel.length&&d===0)};
  $('cpa').addEventListener('input',tick);
  document.querySelectorAll('#cplist .cpc').forEach(x=>x.addEventListener('change',tick));
  $('cpall').onclick=()=>{document.querySelectorAll('#cplist .cpc').forEach(x=>x.checked=true);tick()};
  $('cpnone').onclick=()=>{document.querySelectorAll('#cplist .cpc').forEach(x=>x.checked=false);tick()};
  tick();if(!dlg().open)dlg().showModal()}
 window.cardPayDlg=cardPayDlg;

 // ---- pagar ----
 let busy=0;
 function cpGo(name){if(busy)return;const c=liveCard(name);if(!c)return;
  const a=r2(($('cpa')||{}).value),d=($('cpf')||{}).value||today(),keysSel=[...document.querySelectorAll('#cplist .cpc:checked')].map(x=>x.dataset.k);
  if(!(a>0))return alert(T('Pon el monto del pago'));
  const pd=pending(name),byKey=new Map(pd.lines.map(l=>[l.key,l])),sel=keysSel.map(k=>byKey.get(k));
  if(!keysSel.length||sel.some(x=>!x)){alert(T('Esa lista cambió. Revísala y vuelve a marcar.'));return cardPayDlg((M().cards.find(x=>x.name===name)||{}).id)}
  const s=sel.reduce((t,l)=>t+cents(l.amt),0);
  if(s!==cents(a))return;                                  // nunca paga si no suma exacto
  if(a>r2(c.amount)+0.001&&!confirm(T('El monto es mayor que el saldo. ¿Continuar?')))return;
  if(noDeb(a))return;                                      // bloqueo de débito negativo, como siempre
  busy=1;try{
   const payId=uid();
   c.amount=r2(c.amount-a);spend('deb',a);
   sel.forEach(l=>{if(l.obj)l.obj.cpay=payId});
   if(!pd.init){pd.legacy.forEach(l=>{l.obj.cpay='legacy'});if(pd.partial)pd.partial.obj.cpart=pd.partial.amt;LG()[name]={init:today(),legacy:pd.legacy.length,partial:pd.partial?pd.partial.key:''}}
   const rs=sel.find(l=>l.resid);
   S.months[monthFor(d)].events.push({id:payId,type:'cardpay',date:d,amount:a,desc:'Pago '+name,cardId:c.id,cardMonth:liveKey(),payId,lines:sel.filter(l=>!l.resid).map(l=>l.key),...(rs?{resid:rs.amt}:{})});
   save();dlg().close();render();toast(T('Pago registrado'))}finally{busy=0}}
 window.cpGo=cpGo;

 // ---- anular un pago: sus cargos vuelven a pendientes ----
 {const _d=delMove;delMove=function(kind,id){const hit=kind==='cardpay'?Object.values(S.months).flatMap(m=>m.events||[]).find(e=>e.id===id):null;
  const r=_d.apply(this,arguments);
  if(hit&&hit.payId&&!Object.values(S.months).some(m=>(m.events||[]).some(e=>e.id===id))){
   Object.values(S.months).forEach(m=>{(m.personal||[]).concat(m.purchases||[],m.events||[]).forEach(o=>{if(o.cpay===hit.payId)delete o.cpay})});save();render()}
  return r}}
})();
