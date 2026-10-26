"""v110 (made-up data, fake Firestore): a purchase Arianna sends and Joe saves can't vanish silently.
 Repro: phone saves inbox item -> pushed -> another device puts back older cloud (same old updatedAt) -> phone reconcile used cloud -> purchase gone AND inbox doc already deleted."""
import os,sys,json,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
SD='users/u1/data/state';TT='TonyTokenAAAAAAAAAAAAA';IB='shares/%s/inbox/ar1'%TT
old=copy.deepcopy(FIX);old['updatedAt']=1761346740000;old['links']={'Tony':{'t':TT,'on':True}}
ITEM={'by':'Arianna','store':'Publix (prueba)','date':'2026-10-14','total':42,'at':1}
cdoc=lambda st:{'state':json.dumps(st),'updatedAt':st['updatedAt'],'ver':3}
def run(docs,extra=''):
    init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('finanzas-sync-base','%d');localStorage.setItem('__fsdocs',%s);"%(old['updatedAt'],json.dumps(json.dumps(docs)))+extra
    return app(ROOT,state=old,routes=R,init=init,now='2026-10-26T12:00:00')
has=lambda E:E("Object.values(S.months).some(m=>m.purchases.some(p=>p.paidBy==='Arianna'))")
def accept(pg,E):
    E("()=>inboxLoad(true)");pg.wait_for_timeout(300);E("id=>inboxOpen(id)",'ar1');pg.wait_for_timeout(80);E("saveP()");pg.wait_for_timeout(2500)
# 1) overwrite by older cloud after a successful push
with run({SD:cdoc(old),IB:ITEM}) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);accept(pg,E)
    check(has(E),'saved locally');check('Arianna' in E("__fs.docs['%s'].state"%SD),'pushed')
    E("d=>{__fs.docs['%s']=d}"%SD,cdoc(old));E("dispatchEvent(new Event('focus'))");pg.wait_for_timeout(1000)
    lost=not has(E);inb=E("!!__fs.docs['%s']"%IB)
    print('after older cloud: purchase lost=',lost,' inbox doc still there=',inb)
    E("()=>{inboxAt=0;return inboxLoad(true)}");pg.wait_for_timeout(400)
    check(not lost or E("INBOX.some(x=>x.id==='ar1')"),'BUG: purchase gone and not back in 📥')
    if '--shots' in sys.argv and lost:
        E("()=>inboxList()");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(ROOT,'shots','v110-vuelve-al-buzon.png'))
# 2) not hidden while present; deleting the purchase removes the inbox doc
with run({SD:cdoc(old),IB:ITEM}) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);accept(pg,E)
    E("()=>{inboxAt=0;return inboxLoad(true)}");pg.wait_for_timeout(400);check(not E("INBOX.some(x=>x.id==='ar1')"),'saved purchase not shown again in 📥')
    p=E("Object.values(S.months).flatMap(m=>m.purchases).find(p=>p.paidBy==='Arianna')");check(p.get('inboxId')=='ar1','tagged')
    if '--shots' in sys.argv:
        E("k=>{S.cur=k;tab='ini';render()}",p['date'][:7]);pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(ROOT,'shots','v110-guardada.png'))
    E("([k,id])=>{S.cur=k;editP(id);delP()}",[p['date'][:7],p['id']]);pg.wait_for_timeout(300)
    check(not has(E) and not E("!!__fs.docs['%s']"%IB),'deleting the purchase removes it from the inbox')
# 3) offline save, then other device changes cloud -> conflict -> default cloud keeps Arianna's purchase
with run({SD:cdoc(old),IB:ITEM}) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);E("window.__offline=true");accept(pg,E);E("window.__offline=false")
    o2=copy.deepcopy(old);o2['updatedAt']+=5000;o2['marker']='OTRO';E("d=>{__fs.docs['%s']=d}"%SD,cdoc(o2))
    E("dispatchEvent(new Event('focus'))");pg.wait_for_timeout(1000)
    if pg.locator('#syncconf').count():pg.keyboard.press('Escape');pg.wait_for_timeout(2500)
    E("()=>{inboxAt=0;return inboxLoad(true)}");pg.wait_for_timeout(400)
    check(E("S.marker")=='OTRO','cloud used');check(has(E) or E("INBOX.some(x=>x.id==='ar1')"),'BUG: conflict dropped purchase and inbox')
print('test_v110 OK',ok)
