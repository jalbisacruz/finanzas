"""v72: purchases sent from private links -> Joe reviews (fake Firebase, made-up data): python tests/test_inbox.py [--shots]"""
import re,json,os,sys,subprocess
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
TT,TC='TonyTokenAAAAAAAAAAAAA','CarlosTokenBBBBBBBBBBB'
CATS=[{'v':'🛒 Comida/Supermercado','l':'🛒 Comida/Supermercado'},{'v':'🏠 Hogar','l':'🏠 Hogar'}]
SNAP={'v':1,'who':'Tony','lang':'es','buyers':['Tony','Arianna'],'cats':CATS,'names':{'Yo':'Joe','Tony':'Tony','Carlos':'Carlos'},'from':'Joe Albisa Cruz','updatedAt':1760600000000,
 'months':[{'k':'2026-10','label':'Oct 2026','purchases':[],'joeOwes':0,'bills':[],'billsTotal':0,'share':0,'toTransfer':0,'paid':0,'pending':0}]}
VAI="window.vAI=async()=>JSON.stringify({isReceipt:true,store:'Sedanos',date:'2026-10-15',total:53.5,tax:3.5,items:[{name:'Detergente',amount:12,category:'🏠 Hogar'}]});"
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
inbox={}
# 1) public page: Arianna records a purchase by hand; scan prefill
with app(ROOT,routes=R,init="window.__SHARE_DOC=%s;%s"%(json.dumps(SNAP),VAI)) as pg:
    base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t='+TT);pg.wait_for_timeout(500);E=pg.evaluate
    pg.click('#vreg');pg.wait_for_timeout(50);check(pg.locator('#regform').count()==1 and 'Arianna' in pg.inner_text('#regform'),'form with buyers')
    pg.click('#regform button.chip:has-text("Arianna")');pg.fill('#rstore','Publix');pg.fill('#rdate','2026-10-14');pg.fill('#rtot','107');pg.fill('#rtax','7')
    pg.click('#radd');pg.locator('.itr input').nth(0).fill('Vitaminas');pg.locator('.itr input').nth(1).fill('40')
    pg.click('.itr button.chip:has-text("Joe")');pg.click('.itr button.chip:has-text("Tony")');pg.wait_for_timeout(30)
    if '--shots' in sys.argv:pg.screenshot(path=os.path.join(ROOT,'shots','136-registrar-compra.png'),full_page=True)
    pg.click('#rsend');pg.wait_for_timeout(300)
    check('Enviado' in pg.inner_text('#regok'),'sent message: '+pg.inner_text('main')[-200:])
    docs=E("window.__fs.docs");k=[x for x in docs if x.startswith('shares/%s/inbox/'%TT)];check(len(k)==1,docs)
    d=docs[k[0]];check(d['by']=='Arianna' and d['total']==107 and d['tax']==7 and d['items']==[{'n':'Vitaminas','a':40,'own':['Carlos'],'c':'🛒 Comida/Supermercado'}] and set(d)<= {'by','store','date','total','tax','items','at','scan'},d)
    inbox[k[0]]={**d,'at':1}
    # over-total blocked
    pg.click('#vreg');pg.fill('#rstore','X');pg.fill('#rtot','5');pg.fill('#rtax','9');pg.click('#rsend');check('superan' in pg.inner_text('#rerr'),'over blocked')
    # scan prefill (mocked AI)
    E("()=>{const o=HTMLInputElement.prototype.click;HTMLInputElement.prototype.click=function(){if(this.type==='file'){HTMLInputElement.prototype.click=o;fetch('%s').then(r=>r.blob()).then(b=>{Object.defineProperty(this,'files',{value:[new File([b],'r.png',{type:'image/png'})]});this.onchange()})}else o.call(this)}}"%IMG)
    pg.click('#vscan');pg.wait_for_timeout(500)
    check(pg.input_value('#rstore')=='Sedanos' and pg.input_value('#rtot')=='53.5' and pg.input_value('#rtax')=='3.5' and pg.locator('.itr').count()==1,'scan prefill')
    if '--shots' in sys.argv:pg.screenshot(path=os.path.join(ROOT,'shots','136-escanear-enlace.png'),full_page=True)
# 2) Joe's app reviews
inbox['shares/%s/inbox/c1'%TC]={'by':'Carlos','store':'Costco','date':'2026-10-15','total':80,'at':1}
inbox['shares/%s/inbox/r1'%TT]={'by':'Tony','store':'Spam','date':'2026-10-15','total':5,'at':1}
docs={**inbox,'shares/'+TT:{**SNAP,'owner':'u1'},'shares/'+TC:{**SNAP,'who':'Carlos','buyers':['Carlos'],'owner':'u1'}}
init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps(docs))
with app(ROOT,routes=R,init=init) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    E("()=>{S.links={Tony:{t:'%s',on:true},Carlos:{t:'%s',on:true}};save()}"%(TT,TC));E("()=>inboxLoad(true)");pg.wait_for_timeout(300)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#inbbtn').count()==1 and '(3)' in pg.inner_text('#inbbtn'),'badge')
    if '--shots' in sys.argv:pg.screenshot(path=os.path.join(ROOT,'shots','136-hoy-por-revisar.png'))
    c0=E("calc(M())");deb0=E("debE(M()).amount");n0=E("M().purchases.length")
    pg.click('#inbbtn');pg.wait_for_timeout(50);ia=[x for x in E("INBOX") if x['by']=='Arianna'][0]
    E("id=>inboxOpen(id)",ia['id']);pg.wait_for_timeout(80)
    check('Arianna' in pg.inner_text('#inbbox') and E("D.paidBy")=='Arianna' and E("D.tax")==7,'prefilled with buyer')
    check(E("D.shares")=={'Tony':32.1,'Carlos':58.85,'Yo':16.05},E("D.shares"))
    if '--shots' in sys.argv:pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','136-revisar-compra.png'))
    E("saveP()");pg.wait_for_timeout(200)
    p=E("M().purchases.find(x=>x.paidBy==='Arianna')");check(p and p['method']=='' and E("M().purchases.length")==n0+1,'saved, no method')
    check(E("debE(M()).amount")==deb0,'debit untouched')
    b=E("comidaBill(M())");check(b and b['amount']==16.05 and b['tfood']==16.05 and b['name']=='Food','Comida bill = Joe share %s'%b)  # v74: fixture has no Food line -> exactly one created
    check(not E("M().bills.some(isLegacyTF)") and E("M().bills.filter(isComidaBill).length")==1,'one Comida line, no separate line')
    c1=E("calc(M())");check(abs(c1['tony']-c0['tony'])<1e-9 and abs(c1['carlos']-c0['carlos'])<1e-9,'por cobrar unchanged')
    check(abs(c1['toTony']-c0['toTony']-16.05)<1e-9,'A transferirte +16.05 %s %s'%(c0['toTony'],c1['toTony']))
    check(('shares/%s/inbox/%s'%(TT,ia['id'])) not in E("window.__fs.docs"),'inbox doc deleted')
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(100);ow=pg.inner_text('#owecard');check('Carlos le debe a Tony' in ow and '$58.85' in ow,ow)
    # Carlos buys
    E("()=>inboxOpen('c1')");pg.wait_for_timeout(50);E("saveP()");pg.wait_for_timeout(100)
    c2=E("calc(M())");check(abs(c2['carlos']-c1['carlos'])<1e-9 and abs(c2['carlosOwes']-c1['carlosOwes']+20)<1e-9 and E("debE(M()).amount")==deb0,'carlos buy: v73 netting -20, debit untouched')
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(100);ow=pg.inner_text('#owecard');check('Carlos le debe a Tony' in ow and '$18.85' in ow,ow)  # v73: net between them
    if '--shots' in sys.argv:pg.locator('#owecard').screenshot(path=os.path.join(ROOT,'shots','136-deudas.png'))
    # reject
    E("()=>{window.confirm=()=>true;inboxOpen('r1')}");pg.wait_for_timeout(50);pg.click('#inbrej');pg.wait_for_timeout(100)
    check('shares/%s/inbox/r1'%TT not in E("window.__fs.docs") and not E("M().purchases.some(p=>p.store==='Spam')"),'rejected')
    check(E("INBOX.length")==0 and pg.locator('#inbbtn').count()==0,'inbox empty')
    # history + PDF + message
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(100);check('Compró: Arianna' in pg.inner_text('#v'),'history tag')
    with pg.expect_download(timeout=20000) as d: E("()=>pdfDl('tony','2026-10')")
    d.value.save_as('/tmp/v72t.pdf');tx=subprocess.run(['pdftotext','-layout','/tmp/v72t.pdf','-'],capture_output=True,text=True).stdout
    check('Compró: Arianna' in tx and 'Comida (incl. $16.05' in tx and 'Comida (compras de Tony/Arianna)' not in tx,'pdf: one Comida line with breakdown')
    t=E("msgShort('tony','2026-10')");check(re.search(r'Comida\s+\$16\.05',t) and 'compras de Tony/Arianna' not in t and 'Publix — $32.10' not in t,'tony message: Comida line, purchase not charged '+t)
    snap=E("snapFor('Tony')");check(snap['buyers']==['Tony','Arianna'] and any(p.get('by')=='Arianna' for p in snap['months'][0]['purchases']),'snapshot')
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
print('test_inbox OK',ok)
