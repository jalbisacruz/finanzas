// v159 (Joe): en la página de Tony el 429 «Hay muchas solicitudes… espera un
// minuto» salía al instante, también después de esperar más de un minuto, con
// pocas pruebas. El código prueba primero gemini-3.5-flash y, si Google
// responde 429, corta sin intentar otro modelo. Ese aviso asume siempre un
// límite por minuto, pero el 429 puede ser cuota del día (se reinicia a
// medianoche del Pacífico) o un límite 0 del plan gratuito. Aquí se prueba
// antes gemini-3.5-flash-lite (más cuota gratuita, según lecturas de AI Studio)
// y luego gemini-3.8-flash y gemini-3.1-flash-lite; si todos fallan, el aviso
// dice si fue por minuto, por día o límite 0, con la cifra si viene en el error.
(function(){
const MODELS=['gemini-3.5-flash-lite','gemini-3.8-flash','gemini-3.1-flash-lite'];
const isES=()=>window._v158&&typeof _v158.isES==='function'?_v158.isES():true;
const MSGS={
 es:{
  qDay:'Se acabó la cuota del día{n}. Se reinicia a medianoche en hora del Pacífico. Anótalo a mano.',
  qMin:'Límite por minuto{n}. Espera un minuto y vuelve a intentarlo, o anótalo a mano.',
  qZero:'Este modelo no tiene cuota en el plan gratuito (límite 0). Anótalo a mano.',
  qTok:'Se acabó la cuota de tokens{n}. Espera un poco o anótalo a mano.',
  qUnk:'Hay muchas solicitudes. Puede ser un límite por minuto o por día. Revisa la cuota en la consola, o anótalo a mano.'
 },
 en:{
  qDay:'The daily quota is used up{n}. It resets at midnight Pacific time. Enter it by hand.',
  qMin:'Per-minute limit{n}. Wait a minute and try again, or enter it by hand.',
  qZero:'This model has no quota on the free plan (limit 0). Enter it by hand.',
  qTok:'The token quota is used up{n}. Wait a bit or enter it by hand.',
  qUnk:'Too many requests. It may be a per-minute or per-day limit. Check the quota in the console, or enter it by hand.'
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
function quotaInfo(e){
  const t=errText(e);
  const quotaId=(t.match(/quotaId["'\s:=]+([A-Za-z0-9_\-]+)/i)||t.match(/(GenerateRequestsPer(?:Day|Minute)[A-Za-z0-9_\-]*)/i)||[])[1]||'';
  const val=(t.match(/quotaValue["'\s:=]+"?(\d+)"?/i)||t.match(/quota_limit(?:_value)?["'\s:=]+"?(\d+)"?/i)||t.match(/\blimit:\s*(\d+)/i)||[])[1];
  const model=(t.match(/model["'\s:=]+"?([a-z0-9][a-z0-9.\-]*)/i)||[])[1]||e&&e._v159model||'';
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
  const n=q.val!=null? (isES()?` (${q.val} por ${q.win==='minute'?'minuto':q.win==='day'?'día':'unidad'})`:` (${q.val} per ${q.win||'limit'})`):'';
  const code=q.win==='day'?'429 por día':q.win==='minute'?'429 por minuto':q.val===0?'429 límite 0':'429';
  const extra=(q.val!=null&&q.win?`, ${q.val}`:'')+(q.model?', '+q.model:'');
  if(q.val===0)return msg('qZero')+' ('+code+extra+')';
  if(q.win==='day')return msg('qDay',n)+' ('+code+extra+')';
  if(q.win==='minute')return msg('qMin',n)+' ('+code+extra+')';
  if(q.win==='token')return msg('qTok',n)+' (429 tokens'+extra+')';
  return msg('qUnk')+' ('+code+extra+')';
}
function isQuotaErr(e){return /429|quota|resource.?exhausted|\brate\b/i.test(errText(e))}
function isMissingModel(e){return /404|not found|not supported/i.test(errText(e))}
function isModelFallback(e){return isQuotaErr(e)||isMissingModel(e)}
function vScanErr(e){
  if(isQuotaErr(e))return quotaMsg(e);
  if(window._v158&&typeof _v158.vScanErr==='function')return _v158.vScanErr(e);
  return String(e&&e.message||e);
}
function vPrompt(){
  const cats=((window.DOC&&window.DOC.cats)||[]).map(c=>c.v);
  return `Eres un lector de recibos de compra (tiendas de EE.UU.). Lee la foto, captura o PDF y responde SOLO con JSON:
{"isReceipt":true,"store":"nombre corto","date":"AAAA-MM-DD o null","total":0.00,"tax":0.00,"items":[{"name":"nombre corto en español","amount":0.00,"category":"una de la lista"}]}
"total" es el total pagado (con impuestos); "tax" la suma del sales tax (0 si no hay); los "amount" son ANTES de impuesto. No incluyas subtotal, impuestos ni pagos como ítems.
Categorías permitidas (texto exacto): ${JSON.stringify(cats)}.
Publix (supermercado, comida) NUNCA es gasolina: usa la categoría «Compras» si existe en la lista, si no «🛒 Comida/Supermercado». «⛽ Gasolina» solo si el recibo es combustible / Publix Fuel.`;
}
async function generateWithFallback(b64,mime,prompt){
  if(typeof window.vFsLib!=='function')throw new Error('no-fs');
  if(window._v157&&typeof _v157.vEnsureCheck==='function'){
    try{await _v157.vEnsureCheck(false)}catch(e){console.warn('appcheck',e)}
  }
  const L=await window.vFsLib();
  const AI=await import(L.B+'firebase-ai.js');
  const ai=AI.getAI(L.app,{backend:new AI.GoogleAIBackend()});
  let last;
  const tried=[];
  for(const name of MODELS){
    try{
      const m=AI.getGenerativeModel(ai,{model:name,generationConfig:{responseMimeType:'application/json',temperature:0}});
      const txt=(await m.generateContent([prompt||vPrompt(),{inlineData:{mimeType:mime||'image/jpeg',data:b64}}])).response.text();
      window.__v159Model=name;
      return txt;
    }catch(e){
      e._v159model=name;
      tried.push(name);
      last=e;
      if(isModelFallback(e))continue;
      throw e;
    }
  }
  if(last){last._v159tried=tried;throw last}
  throw new Error('no-model');
}
function install(){
  if(window._v159On)return;
  if(typeof window.vScan!=='function'&&typeof window.fbScan!=='function')return;
  window._v159On=true;
  if(typeof window.vAI==='function'){
    const origAI=window.vAI;
    window.vAI=async function(b64,mime){
      try{return await origAI(b64,mime)}
      catch(e){
        if(window.__scanErr||!isModelFallback(e))throw e;
        return generateWithFallback(b64,mime);
      }
    };
  }
  if(typeof window.vScanFile==='function'){
    const prev=window.vScanFile;
    window.vScanFile=async function(file){
      await prev(file);
      const el=document.getElementById('rerr');
      if(el&&el._v158err)el.textContent=vScanErr(el._v158err);
    };
  }
}
const _prev158=window._v158&&_v158.vScanErr;
function install2(){
  install();
  if(window._v158&&_prev158)_v158.vScanErr=function(e){return isQuotaErr(e)?quotaMsg(e):_prev158(e)};
  if(window._v157)_v157.vScanErr=vScanErr;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install2);
else install2();
window._v159={MODELS,quotaInfo,quotaMsg,vScanErr,isQuotaErr,generateWithFallback,install:install2};
})();
