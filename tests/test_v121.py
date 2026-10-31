"""v121 (made-up data): cuota mensual de préstamo en Lo que debo hasta pagar el mes."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots');ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
S=copy.deepcopy(FIX);S['loans']=[{'id':'L1','name':'Affirm Test','total':1000,'cuota':100,'meth':'deb','paid0':300,'active':True}]
with app(ROOT,now='2026-10-31T13:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate
    check(E("CODE_V")=='v121','ver')
    base=E("(()=>{const l=S.loans;S.loans=[];const c=calc(L());S.loans=l;return c})()")
    c=E("calc(L())");check(abs(c['debt']-base['debt']-100)<0.01,'debt +cuota');check(abs(base['bal']-c['bal']-100)<0.01,'bal -cuota')
    E("()=>{BAL_OPEN=true;render()}");pg.wait_for_timeout(200)
    check('Affirm Test' in pg.inner_text('#balcard'),'row in balance')
    pg.locator('#balcard').screenshot(path=os.path.join(SH,'v121-balance-cuota-pendiente.png'))
    E("()=>{const k=keys().at(-1);S.months[k].personal.unshift({id:'x',date:k+'-12',amount:40,cat:'🏦 Préstamos',desc:'Affirm',method:'deb',loan:'L1'})}")
    c=E("calc(L())");check(abs(c['debt']-base['debt']-60)<0.01,'partial')
    E("()=>{const k=keys().at(-1);S.months[k].personal.unshift({id:'y',date:k+'-12',amount:60,cat:'🏦 Préstamos',desc:'Affirm',method:'deb',loan:'L1'});render()}");pg.wait_for_timeout(200)
    c=E("calc(L())");check(abs(c['debt']-base['debt'])<0.01,'paid clears');check('Affirm Test' not in pg.inner_text('#balcard'),'row gone')
    pg.locator('#balcard').screenshot(path=os.path.join(SH,'v121-balance-cuota-pagada.png'))
    check(not [e for e in pg.errors if 'DIALOG' not in e],'errors '+str(pg.errors))
print('test_v121 OK',ok)
