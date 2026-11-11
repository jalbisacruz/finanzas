"""v137 (datos inventados): solo el EarlyPay posterior al Walmart cobrado baja el próximo cheque."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')

def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1500,'role':'debit'}],'cards':copy.deepcopy(S['months']['2026-10'].get('cards') or []),'bills':[],'personal':[],'purchases':[],
      'events':[
        {'id':'e1','type':'income','date':'2026-11-03','amount':40,'concept':'OnePay','desc':'EarlyPay del primer cheque','method':'deb'},
        {'id':'w1','type':'income','date':'2026-11-05','amount':226.51,'concept':'🏪 Walmart','desc':'Walmart','method':'deb'},
        {'id':'e2','type':'income','date':'2026-11-08','amount':25.5,'concept':'⚡ OnePay','desc':'EarlyPay del siguiente','method':'deb'},
      ]}
    S['incCats']=list(S.get('incCats') or [])+['OnePay','🏪 Walmart']
    S['checks']=[{'id':'c1','amount':531.60,'date':'2026-11-05','status':'deposited'},{'id':'c2','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'}]
    # cobrado el 5/11 solo como ingreso, SIN S.wm.paid (caso pre-v134)
    S['wm']={'chk':{'2026-11-19':200},'paid':{}}
    return S

with app(ROOT,now='2026-11-09T23:00:00',state=base(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700);assert E('CODE_V')>='v137'
    assert E("wmNext()")=='2026-11-19',E("wmNext()")
    assert E("epLastPaid()")=='2026-11-05',E("epLastPaid()")
    assert abs(E("epMonthSum('2026-11')")-65.5)<0.01
    assert abs(E("epCycleSum()")-25.5)<0.01,E("epCycleSum()")
    assert abs(E("wmAmt('2026-11-19')")-174.5)<0.01,E("wmAmt('2026-11-19')")  # 200-25.50, no 200-65.50
    P=E("planNums()");print('plan',P.get('ep'),P.get('real'),P.get('wmEst'),P.get('wmLines'))
    assert abs(P['ep']-65.5)<0.01
    assert abs(P['real']-(226.51+65.5))<0.02  # Walmart cobrado + ambos EarlyPay
    assert abs(P['wmEst']-174.5)<0.02
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(300)
    w=pg.inner_text('#wmhero');assert '$174.50' in w or '~$174.50' in w,w
    t=pg.inner_text('#ephero');assert 'EarlyPay' in t and '$65.50' in t,t
    E("document.getElementById('wmhero').scrollIntoView({block:'center'})");pg.wait_for_timeout(150)
    pg.screenshot(path=os.path.join(SH,'v137-hoy-earlypay-ciclo.png'))
    E("document.getElementById('plancard')?.scrollIntoView({block:'start'})");pg.wait_for_timeout(200)
    pg.screenshot(path=os.path.join(SH,'v137-plan-earlypay-ciclo.png'))
    br=E("document.getElementById('pl-inc-break')?.innerText||''");print(br)
    assert '25.50' in br and '174.50' in br  # v138: EarlyPay por fecha

# Con paid también: mismo recorte (solo el EP de después)
S=base();S['wm']['paid']={'2026-11-05':226.51}
with app(ROOT,now='2026-11-09T23:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    assert E("epLastPaid()")=='2026-11-05' and abs(E("epCycleSum()")-25.5)<0.01

print('OK')
