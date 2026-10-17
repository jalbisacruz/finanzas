"""v85: compras compartidas en Movimientos se pueden tocar para editarlas (fecha, monto, tarjeta); saldos correctos (made-up data)"""
import os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
with app(ROOT,now='2026-10-17T16:40:00',expand=False,width=390,height=844) as pg:
    pg.on('dialog',lambda d:d.accept());E=pg.evaluate
    E("""()=>{const m=L();m.cards=[{id:'b1',name:'BOA 1',amount:30.41},{id:'ch',name:'Chase',amount:100}];
      m.purchases.unshift({id:'al1',store:'Aldi',date:'2025-10-17',total:14.72,mode:'fam',who:['Yo','Tony','Carlos'],shares:{Yo:3.68,Tony:7.36,Carlos:3.68},method:'card:BOA 1',at:1});save();render()}""")
    snap=lambda:E("({deb:debE(L()).amount,boa:L().cards.find(c=>c.name==='BOA 1').amount,ch:L().cards.find(c=>c.name==='Chase').amount,tony:calc(L()).tony,carlos:calc(L()).carlos,carlosDue:calc(L()).carlosDue,tonyDue:calc(L()).tonyDue,n:L().purchases.length})")
    s0=snap()
    E("()=>{tab='mov';OPS_ALLM=true;render()}");pg.wait_for_timeout(150)
    row=pg.locator('#movcard [data-p="al1"]');check(row.count()==1 and '✏️' in row.inner_text(),'shared purchase row is tappable in Movimientos')
    check('oct 2025' in row.inner_text() or '2025' in row.inner_text(),'odd year visible')
    row.click();pg.wait_for_timeout(150);check(E("dlg().open") and E("D.id")=='al1' and 'Editar compra' in pg.inner_text('#dlg'),'opens the purchase editor')
    di=pg.locator('#dlg input[type=date]');check(di.count()==1,'editor has a date field')
    if SH:pg.screenshot(path=os.path.join(ROOT,'shots','150-editar-compra-desde-movimientos.png'))
    di.fill('2026-10-17');di.dispatch_event('change');di.dispatch_event('input');pg.wait_for_timeout(50);pg.click('#psave');pg.wait_for_timeout(200)
    s1=snap();p=E("L().purchases.find(p=>p.id==='al1')")
    check(p['date']=='2026-10-17' and not E("dlg().open"),'date saved %s'%p['date'])
    check(s1==s0,'only date changed: balances and Tony/Carlos unchanged %s %s'%(s0,s1))
    t=pg.locator('#movcard [data-p="al1"]').inner_text();check('17 oct' in t and '2025' not in t,'row shows 2026 date '+t)
    # cambia monto y tarjeta: se revierte en BOA 1 y se aplica en Chase; Tony/Carlos recalculan
    pg.locator('#movcard [data-p="al1"]').click();pg.wait_for_timeout(150)
    E("()=>{D.total=20;D.method='card:Chase';if(typeof recomputeEq==='function')recomputeEq();drawP()}");pg.wait_for_timeout(50);pg.click('#psave');pg.wait_for_timeout(200)
    s2=snap();p=E("L().purchases.find(p=>p.id==='al1')")
    check(abs(s2['boa']-(s0['boa']-14.72))<0.005 and abs(s2['ch']-(s0['ch']+20))<0.005 and s2['deb']==s0['deb'],'reverse+reapply on cards %s'%s2)
    sh=p['shares'];check(abs(sum(sh.values())-20)<0.01,'shares recomputed %s'%sh)
    check(abs((s2['tony']-s0['tony'])-(sh['Tony']-7.36))<0.01 and abs((s2['carlos']-s0['carlos'])-(sh['Carlos']-3.68))<0.01,'Tony/Carlos recalc')
    # a débito: el débito baja el total
    pg.locator('#movcard [data-p="al1"]').click();pg.wait_for_timeout(150)
    E("()=>{D.method='deb';drawP()}");pg.click('#psave');pg.wait_for_timeout(200);s3=snap()
    check(abs(s3['deb']-(s0['deb']-20))<0.005 and abs(s3['ch']-s0['ch'])<0.005,'moved to debit %s'%s3)
    # borrar desde el editor revierte
    pg.locator('#movcard [data-p="al1"]').click();pg.wait_for_timeout(150);pg.click('#dlg button.del');pg.wait_for_timeout(200);s4=snap()
    check(s4['n']==s0['n']-1 and abs(s4['deb']-s0['deb'])<0.005,'delete from editor reverses %s'%s4)
    # Ver todas las compras: también abre el editor
    E("()=>{OPS_ALLP=true;render()}");pg.wait_for_timeout(100);r=pg.locator('#comcard .hrow').first;r.click();pg.wait_for_timeout(150)
    check(E("dlg().open") and 'Editar compra' in pg.inner_text('#dlg'),'Ver todas las compras row opens editor');E("dlg().close()")
    check(not [e for e in pg.errors if 'DIALOG' not in e],pg.errors)
print('test_v85 OK',ok)
