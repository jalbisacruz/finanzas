"""v105 (made-up data): 💵 Cobro parcial."""
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
S['months']['2026-10']['purchases'].append({'id':'pw','store':'Lavadora','date':'2026-10-21','total':600,'mode':'eq','who':['Yo','Tony','Carlos'],'shares':{'Tony':200,'Carlos':200,'Yo':200},'method':'deb'})
S['months']['2026-10']['income'][0]['amount']=2350
SH=os.path.join(ROOT,'shots')
REAL="()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}"
TR=lambda d,a,b:next((x['amount'] for x in d['transfers'] if x['from']==a and x['to']==b),0)
for lang in ['es','en']:
  with app(ROOT,now='2026-10-31T20:00:00',state=S,init="localStorage.setItem('finanzas-sync-uid','u1');"+("localStorage.setItem('finanzas-lang','en');" if lang=='en' else ''),routes=R) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    d0=E("debAvail()");D0=E("r3Data('2026-10','Yo')");c0=E("calc(L())")
    check(TR(D0,'Yo','Tony')==1402.35 and TR(D0,'Carlos','Yo')==264.85,D0['transfers'])
    E("fabMenu()");lab=pg.inner_text('#fabcob');check(('Cobro' in lab and 'automático' not in lab) if lang=='es' else 'Collect payment' in lab,lab)
    check(pg.locator('#fabsub').count()==1,'auto charge still there')
    pg.click('#fabcob');pg.wait_for_timeout(100);pg.click('#cbw-Tony');pg.wait_for_timeout(100)
    ids=E("[...document.querySelectorAll('.cbx')].map(b=>b.dataset.id)");check('pw' in ids and 'p5' not in ids and 'p3' not in ids,ids)  # p5 paid by Tony, p3 Joe-only
    pg.check('.cbx[data-id="pw"]');check('$200.00' in pg.inner_text('#cbt'),'amount shown')
    check(pg.locator('#cba').count()==0 and pg.locator('#cbl input[type=number]').count()==0,'amount not typed')
    pg.fill('#cbf','2026-10-24')
    if lang=='es':E(REAL);pg.screenshot(path=os.path.join(SH,'v105-cobro-tony.png'))
    pg.click('#cbsave');pg.wait_for_timeout(150)
    e=E("L().events.find(e=>e.type==='cobro')");check(e['who']=='Tony' and e['amount']==200 and e['items']==[{'id':'pw','a':200}] and e['date']=='2026-10-24',e)
    check(abs(E("debAvail()")-(d0+200))<0.01,'debit up')
    D1=E("r3Data('2026-10','Yo')");check(TR(D1,'Yo','Tony')==1602.35 and TR(D1,'Carlos','Yo')==264.85,D1['transfers'])
    c1=E("calc(L())");check(abs(c1['tonyDue']-(c0['tonyDue']+200))<0.01 and abs(c1['bal']-c0['bal'])<0.01,'calc tony + balance neutral')
    pr=[p for p in D1['pairs'] if p['b']=='Tony'][0];check(any(l['v']==200 for l in pr['lines']) and abs(sum(l['v'] for l in pr['lines'])-pr['net'])<0.01,pr)
    # can't collect twice
    E("fabMenu()");pg.click('#fabcob');pg.click('#cbw-Tony');pg.wait_for_timeout(100);check('pw' not in E("[...document.querySelectorAll('.cbx')].map(b=>b.dataset.id)"),'not twice')
    pg.click('#cbw-Carlos');pg.wait_for_timeout(100);check('pw' in E("[...document.querySelectorAll('.cbx')].map(b=>b.dataset.id)"),'carlos still owes washer')
    pg.check('.cbx[data-id="pw"]');pg.click('#cbsave');pg.wait_for_timeout(150)
    D2=E("r3Data('2026-10','Yo')");check(TR(D2,'Carlos','Yo')==64.85 and TR(D2,'Yo','Tony')==1602.35,D2['transfers'])
    pc=[p for p in D2['pairs'] if p['a']=='Carlos' and p['b']=='Yo'][0];check(pc['pend']==64.85 and any(l['v']==-200 for l in pc['lines']),pc)
    c2=E("calc(L())");check(abs(c2['carlosDue']-64.85)<0.01 and abs(c2['bal']-c0['bal'])<0.01 and abs(E("debAvail()")-(d0+400))<0.01,'carlos calc')
    # per-person views
    DT=E("r3Data('2026-10','Tony')");DC=E("r3Data('2026-10','Carlos')")
    check([c['who'] for c in DT['cobros']]==['Tony'] and [c['who'] for c in DC['cobros']]==['Carlos'] and len(D2['cobros'])==2,'cobros filtered')
    check(TR(DT,'Yo','Tony')==1602.35 and TR(DC,'Carlos','Yo')==64.85,'views amounts')
    T3={k:pdft(pg,k) for k in ['mes','tony','carlos']};cw='Cobros' if lang=='es' else 'Collected payments'
    check(cw in T3['mes'] and T3['mes'].count('Lavadora')>=3,'joe pdf both')
    check(cw in T3['tony'] and 'Lavadora' in T3['tony'] and '$200.00' in T3['tony'],'tony pdf')
    ct=T3['tony'].split(cw)[1].split('\n\n')[0];check('Carlos' not in ct,'tony pdf no carlos cobro '+ct)
    # Movimientos + reports
    mv=[m for m in E("moves(L())") if m['kind']=='cobro'];check(len(mv)==2 and all(m['amount']==200 for m in mv) and 'Lavadora' in mv[0]['desc'],mv)
    check(E("earned(L()).total")==E("(()=>{const m=JSON.parse(JSON.stringify(L()));m.events=m.events.filter(e=>e.type!=='cobro');return earned(m).total})()"),'not income')
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(200);check('Lavadora' in E("document.getElementById('cobcard')?.textContent||''"),'joe reports card')
    # collected purchase is locked
    pg.errors.clear();E("editP('pw')");pg.wait_for_timeout(100);check(any('DIALOG' in x for x in pg.errors) and not E("dlg().open&&!!document.querySelector('#dlg .tot')"),'edit blocked')
    E("dlg().open&&dlg().close()")
    # delete Tony cobro reverts
    tid=[m for m in mv if 'Tony' in m['desc']][0]['id'];dd=E("debAvail()");E("id=>delMove('cobro',id)",tid);pg.wait_for_timeout(100)
    D3=E("r3Data('2026-10','Yo')");check(TR(D3,'Yo','Tony')==1402.35 and abs(E("debAvail()")-(dd-200))<0.01,'delete reverts')
    E("fabMenu()");pg.click('#fabcob');pg.click('#cbw-Tony');pg.wait_for_timeout(100);check('pw' in E("[...document.querySelectorAll('.cbx')].map(b=>b.dataset.id)"),'collectable again');E("dlg().close()")
    # redo Tony cobro for screenshots
    E("fabMenu()");pg.click('#fabcob');pg.click('#cbw-Tony');pg.check('.cbx[data-id="pw"]');pg.fill('#cbf','2026-10-24');pg.click('#cbsave');pg.wait_for_timeout(150)
    E("save()");pg.reload();pg.wait_for_timeout(1000);check(len([e for e in E("S.months['2026-10'].events") if e['type']=='cobro'])==2,'persisted')
    E("()=>{unlocked=true;try{closeLock()}catch(e){};document.body.classList.remove('locked');render()}")
    if lang=='es':
      E("()=>{tab='cfg';render()}");pg.wait_for_timeout(100);pg.check('#lnkon-Tony');pg.wait_for_timeout(600)
      L=E("S.links");DOCT=E("window.__fs.docs")['shares/'+L['Tony']['t']]
    check(not [x for x in pg.errors if not x.startswith('DIALOG')],pg.errors)
with app(ROOT,routes=R,now='2026-10-31T20:00:00',init="window.__SHARE_DOC=%s;"%json.dumps({**DOCT,'updatedAt':1761940000000}),width=390,height=844) as pg:
    pg.goto('/'.join(pg.url.split('/')[:3])+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA');pg.wait_for_timeout(500)
    t=pg.inner_text('#vcob');check('Lavadora' in t and '$200.00' in t and 'Carlos' not in t,t)
    check('$1,602.35' in pg.inner_text('#vsum'),'tony summary amount')
    pg.click('#vdet');pg.wait_for_timeout(100);check('Ya cobrado a Tony' in pg.inner_text('#vhow'),'how line')
    pg.click('#vdet');pg.wait_for_timeout(100)
    pg.screenshot(path=os.path.join(SH,'v105-resumen-tony.png'),full_page=True)
    check(not [x for x in pg.errors if not x.startswith('DIALOG')],pg.errors)
print('test_v105 OK',ok)
