"""v79 (plan fases 3-4 + lo más nuevo primero): Operaciones, sin pantalla Mes, sin ☰ ni chips, barra nueva, Reportes con Resumen,
Configuración cerrada, historiales de lo más nuevo a lo más viejo (made-up data): python tests/test_v79.py [--shots]"""
import json,os,sys,copy,re
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
def shot(pg,n,loc=None,full=False):
    if not SH:return
    pg.evaluate("()=>document.querySelectorAll('.toast').forEach(t=>t.remove())")
    p=os.path.join(ROOT,'shots','144-%s.png'%n)
    (pg.locator(loc).screenshot(path=p) if loc else pg.screenshot(path=p,full_page=full))
ids=lambda pg:pg.evaluate("[...document.querySelectorAll('#v>.card')].map(c=>c.id)")
for lang in ['es','en']:
  ES=lang=='es'
  with app(ROOT,lang=lang,width=390,height=844,expand=False) as pg:
    E=pg.evaluate;T=lambda s,*a:E("([s,a])=>T(s,...a)",[s,list(a)])
    E("()=>{localStorage.removeItem('finanzas-collapsed');navCol={};localStorage.setItem('finanzas-mig-status','ok');tab='ini';render()}")
    pre=json.dumps(E("S.months"),sort_keys=True)
    # ---- Fase 4: barra, sin ☰, sin chips, sin Mes ----
    check(E("[...document.querySelectorAll('nav button')].map(b=>b.dataset.t).join()")=='ini,mov,rep,cfg','bottom bar Hoy·Operaciones·Reportes·Configuración')
    nt=pg.inner_text('nav');check(all(x in nt for x in (['Hoy','Operaciones','Reportes','Configuración'] if ES else ['Today','Operations','Reports','Settings'])),nt)
    check(pg.locator('#fab').is_visible(),'floating +')
    for t in ['ini','mov','rep','cfg']:
        E(f"()=>{{tab='{t}';render()}}");pg.wait_for_timeout(60)
        check(pg.locator('#menub').count()==0 and pg.locator('#drawer').count()==0 and pg.locator('#chipbar').count()==0,'no ☰ / chips on '+t)
        check(pg.locator('#msel').is_visible() and pg.locator('#newm').is_visible(),'month selector + "+ Mes" at top on '+t)
    E("()=>{tab='res';render()}");check(E("tab")=='mov','old Mes tab opens Operaciones')
    if ES:
        E("()=>{tab='ini';render();scrollTo(0,0)}");shot(pg,'hoy');shot(pg,'barra','nav')
    # ---- Hoy: la línea de Por hacer lleva a Operaciones ----
    E("()=>{tab='ini';render()}");n=E("todoN()");pg.click('#todobtn');pg.wait_for_timeout(80)
    check(E("tab")=='mov' and not E("dlg().open") and [i for i in ids(pg) if i!='oscard'][0]=='todocard','todo line opens Operaciones › Por hacer')
    # ---- Fase 3: Operaciones ----
    order=ids(pg);exp=['todocard','comcard','opinc','bal-income','bal-cards','movcard','billsm']
    check([i for i in order if i in exp]==exp,'Operaciones order %s'%order)
    col=lambda i:E(f"document.getElementById('{i}').classList.contains('col')")
    check(not col('todocard') and not col('comcard') and not col('opinc'),'Por hacer, Compras, Ingresos open')
    check(col('bal-income') and col('bal-cards') and col('billsm'),'Débitos, Créditos, Cuentas de Tony closed by default')
    hd=pg.inner_text('#v');check(T('Banco').upper() in hd.upper() and T('Débitos') in hd and T('Créditos') in hd,'Banco › Débitos / Créditos')
    td=pg.inner_text('#todocard')
    check(T('Cierre {0}',E("lbl(S.cur)")) in td and ('📤 Tony' in td and '📤 Carlos' in td),'cierre + 📤 inside Por hacer '+td)
    check(E("todoN()")==n and pg.locator('#todocard .pay').count()>=n,'every to-do action has its button')
    check(E("prevPend().length")==0 or T('Pendientes de meses anteriores') in td,'previous months pending inside Por hacer')
    c=E("(()=>{const c=calc(M());return {tonyDue:c.tonyDue,carlosDue:c.carlosDue,xfer:c.xfer}})()")
    if c['tonyDue']>0.005: check(pg.locator('#todocard #tonybtn').count()==1,'Transferir a Tony in Por hacer')
    if c['carlosDue']>0.005: check(pg.locator('#todocard #carlosbtn').count()==1,'Cobrar a Carlos in Por hacer')
    if ES: shot(pg,'por-hacer','#todocard')
    # Compras
    cm=pg.inner_text('#comcard');check(cm.startswith('▾') or T('Compras') in cm.split('\n')[0],'Compras title '+cm[:40])
    check(T('Compra compartida') not in cm and T('+ Nueva compra compartida') not in cm,'name is Compras, not Compra compartida')
    check(pg.locator('#comcard [id^=scanc]').count()==1,'Cargar recibo next to Nueva compra')
    np=E("hList().length");check(pg.locator('#comcard .hrow').count()==min(3,np),'compact purchases preview')
    pg.click('#comcard button[onclick="editP()"]');pg.wait_for_timeout(60);check(E("dlg().open") and T('🛒 Nueva compra') in pg.inner_text('#dlg h2'),'Compras opens the purchase window: '+pg.inner_text('#dlg h2'));E("dlg().close()")
    E("()=>{M().purchases.unshift({id:'q1',store:'Uno',date:'2026-10-05',total:9,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',shares:{Tony:3,Carlos:3,Yo:3}},{id:'q2',store:'Dos',date:'2026-10-05',total:6,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',shares:{Tony:2,Carlos:2,Yo:2}});render()}")
    pg.click('#comall');pg.wait_for_timeout(60);check(pg.locator('#comcard #hrange').count()==1 and pg.locator('#comcard .hrow').count()==E("hList().length"),'Ver todas shows the full history with range chips')
    hr=E("[...document.querySelectorAll('#comcard .hrow')].map(e=>e.dataset.id)");hd2=E("hList().map(o=>o.p.date)")
    check(hd2==sorted(hd2,reverse=True),'purchases newest first %s'%hd2)
    check(hr.index('q1')<hr.index('q2')<hr.index('p2'),'same date: most recently created first %s'%hr)
    if ES: E("scrollTo(0,0)");shot(pg,'compras-todas','#comcard')
    pg.click('#comcard .hrow[data-id="q1"] .tot');pg.wait_for_timeout(60);check(E("dlg().open") and pg.locator('#dlg .del, #dlg button.del').count()>=1,'edit/delete still available from the list');E("dlg().close()")
    pg.click('#comless');pg.wait_for_timeout(40);check(pg.locator('#comcard #hrange').count()==0,'Ver menos')
    E("()=>{M().purchases=M().purchases.filter(p=>!/^q/.test(p.id));render()}")
    # Ingresos
    pg.click('#opincb');pg.wait_for_timeout(60);check(E("dlg().open") and T('Registrar ingreso') in pg.inner_text('#dlg'),'Ingresos opens its window');E("dlg().close()")
    check(E("f(earned(M()).total)") in pg.inner_text('#opinc h2'),'Ingresos total')
    # Banco › Débitos (Efectivo aunque esté en $0, cheques depositados) y Créditos
    pg.click('#bal-income>h2');pg.wait_for_timeout(40);bi=pg.inner_text('#bal-income')
    check(T('Efectivo') in bi or E("M().income.filter(x=>x!==debE(M())).map(x=>DN(x.name)).join()") in bi,'cash line shown')
    check(pg.locator('#bal-income #chkcard').count()==1 and T('Cheques depositados') in bi,'deposited checks in Débitos')
    dc=E("depChecks().map(c=>c.date)");check(dc==sorted(dc,reverse=True),'checks newest first %s'%dc)
    check(pg.locator('#bal-income .adj').count()>=1,'Ajustar in Débitos')
    E("()=>{window._inc0=JSON.stringify(M().income);M().income=M().income.filter(x=>x===debE(M()));render()}")
    check(pg.locator('#cash0').count()==1 and '$0.00' in pg.inner_text('#cash0'),'Efectivo shown at $0')
    E("()=>{M().income=JSON.parse(window._inc0);render()}")
    pg.click('#bal-cards>h2');pg.wait_for_timeout(40);check(pg.locator('#bal-cards .row').count()==E("M().cards.length") and pg.locator('#bal-cards .pay').count()==E("M().cards.length"),'all cards with PAGAR in Créditos')
    # Movimientos
    nm=E("moves(M()).length");check(pg.locator('#movcard>.row').count()==min(3,nm) and pg.locator('#movq').count()==0,'compact movements')
    check(pg.locator('#movcard>.row .del').count()>=1,'delete still available in preview')
    pg.click('#movall');pg.wait_for_timeout(60);check(pg.locator('#movq').count()==1 and pg.locator('#movcard>.row').count()==nm,'Ver todos los movimientos')
    md=E("moves(M()).map(x=>x.date)");check(md==sorted(md,reverse=True),'movements newest first %s'%md)
    if ES: E("()=>document.querySelectorAll('.card').forEach(c=>c.classList.remove('col'))");E("scrollTo(0,0)");shot(pg,'operaciones-abierta',full=True)
    pg.click('#movless');pg.wait_for_timeout(40)
    # Cuentas de Tony del mes (Comida con recibos + ajuste, Transferir a Tony)
    E("()=>{localStorage.removeItem('finanzas-collapsed');navCol={};render()}")
    pg.click('#billsm>h2');pg.wait_for_timeout(40);b=pg.inner_text('#billsm')
    check(pg.locator('#billsm input[type=number]').count()==E("M().bills.length") and pg.locator('#billsm #billsxfer').count()==1,'bills editable + Transferir a Tony '+b[-80:])
    E("()=>{localStorage.removeItem('finanzas-collapsed');navCol={};render();scrollTo(0,0)}")
    shot(pg,'operaciones-'+lang)
    # ---- Reportes ----
    E("()=>{tab='rep';render();scrollTo(0,0)}");pg.wait_for_timeout(60);r=ids(pg)
    check(r[0]=='rescard' and r[1]=='gastocard','Resumen first, then Gastos del mes %s'%r)
    check(all(pg.locator('#rescard #'+i).count()==1 for i in ['pdfbtn','pdft','pdfc']) and pg.locator('#rescard #pdfdl').count()==0,'v94: Mi resumen / Tony / Carlos')
    g=pg.inner_text('#gastocard');check(T('Gastos del mes: {0} (ya restados de tus saldos)',E("f(spent(M()).total)")) in g,g)
    check(col('gpcard') and not col('inccard') and col('acccard'),'Gasto y presupuesto closed, Ingresos open, Acumulado as before')
    for i in ['cbcard']:
        if pg.locator('#'+i).count():check(col(i),i+' closed')
    rm=E("[...document.querySelectorAll('#v>.card')].filter(c=>/💸/.test(c.textContent.slice(0,40))).map(c=>c.classList.contains('col'))");check(all(rm),'Remesas closed')
    with pg.expect_download(timeout=20000) as d: pg.evaluate("pdfDl('tony',S.cur)")
    check(d.value.suggested_filename.endswith('.pdf'),'PDF de Tony downloads')
    shot(pg,'reportes-'+lang)
    # ---- Configuración: todo cerrado ----
    E("()=>{tab='cfg';render();scrollTo(0,0)}");pg.wait_for_timeout(60)
    cc=E("[...document.querySelectorAll('#v>.card')].filter(c=>c.querySelector(':scope>h2')).map(c=>[c.id,c.classList.contains('col')])")
    check(len(cc)>=8 and all(x[1] for x in cc),'every Configuración section closed %s'%[x for x in cc if not x[1]])
    if ES: shot(pg,'configuracion')
    # ---- reachability of what was only in ☰ or Mes ----
    E("()=>{tab='ini';render()}");check(pg.locator('#balcard').count()==1,'Mi balance (was Mes) on Hoy')
    E("()=>{BAL_OPEN=true;render()}");bt=pg.inner_text('#balcard');check(T('Débito, efectivo y cheques') in bt and T('Tarjetas de crédito') in bt,'Detalle (was Mes) in Mi balance');E("()=>{BAL_OPEN=false;render()}")
    # ---- newest first: same date ties (gastos/compras se agregan al inicio, eventos al final) ----
    E("()=>{const m=M();m.personal.unshift({id:'t1',date:'2026-10-08',amount:1,cat:'📦 Otros',desc:'viejo',method:'deb'});m.personal.unshift({id:'t2',date:'2026-10-08',amount:2,cat:'📦 Otros',desc:'nuevo',method:'deb'});m.events.push({id:'t3',type:'income',date:'2026-10-06',amount:1,concept:'💵 Propinas'},{id:'t4',type:'income',date:'2026-10-06',amount:2,concept:'💵 Propinas'})}")
    mv=E("moves(M()).map(x=>x.id)");check(mv.index('t2')<mv.index('t1') and mv.index('t4')<mv.index('t3'),'ties: most recently created first %s'%mv)
    E("()=>{const m=M();m.personal=m.personal.filter(x=>!/^t\\d/.test(x.id));m.events=m.events.filter(x=>!/^t\\d/.test(x.id))}")
    # messages / link snapshot / PDF purchase lists: newest first
    E("()=>{M().purchases.unshift({id:'q3',store:'Tres',date:'2026-10-01',total:9,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',shares:{Tony:3,Carlos:3,Yo:3}})}")
    for w in ['Tony','Carlos']:
        sd=E(f"snapFor('{w}').months[0]");dd=[p['d'] for p in sd['purchases']];check(sd.get('nf')==1 and dd==sorted(dd,reverse=True),'link snapshot newest first %s'%dd)
    td=E("tonyData(S.cur).pur.map(o=>o.p.date)");check(td==sorted(td,reverse=True),'Tony message list newest first')
    cd=E("carlosData(S.cur).pur.map(o=>o.p.date)");check(cd==sorted(cd,reverse=True),'Carlos message list newest first')
    E("()=>{M().purchases=M().purchases.filter(p=>p.id!=='q3')}")
    # inbox (Compras por revisar): newest first by arrival
    E("""async()=>{window._lk=S.links;S.links={Tony:{on:true,t:'tk'}};window._fu=window.fbUser;window._fi=window.fbInbox;window.fbUser=()=>true;
      window.fbInbox=async t=>[{t,id:'a',at:{seconds:100},store:'Viejo',date:'2026-10-09'},{t,id:'b',at:{toMillis:()=>300000},store:'Nuevo',date:'2026-10-01'},{t,id:'c',at:{seconds:200},store:'Medio',date:'2026-10-05'}];
      await inboxLoad(true)}""")
    check(E("INBOX.map(x=>x.id).join()")=='b,c,a','inbox newest first '+E("INBOX.map(x=>x.id).join()"))
    E("()=>{S.links=window._lk;window.fbUser=window._fu;window.fbInbox=window._fi;INBOX=[];render()}")
    check(json.dumps(E("S.months"),sort_keys=True)==pre,'no data changes')
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
# link page: snapshots published before v79 (oldest first) are shown newest first
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
with app(ROOT,width=390,height=844,expand=False) as pg:
    doc=pg.evaluate("snapFor('Tony')")
for mo in doc['months']:
    mo.pop('nf',None);mo['purchases']=sorted(mo['purchases'],key=lambda p:p['d'])
doc['months'][0]['purchases']=[{**doc['months'][0]['purchases'][0],'s':'Vieja','d':'2026-10-02'}]+doc['months'][0]['purchases']+[{**doc['months'][0]['purchases'][0],'s':'Nueva','d':'2026-10-12'}]
with app(ROOT,routes=R,init="window.__SHARE_DOC=%s;"%json.dumps(doc),width=390,height=844,expand=False) as pg:
    base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t=TokTokTokTokTokTokTok1');pg.wait_for_timeout(500)
    st=pg.evaluate("[...document.querySelectorAll('.pc .pt b')].map(b=>b.textContent)")
    check(len(st)>=3 and 'Nueva' in st[0] and 'Vieja' in st[-1],'link page newest first %s'%st)
print('test_v79 OK',ok)
