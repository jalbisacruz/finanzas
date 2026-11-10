// v140: hoja de cuentas en el enlace de Tony. Pone el TOTAL, marca Fija/Variable y envía a Joe para revisar.
// El borrador se guarda en este teléfono (guardado parcial). En blanco = no se envía (no es $0). Nada cambia hasta que Joe aprueba.
(function(){
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
let ST=null,ED=null;
const dKey=()=>'vbills-'+(window.__TOK||'')+'-'+((window.__DOC||{}).billSheet||{}).k;
function load(){const D=window.__DOC,sh=D&&D.billSheet;if(!sh)return null;let dr=null;try{dr=JSON.parse(localStorage.getItem(dKey())||'null')}catch(e){}
 const rows=sh.rows.map(r=>{const x=dr&&dr.rows&&dr.rows[r.key];return {...r,total:x&&'total' in x?x.total:(r.total==null?'':r.total),fixed:x&&'fixed' in x?x.fixed:r.fixed,alloc:x&&x.alloc?x.alloc:r.alloc}});
 return {k:sh.k,label:sh.label,rev:sh.rev,from:sh.from,rows,sent:dr&&dr.sent}}
function keep(){const o={rows:{}};ST.rows.forEach(r=>o.rows[r.key]={total:r.total,fixed:r.fixed,alloc:r.alloc});o.sent=ST.sent;try{localStorage.setItem(dKey(),JSON.stringify(o))}catch(e){}}
const has=r=>r.total!==''&&r.total!=null&&isFinite(+r.total);
function rowHtml(r,i){const sp=has(r)?BS.split(+r.total,r.alloc):null,bad=sp&&sp.err;
 const chip=(on,l,v)=>`<button type="button" class="chip${on?' on':''}" data-i="${i}" data-fx="${v}" onclick="vbFix(${i},${v})">${l}</button>`;
 return `<div class="bsr" id="bsr-${r.key}"><div class="bsn"><b>${esc(r.name)}</b>${r.review?' <span class="bsrev">revisar</span>':''}<div class="muted">${esc(BS.txt(r.alloc))}${r.def?' · como hoy':''}</div>
  <a href="#" class="bsch" onclick="vbEdit(${i});return false">Cambiar reparto</a>${bad?'<div class="err2">El reparto no cuadra</div>':''}</div>
  <div class="bsin"><input id="bst-${r.key}" type="number" inputmode="decimal" step="0.01" min="0" placeholder="$ —" value="${esc(r.total)}" oninput="vbTot(${i},this.value)">
  <div class="chips">${chip(r.fixed===true,'Fija','true')}${chip(r.fixed===false,'Variable','false')}</div></div></div>`}
function draw(){const box=$('vbills');if(!box||!ST)return;const per={Joe:0,Tony:0,Carlos:0,Arianna:0};let any=0;
 ST.rows.forEach(r=>{if(!has(r))return;const s=BS.split(+r.total,r.alloc);if(s.err)return;any=1;BS.PEOPLE.forEach(p=>per[p]+=s[p])});
 const groups=BS.GROUPS.map(([g,l])=>`<div class="bsg">${l}</div>`+ST.rows.map((r,i)=>r.group===g?rowHtml(r,i):'').join('')).join('');
 box.innerHTML=`<div class="card" id="bsform"><h2>🧾 Cuentas de ${esc(ST.label)}</h2>
 <div class="muted" style="margin-bottom:8px">${ST.from&&ST.from!==ST.k?'Vienen los últimos montos aprobados. Revisa los variables.':'Pon el total y marca Fija o Variable. El reparto ya viene listo.'}</div>
 ${groups}<div id="bstot" class="muted" style="margin-top:8px">${any?`Joe ${money(per.Joe)} · Tony ${money(per.Tony)} · Carlos ${money(per.Carlos)} · Arianna ${money(per.Arianna)} <span>(lo paga Tony)</span>`:'Los totales por persona aparecen cuando pongas los montos.'}</div>
 <div id="bserr" class="err2"></div><button type="button" class="dl" id="bssend" style="margin-top:10px" onclick="vbSend()">Enviar a Joe para revisar</button>
 <div id="bsok" class="muted" style="text-align:center;margin-top:6px">${ST.sent?'✅ Enviado. Joe lo revisa antes de aplicar.':''}</div></div>`}
window.vbTot=(i,v)=>{ST.rows[i].total=v;keep();const t=$('bstot');const per={Joe:0,Tony:0,Carlos:0,Arianna:0};let any=0;ST.rows.forEach(r=>{if(!has(r))return;const s=BS.split(+r.total,r.alloc);if(s.err)return;any=1;BS.PEOPLE.forEach(p=>per[p]+=s[p])});
 if(t)t.innerHTML=any?`Joe ${money(per.Joe)} · Tony ${money(per.Tony)} · Carlos ${money(per.Carlos)} · Arianna ${money(per.Arianna)} <span>(lo paga Tony)</span>`:'Los totales por persona aparecen cuando pongas los montos.'};
window.vbFix=(i,v)=>{ST.rows[i].fixed=ST.rows[i].fixed===v?null:v;ST.rows[i].review=false;keep();draw()};
// editor de reparto (aparte; la pantalla principal queda simple)
window.vbEdit=i=>{const r=ST.rows[i];ED={i,a:JSON.parse(JSON.stringify(r.alloc))};edDraw()};
function edDraw(){const r=ST.rows[ED.i],a=ED.a,T=+r.total||0;let m=$('vbed');if(!m){m=document.createElement('div');m.id='vbed';document.body.append(m)}
 const on=p=>a.who.includes(p),modes=[['eq','Iguales'],['pct','%'],['amt','Montos'],['one','Uno solo']];
 const sp=T?BS.split(T,a):null;
 m.innerHTML=`<div class="vbbg" onclick="vbEdClose()"></div><div class="card vbbox"><h2>Reparto · ${esc(r.name)}</h2><div class="muted">Total ${T?money(T):'—'}</div>
 <div class="lbl">Quién participa</div><div class="chips">${BS.PEOPLE.map(p=>`<button type="button" class="chip${on(p)?' on':''}" onclick="vbWho('${p}')">${p}</button>`).join('')}</div>
 <div class="lbl">Cómo se reparte</div><div class="chips">${modes.map(([v,l])=>`<button type="button" class="chip${a.mode===v?' on':''}" onclick="vbMode('${v}')">${l}</button>`).join('')}</div>
 ${(a.mode==='pct'||a.mode==='amt')?a.who.map(p=>`<div class="g2" style="align-items:center;margin-top:6px"><div>${p}${p==='Arianna'?' <span class="muted">(lo paga Tony)</span>':''}</div><input type="number" inputmode="decimal" step="0.01" value="${esc((a.mode==='pct'?a.pct:a.amt)[p]??'')}" placeholder="${a.mode==='pct'?'%':'$'}" oninput="vbVal('${p}',this.value)"></div>`).join(''):''}
 <div id="vbsum" style="margin-top:8px">${sp?(sp.err?`<span class="err2">${sp.err==='suma'?'Suma '+money(sp.sum)+' de '+money(T):sp.err==='pct'?'Suma '+sp.sum+'% de 100%':'Elige quién participa'}</span>`:BS.PEOPLE.filter(p=>sp[p]).map(p=>p+' '+money(sp[p])).join(' · ')):'<span class="muted">Pon el total para ver los montos.</span>'}</div>
 <div class="g2" style="margin-top:10px"><button type="button" class="chip" style="min-height:44px" onclick="vbEdClose()">Cancelar</button><button type="button" class="dl" id="vbedok" onclick="vbEdOk()">Listo</button></div></div>`}
window.vbWho=p=>{const a=ED.a;if(a.mode==='one'){a.who=[p]}else{a.who=a.who.includes(p)?a.who.filter(x=>x!==p):[...a.who,p]}edDraw()};
window.vbMode=v=>{const a=ED.a;a.mode=v;if(v==='one')a.who=a.who.slice(0,1);if(v==='pct'){a.pct=a.pct||{}}if(v==='amt'){a.amt=a.amt||{}}edDraw()};
window.vbVal=(p,v)=>{const a=ED.a;(a.mode==='pct'?(a.pct=a.pct||{}):(a.amt=a.amt||{}))[p]=v===''?'':+v;const r=ST.rows[ED.i],T=+r.total||0,s=$('vbsum');if(s&&T){const sp=BS.split(T,a);s.innerHTML=sp.err?`<span class="err2">${sp.err==='suma'?'Suma '+money(sp.sum)+' de '+money(T):sp.err==='pct'?'Suma '+sp.sum+'% de 100%':'Elige quién participa'}</span>`:BS.PEOPLE.filter(x=>sp[x]).map(x=>x+' '+money(sp[x])).join(' · ')}};
window.vbEdClose=()=>{ED=null;const m=$('vbed');if(m)m.remove()};
window.vbEdOk=()=>{const r=ST.rows[ED.i];if(!ED.a.who.length)return;if(has(r)){const sp=BS.split(+r.total,ED.a);if(sp.err)return}r.alloc=ED.a;keep();vbEdClose();draw()};
window.vbSend=async()=>{const e=$('bserr');const L=ST.rows.filter(has);if(!L.length){e.textContent='Pon al menos un total.';return}
 const nf=L.filter(r=>typeof r.fixed!=='boolean');if(nf.length){e.textContent='Marca Fija o Variable en: '+nf.map(r=>r.name).join(', ');return}
 const bad=L.filter(r=>BS.split(+r.total,r.alloc).err);if(bad.length){e.textContent='El reparto no cuadra en: '+bad.map(r=>r.name).join(', ');return}
 const b=$('bssend');b.disabled=true;b.textContent='Enviando…';
 try{const{F,db}=await window.vFsLib();await F.addDoc(F.collection(db,'shares',window.__TOK,'inbox'),{kind:'bills',by:'Tony',month:ST.k,rev:+ST.rev||0,
   rows:L.map(r=>({key:r.key,total:Math.round(+r.total*100)/100,fixed:r.fixed,alloc:r.alloc})),at:F.serverTimestamp()});
  ST.sent=true;keep();draw()}catch(x){console.error(x);e.textContent='No se pudo enviar. Inténtalo otra vez.';b.disabled=false;b.textContent='Enviar a Joe para revisar'}};
window.vBillsDraw=()=>{const D=window.__DOC;if(!D||D.who!=='Tony'||!D.billSheet)return;const m=$('m');if(!m)return;
 if(!$('vbills')){const s=document.createElement('div');s.id='vbills';const det=$('vdetb')||$('vdet'),rb=$('regbox');
  if(det)det.after(s);else if(rb)rb.after(s);else m.append(s)}
 ST=load();draw()};
document.head.insertAdjacentHTML('beforeend',`<style>
#bsform .bsg{font-weight:700;color:#1e3a8a;margin:12px 0 2px;font-size:14px}
#bsform .bsr{display:flex;gap:8px;justify-content:space-between;align-items:flex-start;border-top:1px solid #eef2f6;padding:8px 0}
#bsform .bsn{min-width:0;flex:1}#bsform .bsn .muted{font-size:12px}#bsform .bsch{font-size:12px;color:#1d4ed8;text-decoration:none}
#bsform .bsin{width:150px;flex:none}#bsform .bsin input{min-height:38px}#bsform .bsin .chips{margin:4px 0 0;gap:4px}#bsform .bsin .chip{min-height:30px;padding:2px 10px;font-size:13px}
#bsform .bsrev{background:#fef3c7;color:#92400e;font-size:11px;border-radius:8px;padding:1px 6px}
#vbed{position:fixed;inset:0;z-index:30}#vbed .vbbg{position:absolute;inset:0;background:#0f172a80}#vbed .vbbox{position:absolute;left:10px;right:10px;bottom:10px;max-width:520px;margin:auto;max-height:85vh;overflow:auto}
</style>`);
})();
