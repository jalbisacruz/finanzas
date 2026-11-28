"""v182 (DATOS DE EJEMPLO): un gasto Solo mía pagado con tarjeta se ve en Movimientos
(Operaciones), se busca, se edita y se borra; el saldo y los cargos de la tarjeta se actualizan.
python3 tests/test_v182.py
"""
import copy,os
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

FAKE=open(os.path.join(HERE,'fakefb.js')).read()
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
Ro=dict(R);Ro['**/v182.js']='/* antes */'

def st():
    s=copy.deepcopy(FIX);s['cur']='2026-11'
    octm=s['months']['2026-10']
    nov=copy.deepcopy(octm)
    nov['personal']=[];nov['purchases']=[];nov['events']=[]
    nov['cards']=[{'id':'c1','name':'Visa Test','amount':50},{'id':'c2','name':'Store Card','amount':0}]
    nov['income']=[{'id':'i1','name':'Débito','amount':800,'role':'debit'}]
    s['months']['2026-11']=nov
    return s

def expand(E):
    E("()=>{tab='mov';filt='';movQ='';OPS_ALLM=true;if(typeof v170ExpandBanco==='function')v170ExpandBanco();render();const c=document.getElementById('movcard');if(c)c.classList.remove('col')}")

def fill_solo(pg,amount,date,store,method,desc=''):
    E=pg.evaluate
    E('quick()');pg.wait_for_timeout(120)
    E("""(o)=>{
      document.getElementById('qa').value=o.amount;
      document.getElementById('qd').value=o.desc||'';
      document.getElementById('qf').value=o.date;
      const qm=document.getElementById('qm');if(qm){qm.value=o.method;qm.dispatchEvent(new Event('change',{bubbles:true}))}
      const st=document.getElementById('qst');
      if(st){
        if([...st.options].some(x=>x.value===o.store)){st.value=o.store}
        else{st.value='__new'}
        st.dispatchEvent(new Event('change',{bubbles:true}));
        if(st.value==='__new'){const n=document.getElementById('qstn');if(n){n.hidden=false;n.value=o.store}}
      }
    }""",{'amount':amount,'date':date,'store':store,'method':method,'desc':desc})
    E('saveQuick()');pg.wait_for_timeout(250)

def add_two(pg):
    fill_solo(pg,'1.00','2026-11-27','Walmart','card:Visa Test','')
    fill_solo(pg,'1.00','2026-11-27','YoWash','card:Visa Test','Bolsas de Plástico')

def card_bal(E):
    return E("r2((L().cards.find(c=>c.name==='Visa Test')||{}).amount||0)")

def mov_text(pg):
    if pg.locator('#movcard').count():
        return pg.inner_text('#movcard')
    return ''

def card_text(pg):
    loc=pg.locator('#cardflows-c1')
    return loc.inner_text() if loc.count() else ''

PHONE=dict(now='2026-11-28T10:00:00',new_look=True,width=390,height=900,expand=False)

# ---------- ANTES: en la tarjeta sí, en Movimientos no ----------
with app(ROOT,state=st(),routes=Ro,**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    add_two(pg)
    ps=E("S.months['2026-11'].personal.map(x=>({store:x.store,desc:x.desc,amount:x.amount,method:x.method,date:x.date}))")
    check(len(ps)==2 and all(abs(p['amount']-1)<0.001 and p['method']=='card:Visa Test' for p in ps),'se guardan los dos Solo mía: '+str(ps))
    check(any(p.get('store')=='Walmart' for p in ps) and any(p.get('store')=='YoWash' for p in ps),'tienda guardada: '+str(ps))
    expand(E);pg.wait_for_timeout(200)
    check(not E("!!document.getElementById('movcard')"),'ANTES: no hay sección Movimientos')
    cf=card_text(pg)
    check('Walmart' in cf and 'YoWash' in cf and '1.00' in cf.replace(',',''),'ANTES: sí se ven en la tarjeta: '+cf[:400])

# ---------- DESPUÉS: lista, orden, búsqueda, editar, borrar ----------
with app(ROOT,state=st(),routes=R,**PHONE) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800)
    check(E('CODE_V')>='v182','CODE_V')
    add_two(pg)
    check(abs(card_bal(E)-52)<0.01,'saldo de tarjeta +2 tras los gastos: '+str(card_bal(E)))
    expand(E);pg.wait_for_timeout(250)
    check(E("!!document.getElementById('movcard')"),'sección Movimientos visible')
    mv=mov_text(pg)
    check('YoWash' in mv and 'Bolsas de Plástico' in mv,'YoWash en Movimientos: '+mv[:500])
    check('Walmart' in mv and 'Comida' in mv,'Walmart en Movimientos: '+mv[:500])
    # orden por fecha (más nueva primero); ambos el 27, el último guardado (YoWash) arriba entre los dos
    rows=E("[...document.querySelectorAll('#movcard .row')].map(e=>e.innerText.replace(/\\s+/g,' ').trim())")
    yi=next((i for i,r in enumerate(rows) if 'YoWash' in r),-1)
    wi=next((i for i,r in enumerate(rows) if 'Walmart' in r and 'Comida' in r),-1)
    check(yi>=0 and wi>=0 and yi<wi,'por fecha/creación, YoWash (último) antes que Walmart: '+str(rows))
    # búsqueda por tienda y por artículo
    E("()=>{movQ='yowash';render();const c=document.getElementById('movcard');if(c)c.classList.remove('col')}");pg.wait_for_timeout(200)
    q1=mov_text(pg)
    check('YoWash' in q1 and 'Walmart' not in q1,'busca YoWash: '+q1[:300])
    E("()=>{movQ='walmart';render();const c=document.getElementById('movcard');if(c)c.classList.remove('col')}");pg.wait_for_timeout(200)
    q2=mov_text(pg)
    check('Walmart' in q2 and 'YoWash' not in q2,'busca Walmart: '+q2[:300])
    E("()=>{movQ='bolsas';render();const c=document.getElementById('movcard');if(c)c.classList.remove('col')}");pg.wait_for_timeout(200)
    q3=mov_text(pg)
    check('Bolsas' in q3,'busca Bolsas: '+q3[:300])
    found=E("osSearch('yowash').map(x=>x.desc+' '+ (x.store||''))")
    check(any('Bolsas' in x or 'YoWash' in x for x in found),'osSearch yowash: '+str(found))

    # screenshot de Operaciones con los dos gastos
    E("()=>{movQ='';filt='';render();const c=document.getElementById('movcard');if(c){c.classList.remove('col');c.scrollIntoView({block:'start'})}}")
    pg.wait_for_timeout(200)
    mark(pg,'v');pg.locator('#movcard').screenshot(path=os.path.join(SH,'v182-movimientos-tienda-phone.png'))

    # tocar uno abre la edición; cambiar el monto actualiza saldo y cargos
    ids=E("S.months['2026-11'].personal.map(x=>({id:x.id,store:x.store,desc:x.desc}))")
    yo=next(x for x in ids if x.get('store')=='YoWash')
    wa=next(x for x in ids if x.get('store')=='Walmart')
    pg.locator(f'#movcard [data-g="{yo["id"]}"]').click();pg.wait_for_timeout(200)
    check(E("dlg().open") and E("!!document.getElementById('mva')"),'editar abre el formulario con monto')
    check(abs(E("r2(document.getElementById('mva').value)")-1)<0.001,'monto actual')
    pg.fill('#mva','3.00');pg.click('#mvsave');pg.wait_for_timeout(250)
    check(abs(E("r2(S.months['2026-11'].personal.find(x=>x.id==='"+yo['id']+"').amount)")-3)<0.001,'monto guardado')
    check(abs(card_bal(E)-54)<0.01,'saldo tarjeta 50+1+3=54: '+str(card_bal(E)))
    expand(E);pg.wait_for_timeout(150)
    cf=card_text(pg);mv=mov_text(pg)
    check('3.00' in cf.replace(',','') and 'YoWash' in cf,'cargos de la tarjeta con $3: '+cf[:400])
    check('3.00' in mv.replace(',','') and 'YoWash' in mv,'Movimientos con $3: '+mv[:400])

    # borrar el otro revierte el saldo y lo quita de la lista y de la tarjeta
    E("""(id)=>{const c=window.confirm;window.confirm=()=>true;delMove('gasto',id);window.confirm=c}""",wa['id'])
    pg.wait_for_timeout(250)
    left=E("S.months['2026-11'].personal.map(x=>x.store)")
    check('Walmart' not in left and 'YoWash' in left,'Walmart borrado: '+str(left))
    check(abs(card_bal(E)-53)<0.01,'saldo tarjeta 54-1=53: '+str(card_bal(E)))
    expand(E);pg.wait_for_timeout(150)
    cf=card_text(pg);mv=mov_text(pg)
    check('Walmart' not in cf and 'YoWash' in cf,'ya no está en cargos: '+cf[:400])
    check('Walmart' not in mv and 'YoWash' in mv,'ya no está en Movimientos: '+mv[:400])
    check(not pg.errors or not [e for e in pg.errors if not str(e).startswith('DIALOG')],pg.errors)

print('test_v182 OK',ok)
print(os.path.join(SH,'v182-movimientos-tienda-phone.png'))
