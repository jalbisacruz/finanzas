"""v109 (made-up data only): el enlace de Tony/Carlos sale en español aunque la app de Joe esté en inglés; botón ES/EN en su página."""
import os,json,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
SH=os.path.join(ROOT,'shots')
S=copy.deepcopy(FIX);S['cur']='2026-10'
S['months']['2026-10']={'income':[{'id':'i1','name':'Débito','amount':2000,'role':'debit'}],'cards':[],'bills':[{'id':'b1','name':'Hogar','amount':600,'fixed':True}],
 'purchases':[{'id':'p1','store':'Publix Prueba','date':'2026-10-04','total':120,'mode':'fam','shares':{'Tony':60,'Carlos':30,'Yo':30},'method':'deb'},
  {'id':'p2','store':'Aldi Prueba','date':'2026-10-11','total':40,'mode':'fam','shares':{'Tony':20,'Carlos':10,'Yo':10},'method':'deb'}],'personal':[],'events':[]}
DOCS={}
with app(ROOT,now='2026-10-24T13:00:00',state=S,routes=R,init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('finanzas-lang','en');") as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    E("()=>{LANG='en';unlocked=true;try{closeLock()}catch(e){};document.body.classList.remove('locked');tab='cfg';render()}")
    check(E("LANG")=='en','Joe app in English')
    for w in ['Tony','Carlos']:
        pg.check('#lnkon-'+w);pg.wait_for_timeout(600)
    L=E("S.links");fs=E("window.__fs.docs")
    for w in ['Tony','Carlos']:
        d=fs['shares/'+L[w]['t']];DOCS[w]=d
        check(d['lang']=='es','%s doc published in Spanish'%w)
        check(d['months'][0]['label'].startswith('Oct'),'label')
    check(E("LANG")=='en','Joe app language restored')
    check(not [x for x in pg.errors if not x.startswith('DIALOG')],pg.errors)
TOK='AAAAAAAAAAAAAAAAAAAAAA'
for w in ['Tony','Carlos']:
  # simulate an old doc published in English: page must still default to Spanish
  D={**DOCS[w],'lang':'en','updatedAt':1761940000000}
  with app(ROOT,routes=R,now='2026-10-24T13:00:00',init="window.__SHARE_DOC=%s;"%json.dumps(D),width=390,height=844) as pg:
    E=pg.evaluate;base='/'.join(pg.url.split('/')[:3])
    pg.goto(base+'/v.html?t='+TOK);pg.wait_for_timeout(600)
    check(E("document.documentElement.lang")=='es','%s default es'%w)
    check(pg.locator('#vlang').count()==1 and 'English' in pg.inner_text('#vlang'),'toggle shows English')
    if w=='Tony':pg.screenshot(path=os.path.join(SH,'v109-tony-es.png'),full_page=False)
    else:pg.screenshot(path=os.path.join(SH,'v109-carlos-es.png'),full_page=False)
    pg.click('#vlang');pg.wait_for_timeout(200)
    check(E("document.documentElement.lang")=='en' and 'Español' in pg.inner_text('#vlang'),'switched to en')
    check(E("DOC.months[0].label").startswith('Oct') and 'Oct 2026' in pg.inner_text('h1'),'month relabeled')
    if w=='Tony':pg.screenshot(path=os.path.join(SH,'v109-tony-en.png'),full_page=False)
    pg.reload();pg.wait_for_timeout(600);check(E("document.documentElement.lang")=='en','choice remembered')
    pg.click('#vlang');pg.wait_for_timeout(200);check(E("document.documentElement.lang")=='es','back to es')
    pg.goto(base+'/v.html?t='+TOK+'&lang=en');pg.wait_for_timeout(600);check(E("document.documentElement.lang")=='en','?lang=en')
    check(not [x for x in pg.errors if not x.startswith('DIALOG')],pg.errors)
print('test_v109 OK',ok)
