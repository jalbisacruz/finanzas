"""v134 (datos inventados): Walmart y YoWash se depositan solos a las 4:00 AM."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
def st():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1200,'role':'debit'}],'cards':copy.deepcopy(S['months']['2026-10'].get('cards') or []),'bills':[],'personal':[],'purchases':[],'events':[]}
    S['checks']=[{'id':'c1','amount':531.60,'date':'2026-11-05','status':'pending'}]
    S['wm']={'est':226.51,'chk':{'2026-11-05':226.51},'paid':{}};return S
with app(ROOT,now='2026-11-05T03:59:00',state=st(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800);E("autoDeposit()");pg.wait_for_timeout(200)
    assert E("Object.keys(S.wm.paid).length")==0 and E("debE(L()).amount")==1200,'antes de 4AM nada'
with app(ROOT,now='2026-11-05T04:01:00',state=st(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800);E("autoDeposit()");pg.wait_for_timeout(300)
    assert E('CODE_V')=='v134'
    assert E("S.wm.paid['2026-11-05']")==226.51,E("S.wm")
    assert abs(E("debE(L()).amount")-1958.11)<0.01,E("debE(L()).amount")
    assert E("wmNext()")=='2026-11-19' and E("wmAmt('2026-11-19')")==0
    E("autoDeposit()");assert abs(E("debE(L()).amount")-1958.11)<0.01,'no doble'
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(300)
    assert pg.locator('#wmconf').count()==0
    pg.screenshot(path=os.path.join(SH,'v134-hoy-4am.png'))
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
    pg.locator('#bal-income>h2').click();pg.wait_for_timeout(200)
    t=pg.inner_text('#bal-income #chkcard');print(t);assert 'Walmart' in t and 'YoWash' in t and '$758.11' in t
    E("document.getElementById('bal-income').scrollIntoView({block:'start'});scrollBy(0,-70)");pg.wait_for_timeout(200)
    pg.screenshot(path=os.path.join(SH,'v134-debitos-cheques-depositados.png'))
S=st();S['wm']['chk']={'2026-11-05':0};S['wm'].pop('est')
with app(ROOT,now='2026-11-05T06:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800);E("autoDeposit()");pg.wait_for_timeout(200)
    assert E("Object.keys(S.wm.paid).length")==0,'sin monto no deposita'
print('OK')
