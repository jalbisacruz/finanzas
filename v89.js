// v89: 1) Recordatorios en Hoy (solo dentro de la app; ✕ = ocultar hasta mañana)  2) Buscar en Operaciones (todos los meses)  3) Respaldo automático (ajustes)
Object.assign(EN,{"Recordatorios":"Reminders","Ocultar hasta mañana":"Hide until tomorrow","Ver {0} más":"See {0} more","Ver menos":"See less",
 "💳 {0} venció hace {1} días · {2}":"💳 {0} was due {1} days ago · {2}","💳 {0} vence hoy · {1}":"💳 {0} is due today · {1}","💳 {0} vence mañana · {1}":"💳 {0} is due tomorrow · {1}","💳 {0} vence en {1} días · {2}":"💳 {0} is due in {1} days · {2}",
 "➡️ Cuentas de Tony de {0} sin transferir · {1}":"➡️ Tony's {0} bills not transferred · {1}","➡️ Transferir a Tony las cuentas de {0} · {1}":"➡️ Transfer Tony's {0} bills · {1}",
 "📥 1 compra por revisar":"📥 1 purchase to review","📥 {0} compras por revisar":"📥 {0} purchases to review",
 "☁️ Sin respaldo hace más de 7 días":"☁️ No backup in over 7 days","☁️ El respaldo automático está apagado":"☁️ Automatic backup is off","☁️ No se ha podido hacer el respaldo automático":"☁️ The automatic backup couldn't run",
 "🤝 {0} de terceros por enviar":"🤝 {0} held for others to send",
 "Buscar en todos los meses":"Search all months","Tienda, nota, monto (48.06) o fecha (17 oct, 10/17)":"Store, note, amount (48.06) or date (Oct 17, 10/17)",
 "{0} resultados":"{0} results","1 resultado":"1 result","Sin resultados.":"No results.","Mostrar más":"Show more","Limpiar":"Clear",
 "Compra":"Purchase","Gasto":"Expense","Ingreso":"Income","Cheque":"Check","Banco":"Bank","Tony":"Tony","Carlos":"Carlos","Terceros":"Others' money","Cuenta de Tony":"Tony bill","Movimiento":"Movement",
 "Respaldo automático":"Automatic backup","Frecuencia":"Frequency","Semanal (cada 7 días)":"Weekly (every 7 days)","Diario":"Daily",
 "Al abrir la app con sesión iniciada, si el último respaldo en la nube (manual o automático) es más viejo que la frecuencia elegida, se guarda uno solo.":"When you open the app signed in, if the last cloud backup (manual or automatic) is older than the chosen frequency, one is saved on its own.",
 "Se conservan los 8 automáticos más recientes; los manuales y los «antes de restaurar» no se borran por esto.":"The 8 most recent automatic backups are kept; manual and “before restore” ones are never removed by this.",
 "Último automático: {0}":"Last automatic: {0}","El último intento no se pudo hacer (sin conexión); se reintenta al abrir la app.":"The last attempt couldn't run (offline); it retries when you open the app.",
 "Respaldo automático guardado ☁️":"Automatic backup saved ☁️","Automático":"Automatic","Respaldo automático activado":"Automatic backup on","Respaldo automático apagado":"Automatic backup off",
 "Cada respaldo se guarda con fecha y hora; no se sobrescriben.":"Each backup is saved with date and time; none are overwritten."});
const nrm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// ---------- 3. Respaldo automático: ajustes ----------
const AB_K='finanzas-autobk',abInfo=()=>{try{return JSON.parse(localStorage.getItem(AB_K)||'{}')||{}}catch(e){return {}}};
const abCfg=()=>({on:true,freq:'w',...(S.autoBk||{})});
function abSetCfg(o){S.autoBk={...abCfg(),...o};save();render();toast(T(S.autoBk.on?'Respaldo automático activado':'Respaldo automático apagado'))}
window.bkRefresh=()=>{if(typeof tab!=='undefined'&&tab==='cfg'&&typeof loadBk==='function')loadBk()};
function abCfgHtml(){const c=abCfg(),i=abInfo();
 return `<div id="abcfg"><label style="display:flex;align-items:center;gap:10px;font-weight:600;min-height:40px"><input type="checkbox" id="abon" style="width:22px;height:22px" ${c.on?'checked':''} onchange="abSetCfg({on:this.checked})">${T('Respaldo automático')}</label>
 <label style="display:flex;align-items:center;gap:10px">${T('Frecuencia')}<select id="abfreq" ${c.on?'':'disabled'} onchange="abSetCfg({freq:this.value})"><option value="w"${c.freq!=='d'?' selected':''}>${T('Semanal (cada 7 días)')}</option><option value="d"${c.freq==='d'?' selected':''}>${T('Diario')}</option></select></label>
 <div class="muted">${T('Al abrir la app con sesión iniciada, si el último respaldo en la nube (manual o automático) es más viejo que la frecuencia elegida, se guarda uno solo.')} ${T('Se conservan los 8 automáticos más recientes; los manuales y los «antes de restaurar» no se borran por esto.')} ${T('Cada respaldo se guarda con fecha y hora; no se sobrescriben.')}</div>
 ${i.lastAuto?`<div class="muted" id="ablast">${T('Último automático: {0}',new Date(i.lastAuto).toLocaleString(LOC(),{dateStyle:'medium',timeStyle:'short'}))}</div>`:''}
 ${c.on&&(i.fails||0)>0?`<div class="muted" id="abfail">${T('El último intento no se pudo hacer (sin conexión); se reintenta al abrir la app.')}</div>`:''}</div>`}
const _bkCfgV89=bkCfg;bkCfg=function(){const h=_bkCfgV89(),a=`<div><b>${T('Respaldo automático semanal')}</b></div>`,i=h.indexOf(a),j=h.indexOf('<div id="bklist"');if(i<0||j<i)return h;return h.slice(0,i)+abCfgHtml()+h.slice(j)};
// ---------- 1. Recordatorios en Hoy ----------
// Reglas (de lo más urgente a lo menos):
//  · tarjeta vencida o que vence en ≤5 días con saldo > 0 (día de vencimiento en Configuración; se apaga si ya se pagó)
//  · Cuentas de Tony de un mes ANTERIOR sin transferir (siempre); las del mes actual, desde el día 25
//  · compras de los enlaces (Tony/Carlos/Arianna) esperando en el buzón
//  · sin respaldo hace >7 días: solo si el automático está apagado o falló 3+ veces seguidas (sin sesión: sin exportar hace >7 días)
//  · dinero de terceros pendiente por enviar
const REM_K='finanzas-rem-hide',TONY_REM_DAY=25;let REM_ALL=false;
const remHidden=()=>{try{const o=JSON.parse(localStorage.getItem(REM_K)||'{}');return o.d===today()?o.ids||[]:[]}catch(e){return []}};
function remHide(id){const ids=remHidden();ids.push(id);localStorage.setItem(REM_K,JSON.stringify({d:today(),ids}));render()}
function remList(){const R=[],kL=keys().at(-1),m=L();if(!m)return R;
 (m.cards||[]).filter(c=>+c.amount>0.004).forEach(c=>{const i=dueInfo(c);if(!i||i.days>5)return;const n=esc(DN(c.name)),a=f(c.amount);
  const t=i.days<0?T('💳 {0} venció hace {1} días · {2}',n,-i.days,a):i.days===0?T('💳 {0} vence hoy · {1}',n,a):i.days===1?T('💳 {0} vence mañana · {1}',n,a):T('💳 {0} vence en {1} días · {2}',n,i.days,a);
  R.push({id:'card:'+c.name,u:i.days<0?-100+i.days:i.days,t,red:i.days<=0,go:`S.cur=keys().at(-1);cardPayDlg('${c.id}')`})});
 prevPend().filter(p=>p.c.tonyDue>0.005).forEach(p=>R.push({id:'tony:'+p.k,u:-50,red:true,t:T('➡️ Cuentas de Tony de {0} sin transferir · {1}',lbl(p.k),f(p.c.tonyDue)),go:`payDlg('tony','${p.k}')`}));
 const c=calc(m),day=+today().slice(8,10);if(c.tonyDue>0.005&&day>=TONY_REM_DAY&&today().slice(0,7)===kL)R.push({id:'tony:'+kL,u:2.5,t:T('➡️ Transferir a Tony las cuentas de {0} · {1}',lbl(kL),f(c.tonyDue)),go:`payDlg('tony','${kL}')`});
 const nI=typeof INBOX!=='undefined'?INBOX.length:0;if(nI)R.push({id:'inbox',u:3,t:nI===1?T('📥 1 compra por revisar'):T('📥 {0} compras por revisar',nI),go:'inboxList()'});
 const signed=window.fbUser&&fbUser(),cfg=abCfg(),ab=abInfo();
 if(signed){const old=!ab.last||Date.now()-ab.last>7*864e5;if(old&&(!cfg.on||(ab.fails||0)>=3))R.push({id:'bk',u:8,t:!cfg.on?T('☁️ El respaldo automático está apagado'):T('☁️ No se ha podido hacer el respaldo automático'),go:"tab='cfg';render();setTimeout(()=>goSec('bkcfg'),60)"})}
 else if(Object.keys(S.months||{}).length){const le=localStorage.getItem(LEK);if(!le||(tdy()-new Date(le+'T12:00'))>7*dayMs)R.push({id:'bk',u:8,t:T('☁️ Sin respaldo hace más de 7 días'),go:"tab='cfg';render();setTimeout(()=>goSec('bkcfg'),60)"})}
 const h=window.heldPend?heldPend():0;if(h>0.004)R.push({id:'held',u:9,t:T('🤝 {0} de terceros por enviar',f(h)),go:"tab='mov';render();setTimeout(()=>goSec('heldcard'),60)"});
 const hid=remHidden();return R.filter(r=>!hid.includes(r.id)).sort((a,b)=>a.u-b.u)}
function remCard(){if(typeof inboxLoad==='function')try{inboxLoad()}catch(e){}
 const R=remList();if(!R.length)return'';const MAX=3,vis=REM_ALL?R:R.slice(0,MAX);
 const row=r=>`<div class="remrow" data-rem="${esc(r.id)}"><button class="remgo" onclick="${r.go.replace(/"/g,'&quot;')}"${r.red?' style="color:#b91c1c"':''}>${r.t}</button><button class="remx" aria-label="${T('Ocultar hasta mañana')}" title="${T('Ocultar hasta mañana')}" onclick="remHide('${esc(r.id).replace(/'/g,"\\'")}')">✕</button></div>`;
 return `<div class="card" id="remcard" aria-label="${T('Recordatorios')}">${vis.map(row).join('')}${R.length>MAX?`<button class="remmore" id="remmore" onclick="REM_ALL=!REM_ALL;render()">${REM_ALL?T('Ver menos'):T('Ver {0} más',R.length-MAX)}</button>`:''}</div>`}
{const _iniV89=ini;ini=function(){const h=_iniV89(),r=remCard();if(!r)return h;let i=h.indexOf('<div class="card" id="todoline"');if(i<0){const j=h.indexOf('id="balcard"');i=j<0?-1:h.indexOf('</div>',j)}
 if(i<0)return r+h;return h.slice(0,i)+r+h.slice(i)}}
// ---------- 2. Buscar en Operaciones (todos los meses) ----------
let OS_Q='',OS_N=40,OS_R=[],OS_IDX=null,OS_KEY='';
const MES3={ene:1,jan:1,feb:2,mar:3,abr:4,apr:4,may:5,jun:6,jul:7,ago:8,aug:8,sep:9,set:9,oct:10,nov:11,dic:12,dec:12};
const osType=x=>({compra:'Compra',gasto:'Gasto',income:'Ingreso',check:'Cheque',cardpay:'Banco',todebit:'Banco',adjust:'Banco',saving:'Banco',tony:'Tony',carlos:'Carlos',held:'Terceros',heldsend:'Terceros',bill:'Cuenta de Tony'})[x.kind]||'Movimiento';
function osIndex(){const key=(S.updatedAt||0)+'|'+LANG+'|'+keys().length+'|'+JSON.stringify(S.held||[]).length;if(OS_IDX&&OS_KEY===key)return OS_IDX;
 const out=[];keys().forEach(k=>{const m=S.months[k];if(!m)return;const P={},E={},G={};(m.purchases||[]).forEach(p=>P[p.id]=p);(m.events||[]).forEach(e=>E[e.id]=e);(m.personal||[]).forEach(g=>G[g.id]=g);
  moves(m).forEach(x=>{const raw=x.kind==='compra'?P[x.id]:x.kind==='gasto'?G[x.id]:E[x.id];
   const extra=raw?[raw.note,raw.notes,raw.desc,raw.store,raw.concept,raw.recipient,raw.lineName,raw.card,...((raw.items||[]).map(i=>i&&(i.name||i.desc)))].filter(Boolean).join(' '):'';
   let note='';if(x.kind==='held'||x.kind==='heldsend'){const [_,eid,sid]=x.id.split(':'),e=(S.held||[]).find(y=>y.id===eid),s=e&&sid?(e.sends||[]).find(y=>y.id===sid):null;note=[(s||e||{}).note,e&&e.who,(s||e||{}).via].filter(Boolean).join(' ')}
   const d=sKey(dKey(x.date),k);out.push({...x,k,d,abs:Math.abs(+x.amount||0),hay:nrm([x.desc,DN(x.cat),T(osType(x)),extra,note,methName(x.method),fdate(x.date),lbl(k)].join(' '))})});
  (m.bills||[]).forEach(b=>out.push({id:b.id,kind:'bill',k,d:k+'-00',date:'',amount:-(+b.amount||0),abs:Math.abs(+b.amount||0),desc:DN(b.name),cat:'🧾 '+T('Cuentas de Tony'),method:'',hay:nrm([DN(b.name),b.name,T('Cuentas de Tony'),T('Cuenta de Tony'),lbl(k)].join(' '))}))});
 OS_IDX=out;OS_KEY=key;return out}
function osParse(q){let s=' '+nrm(q).replace(/\s+/g,' ')+' ';const D=[];const MX='(ene|jan|feb|mar|abr|apr|may|jun|jul|ago|aug|sept?|set|oct|nov|dic|dec)[a-z]*\\.?';
 s=s.replace(new RegExp('\\s(\\d{1,2})\\s*(?:de\\s+)?'+MX+'(?:\\s*(?:de\\s+|,\\s*)?(\\d{4}))?(?=\\s)','g'),(_,d,mo,y)=>{D.push({m:MES3[mo.slice(0,3)],d:+d,y:y?+y:0});return ' '});
 s=s.replace(new RegExp('\\s'+MX+'\\s*(\\d{1,2})(?:\\s*,?\\s*(\\d{4}))?(?=\\s)','g'),(_,mo,d,y)=>{D.push({m:MES3[mo.slice(0,3)],d:+d,y:y?+y:0});return ' '});
 s=s.replace(/\s(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/g,(_,a,b,y)=>{let mo=+a,d=+b;if(mo>12&&d<=12)[mo,d]=[d,mo];y=y?(+y<100?2000+ +y:+y):0;D.push({m:mo,d,y});return ' '});
 const W=s.trim().split(' ').filter(Boolean).map(t=>{const n=t.replace(/^\$/,'');if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(n)||/^\d+([.,]\d{1,2})?$/.test(n)){const v=parseFloat(n.replace(/,(?=\d{3}(\D|$))/g,'').replace(',','.'));return {t,num:v,dec:/[.,]\d{1,2}$/.test(n)&&!/^\d{1,3}(,\d{3})+$/.test(n)}}return {t}});
 return {D,W}}
function osSearch(q){const {D,W}=osParse(q);if(!D.length&&!W.length)return [];
 return osIndex().filter(x=>D.every(c=>{if(!x.d||x.kind==='bill')return false;const [y,mo,d]=x.d.split('-').map(Number);return mo===c.m&&d===c.d&&(!c.y||y===c.y)})&&
  W.every(w=>w.num!=null?(w.dec?Math.abs(x.abs-w.num)<0.005:Math.floor(x.abs+1e-9)===w.num||x.hay.split(/[^a-z0-9.]+/).includes(w.t)):x.hay.includes(w.t)))
  .sort((a,b)=>cmpS(b.d,a.d)||(b.k>a.k?1:b.k<a.k?-1:0))}
function osRow(x,i){const amt=x.kind==='todebit'||x.kind==='carlos'||x.kind==='saving'?'↔ '+f(x.abs):(x.amount>=0?'+':'−')+f(x.abs);
 return `<div class="row osr" data-k="${x.k}" data-kind="${x.kind}"><span class="n" role="button" onclick="osOpen(${i})"><span class="ostag">${esc(T(osType(x)))}</span> ${esc(x.desc)||esc(DN(x.cat))}<div class="muted">${x.kind==='bill'?'':fdate(x.date)+' · '}${esc(lbl(x.k))}${x.method?' · '+methName(x.method):''}</div></span><b class="${x.amount>=0&&x.kind!=='todebit'&&x.kind!=='carlos'&&x.kind!=='saving'?'pos':''}">${amt}</b></div>`}
function osResHtml(){if(!OS_Q.trim())return'';const t0=performance.now();OS_R=osSearch(OS_Q);window.__osMs=performance.now()-t0;const n=OS_R.length;
 return `<div class="muted" id="oscount" style="margin:6px 2px">${n?(n===1?T('1 resultado'):T('{0} resultados',n)):T('Sin resultados.')}</div>`+OS_R.slice(0,OS_N).map(osRow).join('')+(n>OS_N?`<button class="sec" id="osmore" style="width:100%;margin-top:6px" onclick="OS_N+=40;osDraw()">${T('Mostrar más')}</button>`:'')}
function osDraw(){const el=document.getElementById('osres');if(el)el.innerHTML=osResHtml()}
function osInput(v){OS_Q=v;OS_N=40;clearTimeout(window._osT);window._osT=setTimeout(osDraw,120);const c=document.getElementById('osclr');if(c)c.style.visibility=v?'visible':'hidden'}
function osCard(){return `<div class="card" id="oscard" style="padding:10px 12px"><div style="display:flex;gap:6px;align-items:center"><input id="osq" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" aria-label="${T('Buscar en todos los meses')}" placeholder="🔍 ${T('Buscar en todos los meses')}" value="${esc(OS_Q)}" oninput="osInput(this.value)" style="flex:1">
 <button class="sec" id="osclr" aria-label="${T('Limpiar')}" style="min-width:40px;visibility:${OS_Q?'visible':'hidden'}" onclick="OS_Q='';document.getElementById('osq').value='';osDraw();this.style.visibility='hidden'">✕</button></div>
 <div class="muted" style="font-size:12px;margin:4px 2px 0">${T('Tienda, nota, monto (48.06) o fecha (17 oct, 10/17)')}</div><div id="osres">${osResHtml()}</div></div>`}
function osOpen(i){const x=OS_R[i];if(!x)return;
 if(x.kind==='compra'){S.cur=x.k;render();editP(x.id);return}
 if(x.kind==='income'){incEdit(x.id);return}
 if(x.kind==='held'||x.kind==='heldsend'){const [_,eid,sid]=x.id.split(':');if(x.kind==='held')heldDlg(eid);else sendDlg(eid,sid);return}
 S.cur=x.k;tab='mov';if(x.kind==='bill'){render();setTimeout(()=>goSec('billsm'),60);return}
 movQ=x.desc||'';filt='';render();setTimeout(()=>goSec('movcard'),60)}
{const _movV89=mov;mov=function(){return osCard()+_movV89()}}
document.head.insertAdjacentHTML('beforeend',`<style>
#remcard{padding:4px 6px 4px 12px}#remcard .remrow{display:flex;align-items:center;gap:4px;border-bottom:1px solid #f1f5f9}#remcard .remrow:last-of-type{border-bottom:0}
#remcard .remgo{all:unset;cursor:pointer;flex:1;font-size:14px;line-height:1.3;padding:9px 0;color:#0f172a;min-height:22px}
#remcard .remx{all:unset;cursor:pointer;color:#94a3b8;font-size:14px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:8px}
#remcard .remmore{all:unset;cursor:pointer;color:#2563eb;font-size:13px;padding:6px 0 8px;display:block}
#oscard .ostag{display:inline-block;font-size:11px;font-weight:600;color:#475569;background:#f1f5f9;border-radius:6px;padding:1px 6px;margin-right:2px;vertical-align:1px}
#oscard .osr .n{cursor:pointer}</style>`);
