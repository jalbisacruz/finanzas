"""v167 (DATOS DE EJEMPLO): Hoy sin fila de atajos; caja azul con total Walmart, OnePay y A cobrar;
Deudas Joe→Tony ya incluido en Transferir; sin filas Transferir/por hacer en Hoy.
python3 tests/test_v167.py
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

def nov():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1500,'role':'debit'}],
      'cards':copy.deepcopy(S['months']['2026-10'].get('cards') or []),
      'bills':copy.deepcopy(S['months']['2026-10'].get('bills') or []),
      'personal':[],
      'purchases':[{'id':'pt','store':"Sam's Club",'date':'2026-11-08','total':90,'paidBy':'Tony',
                    'shares':{'Yo':30,'Tony':30,'Carlos':30}}],
      'events':[
        {'id':'w1','type':'income','date':'2026-11-05','amount':226.51,'concept':'🏪 Walmart','desc':'Walmart','method':'deb'},
        {'id':'e1','type':'income','date':'2026-11-06','amount':40,'concept':'OnePay','desc':'EarlyPay 1','method':'deb'},
        {'id':'e2','type':'income','date':'2026-11-08','amount':25.5,'concept':'⚡ OnePay','desc':'EarlyPay 2','method':'deb'},
      ]}
    S['incCats']=list(S.get('incCats') or [])+['OnePay']
    S['checks']=[{'id':'c1','amount':531.60,'date':'2026-11-05','status':'deposited'},{'id':'c2','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'}]
    S['wm']={'est':200,'chk':{'2026-11-19':200},'paid':{'2026-11-05':226.51}}
    return S

# ---------- Hoy de siempre (fixture oct): sin atajos ni transferir/por hacer ----------
with app(ROOT,now='2026-11-26T13:00:00',new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    check(E('CODE_V')>='v167','CODE_V')
    E("()=>{tab='ini';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    check(not E("!!document.getElementById('scrow')"),'Hoy sin fila de atajos')
    hoy=pg.inner_text('#v')
    check('Cuadrar banco' not in hoy and not E("!!document.getElementById('sc-ini-0')"),'sin atajos Compra/Cuadrar en Hoy')
    check(not E("!!document.getElementById('todoline')") and not E("!!document.getElementById('todobtn')"),'sin línea cosas por hacer')
    check('cosas por hacer' not in hoy and 'cosa por hacer' not in hoy,'sin texto por hacer: '+hoy[:400])
    rem=E("(document.getElementById('remcard')||{}).innerText||''")
    check('Cuentas de Tony' not in rem and 'Transferir a Tony' not in rem,'sin recordatorio de transferir: '+rem)
    check('Visa Test' in rem or 'vence' in rem,'se queda el vencimiento: '+rem)
    check('respaldo' in rem.lower() or 'Sin respaldo' in rem,'se queda el respaldo: '+rem)
    check(E("!!document.getElementById('balcard')"),'Mi balance')
    check(E("!!document.getElementById('v165hoy')") or 'Compras por revisar' in hoy,'Compras por revisar')
    check(E("!!document.getElementById('plancard')"),'Plan del mes')
    E("()=>scrollTo(0,0)");pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v167-hoy-arriba-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('balcard');if(e)scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-70))}")
    pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v167-hoy-medio-phone.png'),full_page=False)
    # Operaciones y Reportes sí tienen atajos; Por hacer sigue con Transferir
    E("()=>{tab='mov';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    sc=E("(()=>{const e=document.getElementById('scrow');return e?e.innerText:''})()");check(bool(sc) and 'Compra' in sc,'Operaciones conserva atajos: '+sc)
    todo=E("(document.getElementById('todocard')||{}).innerText||''")
    check('Transferir a Tony' in todo,'Por hacer sigue con Transferir: '+todo)
    E("()=>{const c=document.getElementById('todocard');if(c){c.querySelector('h2')&&c.querySelector('h2').click();scrollTo(0,Math.max(0,c.getBoundingClientRect().top+scrollY-80))}}")
    pg.wait_for_timeout(250)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v167-operaciones-por-hacer-phone.png'),full_page=False)
    E("()=>{tab='rep';render();scrollTo(0,0)}");pg.wait_for_timeout(300)
    rc=E("(document.getElementById('rccard')||{}).innerText||''")
    check('Cuadrar' in rc,'Reportes conserva Cuadrar banco (tarjeta): '+rc[:200])
    E("()=>{tab='cfg';render();scrollTo(0,0)}");pg.wait_for_timeout(300)
    check(E("!!document.getElementById('bkcfg')") and E("!!document.getElementById('budcfg')"),'Configuración sigue con Respaldo y Categorías')
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)

# ---------- Nov: caja azul + Deudas Joe→Tony ----------
with app(ROOT,now='2026-11-09T15:00:00',state=nov(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    check(E('CODE_V')>='v167','CODE_V nov')
    check(abs(E("wmGross('2026-11-19')")-200)<0.01 and abs(E("epCycleSum()")-65.5)<0.01,'totales')
    check(abs(E("wmAmt('2026-11-19')")-134.5)<0.01,'el neto del cheque no cambia (134.50)')
    E("()=>{tab='ini';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    check(not E("!!document.getElementById('scrow')"),'Hoy nov sin atajos')
    w=pg.inner_text('#wmhero')
    check('Walmart' in w and ('~$200.00' in w or '$200.00' in w),'Walmart es el total: '+w)
    check('$134.50' not in w.split('A cobrar')[0] if 'A cobrar' in w else True,'el total no es el neto: '+w)
    check('Cobrado con OnePay' in w and '$65.50' in w,'OnePay: '+w)
    check('A cobrar' in w and '$134.50' in w,'A cobrar = diferencia: '+w)
    check('EarlyPay' not in w,'ya no dice EarlyPay: '+w)
    check('jueves alternos' in w or '19' in w,'se queda la fecha: '+w)
    check(E("!!document.getElementById('wmadj')") and 'Ajustar' in E("document.getElementById('wmadj').textContent"),'botón Ajustar')
    E("()=>{const e=document.getElementById('herocard')||document.getElementById('wmhero');if(e)scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-80))}")
    pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v167-hoy-walmart-onepay-phone.png'),full_page=False)
    # Ajustar abre la ventana de Walmart
    pg.click('#wmadj');pg.wait_for_timeout(300)
    dlg=pg.inner_text('#dlg')
    check('Walmart' in dlg or 'Estimado' in dlg,'Ajustar abre el estimado: '+dlg)
    E("dlg().close()")
    # Deudas
    food=E("tonyFood(M())")
    check(abs(food-30)<0.01,'tonyFood $30')
    due0=E("calc(M()).tonyDue")
    jt=E("owesBy(M()).find(x=>x.joeTony)")
    check(jt and abs(jt['v']-30)<0.01,'owesBy incluye Joe→Tony')
    # v179: la tarjeta «Deudas de compras» ya no está en Hoy; el dato (owesBy) sigue igual
    check(E("!document.getElementById('owecard')"),'v179: Hoy sin «Deudas de compras»')
    check(abs(E("calc(M()).tonyDue")-due0)<0.001,'Transferir a Tony no sube por mostrar la deuda')
    E("()=>{const e=document.getElementById('owecard');if(e)scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-80))}")
    pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v167-hoy-deudas-phone.png'),full_page=False)
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)

# WebKit: atajos fuera, OnePay y Deudas
with app(ROOT,now='2026-11-09T15:00:00',state=nov(),new_look=True,browser='webkit') as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    E("()=>{tab='ini';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    check(not E("!!document.getElementById('scrow')") and not E("!!document.getElementById('todoline')"),'WebKit Hoy sin atajos ni por hacer')
    w=pg.inner_text('#wmhero')
    check('Cobrado con OnePay' in w and 'A cobrar' in w and '$200.00' in w,'WebKit caja azul: '+w)
    check(E("!document.getElementById('owecard')") and abs(E("owesBy(M()).find(x=>x.joeTony).v")-30)<0.01,'WebKit: sin tarjeta Deudas (v179), owesBy igual')
    E("()=>{const e=document.getElementById('wmhero');if(e)scrollTo(0,Math.max(0,e.getBoundingClientRect().top+scrollY-80))}")
    pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v167-hoy-webkit-phone.png'),full_page=False)
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)

print('test_v167 OK',ok)
