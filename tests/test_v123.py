"""v123 (made-up data): editar tienda sin ficha guarda; etiqueta con nombre de tarjeta → Amazon; compras intactas; sobrevive a la nube."""
import os,copy,json
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots');ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
C='AMAZON STORE CARD -8720'
S=copy.deepcopy(FIX);S['stores']=["Sam's Club",'Walmart','Publix','Aldi','Detwilers','Seven Eleven','Kagaroo','PFM Manasota Fresh Market','Tienda tamales','Los guerreros','Amazon']
k=sorted(S['months'])[-1];P=S['months'][k].setdefault('purchases',[])
P.append({'id':'pk','store':'Kagaroo','date':k+'-03','total':12,'mode':'fam','who':['Yo'],'shares':{'Yo':12},'method':'deb'})
P.append({'id':'pa','store':'Amazon','date':k+'-05','total':30,'mode':'fam','who':['Yo'],'shares':{'Yo':30},'method':'deb'})
with app(ROOT,now='2026-11-01T09:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate
    check(E("CODE_V")=='v123','ver')
    # etiqueta visible con el nombre de la tarjeta (caso nube) + tienda sin ficha
    E("()=>{const I=S.catalog.items;Object.keys(I).forEach(id=>{if(I[id].t==='store'&&I[id].key==='Kagaroo')delete I[id]});const a=Object.values(I).find(i=>i.t==='store'&&i.key==='Amazon');a.name='"+C+"';setState(JSON.parse(JSON.stringify(S)))}")
    pg.wait_for_timeout(300)
    L=E("CTL.stores.items().map(x=>x.label)");check(C not in L and 'Amazon' in L,'label fixed '+str(L))
    # editar Kagaroo → Kangaroo
    i=E("S.stores.indexOf('Kagaroo')");E(f"()=>CTL.stores.edit({i})");pg.wait_for_timeout(100);pg.fill('#ndn','Kangaroo');E("_ndGo()");pg.wait_for_timeout(200)
    L=E("CTL.stores.items().map(x=>x.label)");check('Kangaroo' in L and 'Kagaroo' not in L,'edit saved '+str(L))
    saved=json.loads(E("localStorage.getItem(K)"));check(any(i.get('name')=='Kangaroo' for i in saved['catalog']['items'].values()),'persisted')
    check(E("Object.values(S.months).flatMap(m=>m.purchases).filter(p=>['pk','pa'].includes(p.id)).map(p=>p.store).join()")=='Kagaroo,Amazon','purchases intact')
    # vuelve de la nube (otra estación con la edición) → se mantiene
    E("()=>setState(JSON.parse(localStorage.getItem(K)))");pg.wait_for_timeout(300)
    L=E("CTL.stores.items().map(x=>x.label)");check('Kangaroo' in L and C not in L,'after cloud '+str(L))
    # editar Amazon y que se guarde
    i=E("S.stores.indexOf('Amazon')");E(f"()=>CTL.stores.edit({i})");pg.wait_for_timeout(100);pg.fill('#ndn','Amazon');E("_ndGo()");pg.wait_for_timeout(200)
    check('Amazon' in E("CTL.stores.items().map(x=>x.label)"),'amazon edit')
    E("()=>{document.body.insertAdjacentHTML('beforeend','<div id=shot style=\"position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;padding:8px\">'+ctlCard('stores').split('<div class=\"card\" id=\"ctl-subs')[0]+'</div>')}");pg.wait_for_timeout(200)
    pg.locator('#shot').screenshot(path=os.path.join(SH,'v123-tiendas.png'))
    check(not [e for e in pg.errors if 'DIALOG' not in e],'errors '+str(pg.errors))
print('test_v123 OK',ok)
# compra con fecha del mes anterior → corregir fecha → pasa al mes actual
S2=copy.deepcopy(FIX);ks=sorted(S2['months']);a,b=ks[-2],ks[-1]
S2['months'][a].setdefault('purchases',[]).append({'id':'pd','store':'Walmart','date':a+'-28','total':20,'mode':'manual','who':['Yo'],'shares':{'Yo':20},'method':'deb'})
with app(ROOT,now='2026-11-01T09:00:00',state=S2,new_look=True) as pg:
    E=pg.evaluate;E(f"()=>{{S.cur='{a}';render();editP('pd')}}");pg.wait_for_timeout(150)
    E(f"()=>{{D.date='{b}-01';saveP()}}");pg.wait_for_timeout(300)
    check(not any(p['id']=='pd' for p in E(f"S.months['{a}'].purchases")) and E(f"S.months['{b}'].purchases.filter(p=>p.id==='pd').length")==1,'moved month')
    check(not [e for e in pg.errors if 'DIALOG' not in e],'errors2 '+str(pg.errors))
print('test_v123 date OK',ok)
