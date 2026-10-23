"""v100 (made-up data): suscripciones y cobro automático."""
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

S['budgets']={'🏠 Hogar':700,'📺 Suscripciones':60}
S['subs']=[{'id':'sNet','name':'Netflix','active':True},{'id':'sHulu','name':'Hulu','active':False}]
S['months']['2026-09']=copy.deepcopy(S['months'].get('2026-09') or {'income':[{'id':'i0','name':'Débito','amount':500,'role':'debit'}],'cards':[],'bills':[],'purchases':[],'personal':[],'events':[]})
S['months']['2026-09'].setdefault('personal',[]).append({'id':'oldh','date':'2026-09-12','amount':7.99,'cat':'📺 Suscripciones','desc':'Hulu','method':'deb','sub':'sHulu','auto':True})
SH=os.path.join(ROOT,'shots')
REAL="()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}"
for lang in ['es','en']:
  with app(ROOT,now='2026-10-31T20:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    cats0=E("JSON.stringify(S.cats)");check(E("subCat()")=='📺 Suscripciones','reuses existing category')
    # compra manual: sin suscripciones
    E("quick()");pg.wait_for_timeout(100);ch=E("[...document.querySelectorAll('#qcats .chip')].map(b=>b.dataset.c)")
    check('📺 Suscripciones' not in ch and len(ch)>3 and pg.locator('#qcats .chip.on').count()==1,ch);E("dlg().close()")
    # config
    E("CTL.subs.add()");pg.fill('#ndn','Spotify');pg.click('#ndok');pg.wait_for_timeout(100)
    check([s['name'] for s in E("S.subs")]==['Netflix','Hulu','Spotify'],'add sub')
    E("CTL.subs.del(1)");check(E("S.subs.length")==3,'cannot delete sub with history')
    # form
    d0=E("debAvail()");c0=E("L().cards[0].amount");cn=E("L().cards[0].name")
    E("fabMenu()");check(pg.locator('#fabsub').count()==1,'menu item');pg.click('#fabsub');pg.wait_for_timeout(100)
    opts=E("[...document.querySelectorAll('#sbs option')].map(o=>o.textContent)");check('Netflix' in opts and 'Hulu' not in opts,'only active subs')
    mopts=E("[...document.querySelectorAll('#sbm option')].map(o=>o.value)");check(mopts[0]=='deb' and 'card:'+cn in mopts and not any(o.startswith('money:') for o in mopts),mopts)
    pg.select_option('#sbs','sNet');pg.fill('#sba','15.49');pg.select_option('#sbm','card:'+cn);pg.fill('#sbf','2026-10-03')
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v100-cobro-automatico.png'))
    pg.click('#sbsave');pg.wait_for_timeout(150)
    x=E("L().personal[0]");check(x['sub']=='sNet' and x['cat']=='📺 Suscripciones' and x['method']=='card:'+cn and x['amount']==15.49,x)
    check(abs(E("L().cards[0].amount")-(c0+15.49))<0.01 and abs(E("debAvail()")-d0)<0.01,'card up, debit same')
    # inline new sub on debit
    E("fabMenu()");pg.click('#fabsub');pg.select_option('#sbs','__new');pg.fill('#sbnw','iCloud');pg.fill('#sba','2.99');pg.fill('#sbf','2026-10-20');pg.click('#sbsave');pg.wait_for_timeout(150)
    check(any(s['name']=='iCloud' for s in E("S.subs")) and abs(E("debAvail()")-(d0-2.99))<0.01,'inline new + debit')
    # negative block
    d1=E("debAvail()");n1=E("L().personal.length");E("fabMenu()");pg.click('#fabsub');pg.select_option('#sbs','sNet');pg.fill('#sba',str(d1+10));pg.errors.clear();pg.click('#sbsave');pg.wait_for_timeout(100)
    check(any('negativ' in e for e in pg.errors) and E("L().personal.length")==n1 and abs(E("debAvail()")-d1)<0.01,'negative blocked');E("dlg().close()")
    check(E("JSON.stringify(S.cats)")==cats0,'no new category (reused)')
    check(E("L().purchases.length")==7,'not shared')
    check(abs(E("budBy(L()).by['📺 Suscripciones']")-18.48)<0.01,'counts in budget')
    # reports
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(300);t=pg.inner_text('#subcard')
    check('Netflix' in t and '$15.49' in t and 'iCloud' in t and '$2.99' in t and 'Hulu' in t and '$7.99' in t and ('Cancelada' if lang=='es' else 'Cancelled') in t and 'Spotify' in t,t)
    T3={k:pdft(pg,k) for k in ['mes','tony','carlos']}
    mt=T3.pop('mes');check(('Suscripciones' if lang=='es' else 'Subscriptions') in mt and 'Netflix' in mt and '$15.49' in mt and 'Hulu' in mt and '$7.99' in mt and 'iCloud' in mt and ('Historial' if lang=='es' else 'History') in mt,'joe pdf subs')
    for k in T3:check('Netflix' not in T3[k] and 'iCloud' not in T3[k],k)
    for w in ['Tony','Carlos']:o=json.dumps(E("w=>r3Data('2026-10',w)",w),ensure_ascii=False);check('Netflix' not in o and 'iCloud' not in o,'r3Data '+w)
    check(any('Netflix' in (m.get('desc') or '') for m in E('moves(L())')),'movimientos desc')
    # persists after reload
    E("save()");pg.reload();pg.wait_for_timeout(1000);check(len(E("S.subs"))==4,'subs persisted')
    E("()=>{unlocked=true;try{closeLock()}catch(e){};document.body.classList.remove('locked');render()}")
    if lang=='en':E("()=>{LANG='en';render()}")
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
    if lang=='es':
      for tb,cid,nm in [('cfg','ctl-subs','v100-suscripciones.png'),('rep','subcard','v100-reportes-suscripciones.png')]:
        E("()=>{tab='%s';render()}"%tb);pg.wait_for_timeout(300);E(REAL)
        if not pg.locator('#%s .row'%cid).first.is_visible():pg.locator('#%s h2'%cid).first.click();pg.wait_for_timeout(200)
        E("document.getElementById('%s').scrollIntoView({block:'start'});scrollBy(0,-70)"%cid);pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,nm))
print('test_v100 OK',ok)
