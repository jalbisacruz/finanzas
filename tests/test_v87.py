"""v87: 🤝 Dinero de terceros (made-up data): depósito sube el débito, envíos parciales lo bajan, bloqueos, editar/borrar revierte,
Mi balance (línea en Lo que debo), Disponible sin terceros, Movimientos 🤝, nada en ingresos/gastos/reportes, respaldo/restaurar, EN"""
import json,os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
def near(a,b):return abs(a-b)<0.005
with app(ROOT,now='2026-10-17T18:30:00',expand=False,width=390,height=844) as pg:
    E=pg.evaluate;msgs=[]
    pg.remove_listener('dialog',pg.listeners('dialog')[0]) if hasattr(pg,'listeners') else None
    def dlgh(d):msgs.append(d.message);d.accept()
    pg.on('dialog',dlgh)
    def shot(name,sel=None):
        pg.add_style_tag(content='.toast,#fab,#totop,[id*=top]{display:none!important}')
        E("s=>{if(s){const e=document.querySelector(s);window.scrollTo(0,e.getBoundingClientRect().top+scrollY-70)}else window.scrollTo(0,0)}",sel);pg.wait_for_timeout(150)
        pg.screenshot(path=os.path.join(ROOT,'shots',name))
    snap=lambda:E("""(()=>{const m=L(),c=calc(m),sp=spent(m),er=earned(m);return {deb:debE(m).amount,bal:c.bal,money:c.money,debt:c.debt,held:c.held||0,sp:sp.total,er:er.total,plan:JSON.stringify((({m,ent,cl,...p})=>p)(planNums())),
      kal:JSON.stringify([sp.by['📈 Kalshi']||0,er.by['📈 Kalshi']||0]),reem:typeof reembList==='function'?reembList(m).length:0,state:JSON.stringify(S.months)}})()""")
    check(E("S.held===undefined"),'old data has no S.held (safe default, nothing written)')
    s0=snap()
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(150)
    card=pg.locator('#heldcard');check(card.count()==1 and 'col' in card.get_attribute('class'),'section in Operaciones, closed by default')
    order=E("[...document.querySelectorAll('#v>.card')].map(c=>c.id)");check(order.index('heldcard')==order.index('bal-cards')+1,'after Créditos %s'%order)
    pg.click('#heldcard>h2');pg.wait_for_timeout(100);check(pg.locator('#heldnew').is_visible(),'opens; Nuevo depósito')
    pg.click('#heldnew');pg.wait_for_timeout(100)
    check(E("document.getElementById('hacct').value")=='deb' and E("document.getElementById('hvia').value")=='Western Union','defaults: debit, Western Union')
    pg.fill('#hwho','Mi amigo');pg.fill('#hamt','152');pg.fill('#hdate','2026-10-17');pg.fill('#hnote','Para enviarle poco a poco');pg.click('#hsave');pg.wait_for_timeout(200)
    s1=snap()
    check(near(s1['deb'],s0['deb']+152),'deposit raises debit by 152 %s→%s'%(s0['deb'],s1['deb']))
    check(near(s1['held'],152) and near(s1['bal'],s0['bal']) and near(s1['money'],s0['money']+152) and near(s1['debt'],s0['debt']+152),'Mi balance total unchanged: + in A mi favor, + Dinero de terceros in Lo que debo')
    for k in ['sp','er','plan','kal','reem']:check(s1[k]==s0[k],'not in %s %s %s'%(k,s0[k],s1[k]))
    check(json.loads(s1['state'])['2026-10']['events']==json.loads(s0['state'])['2026-10']['events'],'no income/expense events created')
    t=pg.inner_text('#heldcard');check('Pendiente por enviar: $152.00 de $152.00' in t and 'Mi amigo' in t and 'Western Union' in t,'pending shown '+t)
    if SH:shot('152-terceros-deposito.png','#heldcard')
    eid=E("S.held[0].id")
    # enviar parte (Zelle por defecto)
    pg.click(f'#hsend-{eid}');pg.wait_for_timeout(100);check(E("document.getElementById('hsv').value")=='Zelle','send default Zelle')
    pg.fill('#hsa','200');pg.click('#hssave');pg.wait_for_timeout(100);check(any('más de lo pendiente' in x for x in msgs) and E("S.held[0].sends.length")==0,'blocks sending more than pending')
    pg.fill('#hsa','50');pg.fill('#hsd','2026-10-18');pg.fill('#hsn','primera parte');pg.click('#hssave');pg.wait_for_timeout(200)
    s2=snap();check(near(s2['deb'],s1['deb']-50) and near(s2['held'],102) and near(s2['bal'],s0['bal']),'send 50: debit −50, pending 102, balance same')
    check('Pendiente por enviar: $102.00 de $152.00' in pg.inner_text('#heldcard'),'102 of 152')
    E("()=>{const e=S.held[0];sendDlg(e.id)}");pg.fill('#hsa','30');pg.fill('#hsd','2026-10-17');pg.click('#hssave');pg.wait_for_timeout(200)
    hist=[x.split('\n')[0] for x in pg.locator(f'#heldcard .hcard[data-id="{eid}"] .hhist .row').all_inner_texts()]
    check(hist[0].startswith('Enviado · Zelle') and 'primera parte' in pg.locator(f'#heldcard .hcard[data-id="{eid}"] .hhist .row').first.inner_text() and hist[-1].startswith('Depósito · Western Union'),'history newest first with method %s'%hist)
    # Disponible ahora / Hoy
    E("()=>{tab='ini';BAL_OPEN=true;render()}");pg.wait_for_timeout(150)
    disp=E("r2(sum(L().income,x=>x.amount))");check(pg.locator('#heldnote').count()==1 and '$72.00' in pg.inner_text('#heldnote'),'Hoy note')
    check(E("document.getElementById('dispv').textContent").replace('$','').replace(',','')==('%.2f'%(disp-72)),'Disponible ahora excludes held')
    check(pg.locator('#balheld').count()==1 and '$72.00' in pg.inner_text('#balheld'),'Mi balance detail line Dinero de terceros')
    if SH:shot('152-terceros-hoy.png')
    # Movimientos 🤝
    E("()=>{tab='mov';OPS_ALLM=true;render()}");pg.wait_for_timeout(150)
    rows=[r for r in pg.locator('#movcard .row').all_inner_texts() if '🤝' in r]
    check(len(rows)==3 and 'Enviado a Mi amigo · Zelle' in rows[0] and '$50.00' in rows[0] and 'Depósito de Mi amigo · Western Union' in rows[-1],'Movimientos 🤝 newest first %s'%rows)
    # bloqueo débito negativo
    E("()=>{debE(L()).amount=10;save();render()}");E("()=>{const e=S.held[0];sendDlg(e.id)}");pg.fill('#hsa','40');pg.click('#hssave');pg.wait_for_timeout(100)
    check(any('suficiente en el débito' in x for x in msgs) and E("S.held[0].sends.length")==2,'blocks negative debit');E("dlg().close()")
    E("o=>{debE(L()).amount=o;save();render()}",s2['deb']-30)
    # editar envío y depósito
    sid=E("S.held[0].sends.find(s=>s.amount===30).id");d0=E("debE(L()).amount")
    E(f"sendDlg('{eid}','{sid}')");pg.fill('#hsa','20');pg.click('#hssave');pg.wait_for_timeout(150)
    check(near(E("debE(L()).amount"),d0+10) and near(E("heldPend()"),82),'edit send 30→20 reverts 10')
    E(f"heldDlg('{eid}')");pg.fill('#hamt','60');pg.click('#hsave');pg.wait_for_timeout(100);check(any('no puede ser menor' in x for x in msgs) and E("S.held[0].amount")==152,'deposit can’t go below sent')
    pg.fill('#hamt','160');pg.click('#hsave');pg.wait_for_timeout(150);check(near(E("debE(L()).amount"),d0+10+8) and near(E("heldPend()"),90),'edit deposit 152→160 adds 8')
    # borrar envío (✕ en Movimientos) revierte
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(100);d1=E("debE(L()).amount")
    E(f"delMove('heldsend','hs:{eid}:{sid}')");pg.wait_for_timeout(150);check(near(E("debE(L()).amount"),d1+20) and near(E("heldPend()"),110),'✕ send reverts')
    # completar → ✅ y archivar
    E(f"sendDlg('{eid}')");pg.fill('#hsa','110');pg.click('#hssave');pg.wait_for_timeout(150)
    check(near(E("heldPend()"),0) and E("calc(L()).held")==None,'completed: nothing pending, no line')
    E("()=>{const c=document.getElementById('heldcard');if(c.classList.contains('col'))c.querySelector('h2').click();document.querySelectorAll('#heldcard details').forEach(d=>d.open=true)}");pg.wait_for_timeout(100)
    check(pg.locator('#helddone').count()==1 and '✅ Completado' in pg.inner_text('#helddone'),'completed group')
    if SH:shot('152-terceros-movimientos.png','#movcard')
    pg.click(f'#harch-{eid}');pg.wait_for_timeout(100);check(pg.locator('#heldarch').count()==1 and pg.locator('#helddone').count()==0,'archived')
    # borrar depósito con pendiente: quita sólo lo pendiente
    E("()=>{tab='mov';render()}");pg.click('#heldnew') if pg.locator('#heldnew').is_visible() else E("heldDlg()");pg.wait_for_timeout(100)
    pg.fill('#hwho','Prima');pg.fill('#hamt','40');pg.click('#hsave');pg.wait_for_timeout(100);e2=E("S.held.at(-1).id")
    E(f"sendDlg('{e2}')");pg.fill('#hsa','15');pg.click('#hssave');pg.wait_for_timeout(100);d2=E("debE(L()).amount")
    E(f"delMove('held','hd:{e2}')");pg.wait_for_timeout(150);check(near(E("debE(L()).amount"),d2-25) and E("S.held.length")==1,'delete deposit removes only unsent 25')
    # respaldo/restaurar y otros meses: viaja en el estado
    st=E("JSON.stringify(S)");E("o=>{setState(JSON.parse(o));save()}",st);check(E("S.held.length")==1 and E("S.held[0].sends.length")==2 and E("JSON.parse(localStorage.getItem('finanzas-v1')).held.length")==1,'survives setState (restore/sync)')
    E("()=>{const o=JSON.parse(JSON.stringify(S));delete o.held;setState(o)}");check(E("heldPend()")==0 and E("calc(L()).held")==None,'old backup without held works')
    # inglés
    E("o=>{setState(JSON.parse(o));LANG='en';tab='mov';render()}",st);pg.wait_for_timeout(100)
    E("()=>{const c=document.getElementById('heldcard');if(c.classList.contains('col'))c.querySelector('h2').click()}");check('Money held for others' in pg.inner_text('#heldcard'),'EN')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v87 OK',ok)
