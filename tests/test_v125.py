"""v125 (made-up data): Walmart en la caja azul debajo de YoWash y dentro del Disponible proyectado."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots');ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
S=copy.deepcopy(FIX);S['wm']={'est':226.51,'paid':{},'chk':{}}
for c in S['checks']:
    if c['status']=='pending': c['date']='2026-11-05';c['amount']=531.60
with app(ROOT,now='2026-11-04T08:45:00',state=S,new_look=True) as pg:
    E=pg.evaluate
    check(E("CODE_V") >='v125','ver')
    check(pg.locator('#herocard #wmhero').count()==1,'wm in hero')
    t=pg.inner_text('#herocard');check(t.index('YoWash')<t.index('Walmart'),'order '+t)
    check('$226.51' in t,'amt')
    check(pg.locator('#wmcard').count()==0,'no wmcard')
    base=E("(()=>{const m=L(),c=calc(m),pc=pendingCheck();return r2(sum(m.income,x=>x.amount)-(window.heldPend?heldPend():0)+(pc?pc.amount:0)-c.tonyDue-sum(prevPend(),p=>p.c.tonyDue)-c.credit)})()")
    pj=E("planV2()");import re
    v=re.search(r'id="pl-proj"[\s\S]*?<b class="[^"]*">([^<]*)<',pj).group(1)
    print('base',base,'proj',v)
    check(abs(float(v.replace('$','').replace(',','').replace('−','-'))-(base+226.51))<0.01,'proj incl wm')
    pg.locator('#herocard').screenshot(path=os.path.join(SH,'v125-caja-azul.png'))
    E("()=>{document.body.insertAdjacentHTML('beforeend','<div id=shot style=\"position:fixed;inset:0;z-index:99999;background:#f1f5f9;overflow:auto;padding:8px\">'+planV2()+'</div>')}");pg.wait_for_timeout(200)
    pg.locator('#shot #plancard').screenshot(path=os.path.join(SH,'v125-proyectado.png'))
    E("document.getElementById('shot').remove()")
    pg.click('#wmadj');pg.wait_for_timeout(150);check('Siguiente' in pg.inner_text('dialog'),'dlg')
    pg.locator('dialog').screenshot(path=os.path.join(SH,'v125-ajustar-walmart.png'))
    E("dlg().close()");E("S.wm={paid:{},chk:{}};render()");pg.wait_for_timeout(100)
    check('Añadir estimado' in pg.inner_text('#wmadj'),'add btn')
    check(not [e for e in pg.errors if 'DIALOG' not in e],'errors '+str(pg.errors))
print('test_v125 OK',ok)
