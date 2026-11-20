// v146: hoja de cuentas en el enlace de Tony. Pone el TOTAL y envía a Joe para revisar.
// El borrador se guarda en este dispositivo (guardado parcial). En blanco = no se envía (no es $0). Nada cambia hasta que Joe aprueba.
// Arianna no aparece en la hoja. Cuentas nuevas y nombres se envían a Joe; el key no cambia al renombrar.
(function(){
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const tr=(es,en)=>(typeof ES!=='undefined'&&ES===false)?en:es;
const who=()=>(BS.SHEET_WHO||['Joe','Tony','Carlos']);
const foot=per=>{const o=BS.fold?BS.fold(per):per;return `Joe ${money(o.Joe)} · Tony ${money(o.Tony)} · Carlos ${money(o.Carlos)}`};
let ST=null,ED=null,NM=null;
const dKey=()=>'vbills-'+(window.__TOK||'')+'-'+((window.__DOC||{}).billSheet||{}).k;
function load(){const D=window.__DOC,sh=D&&D.billSheet;if(!sh)return null;let dr=null;try{dr=JSON.parse(localStorage.getItem(dKey())||'null')}catch(e){}
 const rows=sh.rows.map(r=>{const x=dr&&dr.rows&&dr.rows[r.key];return {...r,name:(x&&x.name)||r.name,total:x&&'total' in x?x.total:(r.total==null?'':r.total),alloc:x&&x.alloc?x.alloc:r.alloc,renamed:!!(x&&x.renamed),custom:!!r.custom||!!(x&&x.custom)}});
 const seen=new Set(rows.map(r=>r.key));
 if(dr&&dr.rows)Object.keys(dr.rows).forEach(k=>{if(seen.has(k))return;const x=dr.rows[k];if(!x||!x.name)return;if(!(BS.keyOk?BS.keyOk(k):/^c-/.test(k)))return;
  rows.push({key:k,name:x.name,group:x.group||'otro',total:'total' in x?x.total:'',alloc:x.alloc||BS.def(k),custom:true,renamed:!!x.renamed})});
 return {k:sh.k,label:sh.label,rev:sh.rev,from:sh.from,rows,sent:dr&&dr.sent}}
function keep(){const o={rows:{}};ST.rows.forEach(r=>o.rows[r.key]={total:r.total,alloc:r.alloc,name:r.name,group:r.group,custom:!!r.custom,renamed:!!r.renamed});o.sent=ST.sent;try{localStorage.setItem(dKey(),JSON.stringify(o))}catch(e){}}
const has=r=>r.total!==''&&r.total!=null&&isFinite(+r.total);
function rowHtml(r,i){const sp=has(r)?BS.split(+r.total,r.alloc):null,bad=sp&&sp.err;
 return `<div class="bsr" id="bsr-${esc(r.key)}"><div class="bsn"><b>${esc(r.name)}</b> <a href="#" class="bsed" title="${esc(tr('Renombrar','Rename'))}" onclick="vbRen(${i});return false">✏️</a><div class="muted">${esc(BS.txt(r.alloc))}${r.def?' · '+tr('como hoy','as today'):''}</div>
  <a href="#" class="bsch" onclick="vbEdit(${i});return false">${tr('Cambiar reparto','Change split')}</a>${bad?'<div class="err2">'+tr('El reparto no cuadra','The split does not add up')+'</div>':''}</div>
  <div class="bsin"><input id="bst-${esc(r.key)}" type="number" inputmode="decimal" step="0.01" min="0" placeholder="$ —" value="${esc(r.total)}" oninput="vbTot(${i},this.value)"></div></div>`}
function totHtml(any,per){return any?foot(per):tr('Los totales por persona aparecen cuando pongas los montos.','Per-person totals appear when you enter amounts.')}
function draw(){const box=$('vbills');if(!box||!ST)return;const per={Joe:0,Tony:0,Carlos:0,Arianna:0};let any=0;
 ST.rows.forEach(r=>{if(!has(r))return;const s=BS.split(+r.total,r.alloc);if(s.err)return;any=1;(BS.PEOPLE||who()).forEach(p=>per[p]=(per[p]||0)+s[p])});
 const groups=(BS.GROUPS||[]).map(([g,l])=>{const body=ST.rows.map((r,i)=>r.group===g?rowHtml(r,i):'').join('');return body?`<div class="bsg">${esc(l)}</div>`+body:''}).join('');
 const orphan=ST.rows.map((r,i)=>(BS.GROUPS||[]).some(g=>g[0]===r.group)?'':rowHtml(r,i)).join('');
 box.innerHTML=`<div class="card" id="bsform"><h2>🧾 ${tr('Cuentas de','Bills for')} ${esc(ST.label)}</h2>
 <div class="muted" style="margin-bottom:8px">${ST.from&&ST.from!==ST.k?tr('Vienen los últimos montos aprobados. Puedes cambiarlos.','These are the last approved amounts. You can change them.'):tr('Pon el total. El reparto ya viene listo.','Enter the total. The split is already filled in.')}</div>
 ${groups}${orphan}
 <div class="bsadd"><a href="#" id="bsadd" class="bsch" onclick="vbAdd();return false">+ ${tr('Agregar cuenta','Add a bill')}</a></div>
 <div id="bstot" class="muted" style="margin-top:8px">${totHtml(any,per)}</div>
 <div id="bserr" class="err2"></div><button type="button" class="dl" id="bssend" style="margin-top:10px" onclick="vbSend()">${tr('Enviar a Joe para revisar','Send to Joe for review')}</button>
 <div id="bsok" class="muted" style="text-align:center;margin-top:6px">${ST.sent?'✅ '+tr('Enviado. Joe lo revisa antes de aplicar.','Sent. Joe reviews it before applying.'):''}</div></div>`}
window.vbTot=(i,v)=>{ST.rows[i].total=v;keep();const t=$('bstot');const per={Joe:0,Tony:0,Carlos:0,Arianna:0};let any=0;ST.rows.forEach(r=>{if(!has(r))return;const s=BS.split(+r.total,r.alloc);if(s.err)return;any=1;(BS.PEOPLE||who()).forEach(p=>per[p]=(per[p]||0)+s[p])});
 if(t)t.innerHTML=totHtml(any,per)};
window.vbEdit=i=>{const r=ST.rows[i];ED={i,a:JSON.parse(JSON.stringify(r.alloc||BS.def(r.key)))};edDraw()};
const fmt=(s,...a)=>String(s).replace(/\{(\d)\}/g,(_,i)=>a[i]);
const amtSum=a=>Math.round((a.who||[]).reduce((s,p)=>s+(isFinite(+(a.amt||{})[p])?+(a.amt||{})[p]:0),0)*100)/100;
function lastRemainder(a,T){if(a.mode!=='amt'||!(T>0)||!a.who||!a.who.length)return null;
 const last=a.who.filter(p=>who().includes(p)).at(-1);if(!last)return null;
 const others=Math.round(a.who.filter(p=>p!==last).reduce((s,p)=>s+(isFinite(+(a.amt||{})[p])?+(a.amt||{})[p]:0),0)*100)/100;
 return {last,left:Math.round((T-others)*100)/100}}
function statusHtml(T,a){if(!(T>0))return '<span class="muted">'+tr('Pon el total para ver los montos.','Enter the total to see the amounts.')+'</span>';
 if(a.mode==='amt'){const s=amtSum(a),d=Math.round((T-s)*100)/100,line=`<div class="muted">${fmt(tr('Suma {0} de {1}','Sum {0} of {1}'),money(s),money(T))}</div>`;
  if(Math.abs(d)<0.005)return `<b id="vbst" style="color:#15803d">${tr('✅ Cuadra','✅ Matches')}</b>`+line;
  if(d>0)return `<b id="vbst" style="color:#b45309">${fmt(tr('Falta {0}','Short {0}'),money(d))}</b>`+line;
  return `<b id="vbst" style="color:#dc2626">${fmt(tr('Sobra {0}','Over {0}'),money(-d))}</b>`+line}
 const sp=BS.split(T,a),W=who();if(!sp)return '';
 if(sp.err==='suma')return `<b id="vbst" style="color:#dc2626">${fmt(tr('Suma {0} de {1}','Sum {0} of {1}'),money(sp.sum),money(T))}</b>`;
 if(sp.err==='pct'){const d=Math.round((100-(+sp.sum||0))*100)/100;
  if(d>0.005)return `<b id="vbst" style="color:#b45309">${fmt(tr('Falta {0}','Short {0}'),d+'%')}</b><div class="muted">${tr('Suma','Sum')} ${sp.sum}% ${tr('de','of')} 100%</div>`;
  if(d<-0.005)return `<b id="vbst" style="color:#dc2626">${fmt(tr('Sobra {0}','Over {0}'),(-d)+'%')}</b><div class="muted">${tr('Suma','Sum')} ${sp.sum}% ${tr('de','of')} 100%</div>`;
  return `<b id="vbst" style="color:#15803d">${tr('✅ Cuadra','✅ Matches')}</b>`}
 if(sp.err)return `<span class="err2">${tr('Elige quién participa','Choose who is included')}</span>`;
 return `<b id="vbst" style="color:#15803d">${tr('✅ Cuadra','✅ Matches')}</b><div class="muted">${W.filter(p=>sp[p]).map(p=>p+' '+money(sp[p])).join(' · ')}</div>`}
function edDraw(){const r=ST.rows[ED.i],a=ED.a,T=+r.total||0;let m=$('vbed');if(!m){m=document.createElement('div');m.id='vbed';document.body.append(m)}
 const W=who(),on=p=>a.who.includes(p),modes=[['eq',tr('Iguales','Equal')],['pct','%'],['amt',tr('Montos','Amounts')],['one',tr('Uno solo','One person')]];
 const rem=lastRemainder(a,T);
 const fields=(a.mode==='pct'||a.mode==='amt')?a.who.filter(p=>W.includes(p)).map(p=>{
  const isLast=a.mode==='amt'&&rem&&p===rem.last,val=((a.mode==='pct'?a.pct:a.amt)||{})[p];
  const ph=isLast&&isFinite(rem.left)?String(rem.left):(a.mode==='pct'?'%':'$');
  const hint=isLast&&isFinite(rem.left)?`<div class="muted" style="font-size:12px">${tr('para llegar al total','to reach the total')}</div>`:'';
  return `<div class="g2" style="align-items:center;margin-top:6px"><div>${esc(p)}${hint}</div><input id="vbv-${esc(p)}" type="number" inputmode="decimal" step="0.01" value="${esc(val??'')}" placeholder="${esc(ph)}" oninput="vbVal('${p}',this.value)"></div>`}).join(''):'';
 m.innerHTML=`<div class="vbbg" onclick="vbEdClose()"></div><div class="card vbbox" id="vbbox"><h2>${tr('Reparto','Split')} · ${esc(r.name)}</h2>
 <div id="vbtotal" class="vbtotal">${tr('Total','Total')} <b>${T?money(T):'—'}</b></div>
 <div class="lbl">${tr('Quién participa','Who is included')}</div><div class="chips">${W.map(p=>`<button type="button" class="chip${on(p)?' on':''}" onclick="vbWho('${p}')">${p}</button>`).join('')}</div>
 <div class="lbl">${tr('Cómo se reparte','How it is split')}</div><div class="chips">${modes.map(([v,l])=>`<button type="button" class="chip${a.mode===v?' on':''}" onclick="vbMode('${v}')">${l}</button>`).join('')}</div>
 ${fields}
 <div id="vbsum" class="vbsum">${statusHtml(T,a)}</div>
 <div class="g2 vbedact" style="margin-top:10px"><button type="button" class="chip" style="min-height:44px" onclick="vbEdClose()">${tr('Cancelar','Cancel')}</button><button type="button" class="dl" id="vbedok" onclick="vbEdOk()">${tr('Listo','Done')}</button></div></div>`}
window.vbWho=p=>{const a=ED.a;if(a.mode==='one'){a.who=[p]}else{a.who=a.who.includes(p)?a.who.filter(x=>x!==p):[...a.who,p]}edDraw()};
window.vbMode=v=>{const a=ED.a;a.mode=v;if(v==='one')a.who=a.who.slice(0,1);if(v==='pct'){a.pct=a.pct||{}}if(v==='amt'){a.amt=a.amt||{}}edDraw()};
window.vbVal=(p,v)=>{const a=ED.a;(a.mode==='pct'?(a.pct=a.pct||{}):(a.amt=a.amt||{}))[p]=v===''?'':+v;const r=ST.rows[ED.i],T=+r.total||0,s=$('vbsum');if(s)s.innerHTML=statusHtml(T,a);
 if(a.mode==='amt'){const rem=lastRemainder(a,T);if(rem&&p!==rem.last){const i=$('vbv-'+rem.last);if(i&&(i.value===''||document.activeElement!==i))i.placeholder=String(rem.left)}}};
window.vbEdClose=()=>{ED=null;const m=$('vbed');if(m)m.remove()};
window.vbEdOk=()=>{const r=ST.rows[ED.i];if(!ED.a.who.length)return;if(has(r)){const sp=BS.split(+r.total,ED.a);if(sp.err)return}r.alloc=ED.a;keep();vbEdClose();draw()};
function newKey(){const a='abcdefghijklmnopqrstuvwxyz0123456789';let k='c-';for(let i=0;i<8;i++)k+=a[Math.floor(Math.random()*a.length)];return ST.rows.some(r=>r.key===k)?newKey():k}
function nmDlg(title,value,onOk){NM={onOk};let m=$('vbnm');if(!m){m=document.createElement('div');m.id='vbnm';document.body.append(m)}
 m.innerHTML=`<div class="vbbg" onclick="vbNmClose()"></div><div class="card vbbox" id="vbnmbox"><h2>${esc(title)}</h2>
 <input id="vbnn" type="text" maxlength="60" value="${esc(value||'')}" placeholder="${esc(tr('Nombre de la cuenta','Bill name'))}" style="margin-top:8px">
 <div class="g2" style="margin-top:10px"><button type="button" class="chip" style="min-height:44px" onclick="vbNmClose()">${tr('Cancelar','Cancel')}</button><button type="button" class="dl" id="vbnmok" onclick="vbNmOk()">${tr('Listo','Done')}</button></div></div>`;
 const i=$('vbnn');if(i){i.focus();i.select();i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();vbNmOk()}}}
}
window.vbNmClose=()=>{NM=null;const m=$('vbnm');if(m)m.remove()};
window.vbNmOk=()=>{const n=($('vbnn')&&$('vbnn').value||'').trim().replace(/\s+/g,' ');if(!n)return;if(!NM||!NM.onOk)return;const ok=NM.onOk(n);if(ok!==false)vbNmClose()};
function nameTaken(n,except){const s=n.toLowerCase();return ST.rows.some(r=>r!==except&&String(r.name||'').trim().toLowerCase()===s)}
window.vbAdd=()=>{nmDlg('+ '+tr('Agregar cuenta','Add a bill'),'',n=>{if(nameTaken(n)){const e=$('bserr');if(e)e.textContent=tr('Ya hay una cuenta con ese nombre.','A bill with that name already exists.');const box=$('vbnmbox');if(box){let x=box.querySelector('.err2');if(!x){x=document.createElement('div');x.className='err2';box.append(x)}x.textContent=tr('Ya hay una cuenta con ese nombre.','A bill with that name already exists.')}return false}
  ST.rows.push({key:newKey(),name:n,group:'otro',total:'',alloc:BS.def('nuevo'),custom:true});keep();draw()})};
window.vbRen=i=>{const r=ST.rows[i];nmDlg(tr('Renombrar','Rename')+' · '+r.name,r.name,n=>{if(n===r.name)return;if(nameTaken(n,r)){const box=$('vbnmbox');if(box){let x=box.querySelector('.err2');if(!x){x=document.createElement('div');x.className='err2';box.append(x)}x.textContent=tr('Ya hay una cuenta con ese nombre.','A bill with that name already exists.')}return false}
  r.name=n;r.renamed=true;keep();draw()})};
function cleanAlloc(a){a=a||{};const P=BS.PEOPLE||['Joe','Tony','Carlos','Arianna'];
 const W=(a.who||[]).filter(p=>P.includes(p)).slice(0,4);
 const mode=['pct','eq','amt','one'].includes(a.mode)?a.mode:'pct';
 const o={who:W.length?W:['Joe'],mode};
 if(mode==='pct'){const pct={};o.who.forEach(p=>{const v=+(a.pct||{})[p];if(isFinite(v))pct[p]=v});o.pct=pct}
 if(mode==='amt'){const amt={};o.who.forEach(p=>{const v=+(a.amt||{})[p];if(isFinite(v))amt[p]=v});o.amt=amt}
 return o}
function payloadRow(r){const o={key:r.key,total:Math.round(+r.total*100)/100,alloc:cleanAlloc(r.alloc)};const std=BS.isStd?BS.isStd(r.key):!String(r.key).startsWith('c-');
 const base=(BS.ROWS||[]).find(x=>x.key===r.key);if(!std||r.renamed||(base&&r.name&&r.name!==base.name)||r.custom){const n=String(r.name||'').trim().replace(/\s+/g,' ').slice(0,60);if(n)o.name=n}
 if(r.group&&(!std||r.custom)&&['casa','auto','otro'].includes(r.group))o.group=r.group;return o}
window.payloadRow=payloadRow;
window.vbSend=async()=>{const e=$('bserr');const L=ST.rows.filter(has);if(!L.length){e.textContent=tr('Pon al menos un total.','Enter at least one total.');return}
 const bad=L.filter(r=>BS.split(+r.total,r.alloc).err);if(bad.length){e.textContent=tr('El reparto no cuadra en: ','The split does not add up in: ')+bad.map(r=>r.name).join(', ');return}
 const b=$('bssend');b.disabled=true;b.textContent=tr('Enviando…','Sending…');
 try{const{F,db}=await window.vFsLib();await F.addDoc(F.collection(db,'shares',window.__TOK,'inbox'),{kind:'bills',by:'Tony',month:ST.k,rev:+ST.rev||0,
   rows:L.map(payloadRow),at:F.serverTimestamp()});
  ST.sent=true;keep();draw()}catch(x){console.error(x);e.textContent=tr('No se pudo enviar. Inténtalo otra vez.','Could not send. Try again.');b.disabled=false;b.textContent=tr('Enviar a Joe para revisar','Send to Joe for review')}};
window.vbState=()=>ST;window.vBillsDraw=()=>{const D=window.__DOC;if(!D||D.who!=='Tony'||!D.billSheet)return;const m=$('m');if(!m)return;
 if(!$('vbills')){const s=document.createElement('div');s.id='vbills';const det=$('vdetb')||$('vdet'),rb=$('regbox');
  if(det)det.after(s);else if(rb)rb.after(s);else m.append(s)}
 ST=load();draw()};
document.head.insertAdjacentHTML('beforeend',`<style>
#bsform .bsg{font-weight:700;color:#1e3a8a;margin:12px 0 2px;font-size:14px}
#bsform .bsr{display:flex;gap:8px;justify-content:space-between;align-items:flex-start;border-top:1px solid #eef2f6;padding:8px 0}
#bsform .bsn{min-width:0;flex:1}#bsform .bsn .muted{font-size:12px}#bsform .bsch{font-size:12px;color:#1d4ed8;text-decoration:none}
#bsform .bsed{font-size:14px;text-decoration:none;margin-left:4px;opacity:.8;vertical-align:1px}
#bsform .bsadd{margin:8px 0 0}#bsform .bsadd .bsch{font-size:13px}
#bsform .bsin{width:150px;flex:none}#bsform .bsin input{min-height:38px;width:100%}
#bsform .bsrev{background:#fef3c7;color:#92400e;font-size:11px;border-radius:8px;padding:1px 6px}
#vbed,#vbnm{position:fixed;inset:0;z-index:30}#vbed .vbbg,#vbnm .vbbg{position:absolute;inset:0;background:#0f172a80}
#vbed .vbbox,#vbnm .vbbox{position:absolute;left:10px;right:10px;bottom:10px;max-width:520px;margin:auto;max-height:85vh;overflow:auto}
#vbed .vbbox{display:flex;flex-direction:column;max-height:85vh}
#vbed .vbtotal{font-size:16px;margin:4px 0 8px;background:#f8fafc;border-radius:10px;padding:8px 10px}
#vbed .vbtotal b{font-size:20px}
#vbed .vbsum{margin-top:10px;padding:8px 10px;border-radius:10px;background:#f1f5f9;flex:none}
#vbed .vbedact{flex:none;position:sticky;bottom:0;background:#fff;padding-top:8px}

@media(min-width:800px){
  main{max-width:980px;padding:24px 28px}
  #bsform{padding:20px 24px}
  #bsform .bsr{align-items:center;padding:10px 0;gap:16px}
  #bsform .bsin{width:180px}
  #bsform .bsn .muted{font-size:13px}
  #vbed .vbbox,#vbnm .vbbox{left:50%;right:auto;bottom:auto;top:50%;transform:translate(-50%,-50%);width:480px;max-width:calc(100% - 48px);margin:0}
}
</style>`);
})();
