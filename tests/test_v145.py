"""v145 (DATOS DE EJEMPLO): filas de tarjeta solo con PAGAR; Ajustar y Devolución en el +.
python tests/test_v145.py
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

def empty_month(deb=1000, cards=None, extra_income=None):
    inc=[{'id':'i1','name':'Débito','amount':deb,'role':'debit'}]
    if extra_income: inc.extend(extra_income)
    return {'income':inc,'cards':cards or [],'bills':[],'personal':[],'purchases':[],'events':[],'tonyBase':0}

def state():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']=empty_month(1000, [
        {'id':'amz','name':'Amazon','amount':124},
        {'id':'c1','name':'Visa Test','amount':80},
        {'id':'c2','name':'Store Card','amount':45},
    ], extra_income=[{'id':'cash1','name':'Efectivo','amount':40}])
    S['cardDue']=dict(S.get('cardDue') or {}, Amazon=15)
    S['months']['2026-11']['personal']=[
        {'id':'amz1','date':'2026-11-02','amount':80,'cat':'👕 Ropa','desc':'Amazon','method':'card:Amazon'},
    ]
    return S

with app(ROOT,now='2026-11-14T14:20:00',state=state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(400)
    check(E('CODE_V')=='v145','ver')
    check(E('typeof rfAdjDlg')=='function' and E('typeof adjDlg')=='function' and E('typeof doAdj')=='function','api intacta')
    E("()=>{tab='mov';render()}")
    pg.wait_for_timeout(200)
    cards=E("document.getElementById('bal-cards')&&document.getElementById('bal-cards').innerText") or ''
    inc=E("document.getElementById('bal-income')&&document.getElementById('bal-income').innerText") or ''
    check('PAGAR' in cards and 'Amazon' in cards and 'Visa Test' in cards,'filas de tarjeta')
    check('Ajustar' not in cards and 'Devolución' not in cards,'sin Ajustar ni Devolución en tarjetas')
    check('vence día 15' in cards,'sigue el día de vencimiento')
    check(E("document.querySelectorAll(\"#bal-cards button[onclick*='rfDlg'], #bal-cards button[onclick*='adjDlg']\").length")==0,'sin esos botones en #bal-cards')
    check(E("!!document.querySelector(\"#bal-cards button[onclick*='cardPayDlg']\")"),'PAGAR sigue')
    check('Ajustar' in inc and 'Débito' in inc,'Ajustar sigue en saldos (débito/efectivo)')
    check(E("document.querySelectorAll(\"#bal-income button[onclick*='adjDlg']\").length")>=1,'botón Ajustar en cuentas de dinero')
    mark(pg)
    # recortar a la tarjeta de créditos
    loc=pg.locator('#bal-cards')
    if loc.count():
        loc.screenshot(path=os.path.join(SH,'v145-cuentas-solo-pagar.png'))
    else:
        pg.screenshot(path=os.path.join(SH,'v145-cuentas-solo-pagar.png'))

    pg.click('#fab');pg.wait_for_timeout(250)
    check(E("!!document.getElementById('fabrf')") and E("!!document.getElementById('fabadj')"),'ambas opciones en el +')
    fab=E("dlg().innerText")
    check('Devolución a la tarjeta' in fab and 'Ajustar saldo de tarjeta' in fab,'textos en el +')
    mark(pg)
    pg.screenshot(path=os.path.join(SH,'v145-menu-mas.png'))

    # Ajustar: picker sin preselección, luego el diálogo de siempre
    pg.click('#fabadj');pg.wait_for_timeout(250)
    check(E("dlg().querySelector('h2')&&dlg().querySelector('h2').innerText.includes('Ajustar saldo de tarjeta')"),'picker')
    check(E("!document.querySelector('#adjchips .pay')"),'ninguna tarjeta preelegida')
    check(E("!!document.getElementById('ajn')") is False,'aún no el formulario de ajuste')
    pg.click('[data-adjcard="amz"]');pg.wait_for_timeout(250)
    check(E("!!document.getElementById('ajn') && !!document.getElementById('ajd') && !!document.getElementById('ajok')"),'diálogo de ajuste existente')
    h2=E("dlg().querySelector('h2')&&dlg().querySelector('h2').innerText") or ''
    check('Amazon' in h2,'título con la tarjeta')
    # comportamiento de doAdj intacto: 124 → 100, débito igual, evento adjust
    E("()=>{document.getElementById('ajn').value='100';document.getElementById('ajn').dispatchEvent(new Event('input',{bubbles:true}))}")
    pg.wait_for_timeout(100)
    pg.click('#ajok');pg.wait_for_timeout(350)
    s=E("""()=>{
      const m=S.months['2026-11'], c=m.cards.find(x=>x.id==='amz'), deb=m.income.find(x=>x.role==='debit');
      const ev=(m.events||[]).filter(e=>e.type==='adjust');
      return {card:+c.amount, deb:+deb.amount, n:ev.length, ev:ev[0]||{}};
    }""")
    check(abs(s['card']-100)<0.004 and abs(s['deb']-1000)<0.004,'ajuste 124→100, débito intacto')
    check(s['n']==1 and s['ev']['lineKind']=='cards' and s['ev']['lineId']=='amz' and abs(s['ev']['diff']+24)<0.004,'evento adjust')

    # Devolución del + sigue igual, sin preselección
    pg.click('#fab');pg.wait_for_timeout(200)
    pg.click('#fabrf');pg.wait_for_timeout(250)
    check(E("dlg().querySelector('h2').innerText.includes('Devolución')"),'devolución en el +')
    check(E("!document.querySelector('#rfchips .pay')"),'devolución sin tarjeta preelegida')

print('OK',ok)
