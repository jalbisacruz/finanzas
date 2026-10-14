"""Shared purchase with individual items (made-up data): python tests/test_items.py [--shots]"""
import os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,msg):
    global ok
    if not c: raise AssertionError(msg)
    ok+=1
def fill(pg,w,i,v,n=''):
    pg.fill(f'#itbox input[data-iw="{w}"][data-ii="{i}"][data-k="a"]',str(v))
    if n: pg.fill(f'#itbox input[data-iw="{w}"][data-ii="{i}"][data-k="n"]',n)
for lang in ['es','en']:
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate
    E("tab='mov';render();editP()");pg.wait_for_timeout(100)
    check(pg.locator('#itbox').count()==0,'collapsed by default')
    pg.fill('#tot','100');pg.click('#itog');pg.wait_for_timeout(50)
    check(pg.locator('#itbox input[data-iw="Carlos"][data-k="a"]').count()==2,'2 fields per person')
    fill(pg,'Carlos',0,10,'Shampoo');fill(pg,'Carlos',1,20);fill(pg,'Tony',0,10);fill(pg,'Yo',0,10)
    sh=E("D.shares");check(sh=={'Tony':35,'Carlos':42.5,'Yo':22.5},f'example shares {sh}')
    check(abs(sum(sh.values())-100)<1e-9,'sums exactly')
    br=pg.inner_text('#ibrk');check('$50.00' in br and '$42.50' in br and '$12.50' in br,br)
    check(E("document.querySelector('#dlg input[data-w=Carlos]').value")=='42.5','share field live')
    if '--shots' in sys.argv and lang=='es':pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','120-compartida.png'))
    if '--shots' in sys.argv and lang=='en':pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','120-compartida-en.png'))
    # + adds a third field
    pg.click('#itbox button[aria-label]:near(input[data-iw="Tony"])') if False else E("liveItems();D.items['Tony'].push({a:'',n:''});drawP()")
    check(pg.locator('#itbox input[data-iw="Tony"][data-k="a"]').count()==3,'+ adds field')
    # over -> red, blocked
    fill(pg,'Tony',2,80);pg.wait_for_timeout(30)
    check('$30.00' in pg.inner_text('#ibrk') and E("document.getElementById('psave').disabled"),'over blocked')
    n0=E("M().purchases.length");E("saveP()");check(E("M().purchases.length")==n0,'not saved when over')
    fill(pg,'Tony',2,'');pg.wait_for_timeout(30)
    # rounding: total 100.01 with odd split stays exact
    pg.fill('#tot','100.01');pg.wait_for_timeout(30);check(abs(sum(E("D.shares").values())-100.01)<1e-9,'cents exact')
    pg.fill('#tot','100');pg.wait_for_timeout(30)
    c0=E("calc(M())");e0=E("earned(M()).total");E("saveP()");p=E("M().purchases[0]")
    check(p['shares']=={'Tony':35,'Carlos':42.5,'Yo':22.5} and p['items']['Carlos'][0]=={'a':10,'n':'Shampoo'} and len(p['items']['Carlos'])==2,f'saved {p}')
    c1=E("calc(M())");check(abs(c1['tony']-c0['tony']-35)<1e-9 and abs(c1['carlos']-c0['carlos']-42.5)<1e-9,'feeds Por cobrar')
    check(abs(E("earned(M()).total")-e0)<1e-9 and abs(c1['inc']-c0['inc']+100)<1e-9,'not income; debit paid the 100')
    check(abs(E("spent(M()).by[SHARED_CAT]")-(70+22.5))<1e-9,'my part to budget category')
    # edit restores
    E(f"editP('{p['id']}')");pg.wait_for_timeout(50)
    check(pg.locator('#itbox').count()==1 and E("document.querySelector('#itbox input[data-iw=Carlos][data-ii=\"0\"][data-k=n]').value")=='Shampoo','edit restores items')
    E("dlg().close()")
    # equal mode with items, among Tony & Carlos & Yo: 100 - 10 = 90 / 3
    E("editP()");pg.fill('#tot','100');E("D.mode='eq';drawP()");pg.click('#itog');fill(pg,'Tony',0,10)
    check(E("D.shares")=={'Yo':30,'Tony':40,'Carlos':30},E("D.shares"))
    # manual mode untouched: mismatch indicator still works
    E("D.mode='manual';drawP()");check(pg.locator('#itbox').count()==0 and pg.locator('#splitbal').count()==1,'manual mode unchanged')
    E("dlg().close()")
    # simple purchase without items stays as before (no items field)
    E("editP()");pg.fill('#tot','80');pg.dispatch_event('#tot','change');E("saveP()")
    q=E("M().purchases[0]");check('items' not in q and q['shares']=={'Tony':40,'Carlos':20,'Yo':20},q)
    check([e for e in pg.errors if not e.startswith('DIALOG')]==[],pg.errors)
print(f'OK {ok} checks')
