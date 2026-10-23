// v100 (Joe): suscripciones y cobros automáticos.
// 1) Configuración › «🔄 Suscripciones»: lista S.subs=[{id,name,active}] (sin fechas). Las canceladas se quedan para el historial.
// 2) + › «🔄 Cobro automático»: suscripción (o + Nueva), monto, cargado a (Débito o una tarjeta), fecha. Categoría fija: la de suscripciones
//    que ya existe («📺 Suscripciones»; se busca por nombre y solo se crea si no hay ninguna). Débito: bloqueo de negativo; tarjeta: sube su saldo.
//    Se guarda como gasto personal {cat,sub:id,auto:true} → nunca compartido ni en los reportes de Tony/Carlos.
// 3) Compra manual: la categoría de suscripciones no sale en sus chips.
// 4) Reportes (solo Joe): «🔄 Suscripciones» con total del mes y acumulado por suscripción + historial.
Object.assign(EN,{"🔄 Cobro automático":"🔄 Automatic charge","Cobro automático":"Automatic charge","Netflix, Spotify, iCloud…":"Netflix, Spotify, iCloud…",
 "Suscripciones":"Subscriptions","Suscripción":"Subscription","+ Nueva suscripción…":"+ New subscription…","Nombre de la suscripción":"Subscription name",
 "Cargado a":"Charged to","Elige la suscripción":"Pick the subscription","Cobro guardado":"Charge saved","Activa":"Active","Cancelada":"Cancelled",
 "Cancelada (se guarda para el historial)":"Cancelled (kept for history)","Las canceladas se quedan para el historial. Sin fechas de cobro.":"Cancelled ones stay for history. No due dates.",
 "{0} tiene cobros guardados. Márcala como cancelada en vez de eliminarla.":"{0} has saved charges. Mark it cancelled instead of deleting it.",
 "Este mes":"This month","Acumulado":"Cumulative","Historial":"History","Sin cobros automáticos.":"No automatic charges.",
 "Cobros que se cargan solos a tu débito o tarjeta.":"Charges that hit your debit or card automatically."});
const SUB_RE=/suscrip|subscript/i;
const subCat=()=>(S.cats||[]).find(c=>SUB_RE.test(c)||SUB_RE.test(DN(c)));
function subCatEnsure(){let c=subCat();if(!c){c='📺 Suscripciones';const i=S.cats.indexOf('🤝 Tony');S.cats.splice(i<0?S.cats.length:i,0,c)}return c}
const subName=id=>{const s=(S.subs||[]).find(x=>x.id===id);return s?DN(s.name):''};
function subAll(){const o=[];keys().forEach(k=>(S.months[k].personal||[]).filter(x=>x.sub).forEach(x=>o.push({k,...x})));return o.sort((a,b)=>String(dKey(b.date)||'').localeCompare(String(dKey(a.date)||'')))}
// Movimientos: la descripción es el nombre actual de la suscripción
{const _mv=moves;moves=function(m){const P={};(m.personal||[]).forEach(p=>P[p.id]=p);return _mv(m).map(x=>{const p=x.kind==='gasto'&&P[x.id];return p&&p.sub?{...x,desc:'🔄 '+(subName(p.sub)||p.desc||'')}:x})}}
// ---------- 1) Configuración ----------
CTL.subs={title:()=>'🔄 '+T('Suscripciones'),hint:()=>T('Las canceladas se quedan para el historial. Sin fechas de cobro.'),
 items:()=>(S.subs||[]).map(s=>({label:DN(s.name),sub:s.active===false?'⛔ '+T('Cancelada'):'✅ '+T('Activa')})),
 add(){nameDlg({title:T('Nuevo'),onOk:({n})=>{S.subs=S.subs||[];if(S.subs.some(x=>same(x.name,n)||same(DN(x.name),n))){alert(T('Ya existe'));return false}S.subs.push({id:uid(),name:n,active:true})}})},
 edit(i){const s=S.subs[i];if(!s)return;nameDlg({title:T('Editar'),name:s.name,extra:`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="ndsubx" style="width:22px;height:22px"${s.active===false?' checked':''}> ${T('Cancelada (se guarda para el historial)')}</label>`,
  onOk:({n})=>{if(S.subs.some(x=>x!==s&&(same(x.name,n)||same(DN(x.name),n)))){alert(T('Ya existe'));return false}s.name=n;s.active=!document.getElementById('ndsubx').checked}})},
 del(i){const s=S.subs[i];if(!s)return;if(subAll().some(x=>x.sub===s.id))return alert(T('{0} tiene cobros guardados. Márcala como cancelada en vez de eliminarla.',DN(s.name)));
  if(!confirm(T('¿Eliminar {0}?',DN(s.name))))return;S.subs.splice(i,1);save();dlg().close();render()}};
{const _c=ctlCard;ctlCard=function(id){const h=_c.apply(this,arguments);return id==='stores'?h+_c('subs'):h}}
// ---------- 2) + › Cobro automático ----------
{const _f=fabMenu;fabMenu=function(){const r=_f.apply(this,arguments);const b=document.getElementById('fabxfer')||document.getElementById('fabinc');if(b&&!document.getElementById('fabsub'))b.insertAdjacentHTML('afterend',`<button id="fabsub" class="sec" style="width:100%;text-align:left;min-height:60px;margin-top:8px;padding:10px 14px" onclick="subDlg()"><b style="font-size:17px">${T('🔄 Cobro automático')}</b><div class="muted" style="font-size:13px;margin-top:2px">${T('Netflix, Spotify, iCloud…')}</div></button>`);return r}}
{const fb=document.getElementById('fab');if(fb)fb.onclick=fabMenu}
function subDlg(){const act=(S.subs||[]).filter(s=>s.active!==false),cards=(L().cards||[]).filter(c=>c.name);
 dlg().innerHTML=`<h2>${T('Cobro automático')}</h2><div class="muted">${T('Cobros que se cargan solos a tu débito o tarjeta.')}</div>
 <p><select id="sbs" class="name" style="width:100%" onchange="document.getElementById('sbnw').hidden=this.value!=='__new'"><option value="">${T('Elige la suscripción')}</option>${act.map(s=>`<option value="${esc(s.id)}">${esc(DN(s.name))}</option>`).join('')}<option value="__new">${T('+ Nueva suscripción…')}</option></select>
 <input id="sbnw" class="name" hidden style="margin-top:6px" placeholder="${T('Nombre de la suscripción')}"></p>
 <input id="sba" class="name" type="number" inputmode="decimal" step="0.01" placeholder="${T('Monto $')}" style="font-size:24px">
 <p><label class="muted" for="sbm">${T('Cargado a')}</label><select id="sbm" class="name" style="width:100%"><option value="deb">${esc(DN(debE(L()).name||'Débito'))}</option>${cards.map(c=>`<option value="${esc('card:'+c.name)}">💳 ${esc(DN(c.name))}</option>`).join('')}</select></p>
 <p><input id="sbf" class="name" type="date" value="${today()}"></p>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="sbsave" onclick="saveSub()">${T('Guardar')}</button></div>`;if(!dlg().open)dlg().showModal()}
function saveSub(){let id=document.getElementById('sbs').value;const nw=document.getElementById('sbnw').value.trim().replace(/\s+/g,' ');
 if(!id||(id==='__new'&&!nw))return alert(T('Elige la suscripción'));
 const a=r2(document.getElementById('sba').value);if(!a||a<=0)return alert(T('Pon un monto'));
 const method=document.getElementById('sbm').value,date=document.getElementById('sbf').value||today();
 if(method==='deb'&&noDeb(a,'No se puede: el débito quedaría negativo. Disponible: {0}'))return;
 S.subs=S.subs||[];if(id==='__new'){const ex=S.subs.find(x=>same(x.name,nw)||same(DN(x.name),nw));if(ex){id=ex.id;ex.active=true}else{id=uid();S.subs.push({id,name:nw,active:true})}}
 const cat=subCatEnsure();spend(method,a);
 S.months[monthFor(date)].personal.unshift({id:uid(),date,amount:a,cat,desc:subName(id),method,sub:id,auto:true});
 save();dlg().close();render();toast(T('Cobro guardado'))}
// ---------- 3) Compra manual sin la categoría de suscripciones ----------
{const _q=quick;quick=function(){const r=_q.apply(this,arguments);const c=subCat();if(c){document.querySelectorAll('#qcats .chip').forEach(b=>{if(b.dataset.c===c){const on=b.classList.contains('on');b.remove();if(on)document.querySelector('#qcats .chip')?.classList.add('on')}})}return r}}
// ---------- 4) Reportes ----------
function subRepCard(k){const A=subAll();if(!A.length&&!(S.subs||[]).length)return'';const by={};
 A.forEach(x=>{const o=by[x.sub]=by[x.sub]||{m:0,t:0};o.t=r2(o.t+(+x.amount||0));if(x.k===k)o.m=r2(o.m+(+x.amount||0))});
 const rows=(S.subs||[]).filter(s=>by[s.id]||s.active!==false).map(s=>({s,...(by[s.id]||{m:0,t:0})})).sort((a,b)=>b.m-a.m||b.t-a.t),tm=r2(rows.reduce((a,r)=>a+r.m,0));
 return `<div class="card defcol" id="subcard"><h2>🔄 ${T('Suscripciones')}<span>${f(tm)}</span></h2><div class="muted">${lbl(k)}</div>
 <div class="row" style="font-size:12px;color:#64748b"><span class="n"></span><span style="width:90px;text-align:right">${T('Este mes')}</span><span style="width:90px;text-align:right">${T('Acumulado')}</span></div>
 ${rows.map(r=>`<div class="row"><span class="n">${esc(DN(r.s.name))}${r.s.active===false?` <span class="muted">· ${T('Cancelada')}</span>`:''}</span><b style="width:90px;text-align:right">${f(r.m)}</b><span style="width:90px;text-align:right">${f(r.t)}</span></div>`).join('')}
 ${A.length?`<h3 style="margin:12px 0 4px;font-size:15px">🧾 ${T('Historial')}</h3>`+A.map(x=>`<div class="muted" style="display:flex;justify-content:space-between;padding:3px 0"><span>${fdate(x.date)} · ${esc(subName(x.sub))} · ${methName(x.method)}</span><span>${f(x.amount)}</span></div>`).join(''):`<div class="muted">${T('Sin cobros automáticos.')}</div>`}</div>`}
{const _r=rep;rep=function(){const h=_r(),c=subRepCard(S.cur);if(!c)return h;const i=h.indexOf('<div class="card defcol" id="acccard"');return i<0?h+c:h.slice(0,i)+c+h.slice(i)}}
