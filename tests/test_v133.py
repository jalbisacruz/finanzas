"""v133 (datos inventados): Cheques depositados muestra YoWash y Walmart."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
S=copy.deepcopy(FIX);S['cur']='2026-11'
S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1200,'role':'debit'}],'cards':copy.deepcopy(S['months']['2026-10'].get('cards') or []),'bills':[],'personal':[],'purchases':[],'events':[]}
S['checks']=[{'id':'c1','amount':531.60,'date':'2026-11-05','status':'deposited'},{'id':'c2','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'}]
S['wm']={'weeks':{'2026-10-30':226.51},'paid':{'2026-11-05':226.51},'chk':{'2026-11-19':0}}
with app(ROOT,now='2026-11-05T10:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);assert E('CODE_V')>='v134'
    L=E("depChecks().map(c=>[c.date,c.amount,c.src])");print(L)
    assert len(L)==2 and {x[2] for x in L}=={'💼 YoWash','🏪 Walmart'},L
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
    h=pg.locator('#bal-income>h2');h.click();pg.wait_for_timeout(200)
    t=pg.inner_text('#bal-income #chkcard');print(t)
    assert 'Walmart' in t and 'YoWash' in t and '$758.11' in t,t
    E("document.getElementById('chkcard').scrollIntoView({block:'center'})");pg.wait_for_timeout(200)
    pg.screenshot(path=os.path.join(SH,'v133-cheques-depositados.png'))
print('OK')
