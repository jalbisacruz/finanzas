"""v101 (made-up data): monto y periodicidad en suscripciones."""
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
S['subs']=[{'id':'sNet','name':'Netflix','active':True},{'id':'sHulu','name':'Hulu','active':False},{'id':'sSpo','name':'Spotify','active':True,'amt':11.99,'per':'men'}]
S['months']['2026-09']=copy.deepcopy(S['months'].get('2026-09') or {'income':[{'id':'i0','name':'Débito','amount':500,'role':'debit'}],'cards':[],'bills':[],'purchases':[],'personal':[],'events':[]})
S['months']['2026-09'].setdefault('personal',[]).append({'id':'oldh','date':'2026-09-12','amount':7.99,'cat':'📺 Suscripciones','desc':'Hulu','method':'deb','sub':'sHulu','auto':True})
SH=os.path.join(ROOT,'shots')
REAL="()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}"
for lang in ['es','en']:
  with app(ROOT,now='2026-10-31T20:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    check(E("S.subs[0]")=={'id':'sNet','name':'Netflix','active':True},'old sub untouched')
    # edit Netflix: amount + yearly? -> monthly
    E("CTL.subs.edit(0)");pg.wait_for_timeout(100);check(pg.locator('#ndsa').count()==1 and pg.locator('#ndsp').count()==1 and pg.locator('#ndsubx').count()==1,'edit fields')
    pg.fill('#ndn','Netflix Premium');pg.fill('#ndsa','22.99');pg.select_option('#ndsp','men')
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v101-editar-suscripcion.png'))
    pg.click('#ndok');pg.wait_for_timeout(100)
    check(E("S.subs[0]")=={'id':'sNet','name':'Netflix Premium','active':True,'amt':22.99,'per':'men'},E("S.subs[0]"))
    # reactivate Hulu with yearly
    E("CTL.subs.edit(1)");pg.uncheck('#ndsubx');pg.fill('#ndsa','79.99');pg.select_option('#ndsp','anu');pg.click('#ndok');pg.wait_for_timeout(100)
    check(E("S.subs[1].active")==True and E("S.subs[1].per")=='anu','reactivated')
    # cancel Spotify; clear amount
    E("CTL.subs.edit(2)");pg.check('#ndsubx');pg.fill('#ndsa','');pg.select_option('#ndsp','');pg.click('#ndok');pg.wait_for_timeout(100)
    sp=E("S.subs[2]");check(sp['active']==False and 'amt' not in sp and 'per' not in sp,sp)
    # add new with weekly
    E("CTL.subs.add()");pg.fill('#ndn','Periódico');pg.fill('#ndsa','3.50');pg.select_option('#ndsp','sem');check(pg.locator('#ndsubx').count()==0,'no cancel on add');pg.click('#ndok');pg.wait_for_timeout(100)
    n=E("S.subs[3]");check(n['name']=='Periódico' and n['amt']==3.5 and n['per']=='sem' and n['active'],n)
    E("CTL.subs.add()");pg.fill('#ndn','Otra cosa');pg.select_option('#ndsp','otr');pg.click('#ndok');pg.wait_for_timeout(100);check(E("S.subs[4].per")=='otr' and 'amt' not in E("S.subs[4]"),'otra')
    # list
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(200);t=pg.inner_text('#ctl-subs')
    ms=('Mensual','Anual','Semanal','Otra') if lang=='es' else ('Monthly','Yearly','Weekly','Other')
    check('$22.99' in t and ms[0] in t and '$79.99' in t and ms[1] in t and '$3.50' in t and ms[2] in t and ms[3] in t,t)
    # form prefill
    E("fabMenu()");pg.click('#fabsub');pg.wait_for_timeout(100)
    opts=E("[...document.querySelectorAll('#sbs option')].map(o=>o.textContent)");check(any('Netflix Premium' in o and '$22.99' in o for o in opts) and not any('Spotify' in o for o in opts),opts)
    pg.select_option('#sbs','sNet');check(E("document.getElementById('sba').value")=='22.99','prefill')
    pg.select_option('#sbs','sHulu');check(E("document.getElementById('sba').value")=='79.99','prefill 2')
    pg.select_option('#sbs','sNet')
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v101-cobro-prellenado.png'))
    pg.fill('#sba','24.99');d0=E("debAvail()");pg.click('#sbsave');pg.wait_for_timeout(150)
    x=E("L().personal[0]");check(x['sub']=='sNet' and x['amount']==24.99 and abs(E("debAvail()")-(d0-24.99))<0.01 and E("S.subs[0].amt")==22.99,'editable, default kept')
    # sub without amount: no prefill
    E("fabMenu()");pg.click('#fabsub');pg.select_option('#sbs',E("S.subs[4].id"));check(E("document.getElementById('sba').value")=='','no prefill without amount');E("dlg().close()")
    E("save()");pg.reload();pg.wait_for_timeout(1000);check(E("S.subs[0].amt")==22.99 and E("S.subs[3].per")=='sem','persisted')
    E("()=>{unlocked=true;try{closeLock()}catch(e){};document.body.classList.remove('locked');render()}")
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
    if lang=='es':
      E("()=>{tab='cfg';render()}");pg.wait_for_timeout(300);E(REAL)
      if not pg.locator('#ctl-subs .row').first.is_visible():pg.locator('#ctl-subs h2').first.click();pg.wait_for_timeout(200)
      E("document.getElementById('ctl-subs').scrollIntoView({block:'start'});scrollBy(0,-70)");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'v101-suscripciones-lista.png'))
print('test_v101 OK',ok)
