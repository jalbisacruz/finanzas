"""v115 (made-up data): tiendas basura del escaneo bloqueadas; tiendas reales nuevas se añaden."""
import os,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;SH=os.path.join(ROOT,'shots')
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
S=copy.deepcopy(FIX);S['stores']=list(S.get('stores',[]))+['Mobil','AMAZON STORE CARD -8720','305-555-1234']
S['storeMem']={'amazon store card -8720':{'name':'AMAZON STORE CARD -8720'},'publix':{'name':'Publix'}}
with app(ROOT,state=S) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    st=E("S.stores");check('Mobil' not in st and not any('CARD' in s for s in st) and '305-555-1234' not in st,'limpieza '+str(st))
    check('publix' in E("S.storeMem") and 'amazon store card -8720' not in E("S.storeMem"),'storeMem')
    for n in ['AMAZON STORE CARD -8720','VISA ****1234','Chase Debit','Mobil','(305) 555-1234','Capital One']:
        check(E(f"v115Junk({n!r})"),'junk '+n)
    for n in ['Kangaroo','Kangaroo Express',"Sam's Club",'Aldi','Walmart Supercenter','Publix']:
        check(not E(f"v115Junk({n!r})"),'real '+n)
    check(not E("v115Junk('Mobil',{items:[{name:'Unleaded',category:'⛽ Gasolina'}]})"),'Mobil gasolinera')
    E("scanApply({isReceipt:true,store:'AMAZON STORE CARD -8720',date:'2026-10-28',total:19.23,tax:1.26,items:[{name:'Leche',amount:17.97,category:'x',confident:true}]})")
    check(E("D.store")!='AMAZON STORE CARD -8720' and 'store' in E("D._scan.u"),'scan no usa tarjeta')
    pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'v115-tarjeta-bloqueada.png'),full_page=True)
    E("dlg().close()")
    E("scanApply({isReceipt:true,store:'Kangaroo Express',date:'2026-10-28',total:19.23,tax:1.26,items:[{name:'Leche',amount:17.97,category:'x',confident:true}]})")
    check(E("D.store")=='Kangaroo Express','scan tienda real');pg.wait_for_timeout(200)
    pg.screenshot(path=os.path.join(SH,'v115-tienda-nueva.png'),full_page=True)
    E("saveP()");pg.wait_for_timeout(200)
    check('Kangaroo Express' in E("S.stores"),'tienda real añadida')
    E("tab='cfg';render()");pg.wait_for_timeout(200)
    pg.screenshot(path=os.path.join(SH,'v115-tiendas.png'),full_page=True)
    check(not pg.errors,str(pg.errors))
print('test_v115 OK',ok)
