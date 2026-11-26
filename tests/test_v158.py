"""v158 (DATOS DE EJEMPLO): avisos de escaneo en el idioma de la página
(español por defecto, no el del navegador) y causa real de fetch-error
(p. ej. falta la config de Gemini en Firebase).
python tests/test_v158.py
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

CATS=[{'v':'🛒 Comida/Supermercado','l':'🛒 Comida/Supermercado'},{'v':'🏠 Hogar','l':'🏠 Hogar'}]
SNAP={'v':1,'who':'Tony','lang':'es','buyers':['Tony','Arianna'],'cats':CATS,
      'names':{'Yo':'Joe','Tony':'Tony','Carlos':'Carlos'},'from':'Joe Albisa Cruz',
      'updatedAt':1764110000000,
      'months':[{'k':'2026-11','label':'Nov 2026','purchases':[],'joeOwes':0,'bills':[],
                 'billsTotal':0,'share':0,'toTransfer':0,'paid':0,'pending':0}]}
TOK='AAAAAAAAAAAAAAAAAAAAAA'
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
ACAP={"isReceipt":True,"store":"Acapulco Tropical","date":"2026-11-24","total":47.00,"tax":0,
      "items":[{"name":"Calabaza trozos","amount":3.09,"category":"🛒 Comida/Supermercado"},
               {"name":"Baking hen","amount":21.12,"category":"🛒 Comida/Supermercado"}]}
# Chrome on iPhone: English navigator, same-origin app may have finanzas-lang,
# but the share page language is v-lang (default Spanish).
CHROME_IOS=dict(now='2026-11-26T07:53:00',new_look=True,width=390,height=900,routes=ROUTES,
                ctx_opts={'locale':'en-US','user_agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1'})
DESK=dict(now='2026-11-26T07:53:00',new_look=True,width=1280,height=800,routes=ROUTES,
          ctx_opts={'locale':'en-US'})
MOCK="window.__scanResp="+json.dumps(ACAP)+""";window.__scanErr=null;
window.vAI=async()=>{if(window.__scanErr)throw window.__scanErr;return JSON.stringify(window.__scanResp)};"""

def open_tony(pg, extra_init=None):
    init="window.__SHARE_DOC="+json.dumps(SNAP)+";"+(extra_init or '')
    pg.add_init_script(init)
    baseu='/'.join(pg.url.split('/')[:3])
    pg.goto(baseu+'/v.html?t='+TOK)
    pg.wait_for_timeout(900)

def scan_file(pg):
    pg.evaluate("""async()=>{
      const b=await (await fetch('%s')).blob();
      await window.vScanFile(new File([b],'recibo.jpg',{type:'image/jpeg'}));
    }"""%IMG)
    pg.wait_for_timeout(400)

GENAI=("""Object.assign(new Error('AI: Error fetching from https://firebasevertexai.googleapis.com/v1beta/projects/finanzas-joe-12ce2b/models/gemini-3.5-flash:generateContent: [400 Bad Request] Firebase AI Logic genai config not found. Learn more: https://firebase.google.com/docs/ai-logic/error-codes#error-genai-config-not-found (AI/fetch-error)'),{code:'fetch-error'})""")

# index version
with app(ROOT,new_look=True,now='2026-11-26T07:53:00') as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v158','CODE_V v158: '+str(E('CODE_V')))
    check('v158.js' in pg.content(),'index carga v158.js')

# Chrome iOS + English navigator: page default Spanish, genai-config in Spanish
with app(ROOT,**CHROME_IOS,init="localStorage.setItem('finanzas-lang','en');") as pg:
    open_tony(pg, MOCK)
    E=pg.evaluate
    check(E("!!document.querySelector('script[src=\"v158.js\"]')") or 'v158.js' in pg.content(),'v.html carga v158.js')
    check(E("typeof _v158==='object' && window._v158On"),'v158 instalado')
    check(E("navigator.language||''").lower().startswith('en'),'navigator en inglés (Chrome iOS): '+str(E('navigator.language')))
    check(E("_v158.isES()") is True,'página en español aunque el navegador esté en inglés')
    # classifier unit
    t=E("()=>_v158.vScanErr("+GENAI+")")
    check('config de Gemini' in t or 'no está configurado' in t,'genai en español: '+t)
    check("isn't available right now" not in t.lower(),'ya no el genérico inglés: '+t)
    check('fetch-error' not in t or 'genai-config' in t,'código útil genai-config: '+t)
    check('400' in t or 'genai-config' in t,'menciona 400 o genai-config: '+t)
    # 429 / appcheck / 404 / network still distinct and Spanish
    q=E("()=>_v158.vScanErr(Object.assign(new Error('[429] Resource exhausted'),{code:'fetch-error'}))")
    qlow=q.lower();check(('muchas solicitudes' in q or 'límite de solicitudes' in qlow or 'limite de solicitudes' in qlow or 'cuota' in qlow or 'por minuto' in qlow) and "isn't available" not in qlow,'cuota ES: '+q)
    ac=E("()=>_v158.vScanErr(Object.assign(new Error('App Check token is invalid [403]'),{code:'fetch-error'}))")
    check('App Check' in ac and 'no pude leer' not in ac.lower(),'App Check ES: '+ac)
    mo=E("()=>_v158.vScanErr(Object.assign(new Error('Error fetching from x: [404 Not Found] model was not found'),{code:'fetch-error'}))")
    check('modelo' in mo.lower() and '404' in mo,'404 modelo: '+mo)
    nw=E("()=>_v158.vScanErr(Object.assign(new Error('Failed to fetch'),{code:'error'}))")
    check('conectar' in nw.lower() or 'conexión' in nw.lower(),'red ES: '+nw)
    # UI
    pg.click('#vreg');pg.wait_for_timeout(80)
    # form chrome should still be Spanish (v-lang default)
    form=pg.inner_text('#regform')
    check('Escanear recibo' in form or 'Registrar' in form,'formulario en español: '+form[:200])
    E("()=>{window.__scanErr="+GENAI+"}")
    scan_file(pg)
    ui=pg.inner_text('#rerr')
    check('config de Gemini' in ui or 'no está configurado' in ui,'UI genai ES: '+ui)
    check("isn't available right now" not in ui.lower(),'UI no es el inglés de v157: '+ui)
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v158-tony-scan-error-genai-phone.png'))

# If the user switched the share page to English, errors follow that, not the phone OS
with app(ROOT,**CHROME_IOS,init="localStorage.setItem('v-lang','en');") as pg:
    open_tony(pg, MOCK)
    t=pg.evaluate("()=>_v158.vScanErr("+GENAI+")")
    check('Gemini config is missing' in t or 'not set up in Firebase' in t,'v-lang en: '+t)
    check(_v_is:='config de Gemini' not in t or not pg.evaluate("_v158.isES()"),'no mezcla español si eligió inglés')

# success path still fills the form
with app(ROOT,**CHROME_IOS) as pg:
    open_tony(pg, MOCK)
    pg.click('#vreg');pg.wait_for_timeout(80)
    scan_file(pg)
    check(pg.input_value('#rstore')=='Acapulco Tropical' and pg.locator('.itr').count()==2,'sigue rellenando el formulario')
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v158-tony-scan-ok-phone.png'))

with app(ROOT,**DESK) as pg:
    open_tony(pg, MOCK)
    pg.click('#vreg');pg.wait_for_timeout(80)
    E=pg.evaluate
    E("()=>{window.__scanErr="+GENAI+"}")
    scan_file(pg)
    ui=pg.inner_text('#rerr')
    check('config de Gemini' in ui or 'no está configurado' in ui,'desktop genai ES: '+ui)
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v158-tony-scan-error-genai-desktop.png'))

print('test_v158 OK',ok)
