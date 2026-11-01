"""v122 (made-up data): AMAZON STORE CARD -8720 → Amazon en lista, compras, memoria y escaneo."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots');ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
S=copy.deepcopy(FIX);S['stores']=list(S.get('stores',[]))+['Kroger','AMAZON STORE CARD -8720']
k=sorted(S['months'])[-1];S['months'][k].setdefault('purchases',[]).append({'id':'pz','store':'AMAZON STORE CARD -8720','date':k+'-05','total':30,'mode':'fam','who':['Yo','Tony','Carlos'],'shares':{'Yo':7.5,'Tony':15,'Carlos':7.5},'method':'deb'})
S['storeMem']={'amazonstorecard8720':{'name':'AMAZON STORE CARD -8720','cat':'x'}}
with app(ROOT,now='2026-11-01T09:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate
    check(E("CODE_V")=='v122','ver')
    st=E("S.stores");check('AMAZON STORE CARD -8720' not in st and 'Amazon' in st,'list '+str(st))
    w=E("(()=>{const j=JSON.stringify(S);const i=j.indexOf('STORE CARD');return i<0?'':j.slice(i-200,i+40)})()");check(not w,'gone everywhere '+w)
    check(E("Object.values(S.months).flatMap(m=>m.purchases).find(p=>p.id==='pz').store")=='Amazon','purchase renamed')
    for raw in ['AMAZON STORE CARD -8720','Amazon.com','AMZN Mktp US','amazon']:
        check(E(f"scanStore({raw!r})")=='Amazon','scan '+raw)
    check(E("scanStore('Kroger')")=='Kroger','real store ok')
    E("()=>setState(JSON.parse(JSON.stringify({...S,stores:[...S.stores,'AMAZON STORE CARD -8720']})))");pg.wait_for_timeout(300)
    check('AMAZON STORE CARD -8720' not in E("S.stores"),'cloud data cleaned')
    pg.set_content if False else None
    E("()=>{document.body.insertAdjacentHTML('beforeend','<div id=shot style=\"position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;padding:8px\">'+ctlCard('stores')+'</div>')}");pg.wait_for_timeout(200)
    check('Amazon' in pg.inner_text('#shot') and 'STORE CARD' not in pg.inner_text('#shot'),'ui list')
    pg.locator('#shot').screenshot(path=os.path.join(SH,'v122-tiendas.png'))
    check(not [e for e in pg.errors if 'DIALOG' not in e],'errors '+str(pg.errors))
print('test_v122 OK',ok)
