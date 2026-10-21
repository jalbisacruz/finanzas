"""v91 (made-up data): Compartir solo en iPhone/iPad. Windows Chrome (navegador y PWA instalada) descarga aunque navigator.share/canShare existan.
iPhone (WebKit, standalone): Ver PDF abre el visor dentro de la app; Cerrar vuelve; Compartir llama a share. Página del enlace igual."""
import os,sys,json
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
WIN='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0'
IPH='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
SHARE="window.__share=[];navigator.canShare=()=>true;navigator.share=async o=>{window.__share.push({n:o.files&&o.files[0]&&o.files[0].name,t:o.files&&o.files[0]&&o.files[0].type})};"
SA="(()=>{const mm=window.matchMedia.bind(window);window.matchMedia=q=>/display-mode:\\s*standalone/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:mm(q)})();"
def desktop(standalone):
    init=SHARE+(SA if standalone else '')
    with app(ROOT,now='2026-10-17T17:45:00',expand=False,ctx_opts={'user_agent':WIN,'accept_downloads':True},init=init) as pg:
        E=pg.evaluate;dls=[];pops=[]
        pg.on('download',lambda d:dls.append(d.suggested_filename));pg.on('popup',lambda p:pops.append(p.url))
        tag='PWA' if standalone else 'browser'
        check(E("matchMedia('(display-mode: standalone)').matches")==standalone and E("typeof navigator.share==='function'&&navigator.canShare({files:[new File(['x'],'a.pdf')]})"),'%s: share APIs present'%tag)
        check(E("NO_DL()")==False and E("PV_IOS")==False,'%s: not iOS'%tag)
        E("()=>{tab='rep';render()}");pg.wait_for_timeout(200)
        E("pdfMes()");pg.wait_for_timeout(2500)
        check(any(x.endswith('.pdf') for x in dls) and E("__share.length")==0 and pg.locator('#pdfview').count()==0,'%s: Ver PDF downloads %s'%(tag,dls))
        n=len(dls);E("pdfDl('mes')");pg.wait_for_timeout(2000);check(len(dls)==n+1 and dls[-1].endswith('.pdf'),'%s: Descargar PDF downloads'%tag)
        E("pdfDl('tony',S.cur)");pg.wait_for_timeout(2000);E("pdfDl('carlos',S.cur)");pg.wait_for_timeout(2000);check(len(dls)==n+3,'%s: Tony/Carlos PDFs download'%tag)
        E("exp()");pg.wait_for_timeout(500);check(dls[-1].endswith('.json') and dls[-1].startswith('finanzas-'),'%s: Exportar JSON downloads %s'%(tag,dls[-1]))
        # restaurar: la copia de seguridad se descarga (como antes)
        E("""()=>{window.fbUser=()=>true;window.fbRestore=async()=>{};window.confirm=()=>true;restoreBk('2026-10-16_09-00-00')}""");pg.wait_for_timeout(800)
        check(dls[-1].endswith('.json') and len(dls)==n+5,'%s: restore safety copy downloads'%tag)
        check(E("__share.length")==0 and pg.locator('#fileready').count()==0,'%s: share never used %s'%(tag,E("__share")))
        check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
desktop(False);desktop(True)
# ---------- iPhone, app de la pantalla de inicio ----------
with app(ROOT,now='2026-10-17T17:45:00',expand=False,browser='webkit',width=390,height=844,ctx_opts={'user_agent':IPH,'is_mobile':True,'has_touch':True},init=SHARE+"Object.defineProperty(navigator,'standalone',{get:()=>true});") as pg:
    E=pg.evaluate;nav=[];dls=[]
    pg.on('framenavigated',lambda f:f==pg.main_frame and nav.append(f.url));pg.on('download',lambda d:dls.append(d.suggested_filename));pg.on('popup',lambda p:nav.append('popup'))
    check(E("NO_DL()") and E("PV_IOS"),'iOS detected')
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(200)
    pg.locator('#pdfbtn').first.click();pg.wait_for_selector('#pdfview[data-ok]',timeout=20000)
    check(E("document.getElementById('pdfview').dataset.ok")=='1','rendered with pdf.js')
    pages=E("document.querySelectorAll('#pdfview canvas').length");check(pages>=1,'pages %d'%pages)
    ink=E("""(()=>{const c=document.querySelector('#pdfview canvas'),x=c.getContext('2d').getImageData(0,0,c.width,Math.min(c.height,400)).data;let n=0;for(let i=0;i<x.length;i+=16)if(x[i]<200)n++;return n})()""")
    check(ink>200,'PDF visible (dark pixels %d)'%ink)
    bx=pg.locator('#pdfview').bounding_box();check(bx['width']>=389 and bx['height']>=843,'full screen %s'%bx)
    check(pg.locator('#pvclose').inner_text()=='✕ Cerrar' and pg.locator('#pvshare').inner_text()=='⬆️ Compartir / Guardar','buttons')
    check(not E("__share.length") and not dls and not nav,'no share sheet / download / navigation on open')
    if SH:pg.wait_for_timeout(300);pg.screenshot(path=os.path.join(ROOT,'shots','v91-visor-iphone.png'))
    pg.click('#pvshare');pg.wait_for_timeout(200);s=E("__share");check(len(s)==1 and s[0]['n'].endswith('.pdf') and s[0]['t']=='application/pdf','Compartir calls share %s'%s)
    pg.click('#pvclose');pg.wait_for_timeout(100);check(pg.locator('#pdfview').count()==0 and E("tab")=='rep' and pg.locator('#pdfbtn').first.is_visible(),'Cerrar returns to the app')
    E("pdfDl('tony',S.cur)");pg.wait_for_selector('#pdfview[data-ok]',timeout=20000);check(pg.locator('#pdfview canvas').count()>=1,'other PDFs use the viewer too');E("pdfViewClose()")
    E("exp()");pg.wait_for_timeout(300);check(E("__share.at(-1).n").endswith('.json'),'Exportar JSON keeps Compartir on iOS')
    E("LANG='en';pdfMes()");pg.wait_for_selector('#pdfview[data-ok]',timeout=20000);check(pg.locator('#pvclose').inner_text()=='✕ Close','EN');E("pdfViewClose()")
    check(not dls and not nav,'never left the app %s %s'%(dls,nav))
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
# ---------- página del enlace (v.html) en iPhone ----------
FAKE=open(os.path.join(HERE,'fakefb.js')).read();R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
with app(ROOT,init="localStorage.setItem('finanzas-sync-uid','u1');",routes=R) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);E("()=>{tab='cfg';render()}");pg.wait_for_timeout(100);pg.check('#lnkon-Tony');pg.wait_for_timeout(600)
    DOC=E("window.__fs.docs['shares/'+S.links.Tony.t]")
for ios in (True,False):
  opts={'user_agent':IPH,'is_mobile':True,'has_touch':True} if ios else {'user_agent':WIN}
  with app(ROOT,routes=R,browser='webkit' if ios else 'chromium',init=SHARE+"window.__SHARE_DOC=%s;"%json.dumps(DOC)+("Object.defineProperty(navigator,'standalone',{get:()=>true});" if ios else SA),width=390,height=844,ctx_opts=opts) as pg:
    E=pg.evaluate;base=pg.url.split('/')[0]+'//'+pg.url.split('/')[2]+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA';pg.goto(base);pg.wait_for_timeout(700)
    nav=[];dls=[];pg.on('framenavigated',lambda f:f==pg.main_frame and nav.append(f.url));pg.on('download',lambda d:dls.append(d.suggested_filename))
    if ios:
        pg.click('#vdl');pg.wait_for_selector('#pdfview[data-ok]',timeout=20000)
        check(E("document.getElementById('pdfview').dataset.ok")=='1' and pg.locator('#pdfview canvas').count()>=1,'link page: viewer on iPhone')
        pg.click('#pvshare');pg.wait_for_timeout(200);check(E("__share.length")==1 and E("__share[0].n").endswith('.pdf'),'link page: Compartir')
        pg.click('#pvclose');pg.wait_for_timeout(100);check(pg.locator('#pdfview').count()==0 and pg.locator('#vsum').is_visible() and not nav and not dls,'link page: Cerrar returns, never navigates')
    else:
        with pg.expect_download(timeout=15000) as d: pg.click('#vdl')
        check(d.value.suggested_filename.endswith('.pdf') and E("__share.length")==0 and pg.locator('#pdfview').count()==0,'link page on Windows PWA: downloads')
    check(not [e for e in pg.errors if not e.startswith('DIALOG') and 'favicon' not in e],pg.errors)
print('test_v91 OK',ok)
