"""v143 (DATOS DE EJEMPLO): «Ya se depositó» solo el día anterior al cobro programado.
python tests/test_v143.py
"""
import os,copy
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg):
    pg.evaluate("""()=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';document.body.append(w)}""")

def base(pending='2026-11-12', extra_months=None):
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1000,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],
      'events':[{'id':'e05','type':'check','date':'2026-11-05','amount':500,'checkId':'c05','desc':'Cheque 5 nov'}],'tonyBase':0}
    S['checks']=[{'id':'c05','amount':500,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05'},
                 {'id':'c12','amount':0,'amtPending':True,'date':pending,'status':'pending'}]
    S['wm']={'est':200,'chk':{},'paid':{}}
    if extra_months:
        for k,m in extra_months.items():
            S['months'][k]=m
    return S

# date helpers: calendar NY, not 24h/UTC; month, year, DST
with app(ROOT,now='2026-11-11T10:00:00',state=base(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    check(E('CODE_V')=='v143','ver')
    check(E("ywPrevDay('2026-11-12')")=='2026-11-11','prev of Thu 12 is Wed 11')
    check(E("ywPrevDay('2026-10-01')")=='2026-09-30','month boundary')
    check(E("ywPrevDay('2026-01-01')")=='2025-12-31','year boundary')
    check(E("ywPrevDay('2026-03-12')")=='2026-03-11','DST spring week')
    check(E("ywPrevDay('2026-11-05')")=='2026-11-04','DST fall week')
    # today in America/New_York around DST transitions (same calendar day)
    check(E("ywTodayNY(new Date('2026-11-01T06:30:00-04:00'))")=='2026-11-01' and E("ywTodayNY(new Date('2026-11-01T06:30:00-05:00'))")=='2026-11-01','DST fall still Nov 1')
    check(E("ywTodayNY(new Date('2026-03-08T01:30:00-05:00'))")=='2026-03-08' and E("ywTodayNY(new Date('2026-03-08T08:00:00-04:00'))")=='2026-03-08','DST spring still Mar 8')
    # 24h-ms trap: late Wed still Wed, just after midnight Thu is payday (not prev day)
    check(E("ywTodayNY(new Date('2026-11-11T23:30:00-05:00'))")=='2026-11-11','late Wed')
    check(E("ywTodayNY(new Date('2026-11-12T00:15:00-05:00'))")=='2026-11-12','just after midnight Thu')

# Tuesday hidden, Wednesday visible
with app(ROOT,now='2026-11-10T16:00:00',state=base(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(E("pendingCheck().date")=='2026-11-12' and pg.locator('#ywearly').count()==0,'Tuesday hidden')
    check(E("ywEarlyOk(pendingCheck())") is False,'Tue not eligible')
    mark(pg);pg.locator('#herocard').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v143-yowash-martes-oculto.png'))
    # manual call on Tuesday must not credit
    deb=E("debE(L()).amount")
    E("""()=>{document.body.insertAdjacentHTML('beforeend','<input id="ywea" value="512.34"><input id="ywed" value="2026-11-10">');
      ywEarlyDlg();ywEarlySave('c12')}""");pg.wait_for_timeout(150)
    check(E("S.checks.find(c=>c.id==='c12').status")=='pending' and abs(E("debE(L()).amount")-deb)<0.001,'Tue handler no credit')

with app(ROOT,now='2026-11-11T10:00:00',state=base(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#ywearly').count()==1 and 'Ya se depositó' in pg.inner_text('#herocard'),'Wednesday visible')
    check(E("ywEarlyOk(pendingCheck())") is True,'Wed eligible')
    mark(pg);pg.locator('#herocard').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v143-yowash-miercoles-visible.png'))
    # unknown estimate still on day before: empty prefill, must enter positive
    # (this fixture has prior 500 so prefill exists; separate case below)
    pg.click('#ywearly');pg.wait_for_timeout(150)
    pg.fill('#ywea','512.34');pg.click('#yweok');pg.wait_for_timeout(300)
    c=E("S.checks.find(x=>x.id==='c12')")
    check(c['status']=='deposited' and c['date']=='2026-11-12' and c['depositedOn']=='2026-11-11','identity unchanged')
    check(E("pendingCheck().date")=='2026-11-19','next pending 19')
    E("()=>{document.querySelectorAll('.toast').forEach(x=>x.remove());tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#ywearly').count()==0,'after use hidden until day before next')
    # reopen / redraw still hidden
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(80);E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#ywearly').count()==0,'hidden after redraw/reopen')
    # double click / reuse collected target
    deb=E("debE(L()).amount");n=E("Object.values(S.months).reduce((n,m)=>n+(m.events||[]).filter(e=>e.checkId==='c12').length,0)")
    E("""()=>{if(!document.getElementById('ywea')){const i=document.createElement('input');i.id='ywea';i.value='512.34';document.body.append(i)}
      if(!document.getElementById('ywed')){const i=document.createElement('input');i.id='ywed';i.value='2026-11-11';document.body.append(i)}
      ywEarlyDlg();ywEarlySave('c12');ywEarlySave('c12')}""")
    pg.wait_for_timeout(150)
    check(E("S.checks.find(c=>c.id==='c12').status")=='deposited' and E("Object.values(S.months).reduce((n,m)=>n+(m.events||[]).filter(e=>e.checkId==='c12').length,0)")==n,'collected target not reused')
    check(abs(E("debE(L()).amount")-deb)<0.001 and E("pendingCheck().date")=='2026-11-19','no extra credit, still 19')
    # stale call must not target the new pending check (19) on Wed 11
    E("()=>{ywEarlySave();ywEarlySave(pendingCheck().id)}");pg.wait_for_timeout(80)
    check(E("pendingCheck().date")=='2026-11-19' and E("pendingCheck().status")=='pending','stale does not take Nov 19 on Wed 11')
    mark(pg);pg.locator('#herocard').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v143-yowash-despues-oculto.png'))
    ST=E("JSON.parse(JSON.stringify({checks:S.checks,months:S.months,wm:S.wm,cur:S.cur,cats:S.cats,budgets:S.budgets}))")

# payday hidden before and after 4am; auto at 4am still runs if amount set (here 12 already collected)
S2=base();S2['checks']=ST['checks'];S2['months']=ST['months'];S2['wm']={'est':0,'chk':{},'paid':{}}
for now,label in [('2026-11-12T03:59:00','pre-4am'),('2026-11-12T04:01:00','post-4am')]:
    with app(ROOT,now=now,state=S2,new_look=True) as pg:
        E=pg.evaluate;pg.wait_for_timeout(700)
        E("()=>{tab='ini';render()}");pg.wait_for_timeout(150)
        check(pg.locator('#ywearly').count()==0,'Thu 12 %s button hidden'%label)
        n=E("Object.values(S.months).reduce((n,m)=>n+(m.events||[]).filter(e=>e.checkId==='c12').length,0)")
        deb=E("debE(L()).amount")
        E("autoDeposit()");pg.wait_for_timeout(200)
        check(E("S.checks.find(c=>c.id==='c12').status")=='deposited' and E("Object.values(S.months).reduce((n,m)=>n+(m.events||[]).filter(e=>e.checkId==='c12').length,0)")==n,'auto does not re-credit c12 %s'%label)
        check(abs(E("debE(L()).amount")-deb)<0.001,'no extra debit %s'%label)
        check(E("pendingCheck().date")=='2026-11-19','still 19 %s'%label)

# normal Thu 4am auto remains unaffected when NOT early-collected (amount set, no button on payday)
Sauto=base();Sauto['checks']=[{'id':'c05','amount':500,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05'},
                              {'id':'c12','amount':512.34,'date':'2026-11-12','status':'pending'}]
Sauto['wm']={'est':0,'chk':{},'paid':{}}
with app(ROOT,now='2026-11-12T03:59:00',state=Sauto,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(150)
    check(pg.locator('#ywearly').count()==0,'payday pre-4am: button hidden even with amount')
    check(E("S.checks.find(c=>c.id==='c12').status")=='pending','not auto before 4am')
with app(ROOT,now='2026-11-12T04:01:00',state=Sauto,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("autoDeposit()");pg.wait_for_timeout(200)
    check(E("S.checks.find(c=>c.id==='c12').status")=='deposited','normal auto at 4am still works')
    check(pg.locator('#ywearly').count()==0 or E("()=>{tab='ini';render();return document.getElementById('ywearly')?1:0}")==0,'no early button after auto')

# next Wednesday visible for Thu 19
S3=base();S3['checks']=ST['checks'];S3['months']=ST['months'];S3['wm']={'est':0,'chk':{},'paid':{}}
with app(ROOT,now='2026-11-18T09:00:00',state=S3,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(E("pendingCheck().date")=='2026-11-19' and pg.locator('#ywearly').count()==1,'next Wednesday visible for 19')

# stale dialog crossing date boundary: opened Wed, confirmed Thu — no credit, no targeting of next check
with app(ROOT,now='2026-11-11T23:30:00',state=base(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    pg.click('#ywearly');pg.wait_for_timeout(150)
    check(pg.locator('#yweok').count()==1,'dialog open Wed night')
    pg.fill('#ywea','512.34')
    pg.clock.set_fixed_time('2026-11-12T00:15:00')
    deb=E("debE(L()).amount")
    pg.click('#yweok');pg.wait_for_timeout(250)
    c=E("S.checks.find(x=>x.id==='c12')")
    check(c['status']=='pending' and abs(E("debE(L()).amount")-deb)<0.001,'stale dialog after midnight does not credit')
    check(E("pendingCheck().id")=='c12' and E("pendingCheck().date")=='2026-11-12','did not create/target a new check')

# unknown estimate still shows day before and requires exact positive amount
Su=base();Su['checks']=[{'id':'c12','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'}]
with app(ROOT,now='2026-11-11T10:00:00',state=Su,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#ywearly').count()==1,'unknown est still shows day before')
    pg.click('#ywearly');pg.wait_for_timeout(150)
    val=pg.locator('#ywea').input_value()
    check(val in ('','0'),'no invented prefill: %r'%val)
    pg.click('#yweok');pg.wait_for_timeout(100)
    check(E("pendingCheck().id")=='c12','empty amount rejected')
    pg.fill('#ywea','400');pg.click('#yweok');pg.wait_for_timeout(250)
    check(E("S.checks.find(c=>c.id==='c12').status")=='deposited' and abs(E("S.checks.find(c=>c.id==='c12').amount")-400)<0.001,'exact amount day before')

# month boundary: day before Thu Oct 1 is Wed Sep 30 — actual date in September, identity Oct 1
Sm=copy.deepcopy(FIX);Sm['cur']='2026-09'
Sm['months']['2026-09']={'income':[{'id':'s1','name':'Débito','amount':200,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],'events':[],'tonyBase':0}
Sm['months']['2026-10']={'income':[{'id':'o1','name':'Débito','amount':800,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],'events':[],'tonyBase':0}
# L() is latest month (Oct) for debit
Sm['checks']=[{'id':'o01','amount':0,'amtPending':True,'date':'2026-10-01','status':'pending'}]
with app(ROOT,now='2026-09-30T14:00:00',state=Sm,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(E("ywEarlyOk(pendingCheck())") is True and pg.locator('#ywearly').count()==1,'Sep 30 eligible for Oct 1')
    E("""()=>{document.body.insertAdjacentHTML('beforeend','<input id="ywea" value="480"><input id="ywed" value="2026-09-30">');ywEarlySave('o01')}""")
    pg.wait_for_timeout(250)
    c=E("S.checks.find(x=>x.id==='o01')")
    check(c['status']=='deposited' and c['date']=='2026-10-01' and c['depositedOn']=='2026-09-30','month-boundary identity')
    ev=E("Object.entries(S.months).map(([k,m])=>[k,(m.events||[]).filter(e=>e.checkId==='o01')])")
    byk={k:v for k,v in ev}
    check(len(byk.get('2026-09') or [])==1 and len(byk.get('2026-10') or [])==0,'event in September (actual date)')
    check(E("pendingCheck().date")=='2026-10-08','next is Oct 8')

# year boundary helper already checked; payday Thu 2026-01-01, prev Wed 2025-12-31
Sy=copy.deepcopy(FIX);Sy['cur']='2025-12'
Sy['months']['2025-12']={'income':[{'id':'d1','name':'Débito','amount':100,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],'events':[],'tonyBase':0}
Sy['months']['2026-01']={'income':[{'id':'j1','name':'Débito','amount':100,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],'events':[],'tonyBase':0}
Sy['checks']=[{'id':'y01','amount':0,'amtPending':True,'date':'2026-01-01','status':'pending'}]
with app(ROOT,now='2025-12-31T20:00:00',state=Sy,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(E("ywPrevDay('2026-01-01')")=='2025-12-31' and E("ywEarlyOk(pendingCheck())") is True and pg.locator('#ywearly').count()==1,'year-boundary day before visible')
    # Dec 30 (Tue) would be hidden — clock jump back is messy; separate session:
with app(ROOT,now='2025-12-30T20:00:00',state=Sy,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(150)
    check(pg.locator('#ywearly').count()==0 and E("ywEarlyOk(pendingCheck())") is False,'Dec 30 hidden for Jan 1 payday')

print('test_v143 OK',ok)
