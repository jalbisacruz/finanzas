"""v139 (datos inventados): EarlyPay entre los cheques depositados, por fecha; cheques y total sin cambios."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
S=copy.deepcopy(FIX);S['cur']='2026-11'
S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1500,'role':'debit'}],'cards':copy.deepcopy(S['months']['2026-10'].get('cards') or []),'bills':[],'personal':[],'purchases':[],
 'events':[
  {'id':'p1','type':'income','date':'2026-11-03','amount':30,'concept':'OnePay','method':'deb'},
  {'id':'w1','type':'income','date':'2026-11-05','amount':226.51,'concept':'🏪 Walmart','method':'deb'},
  {'id':'p2','type':'income','date':'2026-11-05','amount':20,'concept':'OnePay','method':'deb'},
  {'id':'p3','type':'income','date':'2026-11-08','amount':25.5,'concept':'⚡ OnePay','method':'deb'}]}
S['checks']=[{'id':'c1','amount':531.60,'date':'2026-11-05','status':'deposited'}]
S['wm']={'chk':{'2026-11-19':200},'paid':{'2026-11-05':226.51}}
with app(ROOT,now='2026-11-10T14:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700);assert E('CODE_V')=='v139'
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
    pg.locator('#bal-income>h2').click();pg.wait_for_timeout(200)
    h=pg.inner_text('#bal-income #chkcard > div:first-child');assert '$758.11' in h,h  # total solo cheques
    rows=E("[...document.querySelectorAll('#bal-income #chkcard > .row')].map(r=>r.innerText.replace(/\\n/g,' | '))");print(*rows,sep='\n')
    assert len(rows)==5,rows
    assert 'EarlyPay' in rows[0] and '25.50' in rows[0]                   # 08/11
    assert 'Walmart' in rows[1] and 'Depositado' in rows[1] and '226.51' in rows[1]  # cheque igual que antes
    assert 'YoWash' in rows[2] and 'Depositado' in rows[2]
    assert 'EarlyPay' in rows[3] and '20.00' in rows[3]                   # mismo día 05/11, debajo de los cheques
    assert 'EarlyPay' in rows[4] and '30.00' in rows[4]                   # 03/11
    E("render()");pg.wait_for_timeout(200)
    assert E("document.querySelectorAll('#bal-income #chkcard .v139ep').length")==3
    E("document.getElementById('bal-income').scrollIntoView({block:'start'});scrollBy(0,-70)");pg.wait_for_timeout(200)
    pg.screenshot(path=os.path.join(SH,'v139-cheques-con-earlypay.png'))
print('OK')
