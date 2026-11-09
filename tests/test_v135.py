"""v135 (datos inventados): EarlyPay/OnePay baja el próximo Walmart y se acumula bajo la línea."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')

def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1500,'role':'debit'}],'cards':copy.deepcopy(S['months']['2026-10'].get('cards') or []),'bills':[],'personal':[],'purchases':[],
      'events':[
        {'id':'e1','type':'income','date':'2026-11-06','amount':40,'concept':'OnePay','desc':'EarlyPay 1','method':'deb'},
        {'id':'e2','type':'income','date':'2026-11-08','amount':25.5,'concept':'⚡ OnePay','desc':'EarlyPay 2','method':'deb'},
      ]}
    S['incCats']=list(S.get('incCats') or [])+['OnePay']
    S['checks']=[{'id':'c1','amount':531.60,'date':'2026-11-05','status':'deposited'},{'id':'c2','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'}]
    S['wm']={'est':200,'chk':{'2026-11-19':200},'paid':{'2026-11-05':226.51}}
    return S

with app(ROOT,now='2026-11-09T15:00:00',state=base(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700);assert E('CODE_V')=='v135'
    assert abs(E("epMonthSum('2026-11')")-65.5)<0.01
    assert abs(E("epCycleSum()")-65.5)<0.01
    assert abs(E("wmGross('2026-11-19')")-200)<0.01
    assert abs(E("wmAmt('2026-11-19')")-134.5)<0.01  # 200-65.5
    assert E("wmNext()")=='2026-11-19'
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(300)
    assert pg.locator('#ephero').count()==1
    t=pg.inner_text('#ephero');assert 'EarlyPay' in t and '$65.50' in t
    w=pg.inner_text('#wmhero');assert '$134.50' in w or '~$134.50' in w,w
    E("document.getElementById('wmhero').scrollIntoView({block:'center'})");pg.wait_for_timeout(150)
    pg.screenshot(path=os.path.join(SH,'v135-hoy-earlypay.png'))
    P=E("planNums()");print('plan',P.get('ep'),P.get('wmEst'),P.get('wmLines'),P.get('real'))
    assert abs(P['ep']-65.5)<0.01 and abs(P['wmEst']-134.5)<0.01 and abs(P['inc']-(P.get('real') or 0)-65.5-P.get('ywEst',0)-134.5)<0.05
    E("()=>{tab='ini';render();document.getElementById('plancard')?.scrollIntoView({block:'start'})}");pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(SH,'v135-plan-earlypay.png'))

# Pendiente: sin monto → caja Pendiente; plan usa último−EarlyPay
S=base();S['wm']['chk']={'2026-11-19':0};S['wm'].pop('est',None)
with app(ROOT,now='2026-11-09T15:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    assert E("wmGross('2026-11-19')")==0 and E("wmAmt('2026-11-19')")==0
    assert abs(E("wmUnitNet()")-161.01)<0.02  # 226.51-65.5
    P=E("planNums()");assert abs(P['wmEst']-161.01)<0.02,P

# Tras cobrar el 19, EarlyPays del ciclo ya no bajan el siguiente; nuevos sí
S=base();S['wm']['paid']={'2026-11-05':226.51,'2026-11-19':134.5};S['wm']['chk']={'2026-12-03':200}
S['months']['2026-11']['events'].append({'id':'e3','type':'income','date':'2026-11-20','amount':10,'concept':'OnePay','desc':'next cycle','method':'deb'})
with app(ROOT,now='2026-11-20T10:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    assert E("wmNext()")=='2026-12-03'
    assert abs(E("epCycleSum()")-10)<0.01
    assert abs(E("wmAmt('2026-12-03')")-190)<0.01
    assert abs(E("epMonthSum('2026-11')")-75.5)<0.01  # 40+25.5+10

# Auto-depósito usa neto; sin doble conteo
S=base();S['wm']['chk']={'2026-11-19':200}
with app(ROOT,now='2026-11-19T04:01:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800);E("autoDeposit()");pg.wait_for_timeout(300)
    assert abs(E("S.wm.paid['2026-11-19']")-134.5)<0.01,E("S.wm.paid")
    assert E("wmNext()")=='2026-12-03' and E("wmAmt('2026-12-03')")==0
    E("autoDeposit()");assert abs(E("S.wm.paid['2026-11-19']")-134.5)<0.01

# No negativo: EarlyPay > estimado
S=base();S['wm']['chk']={'2026-11-19':50}
with app(ROOT,now='2026-11-09T15:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    assert E("wmAmt('2026-11-19')")==0

print('OK')
