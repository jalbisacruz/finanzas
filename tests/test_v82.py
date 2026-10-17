"""v82: página de enlace (v.html?t=…) en la pantalla de inicio del iPhone: ícono propio, metas standalone, título con el nombre,
token conservado, pista solo en iOS (made-up data): python tests/test_v82.py [--shots]"""
import json,os,sys,struct
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
IOS="Object.defineProperty(navigator,'userAgent',{get:()=>'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});"
TOK='TokTokTokTokTokTokTok1'
def png(p):
    b=open(os.path.join(ROOT,p),'rb').read(24);check(b[:8]==b'\x89PNG\r\n\x1a\n',p);return struct.unpack('>II',b[16:24])
for p,s in [('v-icon-180.png',180),('v-icon-192.png',192),('v-icon-512.png',512),('v-icon-maskable-512.png',512),('v-favicon-32.png',32)]:check(png(p)==(s,s),'%s is %dx%d'%(p,s,s))
check(open(os.path.join(ROOT,'v-icon-512.png'),'rb').read()!=open(os.path.join(ROOT,'icon-512.png'),'rb').read(),'distinct from Joe\'s app icon')
man=json.load(open(os.path.join(ROOT,'manifest.json')));check(man['start_url']=='./index.html' and man['icons'][0]['src']=='icon-192.png','Joe\'s manifest unchanged')
sw=open(os.path.join(ROOT,'sw.js')).read();check("'./v.html'" not in sw and "'./v.js'" not in sw,'link page not precached by the main service worker')
ih=open(os.path.join(ROOT,'index.html')).read();check('href="manifest.json"' in ih and 'v-icon' not in ih,'main app head unchanged')
with app(ROOT,width=390,height=844) as pg:
    docs={w:{**pg.evaluate(f"snapFor('{w}')"),'updatedAt':'2026-10-13T10:00:00'} for w in ['Tony','Carlos']}
def page(doc,init='',path='v.html?t='+TOK):
    return app(ROOT,routes=R,init="window.__SHARE_DOC=%s;"%json.dumps(doc)+init,width=390,height=844)
for who in ['Tony','Carlos']:
  with page(docs[who],IOS) as pg:
    base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t='+TOK);pg.wait_for_timeout(500);E=pg.evaluate
    hd=E("""(()=>{const q=s=>document.querySelector(s);return {icon:q('link[rel=apple-touch-icon]')?.getAttribute('href'),cap:q('meta[name=apple-mobile-web-app-capable]')?.content,
      mcap:q('meta[name=mobile-web-app-capable]')?.content,title:q('meta[name=apple-mobile-web-app-title]')?.content,man:!!q('link[rel=manifest]')}})()""")
    check(hd['icon']=='v-icon-180.png' and hd['cap']=='yes' and hd['mcap']=='yes' and not hd['man'],'iOS home-screen tags, no manifest (keeps ?t=) %s'%hd)
    check(hd['title']=='Cuentas '+who,'home-screen title with the name: %s'%hd['title'])
    check(E("fetch('v-icon-180.png').then(r=>r.status)")==200,'icon served')
    check(pg.locator('#a2hs').is_visible(),'iOS hint shown')
    h=pg.inner_text('#a2hs');check('Compartir' in h and 'Agregar a pantalla de inicio' in h and pg.locator('#a2hs svg').count()==1,'hint text + share icon '+h)
    check(E("location.search")=='?t='+TOK,'token in the URL that iOS saves')
    if SH and who=='Tony':pg.screenshot(path=os.path.join(ROOT,'shots','147-pista-iphone.png'))
    bb=pg.locator('#a2hs').bounding_box();check(bb['y']+bb['height']<=844 and bb['width']<=390,'fits iPhone screen')
    pg.click('#a2hsx');check(pg.locator('#a2hs').count()==0,'dismiss')
    pg.reload();pg.wait_for_timeout(500);check(pg.locator('#a2hs').count()==0,'stays dismissed')
    # abierto desde el ícono sin ?t= (por si acaso): vuelve al mismo token
    pg.goto(base+'/v.html');pg.wait_for_timeout(500);check(E("location.search")=='?t='+TOK and pg.locator("#vsum").count()==1,'token restored when opened without it')
    check(not [e for e in pg.errors if 'DIALOG' not in e],pg.errors)
# a la tercera visita sin cerrarla deja de salir
with page(docs['Tony'],IOS) as pg:
    base='/'.join(pg.url.split('/')[:3])
    for i in range(4):
        pg.goto(base+'/v.html?t='+TOK);pg.wait_for_timeout(300);n=pg.locator('#a2hs').count()
        check(n==(1 if i<3 else 0),'visit %d hint=%d'%(i+1,n))
# ya abierta desde la pantalla de inicio: no sale
with page(docs['Tony'],IOS+"Object.defineProperty(navigator,'standalone',{get:()=>true});") as pg:
    base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t='+TOK);pg.wait_for_timeout(500)
    check(pg.locator('#a2hs').count()==0,'no hint when launched standalone')
# no iOS: no sale
with page(docs['Tony']) as pg:
    base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t='+TOK);pg.wait_for_timeout(500)
    check(pg.locator('#a2hs').count()==0,'no hint on non-iOS')
# inglés
de={**docs['Carlos'],'lang':'en'}
with page(de,IOS) as pg:
    base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t='+TOK);pg.wait_for_timeout(500)
    h=pg.inner_text('#a2hs');check('Share' in h and 'Add to Home Screen' in h,'EN hint '+h)
    check(pg.evaluate("document.querySelector('meta[name=apple-mobile-web-app-title]').content")=='Carlos bills','EN title')
    if SH:pg.screenshot(path=os.path.join(ROOT,'shots','147-pista-iphone-en.png'))
print('test_v82 OK',ok)
