"""v114 (actualizado en v116: Walmart quincenal) (made-up data): alertas de presupuesto en 1 línea, atajos por pestaña, secciones cerradas, Walmart."""
import os,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;SH=os.path.join(ROOT,'shots')
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
S=copy.deepcopy(FIX);cat=S['cats'][0];S['budgets']={cat:50};S.setdefault('cats',[])
S['wm']={'weeks':{'2026-10-30':480},'paid':{}}
with app(ROOT,now='2026-10-30T18:00:00',state=S,expand=False,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    check(E("wmAmt('2026-11-05')")==480,'nov5 = 1 semana')
    check(E("wmAmt('2026-11-19')")==960,'nov19 = 2 semanas estimadas')
    check(E("wmPaydays('2026-11-01','2026-11-30')")==['2026-11-05','2026-11-19'],'jueves cada 2')
    check(E("wmNext()")=='2026-11-05','next')
    E("tab='ini';render()");pg.wait_for_timeout(200)
    check(pg.locator('#scrow .scb').count()==5,'atajos hoy')
    check(pg.locator('.card.budw').count()==0,'sin tarjetas grandes de presupuesto')
    if E("v114Bud().length"): check(pg.locator('#budchip').count()==1,'chip')
    check(E("[...document.querySelectorAll('#v>.card.colb')].every(c=>c.classList.contains('col'))"),'todo cerrado')
    pg.screenshot(path=os.path.join(SH,'v114-hoy.png'),full_page=True)
    if E("v114Bud().length"):
        pg.click('#budchip');pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'v114-presupuesto.png'));E("dlg().close()")
    pg.click('#wmcard>h2');pg.wait_for_timeout(150);pg.locator('#wmcard').screenshot(path=os.path.join(SH,'v114-walmart.png'))
    pg.click('#sc-ini-2');pg.wait_for_timeout(150);pg.fill('#wma','500');pg.click('#wmsave');pg.wait_for_timeout(150)
    check(E("S.wm.est")==500,'guardar estimado (v116: cheque quincenal)')
    E("if(!S.months['2026-11'])S.months['2026-11']=JSON.parse(JSON.stringify({...S.months[S.cur],purchases:[],personal:[],events:[]}))")
    P=E("planNums()");check(P['k']=='2026-11' and P.get('wm')==1000,'plan nov suma walmart '+str(P.get('wm')))
    pg.wait_for_timeout(3000)
    for t in ['mov','rep','cfg']:
        E(f"tab='{t}';render()");pg.wait_for_timeout(200)
        check(pg.locator('#scrow .scb').count()>=4,'atajos '+t)
        if t=='rep': check(pg.locator('#rescard').count()==0,'sin Resumen repetido')
        pg.screenshot(path=os.path.join(SH,f'v114-{t}.png'),full_page=True)
    check(not pg.errors,str(pg.errors))
with app(ROOT,now='2026-11-05T18:00:00',state=S) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500);d0=E("debE(L()).amount")
    pg.wait_for_selector('#wmconf');pg.wait_for_timeout(150);pg.fill('#wmg','470');pg.click('#wmgok');pg.wait_for_timeout(150)
    check(E("S.wm.paid['2026-11-05']")==470 and abs(E("debE(L()).amount")-d0-470)<.01,'deposito walmart')
    check(E("wmNext()")=='2026-11-19','siguiente')
    check(not pg.errors,str(pg.errors))
print('test_v114 OK',ok)
