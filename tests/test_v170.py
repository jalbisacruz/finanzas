"""v170 (DATOS DE EJEMPLO): En Operaciones › BANCO, Débitos y cada tarjeta de crédito
empiezan cerradas y se abren/cierran tocando el encabezado. PAGAR y los demás
botones no pliegan. Las listas de movimientos de cada tarjeta también empiezan
cerradas.
python3 tests/test_v170.py
"""
import os
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

PHONE=dict(now='2026-10-13T10:00:00',new_look=True,expand=False,width=390,height=900)

def vis(E,sel):
    return E("""(sel)=>{const e=document.querySelector(sel);if(!e)return false;
      if(e.classList.contains('col')||e.classList.contains('v170col'))return false;
      const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden')return false;
      let p=e.parentElement;while(p){if(p.classList&&p.classList.contains('col')&&p.classList.contains('card'))return false;p=p.parentElement}
      const r=e.getBoundingClientRect();return r.width>0&&r.height>0}""",sel)

with app(ROOT,**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    check(E('CODE_V')>='v170','CODE_V')
    E("()=>{tab='mov';render();scrollTo(0,0);const e=document.getElementById('bancobox');if(e)e.scrollIntoView({block:'start'});window.scrollBy(0,-70)}");pg.wait_for_timeout(400)
    check(E("!!document.getElementById('bancobox')"),'caja BANCO')
    check(E("document.getElementById('bal-income').classList.contains('colb') && document.getElementById('bal-income').classList.contains('col')"),'Débitos empieza cerrado')
    check(E("document.getElementById('bal-cards').classList.contains('colb') && document.getElementById('bal-cards').classList.contains('col')"),'Créditos empieza cerrado')
    check(not vis(E,'#debflows'),'flujos de Débitos ocultos al inicio')
    check(not vis(E,'#cardflows-c1') and E("!!document.querySelector('#cardflows-c1')") and E("document.getElementById('cardflows-c1').classList.contains('v170col')"),'lista de la tarjeta empieza cerrada')
    # titles visible, balances hidden
    bi=pg.inner_text('#bal-income')
    check('Débitos' in bi and 'Entradas' not in bi and 'Salidas' not in bi,'título Débitos sin operaciones: '+bi[:200])
    bc=pg.inner_text('#bal-cards')
    check('Créditos' in bc and 'PAGAR' not in bc,'título Créditos sin PAGAR: '+bc[:200])
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v170-banco-cerrado-phone.png'),full_page=False)

    # abrir Débitos tocando el h2
    pg.click('#bal-income>h2');pg.wait_for_timeout(150)
    check(not E("document.getElementById('bal-income').classList.contains('col')"),'Débitos se abre al tocar el título')
    check(vis(E,'#debflows'),'flujos de Débitos visibles')
    deb=pg.inner_text('#debflows')
    check('Entradas' in deb or 'ENTRADAS' in deb.upper(),'Entradas al abrir Débitos: '+deb[:200])
    check(E("document.getElementById('bal-cards').classList.contains('col')"),'Créditos sigue cerrado')
    E("()=>{const e=document.getElementById('bancobox');if(e)e.scrollIntoView({block:'start'});window.scrollBy(0,-70)}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v170-debitos-abierto-phone.png'),full_page=False)

    # cerrar Débitos otra vez
    pg.click('#bal-income>h2');pg.wait_for_timeout(150)
    check(E("document.getElementById('bal-income').classList.contains('col')"),'Débitos se cierra al tocar de nuevo')
    check(not vis(E,'#debflows'),'flujos ocultos al cerrar')

    # abrir Créditos: filas y PAGAR, listas aún cerradas
    pg.click('#bal-cards>h2');pg.wait_for_timeout(150)
    check(not E("document.getElementById('bal-cards').classList.contains('col')"),'Créditos se abre')
    check('PAGAR' in pg.inner_text('#bal-cards'),'PAGAR visible con Créditos abierto')
    check(E("document.getElementById('cardflows-c1').classList.contains('v170col')") and not vis(E,'#cardflows-c1'),'movimientos de la tarjeta siguen cerrados')
    E("()=>{const e=document.getElementById('bancobox');if(e)e.scrollIntoView({block:'start'});window.scrollBy(0,-70)}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v170-creditos-listas-cerradas-phone.png'),full_page=False)

    # PAGAR no pliega ni abre la lista
    closed_before=E("document.getElementById('cardflows-c1').classList.contains('v170col')")
    cred_open=not E("document.getElementById('bal-cards').classList.contains('col')")
    pg.click('#bal-cards button.pay');pg.wait_for_timeout(250)
    check(not E("document.getElementById('bal-cards').classList.contains('col')") and cred_open,'PAGAR no cierra Créditos')
    check(E("document.getElementById('cardflows-c1').classList.contains('v170col')") is closed_before,'PAGAR no abre la lista de movimientos')
    E("()=>{try{if(typeof dlg==='function'&&dlg().open)dlg().close()}catch(e){}}")
    pg.wait_for_timeout(80)
    # Ajustar tampoco pliega
    if E("!!document.querySelector('#bal-cards button.adj')"):
        pg.click('#bal-cards button.adj');pg.wait_for_timeout(200)
        check(not E("document.getElementById('bal-cards').classList.contains('col')"),'Ajustar no cierra Créditos')
        check(E("document.getElementById('cardflows-c1').classList.contains('v170col')"),'Ajustar no abre la lista')
        E("()=>{try{if(typeof dlg==='function'&&dlg().open)dlg().close()}catch(e){}}")
        pg.wait_for_timeout(80)

    # tocar el nombre de la tarjeta abre la lista
    pg.click('#bal-cards .row.v170ch .n');pg.wait_for_timeout(150)
    check(not E("document.getElementById('cardflows-c1').classList.contains('v170col')") and vis(E,'#cardflows-c1'),'lista se abre al tocar el nombre')
    fl=pg.inner_text('#cardflows-c1')
    check(len(fl.strip())>0,'movimientos visibles: '+fl[:200])
    E("()=>{const e=document.getElementById('cardflows-c1');if(e)e.scrollIntoView({block:'center'})}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v170-movimientos-abierto-phone.png'),full_page=False)
    # cerrar tocando de nuevo
    pg.click('#bal-cards .row.v170ch .n');pg.wait_for_timeout(150)
    check(E("document.getElementById('cardflows-c1').classList.contains('v170col')") and not vis(E,'#cardflows-c1'),'lista se cierra al tocar de nuevo')

    # re-render no fuerza abrir (recuerda el estado)
    E("()=>{const d=document.getElementById('bal-income');if(d&&!d.classList.contains('col'))d.querySelector(':scope>h2').click()}");pg.wait_for_timeout(80)
    check(E("document.getElementById('bal-income').classList.contains('col')"),'Débitos cerrado antes de render')
    check(not E("document.getElementById('bal-cards').classList.contains('col')"),'Créditos abierto antes de render')
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
    check(E("document.getElementById('bal-income').classList.contains('col')"),'render no abre Débitos')
    check(not E("document.getElementById('bal-cards').classList.contains('col')"),'render recuerda Créditos abierto')
    check(E("document.getElementById('cardflows-c1').classList.contains('v170col')"),'render recuerda lista cerrada')

    # abrir Débitos, render, sigue abierto
    pg.click('#bal-income>h2');pg.wait_for_timeout(80)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
    check(not E("document.getElementById('bal-income').classList.contains('col')"),'render recuerda Débitos abierto')

# ---------- inglés + webkit ----------
with app(ROOT,lang='en',**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    E("()=>{tab='mov';render();const e=document.getElementById('bancobox');if(e)e.scrollIntoView({block:'start'});window.scrollBy(0,-70)}");pg.wait_for_timeout(300)
    check(E("document.getElementById('bal-income').classList.contains('col')") and E("document.getElementById('bal-cards').classList.contains('col')"),'EN: empiezan cerrados')
    h=pg.inner_text('#bal-income')+' '+pg.inner_text('#bal-cards')
    check('Debit' in h or 'Débitos' in h or 'Credits' in h or 'Créditos' in h,'títulos EN: '+h[:200])
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v170-banco-cerrado-en-phone.png'),full_page=False)
    pg.click('#bal-cards>h2');pg.wait_for_timeout(150)
    check('PAY' in pg.inner_text('#bal-cards').upper() or 'PAGAR' in pg.inner_text('#bal-cards'),'PAGAR/PAY visible en EN')
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v170-creditos-abierto-en-phone.png'),full_page=False)

with app(ROOT,browser='webkit',**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1000)
    E("()=>{tab='mov';render();const e=document.getElementById('bancobox');if(e)e.scrollIntoView({block:'start'});window.scrollBy(0,-70)}");pg.wait_for_timeout(400)
    check(E("document.getElementById('bal-income').classList.contains('col')") and E("document.getElementById('bal-cards').classList.contains('col')"),'webkit: empiezan cerrados')
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v170-banco-cerrado-webkit-phone.png'),full_page=False)
    pg.click('#bal-income>h2');pg.wait_for_timeout(150)
    check(not E("document.getElementById('bal-income').classList.contains('col')"),'webkit: se abre Débitos')
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v170-debitos-abierto-webkit-phone.png'),full_page=False)

print('test_v170 OK',ok)
