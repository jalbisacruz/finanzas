// v149 (Joe):
// 1) El envío de la hoja de Tony fallaba con «No se pudo enviar. Inténtalo otra vez.» cuando había
//    5 o más cuentas: las reglas de Firestore llegaban al tope de 1000 expresiones. Las reglas se
//    aligeraron (ver firestore.rules). Aquí se limpia el payload (solo campos permitidos, números,
//    sin restos de otro modo de reparto) para que coincida con esas reglas.
// 2) En «Cambiar reparto» por montos: se ve el total de la cuenta, la suma que llevas y
//    Falta / Sobra / ✅ Cuadra. El último campo muestra lo que falta para llegar al total.
(function(){
Object.assign(typeof EN!=='undefined'?EN:{},{
  "Falta {0}":"Short {0}",
  "Sobra {0}":"Over {0}",
  "✅ Cuadra":"✅ Matches",
  "Suma {0} de {1}":"Sum {0} of {1}",
  "para llegar al total":"to reach the total",
  "Pon el total para ver los montos.":"Enter the total to see the amounts.",
  "Total":"Total"
});
const tr=(es,en)=>(typeof ES!=='undefined'&&ES===false)?en:es;
const fmt=(s,...a)=>String(s).replace(/\{(\d)\}/g,(_,i)=>a[i]);
const $=id=>document.getElementById(id);
const money=n=>'$'+(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const who=()=>(typeof BS!=='undefined'&&BS.SHEET_WHO)||['Joe','Tony','Carlos'];
const PEOPLE=(typeof BS!=='undefined'&&BS.PEOPLE)||['Joe','Tony','Carlos','Arianna'];
const r2=n=>Math.round((+n||0)*100)/100;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;' ,'"':'&quot;',"'":'&#39;'}[c]));

function cleanAlloc(a){
  a=a||{};
  const W=(a.who||[]).filter(p=>PEOPLE.includes(p)).slice(0,4);
  const mode=['pct','eq','amt','one'].includes(a.mode)?a.mode:'pct';
  const o={who:W.length?W:['Joe'],mode};
  if(mode==='pct'){const pct={};o.who.forEach(p=>{const v=+(a.pct||{})[p];if(isFinite(v))pct[p]=v});o.pct=pct}
  if(mode==='amt'){const amt={};o.who.forEach(p=>{const v=+(a.amt||{})[p];if(isFinite(v))amt[p]=v});o.amt=amt}
  return o;
}
function payloadRow(r){
  const o={key:String(r.key||''),total:r2(r.total),alloc:cleanAlloc(r.alloc)};
  const std=(typeof BS!=='undefined'&&BS.isStd)?BS.isStd(r.key):!String(r.key).startsWith('c-');
  const base=(typeof BS!=='undefined'&&BS.ROWS||[]).find(x=>x.key===r.key);
  if(!std||r.renamed||(base&&r.name&&r.name!==base.name)||r.custom){
    const n=String(r.name||'').trim().replace(/\s+/g,' ').slice(0,60);if(n)o.name=n}
  if(r.group&&(!std||r.custom)&&['casa','auto','otro'].includes(r.group))o.group=r.group;
  return o;
}
if(typeof window!=='undefined')window.payloadRow=payloadRow;

const _send=typeof window!=='undefined'&&window.vbSend;
if(typeof _send==='function')window.vbSend=async function(){
  const e=$('bserr'),ST=window.vbState&&window.vbState();if(!ST)return _send.apply(this,arguments);
  const has=r=>r.total!==''&&r.total!=null&&isFinite(+r.total);
  const L=ST.rows.filter(has);
  if(!L.length){if(e)e.textContent=tr('Pon al menos un total.','Enter at least one total.');return}
  const bad=L.filter(r=>BS.split(+r.total,r.alloc).err);
  if(bad.length){if(e)e.textContent=tr('El reparto no cuadra en: ','The split does not add up in: ')+bad.map(r=>r.name).join(', ');return}
  if(L.length>20){if(e)e.textContent=tr('Puedes enviar hasta 20 cuentas a la vez.','You can send up to 20 bills at a time.');return}
  const b=$('bssend');if(b){b.disabled=true;b.textContent=tr('Enviando…','Sending…')}
  try{
    const{F,db}=await window.vFsLib();
    await F.addDoc(F.collection(db,'shares',window.__TOK,'inbox'),{
      kind:'bills',by:'Tony',month:ST.k,rev:+ST.rev||0,
      rows:L.map(payloadRow),at:F.serverTimestamp()
    });
    ST.sent=true;
    const o={rows:{},sent:true};
    ST.rows.forEach(r=>o.rows[r.key]={total:r.total,alloc:r.alloc,name:r.name,group:r.group,custom:!!r.custom,renamed:!!r.renamed});
    try{localStorage.setItem('vbills-'+(window.__TOK||'')+'-'+ST.k,JSON.stringify(o))}catch(err){}
    if(typeof window.vBillsDraw==='function')window.vBillsDraw();
  }catch(x){
    console.error(x);
    if(e)e.textContent=tr('No se pudo enviar. Inténtalo otra vez.','Could not send. Try again.');
    if(b){b.disabled=false;b.textContent=tr('Enviar a Joe para revisar','Send to Joe for review')}
  }
};

// La UI de Falta/Sobra/Cuadra y el último campo (por montos) vive en vbills.js,
// porque edDraw/vbVal/ED/ST están dentro de su IIFE. No redefinir vbVal aquí.
document.head.insertAdjacentHTML('beforeend',`<style>
#vbed .vbbox{display:flex;flex-direction:column;max-height:85vh}
#vbed .vbtotal{font-size:16px;margin:4px 0 8px;background:#f8fafc;border-radius:10px;padding:8px 10px}
#vbed .vbtotal b{font-size:20px}
#vbed .vbsum{margin-top:10px;padding:8px 10px;border-radius:10px;background:#f1f5f9;flex:none}
#vbed .vbedact{flex:none;position:sticky;bottom:0;background:#fff;padding-top:8px}
@media(min-width:800px){
  #vbed .vbbox{max-height:80vh}
}
</style>`);
})();
