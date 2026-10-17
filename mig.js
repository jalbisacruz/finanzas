// v53: formato v2 = ids estables (aditivo). Los registros conservan sus nombres (claves); el catálogo da id + nombre/emoji visibles.
// Migración segura: copia previa (local + nube "antes-de-v2"), comparación de totales antes/después, aborta si algo cambia.
const DATA_V=2,MIG_PEND='finanzas-mig-pending',MIG_SNAP='finanzas-antes-de-v2',MIG_ST='finanzas-mig-status';
Object.assign(EN,{"✅ Formato de datos actualizado (v2). Se guardó una copia previa en este dispositivo{0}.":"✅ Data format updated (v2). A previous copy was saved on this device{0}.",
" y en la nube":" and in the cloud","Descargar copia":"Download copy","⚠️ No se pudo actualizar el formato de datos. Tus datos siguen igual (v1); no se perdió nada.":"⚠️ The data format couldn't be updated. Your data is unchanged (v1); nothing was lost.",
"antes de v2":"before v2","Hay una versión más nueva de la app en otro dispositivo. Cierra y vuelve a abrir la app para actualizar; no se guardará nada hasta entonces.":"A newer version of the app is in use on another device. Close and reopen the app to update; nothing will be saved until then.",
"El nombre visible cambia en toda la app; tus movimientos no se modifican.":"The visible name changes across the app; your transactions aren't modified.","También se aplica a {0} en Conceptos de ingreso.":"It also applies to {0} in Income sources."});
const SPECIAL={cat:{'🤝 Tony':'cat_tony','🛒 Comida/Supermercado':'cat_shared','💸 Envíos a familia':'cat_rem','📦 Otros':'cat_otros','📈 Kalshi':'cat_kalshi','⛽ Gasolina':'cat_gasolina','🚗 Transporte':'cat_transporte'},
 con:{'💼 Cheque':'con_cheque','💵 Propinas':'con_tips','💳 Reembolso en efectivo':'con_cashback','📈 Kalshi':'con_kalshi','📦 Otros':'con_otros'},ppl:{Yo:'ppl_yo',Tony:'ppl_tony',Carlos:'ppl_carlos'}};
const hsh=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0}return h.toString(36).padStart(7,'0').slice(-7)};
const idFor=(t,key)=>(SPECIAL[t]&&SPECIAL[t][key])||t+'_'+hsh(key);
// añade ids que falten (idempotente; nunca cambia valores existentes)
function ensureIds(st){if(!st||!st.months)return st;st.catalog=st.catalog&&typeof st.catalog==='object'?st.catalog:{};const I=st.catalog.items=st.catalog.items||{};
 const add=(t,key,id)=>{if(key===undefined||key===null||key==='')return undefined;id=id||idFor(t,key);if(!I[id])I[id]={t,key};return id};
 (st.cats||[]).forEach(c=>add('cat',c));(st.incCats||[]).forEach(c=>add('con',c));(st.people||[]).forEach(p=>add('ppl',p));(st.stores||[]).forEach(s=>add('store',s));(st.recipients||[]).forEach(r=>add('rec',r));
 Object.values(st.months).forEach(m=>{
  (m.income||[]).forEach(x=>{if(x.cid===undefined){const id=x.role==='debit'?add('acc',x.name,'acc_debit'):add('acc',x.name);if(id)x.cid=id}});
  (m.cards||[]).forEach(x=>{if(x.cid===undefined){const id=add('card',x.name);if(id)x.cid=id}});
  (m.bills||[]).forEach(x=>{if(x.cid===undefined){const id=add('bill',x.name);if(id)x.cid=id}});
  (m.personal||[]).forEach(x=>{if(x.catId===undefined)x.catId=add('cat',x.cat||'📦 Otros');if(x.recipient&&x.recId===undefined)x.recId=add('rec',x.recipient)});
  (m.purchases||[]).forEach(p=>{if(p.store&&p.storeId===undefined)p.storeId=add('store',p.store)});
  (m.events||[]).forEach(e=>{if(e.type==='income'&&e.conId===undefined)e.conId=add('con',e.concept||'📦 Otros')})});
 st.version=DATA_V;return st}
const ADDED=['cid','catId','recId','storeId','conId'];
function stripV2(st){const o=JSON.parse(JSON.stringify(st));delete o.catalog;delete o.version;
 const w=x=>{if(Array.isArray(x))x.forEach(w);else if(x&&typeof x==='object'){ADDED.forEach(k=>delete x[k]);Object.values(x).forEach(w)}};w(o.months);return o}
// totales de cada mes, calculados con las mismas funciones de la app
function totalsOf(st){const old=S;S=st;try{const o={};Object.keys(st.months).sort().forEach(k=>{const m=st.months[k],c=calc(m);
  o[k]={calc:Object.fromEntries(Object.entries(c).map(([a,b])=>[a,r2(b)])),spent:spent(m),earned:earned(m),bud:budBy(m).by,cb:cbBy([m]),
   lines:[...(m.income||[]),...(m.cards||[]),...(m.bills||[])].map(x=>r2(x.amount))}});
  o.checks=(st.checks||[]).map(c=>[c.amount,c.status]);o.cbAll=cbBy(Object.values(st.months));o.budgets=st.budgets||{};return JSON.stringify(o)}finally{S=old}}
// devuelve {ok,state,why}
function migrateV2(src){try{const before=JSON.stringify(src),t0=totalsOf(src),next=ensureIds(JSON.parse(before));
  if(window.__finMigFault==='totals'){next.months[Object.keys(next.months)[0]].income[0].amount+=1}
  const t1=totalsOf(next);if(t0!==t1)return{ok:false,why:'totals'};
  if(JSON.stringify(stripV2(next))!==JSON.stringify(stripV2(JSON.parse(before))))return{ok:false,why:'additive'};
  if(JSON.stringify(ensureIds(JSON.parse(JSON.stringify(next))))!==JSON.stringify(next))return{ok:false,why:'idempotent'};
  return{ok:true,state:next}}catch(e){console.warn('mig',e);return{ok:false,why:'error:'+e.message}}}
function queueBackup(st){try{const L2=JSON.parse(localStorage.getItem(MIG_PEND)||'[]');L2.push(JSON.stringify(st));localStorage.setItem(MIG_PEND,JSON.stringify(L2.slice(-2)))}catch(e){console.warn(e)}}
// --- al cargar ---
(function(){if(S&&S.version===DATA_V){ensureIds(S);return}
 if(!S||!S.months)return;
 if(!localStorage.getItem(MIG_SNAP))try{localStorage.setItem(MIG_SNAP,JSON.stringify(S))}catch(e){}
 const r=migrateV2(S);
 if(r.ok){queueBackup(S);S=r.state;localStorage.setItem(K,JSON.stringify(S));localStorage.setItem(MIG_ST,'ok')}
 else{localStorage.setItem(MIG_ST,'fail:'+r.why);console.warn('migración v2 abortada',r.why)}})();
// datos que llegan de la nube o de un respaldo: si son v1, se conservan los nombres visibles locales y se migran
const _ss2=window.setState;window.setState=o=>{if(o&&o.months&&o.version!==DATA_V){
  if(!o.catalog&&S&&S.catalog)o.catalog=JSON.parse(JSON.stringify(S.catalog));
  const pure=JSON.parse(JSON.stringify(o));delete pure.catalog;const r=migrateV2(o);
  if(r.ok){queueBackup(pure);o=r.state}else localStorage.setItem(MIG_ST,'fail:'+r.why)}
 else if(o&&o.months)ensureIds(o);_ss2(o)};
const _save2=save;save=function(){if(S&&S.version===DATA_V)ensureIds(S);return _save2.apply(this,arguments)};
// --- nombres visibles ---
let LBL_MAP=null;const lblDirty=()=>{LBL_MAP=null};
window.DNo=s=>{if(!S||!S.catalog)return undefined;if(!LBL_MAP){LBL_MAP={};Object.values(S.catalog.items||{}).forEach(it=>{if(it.name!==undefined||it.emoji!==undefined)LBL_MAP[it.key]=it})}
 const it=LBL_MAP[s];if(!it)return undefined;const[e0,n0]=catSplit(DN0(s));const e=it.emoji!==undefined?it.emoji:e0,n=it.name!==undefined?it.name:n0;return e?e+' '+n:n};
const _r2=render;render=function(){lblDirty();return _r2.apply(this,arguments)};
function setLabel(types,key,name,emoji){Object.values(S.catalog.items).forEach(it=>{if(types.includes(it.t)&&it.key===key){const[e0,n0]=catSplit(DN0(key));
  if(name!==undefined){if(name===n0)delete it.name;else it.name=name}if(emoji!==undefined){if(emoji===e0)delete it.emoji;else it.emoji=emoji}}});lblDirty()}
const labelTaken=(list,key,n)=>list.some(x=>x!==key&&(same(catSplit(DN(x))[1],n)||same(DN(x),n)));
// --- ediciones: solo cambian el nombre visible (sin reescribir movimientos) ---
CAT_NOEDIT=()=>false;
catEdit=function(i){const c=S.cats[i];if(!c)return;const[em,n]=catSplit(DN(c));const both=S.incCats.includes(c);
 nameDlg({title:T('Editar categoría'),name:n,emoji:em,extra:`<div class="muted">${T('El nombre visible cambia en toda la app; tus movimientos no se modifican.')}${both?' '+T('También se aplica a {0} en Conceptos de ingreso.',esc(DN(c))):''}</div>`,
  onOk:({n,em})=>{if(labelTaken(S.cats,c,n)){alert(T('Esa categoría ya existe'));return false}setLabel(['cat','con'],c,n,em)}})};
catEditOk=()=>{};
const conEdit=i=>{const c=S.incCats[i];const[em,n]=catSplit(DN(c));nameDlg({title:T('Editar'),name:n,emoji:em,extra:`<div class="muted">${T('El nombre visible cambia en toda la app; tus movimientos no se modifican.')}</div>`,
 onOk:({n,em})=>{if(labelTaken(S.incCats,c,n)){alert(T('Ya existe'));return false}setLabel(['con','cat'],c,n,em)}})};
CTL.inc.edit=conEdit;const _incItems=CTL.inc.items;CTL.inc.items=()=>_incItems().map((x,i)=>({...x,lock:false,nodel:INC_LOCK(S.incCats[i])}));
const _pplItems=CTL.people.items;CTL.people.items=()=>_pplItems().map((x,i)=>({...x,lock:false,nodel:PPL_LOCK(S.people[i])}));
CTL.people.edit=i=>{const p=S.people[i];nameDlg({title:T('Editar'),name:DN(p),onOk:({n})=>{if(S.people.some(x=>x!==p&&same(DN(x),n))){alert(T('Ya existe'));return false}setLabel(['ppl'],p,n)}})};
['money','cards'].forEach(k=>{const kind=k==='cards'?'cards':'income',t=k==='cards'?'card':'acc';CTL[k].edit=i=>{const x=L()[kind][i];if(!x)return;
 nameDlg({title:T('Editar'),name:DN(x.name),extra:kind==='cards'?`<label>${T('Día de vencimiento (1–31)')}<input id="ndd" type="number" min="1" max="31" inputmode="numeric" value="${S.cardDue[x.name]||''}"></label>`:'',
  onOk:({n})=>{if(L()[kind].some(y=>y!==x&&same(DN(y.name),n))){alert(T('Ya existe'));return false}setLabel([t],x.name,n);
   if(kind==='cards'){const d=+document.getElementById('ndd').value;if(d>=1&&d<=31)S.cardDue[x.name]=d;else delete S.cardDue[x.name]}}})}});
CTL.bills.edit=i=>{const b=L().bills[i];if(!b)return;nameDlg({title:T('Editar'),name:DN(b.name),extra:billExtra(b),onOk:({n})=>{
 if(L().bills.some(x=>x!==b&&same(DN(x.name),n))){alert(T('Ya existe'));return false}
 const cat=document.querySelector('#ndc .chip.on')?.dataset.c;b.fixed=document.getElementById('ndf').checked;if(cat&&cat!==billCat(b))b.cat=cat;setLabel(['bill'],b.name,n)}})};
[['stores','store'],['recips','rec']].forEach(([k,t])=>{const key=k==='stores'?'stores':'recipients';CTL[k].edit=i=>{const s=S[key][i];
 nameDlg({title:T('Editar'),name:DN(s),onOk:({n})=>{if(S[key].some(x=>x!==s&&same(DN(x),n))){alert(T('Ya existe'));return false}setLabel([t],s,n)}})};
 const _it=CTL[k].items;CTL[k].items=()=>(S[key]||[]).map(s=>({label:DN(s)}))});
// --- aviso discreto en Hoy ---
function migNote(){const st=localStorage.getItem(MIG_ST);if(!st||st==='ok')return'';  // v78: el aviso de éxito (v2) ya no se muestra; solo el de error
 const ok=st==='ok',cl=window.fbUser&&window.fbUser()?T(' y en la nube'):'';
 return `<div class="card" id="mignote" style="font-size:14px;${ok?'background:#f0fdf4;border:1px solid #86efac':'background:#fffbeb;border:1px solid #fcd34d'}">${ok?T('✅ Formato de datos actualizado (v2). Se guardó una copia previa en este dispositivo{0}.',cl):T('⚠️ No se pudo actualizar el formato de datos. Tus datos siguen igual (v1); no se perdió nada.')}
 <div class="grid" style="margin-top:8px">${ok&&localStorage.getItem(MIG_SNAP)?`<button class="sec" onclick="migDl()">${T('Descargar copia')}</button>`:'<span></span>'}<button class="sec" onclick="localStorage.removeItem('${MIG_ST}');render()">OK</button></div></div>`}
function migDl(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([localStorage.getItem(MIG_SNAP)],{type:'application/json'}));a.download='finanzas-antes-de-v2.json';a.click()}
const _ini2=ini;ini=function(){return migNote()+_ini2()};
// respaldos con etiqueta
bkWhen=function(b){const id=typeof b==='string'?b:b.id,m=id.match(/^(\d{4})-(\d\d)-(\d\d)(?:_(\d\d)-(\d\d)-(\d\d))?(?:_(.+))?$/),loc=LANG==='en'?'en-US':'es-US';
 if(!m)return id;const d=m[4]?new Date(+m[1],m[2]-1,+m[3],+m[4],+m[5],+m[6]):new Date(+m[1],m[2]-1,+m[3],12);
 const ds=d.toLocaleDateString(loc,{weekday:'short',day:'numeric',month:'short',year:'numeric'});return (m[4]?ds+' · '+d.toLocaleTimeString(loc,{hour:'numeric',minute:'2-digit'}):ds)+(/^antes-de-v2/.test(m[7]||'')?' · '+T('antes de v2'):'')};
