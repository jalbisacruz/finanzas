"""v168 (DATOS DE EJEMPLO): Operaciones — atajos Compras/Ingresos/Transferencia/Cobro;
búsqueda 🔍 junto al mes; historial de ingresos; caja BANCO con entradas/salidas y
cargos/pagos/devoluciones; sin Movimientos; Dinero de terceros en Débitos si hay
pendiente; Cuentas de Tony en Reportes (solo lectura, o montos si falta la hoja).
python3 tests/test_v168.py
"""
import copy,json,os
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('#demoW').forEach(x=>x.remove());const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';
      (document.getElementById(host||'')||document.getElementById('dlg')||document.body).append(w)}""",host)

def with_ref_and_held():
    S=copy.deepcopy(FIX);S['cur']='2026-10'
    m=S['months']['2026-10']
    m['events']=list(m.get('events') or [])
    m['events'].append({'id':'rf1','type':'cardref','date':'2026-10-11','amount':12.5,'cardName':'Visa Test','store':'Shell'})
    S['held']=[{'id':'h1','who':'Ana','amount':80,'date':'2026-10-02','method':'deb','via':'Zelle','note':'','sends':[]}]
    return S

def with_sheet():
    S=copy.deepcopy(FIX);S['cur']='2026-10'
    m=S['months']['2026-10']
    for b in m['bills']:
        if b['name']=='Rent House':
            b['sheet']={'total':800,'sp':{'Joe':250,'Tony':250,'Carlos':150,'Arianna':150}}
            b['amount']=250
        else:
            b['sheet']={'total':b['amount'],'sp':{'Joe':b['amount'],'Tony':0,'Carlos':0,'Arianna':0}}
    return S

PHONE=dict(now='2026-10-13T10:00:00',new_look=True,width=390,height=900)

# ---------- atajos, búsqueda, ingresos, BANCO, sin movimientos ni cuentas ----------
with app(ROOT,**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    check(E('CODE_V')>='v168','CODE_V')
    E("()=>{tab='mov';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    check(E("!!document.getElementById('scrow')"),'atajos en Operaciones')
    labs=E("[...document.querySelectorAll('#scrow .scb span')].map(s=>s.textContent)")
    check(labs==['Compras','Ingresos','Transferencia','Cobro'],'atajos: '+str(labs))
    check(E("document.querySelectorAll('#scrow .scb').length")==4 and 'Compartida' not in (pg.inner_text('#scrow') or ''),'un solo Compras, no Compartida suelta')
    # 🔍 junto al mes; sin caja de búsqueda a la vista
    check(E("!!document.getElementById('osbtn')"),'botón 🔍 junto al mes')
    check(E("!document.getElementById('oscard')"),'sin caja de búsqueda abierta')
    # ingresos: historial + botón chico, no la tarjeta solo con el botón grande
    inc=pg.inner_text('#opinc') if pg.locator('#opinc').count() else ''
    check('Registrar ingreso' not in inc,'sin botón grande Registrar ingreso: '+inc[:200])
    check(E("!!document.getElementById('opincb')") and 'Agregar' in inc,'botón chico Agregar')
    check('Propinas' in inc and '700' in inc.replace(',',''),'historial de ingresos: '+inc[:300])
    # BANCO
    check(E("!!document.getElementById('bancobox')"),'caja BANCO')
    check(E("document.getElementById('bancobox').contains(document.getElementById('bal-income')) && document.getElementById('bancobox').contains(document.getElementById('bal-cards'))"),'Débitos y Créditos dentro de BANCO')
    E("()=>{if(typeof v170ExpandBanco==='function')v170ExpandBanco();else{['bal-income','bal-cards'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('col')});document.querySelectorAll('#bal-cards .v168cf').forEach(e=>e.classList.remove('v170col'))}}")
    pg.wait_for_timeout(80)
    deb=pg.inner_text('#debflows') if pg.locator('#debflows').count() else ''
    check('ENTRADAS' in deb.upper() and 'SALIDAS' in deb.upper(),'entradas y salidas: '+deb[:200])
    check('Propinas' in deb and ('Taco' in deb or 'Uber' in deb or 'Aldi' in deb),'entradas/salidas con movimientos: '+deb[:400])
    vis=pg.inner_text('#cardflows-c1') if pg.locator('#cardflows-c1').count() else ''
    check('Shell' in vis and 'Publix' in vis and 'Cargo' in vis,'cargos de Visa: '+vis[:300])
    check('Pago' in vis and ('100' in vis.replace(',','') or '$100' in vis),'pago de Visa: '+vis[:300])
    # sin Movimientos ni Cuentas de Tony aquí
    check(not E("!!document.getElementById('movcard')"),'sin sección Movimientos')
    check(E("(()=>{const e=document.getElementById('billsm');return !e||e.hidden||getComputedStyle(e).display==='none'})()"),'Cuentas de Tony no se ve en Operaciones')
    check(E("!!document.getElementById('todocard')"),'se queda Por hacer')
    # Dinero de terceros a $0: no hay tarjeta, solo atajo discreto
    check(not E("!!document.getElementById('heldcard')"),'sin tarjeta de terceros a $0')
    check(E("!!document.getElementById('heldadd')"),'atajo discreto para depósito de tercero')
    # Resumen de reparto: solo si hay hoja; en el fixture de oct no hay, no exigimos el card
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v168-operaciones-atajos-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('opinc');if(e)e.scrollIntoView()}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v168-operaciones-ingresos-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('bancobox');if(e)e.scrollIntoView()}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v168-operaciones-banco-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('todocard');if(e)e.scrollIntoView()}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v168-operaciones-por-hacer-phone.png'),full_page=False)

    # atajo Compras abre el selector
    E('v168NewBuy()');pg.wait_for_timeout(120)
    d=pg.inner_text('#dlg') if E('dlg().open') else ''
    check('Compra tuya' in d and 'Compra compartida' in d and 'Cargar recibo' in d,'selector Compras: '+d[:300])
    E("dlg().close()");pg.wait_for_timeout(40)
    # Ingresos abre el diálogo
    pg.click('#opincb');pg.wait_for_timeout(80)
    check(E('dlg().open') and 'Registrar ingreso' in pg.inner_text('#dlg'),'Agregar abre Registrar ingreso')
    E("dlg().close()")
    # 🔍 abre la búsqueda
    pg.click('#osbtn');pg.wait_for_timeout(200)
    check(E("!!document.getElementById('oscard')"),'🔍 abre la búsqueda')
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v168-operaciones-buscar-phone.png'),full_page=False)
    pg.click('#osbtn');pg.wait_for_timeout(150)
    check(E("!document.getElementById('oscard')"),'🔍 cierra la búsqueda')

    # Hoy sigue sin atajos (v167)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(250)
    check(not E("!!document.getElementById('scrow')"),'Hoy sigue sin atajos')

# ---------- devolución + dinero de terceros pendiente dentro de Débitos ----------
with app(ROOT,state=with_ref_and_held(),**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(400)
    E("()=>{if(typeof v170ExpandBanco==='function')v170ExpandBanco();else{['bal-income','bal-cards'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('col')});document.querySelectorAll('#bal-cards .v168cf').forEach(e=>e.classList.remove('v170col'))}}")
    pg.wait_for_timeout(80)
    vis=pg.inner_text('#cardflows-c1') if pg.locator('#cardflows-c1').count() else ''
    check('Devolución' in vis and 'Shell' in vis and ('12.50' in vis.replace(',','') or '12,50' in vis or '$12' in vis),'devolución en la tarjeta: '+vis[:300])
    check(E("!!document.getElementById('heldcard')"),'tarjeta de terceros cuando hay pendiente')
    check(E("document.getElementById('bal-income').contains(document.getElementById('heldcard'))"),'terceros dentro de Débitos')
    check('Ana' in (pg.inner_text('#heldcard') or ''),'pendiente de Ana')
    E("()=>{const e=document.getElementById('heldcard');if(e)e.scrollIntoView()}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v168-operaciones-terceros-phone.png'),full_page=False)

# ---------- Cuentas de Tony en Reportes: fallback si falta la hoja; solo lectura si está ----------
with app(ROOT,**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    E("()=>{tab='rep';render();if(typeof goSec==='function')goSec('billsm')}");pg.wait_for_timeout(300)
    check(E("!!document.getElementById('billsm')"),'Cuentas de Tony en Reportes')
    check(pg.locator('#billsm input[type=number]').count()>=1,'si falta la hoja se pueden anotar montos')
    lab=pg.inner_text('#bscopy') if pg.locator('#bscopy').count() else ''
    check('falta la hoja de Tony' in lab or 'copia del mes anterior' in lab,'aviso de hoja faltante: '+lab)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v168-reportes-cuentas-falta-hoja-phone.png'),full_page=False)

with app(ROOT,state=with_sheet(),**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    E("()=>{tab='rep';render();if(typeof goSec==='function')goSec('billsm')}");pg.wait_for_timeout(300)
    check(E("!!document.getElementById('billsm')"),'Cuentas de Tony con hoja en Reportes')
    check(pg.locator('#billsm input[type=number]').count()==0,'solo lectura cuando hay hoja')
    t=pg.inner_text('#billsm')
    check(('Rent House' in t or 'Renta de casa' in t) and ('250' in t.replace(',','') or '$250' in t),'muestra la parte de Joe: '+t[:300])
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200)
    check(E("(()=>{const e=document.getElementById('billsm');return !e||e.hidden||getComputedStyle(e).display==='none'})()"),'no se ve en Operaciones cuando hay hoja')
    E("()=>{tab='rep';const e=document.getElementById('billsm');if(typeof render==='function'){tab='rep';render()}}")
    E("()=>{tab='rep';render();const e=document.getElementById('billsm');if(e)e.scrollIntoView()}");pg.wait_for_timeout(120)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v168-reportes-cuentas-tony-phone.png'),full_page=False)

# ---------- inglés + webkit ----------
with app(ROOT,lang='en',**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
    labs=E("[...document.querySelectorAll('#scrow .scb span')].map(s=>s.textContent)")
    check(labs==['Purchases','Income','Transfer','Collect'] or 'Purchases' in labs or 'Income' in labs,'atajos EN: '+str(labs))
    inc=pg.inner_text('#opinc') if pg.locator('#opinc').count() else ''
    check('Add' in inc or 'Agregar' in inc,'botón add EN: '+inc[:200])
    E("()=>{if(typeof v170ExpandBanco==='function')v170ExpandBanco();else{['bal-income','bal-cards'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('col')});document.querySelectorAll('#bal-cards .v168cf').forEach(e=>e.classList.remove('v170col'))}}")
    pg.wait_for_timeout(80)
    deb=pg.inner_text('#debflows') if pg.locator('#debflows').count() else ''
    check('INFLOWS' in deb.upper() or 'ENTRADAS' in deb.upper(),'inflows EN: '+deb[:200])

with app(ROOT,browser='webkit',**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1000)
    E("()=>{tab='mov';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    check(E("!!document.getElementById('bancobox')") and E("!!document.getElementById('osbtn')"),'webkit BANCO y 🔍')
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v168-operaciones-webkit-phone.png'),full_page=False)

print('test_v168 OK',ok)
