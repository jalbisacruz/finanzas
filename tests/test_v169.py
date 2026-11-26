"""v169 (DATOS DE EJEMPLO): Reportes sin recordatorios de Hoy, reembolsos en una sola
tarjeta, Cuadrar banco una vez, Cuentas de Tony y comparación con el mes anterior.
Configuración sin fila de atajos, agrupada en Ajustes, Listas y Datos.
python3 tests/test_v169.py
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

PHONE=dict(now='2026-10-13T10:00:00',new_look=True,width=390,height=900)

def ids_text(E, sel='h2'):
    return E("""()=>[...document.querySelectorAll('#v>.card, #v>.muted.v169sec, #v>.opsh')].map(c=>({id:c.id,t:(c.querySelector(':scope>h2')||c).innerText.replace(/\\s+/g,' ').trim()}))""")

# ---------- Reportes ----------
with app(ROOT,**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    check(E('CODE_V')>='v169','CODE_V')
    # Hoy sigue con recordatorios
    E("()=>{tab='ini';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    rem=E("(document.getElementById('remcard')||{}).innerText||''")
    check(E("!!document.getElementById('remcard')") and ('vence' in rem or 'Visa Test' in rem),'Hoy tiene recordatorios: '+rem[:200])
    check('respaldo' in rem.lower() or 'Sin respaldo' in rem,'Hoy tiene respaldo: '+rem)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v169-hoy-recordatorios-phone.png'),full_page=False)

    E("()=>{tab='rep';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    check(not E("!!document.getElementById('remcard')"),'Reportes sin recordatorios de Hoy')
    body=pg.inner_text('#v')
    check('Sin respaldo' not in body and 'vence en' not in body,'sin vencimiento/respaldo duplicados: '+body[:400])
    # reembolsos unidos
    check(E("!!document.getElementById('reemcard')"),'tarjeta Reembolsos')
    check(not E("!!document.getElementById('cbcard')"),'sin segunda tarjeta de reembolso')
    re=pg.inner_text('#reemcard')
    check('Carlos' in re and ('Cash back' in re or 'Reembolso en efectivo' in re or '1.24' in re.replace(',','')),'reembolsos juntos: '+re[:400])
    # Cuadrar una sola vez (la tarjeta)
    sc=E("(()=>{const e=document.getElementById('scrow');return e?e.innerText:''})()")
    check('Cuadrar' not in sc,'Cuadrar no está en la fila de atajos: '+sc)
    check(E("!!document.getElementById('rccard')") and 'Cuadrar' in pg.inner_text('#rccard'),'Cuadrar banco en la tarjeta')
    check('Mi resumen' in sc and 'Tony' in sc and 'Carlos' in sc,'se quedan los PDF: '+sc)
    # Cuentas de Tony (v168)
    check(E("!!document.getElementById('billsm')"),'Cuentas de Tony en Reportes')
    # comparación
    check(E("!!document.getElementById('cmpcard')"),'comparación con el mes anterior')
    cmp=pg.inner_text('#cmpcard')
    check(('Sept' in cmp or 'Sep' in cmp or 'sept' in cmp.lower()) and 'Gastos' in cmp and 'Ingresos' in cmp and 'Neto' in cmp,'compara con septiembre: '+cmp[:400])
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v169-reportes-arriba-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('reemcard');if(e){e.classList.remove('col','defcol');e.scrollIntoView()}}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v169-reportes-reembolsos-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('rccard');if(e){e.classList.remove('col','defcol');e.scrollIntoView()}}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v169-reportes-cuadrar-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('billsm');if(e){e.classList.remove('col','defcol');e.scrollIntoView()}}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v169-reportes-cuentas-tony-phone.png'),full_page=False)

# ---------- Configuración ----------
with app(ROOT,**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    E("()=>{tab='cfg';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    check(not E("!!document.getElementById('scrow')"),'Configuración sin fila de atajos')
    tops=E("[...document.querySelectorAll('.v169sec')].map(e=>e.innerText.replace(/\\s+/g,' ').trim())")
    up=[x.upper() for x in tops];check(any('AJUSTES' in x for x in up) and any('LISTAS' in x for x in up) and any('DATOS' in x for x in up),'secciones Ajustes/Listas/Datos: '+str(tops))
    order=E("""()=>{
      const ids=['s-cfg-idioma','s-cfg-seguridad','lnkcard','bkcfg','budcfg','ctl-money','ctl-cards','goalcfg','datacard'];
      return ids.map(id=>{const e=document.getElementById(id);if(!e)return [id,-1];
        const r=e.getBoundingClientRect();return [id,Math.round(r.top+scrollY)]});
    }""")
    pos={k:v for k,v in order}
    def after(a,b):
        return pos.get(a,-1)>=0 and pos.get(b,-1)>=0 and pos[a]<pos[b]
    check(after('s-cfg-idioma','s-cfg-seguridad') and after('s-cfg-seguridad','lnkcard') and after('lnkcard','bkcfg'),
          'Ajustes: idioma, seguridad, enlaces, respaldo: '+str(pos))
    check(after('bkcfg','budcfg') and after('budcfg','ctl-money') and after('ctl-money','ctl-cards'),
          'Listas después de Ajustes, con categorías/cuentas/tarjetas: '+str(pos))
    check(after('ctl-cards','datacard') and after('goalcfg','datacard'),'Datos al final: '+str(pos))
    # Catálogos suelto ya no
    heads=E("[...document.querySelectorAll('#v>:not(.card)')].map(e=>e.innerText.trim())")
    check(not any(x.upper()=='CATÁLOGOS' or x.upper()=='CATALOGOS' or x.upper()=='CATALOGS' for x in heads),'sin encabezado Catálogos suelto: '+str(heads))
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v169-config-ajustes-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('cfglistas')||document.getElementById('budcfg');if(e)e.scrollIntoView()}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v169-config-listas-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('datacard');if(e){e.classList.remove('col','defcol');e.scrollIntoView()}}");pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v169-config-datos-phone.png'),full_page=False)

# ---------- inglés + webkit ----------
with app(ROOT,lang='en',**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(300)
    cmp=pg.inner_text('#cmpcard') if pg.locator('#cmpcard').count() else ''
    check('Comparison' in cmp or 'Comparación' in cmp,'comparación EN: '+cmp[:200])
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(300)
    tops=E("[...document.querySelectorAll('.v169sec')].map(e=>e.innerText)")
    up=[x.upper() for x in tops];check(any('SETTINGS' in x or 'AJUSTES' in x for x in up) and any('LISTS' in x or 'LISTAS' in x for x in up),'secciones EN: '+str(tops))
    check(not E("!!document.getElementById('scrow')"),'EN sin atajos de configuración')

with app(ROOT,browser='webkit',**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1000)
    E("()=>{tab='rep';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    check(E("!!document.getElementById('cmpcard')") and not E("!!document.getElementById('remcard')") and E("!!document.getElementById('rccard')"),'webkit Reportes')
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v169-reportes-webkit-phone.png'),full_page=False)

print('test_v169 OK',ok)
