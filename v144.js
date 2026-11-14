/* v144 — ↩️ Devolución a la tarjeta
   Joe elige la tarjeta y la compra del mes seleccionado (S.cur).
   El app no guarda fecha de corte, solo el día de vencimiento (S.cardDue).
   Baja el saldo de la tarjeta. No toca el débito ni es un ingreso.
   Rebaja spent() de Joe; no muta shares ni deudas de Tony/Carlos. */
(function(){
const RF='cardref';
const $=id=>document.getElementById(id);
let _busy=0;
function rfToday(){return new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'})}
function rfMonth(d){return String(d||'').slice(0,7)}
function rfLive(){return S.months[keys().at(-1)]||L()}
function rfCardBy(id,name){const cs=rfLive().cards||[];return cs.find(c=>id&&c.id===id)||cs.find(c=>name&&c.name===name)||null}
function rfAll(){const o=[];keys().forEach(k=>(S.months[k].events||[]).forEach(e=>{if(e.type===RF)o.push({k,e})}));return o}
function rfUsed(src,srcId,except){if(!src||!srcId)return 0;return r2(rfAll().filter(x=>x.e.src===src&&x.e.srcId===srcId&&x.e.id!==except).reduce((s,x)=>s+(+x.e.amount||0),0))}
function shOf(p){const s=p&&p.shares||{};return {tony:+s.Tony||+s.tony||0,carlos:+s.Carlos||+s.carlos||0,yo:+s.Yo||+s.yo||0}}
function rfJoe(p){const sh=shOf(p),tot=r2(+p.total||0);return r2(Math.max(0,tot-sh.tony-sh.carlos))}
function rfSrcAmt(src,x){return src==='compra'?rfJoe(x):r2(+x.amount||0)}
function isShared(p){const sh=shOf(p);return sh.tony>0.004||sh.carlos>0.004}
function rfFind(src,srcId,month){const m=S.months[month];if(!m||!srcId)return null;return src==='compra'?(m.purchases||[]).find(p=>p.id===srcId):(m.personal||[]).find(x=>x.id===srcId)}
function rfCharges(card){
  const k=S.cur,m=S.months[k];if(!m||!card)return[];
  const meth='card:'+card.name,out=[];
  (m.personal||[]).forEach(x=>{
    if(x.method!==meth)return;
    const used=rfUsed('gasto',x.id),tot=r2(+x.amount||0),left=r2(tot-used);
    if(left<0.005)return;
    out.push({src:'gasto',srcId:x.id,srcMonth:k,date:x.date,store:x.desc||x.cat||T('Gasto'),cat:x.cat||'📦 Otros',tot,left,shared:false,items:[]});
  });
  (m.purchases||[]).forEach(p=>{
    if(p.method!==meth)return;
    const used=rfUsed('compra',p.id),tot=rfJoe(p),left=r2(tot-used);
    if(left<0.005)return;
    const items=(typeof pList==='function'?pList(p):(p.list||p.items||[])).map(it=>({n:it.n||it.name||'',a:+(it.a!=null?it.a:it.price)||0}));
    out.push({src:'compra',srcId:p.id,srcMonth:k,date:p.date,store:p.store||T('Compra'),cat:(typeof pCat==='function'?pCat(p):p.cat)||'🛒 Mercado',tot,left,shared:isShared(p),items});
  });
  return out;
}
function rfScore(c,amt,note){
  let s=0;const a=+amt||0,n=(note||'').toLowerCase(),st=(c.store||'').toLowerCase();
  if(a>0.004&&Math.abs(c.left-a)<0.004)s+=5;
  if(a>0.004&&c.items.some(it=>Math.abs((+it.a||0)-a)<0.004))s+=4;
  if(a>0.004&&c.left+0.004>=a)s+=2;
  if(n&&st&&(st.includes(n)||n.includes(st)))s+=3;
  return s;
}
function rfSorted(card,amt,note){
  return rfCharges(card).slice().sort((a,b)=>{
    const d=rfScore(b,amt,note)-rfScore(a,amt,note);
    if(d)return d;return String(b.date||'').localeCompare(String(a.date||''))||(b.left-a.left);
  });
}
let _lastSig='',_lastAt=0;
function rfSave(p){
  const amt0=r2(+p.amount),sig=[p.cardId||p.cardName,p.src,p.srcId,amt0,p.date||''].join('|'),now=Date.now();
  if(_busy||(sig===_lastSig&&now-_lastAt<2000))return false;
  _busy=1;
  try{
    const amt=amt0;if(!(amt>0)){toast(T('Escribe un monto válido'));return false}
    const card=rfCardBy(p.cardId,p.cardName);
    if(!card){toast(T('Elige una tarjeta'));return false}
    const date=p.date||rfToday(),note=(p.note||'').trim();
    let src=p.src||'',srcId=p.srcId||'',srcMonth=p.srcMonth||S.cur,cat='📦 Otros',store='',shared=false,joeAdj=amt;
    if(src&&src!=='fallback'&&srcId){
      const x=rfFind(src,srcId,srcMonth);
      if(!x){toast(T('Esa compra ya no está'));return false}
      const left=r2(rfSrcAmt(src,x)-rfUsed(src,srcId,p.editId));
      if(amt>left+0.004){toast(T('El monto no puede ser mayor que lo que queda en esa compra ({0})',f(left)));return false}
      cat=src==='compra'?((typeof pCat==='function'?pCat(x):x.cat)||'🛒 Mercado'):(x.cat||'📦 Otros');
      store=src==='compra'?(x.store||''):(x.desc||x.cat||'');
      shared=src==='compra'&&isShared(x);
      joeAdj=amt;
    }else{
      src='fallback';srcId='';srcMonth=rfMonth(date)||S.cur;
      cat='📦 Otros';store=note||T('Devolución');
    }
    const liveCard=rfCardBy(card.id,card.name);
    if(!liveCard){toast(T('No encuentro esa tarjeta'));return false}
    const ev={id:p.editId||uid(),type:RF,date,amount:amt,note,cardId:liveCard.id,cardName:liveCard.name,cardMonth:keys().at(-1),src,srcId,srcMonth,cat,store,joeAdj,shared:!!shared};
    const mk=rfMonth(date)||S.cur;
    if(!S.months[mk]){toast(T('Mes no válido'));return false}
    if(p.editId){
      const old=rfAll().find(x=>x.e.id===p.editId);
      if(old){
        spend('card:'+old.e.cardName, +old.e.amount);
        S.months[old.k].events=(S.months[old.k].events||[]).filter(e=>e.id!==p.editId);
      }
    }
    spend('card:'+liveCard.name, -amt);
    S.months[mk].events=S.months[mk].events||[];
    S.months[mk].events.push(ev);
    _lastSig=sig;_lastAt=Date.now();
    save();toast(T('Devolución de {0} en {1}',f(amt),liveCard.name));
    dlg()&&dlg().close();render();return true;
  }finally{_busy=0}
}
function rfDel(id){
  const hit=rfAll().find(x=>x.e.id===id);if(!hit)return;
  spend('card:'+hit.e.cardName, +hit.e.amount);
  S.months[hit.k].events=S.months[hit.k].events.filter(e=>e.id!==id);
  save();toast(T('Devolución anulada'));render();
}
function rfForm(pref){
  pref=pref||{};
  const cards=(rfLive().cards||[]).filter(c=>c.name);
  let cardId=pref.cardId||'',amt=pref.amount!=null?pref.amount:'',date=pref.date||rfToday(),note=pref.note||'',src=pref.src||'',srcId=pref.srcId||'',srcMonth=pref.srcMonth||S.cur;
  function card(){return rfCardBy(cardId)}
  function list(){return rfSorted(card(),amt,note)}
  function chosen(){return list().find(c=>c.src===src&&c.srcId===srcId)||null}
  function sync(){const ia=$('rfamt'),id=$('rfdate'),ino=$('rfnote');if(ia)amt=ia.value;if(id)date=id.value||rfToday();if(ino)note=ino.value}
  function canOk(){const c=card(),ch=chosen(),empty=c&&!list().length,a=r2(+amt);return !!(c&&a>0&&((ch&&a<=ch.left+0.004)||(!ch&&empty)))}
  function paintList(){
    const c=card(),root=$('rflist');if(!root)return;
    if(!c){root.innerHTML=`<div class="muted" style="margin:8px 0">${T('Primero elige la tarjeta. Después verás las compras de este mes en ella.')}</div>`;return}
    const rows=list(),ch=chosen(),mes=S.cur;
    let html=`<div class="muted" style="margin:8px 0 6px">${T('Compras de {0} en {1} cargadas a esta tarjeta. Toca la que se devolvió. El periodo es el mes que tienes abierto; el app no guarda fecha de corte, solo el día de vencimiento.',esc(DN(c.name)),esc(mes))}</div>`;
    if(!rows.length){
      html+=`<div class="card" id="rffallback" style="background:var(--s2);margin:6px 0">${T('No hay compras de esta tarjeta en {0}. Puedes registrar la devolución igual: el saldo de la tarjeta baja y el gasto se rebaja en 📦 Otros de este mes. Tony y Carlos no cambian.',esc(mes))}</div>`;
    }else{
      html+=`<div id="rfpicks" style="max-height:240px;overflow:auto">${rows.map(r=>{
        const on=ch&&ch.src===r.src&&ch.srcId===r.srcId;
        const sc=rfScore(r,amt,note);
        const hint=sc>=4?` <span class="muted">· ${T('posible')}</span>`:'';
        const sh=r.shared?` <span class="muted">· ${T('compartida · se rebaja solo tu parte')}</span>`:'';
        return `<button type="button" class="${on?'pay':'sec'}" data-rfsrc="${r.src}" data-rfid="${esc(r.srcId)}" style="display:block;width:100%;text-align:left;margin:0 0 6px;padding:10px 12px">
          <div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(r.store)}</b><b>${f(r.left)}</b></div>
          <div class="muted">${esc(r.date||'')} · ${T('queda {0} de {1}',f(r.left),f(r.tot))}${hint}${sh}</div>
        </button>`;
      }).join('')}</div>`;
    }
    root.innerHTML=html;
  }
  function paintConf(){
    const box=$('rfconf'),ok=$('rfok');if(!box)return;
    const c=card(),ch=chosen(),empty=c&&!list().length,a=r2(+amt);
    if(c&&(ch||empty)&&a>0){
      const after=r2((+c.amount||0)-a);
      const over=ch&&a>ch.left+0.004;
      box.innerHTML=`<div class="card" id="rfconfirm" style="margin:10px 0 0;background:var(--s2)">
        <div><b>${T('Confirmación')}</b></div>
        <div>${T('Tarjeta')}: ${esc(DN(c.name))} · ${T('ahora')} ${f(c.amount)} → ${f(after)}</div>
        <div>${T('Monto')}: ${f(a)} · ${T('Fecha')}: ${esc(date)}</div>
        ${ch?`<div>${T('Compra')}: ${esc(ch.store)} · ${esc(ch.date||'')} · ${T('queda')} ${f(ch.left)}</div>`:`<div>${T('Sin compra del periodo · el gasto se rebaja en 📦 Otros')}</div>`}
        ${note?`<div class="muted">${esc(note)}</div>`:''}
        <div class="muted" style="margin-top:6px">${T('El débito no se toca. Esto no es un ingreso ni un reembolso de Carlos o Tony.')}</div>
        ${ch&&ch.shared?`<div class="muted">${T('Esta compra es compartida. Se rebaja solo tu gasto en reportes y presupuestos. Las partes de Tony y Carlos no cambian.')}</div>`:`<div class="muted">${T('Tony y Carlos no cambian.')}</div>`}
        ${over?`<div style="color:#dc2626">${T('El monto no puede ser mayor que lo que queda en esa compra.')}</div>`:''}
        ${after<-0.004?`<div class="muted">${T('Ojo: el saldo de la tarjeta quedaría en negativo.')}</div>`:''}
      </div>`;
    }else box.innerHTML='';
    if(ok)ok.disabled=!canOk();
  }
  function paint(){
    const chips=cards.map(x=>`<button type="button" class="${x.id===cardId?'pay':'sec'}" data-rfcard="${esc(x.id)}" style="margin:3px 4px 3px 0">${esc(DN(x.name))} · ${f(x.amount)}</button>`).join('')||`<span class="muted">${T('No hay tarjetas')}</span>`;
    const root=$('rfbox');if(!root)return;
    root.innerHTML=`
      <div class="fi"><label>${T('Tarjeta')}</label><div id="rfchips">${chips}</div></div>
      <div id="rflist"></div>
      <div class="fi"><label>${T('Monto')}</label><input id="rfamt" inputmode="decimal" value="${amt!==''?esc(String(amt)):''}" placeholder="0.00"></div>
      <div class="row2">
        <div class="fi"><label>${T('Fecha')}</label><input id="rfdate" type="date" value="${esc(date)}"></div>
        <div class="fi"><label>${T('Nota')} (${T('opcional')})</label><input id="rfnote" value="${esc(note)}" placeholder="${T('Ej. Amazon')}"></div>
      </div>
      <div id="rfconf"></div>
      <div class="row" style="margin-top:10px">
        <button type="button" class="sec" id="rfcancel">${T('Cancelar')}</button>
        <button type="button" class="pay" id="rfok">${T('Confirmar devolución')}</button>
      </div>`;
    root.onclick=e=>{
      const cb=e.target.closest&&e.target.closest('[data-rfcard]');
      if(cb){sync();cardId=cb.dataset.rfcard;src='';srcId='';paint();return}
      const pb=e.target.closest&&e.target.closest('[data-rfsrc]');
      if(pb){sync();src=pb.dataset.rfsrc;srcId=pb.dataset.rfid;srcMonth=S.cur;paintList();paintConf()}
    };
    const ia=$('rfamt'),id=$('rfdate'),ino=$('rfnote');
    if(ia)ia.oninput=()=>{sync();paintConf()};
    if(id)id.onchange=()=>{sync();paintConf()};
    if(ino)ino.oninput=()=>{sync();paintConf()};
    $('rfcancel').onclick=()=>dlg()&&dlg().close();
    $('rfok').onclick=()=>{
      sync();if(!canOk())return;
      const btn=$('rfok');if(btn.dataset.done)return;btn.dataset.done='1';btn.disabled=true;
      const c=card(),ch=chosen(),empty=c&&!list().length;
      const ok=rfSave({cardId,cardName:c&&c.name,amount:amt,date,note,src:ch?ch.src:(empty?'fallback':''),srcId:ch?ch.srcId:'',srcMonth:ch?ch.srcMonth:(empty?rfMonth(date)||S.cur:S.cur),editId:pref.editId});
      if(!ok&&btn){delete btn.dataset.done;btn.disabled=false}
    };
    paintList();paintConf();
  }
  dlg().innerHTML=`<h2>↩️ ${T('Devolución a la tarjeta')}</h2>
    <p class="muted">${T('Baja lo que debes en la tarjeta. El débito no se mueve. Elige la tarjeta y luego la compra del mes abierto.')}</p>
    <div id="rfbox"></div>`;
  if(!dlg().open)dlg().showModal();
  paint();
}
window.rfDlg=function(cardId){rfForm(cardId?{cardId}:{})};
window.rfEdit=function(id){
  const hit=rfAll().find(x=>x.e.id===id);if(!hit)return;
  const e=hit.e;rfForm({editId:e.id,cardId:e.cardId,amount:e.amount,date:e.date,note:e.note||'',src:e.src==='fallback'?'':e.src,srcId:e.srcId||'',srcMonth:e.srcMonth||hit.k});
};

const _fab=typeof fabMenu==='function'?fabMenu:null;
if(_fab)fabMenu=function(){
  const r=_fab.apply(this,arguments);
  const inc=$('fabinc');
  if(inc&&!$('fabrf')){
    inc.insertAdjacentHTML('afterend',
      `<button id="fabrf" class="sec" style="width:100%;text-align:left;min-height:60px;margin-top:8px;padding:10px 14px" onclick="rfDlg()"><b style="font-size:17px">↩️ ${T('Devolución a la tarjeta')}</b><div class="muted" style="font-size:13px;margin-top:2px">${T('Baja el saldo de una tarjeta. El débito no se toca.')}</div></button>`);
  }
  return r;
};
try{const fb=document.getElementById('fab');if(fb)fb.onclick=fabMenu}catch(e){}
const _bal=typeof balCard==='function'?balCard:null;
if(_bal)balCard=function(){
  return _bal.apply(this,arguments).replace(/<button class="pay"( disabled)? onclick="cardPayDlg\('([^']+)'\)">[^<]*<\/button>/g,
    (m,dis,id)=>`<button class="sec" onclick="rfDlg('${id}')">↩️ ${T('Devolución')}</button>`+m);
};
const _ml=typeof movList==='function'?movList:null;
if(_ml)movList=function(){
  return _ml.apply(this,arguments).replace(/<button class="del" onclick="delMove\('cardref','([^']+)'\)">✕<\/button>/g,
    (m,id)=>`<button class="sec" onclick="rfEdit('${id}')">✏️</button>`+m);
};
const _spent=spent;
spent=function(m){
  const r=_spent(m),by={...r.by};
  const k=m===S.months[S.cur]?S.cur:keys().find(x=>S.months[x]===m);
  if(k)rfAll().forEach(({e})=>{
    const mk=e.src==='fallback'?(rfMonth(e.date)||e.srcMonth):e.srcMonth;
    if(mk!==k)return;
    const cat=e.cat||'📦 Otros',adj=r2(+(e.joeAdj!=null?e.joeAdj:e.amount)||0);
    by[cat]=r2((by[cat]||0)-adj);
    if(Math.abs(by[cat])<0.005)delete by[cat];
  });
  return {by,total:r2(Object.values(by).reduce((a,b)=>a+b,0))};
};
const _moves=moves;
moves=function(m){
  return _moves(m).map(x=>{
    if(x.kind!==RF&&x.type!==RF)return x;
    const ev=(m.events||[]).find(e=>e.id===x.id&&e.type===RF)||rfAll().find(z=>z.e.id===x.id)?.e;
    if(!ev)return x;
    const st=ev.store?` · ${ev.store}`:'';
    return Object.assign({},x,{kind:RF,type:RF,amount:-r2(+ev.amount||0),cat:ev.cat||'📦 Otros',desc:`↩️ ${T('Devolución')}${st}`,method:'card:'+ev.cardName,date:ev.date});
  });
};
const _del=delMove;
delMove=function(kind,id){if(kind===RF||kind==='type:'+RF){if(!confirm(T('¿Anular esta devolución? El saldo de la tarjeta vuelve a subir.')))return;rfDel(id);return}return _del.apply(this,arguments)};

Object.assign(EN,{
  'Devolución a la tarjeta':'Card refund',
  'Devolución':'Refund',
  'Baja lo que debes en la tarjeta. El débito no se mueve. Elige la tarjeta y luego la compra del mes abierto.':'This lowers what you owe on the card. Debit does not move. Choose the card, then the purchase from the open month.',
  'Baja el saldo de una tarjeta. El débito no se toca.':'Lowers a card balance. Debit is not touched.',
  'Primero elige la tarjeta. Después verás las compras de este mes en ella.':'Choose a card first. Then you will see that card’s purchases from this month.',
  'Compras de {0} en {1} cargadas a esta tarjeta. Toca la que se devolvió. El periodo es el mes que tienes abierto; el app no guarda fecha de corte, solo el día de vencimiento.':'Purchases on {0} in {1} charged to this card. Tap the one that was refunded. The period is the month you have open; the app stores a due day, not a statement closing date.',
  'No hay compras de esta tarjeta en {0}. Puedes registrar la devolución igual: el saldo de la tarjeta baja y el gasto se rebaja en 📦 Otros de este mes. Tony y Carlos no cambian.':'There are no purchases on this card in {0}. You can still record the refund: the card balance goes down and spending is reduced under 📦 Other this month. Tony and Carlos do not change.',
  'Confirmación':'Confirmation',
  'ahora':'now',
  'Compra':'Purchase',
  'queda':'remaining',
  'queda {0} de {1}':'{0} of {1} left',
  'posible':'likely',
  'compartida · se rebaja solo tu parte':'shared · only your share is reduced',
  'Sin compra del periodo · el gasto se rebaja en 📦 Otros':'No purchase in this period · spending is reduced under 📦 Other',
  'El débito no se toca. Esto no es un ingreso ni un reembolso de Carlos o Tony.':'Debit is not touched. This is not income and not a Carlos or Tony payback.',
  'Esta compra es compartida. Se rebaja solo tu gasto en reportes y presupuestos. Las partes de Tony y Carlos no cambian.':'This purchase is shared. Only your spending in reports and budgets is reduced. Tony and Carlos’s shares do not change.',
  'Tony y Carlos no cambian.':'Tony and Carlos do not change.',
  'El monto no puede ser mayor que lo que queda en esa compra.':'The amount cannot be more than what is left on that purchase.',
  'El monto no puede ser mayor que lo que queda en esa compra ({0})':'The amount cannot be more than what is left on that purchase ({0})',
  'Ojo: el saldo de la tarjeta quedaría en negativo.':'Note: the card balance would go negative.',
  'Confirmar devolución':'Confirm refund',
  'Devolución de {0} en {1}':'{0} refunded on {1}',
  'Devolución anulada':'Refund undone',
  '¿Anular esta devolución? El saldo de la tarjeta vuelve a subir.':'Undo this refund? The card balance will go back up.',
  'Escribe un monto válido':'Enter a valid amount',
  'Elige una tarjeta':'Choose a card',
  'Esa compra ya no está':'That purchase is no longer there',
  'No encuentro esa tarjeta':'That card was not found',
  'No hay tarjetas':'No cards',
  'Mes no válido':'Invalid month',
  'Gasto':'Expense',
  'opcional':'optional',
  'Ej. Amazon':'e.g. Amazon'
});

window.rfSave=rfSave;window.rfDel=rfDel;window._v144={rfCharges,rfUsed,rfToday,rfSave,rfDel,rfAll,rfCardBy,rfForm,rfSorted,rfJoe,isShared,RF};
})();
