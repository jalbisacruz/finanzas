"""v94 (made-up data): Resumen = 3 resúmenes (Mi resumen, Tony, Carlos). Computadora: cada uno abre application/pdf en pestaña nueva;
si se bloquea la ventana, visor de la app. iPhone: visor dentro de la app. Operaciones sigue enviando PDF de Tony/Carlos."""
import os,sys,subprocess,tempfile
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
WIN='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0'
IPH='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
def txt(b):
    p=tempfile.mktemp(suffix='.pdf');open(p,'wb').write(b);return subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout
with app(ROOT,now='2026-10-17T17:45:00',expand=False,ctx_opts={'user_agent':WIN,'accept_downloads':True}) as pg:
    E=pg.evaluate;dls=[];pg.on('download',lambda d:dls.append(d.suggested_filename))
    E("()=>{tab='rep';render();scrollTo(0,0)}");pg.wait_for_timeout(200)
    bt=pg.locator('#rescard .rlinks button');labels=[bt.nth(i).inner_text() for i in range(bt.count())]
    check(labels==['📄 Mi resumen','📄 Tony','📄 Carlos','🧾 Detalle de compras'],labels)  # v96: 4.º botón
    check(pg.locator('#pdfdl').count()==0 and pg.locator('#pdfsh').count()==0,'no Ver/Descargar/Compartir buttons')
    pg.locator('#rescard').screenshot(path=os.path.join(ROOT,'shots','v94-resumen.png'))
    # real click opens a new tab synchronously (popup not blocked)
    with pg.context.expect_page(timeout=20000) as pi: pg.click('#pdfbtn')
    check(pi.value is not None,'Mi resumen opens a new tab');pg.wait_for_timeout(1500);pi.value.close()
    # then capture what each tab receives (headless Chromium downloads PDFs instead of showing them)
    E("()=>{window.__urls=[];window.open=()=>({closed:false,document:{body:{}},location:{set href(v){__urls.push(v)}},close(){}})}")
    T={};import base64
    for bid,who in [('#pdfbtn','mes'),('#pdft','tony'),('#pdfc','carlos')]:
        n=E("__urls.length");pg.click(bid);pg.wait_for_function("__urls.length>%d"%n,timeout=20000);u=E("__urls.at(-1)")
        check(u.startswith('blob:'),'%s blob url'%who)
        r=pg.evaluate("async u=>{const r=await fetch(u);const b=await r.blob();const a=new Uint8Array(await b.arrayBuffer());let s='';for(const x of a)s+=String.fromCharCode(x);return [b.type,btoa(s)]}",u)
        b=base64.b64decode(r[1]);check(r[0]=='application/pdf' and b[:5]==b'%PDF-','%s opens application/pdf in new tab %s'%(who,r[0]));T[who]=txt(b)
    check('Lo que tengo' in T['mes'],'Mi resumen = monthly PDF')
    check('Lo que tengo' not in T['tony'] and 'Lo que tengo' not in T['carlos'] and T['tony']!=T['carlos'],'Tony/Carlos personal PDFs')
    check('Tony' in T['tony'][:400] and 'Carlos' in T['carlos'][:400],'right person')
    check(not dls and pg.locator('#pdfview').count()==0,'no download, no viewer %s'%dls)
    # popup blocked -> in-app viewer
    E("window.open=()=>null");pg.click('#pdft');pg.wait_for_selector('#pdfview[data-ok]',timeout=20000);check(True,'blocked popup falls back to viewer');E("pdfViewClose()")
    # Operaciones still sends Tony/Carlos PDFs
    for who in ('tony','carlos'):
        E(f"()=>shareMsg('{who}',S.cur)");pg.wait_for_timeout(100)
        with pg.expect_download(timeout=15000) as d: pg.click('#msgdl')
        check(d.value.suggested_filename.startswith(who.capitalize()+'-'),'Operaciones %s PDF %s'%(who,d.value.suggested_filename));E("dlg().close()")
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
with app(ROOT,now='2026-10-17T17:45:00',expand=False,browser='webkit',width=390,height=844,ctx_opts={'user_agent':IPH,'is_mobile':True,'has_touch':True},init="Object.defineProperty(navigator,'standalone',{get:()=>true});") as pg:
    E=pg.evaluate;pops=[];pg.on('popup',lambda p:pops.append(1))
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(200)
    for bid in ('#pdfbtn','#pdft','#pdfc'):
        pg.click(bid);pg.wait_for_selector('#pdfview[data-ok]',timeout=20000);check(pg.locator('#pvshare').count()==1,'iOS %s viewer with Compartir/Guardar'%bid);E("pdfViewClose()")
    check(not pops,'iOS no new tab')
print('test_v94 OK',ok)
