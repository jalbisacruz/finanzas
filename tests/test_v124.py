"""v124 (made-up data): tienda Amazon no toma el nombre largo de una tarjeta con la misma clave."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots');ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
C='AMAZON STORE CARD -8720'
S=copy.deepcopy(FIX);S['stores']=['Walmart','Publix','Amazon']
with app(ROOT,now='2026-11-01T09:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate
    check(E("CODE_V")=='v124','ver')
    E("()=>{S.catalog.items['zz_card']={t:'card',key:'Amazon',name:'"+C+"'};lblDirty();render()}")
    check(E("DN('Amazon')")!=C,'DN')
    L=E("CTL.stores.items().map(x=>x.label)");check('Amazon' in L and C not in L,str(L))
    E("()=>CTL.stores.add()");pg.wait_for_timeout(100);pg.fill('#ndn','Amazon');E("_ndGo()");pg.wait_for_timeout(150)
    check(E("S.stores.filter(x=>x==='Amazon').length")==1,'no dup')
    i=E("S.stores.indexOf('Amazon')");E(f"()=>CTL.stores.edit({i})");pg.wait_for_timeout(100)
    check(pg.input_value('#ndn')=='Amazon','edit field');E("_ndGo()");pg.wait_for_timeout(150)
    E("()=>{document.body.insertAdjacentHTML('beforeend','<div id=shot style=\"position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;padding:8px\">'+ctlCard('stores').split('<div class=\"card\" id=\"ctl-subs')[0]+'</div>')}");pg.wait_for_timeout(200)
    pg.locator('#shot').screenshot(path=os.path.join(SH,'v124-tiendas.png'))
    check(C not in pg.inner_text('#shot'),'shot text')
    check(not [e for e in pg.errors if 'DIALOG' not in e],'errors '+str(pg.errors))
print('test_v124 OK',ok)
