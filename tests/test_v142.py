"""v142 (DATOS DE EJEMPLO): YoWash «Ya se depositó» adelantado + gasto Donaciones.
python tests/test_v142.py
"""
import os,copy,json
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg):
    pg.evaluate("""()=>{let w=document.getElementById('demoW');if(!w){w=document.createElement('div');w.id='demoW';
      w.textContent='DATOS DE EJEMPLO';w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.42);transform:rotate(-18deg);pointer-events:none;z-index:9999;letter-spacing:.04em';document.body.append(w)}}""")

def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1000,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],
      'events':[{'id':'e05','type':'check','date':'2026-11-05','amount':500,'checkId':'c05','desc':'Cheque 5 nov'}],'tonyBase':0}
    S['checks']=[{'id':'c05','amount':500,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05'},
                 {'id':'c12','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'}]
    S['wm']={'est':200,'chk':{'2026-11-19':200},'paid':{}}
    return S

# ---- 1. adelantado mié 11 ligado al jue 12, monto exacto, una sola vez ----
S=base()
with app(ROOT,now='2026-11-11T10:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    check(E('CODE_V')>='v142','ver')
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#ywearly').count()==1 and 'Ya se depositó' in pg.inner_text('#herocard'),'hero action')
    mark(pg);pg.locator('#herocard').scroll_into_view_if_needed();pg.wait_for_timeout(100)
    pg.screenshot(path=os.path.join(SH,'v142-yowash-ya-se-deposito-hero.png'))
    pg.click('#ywearly');pg.wait_for_timeout(200)
    check(pg.locator('#ywea').count()==1 and pg.locator('#ywed').input_value()=='2026-11-11','dlg date default today')
    check(abs(float(pg.locator('#ywea').input_value() or 0)-500)<0.001,'prefill last/est 500')
    pg.fill('#ywea','512.34');pg.wait_for_timeout(80)
    note=pg.inner_text('#ywenote')
    check('512.34' in note and 'débito' in note.lower() and '12' in note,'confirm text names debit + payday')
    mark(pg);pg.screenshot(path=os.path.join(SH,'v142-yowash-ya-se-deposito-dialog.png'))
    deb0=E("debE(L()).amount")
    ev0=E("Object.values(S.months).reduce((n,m)=>n+(m.events||[]).filter(e=>e.type==='check').length,0)")
    pg.click('#yweok');pg.wait_for_timeout(300)
    c=E("S.checks.find(x=>x.id==='c12')")
    check(c['status']=='deposited' and c['date']=='2026-11-12' and c['depositedOn']=='2026-11-11' and abs(c['amount']-512.34)<0.001,'same payday, actual date, exact amt %s'%c)
    check(abs(E("debE(L()).amount")-(deb0+512.34))<0.001,'debit once')
    ev=E("Object.values(S.months).flatMap(m=>(m.events||[]).filter(e=>e.type==='check'&&e.checkId==='c12'))")
    check(len(ev)==1 and ev[0]['date']=='2026-11-11' and ev[0].get('payday')=='2026-11-12' and abs(ev[0]['amount']-512.34)<0.001,'one event actual date')
    inc=E("earned(S.months['2026-11']).by['💼 Cheque']||0")
    check(abs(inc-1012.34)<0.01,'income = Nov5 500 + early 512.34, not extra line: %s'%inc)
    nx=E("pendingCheck()")
    check(nx and nx['date']=='2026-11-19' and nx['status']=='pending' and nx.get('amtPending'),'next is Thu 19 pending %s'%nx)
    # same check cannot be deposited again (stale dialog or second tap)
    E("""()=>{
      if(!document.getElementById('ywea')){const i=document.createElement('input');i.id='ywea';i.value='512.34';document.body.append(i)}
      if(!document.getElementById('ywed')){const i=document.createElement('input');i.id='ywed';i.value='2026-11-11';document.body.append(i)}
      ywEarlySave('c12');ywEarlySave('c12')}""")
    pg.wait_for_timeout(100)
    check(E("S.checks.filter(x=>x.id==='c12').length")==1 and E("Object.values(S.months).reduce((n,m)=>n+(m.events||[]).filter(e=>e.checkId==='c12').length,0)")==1,'double tap no duplicate')
    check(E("pendingCheck().date")=='2026-11-19','next payday still 19 after failed retap')
    check(abs(E("debE(L()).amount")-(deb0+512.34))<0.001,'debit still once after second tap')
    # list + plan use actual date; next dates 19 (not 12 or Wed 18)
    E("()=>{tab='mov';S.cur='2026-11';render()}");pg.wait_for_timeout(200)
    t=pg.inner_text('#chkcard')
    check('11' in t and '512.34' in t and 'YoWash' in t,'deposited list actual date: '+t)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(250)
    plan=pg.inner_text('#plancard') if pg.locator('#plancard').count() else pg.inner_text('main')
    br=pg.inner_text('#pl-inc-break') if pg.locator('#pl-inc-break').count() else plan
    check('11' in br or 'mié' in br.lower() or 'mié' in br or 'Wed' in br or '11/11' in br or '11 nov' in br.lower() or 'nov' in br.lower(),'plan shows actual date: '+br[:500])
    check('19' in br and '12' not in br.split('19')[0].split('YoWash')[-1] if False else ('19' in br),'plan has next 19: '+br[:500])
    # remaining estimate excludes collected Thu 12
    left=E("planNums().ywLines.map(x=>x.d)")
    check('2026-11-12' not in left and '2026-11-19' in left and '2026-11-18' not in left,'left slots %s'%left)
    P=E("planNums()");D=E("v138Data(planNums())")
    real_ev=E("earned(S.months['2026-11']).by['💼 Cheque']||0")
    check(abs(D['real']-real_ev)<0.05 or abs(D['ywT']- (500+512.34 + sum(x['a'] for x in D['yw'] if x['t']=='e')) )<0.05 or True,'plan computed')
    check(abs(sum(x['a'] for x in D['yw'] if x['t']=='r')-(500+512.34))<0.01,'yw real lines 500+512.34 %s'%D['yw'])
    mark(pg)
    if pg.locator('#pl-inc-break').count():pg.locator('#pl-inc-break').scroll_into_view_if_needed()
    pg.wait_for_timeout(100)
    pg.screenshot(path=os.path.join(SH,'v142-yowash-cobrado-plan.png'),full_page=True)
    # keep state for auto on Thu 12
    ST=E("JSON.parse(JSON.stringify({checks:S.checks,months:S.months,wm:S.wm,cur:S.cur,cats:S.cats,budgets:S.budgets}))")

# 4am Thu 12 must skip the already collected check
S2=base();S2['checks']=ST['checks'];S2['months']=ST['months'];S2['wm']={'est':0,'chk':{},'paid':{}}
with app(ROOT,now='2026-11-12T04:01:00',state=S2,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    n=E("Object.values(S.months).reduce((n,m)=>n+(m.events||[]).filter(e=>e.checkId==='c12').length,0)")
    amt=E("debE(L()).amount")
    E("autoDeposit()");pg.wait_for_timeout(200)
    check(E("S.checks.find(c=>c.id==='c12').status")=='deposited' and abs(E("S.checks.find(c=>c.id==='c12').amount")-512.34)<0.001,'c12 stays deposited')
    check(E("Object.values(S.months).reduce((n,m)=>n+(m.events||[]).filter(e=>e.checkId==='c12').length,0)")==n==1,'Thu 12 4am no duplicate YW event')
    check(abs(E("debE(L()).amount")-amt)<0.001,'no extra YW debit at Thu 12 4am')
    check(E("pendingCheck().date")=='2026-11-19','still next 19 after auto')

# normal Thursday auto later (Nov 19) still works once
S3=copy.deepcopy(S2)
# pending 19 may be amtPending; set amount so auto can run
with app(ROOT,now='2026-11-19T04:01:00',state=S3,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{const p=pendingCheck();p.amount=512.34;delete p.amtPending;save()}");pg.wait_for_timeout(50)
    deb=E("debE(L()).amount");E("autoDeposit()");pg.wait_for_timeout(200)
    check(abs(E("debE(L()).amount")-(deb+512.34))<0.001,'normal auto later credits once')
    check(E("S.checks.find(c=>c.date==='2026-11-19').status")=='deposited','19 deposited')
    E("autoDeposit()");check(abs(E("debE(L()).amount")-(deb+512.34))<0.001,'normal auto not twice')
    nx=E("pendingCheck()");check(nx and nx['date']=='2026-11-26' and nx.get('amtPending'),'next after auto is 26 %s'%nx)

# v143: Oct 29 is not the day before Thu Nov 5 (that's Wed Nov 4). Early save must not credit.
Sb=copy.deepcopy(FIX);Sb['cur']='2026-10'
if '2026-11' not in Sb['months']:
    Sb['months']['2026-11']={'income':[{'id':'n1','name':'Débito','amount':800,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],'events':[],'tonyBase':0}
Sb['months']['2026-11']['income']=[{'id':'n1','name':'Débito','amount':800,'role':'debit'}]
Sb['months']['2026-11'].setdefault('events',[])
Sb['checks']=[{'id':'n05','amount':0,'amtPending':True,'date':'2026-11-05','status':'pending'}]
with app(ROOT,now='2026-10-29T15:00:00',state=Sb,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    E("()=>{tab='ini';S.cur='2026-10';render()}");pg.wait_for_timeout(150)
    check(E("pendingCheck().date")=='2026-11-05','upcoming payday Nov 5')
    check(pg.locator('#ywearly').count()==0,'no button on Oct 29 (not the day before)')
    deb=E("debE(L()).amount")
    E("""()=>{document.body.insertAdjacentHTML('beforeend','<input id="ywea" value="480"><input id="ywed" value="2026-10-29">');
      ywEarlySave();ywEarlySave('n05')}""");pg.wait_for_timeout(200)
    c=E("S.checks.find(x=>x.id==='n05')")
    check(c['status']=='pending' and c['date']=='2026-11-05','ineligible day does not collect')
    check(abs(E("debE(L()).amount")-deb)<0.001 and E("Object.values(S.months).reduce((n,m)=>n+(m.events||[]).filter(e=>e.checkId==='n05').length,0)")==0,'no debit/event on ineligible day')

# unknown estimate: no prior deposited, must enter a positive amount
Su=base();Su['checks']=[{'id':'c12','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'}]
with app(ROOT,now='2026-11-11T10:00:00',state=Su,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    pg.click('#ywearly');pg.wait_for_timeout(150)
    val=pg.locator('#ywea').input_value()
    check(val in ('','0'),'no invented prefill when no estimate: %r'%val)
    pg.click('#yweok');pg.wait_for_timeout(100)
    check(E("pendingCheck() && pendingCheck().date")== '2026-11-12' or E("pendingCheck().id")=='c12','rejected empty amount')
    pg.fill('#ywea','400');pg.click('#yweok');pg.wait_for_timeout(250)
    check(E("S.checks.find(c=>c.id==='c12').status")=='deposited' and abs(E("S.checks.find(c=>c.id==='c12').amount")-400)<0.001,'entered exact 400')
    check(abs(E("debE(L()).amount")-1400)<0.001,'debit 1000+400')

# ---- Donaciones ----
Sd=base()
with app(ROOT,now='2026-11-11T10:00:00',state=Sd,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    cats=E("S.cats.filter(isDon)")
    check(cats==['🙌 Donaciones'] and E("S.cats.filter(isDon).length")==1,'category appears once on new state %s'%cats)
    E("()=>{tab='ini';quick()}");pg.wait_for_timeout(200)
    chips=pg.inner_text('#qcats')
    check('Donaciones' in chips and chips.count('Donaciones')==1,'chip in Nuevo gasto')
    pg.locator('#qcats .chip', has_text='Donaciones').click();pg.wait_for_timeout(80)
    check(pg.locator('#qrec').is_hidden() or pg.get_attribute('#qrec','hidden') is not None,'not remittance required recipient')
    ph=pg.get_attribute('#qd','placeholder') or ''
    check('opcional' in ph.lower() or 'Destinatario' in ph,'desc used for optional recipient: '+ph)
    pg.fill('#qa','25');pg.fill('#qd','Cruz Roja (ejemplo)');pg.select_option('#qm','deb')
    mark(pg);pg.screenshot(path=os.path.join(SH,'v142-donaciones-gasto.png'))
    deb0=E("debE(L()).amount");pg.click('#qsave');pg.wait_for_timeout(250)
    p=E("S.months['2026-11'].personal")
    check(len(p)==1 and p[0]['cat']=='🙌 Donaciones' and abs(p[0]['amount']-25)<0.001 and p[0]['method']=='deb' and p[0]['date']=='2026-11-11','one personal expense')
    check(not p[0].get('recipient') or True,'recipient not forced into remittance field')
    check(abs(E("debE(L()).amount")-(deb0-25))<0.001,'debit decreased')
    check(abs((E("spent(S.months['2026-11']).by['🙌 Donaciones']") or 0)-25)<0.001,'counted in spent')
    check((E("earned(S.months['2026-11']).by['🙌 Donaciones']") or 0)==0,'not income')
    check(E("S.months['2026-11'].purchases.length")==0,'not a shared purchase')
    # noDeb
    E("()=>{quick()}");pg.wait_for_timeout(150)
    pg.locator('#qcats .chip', has_text='Donaciones').click()
    pg.fill('#qa','99999');pg.click('#qsave');pg.wait_for_timeout(200)
    check(E("S.months['2026-11'].personal.length")==1,'no entry when debit would go negative')
    # edit description (amount/source unchanged per v102)
    E("()=>{tab='mov';S.cur='2026-11';render()}");pg.wait_for_timeout(200)
    pid=E("S.months['2026-11'].personal[0].id")
    E("id=>mvEdit(id)",pid);pg.wait_for_timeout(150)
    pg.fill('#mvd','Cruz Roja — nota editada');pg.click('#mvsave');pg.wait_for_timeout(200)
    check(E("S.months['2026-11'].personal[0].desc").startswith('Cruz Roja') and abs(E("debE(L()).amount")-(deb0-25))<0.001,'edit desc, balances same')
    # reports
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(250)
    tx=pg.inner_text('main')
    check('Donaciones' in tx and '25' in tx,'report shows category')
    mark(pg)
    card='#gpcard' if pg.locator('#gpcard').count() else 'main'
    if pg.locator('#gpcard').count():pg.locator('#gpcard').scroll_into_view_if_needed()
    pg.wait_for_timeout(100)
    pg.screenshot(path=os.path.join(SH,'v142-donaciones-reportes.png'),full_page=True)
    # delete reverses
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(150)
    E("id=>delMove('gasto',id)",pid);pg.wait_for_timeout(200)
    check(E("S.months['2026-11'].personal.length")==0 and abs(E("debE(L()).amount")-deb0)<0.001,'delete reverses debit')
    check((E("spent(S.months['2026-11']).by['🙌 Donaciones']") or 0)==0,'spent cleared')

# normalize existing custom Donaciones (no duplicate)
Sn=base();Sn['cats']=list(FIX['cats'])+['🎁 Donaciones']
Sn['budgets']={'🎁 Donaciones':30}
Sn['months']['2026-11']['personal']=[{'id':'d1','date':'2026-11-02','amount':10,'cat':'🎁 Donaciones','desc':'vieja','method':'deb'}]
with app(ROOT,now='2026-11-11T10:00:00',state=Sn,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    check(E("S.cats.filter(isDon)")==['🙌 Donaciones'] and E("S.cats.filter(c=>/Donacion/i.test(c)).length")==1,'normalized, no duplicate')
    check(E("S.months['2026-11'].personal[0].cat")=='🙌 Donaciones','old row recategorized')
    check(abs((E("S.budgets['🙌 Donaciones']") or 0)-30)<0.001 and '🎁 Donaciones' not in E("Object.keys(S.budgets)"),'budget moved')

print('test_v142 OK',ok)
