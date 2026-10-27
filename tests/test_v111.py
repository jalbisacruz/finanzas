"""v111 (made-up data): Cobro parcial por compra (cajita de monto)."""
import os,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
S=copy.deepcopy(FIX);S['cur']='2026-10'
S['months']['2026-10']={'income':[{'id':'i1','name':'Débito','amount':2350,'role':'debit'}],'cards':[],'bills':[],
 'purchases':[{'id':'pa','store':'Abt Electronics','date':'2026-10-20','total':603.48,'mode':'eq','who':['Yo','Tony','Carlos'],'shares':{'Tony':301.74,'Carlos':150.87,'Yo':150.87},'method':'deb'},
  {'id':'pb','store':'Publix','date':'2026-10-22','total':60,'mode':'eq','who':['Yo','Tony','Carlos'],'shares':{'Tony':30,'Carlos':15,'Yo':15},'method':'deb'}],'personal':[],'events':[]}
SH=os.path.join(ROOT,'shots')
REAL="()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}"
with app(ROOT,now='2026-10-26T20:00:00',state=S,init="localStorage.setItem('finanzas-sync-uid','u1');",routes=R) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    d0=E("debAvail()");c0=E("calc(L())")
    E("fabMenu()");pg.click('#fabcob');pg.click('#cbw-Carlos');pg.wait_for_timeout(100)
    check(not pg.is_visible('.cba[data-id="pa"]'),'box hidden until ticked')
    pg.check('.cbx[data-id="pa"]');check(pg.is_visible('.cba[data-id="pa"]') and pg.input_value('.cba[data-id="pa"]')=='150.87','default full')
    pg.fill('.cba[data-id="pa"]','150');check('$150.00' in pg.inner_text('#cbt'),pg.inner_text('#cbt'))
    pg.fill('#cbf','2026-10-26');E(REAL);pg.screenshot(path=os.path.join(SH,'v111-cobro-parcial.png'))
    pg.fill('.cba[data-id="pa"]','200');pg.click('#cbsave');pg.wait_for_timeout(100)
    check(not E("L().events.length"),'over amount rejected')
    pg.fill('.cba[data-id="pa"]','150');pg.click('#cbsave');pg.wait_for_timeout(150)
    e=E("L().events.find(e=>e.type==='cobro')");check(e['amount']==150 and e['items']==[{'id':'pa','a':150}],e)
    check(abs(E("debAvail()")-(d0+150))<0.01,'debit +150')
    c1=E("calc(L())");check(abs(c1['carlosDue']-(c0['carlosDue']-150))<0.01 and abs(c1['bal']-c0['bal'])<0.01,(c0['carlosDue'],c1['carlosDue']))
    E("fabMenu()");pg.click('#fabcob');pg.click('#cbw-Carlos');pg.wait_for_timeout(100)
    check(pg.locator('.cbx[data-id="pa"]').get_attribute('data-a')=='0.87','remaining 0.87 still pending')
    txt=pg.inner_text('#cbl');check('Falta $0.87 de $150.87' in txt,txt)
    E(REAL);pg.screenshot(path=os.path.join(SH,'v111-cobro-falta.png'))
    pg.check('.cbx[data-id="pa"]');pg.click('#cbsave');pg.wait_for_timeout(150)
    E("fabMenu()");pg.click('#fabcob');pg.click('#cbw-Carlos');pg.wait_for_timeout(100)
    check(pg.locator('.cbx[data-id="pa"]').count()==0,'fully collected gone');E("dlg().close()")
    c2=E("calc(L())");check(abs(c2['carlosDue']-(c0['carlosDue']-150.87))<0.01,'total collected 150.87')
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(200);E(REAL);pg.locator('#cobcard').screenshot(path=os.path.join(SH,'v111-cobros-card.png'))
print('test_v111 OK',ok)
