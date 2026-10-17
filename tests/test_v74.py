"""v74: Joe's share of Tony/Arianna purchases goes into Tony's EXISTING variable 'Comida' bill (no new line); old v72/v73 separate line is folded (made-up data): python tests/test_v74.py [--shots]"""
import json,os,sys,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
P="{id:'%s',store:'%s',date:'%s',total:%s,mode:'fam',who:['Yo','Tony','Carlos'],method:'',paidBy:'%s',shares:{Tony:%s,Carlos:%s,Yo:%s}}"
CAT='🛒 Comida/Supermercado'
st=copy.deepcopy(FIX);st['months']['2026-10']['bills'].append({'id':'bf','name':'Food','amount':40,'fixed':False})
with app(ROOT,state=st) as pg:
    E=pg.evaluate
    n0=E("M().bills.length");ids0=E("M().bills.map(b=>b.id)");tt0=E("calc(M()).toTony");bud0=E("budBy(M()).by[%s]||0"%json.dumps(CAT));sp0=E("spent(M()).total")
    # Arianna buys: Joe's share 25 goes into the existing Food line
    E("()=>{M().purchases.push(%s);save()}"%(P%('a1','Publix','2026-10-14',100,'Arianna',50,25,25)))
    b=E("M().bills.find(b=>b.id==='bf')")
    check(E("M().bills.length")==n0 and E("M().bills.map(b=>b.id)")==ids0,'no new bill line')
    check(b['amount']==65 and b['tfood']==25,'Comida = 40 manual + 25 share %s'%b)
    check(not E("M().bills.some(isLegacyTF)"),'no separate line')
    check(abs(E("calc(M()).toTony")-tt0-25)<1e-9,'A transferir +25')
    deb0=E("debE(M()).amount")
    check(abs(E("spent(M()).total")-sp0)<1e-9 and abs((E("budBy(M()).by[%s]||0"%json.dumps(CAT)))-bud0)<1e-9 and E("debE(M()).amount")==deb0,'v75: accepting Tony/Arianna receipt = no expense, no balance change')
    # Tony buys too (same line)
    E("()=>{M().purchases.push(%s);save()}"%(P%('t1','Aldi','2026-10-15',40,'Tony',20,10,10)))
    b=E("M().bills.find(b=>b.id==='bf')");check(E("M().bills.length")==n0 and b['amount']==75 and b['tfood']==35,'Tony purchase +10 %s'%b)
    # edit share -> recalculated
    E("()=>{M().purchases.find(p=>p.id==='a1').shares.Yo=30;save()}");b=E("M().bills.find(b=>b.id==='bf')");check(b['amount']==80 and b['tfood']==40,'edit %s'%b)
    E("()=>{tab='res';render()}");pg.wait_for_timeout(100)
    inp=E("[...document.querySelectorAll('#billsm input')].map(i=>i.value)");check('80' in inp,'v75: input shows full Comida (receipts + ajuste) %s'%inp)
    check('$40.00 de recibos + $40.00 ajuste = $80.00' in pg.inner_text('#billsm'),pg.inner_text('#billsm'))
    # Joe types the total he wants: difference is stored as ajuste
    E("()=>upd('bills','bf','amount','90')");b=E("M().bills.find(b=>b.id==='bf')");check(b['amount']==90 and b['tfood']==40,'typed 90 -> ajuste 50 %s'%b)
    tx=pg.inner_text('#billsm');check('$40.00 de recibos + $50.00 ajuste = $90.00' in tx,tx)
    inp=E("[...document.querySelectorAll('#billsm input')].map(i=>i.value)");check('90' in inp,'input shows 90 %s'%inp)
    check(tx.count('Comida')==1,'one Comida line %s'%tx)
    if '--shots' in sys.argv:E("()=>document.querySelectorAll('body *').forEach(e=>{if(getComputedStyle(e).position==='fixed')e.style.visibility='hidden'})");pg.locator('#billsm').screenshot(path=os.path.join(ROOT,'shots','139-comida-total.png'))
    # Tony link / message / PDF label
    sn=E("snapFor('Tony')");fb=[x for x in sn['months'][0]['bills'] if x['n']=='Comida']
    check(len(fb)==1 and fb[0]['a']==90 and fb[0]['x']==40 and not any('Tony/Arianna' in x['n'] for x in sn['months'][0]['bills']),'link bills %s'%sn['months'][0]['bills'])
    t=E("msgShort('tony',S.cur)");check('compras de Tony/Arianna' not in t and t.count('Comida')==1,t)
    # delete a purchase -> adjusts; delete all -> back to manual only
    E("()=>{M().purchases=M().purchases.filter(p=>p.id!=='t1');save()}");check(E("M().bills.find(b=>b.id==='bf').amount")==80,'delete t1 keeps ajuste 50')
    E("()=>{M().purchases.push(%s);save()}"%(P%('t2','Aldi','2026-10-16',20,'Tony',10,5,5)));check(E("M().bills.find(b=>b.id==='bf').amount")==85,'later receipt adds, ajuste kept')
    E("()=>{M().purchases=M().purchases.filter(p=>p.id!=='t2');save()}")
    E("()=>{M().purchases=M().purchases.filter(p=>p.id!=='a1');save()}");b=E("M().bills.find(b=>b.id==='bf')");check(b['amount']==50 and 'tfood' not in b,'back to manual %s'%b)
    # v75: expense is counted when Joe transfers Tony's bills, by each bill's category; exactly once
    E("()=>{M().purchases.push(%s);save()}"%(P%('a2','Publix','2026-10-16',60,'Arianna',30,15,15)))
    CB="budBy(M()).by[%s]||0"%json.dumps(CAT);b1=E(CB);sp1=E("spent(M()).total");deb1=E("debE(M()).amount");check(abs(b1-bud0)<1e-9,'not counted before transfer')
    E("()=>payDlg('tony',S.cur)");pg.wait_for_timeout(50);E("()=>{window.confirm=()=>true}");pg.click('#payok');pg.wait_for_timeout(100)
    fb=E("M().bills.find(b=>b.id==='bf')");check(fb['amount']==65 and fb['paid']==65,'Comida paid %s'%fb)
    check(abs(E(CB)-bud0-65)<1e-6,'budget Comida/Supermercado +65 (ajuste 50 + receipt 15) at transfer')
    check(abs(E("spent(M()).total")-sp1)<1e-9 and E("debE(M()).amount")<deb1,'transfer: debit down, no extra Gastos line')
    t=E("tonyBy(M())");check(abs(sum(t.values())-E("M().bills.reduce((s,b)=>s+Math.min(+b.paid||0,+b.amount||0),0)"))<1e-6 and t.get(CAT)==65,'each paid bill by its category %s'%t)
    # Carlos-paid purchase unchanged: Joe's share is expense at acceptance
    sp2=E("spent(M()).total");E("()=>{M().purchases.push(%s);save()}"%(P%('c9','Costco','2026-10-16',40,'Carlos',20,10,10)));check(abs(E("spent(M()).total")-sp2-10)<1e-9 and E(CB)-bud0-65-10<1e-6,'carlos buy = expense +10')
    E("()=>{M().purchases=M().purchases.filter(p=>p.id!=='c9');save()}")
    # new month: Comida starts at 0
    E("()=>{window.confirm=()=>true;window.prompt=()=>'2026-11';document.getElementById('newm').onclick()}");pg.wait_for_timeout(100)
    nb=E("S.months['2026-11'].bills.filter(isComidaBill)");check(len(nb)==1 and nb[0]['amount']==0 and 'tfood' not in nb[0],'new month Comida starts at 0 %s'%nb)
    E("()=>{delete S.months['2026-11'];S.cur='2026-10';save()}")
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
# no Food line at all -> exactly one Comida line is created (once)
with app(ROOT) as pg:
    E=pg.evaluate;n0=E("M().bills.length")
    E("()=>{M().purchases.push(%s,%s);save();save()}"%(P%('a1','Publix','2026-10-14',100,'Arianna',50,25,25),P%('t1','Aldi','2026-10-15',40,'Tony',20,10,10)))
    check(E("M().bills.length")==n0+1 and E("M().bills.filter(isComidaBill).length")==1 and E("comidaBill(M()).amount")==35,'created once')
    E("()=>{tab='res';render()}");pg.wait_for_timeout(100);tx=pg.inner_text('#billsm');check('$35.00 de recibos' in tx and 'ajuste' not in tx,'ajuste hidden when 0 '+tx)
# old v72/v73 separate line in Joe's data -> folded into Comida on load (backup + totals)
st2=copy.deepcopy(st);m=st2['months']['2026-10']
m['purchases'].append({'id':'a1','store':'Publix','date':'2026-10-14','total':100,'mode':'fam','who':['Yo','Tony','Carlos'],'method':'','paidBy':'Arianna','shares':{'Tony':50,'Carlos':25,'Yo':25}})
m['bills'].append({'id':'_tfood','name':'🛒 Comida (compras de Tony/Arianna)','amount':25,'fixed':False,'paid':25})
m['events'].append({'id':'ev1','type':'tony','date':'2026-10-15','amount':25,'desc':'Transferencia a Tony','bills':[{'id':'_tfood','prev':0}]})
tot=sum(b['amount'] for b in m['bills'])
with app(ROOT,state=st2) as pg:
    E=pg.evaluate;pg.wait_for_timeout(300)
    bl=E("M().bills");f=[b for b in bl if b['id']=='bf'][0]
    check(not any(b['id']=='_tfood' or 'Tony/Arianna' in b['name'] for b in bl),'legacy line removed %s'%bl)
    check(len(bl)==len(m['bills'])-1 and f['amount']==65 and f['tfood']==25 and f['paid']==25,'folded into Food %s'%f)
    check(abs(sum(b['amount'] for b in bl)-tot)<1e-9,'bills total unchanged')
    check(E("M().events.find(e=>e.id==='ev1').bills")==[{'id':'bf','prev':0}],'transfer ref remapped')
    bk=E("localStorage.getItem('finanzas-mig-pending')||''");check('_tfood' in bk,'backup queued before saving')
    ls=E("JSON.parse(localStorage.getItem('finanzas-v1')).months['2026-10'].bills.some(b=>b.id==='_tfood')");check(not ls,'saved')
    # restore of an old backup (setState) is folded too
    E("o=>setState(o)",st2);pg.wait_for_timeout(200)
    bl=E("M().bills");check(not any(b['id']=='_tfood' for b in bl) and [b for b in bl if b['id']=='bf'][0]['amount']==65,'restore folded')
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
print('test_v74 OK',ok)
