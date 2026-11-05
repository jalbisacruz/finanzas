"""v126 (made-up data): diseño de las dos líneas de cheques en la caja azul."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
S=copy.deepcopy(FIX);S['wm']={'est':226.51,'paid':{},'chk':{}}
for c in S['checks']:
    if c['status']=='pending': c['date']='2026-11-05';c['amount']=531.60
with app(ROOT,now='2026-11-04T08:45:00',state=S,new_look=True) as pg:
    E=pg.evaluate
    assert E("CODE_V")>='v126'
    t=pg.inner_text('#herocard');print(t)
    assert t.index('YoWash')<t.index('Walmart')
    assert 'cada jueves' in t and 'jueves alternos' in t and '$531.60' in t and '$226.51' in t
    assert pg.locator('#chkadj').count()==1 and pg.locator('#wmadj').count()==1
    for s in ('#chkadj','#wmadj'):
        b=pg.locator(s).bounding_box();assert b['height']<50
    pg.locator('#herocard').screenshot(path=os.path.join(SH,'v126-caja-azul.png'))
    pg.set_viewport_size({'width':340,'height':800});pg.wait_for_timeout(150)
    pg.locator('#herocard').screenshot(path=os.path.join(SH,'v126-caja-azul-estrecha.png'))
    pg.click('#wmadj');pg.wait_for_timeout(150);assert 'Siguiente' in pg.inner_text('dialog');E("dlg().close()")
    pg.click('#chkadj');pg.wait_for_timeout(150);assert pg.locator('#chk').count()==1
    assert not [e for e in pg.errors if 'DIALOG' not in e],pg.errors
print('test_v126 OK')
