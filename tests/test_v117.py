"""v117 (made-up data): botón ＋ Añadir estimado visible con la tarjeta cerrada; ✏️ Ajustar cuando ya hay."""
import os,copy,json
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;SH=os.path.join(ROOT,'shots')
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
with app(ROOT,state=copy.deepcopy(FIX),now='2026-10-30T08:00:00',new_look=True,expand=False) as pg:
    E=pg.evaluate;b=pg.locator('#wmhdr')
    check(b.is_visible() and 'Añadir estimado' in b.inner_text(),'añadir visible '+b.inner_text())
    pg.evaluate("document.getElementById('wmcard').scrollIntoView({block:'center'})");pg.screenshot(path=os.path.join(SH,'v117-anadir.png'))
    b.click();pg.wait_for_timeout(150);check('Añadir estimado' in pg.inner_text('dialog h2'),'título')
    pg.screenshot(path=os.path.join(SH,'v117-dialogo.png'))
    pg.fill('#wma','1240');pg.click('#wmsave');pg.wait_for_timeout(300)
    check(E("S.wm.est")==1240,'guardado');b=pg.locator('#wmhdr');check('Ajustar' in b.inner_text(),'ahora ajustar')
    pg.evaluate("document.getElementById('wmcard').scrollIntoView({block:'center'})");pg.wait_for_timeout(2500);pg.screenshot(path=os.path.join(SH,'v117-ajustar.png'))
    st=E("JSON.stringify(S)");check(not pg.errors,str(pg.errors))
with app(ROOT,state=json.loads(st),now='2026-11-05T07:30:00',new_look=True,expand=False) as pg:
    check(pg.locator('#wmg').is_visible(),'confirmación abierta');pg.screenshot(path=os.path.join(SH,'v117-confirmar.png'))
    check(not pg.errors,str(pg.errors))
print('test_v117 OK',ok)
