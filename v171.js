// v171 (Joe): el escaneo de recibos seguía mostrando «Hay muchas solicitudes
// ahora mismo. Espera un minuto…» aunque hubiera pasado más de un minuto.
// Causa (verificada en código, sin la consola de Joe): en la app de Joe,
// scanErr (scan.js) agrupa 429, quota, resource_exhausted y la subcadena
// «rate», y «rate» aparece dentro de «generate». Un 503/UNAVAILABLE/overloaded
// de generateContent se puede mostrar como si fuera un límite por minuto.
// Además fbScan (sync.js) solo cambia de modelo ante un 404: un 429 o 503 en
// gemini-3.5-flash corta sin probar el siguiente. v159 sí distinguía día vs
// minuto y hacía fallback, pero solo en la página de Tony (vAI), no en fbScan.
// Aquí hay avisos distintos (Google ocupado, cuota del día que se reinicia a
// las 3:00 a. m. hora del Este, límite por minuto), un reintento de 2–4 s por
// modelo ante 503/500/overloaded o 429 por minuto, y la cadena también pasa al
// siguiente modelo en esos casos. Modelos según Firebase AI Logic (Gemini
// Developer API, docs 2026-11-18): gemini-3.5-flash-lite, gemini-3.8-flash
// (flash estable actual) y gemini-4-hydrogen (estable más reciente, multimodal,
// sin facturación obligatoria). No hay un flash estable más nuevo que 3.8-flash.
(function(){
const MODELS=['gemini-3.5-flash-lite','gemini-3.8-flash','gemini-4-hydrogen'];
const FB='https://www.gstatic.com/firebasejs/11.10.0/';
function isES(){
  if(typeof LANG!=='undefined')return LANG!=='en';
  if(window._v158&&typeof _v158.isES==='function')return _v158.isES();
  try{return localStorage.getItem('finanzas-lang')!=='en'&&localStorage.getItem('v-lang')!=='en'}catch(e){return true}
}
const MSGS={
 es:{
  qDay:'Se acabó la cuota del día{n}. Se reinicia a las 3:00 a. m. hora del Este (medianoche en el Pacífico). Anótalo a mano.',
  qMin:'Límite por minuto{n}. Espera un minuto y vuelve a intentarlo, o anótalo a mano.',
  qZero:'Este modelo no tiene cuota en el plan gratuito (límite 0). Anótalo a mano.',
  qTok:'Se acabó la cuota de tokens{n}. Espera un poco o anótalo a mano.',
  qUnk:'Hay un límite de solicitudes{n}. Revisa si es por minuto o por día, o anótalo a mano.',
  busy:'Google está ocupado ahora mismo. Espera un momento y vuelve a intentarlo, o anótalo a mano.'
 },
 en:{
  qDay:'The daily quota is used up{n}. It resets at 3:00 a.m. Eastern time (midnight Pacific). Enter it by hand.',
  qMin:'Per-minute limit{n}. Wait a minute and try again, or enter it by hand.',
  qZero:'This model has no quota on the free plan (limit 0). Enter it by hand.',
  qTok:'The token quota is used up{n}. Wait a bit or enter it by hand.',
  qUnk:'There is a request limit{n}. It may be per-minute or per-day. Enter it by hand.',
  busy:'Google is busy right now. Try again in a moment, or enter it by hand.'
 }
};
function msg(k,n){
  const t=(MSGS[isES()?'es':'en']||MSGS.es)[k]||k;
  return t.replace('{n}',n||'');
}
function errText(e){
  const extra=e&&(e.customErrorData||e.customData||e.errorDetails||e.details);
  let s=String((e&&(e.code||''))+' '+(e&&e.message||e));
  if(extra){try{s+=' '+JSON.stringify(extra)}catch(x){s+=' '+String(extra)}}
  return s;
}
// No usar la subcadena «rate»: aparece dentro de «generate» y etiquetaba mal un 503.
function isQuotaErr(e){
  const t=errText(e);
  return /429|resource.?exhausted|quota.?exceeded|too many requests|quotaId|quotaValue|quota_limit/i.test(t);
}
function isBusyErr(e){
  if(isQuotaErr(e))return false;
  const t=errText(e);
  return /503|502|500|504|unavailable|overloaded|high demand|deadline.?exceeded|internal(?:\s+server)?\s+error/i.test(t);
}
function isMissingModel(e){return /404|not found|not supported/i.test(errText(e))}
function isTransient(e){
  if(isBusyErr(e))return true;
  if(isQuotaErr(e)&&quotaInfo(e).win==='minute')return true;
  const t=errText(e);
  return !isQuotaErr(e)&&/fetch|network|load failed|timeout|app.?check/i.test(t);
}
function isModelFallback(e){return isQuotaErr(e)||isMissingModel(e)||isBusyErr(e)}
function quotaInfo(e){
  const t=errText(e);
  const quotaId=(t.match(/quotaId["'\s:=]+([A-Za-z0-9_\-]+)/i)||t.match(/(GenerateRequestsPer(?:Day|Minute)[A-Za-z0-9_\-]*)/i)||[])[1]||'';
  const val=(t.match(/quotaValue["'\s:=]+"?(\d+)"?/i)||t.match(/quota_limit(?:_value)?["'\s:=]+"?(\d+)"?/i)||t.match(/\blimit:\s*(\d+)/i)||[])[1];
  const model=(t.match(/model["'\s:=]+"?([a-z0-9][a-z0-9.\-]*)/i)||[])[1]||e&&(e._v171model||e._v159model)||'';
  let win=null;
  const id=quotaId+' '+t;
  if(/PerDay|requests per day|por d[ií]a|1\/d|\/d\/|RPD/i.test(id))win='day';
  else if(/PerMinute|requests per minute|por minuto|1\/min|\/min|RPM/i.test(id))win='minute';
  else if(/token/i.test(quotaId)||/tokens per minute|TPM/i.test(t))win='token';
  const n=val!=null&&val!==''?+val:null;
  if(n===0)win=win||'zero';
  return {quotaId,val:n,model,win,text:t};
}
function quotaMsg(e){
  const q=quotaInfo(e);
  const n=q.val!=null?(isES()?` (${q.val} por ${q.win==='minute'?'minuto':q.win==='day'?'día':'unidad'})`:` (${q.val} per ${q.win||'limit'})`):'';
  const code=q.win==='day'?'429 por día':q.win==='minute'?'429 por minuto':q.val===0?'429 límite 0':'429';
  const extra=(q.val!=null&&q.win?`, ${q.val}`:'')+(q.model?', '+q.model:'');
  if(q.val===0)return msg('qZero')+' ('+code+extra+')';
  if(q.win==='day')return msg('qDay',n)+' ('+code+extra+')';
  if(q.win==='minute')return msg('qMin',n)+' ('+code+extra+')';
  if(q.win==='token')return msg('qTok',n)+' (429 tokens'+extra+')';
  return msg('qUnk')+' ('+code+extra+')';
}
function busyMsg(e){
  const t=errText(e);
  const code=(t.match(/\b(50[034]|500|UNAVAILABLE)\b/i)||['503'])[0];
  return msg('busy')+' ('+code+')';
}
function vScanErr(e){
  if(isQuotaErr(e))return quotaMsg(e);
  if(isBusyErr(e))return busyMsg(e);
  if(window._v159&&typeof _v159._prevScanErr==='function')return _v159._prevScanErr(e);
  if(typeof window.__v171PrevScanErr==='function')return window.__v171PrevScanErr(e);
  if(window._v158&&typeof window.__v171Prev158==='function')return window.__v171Prev158(e);
  return String(e&&e.message||e);
}
function defaultPrompt(){
  if(typeof scanPrompt==='function')return scanPrompt();
  if(window._v159&&typeof window._v159Prompt==='function')return window._v159Prompt();
  return 'Read the receipt and return JSON only.';
}
function sleep(){
  if(typeof window.__v171Sleep==='function')return window.__v171Sleep();
  const ms=typeof window.__v171Backoff==='number'?window.__v171Backoff:(2000+Math.floor(Math.random()*2001));
  if(!ms)return Promise.resolve();
  return new Promise(r=>setTimeout(r,ms));
}
async function callModel(name,b64,mime,prompt){
  if(typeof window.__v171Call==='function')return window.__v171Call(name,b64,mime,prompt);
  let AI,app,B=FB;
  if(typeof window.vFsLib==='function'){
    const L=await window.vFsLib();
    B=L.B||B;app=L.app;
    AI=await import(B+'firebase-ai.js');
  }else{
    const App=await import(B+'firebase-app.js');
    AI=await import(B+'firebase-ai.js');
    const apps=typeof App.getApps==='function'?App.getApps():[];
    app=apps&&apps.length&&typeof App.getApp==='function'?App.getApp():null;
    if(!app)throw new Error('no-fs');
  }
  const ai=AI.getAI(app,{backend:new AI.GoogleAIBackend()});
  const m=AI.getGenerativeModel(ai,{model:name,generationConfig:{responseMimeType:'application/json',temperature:0}});
  return (await m.generateContent([prompt,{inlineData:{mimeType:mime||'image/jpeg',data:b64}}])).response.text();
}
async function generateWithFallback(b64,mime,prompt){
  if(window._v157&&typeof _v157.vEnsureCheck==='function'){
    try{await _v157.vEnsureCheck(false)}catch(e){console.warn('appcheck',e)}
  }
  let last;const tried=[];
  const p=prompt||defaultPrompt();
  for(const name of MODELS){
    tried.push(name);
    for(let attempt=0;attempt<2;attempt++){
      try{
        const txt=await callModel(name,b64,mime||'image/jpeg',p);
        window.__v171Model=window.__v159Model=name;
        try{window.__v161raw=String(txt||'')}catch(x){}
        return txt;
      }catch(e){
        e._v171model=e._v159model=name;
        last=e;
        if(attempt===0&&isTransient(e)){await sleep();continue}
        break;
      }
    }
    if(last&&isModelFallback(last))continue;
    if(last)throw last;
  }
  if(last){last._v171tried=last._v159tried=tried;throw last}
  throw new Error('no-model');
}

function hookScanErr(){
  if(typeof scanErr==='function'&&!scanErr.__v171){
    window.__v171PrevScanErr=scanErr;
    const w=function(e){return vScanErr(e)};
    w.__v171=true;
    window.scanErr=scanErr=w;
  }
  if(window._v159){
    _v159.MODELS=MODELS;
    _v159.generateWithFallback=generateWithFallback;
    _v159.isQuotaErr=isQuotaErr;
    _v159.quotaMsg=quotaMsg;
    _v159.quotaInfo=quotaInfo;
    _v159.vScanErr=vScanErr;
    _v159.isModelFallback=isModelFallback;
  }
  if(window._v158&&_v158.vScanErr&&!_v158.vScanErr.__v171){
    window.__v171Prev158=_v158.vScanErr;
    const w=function(e){return vScanErr(e)};
    w.__v171=true;
    _v158.vScanErr=w;
  }
  if(window._v157)_v157.vScanErr=vScanErr;
}
function hookAI(){
  if(typeof window.vAI==='function'&&!window.vAI.__v171){
    const prev=window.vAI;
    const w=async function(b64,mime){
      if(window.__scanErr)throw window.__scanErr;
      if(window.__scanResp)return typeof window.__scanResp==='string'?window.__scanResp:JSON.stringify(window.__scanResp);
      try{return await prev.apply(this,arguments)}
      catch(e){
        if(window.__scanErr||!isModelFallback(e))throw e;
        return generateWithFallback(b64,mime);
      }
    };
    w.__v171=true;
    window.vAI=w;
  }
  if(typeof window.fbScan==='function'&&!window.fbScan.__v171){
    const prev=window.fbScan;
    const w=async function(b64,prompt,mime){
      if(typeof window.fbUser==='function'&&!fbUser()){const e=new Error('signin');e.code='signin';throw e}
      try{return await generateWithFallback(b64,mime||'image/jpeg',prompt)}
      catch(e){if(String(e&&e.message)==='no-fs')return prev.apply(this,arguments);throw e}
    };
    w.__v171=true;
    window.fbScan=w;
  }
}
function hook(){hookScanErr();hookAI()}
hook();
document.addEventListener('DOMContentLoaded',hook);
let n=0;const iv=setInterval(()=>{hook();if(++n>80)clearInterval(iv)},50);

window._v171={MODELS,errText,isQuotaErr,isBusyErr,isTransient,isModelFallback,quotaInfo,quotaMsg,vScanErr,generateWithFallback,callModel,hook,MSGS};
})();
