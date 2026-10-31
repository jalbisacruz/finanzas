"""v119 (made-up data): la nota para Tony muestra el TOTAL que Carlos le debe."""
import os,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
S=copy.deepcopy(FIX);S['cur']='2026-10'
S['months']['2026-10']={'income':[{'id':'i1','name':'Débito','amount':2000,'role':'debit'}],'cards':[],'bills':[],
 'purchases':[{'id':'p1','store':'Costco','date':'2026-10-20','total':90,'mode':'eq','paidBy':'Tony','who':['Yo','Tony','Carlos'],'shares':{'Tony':45,'Carlos':22.5,'Yo':22.5}},
  {'id':'p2','store':'Aldi','date':'2026-10-24','total':32.39,'mode':'eq','paidBy':'Arianna','who':['Yo','Tony','Carlos'],'shares':{'Tony':18.21,'Carlos':7.09,'Yo':7.09}},
  {'id':'p3','store':'Publix','date':'2026-10-25','total':20,'mode':'eq','paidBy':'Carlos','who':['Tony','Carlos'],'shares':{'Tony':10,'Carlos':10}}],'personal':[],'events':[]}
SH=os.path.join(ROOT,'shots')
with app(ROOT,now='2026-10-26T20:00:00',state=S) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    tt=E("msgShort('tony','2026-10')");print(tt)
    check('TOTAL QUE CARLOS TE DEBE  $19.59' in tt,'tony total')  # 22.5+7.09-10
    check('Total  $29.59' in tt and 'Parte de Carlos' in tt,'subtotal')
    t=E("msgShort('carlos','2026-10')");check('TOTAL QUE LE DEBES A TONY  $19.59' in t,'carlos total')
    check(E("CODE_V")>='v119','ver')
    for w in ['tony','carlos']:
        E(f"shareMsg('{w}','2026-10','txt')");pg.wait_for_timeout(200)
        E("(()=>{const a=document.getElementById('msgt');a.rows=24;a.scrollTop=1e5})()");pg.wait_for_timeout(150)
        pg.screenshot(path=os.path.join(SH,f'v119-nota-{w}.png'),full_page=True)
print('test_v119 OK',ok)
