"""v63: real sync.js scan path with fake Firebase (retry, warm-up, error classification)"""
import os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);FAKE=open(os.path.join(HERE,'fakefb.js')).read();ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
SCAN="async()=>{await scanFile(new File([await (await fetch('%s')).blob()],'r.png',{type:'image/png'}))}"%IMG
with app(ROOT,routes={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}) as pg:
    E=pg.evaluate;pg.wait_for_timeout(2500)
    check(E("window.__ackey")=='6LczjvEtAAAAAEaAHmwLEj2DUiWYY--kne8BH3ei','app check initialized')
    check(E("typeof fbScan")=='function' and E("fbUser()"),'signed in')
    # first call: transient fetch error (cold start) -> retried automatically, succeeds
    E("()=>{window.__aiCalls=0;window.__aiFail=[{c:'AI/fetch-error',m:'Failed to fetch'}]}");E(SCAN);pg.wait_for_timeout(1500)
    check(E("window.__aiCalls")==2 and E("D&&D.store")=='Publix' and pg.locator('#scanerr').count()==0,'retry then prefill');E("dlg().close()")
    # persistent fetch error while online -> NOT "Sin conexión"; shows code
    E("()=>{window.__aiCalls=0;window.__aiFail=[1,2,3].map(()=>({c:'AI/fetch-error',m:'Failed to fetch'}))}");E(SCAN);pg.wait_for_timeout(3500)
    t=pg.inner_text('#scanerr');check(E("window.__aiCalls")==3 and 'Sin conexión' not in t and '(fetch-error)' in t,'online fetch error %s'%t);E("dlg().close()")
    # non-transient (400) -> no retry, code shown
    E("()=>{window.__aiCalls=0;window.__aiFail=[{c:'AI/fetch-error',m:'[400] API key not valid'}]}")
    E(SCAN);pg.wait_for_timeout(500)
    t=pg.inner_text('#scanerr');check(E("window.__aiCalls")==1 and '(fetch-error)' in t,'no retry %s'%t);E("dlg().close()")
    # 429 -> friendly quota message
    E("()=>{window.__aiFail=[{c:'AI/fetch-error',m:'[429] Resource exhausted'}]}");E(SCAN);pg.wait_for_timeout(500)
    check('muchas solicitudes' in pg.inner_text('#scanerr'),'quota');E("dlg().close()")
    # really offline -> Sin conexión
    pg.context.set_offline(True);E("()=>{scanReceipt()}");pg.wait_for_timeout(200)
    check('Sin conexión' in pg.inner_text('#scanerr'),'offline');pg.context.set_offline(False)
print('test_scan_retry OK',ok)
