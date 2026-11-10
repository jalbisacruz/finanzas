"""v138 (datos inventados): ingresos por empresa y fecha; EarlyPay antes de su cheque; todo cuadra."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
S=copy.deepcopy(FIX);S['cur']='2026-11'
S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1500,'role':'debit'}],'cards':copy.deepcopy(S['months']['2026-10'].get('cards') or []),'bills':[],'personal':[],'purchases':[],
 'events':[
  {'id':'p1','type':'income','date':'2026-11-02','amount':30,'concept':'OnePay','method':'deb'},
  {'id':'p2','type':'income','date':'2026-11-04','amount':20,'concept':'OnePay','method':'deb'},
  {'id':'k1','type':'check','date':'2026-11-05','amount':531.60,'desc':'Cheque','checkId':'c1'},
  {'id':'w1','type':'income','date':'2026-11-05','amount':176.51,'concept':'🏪 Walmart','method':'deb'},
  {'id':'p3','type':'income','date':'2026-11-07','amount':25.5,'concept':'OnePay','method':'deb'},
  {'id':'p4','type':'income','date':'2026-11-09','amount':15,'concept':'OnePay','method':'deb'}]}
S['incCats']=list(S.get('incCats') or [])+['OnePay','🏪 Walmart']
S['checks']=[{'id':'c1','amount':531.60,'date':'2026-11-05','status':'deposited'},{'id':'c2','amount':540,'date':'2026-11-12','status':'pending'}]
S['wm']={'chk':{'2026-11-19':200},'paid':{'2026-11-05':176.51}}
with app(ROOT,now='2026-11-09T23:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700);assert E('CODE_V')=='v138'
    P=E("planNums()");D=E("v138Data(planNums())")
    wm=[(x['t'],x['d']) for x in D['wm']];print('wm',wm);print('yw',[(x['t'],x['d'],x['a']) for x in D['yw']])
    assert wm==[('p','2026-11-02'),('p','2026-11-04'),('r','2026-11-05'),('p','2026-11-07'),('p','2026-11-09'),('e','2026-11-19')],wm
    assert abs(D['wm'][-1]['a']-159.5)<0.01  # 200 − 25.50 − 15
    assert [x['t'] for x in D['yw']]==['r','e','e','e'] and D['yw'][0]['d']=='2026-11-05'
    assert abs(D['real']-P['real'])<0.02,(D['real'],P['real'])
    assert abs(D['ywT']+D['wmT']-P['inc'])<0.02,(D['ywT'],D['wmT'],P['inc'])
    assert abs(D['real']-(531.60+176.51+30+20+25.5+15))<0.02  # sin estimados
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(300)
    assert pg.locator('#pl-inc-break .pl-ib.d').count()==12
    E("document.getElementById('pl-inc-break').scrollIntoView({block:'center'})");pg.wait_for_timeout(150)
    pg.screenshot(path=os.path.join(SH,'v138-plan-por-fecha.png'))
print('OK')
