"""v60: pending check amount + categories in shared purchases (made-up data): python tests/test_v60.py [--shots]"""
import os,sys,json
from harness import app,HERE,METRICS_JS
ROOT=os.path.dirname(HERE);ok=0
def check(c,msg):
    global ok
    if not c: raise AssertionError(msg)
    ok+=1
for lang in ['es','en']:
  ES=lang=='es'
  # ---------- 1) pending check ----------
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate
    deb0=E("r2(debE(L()).amount)")
    E("()=>{tab='ini';chkEdit=true;render()}");pg.wait_for_timeout(50)
    check(pg.locator('#chkp').count()==1,'Monto pendiente checkbox')
    pg.check('#chkp');check(pg.locator('#chk').is_disabled(),'amount disabled when pending')
    pg.click('#chkbtn');pg.wait_for_timeout(80)
    pc=E("pendingCheck()");check(pc['amtPending'] is True and pc['amount']==0 and pc['id']=='k3','stored pending w/o amount %s'%pc)
    t=pg.locator('#chkamtnote').inner_text()
    check(('Pon el monto del cheque cuando llegue el email' if ES else 'Enter the check amount when the email arrives') in t,'Hoy notice: '+t)
    hero=pg.locator('#herocard').inner_text();check(('Pendiente' if ES else 'Pending') in hero and '$700.00' in hero and ('estimado' if ES else 'estimated') in hero,'hero shows pending+estimate: '+hero)
    exp=E("withEst(()=>{const m=L(),c=calc(m);return r2(sum(m.income,x=>x.amount)+pendingCheck().amount-c.tonyDue-sum(prevPend(),p=>p.c.tonyDue)-c.credit)})")
    noest=E("(()=>{const m=L(),c=calc(m);return r2(sum(m.income,x=>x.amount)-c.tonyDue-sum(prevPend(),p=>p.c.tonyDue)-c.credit)})()")
    check(abs(exp-noest-700)<1e-9,'projection uses last check 700')
    pl=pg.locator('#plancard');ptx=pl.inner_text();fmt=E(f"f({exp})")
    check(fmt in ptx and pl.locator('.estt').count()>=1 and ('estimado' if ES else 'estimated') in ptx,'plan shows estimate: '+ptx)
    check(E("pendingCheck().amount")==0 and E("pendingCheck().amtPending")==True,'estimate never stored')
    stored=json.loads(E("localStorage.getItem(K)"));check([c for c in stored['checks'] if c['id']=='k3'][0]['amount']==0,'saved data has no estimate')
    # Thursday auto-deposit with pending amount: no deposit, asks instead
    E("()=>{pendingCheck().date='2026-10-13';save();autoDeposit()}");pg.wait_for_timeout(80)
    check(E("pendingCheck()&&pendingCheck().status")=='pending' and E("r2(debE(L()).amount)")==deb0,'no estimate deposited')
    check(not any(e.get('checkId')=='k3' for e in E("S.months['2026-10'].events")),'no check event yet')
    t=pg.locator('#chkamtnote').inner_text();check(('¿cuánto fue?' if ES else 'how much was it?') in t,'asks amount on deposit day: '+t)
    if '--shots' in sys.argv:
        pg.wait_for_timeout(2600);E("()=>{document.querySelectorAll('.toast').forEach(t=>t.remove());const n=document.querySelector('nav');if(n)n.style.display='none';const b=document.getElementById('fab')||document.querySelector('.fab');if(b)b.style.display='none';document.querySelectorAll('button').forEach(x=>{if(x.textContent.trim()==='+'&&getComputedStyle(x).position==='fixed')x.style.display='none'});const tc=document.getElementById('todocard');if(tc)tc.style.display='none'}")
        y=E("document.getElementById('chkamtnote').getBoundingClientRect().top+scrollY");h=E("document.getElementById('plancard').getBoundingClientRect().bottom+scrollY")
        pg.screenshot(path=os.path.join(ROOT,'shots','125-cheque-pendiente'+('' if ES else '-en')+'.png'),full_page=True,clip={'x':0,'y':y-8,'width':390,'height':h-y+16})
    pg.click('#chkamtbtn');pg.wait_for_timeout(50);pg.fill('#cka2','-5');pg.click('#cka2ok');pg.wait_for_timeout(50)
    check(E("pendingCheck()&&pendingCheck().amtPending")==True and E("r2(debE(L()).amount)")==deb0,'negative/zero rejected')
    pg.fill('#cka2','712.34');pg.click('#cka2ok');pg.wait_for_timeout(80)
    k3=E("S.checks.find(c=>c.id==='k3')");check(k3['status']=='deposited' and k3['amount']==712.34 and 'amtPending' not in k3,'deposited real amount %s'%k3)
    check(abs(E("r2(debE(L()).amount)")-(deb0+712.34))<1e-9,'debit + real amount')
    check(sum(1 for e in E("S.months['2026-10'].events") if e.get('checkId')=='k3' and e['amount']==712.34)==1,'one check event')
    check(pg.locator('#chkamtnote').count()==0,'notice gone')
    check(not [e for e in pg.errors if not e.startswith(('DIALOG:Pon el monto','DIALOG:Enter the check amount'))],pg.errors)
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate
    # future date: amount entered later, stays pending; Ajustar still available; normal auto-deposit path untouched
    E("()=>{const p=pendingCheck();p.amount=0;p.amtPending=true;save();tab='ini';render()}");pg.wait_for_timeout(50)
    pg.click('#chkamtbtn');pg.fill('#cka2','730');pg.click('#cka2ok');pg.wait_for_timeout(50)
    p=E("pendingCheck()");check(p['amount']==730 and 'amtPending' not in p and p['status']=='pending','amount set, still pending')
    check(pg.locator('#chkadj').count()==1 and '$730.00' in pg.locator('#herocard').inner_text(),'Ajustar available')
    pg.click('#chkadj');pg.wait_for_timeout(30);check(not pg.locator('#chkp').is_checked() and pg.input_value('#chk')=='730','edit form normal')
    m0=E(METRICS_JS);check(m0['hoy']['proj']==E("withEst(()=>{const m=L(),c=calc(m);return r2(sum(m.income,x=>x.amount)+pendingCheck().amount-c.tonyDue-sum(prevPend(),p=>p.c.tonyDue)-c.credit)})"),'no estimate when amount known')
    E("()=>{pendingCheck().date='2026-10-13';autoDeposit()}");check(E("S.checks.find(c=>c.id==='k3').status")=='deposited','known amount still auto-deposits')
    check(not [e for e in pg.errors if not e.startswith(('DIALOG:Pon el monto','DIALOG:Enter the check amount'))],pg.errors)
  # ---------- 2) categories in shared purchases ----------
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate
    HOG,SAL,ROP,FOOD='🏠 Hogar','💊 Salud','👕 Ropa','🛒 Comida/Supermercado'
    b0=E(METRICS_JS)['2026-10'];old=E("moves(L()).filter(x=>x.kind==='compra').map(x=>x.cat)")
    check(set(old)=={FOOD},'old purchases stay in Comida/Supermercado')
    E("()=>{tab='mov';render();editP()}");pg.wait_for_timeout(80)
    check(pg.input_value('#pcat')==FOOD,'default category')
    pg.select_option('#pcat',HOG);pg.wait_for_timeout(30);pg.fill('#tot','100');pg.click('#itog');pg.wait_for_timeout(50)
    check(pg.input_value('#itbox select[data-li="0"]')==HOG,'item defaults to purchase category')
    from itemhelp import item
    item(pg,0,10,('Yo',),'Vitaminas',SAL);item(pg,1,5,('Yo',),'',ROP);item(pg,2,10,('Carlos',),'Shampoo',SAL);item(pg,3,6,('Tony',))
    sh=E("D.shares");check(sh=={'Tony':40.5,'Carlos':27.25,'Yo':32.25},sh)
    if '--shots' in sys.argv:pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','126-compartida-categoria'+('' if ES else '-en')+'.png'))
    pg.click('#psave');pg.wait_for_timeout(80)
    p=E("M().purchases[0]")
    check(p['cat']==HOG and p.get('catId')=='cat_'+E("hsh('🏠 Hogar')") or p['cat']==HOG and p.get('catId','').startswith('cat'),'purchase cat + v2 id %s'%p.get('catId'))
    check(p['items']['Yo'][0]=={'a':10,'n':'Vitaminas','c':SAL,'catId':p['items']['Yo'][0]['catId']} and p['items']['Yo'][0]['catId'].startswith('cat'),p['items'])
    check('c' not in p['items']['Tony'][0],'default item category not stored')
    b1=E(METRICS_JS)['2026-10'];d=lambda k:round(b1['spent']['by'].get(k,0)-b0['spent']['by'].get(k,0),2)
    # Joe pays: shared 32.25-15 = 17.25 -> Hogar, Vitaminas 10 -> Salud, 5 -> Ropa; Tony/Carlos never in Joe's spending
    check(d(HOG)==17.25 and d(SAL)==10 and d(ROP)==5 and d(FOOD)==0,'spent by category %s'%{k:d(k) for k in (HOG,SAL,ROP,FOOD)})
    check(round(b1['spent']['total']-b0['spent']['total'],2)==32.25,'Joe total = his share')
    db=lambda k:round(b1['bud'].get(k,0)-b0['bud'].get(k,0),2);check(db(HOG)==17.25 and db(SAL)==10 and db(ROP)==5,'budget by category')
    check(b1['earned']==b0['earned'],'not income')
    check(round(b1['calc']['carlos']-b0['calc']['carlos'],2)==27.25 and round(b1['calc']['tony']-b0['calc']['tony'],2)==40.5,'Por cobrar unchanged rule')
    check(E("moves(L()).find(x=>x.id===M().purchases[0].id).cat")==HOG,'movement listed in Hogar')
    # info shown: messages, history, PDF row labels
    c=E("msgFor('carlos','2026-10')");check('Shampoo · '+E("DN('💊 Salud')")+' $10.00' in c and E("DN('🏠 Hogar')") in c,'carlos message: '+c)
    t=E("msgFor('tony','2026-10')");check('$6.00' in t and '$6.00 ·' not in t,'tony default item no category: '+t)
    E("()=>{hRange='cur';render()}");pid=p['id'];pg.click(f'.hrow[data-id="{pid}"] .hexp');pg.wait_for_timeout(40)
    hd=pg.locator(f'.hrow[data-id="{pid}"] .hdet').inner_text();check('Vitaminas · ' in hd and 'Shampoo · ' in hd,'history labels: '+hd)
    check(E("DN('🏠 Hogar')") in pg.locator(f'.hrow[data-id="{pid}"]').inner_text(),'history row shows category')
    # store memory remembers category
    st=p['store'];check(E(f"RS()[memK({json.dumps(st)})].cat")==HOG,'store memory cat')
    E("()=>{editP()}");pg.wait_for_timeout(40);other=E("S.stores.find(s=>s!==D.store)")
    pg.select_option('#dlg select >> nth=0',other);pg.wait_for_timeout(30);pg.select_option('#dlg select >> nth=0',st);pg.wait_for_timeout(30)
    check(pg.input_value('#pcat')==HOG,'store memory applies category')
    E("dlg().close()")
    # renaming the category only changes the label; totals unchanged
    before=E("JSON.stringify(spent(L()).total)");E("()=>{setLabel(['cat','con'],'🏠 Hogar','Casa')}")
    check(E("JSON.stringify(spent(L()).total)")==before and E("M().purchases[0].cat")==HOG,'rename keeps data')
    check(not [e for e in pg.errors if not e.startswith(('DIALOG:Pon el monto','DIALOG:Enter the check amount'))],pg.errors)
print('OK',ok)
