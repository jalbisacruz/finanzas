"""v171 (DATOS DE EJEMPLO): el aviso de escaneo distingue Google ocupado (503),
cuota del día (se reinicia a las 3:00 a. m. ET) y límite por minuto; reintento
corto por modelo y fallback también ante 503/500 y 429 por minuto.
python3 tests/test_v171.py
"""
import os,json
from harness import app,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
ROUTES={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';
      const d=document.getElementById(host||'')||document.getElementById('dlg')||document.getElementById('regform')||document.body;
      (d||document.body).append(w)}""", host)

PHONE=dict(now='2026-11-26T14:46:00',new_look=True,width=390,height=900,routes=ROUTES,
           ctx_opts={'locale':'es-US'})

# Official-shaped errors (same bodies as v159, plus 503 that contains «generate»)
DAY=("""Object.assign(new Error('AI: Error fetching from https://firebasevertexai.googleapis.com/v1beta/projects/x/models/gemini-3.8-flash:generateContent: [429 Too Many Requests] You exceeded your current quota. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.8-flash (AI/fetch-error)'),{code:'fetch-error',customErrorData:{errorDetails:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaMetric:'generativelanguage.googleapis.com/generate_content_free_tier_requests',quotaId:'GenerateRequestsPerDayPerProjectPerModel-FreeTier',quotaValue:'20',quotaDimensions:{model:'gemini-3.8-flash'}}]}]}})""")
MIN=("""Object.assign(new Error('AI: Error fetching from x: [429 Too Many Requests] Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.8-flash, description: Generate content requests per minute limit exceeded on Free Tier. (AI/fetch-error)'),{code:'fetch-error',customErrorData:{errorDetails:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaMetric:'generativelanguage.googleapis.com/generate_content_free_tier_requests',quotaId:'GenerateRequestsPerMinutePerProjectPerModel-FreeTier',quotaValue:'5',quotaDimensions:{model:'gemini-3.8-flash'}}]}]}})""")
BUSY=("""Object.assign(new Error('AI: Error fetching from https://firebasevertexai.googleapis.com/v1beta/projects/x/models/gemini-3.5-flash:generateContent: [503 Service Unavailable] The model is overloaded. Please try again later. (AI/fetch-error)'),{code:'fetch-error'})""")
BUSY_UNAV=("""Object.assign(new Error('AI: generateContent failed: [UNAVAILABLE] The service is currently unavailable.'),{code:'AI/unavailable'})""")

# ---------- classifier + Joe's scanErr (main app) ----------
with app(ROOT,**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    check(E('CODE_V')>='v171','CODE_V')
    check('v171.js' in pg.content(),'index carga v171.js')
    check(E("typeof _v171==='object'"),'_v171')
    models=E('()=>_v171.MODELS')
    check(models[0]=='gemini-3.5-flash-lite' and 'gemini-3.8-flash' in models and 'gemini-4-hydrogen' in models,
          'cadena docs Firebase: '+str(models))
    check('gemini-3.8-flash-lite' not in models,'no se inventa flash-lite 3.8')

    day=E("()=>_v171.vScanErr("+DAY+")")
    check('cuota del día' in day.lower() or 'por día' in day,'día: '+day)
    check('3:00' in day and ('Este' in day or 'Eastern' in day),'reinicio 3:00 ET: '+day)
    check('Hay muchas solicitudes ahora mismo. Espera un minuto' not in day,'día no usa el aviso viejo: '+day)

    mn=E("()=>_v171.vScanErr("+MIN+")")
    check('por minuto' in mn.lower() and '5' in mn,'minuto: '+mn)
    check('cuota del día' not in mn.lower() and '3:00' not in mn,'minuto no es día: '+mn)

    busy=E("()=>_v171.vScanErr("+BUSY+")")
    check('ocupado' in busy.lower() or 'busy' in busy.lower(),'503 ocupado: '+busy)
    check('un minuto' not in busy.lower() and 'cuota del día' not in busy.lower(),'503 no se disfraza de cuota: '+busy)
    check(E("()=>_v171.isBusyErr("+BUSY+")") and not E("()=>_v171.isQuotaErr("+BUSY+")"),
          '503 de generateContent NO es cuota (rate⊂generate)')
    unav=E("()=>_v171.vScanErr("+BUSY_UNAV+")")
    check('ocupado' in unav.lower() or 'busy' in unav.lower(),'UNAVAILABLE ocupado: '+unav)

    # scanErr de Joe (la ruta de la app, no solo Tony)
    joe_busy=E("()=>scanErr("+BUSY+")")
    check('ocupado' in joe_busy.lower(),'scanErr 503: '+joe_busy)
    check('Hay muchas solicitudes ahora mismo. Espera un minuto' not in joe_busy,'scanErr ya no confunde generate/rate: '+joe_busy)
    joe_day=E("()=>scanErr("+DAY+")")
    check('cuota del día' in joe_day.lower() and '3:00' in joe_day,'scanErr día 3 AM ET: '+joe_day)
    joe_min=E("()=>scanErr("+MIN+")")
    check('por minuto' in joe_min.lower(),'scanErr minuto: '+joe_min)

    # diálogo de Joe, watermark
    E("()=>{if(typeof scanFail==='function')scanFail(scanErr("+BUSY+"))}")
    pg.wait_for_timeout(200)
    ui=pg.inner_text('#scanerr') if pg.locator('#scanerr').count() else pg.inner_text('#dlg')
    check('ocupado' in ui.lower(),'UI Joe 503: '+ui[:300])
    mark(pg,'dlg');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v171-scan-google-ocupado-phone.png'),full_page=False)

    E("()=>{if(typeof scanFail==='function')scanFail(scanErr("+DAY+"))}")
    pg.wait_for_timeout(200)
    ui=pg.inner_text('#scanerr') if pg.locator('#scanerr').count() else pg.inner_text('#dlg')
    check('día' in ui.lower() and '3:00' in ui,'UI Joe cuota del día: '+ui[:300])
    mark(pg,'dlg');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v171-scan-cuota-dia-phone.png'),full_page=False)

    E("()=>{if(typeof scanFail==='function')scanFail(scanErr("+MIN+"))}")
    pg.wait_for_timeout(200)
    ui=pg.inner_text('#scanerr') if pg.locator('#scanerr').count() else pg.inner_text('#dlg')
    check('minuto' in ui.lower(),'UI Joe por minuto: '+ui[:300])
    mark(pg,'dlg');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v171-scan-limite-minuto-phone.png'),full_page=False)

# ---------- fallback + retry with mocks (no live AI) ----------
OK=json.dumps({"isReceipt":True,"store":"Publix","date":"2026-11-26","total":5,"tax":0,"items":[]})

with app(ROOT,**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    # 503 on first try of first model, then success on retry (same model)
    log=E("""async()=>{
      window.__v171Backoff=0;
      const calls=[];
      window.__v171Call=async(name)=>{
        calls.push(name);
        if(calls.length===1)throw Object.assign(new Error('AI: generateContent [503] The model is overloaded'),{code:'fetch-error'});
        return %s;
      };
      const txt=await _v171.generateWithFallback('AAAA','image/jpeg','p');
      return {calls,txt,model:window.__v171Model};
    }"""%json.dumps(OK))
    check(log['calls']==['gemini-3.5-flash-lite','gemini-3.5-flash-lite'],'reintento del mismo modelo ante 503: '+str(log))
    check('Publix' in (log.get('txt') or ''),'éxito tras reintento: '+str(log.get('txt'))[:120])

    # 503 twice on first model → fallback to next (no 3rd try on first)
    log=E("""async()=>{
      window.__v171Backoff=0;
      const calls=[];
      window.__v171Call=async(name)=>{
        calls.push(name);
        if(name==='gemini-3.5-flash-lite')throw Object.assign(new Error('AI: generateContent [503] The model is overloaded'),{code:'fetch-error'});
        return %s;
      };
      const txt=await _v171.generateWithFallback('AAAA','image/jpeg','p');
      return {calls,txt,model:window.__v171Model};
    }"""%json.dumps(OK))
    check(log['calls'][:2]==['gemini-3.5-flash-lite','gemini-3.5-flash-lite'] and 'gemini-3.8-flash' in log['calls'],
          'tras 503+reintento pasa al siguiente: '+str(log['calls']))
    check(log.get('model')=='gemini-3.8-flash','usa 3.8-flash: '+str(log))

    # 429 por minuto: reintenta, luego fallback; 429 del día: sin reintento, sí fallback
    log=E("""async()=>{
      window.__v171Backoff=0;
      const calls=[];
      window.__v171Call=async(name)=>{
        calls.push(name);
        if(name==='gemini-3.5-flash-lite'){
          throw Object.assign(new Error('[429 Too Many Requests] quotaId GenerateRequestsPerMinutePerProjectPerModel-FreeTier quotaValue 5'),{code:'fetch-error'});
        }
        return %s;
      };
      const txt=await _v171.generateWithFallback('AAAA','image/jpeg','p');
      return {calls,model:window.__v171Model};
    }"""%json.dumps(OK))
    check(log['calls'].count('gemini-3.5-flash-lite')==2 and log['calls'][-1]=='gemini-3.8-flash',
          '429 por minuto: un reintento y fallback: '+str(log['calls']))

    log=E("""async()=>{
      window.__v171Backoff=0;
      const calls=[];
      window.__v171Call=async(name)=>{
        calls.push(name);
        if(name==='gemini-3.5-flash-lite'){
          throw Object.assign(new Error('[429 Too Many Requests] quotaId GenerateRequestsPerDayPerProjectPerModel-FreeTier quotaValue 20'),{code:'fetch-error'});
        }
        return %s;
      };
      await _v171.generateWithFallback('AAAA','image/jpeg','p');
      return {calls,model:window.__v171Model};
    }"""%json.dumps(OK))
    check(log['calls']==['gemini-3.5-flash-lite','gemini-3.8-flash'] and log['model']=='gemini-3.8-flash',
          '429 del día: sin reintento, sí siguiente modelo: '+str(log['calls']))

    # 400 no hace fallback
    threw=E("""async()=>{
      window.__v171Backoff=0;window.__v171Call=async()=>{throw Object.assign(new Error('[400] Invalid argument'),{code:'invalid-argument'})};
      try{await _v171.generateWithFallback('AAAA','image/jpeg','p');return {ok:true}}
      catch(e){return {ok:false,m:String(e&&e.message||e)}}
    }""")
    check(not threw.get('ok') and '400' in (threw.get('m') or ''),'400 no se reintenta: '+str(threw))

# ---------- inglés ----------
with app(ROOT,lang='en',**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    busy=E("()=>_v171.vScanErr("+BUSY+")")
    day=E("()=>_v171.vScanErr("+DAY+")")
    check('busy' in busy.lower(),'EN busy: '+busy)
    check('3:00' in day and ('Eastern' in day or 'Este' in day),'EN 3 AM ET: '+day)
    check('daily' in day.lower() or 'day' in day.lower(),'EN daily: '+day)

print('test_v171 OK',ok)
