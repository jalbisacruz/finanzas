"""v73: Carlos netting, Tony<->Carlos accounts, others' purchases as Joe's expense (fake data): python tests/test_v73.py [--shots]"""
import json,os,sys,subprocess
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
P="{id:'%s',store:'%s',date:'%s',total:%s,mode:'fam',who:['Yo','Tony','Carlos'],method:'',paidBy:'%s',shares:{Tony:%s,Carlos:%s,Yo:%s}}"
with app(ROOT,routes=R,init="localStorage.setItem('finanzas-sync-uid','u1');") as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    c0=E("calc(M())");s0=E("spent(M())");deb0=E("debE(M()).amount")
    E("()=>{const m=M();m.purchases.push(%s,%s);syncAllTFood();save()}"%(P%('a1','Publix','2026-10-14',100,'Arianna',50,25,25),P%('c1','Costco','2026-10-15',80,'Carlos',40,20,20)))
    check(not E("M().bills.some(isLegacyTF)") and E("M().bills.filter(isComidaBill).length")==1 and E("comidaBill(M()).tfood")==25,'v74: share in the single Comida line')
    c=E("calc(M())")
    check(abs(c['carlos']-c0['carlos'])<1e-9 and c['joeCS']==20 and abs(c['carlosDue']-max(0,c0['carlosOwes']-20-c0['recv']))<1e-9,'netting %s'%c)
    check(abs(c['toTony']-c0['toTony']-25)<1e-9,'Arianna -> Tony bills +25')
    s1=E("spent(M())");check(abs(s1['total']-s0['total']-45)<1e-9 and E("debE(M()).amount")==deb0,'expense +45, debit untouched %s %s'%(s0['total'],s1['total']))
    # paying Tony's transfer does not add expense (transfers aren't categorized)
    E("()=>payDlg('tony',S.cur)");pg.wait_for_timeout(50);E("()=>{window.confirm=()=>true}");pg.click('#payok');pg.wait_for_timeout(100)
    s2=E("spent(M())");check(abs(s2['total']-s1['total'])<1e-9 and E("debE(M()).amount")<deb0,'transfer: no double count')
    x=E("tcOf(M())");check(x=={'from':'Tony','to':'Carlos','amount':15,'settled':False,'st':None},x)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(100);ow=pg.inner_text('#owecard');check('Tony le debe a Carlos' in ow and '$15.00' in ow and 'Le debes a Carlos' not in ow,ow)
    t=E("msgShort('carlos',S.cur)");check('− Mi parte de tus compras  −$20.00' in t,t)
    with pg.expect_download(timeout=20000) as d: E("()=>pdfDl('carlos',S.cur)")
    d.value.save_as('/tmp/v73c.pdf');tx=subprocess.run(['pdftotext','-layout','/tmp/v73c.pdf','-'],capture_output=True,text=True).stdout;check('Mi parte de tus compras' in tx,'carlos pdf')
    sc=E("snapFor('Carlos')");st=E("snapFor('Tony')");check(sc['months'][0]['joeShare']==20 and sc['months'][0]['tc']['from']=='Tony' and st['months'][0]['tc']['amount']==15,'snapshots')
    # net negative -> Le debes a Carlos
    E("()=>{M().purchases.push(%s);save();tab='ini';render()}"%(P%('c2','Costco','2026-10-16',2000,'Carlos',1000,500,500)))
    c=E("calc(M())");check(c['carlosDue']==0 and c['joeOwesCarlos']>0,'net negative %s'%c)
    ow=pg.inner_text('#owecard');check('Le debes a Carlos' in ow,ow)
    if '--shots' in sys.argv:pg.locator('#owecard').screenshot(path=os.path.join(ROOT,'shots','137-deudas-hoy.png'))
    t=E("msgShort('carlos',S.cur)");check('Te debo' in t,t)
    E("()=>{M().purchases=M().purchases.filter(p=>p.id!=='c2');save()}")
    # previous month unsettled -> notice on Hoy, manual settle
    E("()=>{const ks=keys(),pk=ks[ks.indexOf(S.cur)-1];S.months[pk].purchases.push(%s);save();tab='ini';render()}"%(P%('p1','Aldi','2026-09-20',40,'Tony',20,10,10)))
    check(pg.locator('#tcprev').count()==1 and '$10.00' in pg.inner_text('#tcprev') and 'Carlos le debe a Tony' in pg.inner_text('#tcprev'),'prev month notice')
    if '--shots' in sys.argv:pg.locator('#tcprev').screenshot(path=os.path.join(ROOT,'shots','137-recordatorio-hoy.png'))
    pg.click('#tcprevok');pg.wait_for_timeout(100);check(pg.locator('#tcprev').count()==0,'settled manually')
    SNT=E("snapFor('Tony')");SNC=E("snapFor('Carlos')")
    # settle confirmation from link inbox
    E("()=>{const m=M();delete m.tcSettled;INBOX=[{t:'TT',id:'s1',link:'Tony',kind:'settle',by:'Tony',month:S.cur,amount:15}];window.fbInboxDel=async()=>{};inboxList()}");pg.wait_for_timeout(50)
    check('dice que ya pagó' in pg.inner_text('#dlg'),'settle in review list')
    pg.click('#dlg button:has-text("Confirmar")');pg.wait_for_timeout(100);check(E("tcOf(M()).settled") and E("M().tcSettled.by")=='Tony','confirmed')
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
# link pages: debtor sees "Ya pagué"; reminder for previous month
SNT['months'][1]['tc']={'from':'Tony','to':'Carlos','amount':7,'settled':False}
for who,doc,debtor in [('tony',SNT,True),('carlos',SNC,False)]:
  doc={**doc,'updatedAt':1760600000000}
  with app(ROOT,routes=R,init="window.__SHARE_DOC=%s;"%json.dumps(doc)) as pg:
    base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t=TokTokTokTokTokTokTok1');pg.wait_for_timeout(500);E=pg.evaluate
    tx=pg.inner_text('main');check('Entre Tony y Carlos' in tx and '$15.00' in tx,tx[:400])
    check((pg.locator('#vtcpay').count()==1)==debtor,'button only for debtor')
    if debtor:
        check(pg.locator('#vrem').count()==1,'reminder banner')
        if '--shots' in sys.argv:pg.screenshot(path=os.path.join(ROOT,'shots','137-enlace-tony.png'),full_page=True)
        pg.click('#vtcpay');pg.wait_for_timeout(300);d=[v for k,v in E("window.__fs.docs").items() if '/inbox/' in k]
        check(d and d[0]=={'kind':'settle','by':'Tony','month':'2026-10','amount':15,'at':'__now__'} and 'Avisado' in pg.inner_text('main'),d)
    elif '--shots' in sys.argv:pg.screenshot(path=os.path.join(ROOT,'shots','137-enlace-carlos.png'),full_page=True)
    if not debtor: check('Parte de Joe en tus compras' in pg.inner_text('main'),'carlos netting row')
print('test_v73 OK',ok)
