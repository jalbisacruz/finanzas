// v80 (plan v78, fases 5 y 6): Editar ingreso, "↩️ Reembolso" se ve como "Reembolso (Carlos/Tony)", Reembolsos en Reportes,
// respaldos por Año › Mes › Día, archivos con fecha y hora, carpeta de respaldos opcional (Chrome/Edge en computadora), PDF con hora.
// Sin migración: el concepto guardado sigue siendo '↩️ Reembolso'; solo cambia el nombre que se ve.
Object.assign(EN,{"Editar ingreso":"Edit income","Concepto":"Concept","Nota":"Note","Cuenta":"Account","Fecha":"Date","Borrar":"Delete","Ingreso actualizado":"Income updated",
 "Si cambias el monto o la cuenta, la app quita el ingreso anterior de su cuenta y pone el nuevo. Nada más cambia.":"If you change the amount or the account, the app takes the old income out of its account and adds the new one. Nothing else changes.",
 "Reembolsos":"Reimbursements","Solo lo que te devuelven Carlos o Tony. No es ingreso nuevo.":"Only what Carlos or Tony pay you back. It isn't new income.","Sin reembolsos este mes.":"No reimbursements this month.",
 "Cobrado a Carlos":"Collected from Carlos","Toca un ingreso para editarlo.":"Tap an income to edit it.",
 "Año":"Year","Respaldos en la nube":"Cloud backups","{0} respaldos":"{0} backups","1 respaldo":"1 backup",
 "📁 Carpeta de respaldos":"📁 Backup folder","Elegir carpeta":"Choose folder","Cambiar carpeta":"Change folder","Quitar":"Remove","Sin carpeta elegida.":"No folder chosen.",
 "Cada respaldo se guarda solo en {0} › Año › Mes › Día.":"Each backup is saved automatically in {0} › Year › Month › Day.","Respaldo guardado en la carpeta":"Backup saved in the folder",
 "Solo en Chrome o Edge en computadora. Cada exportación y cada respaldo se guardan ahí, y una vez por semana al abrir la app.":"Chrome or Edge on a computer only. Every export and every backup is saved there, and once a week when you open the app.",
 "No se pudo guardar en la carpeta; se descargó el archivo.":"Couldn't save to the folder; the file was downloaded.","Permitir carpeta":"Allow folder","No se puede: el débito quedaría negativo. Disponible: {0}":"Not possible: the debit would go negative. Available: {0}","La app necesita permiso otra vez para usar la carpeta.":"The app needs permission again to use the folder."});
// ---------- Fase 5: nombre visible del reembolso ----------
NM.es['↩️ Reembolso']='↩️ Reembolso (Carlos/Tony)';NM.en['↩️ Reembolso']='↩️ Reimbursement (Carlos/Tony)';
const isReemb=c=>c==='↩️ Reembolso';
// ---------- Fase 5: Editar ingreso ----------
const methOpt=(e)=>{const m=L(),o=m.income.map(x=>[x===debE(m)?'deb':'money:'+x.name,'→ '+DN(x.name)]);if(e&&e.method&&!o.some(([v])=>v===e.method))o.push([e.method,'→ '+methName(e.method).replace(/<[^>]*>/g,'')]);return o};
function incEdit(id){const m=findMonth('events',id),e=m&&m.events.find(x=>x.id===id);if(!e||e.type!=='income')return;
 const cats=S.incCats.includes(e.concept)?S.incCats:[...S.incCats,e.concept||'📦 Otros'],cur=e.concept||'📦 Otros';
 dlg().innerHTML=`<h2>✏️ ${T('Editar ingreso')}</h2>
 <input id="ea" class="name" type="number" inputmode="decimal" step="0.01" value="${+e.amount||0}" style="font-size:24px" aria-label="${T('Monto $')}">
 <div class="muted" style="margin-top:8px">${T('Concepto')}</div><div class="chips" id="ecats">${cats.map(c=>`<button class="chip ${c===cur?'on':''}" data-c="${esc(c)}" onclick="document.querySelectorAll('#ecats .chip').forEach(b=>b.classList.remove('on'));this.classList.add('on');document.getElementById('ecard').hidden=!isCB(this.dataset.c)">${esc(DN(c))}</button>`).join('')}</div>
 <div id="ecard" ${isCB(cur)?'':'hidden'}><div class="muted">${T('¿De qué tarjeta?')}</div><div class="chips" id="ecards">${(L().cards||[]).filter(c=>c.name).map(c=>`<button class="chip ${c.name===e.card?'on':''}" data-k="${esc(c.name)}" onclick="document.querySelectorAll('#ecards .chip').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${esc(DN(c.name))}</button>`).join('')}</div></div>
 <div class="muted" style="margin-top:8px">${T('Nota')}</div><input id="ed_" class="name" value="${esc(e.desc||'')}" placeholder="${T('Descripción (opcional)')}">
 <div class="grid" style="margin-top:8px"><input id="ef_" type="date" value="${esc(e.date||today())}" aria-label="${T('Fecha')}"><select id="em" aria-label="${T('Cuenta')}">${methOpt(e).map(([v,l])=>`<option value="${esc(v)}"${v===(e.method||'deb')?' selected':''}>${esc(l)}</option>`).join('')}</select></div>
 <div class="muted" style="margin-top:8px">${T('Si cambias el monto o la cuenta, la app quita el ingreso anterior de su cuenta y pone el nuevo. Nada más cambia.')}</div>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="esave" onclick="incEditSave('${id}')">${T('Guardar')}</button></div>
 <button class="del" id="edel" style="width:100%;margin-top:8px" onclick="dlg().close();delMove('income','${id}')">${T('Borrar')}</button>`;if(!dlg().open)dlg().showModal()}
function incEditSave(id){const m=findMonth('events',id),e=m&&m.events.find(x=>x.id===id);if(!e)return;
 const a=r2(document.getElementById('ea').value);if(!a||a<=0)return alert(T('Pon un monto'));
 const date=document.getElementById('ef_').value||e.date,method=document.getElementById('em').value,concept=document.querySelector('#ecats .chip.on')?.dataset.c||e.concept;let desc=document.getElementById('ed_').value.trim();
 let card;if(isCB(concept)){card=document.querySelector('#ecards .chip.on')?.dataset.k;if(!card)return alert(T('Elige la tarjeta'))}
 const om=e.method||'deb',oa=+e.amount||0;
 if(om!==method||Math.abs(oa-a)>0.004){const out=r2((om==='deb'?oa:0)-(method==='deb'?a:0));if(noDeb(out,'No se puede: el débito quedaría negativo. Disponible: {0}'))return;
  spend(om,oa);spend(method,-a)}
 const oldDef=(e.concept||'').replace(/^\S+\s/,'');if(concept!==e.concept&&(!desc||desc===oldDef))desc=concept.replace(/^\S+\s/,'');
 if(concept!==e.concept)delete e.conId;
 Object.assign(e,{amount:a,date,method,concept,desc:desc||concept.replace(/^\S+\s/,'')});if(card)e.card=card;else delete e.card;
 const tk=monthFor(date),tm=S.months[tk];if(tm&&tm!==m){m.events=m.events.filter(x=>x.id!==id);tm.events.push(e)}
 save();dlg().close();render();toast(T('Ingreso actualizado'))}
// ---------- Reportes: Reembolsos (Carlos/Tony) ----------
function reembCard(){const m=M(),L2=byNew([...(m.events||[])].reverse().filter(e=>e.type==='carlos'||(e.type==='income'&&isReemb(e.concept))));
 const t=sum(L2,e=>+e.amount||0);
 return `<div class="card" id="reemcard"><h2>↩️ ${T('Reembolsos')}<span>${f(t)}</span></h2><div class="muted">${lbl(S.cur)} · ${T('Solo lo que te devuelven Carlos o Tony. No es ingreso nuevo.')}</div>
 ${L2.map(e=>`<div class="row"><span class="n">${e.type==='carlos'?T('Cobrado a Carlos'):esc(DN(e.concept))}<div class="muted">${fdate(e.date)}${e.desc&&e.type!=='carlos'?' · '+esc(e.desc):''}</div></span>${f(+e.amount||0)}</div>`).join('')||`<div class="muted">${T('Sin reembolsos este mes.')}</div>`}</div>`}
const _repV80=rep;rep=function(){const t=document.createElement('template');t.innerHTML=_repV80();const ic=t.content.querySelector('#inccard');if(ic)ic.insertAdjacentHTML('afterend',reembCard());else t.content.append(document.createRange().createContextualFragment(reembCard()));return t.innerHTML};
// ---------- Fase 6: nombres con fecha y hora ----------
const p2=n=>String(n).padStart(2,'0');
const bkName=(d=new Date())=>`finanzas-${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.json`;
const noAcc=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function pdfStamp(d=new Date()){const mo=noAcc(d.toLocaleDateString(LOC(),{month:'short'})).replace('.','').toLowerCase(),h=d.getHours(),h12=h%12||12;return `${d.getDate()}${mo}-${h12}-${p2(d.getMinutes())}${h<12?'am':'pm'}`}
function pdfFile(kind,k,d){const mon=noAcc(lblL(k)).replace(/\s+/g,'-'),who=noAcc(String(pdfWho()).trim().split(/\s+/)[0]||'Joe');
 return (kind==='tony'?'Tony-'+mon:kind==='carlos'?'Carlos-'+mon:noAcc(T('Resumen'))+'-'+mon+'-'+who)+'-'+pdfStamp(d)+'.pdf'}
const _makePDFV80=makePDF;makePDF=async function(kind,k){const f0=await _makePDFV80(kind,k);return new File([f0],pdfFile(kind,k||S.cur),{type:'application/pdf'})};
// ---------- Fase 6: carpeta de respaldos (File System Access API: Chrome/Edge en computadora) ----------
const FS_OK=typeof window.showDirectoryPicker==='function'&&!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const BKD_LAST='finanzas-folder-last';let BKDIR=null;
function idb(){return new Promise((ok,ko)=>{const r=indexedDB.open('finanzas-fs',1);r.onupgradeneeded=()=>r.result.createObjectStore('h');r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)})}
async function idbGet(k){const db=await idb();return new Promise(ok=>{const q=db.transaction('h').objectStore('h').get(k);q.onsuccess=()=>ok(q.result||null);q.onerror=()=>ok(null)})}
async function idbSet(k,v){const db=await idb();return new Promise(ok=>{const t=db.transaction('h','readwrite');try{v===null?t.objectStore('h').delete(k):t.objectStore('h').put(v,k)}catch(e){console.warn(e);ok();return}t.oncomplete=()=>ok();t.onerror=()=>ok()})}
async function bkPerm(ask){if(!BKDIR)return false;try{const o={mode:'readwrite'};if(await BKDIR.queryPermission(o)==='granted')return true;return ask?(await BKDIR.requestPermission(o))==='granted':false}catch(e){return false}}
const bkMonthDir=d=>p2(d.getMonth()+1)+'-'+noAcc((s=>s[0].toUpperCase()+s.slice(1))(d.toLocaleDateString(LOC(),{month:'long'})));
async function bkToFolder(txt,d=new Date()){if(!BKDIR||!(await bkPerm(true)))return false;
 const y=await BKDIR.getDirectoryHandle(String(d.getFullYear()),{create:true}),mo=await y.getDirectoryHandle(bkMonthDir(d),{create:true}),dd=await mo.getDirectoryHandle(p2(d.getDate()),{create:true});
 const fh=await dd.getFileHandle(bkName(d),{create:true}),w=await fh.createWritable();await w.write(txt);await w.close();localStorage.setItem(BKD_LAST,String(Date.now()));return true}
function bkDownload(txt,d){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=bkName(d);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
// exportar (y la copia antes de restaurar): con fecha y hora; si hay carpeta elegida, va a la carpeta (si falla, se descarga)
exp=function(){const txt=JSON.stringify(S,null,1),d=new Date();localStorage.setItem(LEK,today());
 if(!BKDIR){bkDownload(txt,d);return}
 bkToFolder(txt,d).then(ok=>{if(ok)toast(T('Respaldo guardado en la carpeta'));else{bkDownload(txt,d);toast(T('No se pudo guardar en la carpeta; se descargó el archivo.'))}}).catch(e=>{console.warn(e);bkDownload(txt,d);toast(T('No se pudo guardar en la carpeta; se descargó el archivo.'))})};
async function bkPick(){try{const h=await window.showDirectoryPicker({id:'finanzas-respaldos',mode:'readwrite'});BKDIR=h;await idbSet('dir',h);await bkToFolder(JSON.stringify(S,null,1));toast(T('Respaldo guardado en la carpeta'))}catch(e){if(e&&e.name!=='AbortError')console.warn(e)}render()}
async function bkUnpick(){BKDIR=null;await idbSet('dir',null);render()}
function bkFolderBox(){if(!FS_OK)return'';return `<div id="bkfolder" style="margin-top:12px;padding-top:10px;border-top:1px solid #e2e8f0"><b>${T('📁 Carpeta de respaldos')}</b>
 <div class="muted" style="margin:2px 0 6px">${BKDIR?T('Cada respaldo se guarda solo en {0} › Año › Mes › Día.',esc(BKDIR.name)):T('Sin carpeta elegida.')} ${T('Solo en Chrome o Edge en computadora. Cada exportación y cada respaldo se guardan ahí, y una vez por semana al abrir la app.')}</div>
 <div class="grid"><button class="sec" id="bkpick" onclick="bkPick()">${T(BKDIR?'Cambiar carpeta':'Elegir carpeta')}</button>${BKDIR?`<button class="sec" id="bkunpick" onclick="bkUnpick()">${T('Quitar')}</button>`:'<span></span>'}</div></div>`}
const _bkCfgV80=bkCfg;bkCfg=function(){return _bkCfgV80().replace(/<\/div>$/,bkFolderBox()+'</div>')};
// "Respaldo ahora" (nube) también deja copia en la carpeta
{const w=()=>{if(window.fbBackupNow&&!window.fbBackupNow._v80){const o=window.fbBackupNow;window.fbBackupNow=async()=>{await o();if(BKDIR)try{await bkToFolder(JSON.stringify(S,null,1))}catch(e){console.warn(e)}};window.fbBackupNow._v80=1}};w();addEventListener('load',w);setTimeout(w,3000)}
// al abrir: recordar la carpeta y, si ya hay permiso, una copia semanal
if(FS_OK)idbGet('dir').then(async h=>{if(!h)return;BKDIR=h;if(typeof tab!=='undefined'&&tab==='cfg')render();
 if(Date.now()-(+localStorage.getItem(BKD_LAST)||0)>7*864e5&&await bkPerm(false))try{await bkToFolder(JSON.stringify(S,null,1))}catch(e){console.warn(e)}}).catch(()=>{});
// ---------- Fase 6: respaldos de la nube agrupados Año › Mes › Día (lo más nuevo primero; abierto solo el último) ----------
function bkDate(b){const m=String(b.id).match(/^(\d{4})-(\d\d)-(\d\d)(?:_(\d\d)-(\d\d)-(\d\d))?/);if(m)return new Date(+m[1],m[2]-1,+m[3],+(m[4]||12),+(m[5]||0),+(m[6]||0));return new Date(b.createdAt||0)}
function bkTree(L2){const Y=[];L2.map(b=>({b,d:bkDate(b)})).sort((a,b)=>b.d-a.d||(b.b.createdAt||0)-(a.b.createdAt||0)).forEach(o=>{const y=o.d.getFullYear(),mk=o.d.getMonth(),dk=o.d.getDate();
 let yy=Y.find(x=>x.y===y);if(!yy)Y.push(yy={y,M:[]});let mm=yy.M.find(x=>x.m===mk);if(!mm)yy.M.push(mm={m:mk,D:[]});let dd=mm.D.find(x=>x.d===dk);if(!dd)mm.D.push(dd={d:dk,B:[]});dd.B.push(o)});return Y}
const bkCnt=n=>n===1?T('1 respaldo'):T('{0} respaldos',n);
function bkTreeHtml(L2){const Y=bkTree(L2),loc=LOC(),cnt=a=>a.reduce((s,x)=>s+x,0);
 return `<div id="bktree">`+Y.map((y,yi)=>`<details class="bky" ${yi===0?'open':''}><summary>📁 ${y.y} <span class="muted">${bkCnt(cnt(y.M.map(m=>cnt(m.D.map(d=>d.B.length)))))}</span></summary>`+
  y.M.map((m,mi)=>{const mn=(s=>s[0].toUpperCase()+s.slice(1))(new Date(y.y,m.m,15).toLocaleDateString(loc,{month:'long'}));return `<details class="bkm" ${yi===0&&mi===0?'open':''}><summary>📁 ${mn} <span class="muted">${bkCnt(cnt(m.D.map(d=>d.B.length)))}</span></summary>`+
   m.D.map((d,di)=>`<details class="bkd" ${yi===0&&mi===0&&di===0?'open':''}><summary>📁 ${new Date(y.y,m.m,d.d).toLocaleDateString(loc,{weekday:'long',day:'numeric'})} <span class="muted">${bkCnt(d.B.length)}</span></summary>`+
    d.B.map(({b,d:dt})=>`<div class="row"><span class="n">${/_\d\d-\d\d-\d\d/.test(b.id)?dt.toLocaleTimeString(loc,{hour:'numeric',minute:'2-digit'}):'—'}${/antes-de-v2/.test(b.id)?' <span class="muted">(v2)</span>':''}</span><button class="sec adj" onclick="restoreBk('${b.id}')">${T('Restaurar')}</button></div>`).join('')+`</details>`).join('')+`</details>`}).join('')+`</details>`).join('')+`</div>`}
loadBk=async function(){const el=document.getElementById('bklist');if(!el||!window.fbBackups)return;let L2;try{L2=await window.fbBackups()}catch(e){L2=[]}const el2=document.getElementById('bklist');if(!el2)return;
 el2.innerHTML=(L2&&L2.length?`<div style="font-size:14px;color:#0f172a;margin-bottom:4px">${T('Último respaldo: {0}',bkWhen(L2[0]))}</div>`+bkTreeHtml(L2):T('Aún no hay respaldos en la nube.'))+
 `<button class="sec" style="width:100%;margin-top:6px" onclick="window.fbBackupNow().then(()=>{toast(T('Respaldo guardado'));loadBk()})">${T('Respaldo ahora')}</button>`};
document.head.insertAdjacentHTML('beforeend',`<style>#bktree details{margin:2px 0}#bktree summary{cursor:pointer;min-height:36px;display:flex;align-items:center;gap:6px;font-size:15px;color:#0f172a;list-style-position:outside}
#bktree summary::before{content:'▸';color:#94a3b8;width:12px}#bktree details[open]>summary::before{content:'▾'}#bktree .bkm{margin-left:14px}#bktree .bkd{margin-left:14px}#bktree .row{margin-left:18px}#movcard .row .n[onclick]{cursor:pointer}</style>`);
