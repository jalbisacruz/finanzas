"""v118 (made-up data): «Dinero de terceros» con monto que empieza en $1 no rompe la fila; filas responsive a 390px."""
import os,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;SH=os.path.join(ROOT,'shots')
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
for amt in (152,1786.5,52):
  with app(ROOT,state=copy.deepcopy(FIX),now='2026-10-30T08:00:00',new_look=True,expand=True) as pg:
    E=pg.evaluate;pg.set_viewport_size({'width':390,'height':844})
    E(f"heldPend=()=>{amt};BAL_OPEN=true;render()");pg.wait_for_timeout(200);E("document.getElementById('balheld').scrollIntoView({block:'center'})")
    r=pg.locator('#balheld');check(r.count()==1,'balheld')
    t=r.inner_text().replace('\n',' ');exp=E(f"f({amt})")
    check(t.split()[-1]==exp and 'Tony' not in t,'fila limpia '+t)
    sp=r.locator('span');a=sp.nth(0).bounding_box();b=sp.nth(1).bounding_box()
    check(abs(a['y']-b['y'])<12 and b['x']>a['x'],'mismo renglón %s %s'%(a,b))
    check(E("document.getElementById('balcard').scrollWidth<=document.getElementById('balcard').clientWidth+1"),'sin overflow')
    pg.screenshot(path=os.path.join(SH,f'v118-terceros-{int(amt)}.png'));check(not pg.errors,str(pg.errors))
print('test_v118 OK',ok)
