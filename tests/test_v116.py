"""v116 (made-up data): Walmart cheque quincenal con estimado, ajuste y confirmación el día de cobro."""
import os,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;SH=os.path.join(ROOT,'shots')
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
S=copy.deepcopy(FIX)
with app(ROOT,state=S,now='2026-10-30T08:00:00',new_look=True,expand=True) as pg:
    E=pg.evaluate
    check(E("wmNext()")=='2026-11-05','primer cheque');check(not pg.query_selector('#wmconf'),'sin confirmación antes')
    E("wmWeekDlg()");pg.fill('#wma','1240');pg.wait_for_timeout(100);pg.screenshot(path=os.path.join(SH,'v116-estimado.png'))
    pg.click('#wmsave');pg.wait_for_timeout(200)
    check(E("wmAmt('2026-11-05')")==1240 and E("wmAmt('2026-11-19')")==1240,'estimado general')
    E("wmWeekDlg()");pg.fill('#wma','1100');pg.check('#wmone');pg.click('#wmsave');pg.wait_for_timeout(200)
    check(E("wmAmt('2026-11-05')")==1100 and E("wmAmt('2026-11-19')")==1240,'ajuste de un cheque')
    check(E("wmPend('2026-11-01','2026-11-30').length")==2,'dos cheques en noviembre')
    E("S.cur='2026-11';if(!S.months['2026-11'])S.months['2026-11']=JSON.parse(JSON.stringify(L()))")
    p=E("planNums()");check(p.get('wm')==2340,'plan incluye cheques '+str(p.get('wm'))+' '+str(p.get('k')))
    pg.locator('#wmcard').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'v116-tarjeta.png'))
    st=E("JSON.stringify(S)")
    check(not pg.errors,str(pg.errors))
st2=copy.deepcopy(S);import json;st2=json.loads(st)
with app(ROOT,state=st2,now='2026-11-05T07:30:00',new_look=True) as pg:
    E=pg.evaluate
    check(pg.query_selector('#wmconf') is not None,'confirmación el día 5');check(E("document.getElementById('wmg').value")=='1100','monto sugerido')
    pg.screenshot(path=os.path.join(SH,'v116-confirmar.png'))
    d0=E("debE(L()).amount");pg.fill('#wmg','1123.45');pg.click('#wmgok');pg.wait_for_timeout(200)
    check(E("S.wm.paid['2026-11-05']")==1123.45,'pagado');check(E("wmNext()")=='2026-11-19','siguiente');check(not pg.query_selector('#wmconf'),'se quita')
    check(E("S.months[monthFor('2026-11-05')].events.some(e=>e.concept=='🏪 Walmart'&&e.amount==1123.45)"),'ingreso')
    check(not pg.errors,str(pg.errors))
print('test_v116 OK',ok)
