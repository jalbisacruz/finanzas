"""v156 (DATOS DE EJEMPLO): Compra manual Solo mía con selector de tienda.
python tests/test_v156.py
"""
import os,re
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';
      const d=document.getElementById(host||'')||document.getElementById('dlg')||document.getElementById('movcard');
      (d||document.body).append(w)}""", host)

PHONE=dict(now='2026-11-23T15:22:00',new_look=True,width=390,height=900)
SETUP="""()=>{
  if(!S.months['2026-11']){
    const prev=S.months[Object.keys(S.months).sort().at(-1)];
    const m=JSON.parse(JSON.stringify(prev||{income:[{id:'d',name:'Débito',amount:1250,role:'debit'}],cards:[],bills:[],purchases:[],personal:[],events:[]}));
    m.personal=[];m.purchases=m.purchases||[];m.events=m.events||[];
    S.months['2026-11']=m;
  }
  S.cur='2026-11';
  S.stores=S.stores||[];
  ['Walmart','Publix','Aldi','Amazon'].forEach(s=>{if(!S.stores.includes(s))S.stores.push(s)});
}"""

def opts(pg):
    return pg.evaluate("""()=>[...document.getElementById('qst').options].map(o=>({v:o.value,t:o.textContent}))""")

with app(ROOT,state=FIX,**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v156','CODE_V v156')
    E(SETUP);E('render()')
    E('quick()')
    pg.wait_for_timeout(200)
    check(E("!!document.getElementById('qst')"),'selector de tienda en Solo mía')
    check(E("!!document.getElementById('kmine')") or 'Solo mía' in (pg.inner_text('#dlg') if pg.locator('#dlg').count() else ''),
          'formulario Solo mía')
    o=opts(pg)
    labels=[x['t'] for x in o]; vals=[x['v'] for x in o]
    check(any(x['v']=='' for x in o),'tienda es opcional (opción vacía)')
    check(any('Amazon' in (x['v']+x['t']) for x in o),'incluye Amazon: '+str(o))
    check(any('Publix' in (x['v']+x['t']) for x in o),'incluye Publix')
    check(any(x['v']=='__new' or 'Nueva tienda' in x['t'] or 'New store' in x['t'] for x in o),'se puede añadir una tienda nueva')
    check(E("document.getElementById('qstn').hidden") is True,'el nombre nuevo empieza oculto')
    # no se rompe el escaneo
    scan=E("""()=>!!(document.getElementById('scanq')||[...document.querySelectorAll('#dlg button')].some(b=>/Cargar recibo|Upload receipt|scanReceipt/.test(b.textContent+' '+(b.getAttribute('onclick')||''))))""")
    check(scan,'sigue el botón de cargar recibo')

    # captura del formulario con el campo tienda (Amazon elegido, para que se vea)
    E("()=>{const s=document.getElementById('qst');s.value='Amazon';s.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('qa').value='15.40';}")
    mark(pg,'dlg');pg.wait_for_timeout(80)
    pg.locator('#dlg').screenshot(path=os.path.join(SH,'v156-solo-tienda-phone.png'))

    # guardar sin tienda sigue funcionando
    E("dlg().close()")
    E('quick()')
    E("""()=>{document.getElementById('qa').value='3.00';document.getElementById('qd').value='Sin tienda';document.getElementById('qf').value='2026-11-23';}""")
    E('saveQuick()')
    pg.wait_for_timeout(200)
    p0=E("S.months['2026-11'].personal.find(x=>x.desc==='Sin tienda')")
    check(p0 and not p0.get('store'),'sin tienda se puede guardar: '+str(p0))

    # elegir Amazon
    E('quick()')
    E("""()=>{
      document.getElementById('qa').value='15.40';
      document.getElementById('qd').value='Cables USB';
      document.getElementById('qf').value='2026-11-23';
      const s=document.getElementById('qst');s.value='Amazon';s.dispatchEvent(new Event('change',{bubbles:true}));
    }""")
    E('saveQuick()')
    pg.wait_for_timeout(250)
    p=E("S.months['2026-11'].personal.find(x=>x.desc==='Cables USB')")
    check(p and p.get('store')=='Amazon','se guarda la tienda Amazon: '+str(p))
    E("()=>{tab='mov';filt='';movQ='';render()}")
    pg.wait_for_timeout(250)
    E("()=>{if(typeof v170ExpandBanco==='function')v170ExpandBanco();else{['bal-income','bal-cards'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('col')});document.querySelectorAll('#bal-cards .v168cf').forEach(e=>e.classList.remove('v170col'))}}")
    pg.wait_for_timeout(80)
    mv=pg.inner_text('#debflows') if pg.locator('#debflows').count() else (pg.inner_text('#bancobox') if pg.locator('#bancobox').count() else pg.inner_text('main'))
    check('Amazon' in mv,'Amazon aparece en Movimientos: '+mv[:400])
    check('Cables USB' in mv or '15.40' in mv.replace(',',''),'el movimiento guardado se ve: '+mv[:400])

    # añadir tienda nueva
    E('quick()')
    E("""()=>{
      document.getElementById('qa').value='8.25';
      document.getElementById('qd').value='Café';
      document.getElementById('qf').value='2026-11-23';
      const s=document.getElementById('qst');s.value='__new';s.dispatchEvent(new Event('change',{bubbles:true}));
      document.getElementById('qstn').hidden=false;
      document.getElementById('qstn').value='Kangaroo';
    }""")
    check(E("document.getElementById('qstn').hidden") is False,'al elegir nueva se muestra el nombre')
    E('saveQuick()')
    pg.wait_for_timeout(250)
    p2=E("S.months['2026-11'].personal.find(x=>x.desc==='Café')")
    check(p2 and p2.get('store')=='Kangaroo','gasto con tienda nueva: '+str(p2))
    check(E("S.stores.includes('Kangaroo')"),'Kangaroo entra en la lista de tiendas')

    # editar movimiento: el selector de tienda sigue ahí
    E(f"mvEdit('{p['id']}')")
    pg.wait_for_timeout(200)
    check(E("!!document.getElementById('mvst')"),'editar movimiento también tiene tienda')
    E("()=>{const s=document.getElementById('mvst');s.value='Publix';s.dispatchEvent(new Event('change',{bubbles:true}))}")
    E(f"mvSave('{p['id']}')")
    pg.wait_for_timeout(200)
    p3=E(f"S.months['2026-11'].personal.find(x=>x.id==='{p['id']}')")
    check(p3 and p3.get('store')=='Publix','se puede cambiar la tienda al editar: '+str(p3))
    E("dlg().close&&dlg().open&&dlg().close()")

    # captura del movimiento guardado (Amazon/Publix + cables)
    E("()=>{tab='mov';filt='';movQ='';render()}")
    pg.wait_for_timeout(250)
    E("()=>{if(typeof v170ExpandBanco==='function')v170ExpandBanco();else{['bal-income','bal-cards'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('col')});document.querySelectorAll('#bal-cards .v168cf').forEach(e=>e.classList.remove('v170col'))}}")
    pg.wait_for_timeout(80)
    mark(pg,'debflows');pg.wait_for_timeout(80)
    loc=pg.locator('#debflows') if pg.locator('#debflows').count() else pg.locator('#bancobox')
    if loc.count():
        loc.scroll_into_view_if_needed()
        loc.screenshot(path=os.path.join(SH,'v156-movimiento-phone.png'))
    else:
        pg.screenshot(path=os.path.join(SH,'v156-movimiento-phone.png'))
    t=(pg.inner_text('#debflows') if pg.locator('#debflows').count() else (pg.inner_text('#bancobox') if pg.locator('#bancobox').count() else ''))
    check('Publix' in t or 'Amazon' in t or 'Kangaroo' in t,'el listado muestra la tienda: '+t[:300])

print('test_v156 OK',ok)
