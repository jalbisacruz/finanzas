"""v106 (made-up data, fake in-memory Firestore): la laptop con datos viejos NUNCA sobrescribe la nube más nueva."""
import os,sys,json,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
SH=os.path.join(ROOT,'shots');SD='users/u1/data/state'
base=copy.deepcopy(FIX);base['updatedAt']=1760000000000
iph=copy.deepcopy(base);iph['updatedAt']=1761200000000;iph['marker']='IPHONE'
for c in iph['checks']:c['status']='deposited'
def run(local,cloud,extra='',lang='es',now='2026-10-24T09:00:00'):
    docs={SD:cloud} if cloud else {}
    init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps(docs))+extra
    if lang=='en':init+="localStorage.setItem('finanzas-lang','en');"
    return app(ROOT,state=local,routes=R,init=init,now=now,lang=lang)
cdoc=lambda st,ver=2:{'state':json.dumps(st),'updatedAt':st['updatedAt'],'ver':ver}
cloudSt=lambda E:json.loads(E("__fs.docs['%s'].state"%SD))
noerr=lambda pg:check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
# A) Joe's laptop: old local data, pending check already deposited on the iPhone, slow network; PIN unlock right away
with run(base,cdoc(iph),"window.__snapDelay=3500;window.__getDelay=3500;") as pg:
    E=pg.evaluate;E("unlock()");pg.wait_for_timeout(26000)
    c=cloudSt(E);check(c.get('marker')=='IPHONE' and c['updatedAt']==iph['updatedAt'],'cloud not overwritten')
    check(E("S.marker")=='IPHONE' and E("S.updatedAt")==iph['updatedAt'],'laptop loaded the cloud')
    check(E("S.checks.filter(c=>c.auto&&c.depositedOn).length")==0,'no auto-deposit on stale data')
    check(E("__fs.docs['%s'].ver"%SD)==3,'cloud stamped ver 3 %s %s'%(E('__fs.log'),E('[window.__syncReady,localStorage.getItem("finanzas-sync-dirty")]')))
    check(E("localStorage.getItem('finanzas-sync-base')")==str(iph['updatedAt']) and E("localStorage.getItem('finanzas-sync-dirty')") is None,'base/dirty')
    check(pg.locator('#syncconf').count()==0,'no prompt when nothing local');noerr(pg)
# B) device whose local data looks newer but was never synced with this cloud (no base) -> ask, default cloud (Escape)
lap=copy.deepcopy(base);lap['updatedAt']=1761900000000;lap['marker']='LAPTOP'
for lang in ['es','en']:
  with run(lap,cdoc(iph),lang=lang) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    check(pg.locator('#syncconf').is_visible(),'conflict prompt');check(cloudSt(E).get('marker')=='IPHONE','nothing pushed while asking')
    t=pg.inner_text('#syncconf');check(('Usar la nube' in t) if lang=='es' else ('Use the cloud' in t),t)
    check(E("document.activeElement&&document.activeElement.id")=='sc-cloud','cloud is the default')
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v106-conflicto.png'))
    pg.keyboard.press('Escape');pg.wait_for_timeout(800)
    check(E("S.marker")=='IPHONE' and cloudSt(E).get('marker')=='IPHONE','Escape = cloud')
    bk=[k for k in E("Object.keys(__fs.docs)") if 'antes-de-nube' in k];check(len(bk)==1 and json.loads(E("__fs.docs['%s'].state"%bk[0]))['marker']=='LAPTOP','laptop copy kept in backups')
    noerr(pg)
# C) choose this device explicitly -> replaces cloud, cloud copy kept
with run(lap,cdoc(iph)) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);pg.click('#sc-local');pg.wait_for_timeout(1500)
    check(cloudSt(E).get('marker')=='LAPTOP' and E("S.marker")=='LAPTOP','local chosen')
    bk=[k for k in E("Object.keys(__fs.docs)") if 'antes-de-dispositivo' in k];check(len(bk)==1 and json.loads(E("__fs.docs['%s'].state"%bk[0]))['marker']=='IPHONE','cloud copy kept');noerr(pg)
# D) normal life: in sync -> local edit pushes; remote edit (no local changes) is applied on focus
with run(iph,cdoc(iph,3)) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200);E("S.marker='EDIT';save()");pg.wait_for_timeout(2500)
    check(cloudSt(E).get('marker')=='EDIT','local edit uploaded');u=E("S.updatedAt");check(E("localStorage.getItem('finanzas-sync-base')")==str(u),'base updated')
    r=cloudSt(E);r['marker']='FROM-PHONE';r['updatedAt']=u+1000;E("d=>{__fs.docs['%s']=d}"%SD,{'state':json.dumps(r),'updatedAt':r['updatedAt'],'ver':3})
    E("dispatchEvent(new Event('focus'))");pg.wait_for_timeout(800);check(E("S.marker")=='FROM-PHONE' and pg.locator('#syncconf').count()==0,'remote applied silently')
    # F) both changed: phone writes, this device edits before seeing it -> no overwrite, prompt
    r['marker']='PHONE2';r['updatedAt']=u+5000;E("d=>{__fs.docs['%s']=d}"%SD,{'state':json.dumps(r),'updatedAt':r['updatedAt'],'ver':3})
    E("S.marker='LOCAL2';save()");pg.wait_for_timeout(2500)
    check(cloudSt(E).get('marker')=='PHONE2' and pg.locator('#syncconf').is_visible(),'conflict, phone data kept');pg.click('#sc-cloud');pg.wait_for_timeout(800)
    check(E("S.marker")=='PHONE2','cloud chosen');noerr(pg)
# E) offline: edits stay local, nothing written blindly
with run(iph,cdoc(iph,3)) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200);E("window.__offline=true;S.marker='OFF';save()");pg.wait_for_timeout(2500)
    check(cloudSt(E).get('marker')=='IPHONE' and E("localStorage.getItem('finanzas-sync-dirty')")=='1','offline: no write, still pending')
    E("window.__offline=false;dispatchEvent(new Event('online'))");pg.wait_for_timeout(2500);check(cloudSt(E).get('marker')=='OFF','uploaded when back online');noerr(pg)
# G) old cached app (v105 sync.js, CLIENT_V 2) refuses to write once the cloud has ver 3
import subprocess
old=subprocess.run(['git','-C',ROOT,'show','pre-v106:sync.js'],capture_output=True,text=True).stdout
check('CLIENT_V=2' in old,'old code')
R2=dict(R);R2['**/sync.js']=old
with app(ROOT,state=lap,routes=R2,init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps({SD:cdoc(iph,3)}))) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200);E("save()");pg.wait_for_timeout(2500)
    check(cloudSt(E).get('marker')=='IPHONE' and any('versión más nueva' in e for e in pg.errors),'old cached app blocked')
print('test_v106 OK',ok)
