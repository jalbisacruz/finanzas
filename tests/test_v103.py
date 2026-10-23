"""v103 (made-up data): cobro automático usa el monto de la suscripción."""
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
S['subs']=[{'id':'sApl','name':'Apple Com Bill','active':True,'amt':0.99,'per':'men'},{'id':'sNet','name':'Netflix','active':True}]
S['months']['2026-10']['personal']=[{'id':'old','date':'2026-10-02','amount':0.89,'cat':'📺 Suscripciones','desc':'Apple Com Bill','method':'deb','sub':'sApl','auto':True}]
SH=os.path.join(ROOT,'shots')
REAL="()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}"
for lang in ['es','en']:
  with app(ROOT,now='2026-10-23T09:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    d0=E("debAvail()")
    E("fabMenu()");pg.click('#fabsub');pg.wait_for_timeout(100)
    check(not pg.locator('#sba').is_visible(),'no amount before choosing')
    pg.select_option('#sbs','sApl');check(not pg.locator('#sba').is_visible() and '$0.99' in pg.inner_text('#sbinfo'),'uses sub amount')
    if lang=='es':E(REAL);pg.screenshot(path=os.path.join(SH,'v103-cobro-con-monto.png'))
    pg.click('#sbsave');pg.wait_for_timeout(150)
    x=E("L().personal[0]");check(x['amount']==0.99 and x['sub']=='sApl' and abs(E("debAvail()")-(d0-0.99))<0.01,x)
    check(E("L().personal.find(p=>p.id==='old').amount")==0.89,'past charge unchanged')
    # sub without amount: asked once, saved
    E("fabMenu()");pg.click('#fabsub');pg.select_option('#sbs','sNet');check(pg.locator('#sba').is_visible() and 'Monto:' not in pg.inner_text('#sbinfo') and 'Amount:' not in pg.inner_text('#sbinfo'),'asks amount')
    pg.errors.clear();pg.click('#sbsave');pg.wait_for_timeout(100);check(any('DIALOG' in e for e in pg.errors) and E("L().personal.length")==2,'requires amount')
    pg.fill('#sba','15.49');pg.wait_for_timeout(3500)
    if lang=='es':E(REAL);pg.screenshot(path=os.path.join(SH,'v103-cobro-sin-monto.png'))
    pg.click('#sbsave');pg.wait_for_timeout(150)
    check(E("S.subs.find(s=>s.id==='sNet').amt")==15.49 and E("L().personal[0].amount")==15.49,'saved on sub')
    E("fabMenu()");pg.click('#fabsub');pg.select_option('#sbs','sNet');check(not pg.locator('#sba').is_visible(),'next time no ask');E("dlg().close()")
    # inline new
    E("fabMenu()");pg.click('#fabsub');pg.select_option('#sbs','__new');check(pg.locator('#sba').is_visible(),'new asks');pg.fill('#sbnw','iCloud');pg.fill('#sba','2.99');pg.click('#sbsave');pg.wait_for_timeout(150)
    check(next(s for s in E("S.subs") if s['name']=='iCloud').get('amt')==2.99,'new sub amt')
    # price change via config is used next time
    E("S.subs[0].amt=1.29;save()");E("fabMenu()");pg.click('#fabsub');pg.select_option('#sbs','sApl');check('$1.29' in pg.inner_text('#sbinfo'),'edited price');pg.click('#sbsave');pg.wait_for_timeout(150)
    check(E("L().personal[0].amount")==1.29 and E("L().personal.find(p=>p.id==='old').amount")==0.89,'new price, past kept')
    if lang=='en':check('Settings' in E("(fabMenu(),document.getElementById('fabsub').click(),document.getElementById('sbs').value='sApl',sub103(),document.getElementById('sbinfo').innerText)"),'EN');E("dlg().close()")
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v103 OK',ok)
