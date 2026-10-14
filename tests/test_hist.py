"""Shared purchases history (made-up data): python tests/test_hist.py [--shots]"""
import os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,msg):
    global ok
    if not c: raise AssertionError(msg)
    ok+=1
ADD="""S.months['2026-10'].purchases.push({id:'pi1',store:'Walmart',date:'2026-10-12',total:100,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',
 shares:{Tony:35,Carlos:42.5,Yo:22.5},items:{Carlos:[{a:10,n:'Shampoo'},{a:20}],Tony:[{a:10,n:'Snacks'}],Yo:[{a:10}]}});tab='mov';render()"""
for lang in ['es','en']:
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate;E(ADD);pg.wait_for_timeout(80)
    before=E("JSON.stringify(S.months)")
    ids=E("[...document.querySelectorAll('.hrow')].map(e=>e.dataset.id)")
    check(len(ids)==3 and ids[0]=='pi1','current month newest first %s'%ids)
    check(E("[...document.querySelectorAll('.hrow')].map(e=>e.querySelector('.muted').textContent)")[1].startswith(('9 ','Oct 9')),'aldi second')
    t=pg.locator('.hrow[data-id="pi1"]').inner_text()
    check('Tony' in t and '$35.00' in t and '$42.50' in t and '$22.50' in t and '$100.00' in t,t)
    check(pg.locator('.hexp').count()==1,'indicator only with items')
    pg.click('.hexp');pg.wait_for_timeout(50)
    check(not E("dlg().open"),'indicator does not open edit')
    d=pg.locator('.hdet').inner_text()
    check('Shampoo' in d and 'Snacks' in d and '$50.00' in d and '$30.00 + $12.50' in d,d)
    if '--shots' in sys.argv:
        pg.locator('#comcard').scroll_into_view_if_needed()
        n='121-historial-compartidas'+('' if lang=='es' else '-en')+'.png'
        y=E("document.getElementById('comcard').getBoundingClientRect().top+scrollY")
        h=E("[...document.querySelectorAll('.hrow')].at(-1).getBoundingClientRect().bottom+scrollY")
        pg.screenshot(path=os.path.join(ROOT,'shots',n),full_page=True,clip={'x':0,'y':y-4,'width':390,'height':h-y+12})
    pg.click('.hrow[data-id="pi1"] .tot');pg.wait_for_timeout(50)
    check(E("dlg().open && D.id==='pi1'"),'row tap opens edit');E("dlg().close()")
    E("hRange='prev';render()");ids=E("[...document.querySelectorAll('.hrow')].map(e=>e.dataset.id)")
    check(len(ids)==1,'previous months only');check(pg.locator('#movcard').count()==1,'movlist ok')
    sid=ids[0];pg.click(f'.hrow[data-id="{sid}"] .tot');pg.wait_for_timeout(50)
    check(E("dlg().open && S.cur==='2026-09' && D.id==='%s'"%sid),'edit past month');E("dlg().close()");pg.wait_for_timeout(30)
    check(E("S.cur")=='2026-10','month restored')
    E("hRange='all';render()");check(pg.locator('.hrow').count()==4,'all months')
    check(E("JSON.stringify(S.months)")==before,'no data changes')
    check(not pg.errors,pg.errors)
print('OK',ok)
