"""v159 (DATOS DE EJEMPLO): el 429 distingue cuota por minuto vs por día
(y límite 0) y, si un modelo se queda sin cuota, se prueba flash-lite.
python tests/test_v159.py
"""
import os,json
from harness import app,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
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
      const d=document.getElementById(host||'')||document.getElementById('regform')||document.body;
      (d||document.body).append(w)}""", host)

CATS=[{'v':'🛒 Comida/Supermercado','l':'🛒 Comida/Supermercado'}]
SNAP={'v':1,'who':'Tony','lang':'es','buyers':['Tony'],'cats':CATS,
      'names':{'Yo':'Joe','Tony':'Tony','Carlos':'Carlos'},'from':'Joe Albisa Cruz',
      'updatedAt':1764110000000,
      'months':[{'k':'2026-11','label':'Nov 2026','purchases':[],'joeOwes':0,'bills':[],
                 'billsTotal':0,'share':0,'toTransfer':0,'paid':0,'pending':0}]}
TOK='AAAAAAAAAAAAAAAAAAAAAA'
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
ACAP={"isReceipt":True,"store":"Acapulco Tropical","date":"2026-11-24","total":47.00,"tax":0,
      "items":[{"name":"Calabaza trozos","amount":3.09,"category":"🛒 Comida/Supermercado"}]}
PHONE=dict(now='2026-11-26T08:24:00',new_look=True,width=390,height=900,routes=ROUTES,
           ctx_opts={'locale':'es-US'})
DESK=dict(now='2026-11-26T08:24:00',new_look=True,width=1280,height=800,routes=ROUTES,
          ctx_opts={'locale':'es-US'})
MOCK="window.__scanResp="+json.dumps(ACAP)+""";window.__scanErr=null;
window.vAI=async()=>{if(window.__scanErr)throw window.__scanErr;return JSON.stringify(window.__scanResp)};"""

# Official-shaped 429 bodies (QuotaFailure + quotaId + quotaValue)
DAY=("""Object.assign(new Error('AI: Error fetching from https://firebasevertexai.googleapis.com/v1beta/projects/x/models/gemini-3.8-flash:generateContent: [429 Too Many Requests] You exceeded your current quota. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.8-flash (AI/fetch-error)'),{code:'fetch-error',customErrorData:{errorDetails:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaMetric:'generativelanguage.googleapis.com/generate_content_free_tier_requests',quotaId:'GenerateRequestsPerDayPerProjectPerModel-FreeTier',quotaValue:'20',quotaDimensions:{model:'gemini-3.8-flash'}}]}]}})""")
MIN=("""Object.assign(new Error('AI: Error fetching from x: [429 Too Many Requests] Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-3.8-flash, description: Generate content requests per minute limit exceeded on Free Tier. (AI/fetch-error)'),{code:'fetch-error',customErrorData:{errorDetails:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaMetric:'generativelanguage.googleapis.com/generate_content_free_tier_requests',quotaId:'GenerateRequestsPerMinutePerProjectPerModel-FreeTier',quotaValue:'5',quotaDimensions:{model:'gemini-3.8-flash'}}]}]}})""")
ZERO=("""Object.assign(new Error('AI: Error fetching from x: [429 Too Many Requests] Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-3.5-flash (AI/fetch-error)'),{code:'fetch-error',customErrorData:{errorDetails:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaMetric:'generativelanguage.googleapis.com/generate_content_free_tier_requests',quotaId:'GenerateRequestsPerDayPerProjectPerModel-FreeTier',quotaValue:'0',quotaDimensions:{model:'gemini-3.5-flash'}}]}]}})""")

def open_tony(pg, extra_init=None):
    pg.add_init_script("window.__SHARE_DOC="+json.dumps(SNAP)+";"+(extra_init or ''))
    baseu='/'.join(pg.url.split('/')[:3])
    pg.goto(baseu+'/v.html?t='+TOK)
    pg.wait_for_timeout(900)

def scan_file(pg):
    pg.evaluate("""async()=>{
      const b=await (await fetch('%s')).blob();
      await window.vScanFile(new File([b],'recibo.jpg',{type:'image/jpeg'}));
    }"""%IMG)
    pg.wait_for_timeout(500)

with app(ROOT,new_look=True,now='2026-11-26T08:24:00') as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v159','CODE_V v159: '+str(E('CODE_V')))
    check('v159.js' in pg.content(),'index carga v159.js')

# Classifier: day vs minute vs limit 0 (English navigator would still be Spanish via v-lang)
with app(ROOT,**PHONE) as pg:
    open_tony(pg, MOCK)
    E=pg.evaluate
    check(E("typeof _v159==='object' && window._v159On"),'v159 instalado')
    check(E("()=>_v159.MODELS[0]==='gemini-3.5-flash-lite' && _v159.MODELS.includes('gemini-3.8-flash')"),
          'cadena lite primero: '+str(E('()=>_v159.MODELS')))
    day=E("()=>_v159.vScanErr("+DAY+")")
    check('cuota del día' in day.lower() or 'por día' in day,'día: '+day)
    check('un minuto' not in day.lower() or 'por día' in day,'día no se disfraza de minuto: '+day)
    check('20' in day,'cifra 20: '+day)
    info=E("()=>_v159.quotaInfo("+DAY+")")
    check(info.get('win')=='day' and info.get('val')==20,'quotaInfo día: '+str(info))
    mn=E("()=>_v159.vScanErr("+MIN+")")
    check('por minuto' in mn.lower() and '5' in mn,'minuto: '+mn)
    check('cuota del día' not in mn.lower(),'minuto no es día: '+mn)
    z=E("()=>_v159.vScanErr("+ZERO+")")
    check('límite 0' in z.lower() or 'limite 0' in z.lower() or 'límite 0' in z,'cero: '+z)
    # UI: daily quota, not "espera un minuto" as the only advice
    pg.click('#vreg');pg.wait_for_timeout(80)
    E("()=>{window.__scanErr="+DAY+"}")
    scan_file(pg)
    ui=pg.inner_text('#rerr')
    check('día' in ui.lower() and '20' in ui,'UI cuota del día: '+ui)
    check('Hay muchas solicitudes ahora mismo. Espera un minuto' not in ui,'ya no el aviso genérico de un minuto: '+ui)
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v159-tony-scan-429-dia-phone.png'))
    E("()=>{window.__scanErr="+MIN+"}")
    scan_file(pg)
    ui=pg.inner_text('#rerr')
    check('minuto' in ui.lower() and '5' in ui,'UI por minuto: '+ui)
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v159-tony-scan-429-minuto-phone.png'))

# Fallback: first models 429, next one succeeds (no vAI mock)
with app(ROOT,**PHONE) as pg:
    open_tony(pg)  # real vAI via fakefb
    E=pg.evaluate
    pg.click('#vreg');pg.wait_for_timeout(80)
    # orig v.js tries gemini-3.5-flash first and throws on 429; v159 then tries lite, 3.8, 3.1-lite
    E("()=>{window.__aiCalls=0;window.__aiFail=["
      "{c:'fetch-error',m:'[429] Resource exhausted quotaId GenerateRequestsPerDayPerProjectPerModel-FreeTier quotaValue 20'},"
      "{c:'fetch-error',m:'[429] Resource exhausted quotaId GenerateRequestsPerDayPerProjectPerModel-FreeTier quotaValue 20'}"
      "];window.__aiText="+json.dumps(json.dumps(ACAP))+"}")
    scan_file(pg)
    store=pg.input_value('#rstore') if pg.locator('#rstore').count() else ''
    calls=E("window.__aiCalls")
    check(store=='Acapulco Tropical' and pg.locator('.itr').count()>=1,
          'tras 429 de un modelo, el siguiente rellena: store='+store+' calls='+str(calls))
    check(calls>=2,'se intentó más de un modelo: '+str(calls))
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v159-tony-scan-fallback-ok-phone.png'))

with app(ROOT,**DESK) as pg:
    open_tony(pg, MOCK)
    pg.click('#vreg');pg.wait_for_timeout(80)
    E=pg.evaluate
    E("()=>{window.__scanErr="+DAY+"}")
    scan_file(pg)
    ui=pg.inner_text('#rerr')
    check('día' in ui.lower(),'desktop día: '+ui)
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v159-tony-scan-429-dia-desktop.png'))

print('test_v159 OK',ok)
