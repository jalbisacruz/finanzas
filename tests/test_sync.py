"""Cloud sync safety with an in-memory fake Firebase (made-up data): python tests/test_sync.py"""
import json,os
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,msg):
    global ok
    if not c: raise AssertionError(msg)
    ok+=1
src=json.load(open(os.path.join(HERE,'fixture_real.json')))
def setup(pg_route_holder):pass
def run(cloud_doc,extra_init=''):
    docs={'users/u1/data/state':cloud_doc}
    init=f"localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',{json.dumps(json.dumps(docs))});"+extra_init
    return app(ROOT,state=src,init=init,routes={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE})
# 1) normal upgrade: backups are written before the v2 state replaces the v1 cloud doc
with run({'state':json.dumps(src),'updatedAt':1}) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    check(E("S.version")==2,'local migrated')
    E("save()");pg.wait_for_timeout(5000)
    log=E("__fs.log");st=E("__fs.docs['users/u1/data/state']")
    bks=[p for p in log if 'antes-de-v2' in p]
    check(len(bks)>=2,f'two antes-de-v2 backups (local + cloud v1): {log}')
    check(log.index('users/u1/data/state')>max(log.index(b) for b in bks),'backups written before the v2 state')
    check(st['ver']==2 and json.loads(st['state'])['version']==2,'cloud now v2')
    for b in bks:
        d=E(f"__fs.docs['{b}']");check(json.loads(d['state']).get('version') is None,'backup holds v1 data')
    check(E("localStorage.getItem('finanzas-mig-pending')") is None,'pending cleared')
    E("tab='cfg';render();loadBk()");pg.wait_for_timeout(500)
    check('antes de v2' in pg.inner_text('#bklist'),'backup listed with label')
    # retention never deletes antes-de-v2
    E("for(let i=0;i<25;i++)__fs.docs['users/u1/backups/2026-01-'+String(i+1).padStart(2,'0')+'_08-00-00']={state:'{}',createdAt:1000+i}")
    E("window.fbBackupNow()");pg.wait_for_timeout(1500)
    n=E("Object.keys(__fs.docs).filter(k=>k.startsWith('users/u1/backups/')&&!k.includes('antes-de-v2')).length")
    check(n==20,f'retention keeps 20 regular backups ({n})')
    check(all(E(f"!!__fs.docs['{b}']") for b in bks),'antes-de-v2 kept by retention')
    check([e for e in pg.errors if not e.startswith('DIALOG')]==[],pg.errors)
# 2) guard: cloud written by a newer app version -> this client refuses to save
newer=json.loads(json.dumps(src));newer['version']=3
with run({'state':json.dumps(newer),'updatedAt':9e12,'ver':3}) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    E("save()");pg.wait_for_timeout(3000)
    st=E("__fs.docs['users/u1/data/state']")
    check(st['ver']==3 and 'users/u1/data/state' not in E("__fs.log"),'newer cloud not overwritten')
    check(any('versión más nueva' in e for e in pg.errors),'user told to reload')
    check(E("S.version")==2,'local not replaced by unknown format')
# 3) v1 cloud doc newer than local (written by an old client) -> migrated on arrival
old=json.loads(json.dumps(src));old['months']['2026-10']['income'][0]['amount']=4321.0;old['updatedAt']=5
with run({'state':json.dumps(old),'updatedAt':5}) as pg:
    E=pg.evaluate;pg.wait_for_timeout(2000)
    check(E("S.version")==2 and E("debE(L()).amount")==4321,'newer v1 cloud data applied and migrated')
print(f'OK {ok} checks')
