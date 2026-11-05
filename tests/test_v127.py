"""v127 (made-up data): Walmart y YoWash preguntan a la misma hora (5 AM); tras confirmar Walmart se ve '✅ Cobrado'."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
S=copy.deepcopy(FIX);S['wm']={'est':226.51,'paid':{},'chk':{},'anchor':'2026-11-05'}
for c in S['checks']:
    if c['status']=='pending': c['date']='2026-11-05';c['amount']=531.60
with app(ROOT,now='2026-11-05T04:43:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(3000)
    assert E("CODE_V")=='v127'
    assert pg.locator('#wmconf').count()==0,'Walmart no pregunta antes de 5 AM'
    assert pg.locator('#chknote').count()==0
with app(ROOT,now='2026-11-05T06:10:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);E('autoDeposit()');pg.wait_for_timeout(300)
    assert pg.locator('#wmconf').count()==1,'Walmart pregunta'
    assert pg.locator('#chknote').count()==1,'YoWash pregunta'
    assert E('pendingCheck().amtPending')==True
    pg.screenshot(path=os.path.join(SH,'v127-dos-preguntas.png'))
    pg.click('#wmgok');pg.wait_for_timeout(300)
    assert pg.locator('#wmconf').count()==0
    t=pg.inner_text('#herocard');print(t)
    assert '19/11' in t and 'Cobrado' in t and t.count('Pendiente por definir')==2 and '12/11' in t,t
    assert E('wmPend("2026-11-01","2026-11-30").length')==0
    pg.locator('#herocard').screenshot(path=os.path.join(SH,'v127-walmart-cobrado.png'))
    assert not [e for e in pg.errors if 'DIALOG' not in e],pg.errors
print('test_v127 OK')
