"""v62 receipt scanning with mocked Gemini (made-up receipt): python tests/test_scan.py [--shots]"""
import os,sys,json
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,msg):
    global ok
    if not c: raise AssertionError(msg)
    ok+=1
RESP={"isReceipt":True,"store":"Publix","date":"2026-10-12","total":23.54,"uncertain":[],
 "items":[{"name":"Leche","amount":4.29,"category":"🛒 Comida/Supermercado","confident":True},
          {"name":"Pan","amount":3.50,"category":"Comida/Supermercado","confident":True},
          {"name":"Shampoo","amount":7.99,"category":"🧴 Cuidado personal","confident":False},
          {"name":"Bombillos","amount":6.49,"category":"🏠 Hogar","confident":True}]}
MOCK="()=>{window.__resp=%s;window.__calls=[];window.fbUser=()=>true;window.fbScan=async(b,p,m)=>{window.__calls.push([b.length,p]);window.__mime=m;window.__b64=b.slice(0,10);if(window.__err)throw window.__err;return window.__resp}}"
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
with app(ROOT) as pg:
    E=pg.evaluate
    E(MOCK%json.dumps(json.dumps(RESP)))
    E("()=>{tab='ini';render()}");check(pg.locator('#scanh').count()==0 and E("typeof fabMenu")=='function','v78: no Hoy bar; scan lives in the + menu')
    E("()=>{tab='mov';render()}");check(pg.locator('[id^=scanc]').count()>=1,'next to new shared purchase')
    E("quick()");check(pg.locator('#scanq').count()==1,'in ➕ dialog');E("dlg().close()")
    n0=E("M().purchases.length")
    E(f"async()=>{{const b=await (await fetch('{IMG}')).blob();await scanFile(new File([b],'r.png',{{type:'image/png'}}))}}")
    pg.wait_for_timeout(200)
    check(E("window.__calls.length")==1 and E("window.__calls[0][0]")>10,'gemini called with jpeg')
    check(E("M().purchases.length")==n0,'nothing auto-saved')
    check(E("D.store")=='Publix' and E("D.date")=='2026-10-12' and E("D.total")==23.54,'prefilled header %s'%E("[D.store,D.date,D.total]"))
    check(pg.locator('#itbox .itrow').count()==4,'4 items')
    L=E("D.list");check(all(x['own']==['Yo','Tony','Carlos'] for x in L),'all three owners')
    cats=E("D.list.map(x=>itCat(x,D))");print(cats)
    check(cats[0]=='🛒 Comida/Supermercado' and cats[1]=='🛒 Comida/Supermercado' and cats[3]=='🏠 Hogar','categories %s'%cats)
    check(pg.locator('#scanwarn').count()==1 and ('ítem 3' in pg.inner_text('#scanwarn')),'uncertain item flagged')
    sh=E("D.shares");check(abs(sum(sh.values())-23.54)<1e-9 and sh['Tony']==11.77,'50/25/25 %s'%sh)
    if '--shots' in sys.argv:pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','128-escanear-recibo.png'))
    E("saveP()");p=E("M().purchases[0]");check('_scan' not in p and '_io' not in p and p['total']==23.54 and len(p['list'])==4,'saved clean %s'%p)
    # uncertain header, bad JSON, errors
    r2=dict(RESP,store="",date="??",total=None,uncertain=["total"]);E("r=>window.__resp=r",json.dumps(r2))
    E("async()=>{await scanFile(new File([await (await fetch('%s')).blob()],'r.png'))}"%IMG);pg.wait_for_timeout(100)
    w=pg.inner_text('#scanwarn');check('tienda' in w and 'fecha' in w and 'total' in w and E("D.total")==22.27,'flags %s %s'%(w,E("D.total")));E("dlg().close()")
    for resp,err,exp in [("not json",None,'No pude leer'),(json.dumps({"isReceipt":False}),None,'No parece un recibo'),
                         ("{}","Object.assign(new Error('429 quota exceeded'))",'muchas solicitudes'),("{}","Object.assign(new Error('x'),{code:'signin'})",'inicia sesión')]:
        E("r=>window.__resp=r",resp);E("window.__err="+(err or "null"))
        E("async()=>{await scanFile(new File([await (await fetch('%s')).blob()],'r.png'))}"%IMG);pg.wait_for_timeout(100)
        check(exp in pg.inner_text('#scanerr'),'%s -> %s'%(exp,pg.inner_text('#scanerr')))
    pg.click('text=Anotar a mano');check(E("D&&D.isNew&&!D._scan"),'manual fallback')
    E("()=>{dlg().close();window.fbUser=()=>false;scanReceipt()}");check('inicia sesión' in pg.inner_text('#scanerr'),'requires sign-in')
    check(E("M().purchases.length")==n0+1,'only the reviewed one saved')
    errs=[e for e in pg.errors if 'scan' not in e and 'DIALOG' not in e];check(not errs,errs)
print('test_scan OK',ok)
# v62b: PDFs, tall screenshots, size limit
with app(ROOT) as pg:
    E=pg.evaluate
    E(MOCK%json.dumps(json.dumps(RESP)))
    E("()=>new Promise(r=>{const s=document.createElement('script');s.src='vendor/jspdf.umd.min.js';s.onload=r;document.head.appendChild(s)})")
    acc=E("()=>{let a;const o=HTMLInputElement.prototype.click;HTMLInputElement.prototype.click=function(){a=[this.accept,this.hasAttribute('capture')]};scanReceipt();HTMLInputElement.prototype.click=o;return a}")
    check(acc==['image/*,application/pdf',False],'camera OR photos/files %s'%acc)
    E("async()=>{const d=new jspdf.jsPDF();d.text('SUNNY MARKET  TOTAL 23.54',10,10);d.addPage();d.text('page 2',10,10);await scanFile(new File([d.output('blob')],'r.pdf',{type:'application/pdf'}))}");pg.wait_for_timeout(150)
    c=E("window.__calls.at(-1)");check(E("window.__mime")=='application/pdf' and E("window.__b64").startswith('JVBERi'),'pdf sent as pdf');check(E("D.total")==23.54,'pdf prefilled');E("dlg().close()")
    E("async()=>{await scanFile(new File([new Uint8Array(16*1024*1024)],'big.pdf',{type:'application/pdf'}))}");pg.wait_for_timeout(100)
    check('15 MB' in pg.inner_text('#scanerr'),'pdf size');E("dlg().close()")
    dims=E("""async()=>{const c=document.createElement('canvas');c.width=1170;c.height=6000;c.getContext('2d').fillRect(0,0,10,10);const b=await new Promise(r=>c.toBlob(r,'image/png'));
      const s=await scanResize(new File([b],'s.png',{type:'image/png'}));const im=new Image();im.src='data:image/jpeg;base64,'+s;await im.decode();return [im.width,im.height]}""")
    check(dims[1]==3000,'tall screenshot cap 3000 %s'%dims)
    dims=E("""async()=>{const c=document.createElement('canvas');c.width=4000;c.height=3000;const b=await new Promise(r=>c.toBlob(r,'image/png'));
      const s=await scanResize(new File([b],'s.png',{type:'image/png'}));const im=new Image();im.src='data:image/jpeg;base64,'+s;await im.decode();return [im.width,im.height]}""")
    check(dims[0]==1600,'photo cap 1600 %s'%dims)
print('test_scan PDF OK',ok)
