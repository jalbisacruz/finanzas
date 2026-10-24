// v105 (Joe): «💵 Cobro» = cobro parcial antes de fin de mes. Joe elige quién paga (Tony o Carlos) y marca las compras compartidas
// (pagadas por Joe) cuya parte está saldando; el monto es la suma de esas partes (no se escribe). Entra al débito.
// Se guarda como evento {type:'cobro',who,date,amount,items:[{id,a}],method:'deb'} en el mes de esas compras (uno por mes).
// calc(): Tony: su parte pendiente baja (lo que Joe le transfiere sube en lo cobrado); Carlos: cuenta como pagado a Joe.
// «Cómo se calcula» lo muestra como línea «Ya cobrado (Cobros)». Una parte no se cobra dos veces; una compra con Cobro no se edita
// ni se borra (primero se borra el Cobro con ✕ en Movimientos, que lo revierte).
Object.assign(EN,{"💵 Cobro":"💵 Collect payment","Cobro":"Collect payment","Tony o Carlos te paga su parte de compras compartidas":"Tony or Carlos pays you their share of shared purchases",
 "¿Quién paga?":"Who pays?","Marca las compras que está pagando":"Tick the purchases being paid","No hay compras pendientes de {0}.":"No pending purchases from {0}.",
 "Monto":"Amount","Marca al menos una compra":"Tick at least one purchase","Cobro guardado":"Payment collected","💵 Cobros":"💵 Collected payments",
 "Ya cobrado a {0} (Cobros)":"Already collected from {0} (payments)","Esta compra tiene un Cobro de {0}. Para editarla o borrarla, primero borra el Cobro (✕ en Movimientos).":"This purchase has a payment from {0}. To edit or delete it, first delete that payment (✕ in Entries).",
 "Sin cobros este mes.":"No collected payments this month.","Entra a tu débito.":"Goes into your debit."});
const COBW=['Tony','Carlos'];
const cobEv=m=>((m&&m.events)||[]).filter(e=>e.type==='cobro');
const cobSum=(m,w)=>r2(cobEv(m).filter(e=>e.who===w).reduce((s,e)=>s+(+e.amount||0),0));
function cobOf(pid){for(const k of keys())for(const e of cobEv(S.months[k]))if((e.items||[]).some(i=>i.id===pid))return e;return null}
function cobDone(w){const s=new Set();keys().forEach(k=>cobEv(S.months[k]).filter(e=>e.who===w).forEach(e=>(e.items||[]).forEach(i=>s.add(i.id))));return s}
function cobList(w){const done=cobDone(w),last=keys().at(-1),o=[];
 keys().forEach(k=>{const m=S.months[k],c=calc(m),due=w==='Tony'?c.tonyDue:c.carlosDue;if(k!==last&&!(due>0.005))return;
  byNew(m.purchases,undefined,k).forEach(p=>{const a=r2(+(p.shares||{})[w]||0);if(!p.paidBy&&a>0.004&&!done.has(p.id))o.push({k,p,a})})});return o}
// ---------- calc ----------
{const _c=calc;calc=function(m){const r=_c(m),XT=cobSum(m,'Tony'),XC=cobSum(m,'Carlos');if(!(XT>0.004)&&!(XC>0.004))return r;const o={...r};
 if(XT>0.004){o.tony=r2(r.tony-XT);o.toTony=r2(r.toTony+XT);o.tonyDue=Math.max(0,r2(o.toTony-r.xfer));o.money=r2(r.money-XT)}
 if(XC>0.004){const n0=r2((r.carlosOwes??r.carlos)-r.recv),n1=r2(n0-XC),d0=Math.max(0,n0),d1=Math.max(0,n1),j0=Math.max(0,-n0),j1=Math.max(0,-n1);
  o.recv=r2(r.recv+XC);o.carlosDue=d1;if('joeOwesCarlos' in r)o.joeOwesCarlos=j1;o.money=r2(o.money+d1-d0);o.debt=r2(r.debt+j1-j0)}
 o.cobT=XT;o.cobC=XC;o.bal=r2(o.money-o.debt);return o}}
// ---------- + › Cobro ----------
{const _f=fabMenu;fabMenu=function(){const r=_f.apply(this,arguments);const b=document.getElementById('fabloan')||document.getElementById('fabsub')||document.getElementById('fabinc');if(b&&!document.getElementById('fabcob'))b.insertAdjacentHTML('afterend',`<button id="fabcob" class="sec" style="width:100%;text-align:left;min-height:60px;margin-top:8px;padding:10px 14px" onclick="cobDlg()"><b style="font-size:17px">${T('💵 Cobro')}</b><div class="muted" style="font-size:13px;margin-top:2px">${T('Tony o Carlos te paga su parte de compras compartidas')}</div></button>`);return r}}
{const fb=document.getElementById('fab');if(fb)fb.onclick=fabMenu}
function cobDlg(w){const L2=w?cobList(w):[];
 dlg().innerHTML=`<h2>${T('Cobro')}</h2><div class="muted">${T('Entra a tu débito.')}</div>
 <p class="muted" style="margin:10px 0 4px">${T('¿Quién paga?')}</p><div class="grid">${COBW.map(x=>`<button id="cbw-${x}" class="${x===w?'':'sec'}" onclick="cobDlg('${x}')">${esc(DN(x))}</button>`).join('')}</div>
 ${w?(L2.length?`<p class="muted" style="margin:12px 0 4px">${T('Marca las compras que está pagando')}</p><div id="cbl" style="max-height:42vh;overflow:auto">${L2.map(({k,p,a})=>`<label class="row" style="gap:10px;align-items:center"><input type="checkbox" class="cbx" data-id="${esc(p.id)}" data-k="${esc(k)}" data-a="${a}" style="width:22px;height:22px" onchange="cobTot()"><span class="n">${esc(DN(p.store))}<div class="muted">${p.date?fdate(p.date):lbl(k)} · ${T('Total')} ${f(p.total)}</div></span><b>${f(a)}</b></label>`).join('')}</div>
 <div class="row" style="margin-top:8px"><span class="n"><b>${T('Monto')}</b></span><b id="cbt" style="font-size:22px">${f(0)}</b></div>
 <p><input id="cbf" class="name" type="date" value="${today()}"></p>`:`<div class="muted" style="margin:12px 0">${T('No hay compras pendientes de {0}.',DN(w))}</div>`):''}
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button>${w&&L2.length?`<button id="cbsave" onclick="saveCob('${w}')">${T('Guardar')}</button>`:''}</div>`;if(!dlg().open)dlg().showModal()}
function cobTot(){const t=r2([...document.querySelectorAll('.cbx:checked')].reduce((s,b)=>s+(+b.dataset.a||0),0));const e=document.getElementById('cbt');if(e)e.textContent=f(t);return t}
function saveCob(w){const ck=[...document.querySelectorAll('.cbx:checked')];if(!ck.length)return alert(T('Marca al menos una compra'));
 const done=cobDone(w),date=document.getElementById('cbf').value||today(),by={};
 for(const b of ck){if(done.has(b.dataset.id))return alert(T('Marca al menos una compra'));(by[b.dataset.k]=by[b.dataset.k]||[]).push({id:b.dataset.id,a:r2(+b.dataset.a)})}
 let tot=0;Object.entries(by).forEach(([k,items])=>{const a=r2(items.reduce((s,i)=>s+i.a,0));tot=r2(tot+a);S.months[k].events=S.months[k].events||[];S.months[k].events.push({id:uid(),type:'cobro',who:w,date,amount:a,items,method:'deb'})});
 spend('deb',-tot);save();dlg().close();render();toast(T('Cobro guardado'))}
// ---------- Movimientos ----------
const cobStores=e=>(e.items||[]).map(i=>{for(const k of keys()){const p=(S.months[k].purchases||[]).find(p=>p.id===i.id);if(p)return DN(p.store)}return '—'});
{const _mv=moves;moves=function(m){const E={};cobEv(m).forEach(e=>E[e.id]=e);return _mv(m).map(x=>{const e=x.kind==='cobro'&&E[x.id];return e?{...x,cat:'💵 '+T('Cobro'),desc:DN(e.who)+' · '+cobStores(e).join(', '),method:'deb'}:x})}}
{const _d=delMove;delMove=function(kind,id){if(kind!=='cobro')return _d.apply(this,arguments);if(!confirm(T('¿Borrar este movimiento? Se revierte el saldo.')))return;
 const m=findMonth('events',id),e=m&&m.events.find(x=>x.id===id);if(!e)return;if(noDeb(e.amount,'No se puede borrar: el débito quedaría negativo. Disponible: {0}'))return;
 spend('deb',e.amount);m.events=m.events.filter(y=>y.id!==id);save();render()}}
// ---------- compras con Cobro: no se editan ni borran ----------
{const _e=editP;editP=function(id){const e=id&&cobOf(id);if(e)return alert(T('Esta compra tiene un Cobro de {0}. Para editarla o borrarla, primero borra el Cobro (✕ en Movimientos).',DN(e.who)));return _e.apply(this,arguments)}}
{const _x=delP;delP=function(){const e=D&&D.id&&cobOf(D.id);if(e)return alert(T('Esta compra tiene un Cobro de {0}. Para editarla o borrarla, primero borra el Cobro (✕ en Movimientos).',DN(e.who)));return _x.apply(this,arguments)}}
// ---------- resúmenes ----------
{const _r=r3Data;r3Data=function(k,who){const o=_r(k,who);who=who||'Yo';const m=S.months[k],c=calc(m),XT=c.cobT||0,XC=c.cobC||0;
 (o.pairs||[]).forEach(p=>{if(p.a==='Yo'&&p.b==='Tony'&&XT>0.004){const l=p.lines.find(x=>Math.abs(x.v+r2(c.tony))<0.006);if(l)l.v=r2(l.v-XT);p.lines.push({l:T('Ya cobrado a {0} (Cobros)',DN('Tony')),v:XT})}
  if(p.a==='Carlos'&&p.b==='Yo'&&XC>0.004){p.lines.push({l:T('Ya cobrado a {0} (Cobros)',DN('Carlos')),v:-XC});p.net=r2(p.net-XC);if(p.paid!=null)p.paid=r2(p.paid-XC)}});
 o.cobros=cobEv(m).filter(e=>who==='Yo'||e.who===who).sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(e=>({d:e.date,dl:e.date?fdate(e.date):'',who:e.who,a:r2(e.amount),s:cobStores(e)}));return o}}
function cobCard(k){const C=cobEv(S.months[k]);if(!C.length)return'';return `<div class="card defcol" id="cobcard"><h2>${T('💵 Cobros')}<span class="pos">${f(r2(C.reduce((s,e)=>s+(+e.amount||0),0)))}</span></h2><div class="muted">${lbl(k)}</div>
 ${C.map(e=>`<div class="row"><span class="n">${esc(DN(e.who))} · ${esc(cobStores(e).join(', '))}<div class="muted">${e.date?fdate(e.date):''}</div></span><b class="pos">+${f(e.amount)}</b></div>`).join('')}</div>`}
{const _r=rep;rep=function(){const h=_r(),c=cobCard(S.cur);if(!c)return h;const i=h.indexOf('<div class="card defcol" id="acccard"');return i<0?h+c:h.slice(0,i)+c+h.slice(i)}}
