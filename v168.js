// v168 (Joe): Operaciones más simple. Un atajo «Compras» (luego tuya, compartida o recibo);
// Ingresos, Transferencia y Cobro. La búsqueda pasa a un 🔍 junto al mes. Se quita la
// tarjeta grande «Registrar ingreso» y se lista el historial del mes, con un botón chico
// para agregar. Débitos y Créditos van en una caja BANCO: el débito muestra entradas (+)
// y salidas (−); cada tarjeta muestra cargos, pagos y devoluciones del mes. Se quita la
// sección Movimientos. Dinero de terceros se esconde si está en $0 y, si hay pendiente,
// se ve dentro de Débitos. Cuentas de Tony pasa a Reportes (solo lectura; si falta la
// hoja, se pueden anotar los montos). Se quedan Resumen de reparto y Por hacer.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "Compra tuya":"Your purchase",
  "Agregar":"Add",
  "Entradas":"Inflows",
  "Salidas":"Outflows",
  "Cargo":"Charge",
  "Sin ingresos este mes.":"No income this month.",
  "Sin entradas este mes.":"No inflows this month.",
  "Sin salidas este mes.":"No outflows this month.",
  "+ Depósito de tercero":"+ Third-party deposit"
});

let OS_OPEN=false;
window.v168OsOpen=function(){return OS_OPEN};

if(typeof V114SC==='object'&&V114SC){
  V114SC.mov=[['🛒','Compras','v168NewBuy()'],['➕','Ingresos','incDlg()'],['🔁','Transferencia','xferDlg()'],['💵','Cobro','cobDlg()']];
}

window.v168NewBuy=function(){
  const d=typeof dlg==='function'?dlg():null;if(!d)return;
  d.innerHTML=`<h2>🛒 ${T('Compras')}</h2>
    <button type="button" id="v168buy-me" style="width:100%" onclick="dlg().close();quick()">🧾 ${T('Compra tuya')}</button>
    <button type="button" id="v168buy-sh" style="width:100%;margin-top:8px" onclick="dlg().close();editP()">🛒 ${T('Compra compartida')}</button>
    <button type="button" id="v168buy-sc" style="width:100%;margin-top:8px" onclick="dlg().close();scanReceipt()">📷 ${T('Cargar recibo')}</button>
    <button type="button" class="sec" id="v168buy-x" style="width:100%;margin-top:12px" onclick="dlg().close()">${T('Cancelar')}</button>`;
  if(!d.open)d.showModal();
};

function v168OsBtn(){
  const b0=document.getElementById('osbtn');
  if(b0){b0.setAttribute('aria-pressed',OS_OPEN?'true':'false');b0.classList.toggle('on',!!OS_OPEN);return}
  const sel=document.getElementById('msel'),nb=document.getElementById('newm');
  if(!sel)return;
  const b=document.createElement('button');
  b.id='osbtn';b.type='button';
  b.setAttribute('aria-label',T('Buscar en todos los meses'));
  b.setAttribute('title',T('Buscar en todos los meses'));
  b.textContent='🔍';
  b.onclick=window.v168OsToggle;
  (nb||sel).insertAdjacentElement(nb?'beforebegin':'afterend',b);
  b.setAttribute('aria-pressed',OS_OPEN?'true':'false');
  b.classList.toggle('on',!!OS_OPEN);
}
window.v168OsToggle=function(){
  OS_OPEN=!OS_OPEN;
  if(!OS_OPEN){try{OS_Q='';}catch(e){}}
  if(typeof render==='function')render();
  if(OS_OPEN)setTimeout(()=>{const i=document.getElementById('osq');if(i){i.focus();try{i.setSelectionRange(i.value.length,i.value.length)}catch(e){}}},50);
};

const _osCard=typeof osCard==='function'?osCard:null;
if(_osCard){
  osCard=function(){
    if(!(OS_OPEN||(typeof OS_Q==='string'&&OS_Q.trim())))return '';
    return _osCard.apply(this,arguments);
  };
}

function incItems(){
  const m=typeof M==='function'?M():null;if(!m)return [];
  return (typeof moves==='function'?moves(m):[]).filter(x=>x&&(x.kind==='income'||x.kind==='check'));
}
function incRow(x){
  const open=x.kind==='income'?` onclick="incEdit('${esc(x.id)}')" role="button"`:
    (x.kind==='check'?` onclick="depEditDlg('${esc(x.checkId||x.id)}')" role="button"`:'');
  return `<div class="row v168inc"><span class="n"${open}>${esc(x.desc)||esc(DN(x.cat))}<div class="muted">${typeof fdate==='function'?fdate(x.date):x.date} · ${esc(DN(x.cat))}</div></span><b class="pos">+${f(Math.abs(+x.amount||0))}</b></div>`;
}
if(typeof opsIngresos==='function'){
  opsIngresos=function(){
    const er=typeof earned==='function'?earned(M()):{total:0};
    const L=incItems();
    return `<div class="card" id="opinc"><h2>💵 ${T('Ingresos')} <button type="button" class="sec" id="opincb" onclick="incDlg()">＋ ${T('Agregar')}</button><span class="pos">${f(er.total)}</span></h2>
      <div id="inclist">${L.map(incRow).join('')||`<div class="muted" id="incempty" style="margin-top:6px">${T('Sin ingresos este mes.')}</div>`}</div></div>`;
  };
}

function isDebMeth(meth){
  const s=String(meth||'deb');
  if(s.startsWith('card:'))return false;
  return s==='deb'||s==='cash'||s.startsWith('money:')||s===''||s==='null';
}
function mvOpenAttr(x){
  if(!x)return '';
  const id=esc(x.id);
  if(x.kind==='income')return ` onclick="incEdit('${id}')" role="button"`;
  if(x.kind==='check')return ` onclick="depEditDlg('${esc(x.checkId||x.id)}')" role="button"`;
  if(x.kind==='compra')return ` onclick="editP('${id}')" role="button"`;
  if(x.kind==='gasto'&&typeof mvEdit==='function')return ` onclick="mvEdit('${id}')" role="button"`;
  if(x.kind==='held')return ` onclick="heldDlg('${esc(String(x.id).replace(/^hd:/,''))}')" role="button"`;
  return '';
}
function flowRow(x){
  const pos=+x.amount>=0,xfer=x.kind==='todebit'||x.kind==='carlos'||x.kind==='saving';
  const cls=xfer?'':pos?'pos':'';
  const sign=xfer?'↔ ':pos?'+':'−';
  const meth=x.method&&x.method!=='deb'&&typeof methName==='function'?' · '+esc(methName(x.method)):'';
  return `<div class="row v168mv"><span class="n"${mvOpenAttr(x)}>${esc(x.desc)||esc(DN(x.cat))}<div class="muted">${typeof fdate==='function'?fdate(x.date):x.date} · ${esc(DN(x.cat))}${meth}</div></span><b class="${cls}">${sign}${f(Math.abs(+x.amount||0))}</b></div>`;
}
const _held=typeof opsHeld==='function'?opsHeld:null;
if(_held)opsHeld=function(){return ''};

if(typeof opsDeb==='function'){
  const prev=opsDeb;
  opsDeb=function(){
    const h=prev.apply(this,arguments);
    const t=document.createElement('template');t.innerHTML=h;
    const chk=t.content.querySelector('#chkcard');if(chk)chk.remove();
    const cd=t.content.querySelector('#bal-income');if(!cd)return h;
    const L=(typeof moves==='function'?moves(M()):[]).filter(x=>isDebMeth(x.method));
    const inn=L.filter(x=>+x.amount>0.004),out=L.filter(x=>+x.amount<-0.004);
    const box=document.createElement('div');box.id='debflows';
    box.innerHTML=`<div class="muted v168h">＋ ${esc(T('Entradas'))}</div>${inn.map(flowRow).join('')||`<div class="muted">${T('Sin entradas este mes.')}</div>`}
      <div class="muted v168h">− ${esc(T('Salidas'))}</div>${out.map(flowRow).join('')||`<div class="muted">${T('Sin salidas este mes.')}</div>`}`;
    cd.appendChild(box);
    const pend=typeof heldPend==='function'&&heldPend()>0.004;
    if(pend&&_held){
      const th=document.createElement('template');th.innerHTML=_held();
      const hc=th.content.querySelector('#heldcard');
      if(hc){hc.classList.remove('defcol');hc.style.boxShadow='none';hc.style.margin='10px 0 0';cd.appendChild(hc)}
    }else if(typeof heldDlg==='function'){
      const b=document.createElement('button');b.type='button';b.className='lnk opsl';b.id='heldadd';
      b.style.marginTop='8px';b.textContent='🤝 '+T('+ Depósito de tercero');b.setAttribute('onclick','heldDlg()');
      cd.appendChild(b);
    }
    const wrap=document.createElement('div');wrap.appendChild(t.content);
    return wrap.innerHTML;
  };
}

function cardLines(name,id){
  const meth='card:'+name,m=M(),out=[];
  (m.personal||[]).forEach(x=>{if(x.method===meth)out.push({kind:'cargo',date:x.date,label:x.desc||DN(x.cat)||T('Cargo'),amt:-r2(+x.amount||0),id:x.id})});
  (m.purchases||[]).forEach(p=>{if(p.method===meth)out.push({kind:'cargo',date:p.date,label:DN(p.store)||T('Compra'),amt:-r2(+p.total||0),id:p.id})});
  (m.events||[]).forEach(e=>{
    if(e.type==='cardpay'&&(e.cardId===id||e.card===name||(e.desc||'')==='Pago '+name||String(e.desc||'').indexOf(name)>=0))
      out.push({kind:'pago',date:e.date,label:e.desc||T('Pago'),amt:r2(+e.amount||0),id:e.id});
    if(e.type==='cardref'&&(e.cardName===name||e.card===name))
      out.push({kind:'devolucion',date:e.date,label:T('Devolución')+(e.store?' · '+e.store:''),amt:r2(+e.amount||0),id:e.id});
    if(e.type==='adjust'&&e.lineKind==='cards'&&e.lineName===name)
      out.push({kind:'ajuste',date:e.date,label:T('Ajuste de saldo')+(e.note?' · '+e.note:''),amt:-r2(+e.diff||0),id:e.id});
    if(e.type==='income'&&e.method===meth)
      out.push({kind:'devolucion',date:e.date,label:DN(e.concept)||T('Ingreso'),amt:r2(+e.amount||0),id:e.id});
  });
  return out.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
}
if(typeof opsCred==='function'){
  const prev=opsCred;
  opsCred=function(){
    const h=prev.apply(this,arguments);
    const t=document.createElement('template');t.innerHTML=h;
    const cd=t.content.querySelector('#bal-cards');if(!cd)return h;
    const rows=[...cd.querySelectorAll(':scope>.row')];
    (M().cards||[]).forEach((c,i)=>{
      const row=rows[i];if(!row||!c)return;
      const L=cardLines(c.name,c.id);if(!L.length)return;
      const box=document.createElement('div');box.className='v168cf';box.id='cardflows-'+(c.id||i);
      box.innerHTML=L.map(x=>{
        const tag=x.kind==='cargo'?T('Cargo'):x.kind==='pago'?T('Pago'):x.kind==='devolucion'?T('Devolución'):(x.kind==='ajuste'?T('Ajuste de saldo'):'');
        const pos=+x.amt>=0;
        return `<div class="row"><span class="n">${esc(x.label)}<div class="muted">${typeof fdate==='function'?fdate(x.date):x.date}${tag?' · '+esc(tag):''}</div></span><b class="${pos?'pos':''}">${pos?'+':'−'}${f(Math.abs(+x.amt||0))}</b></div>`;
      }).join('');
      row.after(box);
    });
    const wrap=document.createElement('div');wrap.appendChild(t.content);
    return wrap.innerHTML;
  };
}

if(typeof opsMov==='function')opsMov=function(){return ''};
// Se esconde (no se borra): si #billsm no está en el documento, 📥 se cuelga al mostrar un error de lectura (v165).
function hideOpsBills(){
  if(typeof tab==='undefined'||tab!=='mov')return;
  const card=document.getElementById('billsm');if(!card)return;
  let p=card.previousElementSibling;
  while(p&&(p.id==='bsnotice'||p.id==='inberr')){const n=p.previousElementSibling;p.hidden=true;p.style.display='none';p=n}
  card.hidden=true;card.style.display='none';
}

function boxBanco(){
  if(typeof tab==='undefined'||tab!=='mov')return;
  const deb=document.getElementById('bal-income'),cred=document.getElementById('bal-cards');
  if(!deb||!cred)return;
  let box=document.getElementById('bancobox');
  if(box&&box.contains(deb)&&box.contains(cred))return;
  const head=[...document.querySelectorAll('.opsh')].find(e=>/🏦/.test(e.textContent||''));
  if(!box){box=document.createElement('div');box.id='bancobox'}
  const at=head||deb;
  if(box.parentNode!==at.parentNode)at.parentNode.insertBefore(box,at);
  if(head&&head.parentNode!==box)box.appendChild(head);
  if(deb.parentNode!==box)box.appendChild(deb);
  if(cred.parentNode!==box)box.appendChild(cred);
}

function billsRO(){
  if(typeof billsMonth!=='function')return '';
  const h=billsMonth();
  const missing=typeof _v150!=='undefined'&&_v150.monthUnapproved&&_v150.monthUnapproved(typeof S!=='undefined'?S.cur:'');
  const t=document.createElement('template');t.innerHTML=h;
  const card=t.content.querySelector('#billsm');
  if(card){
    card.classList.add('defcol');
    if(!missing){
      card.querySelectorAll('input[type=number]').forEach(inp=>{
        const sp=document.createElement('span');sp.className='amt ro';sp.style.cssText='min-width:84px;text-align:right;font-weight:600';
        const v=inp.value===''?0:+inp.value;sp.textContent=typeof f==='function'?f(v):String(v);
        inp.replaceWith(sp);
      });
    }
  }
  const wrap=document.createElement('div');wrap.appendChild(t.content);return wrap.innerHTML;
}
if(typeof rep==='function'){
  const prev=rep;
  rep=function(){return prev.apply(this,arguments)+billsRO()};
}

if(typeof render==='function'){
  const prev=render;
  render=function(){
    const r=prev.apply(this,arguments);
    try{
      v168OsBtn();
      const v=document.getElementById('v');
      if(v&&_osCard&&(OS_OPEN||(typeof OS_Q==='string'&&OS_Q.trim()))&&!v.querySelector('#oscard')){
        v.insertAdjacentHTML('afterbegin',_osCard());
      }
      if(typeof tab!=='undefined'&&tab==='mov'){boxBanco();hideOpsBills();}
    }catch(e){console.warn('v168',e)}
    return r;
  };
}

document.head.insertAdjacentHTML('beforeend',`<style>
#osbtn{min-width:44px;min-height:44px;padding:0 8px;font-size:18px;flex:none;line-height:1}
#osbtn.on,#osbtn[aria-pressed="true"]{background:#1d4ed8}
#opinc h2{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#opinc #opincb{width:auto;min-height:34px;padding:0 12px;font-size:14px;font-weight:600}
#opinc h2>.pos{margin-left:auto}
#bancobox{border:1px solid #e2e8f0;border-radius:16px;padding:8px 8px 4px;background:#f8fafc;margin:8px 0 12px}
#bancobox>.card{margin:8px 0}
#bancobox .opsh{margin:6px 8px 4px}
.v168h{font-weight:700;margin:10px 2px 4px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#475569}
.v168cf{margin:0 0 8px 4px;padding:0 0 4px 10px;border-left:2px solid #cbd5e1}
#heldadd{text-align:left;color:#475569;font-weight:600;font-size:13px;min-height:36px}
#billsm .amt.ro{display:inline-block}
</style>`);

window._v168={boxBanco,incItems,cardLines,billsRO,isDebMeth,hideOpsBills};
})();
