"""v113 (made-up data): la nota de Carlos/Tony muestra la deuda entre Carlos y Tony."""
import os,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
S=copy.deepcopy(FIX);S['cur']='2026-10'
S['months']['2026-10']={'income':[{'id':'i1','name':'Débito','amount':2000,'role':'debit'}],'cards':[],'bills':[],
 'purchases':[{'id':'p1','store':'Aldi','date':'2026-10-24','total':32.39,'mode':'eq','who':['Yo','Tony','Carlos'],'shares':{'Tony':18.65,'Carlos':6.87,'Yo':6.87},'method':'deb'},
  {'id':'p2','store':'Aldi','date':'2026-10-24','total':32.39,'mode':'eq','paidBy':'Arianna','who':['Yo','Tony','Carlos'],'shares':{'Tony':18.21,'Carlos':7.09,'Yo':7.09}},
  {'id':'p3','store':'Joe solo','date':'2026-10-23','total':40,'mode':'eq','who':['Yo'],'shares':{'Yo':40},'method':'deb'}],'personal':[],'events':[]}
SH=os.path.join(ROOT,'shots')
with app(ROOT,now='2026-10-26T20:00:00',state=S) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    t=E("msgShort('carlos','2026-10')");print(t)
    check('ENTRE TÚ Y TONY' in t and 'TOTAL QUE LE DEBES A TONY' in t and '$7.09' in t and '$6.87' in t,'carlos peer')
    check('Joe solo' not in t,'no joe-only')
    tt=E("msgShort('tony','2026-10')");check('ENTRE TÚ Y CARLOS' in tt and 'TOTAL QUE CARLOS TE DEBE' in tt,'tony peer')
    check('LE DEBES A TONY' in E("msgPdfText('carlos','2026-10')"),'pdf text')
    r=E("r3Data('2026-10','Carlos')");check(any({p['a'],p['b']}=={'Carlos','Tony'} for p in r['pairs']),'pdf pair')
    check(all(p.get('store')!='Joe solo' for p in r['purchases']),'v104 pdf')
    s=E("snapMonth('2026-10','Carlos')");check(s.get('tc',{}).get('from')=='Carlos' and abs(s['tc']['amount']-7.09)<.01,'link tc')
    E("shareMsg('carlos','2026-10','txt')");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'v113-nota-carlos.png'))
    E("shareMsg('tony','2026-10','txt')");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'v113-nota-tony.png'))
print('test_v113 OK',ok)
