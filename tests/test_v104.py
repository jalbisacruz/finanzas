"""v104 (made-up data): Tony/Carlos solo ven compras donde están involucrados."""
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
XF=[{'from':'Yo','to':'Tony','amount':1602.35},{'from':'Carlos','to':'Yo','amount':64.85},{'from':'Carlos','to':'Tony','amount':28.55}]
M10=S['months']['2026-10']['purchases']
M10.append({'id':'p8','store':'Costco JC','date':'2026-10-22','total':40,'mode':'manual','who':['Yo','Carlos'],'shares':{'Yo':20,'Carlos':20},'method':'deb'})
M10.append({'id':'p9','store':'Home Depot JT','date':'2026-10-23','total':60,'mode':'manual','who':['Yo','Tony'],'shares':{'Yo':30,'Tony':30},'method':'deb'})
SH=os.path.join(ROOT,'shots')
for lang in ['es','en']:
  with app(ROOT,now='2026-10-31T20:00:00',state=S,init="localStorage.setItem('finanzas-sync-uid','u1');"+("localStorage.setItem('finanzas-lang','en');" if lang=='en' else ''),routes=R) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    D={w:E("w=>r3Data('2026-10',w)",w) for w in ['Yo','Tony','Carlos']}
    st=lambda w:sorted(p['s'] for p in D[w]['purchases'])
    check(len(D['Yo']['purchases'])==9,'Joe sees all')
    check(st('Tony')==sorted(['Target','Walmart A','Publix T','Aldi','Publix','Home Depot JT']),st('Tony'))
    check(st('Carlos')==sorted(['Target','Publix T','CVS Carlos','Aldi','Publix','Costco JC']),st('Carlos'))
    for w in ['Tony','Carlos']:
      d=D[w];check(d['hid']['n']==0,'no hidden summary')
      check(d['transfers']==[x for x in D['Yo']['transfers'] if w in (x['from'],x['to'])] and d['transfers'],'only own transfers '+w)
      check(d['pairs']==[p for p in D['Yo']['pairs'] if w in (p['a'],p['b'])] and len(d['pairs'])==2,'only own pairs '+w)
      for x in ['Yo','Tony','Carlos']:
        if x!=w:check(d['people'][x]['pays']+d['people'][x]['gets']==sum(t['amount'] for t in d['transfers'] if x in (t['from'],t['to'])),'people from own transfers')
      check(d['people'][w]['pays']==D['Yo']['people'][w]['pays'] and d['people'][w]['gets']==D['Yo']['people'][w]['gets'],'own amount unchanged '+w)
      check(d['tot'][w]==D['Yo']['tot'][w],'own share total unchanged '+w)
      cols={x:round(sum(p['sh'][x] for p in d['purchases']),2) for x in ['Yo','Tony','Carlos']};check(cols==d['tot'],'totals = visible rows')
      check(all(p['sh'][w]>0.004 or p['by'] in ([w,'Arianna'] if w=='Tony' else [w]) for p in d['purchases']),'all involve '+w)
    rows=E("r3Data('2026-10','Tony').det.rows.map(r=>r.s)");check('Costco JC' not in rows and 'Walmart Licuadora' not in rows,'det rows')
    T3={k:pdft(pg,k) for k in ['mes','tony','carlos']}
    for s_ in ['Costco JC','Home Depot JT','Licuadora','CVS Carlos']:check(s_ in T3['mes'],'joe pdf '+s_)
    check('Carlos le transfiere a Joe' not in T3['tony'] and 'Joe le transfiere a Tony' not in T3['carlos'] and ('Entre Carlos y Joe' not in T3['tony'] if lang=='es' else True),'pdf pairs');check('Costco JC' not in T3['tony'] and 'Licuadora' not in T3['tony'] and 'CVS Carlos' not in T3['tony'] and 'Home Depot JT' in T3['tony'],'tony pdf')
    check('Home Depot JT' not in T3['carlos'] and 'Licuadora' not in T3['carlos'] and 'Walmart A' not in T3['carlos'] and 'Costco JC' in T3['carlos'] and 'CVS Carlos' in T3['carlos'],'carlos pdf')
    hw='Otras compras personales' if lang=='es' else 'Other personal purchases'
    check(all(hw not in T3[k] for k in ['tony','carlos']),'no hidden row in pdf')
    if lang=='es':
      E("()=>{tab='cfg';render()}");pg.wait_for_timeout(100);pg.check('#lnkon-Tony');pg.check('#lnkon-Carlos');pg.wait_for_timeout(600)
      L=E("S.links");docs=E("window.__fs.docs");DT,DC=docs['shares/'+L['Tony']['t']],docs['shares/'+L['Carlos']['t']]
      check(sorted(p['s'] for p in DT['months'][0]['purchases'])==st('Tony'),'link doc Tony')
      open('/tmp/v104c.pdf','w').write(T3['carlos'])
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
for who,doc in [('tony',DT),('carlos',DC)]:
  with app(ROOT,routes=R,now='2026-10-31T20:00:00',init="window.__SHARE_DOC=%s;"%json.dumps({**doc,'updatedAt':1761940000000}),width=390,height=844) as pg:
    pg.goto('/'.join(pg.url.split('/')[:3])+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA');pg.wait_for_timeout(500)
    pg.click('#vdet');pg.wait_for_timeout(100);tx=pg.inner_text('main')
    check('Otras compras personales' not in tx and 'Licuadora' not in tx,'viewer '+who)
    sm=pg.inner_text('#vsum')+pg.inner_text('#vhow');check(('Carlos le transfiere a Joe' not in sm and 'Joe le transfiere a Tony' in sm) if who=='tony' else ('Joe le transfiere a Tony' not in sm and 'Carlos le transfiere a Joe' in sm),'viewer pairs/transfers '+who)
    check(('Costco JC' in tx)==(who=='carlos') and ('Home Depot JT' in tx)==(who=='tony'),'viewer pairs '+who)
    pg.screenshot(path=os.path.join(SH,'v104-resumen-%s.png'%who),full_page=True)
print('test_v104 OK',ok)
