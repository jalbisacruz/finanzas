// v157 (Joe): en la página de Tony (v.html) el escaneo decía «no pude leer
// el recibo» y pedía llenarlo a mano. No era la fecha faltante: la foto se
// entiende igual. Desde el 2 nov 2026 Firebase exige App Check en AI Logic.
// La página pública inicia App Check y llama a Gemini en el mismo instante,
// a menudo sin token todavía; Google rechaza la llamada. La app de Joe sí
// funciona porque App Check se calienta al iniciar sesión. Aquí se espera
// el token (y se reintenta si hace falta), la fecha vacía queda en hoy y
// se puede editar, y el mensaje dice la causa real (límite, App Check, etc.).
(function(){
const ES=!/^en/i.test(navigator.language||'es');
const AC_KEY='6LczjvEtAAAAAEaAHmwLEj2DUiWYY--kne8BH3ei';
const MSG=ES?{
  offline:'Sin conexión. Conéctate a internet para escanear, o anótalo a mano.',
  quota:'Hay muchas solicitudes ahora mismo. Espera un minuto y vuelve a intentarlo.',
  pdfBig:'El PDF es muy grande (máximo 15 MB).',
  notreceipt:'No parece un recibo. Prueba otra foto o anótalo a mano.',
  read:'No pude leer el recibo. Prueba otra foto con buena luz y el recibo completo, o anótalo a mano.',
  image:'No pude abrir la foto. Prueba otra vez.',
  appcheck:'El escaneo no pasó la verificación de Google (App Check). Prueba de nuevo, o anótalo a mano.',
  auth:'El escaneo no está disponible ahora mismo en esta página. Anótalo a mano.',
  unavail:'El escaneo no está disponible ahora mismo. Anótalo a mano.',
  reading:'Leyendo el recibo…',
  dateGuess:'No había fecha en el recibo; se puso la de hoy. Puedes cambiarla.'
}:{
  offline:'No connection. Connect to the internet to scan, or enter it by hand.',
  quota:'Too many requests right now. Wait a minute and try again.',
  pdfBig:'The PDF is too big (15 MB max).',
  notreceipt:"It doesn't look like a receipt. Try another photo or enter it by hand.",
  read:"I couldn't read the receipt. Try another photo with good light and the full receipt, or enter it by hand.",
  image:"I couldn't open the photo. Try again.",
  appcheck:"Scanning didn't pass Google's App Check. Try again, or enter it by hand.",
  auth:'Scanning is not available on this page right now. Enter it by hand.',
  unavail:"Scanning isn't available right now. Enter it by hand.",
  reading:'Reading the receipt…',
  dateGuess:'There was no date on the receipt; today was used. You can change it.'
};
const today=()=>new Date().toLocaleDateString('en-CA');
const r2=n=>Math.round((+n||0)*100)/100;
const yfix=d=>{const t=today(),c=t.slice(0,4)+d.slice(4),ms=new Date(c+'T12:00')-new Date(t+'T12:00');return d.slice(0,4)!==t.slice(0,4)&&!isNaN(ms)&&ms<=2*864e5&&ms>=-75*864e5?c:d};
const errText=e=>String((e&&(e.code||''))+' '+(e&&e.message||e));
const errCode=e=>{const c=String((e&&e.code)||'').replace(/^AI\//,'')||(String(e&&e.message||'').match(/\b[45]\d\d\b/)||[])[0]||String(e&&e.name||'error');return c.slice(0,30)};
const isAuthErr=e=>/unauth|401|not.?authenticated|missing.?auth/.test(errText(e).toLowerCase());
const isCheckErr=e=>/app.?check|attestat|recaptcha|appcheck|\b403\b/.test(errText(e).toLowerCase());
function vScanErr(e){
  const c=errText(e).toLowerCase();
  if(!navigator.onLine)return MSG.offline;
  if(/429|quota|resource.?exhausted|\brate\b/.test(c))return MSG.quota;
  if(/pdfsize/.test(c))return MSG.pdfBig;
  if(/notreceipt/.test(c))return MSG.notreceipt;
  if((e&&e.message)==='image')return MSG.image;
  if(/parse|json|empty/.test(c)&&!/unauth|app.?check|permission|403|401/.test(c))return MSG.read;
  if(isCheckErr(e))return MSG.appcheck+' ('+errCode(e)+')';
  if(isAuthErr(e))return MSG.auth+' ('+errCode(e)+')';
  return MSG.unavail+' ('+errCode(e)+')';
}
async function vEnsureCheck(force){
  if(typeof window.vFsLib!=='function')return;
  const L=await window.vFsLib();
  const AC=await import(L.B+'firebase-app-check.js');
  if(!L.ac){
    L.ac=AC.initializeAppCheck(L.app,{provider:new AC.ReCaptchaEnterpriseProvider(AC_KEY),isTokenAutoRefreshEnabled:true});
  }
  if(typeof AC.getToken==='function'){
    const tok=await AC.getToken(L.ac,!!force);
    window.__v157GotToken=true;
    return tok;
  }
}
async function vAnon(){
  if(typeof window.vFsLib!=='function')return;
  const L=await window.vFsLib();
  const Auth=await import(L.B+'firebase-auth.js');
  L.auth=L.auth||Auth.getAuth(L.app);
  if(L.auth&&L.auth.currentUser)return L.auth.currentUser;
  if(typeof Auth.signInAnonymously!=='function')return;
  return (await Auth.signInAnonymously(L.auth)).user;
}
async function vCallAI(orig,b64,mime){
  await vEnsureCheck(false);
  try{return await orig(b64,mime)}
  catch(e){
    if(isCheckErr(e)){await vEnsureCheck(true);return await orig(b64,mime)}
    if(isAuthErr(e)){await vAnon();await vEnsureCheck(true);return await orig(b64,mime)}
    throw e;
  }
}
function vParse(txt){
  const s=String(txt||'').trim().replace(/^```(?:json)?\s*|\s*```$/g,'');
  const a=s.indexOf('{'),b=s.lastIndexOf('}');
  if(a<0||b<a)throw new Error('parse');
  const o=JSON.parse(s.slice(a,b+1));
  if(o.isReceipt===false)throw new Error('notreceipt');
  return o;
}
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
  if(document.getElementById('rdatehint'))return;
  const hint=document.createElement('div');
  hint.id='rdatehint';hint.className='muted';
  hint.style.cssText='color:#b45309;font-weight:700;margin:4px 0 8px';
  hint.textContent=MSG.dateGuess;
  if(d&&d.parentNode)d.parentNode.appendChild(hint);
}
async function vScanFile(file){
  if(!file)return;
  const btn=document.getElementById('vscan');
  if(btn){btn.disabled=true;btn.textContent=MSG.reading}
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
    if(el)el.textContent=vScanErr(x);
  }
}
function install(){
  if(window._v157On||typeof window.vScan!=='function')return;
  window._v157On=true;
  const origAI=window.vAI;
  if(typeof origAI==='function'){
    window.vAI=async function(b64,mime){return vCallAI(origAI,b64,mime)};
  }
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
  vEnsureCheck(false).catch(e=>console.warn('appcheck warm',e));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
else install();
window._v157={vScanErr,vEnsureCheck,vScanFile,vParse,yfix,today,paintGuess,install,MSG};
})();
