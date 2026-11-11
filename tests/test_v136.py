"""v136 (datos inventados): Publix de Arianna sugiere Compras, no Gasolina."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
S=copy.deepcopy(FIX);S['cur']='2026-11'
S['cats']=list(S.get('cats') or [])
if not any('Compras' in c for c in S['cats']):
    S['cats'].insert(1,'🛒 Compras')
S['storeMem']={'publix':{'name':'Publix','cat':'⛽ Gasolina'},'walmart':{'name':'Walmart','cat':'🛒 Comida/Supermercado'}}
S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':500,'role':'debit'}],'cards':copy.deepcopy(S['months']['2026-10'].get('cards') or []),'bills':[],'personal':[],'purchases':[],'events':[]}
with app(ROOT,now='2026-11-09T16:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700);assert E('CODE_V')>='v136'
    # heal mem
    assert E("S.storeMem.publix.cat").find('Compras')>=0, E("S.storeMem.publix")
    assert abs(E("scanCat('Gas')")!='⛽ Gasolina' or True)
    # short 'Gas' must NOT fuzzy-match Gasolina
    assert E("scanCat('Gas')")!='⛽ Gasolina', E("scanCat('Gas')")
    E("""()=>{
      INBOX=[{id:'a1',t:'tok',link:'Tony',store:'Publix',date:'2026-11-08',total:42.5,tax:2.5,by:'Arianna',
        items:[{n:'Leche',a:4.5,own:['Yo','Tony','Carlos'],c:'⛽ Gasolina'},
               {n:'Pan',a:3.2,own:['Yo','Tony','Carlos'],c:'⛽ Gasolina'},
               {n:'Huevos',a:5.0,own:['Yo','Tony','Carlos'],c:'⛽ Gasolina'}]}];
      inboxOpen('a1');
    }""")
    pg.wait_for_timeout(400)
    cat=E("pCat(D)");print('purchase cat',cat)
    assert 'Compras' in cat,cat
    items=E("D.list.map(x=>x.c)");print('items',items)
    assert all('Compras' in (c or '') for c in items),items
    assert pg.locator('#pcat').input_value().find('Compras')>=0 or 'Compras' in pg.locator('#pcat').evaluate('e=>e.options[e.selectedIndex].text')
    # screenshot approval dialog
    pg.screenshot(path=os.path.join(SH,'v136-publix-compras.png'))
    # Publix Fuel may stay gasolina
    assert E("v136IsPublixGrocery('Publix Fuel')") is False
    assert E("v136IsFuelStore('Publix Fuel')") is True
print('OK')
