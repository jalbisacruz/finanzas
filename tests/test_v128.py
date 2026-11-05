"""v128: «Pendiente»; botones ＋ Añadir / Ajustar; sin Cobrado; 4:00 AM."""
import os,copy
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)

# Ambos pendientes → «＋ Añadir»
S=copy.deepcopy(FIX)
S['wm']={'est':196.79,'paid':{'2026-11-05':226.51},'chk':{},'anchor':'2026-11-05'}
S['checks']=[c for c in S['checks'] if c.get('status')!='pending']
S['checks'].append({'id':'yw1','amount':531.60,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05'})
S['checks'].append({'id':'yw2','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'})

with app(ROOT,now='2026-11-05T10:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    assert E("CODE_V")=='v128'
    assert E('S.wm.chk["2026-11-19"]')==0
    t=pg.inner_text('#herocard');print('PEND',t)
    assert 'Pendiente por definir' not in t and 'Cobrado' not in t,t
    assert t.count('Pendiente')>=2 and '19/11' in t and '12/11' in t,t
    assert '＋ Añadir' in pg.inner_text('#chkadj') and '＋ Añadir' in pg.inner_text('#wmadj')
    assert 'Ajustar' not in pg.inner_text('#chkadj') and 'Ajustar' not in pg.inner_text('#wmadj')
    pg.locator('#herocard').screenshot(path=os.path.join(SH,'v128-walmart-pendiente.png'))

# Con montos → «Ajustar»
S3=copy.deepcopy(FIX)
S3['wm']={'est':226.51,'paid':{},'chk':{},'anchor':'2026-11-05'}
for c in S3['checks']:
    if c['status']=='pending': c['date']='2026-11-12';c['amount']=531.60;c.pop('amtPending',None)
with app(ROOT,now='2026-11-05T10:00:00',state=S3,new_look=True) as pg:
    pg.wait_for_timeout(500)
    t=pg.inner_text('#herocard');print('AMT',t)
    assert 'Ajustar' in pg.inner_text('#chkadj') and 'Ajustar' in pg.inner_text('#wmadj')
    assert '＋' not in pg.inner_text('#chkadj') and '＋' not in pg.inner_text('#wmadj')
    pg.locator('#herocard').screenshot(path=os.path.join(SH,'v128-con-montos.png'))

S2=copy.deepcopy(FIX)
S2['wm']={'est':226.51,'paid':{},'chk':{},'anchor':'2026-11-05'}
for c in S2['checks']:
    if c['status']=='pending': c['date']='2026-11-05';c['amount']=531.60
with app(ROOT,now='2026-11-05T03:50:00',state=S2,new_look=True) as pg:
    pg.wait_for_timeout(2500)
    assert pg.locator('#wmconf').count()==0 and pg.locator('#chknote').count()==0
with app(ROOT,now='2026-11-05T04:05:00',state=S2,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);E('autoDeposit()');pg.wait_for_timeout(300)
    assert pg.locator('#wmconf').count()==1 and pg.locator('#chknote').count()==1
    pg.screenshot(path=os.path.join(SH,'v128-preguntas-4am.png'))
    pg.click('#wmgok');pg.wait_for_timeout(400)
    t=pg.inner_text('#herocard');print('AFTER',t)
    assert '19/11' in t and t.count('Pendiente')>=2 and 'Cobrado' not in t,t
    assert '＋ Añadir' in pg.inner_text('#wmadj')
    assert E('wmProj().a')==0
    pg.locator('#herocard').screenshot(path=os.path.join(SH,'v128-despues-confirmar.png'))
    assert not [e for e in pg.errors if 'DIALOG' not in e],pg.errors
print('test_v128 OK')
