/* v146 — Hoja de Tony: defaults 50/25/25 (Letra y Seguro del carro siguen Joe 100%),
   sin Arianna en la hoja, cuentas nuevas y renombres. No reescribe meses ya aprobados. */
(function(){
const STD=new Set((typeof BS!=='undefined'&&BS.STD_KEYS)||['renta','ventanas','agua','luz','gas','telefono','internet','purificador','seguro','letra']);
const FLIP=['telefono','internet','purificador'];
function isLegacyJoe100(key,a){if(!FLIP.includes(key)||!a)return false;const who=a.who||[];return a.mode==='pct'&&who.length===1&&who[0]==='Joe'&&+((a.pct||{}).Joe)===100}
function extraCat(group){return group==='auto'?'🚗 Transporte':group==='otro'?'📦 Otros':'🏠 Hogar'}
function bsExtra(){const B=bsS();B.extra=B.extra||[];return B.extra}
function bsHydrate(){
  if(typeof BS==='undefined')return;
  if(!BS.GROUPS.some(g=>g[0]==='otro'))BS.GROUPS.push(['otro','Otras']);
  const have=new Set(BS.ROWS.map(r=>r.key));
  bsExtra().forEach(x=>{if(!x||!x.key||have.has(x.key))return;if(!(BS.keyOk?BS.keyOk(x.key):/^c-/.test(x.key)))return;
    BS.ROWS.push({key:x.key,name:x.name,group:x.group||'otro',re:/$^/,cat:x.cat||extraCat(x.group)});have.add(x.key)});
}
function bsPutExtra(row){if(!row||!row.key||STD.has(row.key))return;const L=bsExtra(),i=L.findIndex(x=>x.key===row.key);
  const o={key:row.key,name:row.name,group:row.group||'otro',cat:row.cat||extraCat(row.group)};
  if(i>=0)L[i]=Object.assign({},L[i],o);else L.push(o);
  bsHydrate();
  const R=BS.ROWS.find(r=>r.key===row.key);if(R&&row.name)R.name=row.name}
function bsIsLegacy100(key,a){return isLegacyJoe100(key,a)}

if(typeof bsSheetFor==='function'){const _sf=bsSheetFor;bsSheetFor=function(k){
  bsHydrate();
  const sh=_sf(k),own=sh.from===k;
  sh.rows=(sh.rows||[]).map(r=>{
    if(!r)return r;
    if(!own && r.alloc && isLegacyJoe100(r.key,r.alloc))return Object.assign({},r,{alloc:BS.def(r.key),def:false});
    if(r.def&&FLIP.includes(r.key))return Object.assign({},r,{def:false});
    return r;
  });
  const seen=new Set(sh.rows.map(r=>r.key));
  bsExtra().forEach(x=>{if(seen.has(x.key))return;const src=own&&bsMonth(k).rows&&bsMonth(k).rows[x.key];
    sh.rows.push({key:x.key,name:x.name,group:x.group||'otro',custom:true,total:src&&src.total!=null?src.total:null,alloc:src&&src.alloc?src.alloc:BS.def(x.key),def:false})});
  return sh;
}}
if(typeof bsClean==='function'){const _cl=bsClean;bsClean=function(r){
  if(r&&r.key&&!STD.has(r.key)){
    if(!(BS.keyOk?BS.keyOk(r.key):/^c-[a-z0-9]{4,16}$/.test(r.key)))return null;
    const name=String(r.name||'').trim();if(!name||name.length>60)return {key:r.key,err:'nombre'};
    bsPutExtra({key:r.key,name,group:r.group||'otro'});
  }
  const o=_cl(r);if(!o)return o;if(o.err)return o;
  if(r.name){const n=String(r.name).trim();if(n&&n.length<=60)o.name=n}
  if(r.group)o.group=r.group;
  return o;
}}
if(typeof bsApplyTo==='function'){const _ap=bsApplyTo;bsApplyTo=function(m,rows){
  _ap(m,rows);
  (rows||[]).forEach(r=>{if(!r||r.err||r.key==='comida')return;
    const b=typeof bsBill==='function'?bsBill(m,r.key,true):null;if(!b)return;
    if(r.name&&b.name!==r.name)b.name=r.name;
    if(!STD.has(r.key)){b.cat=b.cat||extraCat(r.group);bsPutExtra({key:r.key,name:b.name,group:r.group||'otro',cat:b.cat})}
    else if(r.name){const R=BS.ROWS.find(x=>x.key===r.key);/* no mutar el nombre canónico de las fijas en BS.ROWS; solo la línea del mes */}})}}
if(typeof bsApprove==='function'){const _ok=bsApprove;bsApprove=function(id,force){const r=_ok(id,force);if(r&&r.ok){/* extra ya en S.bsheet */}return r}}
if(typeof bsReview==='function'){const _rv=bsReview;bsReview=function(id,force){
  _rv(id,force);
  try{const x=INBOX.find(y=>y.id===id);if(!x)return;const V=bsPreview(x);if(!V||V.err)return;
    const root=dlg();
    (V.rows||[]).forEach(r=>{if(!r||r.err||!r.name)return;const R=(BS.ROWS||[]).find(z=>z.key===r.key);const old=R?R.name:r.key;if(old===r.name)return;
      (root.querySelectorAll('#bsdiff td')||[]).forEach(td=>{const n=td.firstChild;if(n&&n.nodeType===3&&n.textContent===old)n.textContent=r.name})});
    const el=[...((root&&root.querySelectorAll('#bssum .muted'))||[])].find(n=>/Arianna/.test(n.textContent||''));
    if(el){const p=BS.fold?BS.fold(V.sumP):V.sumP;
      el.textContent=`${T('Responsable')} (${T('solo lo enviado')}): Joe ${f(p.Joe)} · Tony ${f(p.Tony)} · Carlos ${f(p.Carlos)}`}
  }catch(e){}}
}
if(typeof bsShareCard==='function'){const _sc=bsShareCard;bsShareCard=function(){
  let h=_sc.apply(this,arguments)||'';
  h=h.replace(/<div class="row"><span class="n">[^<]*Arianna[^<]*<\/span><span>[^<]*<\/span><\/div>\s*/g,'');
  return h;
}}

Object.assign(EN,{
  'Enviadas desde este dispositivo: {0}':'Sent from this device: {0}',
  'Agregar cuenta':'Add a bill',
  'Renombrar':'Rename',
  'Nombre de la cuenta':'Bill name',
  'Otras':'Other',
  'Ya hay una cuenta con ese nombre.':'A bill with that name already exists.'
});

try{if(typeof S!=='undefined'&&S)bsHydrate()}catch(e){}
window._v146={bsHydrate,bsPutExtra,bsIsLegacy100,FLIP,STD};
})();
