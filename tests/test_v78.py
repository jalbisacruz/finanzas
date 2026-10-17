"""v78 (plan fases 1-2): botón + con menú, Hoy sin barra de escanear, Mi balance, Plan del mes en 5 líneas, Por hacer como línea (made-up data): python tests/test_v78.py [--shots]"""
import json,os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
def shot(pg,n,loc=None):
    if not SH:return
    p=os.path.join(ROOT,'shots','143-%s.png'%n)
    (pg.locator(loc).screenshot(path=p) if loc else pg.screenshot(path=p))
for lang in ['es','en']:
  ES=lang=='es'
  with app(ROOT,lang=lang,width=390,height=844,expand=False) as pg:
    E=pg.evaluate;T=lambda s:s if ES else E("s=>T(s)",s)
    pre=json.dumps(E("S"),sort_keys=True)
    E("()=>{localStorage.setItem('finanzas-mig-status','ok');tab='ini';render()}");pg.wait_for_timeout(150)
    # Fase 1
    check(pg.locator('#scanh').count()==0 and 'Escanear recibo' not in pg.inner_text('#v') and 'Scan receipt' not in pg.inner_text('#v'),'no grey scan bar on Hoy')
    check(pg.locator('#mignote').count()==0,'v2 OK notice gone')
    pg.click('#fab');pg.wait_for_timeout(80)
    d=pg.inner_text('#dlg');check(all(x in d for x in ([ 'Compra manual','Cargar recibo','Ingreso'] if ES else ['Manual purchase','Upload receipt','Income'])),d)
    if ES:shot(pg,'boton-mas')
    pg.click('#fabman');pg.wait_for_timeout(80);d=pg.inner_text('#dlg')
    check(('Compra manual' if ES else 'Manual purchase') in d and pg.locator('#kmine.on').count()==1 and pg.locator('#kshared').count()==1 and pg.locator('#tabi').count()==0,'manual = solo mía + compartida '+d[:200])
    check(pg.locator('#dlg button[onclick*="editP()"]').count()==0,'no duplicate compartida button')
    if ES:shot(pg,'compra-manual','#dlg')
    # quick personal expense still works
    deb0=E("debE(L()).amount");n0=E("L().personal.length");ids0=E("L().personal.map(x=>x.id)");pg.fill('#qa','12.5');pg.click('#qsave');pg.wait_for_timeout(80)
    check(E("L().personal.length")==n0+1 and abs(E("debE(L()).amount")-(deb0-12.5))<1e-9,'personal expense saved via Compra manual')
    E("ids=>{const m=L(),x=m.personal.find(y=>!ids.includes(y.id));spend(x.method,-x.amount);m.personal=m.personal.filter(y=>y!==x);save()}",ids0)
    pg.click('#fab');pg.click('#fabman');pg.click('#kshared');pg.wait_for_timeout(80);check(E("D&&D.isNew")==True and pg.locator('#psave').count()==1,'compartida opens shared purchase')
    E("dlg().close()");pg.click('#fab');pg.click('#fabinc');pg.wait_for_timeout(80);check(pg.locator('#isave').count()==1 and pg.locator('#tabg').count()==0,'ingreso dialog')
    E("()=>{window.__sc=0;window.scanReceipt=()=>{window.__sc++}}");E("dlg().close()");pg.click('#fab');pg.click('#fabscan');pg.wait_for_timeout(50);check(E("window.__sc")==1,'cargar recibo -> scanner')
    E("dlg().close();tab='ini';render()");pg.wait_for_timeout(80)
    # Fase 2: Mi balance
    c=E("calc(L())");bv=pg.inner_text('#balv');check(bv==E("v=>f(v)",c['bal']),'balance number %s'%bv)
    check((E("document.getElementById('balv').className")=='neg')==(c['bal']<0),'red if negative')
    bt=pg.inner_text('#balcard');check(E("v=>f(v)",c['money']) in bt and E("v=>f(v)",c['debt']) in bt and pg.locator('#baldet').count()==0,'two lines, closed by default')
    y=E("()=>{const h=document.getElementById('herocard'),b=document.getElementById('balcard');return h.nextElementSibling===b}");check(y,'right under Disponible ahora')
    E("()=>document.querySelectorAll('.toast').forEach(t=>t.remove())");shot(pg,'hoy-'+lang)
    pg.click('#baltog');pg.wait_for_timeout(60);dt=pg.inner_text('#baldet');check(pg.inner_text('#balcard').count(T('💰 A mi favor'))==1,'no repeated lines when open')
    for l,v in [('Débito, efectivo y cheques',c['inc']),('Por cobrar Tony',c['tony']),('Por cobrar Carlos',c['carlosDue']),('Tarjetas de crédito',c['credit']),('Cuentas de Tony',c['bills']-c['xfer'])]:
        check(T(l) in dt and E("v=>f(r2(v))",v) in dt,'%s %s'%(l,dt))
    check(T('Cuentas de Carlos') not in dt,'Carlos line hidden when 0')
    check(abs(c['money']-(c['inc']+c['tony']+c['carlosDue']))<1e-6 and abs(c['debt']-(c['credit']+c['bills']-c['xfer']+c.get('joeOwesCarlos',0)))<1e-6,'math = calc()')
    if ES:shot(pg,'mi-balance-abierto','#balcard')
    # Carlos line when Joe owes Carlos
    E("()=>{L().purchases.push({id:'cx',store:'Costco',date:'2026-10-12',total:3000,mode:'fam',who:['Yo','Tony','Carlos'],method:'',paidBy:'Carlos',shares:{Tony:1500,Carlos:750,Yo:750}});save();render()}");pg.wait_for_timeout(60)
    c2=E("calc(L())");check(c2['joeOwesCarlos']>0 and T('Cuentas de Carlos') in pg.inner_text('#baldet') and E("v=>f(v)",c2['joeOwesCarlos']) in pg.inner_text('#baldet'),'Cuentas de Carlos shown when >0')
    E("()=>{L().purchases=L().purchases.filter(p=>p.id!=='cx');save();BAL_OPEN=false;render()}")
    # Plan del mes
    P=E("withEst(planNums)");pl=pg.locator('#plancard')
    ids=['pl-inc','pl-bud','pl-plan','pl-real','pl-proj'];check(all(pl.locator('#'+i).count()==1 for i in ids) and pl.locator('.row').count()==5,'5 lines')
    fs=E("()=>[...document.querySelectorAll('#plancard .row.pl')].map(r=>getComputedStyle(r.querySelector('b')).fontSize+'|'+getComputedStyle(r.querySelector('.n')).fontSize)");check(len(set(fs))==1,'same level %s'%fs)
    for i,k in [('pl-inc','inc'),('pl-bud','bud'),('pl-plan','plan'),('pl-real','real'),('pl-proj','proj')]:
        check(E("v=>f(v)",P[k]) in pg.inner_text('#'+i),'%s %s'%(i,pg.inner_text('#'+i)))
    tx=pl.inner_text();check(('Gastado' not in tx) and ('Recibido' not in tx) and ('Disponible ahora' not in tx),'no explanations')
    E("()=>{S.budgets={'🛒 Comida/Supermercado':99999};save();render()}");pg.wait_for_timeout(50)
    check(E("document.querySelector('#pl-plan b').className")=='neg','negative in red')
    E("o=>{S.budgets=o;save();render()}",json.loads(pre)['budgets'])
    # Por hacer -> informative line, opens the full list
    n=E("todoN()");tl=pg.inner_text('#todoline');check(pg.locator('#todocard').count()==0 and (str(n) in tl) and '›' in tl,'todo line '+tl)
    pg.click('#todobtn');pg.wait_for_timeout(60);check(E("tab")=='mov' and pg.locator('#v>#todocard').count()==1,'v79: opens Operaciones › Por hacer');E("()=>{tab='ini';render()}")
    E("dlg().close()")
    # version label automatic
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(600);E("()=>render()");sw=open(os.path.join(ROOT,'sw.js')).read();v=sw.split("'finanzas-")[1].split("'")[0]
    check(pg.inner_text('#appver').endswith(v),'version %s %s'%(pg.inner_text('#appver'),v))
    # failure notice still shown
    E("()=>{localStorage.setItem('finanzas-mig-status','fail:x');tab='ini';render()}");check(pg.locator('#mignote').count()==1,'error notice kept')
    E("()=>{localStorage.setItem('finanzas-mig-status','ok')}")
    st=json.loads(E("JSON.stringify(S)"));st0=json.loads(pre)
    for k_ in ['updatedAt']:st.pop(k_,None);st0.pop(k_,None)
    import difflib
    a=json.dumps(st0['months'],sort_keys=True,indent=0).splitlines();b=json.dumps(st['months'],sort_keys=True,indent=0).splitlines()
    dd=[l for l in difflib.unified_diff(a,b,lineterm='',n=0) if l[:1] in '+-' and not l.startswith(('+++','---'))]
    check(not dd,'no data changes %s'%dd[:20])
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
print('test_v78 OK',ok)
