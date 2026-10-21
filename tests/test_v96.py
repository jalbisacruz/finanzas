"""v96 (made-up data): resúmenes sin artículos; PDF único «Detalle de compras» con privacidad de v95."""
import os,sys,json,base64,subprocess,tempfile,copy,re
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
S=copy.deepcopy(FIX);S['cur']='2026-10'
S['months']['2026-10']={'income':[{'id':'i1','name':'Débito','amount':2950,'role':'debit'}],'cards':[{'id':'c1','name':'Visa Test','amount':64.40}],
 'bills':[{'id':'b1','name':'Hogar','amount':625,'fixed':True},{'id':'b2','name':'Transporte','amount':800,'fixed':True},{'id':'b3','name':'Comunicaciones','amount':101,'fixed':True},
  {'id':'b4','name':'Luz','amount':140,'fixed':False},{'id':'b5','name':'Food','amount':28.55,'tfood':28.55,'fixed':False,'cat':'🛒 Comida/Supermercado'}],
 'purchases':[{'id':'p1','store':'Publix','date':'2026-10-04','total':120,'mode':'fam','shares':{'Tony':60,'Carlos':30,'Yo':30},'method':'deb'},
  {'id':'p2','store':'Aldi','date':'2026-10-11','total':64.40,'mode':'fam','shares':{'Tony':32.2,'Carlos':16.1,'Yo':16.1},'method':'card:Visa Test'},
  {'id':'p3','store':'Walmart Licuadora','date':'2026-10-15','total':49.99,'mode':'manual','who':['Yo'],'shares':{'Yo':49.99},'method':'deb'},
  {'id':'p4','store':'CVS Carlos','date':'2026-10-18','total':18.75,'mode':'manual','who':['Carlos'],'shares':{'Carlos':18.75},'method':'deb'},
  {'id':'p5','store':'Publix T','date':'2026-10-29','total':84.20,'mode':'eq','who':['Yo','Tony','Carlos'],'shares':{'Tony':42.1,'Carlos':21.05,'Yo':21.05},'method':'','paidBy':'Tony'},
  {'id':'p6','store':'Walmart A','date':'2026-10-30','total':46.10,'mode':'manual','who':['Tony'],'shares':{'Tony':46.1,'Carlos':0,'Yo':0},'method':'','paidBy':'Arianna'},
  {'id':'p7','store':'Target','date':'2026-10-31','total':30,'mode':'eq','who':['Yo','Tony','Carlos'],'shares':{'Tony':15,'Carlos':7.5,'Yo':7.5},'method':'','paidBy':'Arianna'}],
 'personal':[],'events':[]}
def pdft(pg,kind):
    b=pg.evaluate("async k=>{const f=await makePDF(k,'2026-10');const a=new Uint8Array(await f.arrayBuffer());let s='';for(const x of a)s+=String.fromCharCode(x);return btoa(s)}",kind)
    p=tempfile.mktemp(suffix='.pdf');open(p,'wb').write(base64.b64decode(b));return subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout

WIN='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
IPH='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
ITEMS="()=>{const p=M().purchases.find(x=>x.id==='p1');p.list=[{a:20,n:'Shampoo Carlos',own:['Carlos']},{a:30,n:'Pasta Tony',own:['Tony']},{a:12,n:'Vino Joe y Tony',own:['Yo','Tony']}];p.tax=7;p.shares=computeShares(p,p.list);save()}"
tl=lambda s:[x.split() for x in s.splitlines() if 'Total del mes' in x][-1]
money=lambda xs:[x for x in xs if x.startswith('$')]
with app(ROOT,now='2026-10-31T20:00:00',state=S,init="localStorage.setItem('finanzas-sync-uid','u1');",routes=R,ctx_opts={'user_agent':WIN}) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200);E(ITEMS)
    D={w:E("w=>r3Data('2026-10',w)",w) for w in ['Yo','Tony','Carlos']}
    T3={k:pdft(pg,k) for k in ['mes','tony','carlos','det']}
    # 1) summaries: one line per purchase, no items / tax / rest lines
    for k in ['mes','tony','carlos']:
        cp=T3[k].split('Compras del mes')[1]
        for w in ['Shampoo','Pasta Tony','Vino Joe','Impuesto','proporcional','Resto de la compra']:check(w not in cp,'%s summary has no item line %s'%(k,w))
        check(all('it' not in p for p in D['Yo']['purchases']),'no it in data')
    # 2) detail lists every purchase with its items, newest first, Arianna by name
    dt=T3['det'];rows=D['Yo']['det']['rows']
    check([r['s'] for r in rows]==[p['s'] for p in D['Yo']['purchases']] and len(rows)==7,'every purchase in detail')
    pos=[dt.find(r['s']+' ') if r['s']!='Publix' else dt.find('Publix ',dt.find('Aldi')) for r in rows];check(all(x>=0 for x in pos) and pos==sorted(pos),'newest first in PDF %s'%pos)
    for w in ['Shampoo Carlos','Pasta Tony','Vino Joe y Tony','Resto de la compra','Impuesto','Toda la compra','Pagó Arianna','Pagó Tony','Pagó Joe','Total de la compra','Walmart Licuadora']:check(w in dt,'detail has '+w)
    sh=[x for x in dt.splitlines() if 'Shampoo Carlos' in x][0];check(sh.split()[-4:]==['$20.00','-','-','$20.00'],sh)
    vi=[x for x in dt.splitlines() if 'Vino Joe y Tony' in x][0];check(vi.split()[-4:]==['$12.00','$6.00','$6.00','-'],vi)
    # 3) each purchase: lines add up to the purchase and to each share; month totals = summaries
    for r in rows:
        check(abs(sum(l['a'] for l in r['lines'])-r['t'])<0.005,'lines = total %s'%r['s'])
        for x in ['Yo','Tony','Carlos']:check(abs(sum(l['sh'][x] for l in r['lines'])-r['sh'][x])<0.005,'%s %s lines = share'%(r['s'],x))
    for k in ['mes','tony','carlos']:check(money(tl(dt))==money(tl(T3[k])),'detail month total = %s %s %s'%(k,tl(dt),tl(T3[k])))
    check(money(tl(dt))==['$%.2f'%D['Yo']['totAll']]+['$%.2f'%D['Yo']['tot'][x] for x in ['Yo','Tony','Carlos']],tl(dt))
    # 5) button opens directly (desktop: new tab with application/pdf)
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(200)
    bt=pg.locator('#rescard .rlinks button');check([bt.nth(i).inner_text() for i in range(bt.count())]==['📄 Mi resumen','📄 Tony','📄 Carlos','🧾 Detalle de compras'],'4 buttons')
    E("()=>{window.__urls=[];window.open=()=>({closed:false,document:{body:{}},location:{set href(v){__urls.push(v)}},close(){}})}")
    pg.click('#pdfdet');pg.wait_for_function("__urls.length>0",timeout=20000)
    r=E("async u=>{const b=await (await fetch(u)).blob();return b.type}",E("__urls[0]"));check(r=='application/pdf','detail opens pdf in new tab')
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(100);pg.check('#lnkon-Tony');pg.check('#lnkon-Carlos');pg.wait_for_timeout(600)
    L=E("S.links");docs=E("window.__fs.docs");DT,DC=docs['shares/'+L['Tony']['t']],docs['shares/'+L['Carlos']['t']]
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
# 4) privacy on links
for who,doc,mine,others in [('tony',DT,'Walmart A',['Walmart Licuadora','CVS Carlos']),('carlos',DC,'CVS Carlos',['Walmart Licuadora','Walmart A'])]:
  with app(ROOT,routes=R,now='2026-10-31T20:00:00',init="window.__SHARE_DOC=%s;"%json.dumps({**doc,'updatedAt':1761940000000}),width=390,height=844) as pg:
    pg.goto('/'.join(pg.url.split('/')[:3])+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA');pg.wait_for_timeout(500)
    check(pg.locator('#vpdet').count()==1 and pg.locator('#vdl').count()==1,'link has PDF + Detalle buttons')
    with pg.expect_download(timeout=15000) as dd: pg.click('#vpdet')
    p=tempfile.mktemp(suffix='.pdf');dd.value.save_as(p);lt=subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout
    check(mine in lt and all(o not in lt for o in others) and 'Otras compras personales (2)' in lt,'%s privacy %s'%(who,lt[:300]))
    check('Shampoo Carlos' in lt and 'Pasta Tony' in lt,'shared purchase items visible')
    check(money(tl(lt))==money(tl(T3['det'])),'link detail month total %s'%tl(lt))
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
# iPhone: in-app viewer
with app(ROOT,now='2026-10-31T20:00:00',state=S,expand=False,browser='webkit',width=390,height=844,ctx_opts={'user_agent':IPH,'is_mobile':True,'has_touch':True},init="Object.defineProperty(navigator,'standalone',{get:()=>true});") as pg:
    E=pg.evaluate;pops=[];pg.on('popup',lambda p:pops.append(1));E("()=>{tab='rep';render()}");pg.wait_for_timeout(200)
    pg.click('#pdfdet');pg.wait_for_selector('#pdfview[data-ok]',timeout=20000);check(pg.locator('#pvshare').count()==1 and not pops,'iOS detail viewer')
print('test_v96 OK',ok)
