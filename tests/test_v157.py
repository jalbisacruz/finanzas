"""v157 (DATOS DE EJEMPLO): el escaneo en la página de Tony espera el token
de App Check y muestra el error real (límite de Google vs no se pudo leer).
python tests/test_v157.py
"""
import os,json,re
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
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSIAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
# typo fix? the original tests use FcSJ not FcSI. Keep the known-good string:
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
ACAP={"isReceipt":True,"store":"Acapulco Tropical","date":"2026-11-24","total":47.00,"tax":0,
      "items":[{"name":"Calabaza trozos","amount":3.09,"category":"🛒 Comida/Supermercado"},
               {"name":"Green onion scallion","amount":1.50,"category":"🛒 Comida/Supermercado"},
               {"name":"Baking hen","amount":21.12,"category":"🛒 Comida/Supermercado"},
               {"name":"Baking hen","amount":21.29,"category":"🛒 Comida/Supermercado"}]}
MOCK="window.__scanResp="+json.dumps(ACAP)+""";window.__scanErr=null;
window.vAI=async()=>{if(window.__scanErr)throw window.__scanErr;return JSON.stringify(window.__scanResp)};"""
NOW='2026-11-25T21:00:00'
PHONE=dict(now=NOW,new_look=True,width=390,height=900,routes=ROUTES,ctx_opts={'locale':'es-US'})
DESK=dict(now=NOW,new_look=True,width=1280,height=800,routes=ROUTES,ctx_opts={'locale':'es-US'})

def open_tony(pg, extra_init=None):
    doc=json.dumps(SNAP)
    init="window.__SHARE_DOC="+doc+";"+(extra_init or '')
    # add_init_script after first goto in app(); then navigate to v.html
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

# ---------- index: versión y tags ----------
with app(ROOT,new_look=True,now=NOW) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v157','CODE_V v157: '+str(E('CODE_V')))
    src=pg.content()
    check('v157.js' in src,'index carga v157.js')

# ---------- token de App Check ANTES de Gemini (sin mock de vAI) ----------
with app(ROOT,**PHONE) as pg:
    open_tony(pg)
    E=pg.evaluate
    check(E("!!document.querySelector('script[src=\"v157.js\"]')") or 'v157.js' in pg.content(),'v.html carga v157.js')
    check(E("typeof _v157==='object' && typeof vScanFile==='function' && window._v157On"),'v157 instalado')
    pg.click('#vreg');pg.wait_for_timeout(80)
    E("()=>{window.__acLog=[];window.__acTokenCalls=0;window.__aiCalls=0;window.__aiText="+json.dumps(json.dumps(ACAP))+"}")
    scan_file(pg)
    log=E("window.__acLog||[]")
    calls=E("[window.__acTokenCalls,window.__aiCalls,document.getElementById('rstore')&&document.getElementById('rstore').value]")
    check((log or []).count('ai')>=1,'Gemini llegó a llamarse: '+str(log)+' '+str(calls))
    check('token' in (log or []) and (log or []).index('token')<(log or []).index('ai'),
          'App Check token antes de Gemini: '+str(log))
    check(pg.input_value('#rstore')=='Acapulco Tropical' and pg.input_value('#rtot')=='47' and pg.locator('.itr').count()==4,
          'recibo rellenado vía AI falsa: '+pg.input_value('#rstore')+' '+pg.input_value('#rtot'))
    check(pg.input_value('#rdate')=='2026-11-24','fecha del recibo 11/24: '+pg.input_value('#rdate'))
    check(pg.locator('#rdatehint').count()==0,'con fecha no se muestra el aviso de hoy')

# ---------- fecha faltante: hoy, editable, aviso ----------
with app(ROOT,**PHONE) as pg:
    open_tony(pg, MOCK)
    E=pg.evaluate
    pg.click('#vreg');pg.wait_for_timeout(80)
    E("()=>{window.__scanResp=Object.assign({},window.__scanResp,{date:null})}")
    scan_file(pg)
    check(pg.input_value('#rstore')=='Acapulco Tropical' and pg.input_value('#rtot')=='47','prefill sin fecha')
    check(pg.input_value('#rdate')=='2026-11-25','fecha por defecto hoy (25 nov): '+pg.input_value('#rdate'))
    check(E("REG.dateGuess") is True,'dateGuess marcado')
    check(pg.locator('#rdatehint').count()==1 and 'hoy' in pg.inner_text('#rdatehint').lower(),
          'aviso de fecha: '+pg.inner_text('#rdatehint'))
    ro=E("()=>{const d=document.getElementById('rdate');return {ro:d.readOnly,dis:d.disabled,type:d.type}}")
    check(ro['type']=='date' and not ro['ro'] and not ro['dis'],'fecha editable: '+str(ro))
    pg.fill('#rdate','2026-11-24')
    check(pg.input_value('#rdate')=='2026-11-24','se puede cambiar la fecha')
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v157-tony-scan-sin-fecha-phone.png'))

# ---------- recibo con fecha (foto retocada): formulario lleno ----------
with app(ROOT,**PHONE) as pg:
    open_tony(pg, MOCK)
    pg.click('#vreg');pg.wait_for_timeout(80)
    scan_file(pg)
    check(pg.input_value('#rstore')=='Acapulco Tropical','tienda')
    check(pg.input_value('#rdate')=='2026-11-24','fecha 24 nov')
    check(pg.input_value('#rtot')=='47' or pg.input_value('#rtot')=='47.00','total 47')
    check(pg.locator('.itr').count()==4,'4 ítems')
    names=pg.evaluate("()=>REG.items.map(x=>x.n)")
    check(any('Calabaza' in n for n in names) and names.count('Baking hen')==2,'nombres de ítems: '+str(names))
    body=pg.inner_text('#regform')
    check('Leído del recibo' in body or 'leído' in body.lower(),'aviso de revisión')
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v157-tony-scan-ok-phone.png'))

with app(ROOT,**DESK) as pg:
    open_tony(pg, MOCK)
    pg.click('#vreg');pg.wait_for_timeout(80)
    scan_file(pg)
    check(pg.input_value('#rstore')=='Acapulco Tropical' and pg.locator('.itr').count()==4,'desktop prefill')
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v157-tony-scan-ok-desktop.png'))

# ---------- mensajes de error: no todo es «no pude leer» ----------
with app(ROOT,**PHONE) as pg:
    open_tony(pg, MOCK)
    E=pg.evaluate
    # unit: classifier
    def msg(js):
        return E("()=>_v157.vScanErr("+js+")")
    q=msg("Object.assign(new Error('[429] Resource exhausted'),{code:'AI/fetch-error'})")
    qlow=q.lower();check('muchas solicitudes' in q or 'límite de solicitudes' in qlow or 'limite de solicitudes' in qlow or 'cuota' in qlow or 'por minuto' in qlow,'cuota Google: '+q)
    ac=msg("Object.assign(new Error('App Check token is invalid [403]'),{code:'AI/app-check'})")
    check('App Check' in ac and 'no pude leer' not in ac.lower(),'App Check: '+ac)
    au=msg("Object.assign(new Error('401 unauthenticated'),{code:'unauthenticated'})")
    check('no pude leer el recibo. llénalo a mano' not in au.lower() and ('disponible' in au.lower() or 'sesión' in au.lower() or 'anótalo' in au.lower()),
          'auth distinto del genérico: '+au)
    nr=msg("new Error('notreceipt')")
    check('no parece un recibo' in nr.lower(),'no es recibo: '+nr)
    pr=msg("new Error('parse')")
    check('no pude leer' in pr.lower() and 'buena luz' in pr.lower(),'parse: '+pr)
    # UI: 429 y App Check en #rerr
    pg.click('#vreg');pg.wait_for_timeout(80)
    E("()=>{window.__scanErr=Object.assign(new Error('[429] Resource exhausted'),{code:'AI/fetch-error'})}")
    scan_file(pg)
    t=pg.inner_text('#rerr')
    tlow=t.lower();check('muchas solicitudes' in t or 'límite de solicitudes' in tlow or 'limite de solicitudes' in tlow or 'cuota' in tlow or 'por minuto' in tlow,'UI cuota: '+t)
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v157-tony-scan-error-cuota-phone.png'))
    E("()=>{window.__scanErr=Object.assign(new Error('Firebase App Check rejected the request [403]'),{code:'AI/app-check'})}")
    scan_file(pg)
    t=pg.inner_text('#rerr')
    check('App Check' in t and 'Llénalo a mano' not in t,'UI App Check, no el genérico viejo: '+t)
    mark(pg,'regform');pg.wait_for_timeout(80)
    pg.locator('#regform').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v157-tony-scan-error-appcheck-phone.png'))

print('test_v157 OK',ok)
