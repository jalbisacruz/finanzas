// v158 (Joe): en Chrome en el iPhone (WebKit), el enlace de Tony mostró en
// inglés «Scanning isn't available right now. Enter it by hand. (fetch-error)».
// No es un corte de red: el SDK pone código fetch-error también a un HTTP 400/404.
// Una sonda al endpoint (sin foto de recibo) devolvió 400 «Firebase AI Logic
// genai config not found». v157 no reconocía ese texto. Además tomaba el
// idioma del navegador (Chrome en el iPhone de Joe está en inglés) y no el de
// la página (v-lang, español por defecto; distinto de finanzas-lang de la app
// en el mismo origen). Los avisos siguen el idioma de la página y dicen la
// causa. El arreglo de fondo lo hace Joe en la consola de Firebase (AI Logic).
(function(){
function isES(){
  try{
    const q=new URLSearchParams(location.search).get('lang');
    if(q==='es'||q==='en')return q==='es';
    const s=localStorage.getItem('v-lang');
    if(s==='es'||s==='en')return s==='es';
  }catch(e){}
  return true;
}
const MSGS={
 es:{
  offline:'Sin conexión. Conéctate a internet para escanear, o anótalo a mano.',
  quota:'Hay muchas solicitudes ahora mismo. Espera un minuto y vuelve a intentarlo.',
  pdfBig:'El PDF es muy grande (máximo 15 MB).',
  notreceipt:'No parece un recibo. Prueba otra foto o anótalo a mano.',
  read:'No pude leer el recibo. Prueba otra foto con buena luz y el recibo completo, o anótalo a mano.',
  image:'No pude abrir la foto. Prueba otra vez.',
  appcheck:'El escaneo no pasó la verificación de Google (App Check). Prueba de nuevo, o anótalo a mano.',
  auth:'El escaneo no está disponible ahora mismo en esta página. Anótalo a mano.',
  unavail:'El escaneo no está disponible ahora mismo. Anótalo a mano.',
  noconfig:'El escaneo no está configurado en Firebase (falta la config de Gemini). Anótalo a mano por ahora.',
  apikey:'La clave de Firebase no es válida para el escaneo. Anótalo a mano.',
  model:'El modelo de lectura no está disponible. Anótalo a mano.',
  network:'No se pudo conectar con el escaneo. Revisa la conexión o inténtalo otra vez, o anótalo a mano.',
  badreq:'El escaneo rechazó la solicitud. Anótalo a mano.',
  reading:'Leyendo el recibo…',
  dateGuess:'No había fecha en el recibo; se puso la de hoy. Puedes cambiarla.'
 },
 en:{
  offline:'No connection. Connect to the internet to scan, or enter it by hand.',
  quota:'Too many requests right now. Wait a minute and try again.',
  pdfBig:'The PDF is too big (15 MB max).',
  notreceipt:"It doesn't look like a receipt. Try another photo or enter it by hand.",
  read:"I couldn't read the receipt. Try another photo with good light and the full receipt, or enter it by hand.",
  image:"I couldn't open the photo. Try again.",
  appcheck:"Scanning didn't pass Google's App Check. Try again, or enter it by hand.",
  auth:'Scanning is not available on this page right now. Enter it by hand.',
  unavail:"Scanning isn't available right now. Enter it by hand.",
  noconfig:'Scanning is not set up in Firebase (Gemini config is missing). Enter it by hand for now.',
  apikey:'The Firebase key is not valid for scanning. Enter it by hand.',
  model:'The reading model is not available. Enter it by hand.',
  network:'Could not connect to scanning. Check your connection or try again, or enter it by hand.',
  badreq:'Scanning rejected the request. Enter it by hand.',
  reading:'Reading the receipt…',
  dateGuess:'There was no date on the receipt; today was used. You can change it.'
 }
};
const msg=k=>(MSGS[isES()?'es':'en']||MSGS.es)[k]||k;
const errText=e=>String((e&&(e.code||''))+' '+(e&&e.message||e));
function errCode(e){
  const raw=errText(e);
  const http=(raw.match(/\[([45]\d\d)\b/)||raw.match(/\b([45]\d\d)\b/)||[])[1];
  if(/genai config/i.test(raw))return (http?http+' ':'')+'genai-config';
  const c=String((e&&e.code)||'').replace(/^AI\//,'');
  if(http&&(!c||c==='fetch-error'||c==='error'))return http;
  return (c||http||String(e&&e.name||'error')).slice(0,40);
}
function vScanErr(e){
  const c=errText(e).toLowerCase();
  const code=errCode(e);
  if(!navigator.onLine)return msg('offline');
  if(/429|quota|resource.?exhausted|\brate\b/.test(c))return msg('quota');
  if(/genai config not found|failed_precondition/.test(c))return msg('noconfig')+' ('+code+')';
  if(/api key not valid|no-api-key/.test(c))return msg('apikey')+' ('+code+')';
  if(/pdfsize/.test(c))return msg('pdfBig');
  if(/notreceipt/.test(c))return msg('notreceipt');
  if((e&&e.message)==='image')return msg('image');
  if(/parse|json|empty/.test(c)&&!/unauth|app.?check|403|401|400|404|genai/.test(c))return msg('read');
  if(/app.?check|attestat|recaptcha|appcheck|\b403\b/.test(c))return msg('appcheck')+' ('+code+')';
  if(/unauth|401|not.?authenticated|missing.?auth/.test(c))return msg('auth')+' ('+code+')';
  if(/\b404\b|not found|not supported/.test(c))return msg('model')+' ('+code+')';
  if(/failed to fetch|networkerror|load failed|network request failed/.test(c)&&!/\b[45]\d\d\b/.test(c))return msg('network')+' ('+code+')';
  if(/\b400\b/.test(c))return msg('badreq')+' ('+code+')';
  return msg('unavail')+' ('+code+')';
}
const today=()=>(window._v157&&_v157.today?_v157.today():new Date().toLocaleDateString('en-CA'));
const r2=n=>Math.round((+n||0)*100)/100;
const yfix=d=>window._v157&&_v157.yfix?_v157.yfix(d):d;
const vParse=t=>window._v157&&_v157.vParse?_v157.vParse(t):(JSON.parse(String(t||'')));
function vResize(file){return new Promise((ok,ko)=>{const u=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{URL.revokeObjectURL(u);const W=im.naturalWidth,H=im.naturalHeight,cap=Math.max(W,H)>2*Math.min(W,H)?3000:1600,k=Math.min(1,cap/Math.max(W,H)),c=document.createElement('canvas');
   c.width=Math.round(W*k);c.height=Math.round(H*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
   const d=c.toDataURL('image/jpeg',0.8);c.width=c.height=0;ok(d.slice(d.indexOf(',')+1))};
  im.onerror=()=>{URL.revokeObjectURL(u);ko(new Error('image'))};im.src=u})}
function vPdf(file){return new Promise((ok,ko)=>{if(file.size>15*1024*1024)return ko(new Error('pdfsize'));const r=new FileReader();
  r.onload=()=>{const d=String(r.result);ok(d.slice(d.indexOf(',')+1))};r.onerror=()=>ko(new Error('image'));r.readAsDataURL(file)})}
function vPickCat(store,cat,cv){const L=cv||[];const isPub=/\bpublix\b/i.test(store||'');const isFuel=/fuel|gas\s*station|gasolina/i.test(store||'');
  const compras=L.find(c=>/compras/i.test(String(c).replace(/^\S+\s/,'')))||L.find(c=>/comida\/supermercado|food\/grocer/i.test(String(c)))||L[0]||'';
  if(isPub&&!isFuel){if(cat&&L.includes(cat)&&!/gasolina|gasoline/i.test(String(cat)))return cat;return compras}
  if(cat&&L.includes(cat))return cat;return compras}
function paintGuess(){
  if(!window.REG||!window.REG.dateGuess)return;
  const d=document.getElementById('rdate');
  if(d){d.style.outline='2px solid #f59e0b';d.removeAttribute('readonly');d.disabled=false}
  let hint=document.getElementById('rdatehint');
  if(!hint){
    hint=document.createElement('div');
    hint.id='rdatehint';hint.className='muted';
    hint.style.cssText='color:#b45309;font-weight:700;margin:4px 0 8px';
    if(d&&d.parentNode)d.parentNode.appendChild(hint);
  }
  hint.textContent=msg('dateGuess');
}
async function vScanFile(file){
  if(!file)return;
  const btn=document.getElementById('vscan');
  if(btn){btn.disabled=true;btn.textContent=msg('reading')}
  try{
    if(!window.REG&&typeof window.regOpen==='function')window.regOpen();
    const pdf=/pdf$/i.test(file.type||'')||/\.pdf$/i.test(file.name||'');
    const b64=pdf?await vPdf(file):await vResize(file);
    const o=vParse(await window.vAI(b64,pdf?'application/pdf':'image/jpeg'));
    const cv=(window.DOC&&window.DOC.cats||[]).map(c=>c.v);
    const hasDate=/^\d{4}-\d{2}-\d{2}$/.test(o.date||'');
    const date=hasDate?yfix(o.date):(window.REG&&window.REG.date)||today();
    Object.assign(window.REG,{
      store:String(o.store||'').slice(0,60),
      date,dateGuess:!hasDate,
      total:+o.total>0?r2(o.total):'',
      tax:+o.tax>0&&+o.tax<+o.total?r2(o.tax):'',
      scan:true,
      items:(Array.isArray(o.items)?o.items:[]).filter(x=>+x.amount>0).slice(0,60)
        .map(x=>({n:String(x.name||'').slice(0,40),a:r2(x.amount),own:['Yo','Tony','Carlos'],c:vPickCat(o.store,x.category,cv)}))
    });
    window.regDraw();
    paintGuess();
  }catch(x){
    console.warn('scan',x);
    if(typeof window.regDraw==='function')window.regDraw();
    const el=document.getElementById('rerr');
    if(el){el.textContent=vScanErr(x);el._v158err=x}
  }
}
function install(){
  if(typeof window.vScan!=='function'||window._v158On)return;
  window._v158On=true;
  window.vScanFile=vScanFile;
  window.vScan=function(){
    const i=document.createElement('input');i.type='file';i.accept='image/*,application/pdf';i.style.display='none';
    i.onchange=async()=>{const file=i.files&&i.files[0];i.remove();if(file)await vScanFile(file)};
    document.body.appendChild(i);i.click();
  };
  const _rd=window.regDraw;
  if(typeof _rd==='function'){
    window.regDraw=function(){_rd.apply(this,arguments);paintGuess()};
  }
  if(window._v157)_v157.vScanErr=vScanErr;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
else install();
window._v158={vScanErr,errCode,isES,msg,install,paintGuess,MSGS};
})();
