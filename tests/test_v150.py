"""v150 (DATOS DE EJEMPLO): aviso de la hoja de Tony en Hoy y Cuentas; etiqueta de montos copiados; error del buzón.
python tests/test_v150.py
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
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';
      document.body.append(w)}""")

def month11():
    return {'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[],
            'personal':[],'purchases':[],'events':[],'tonyBase':0,
            'bills':[{'id':'b1','name':'Rent House','amount':800},
                     {'id':'b2','name':'Phone','amount':60},
                     {'id':'b3','name':'Electricity','amount':95.4},
                     {'id':'b6','name':'Food','amount':0}]}
def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11';S['months']['2026-11']=month11();return S

ALLOC={'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}}
def sheet_doc(iid='x1',month='2026-11'):
    return {'id':iid,'t':'TT','link':'Tony','kind':'bills','by':'Tony','month':month,'rev':0,'rows':[
        {'key':'renta','total':1000,'alloc':ALLOC},
        {'key':'telefono','total':80,'alloc':ALLOC},
        {'key':'luz','total':40,'alloc':ALLOC}]}
def purchase_doc():
    return {'id':'p1','t':'TT','link':'Tony','store':'Publix','date':'2026-11-18','by':'Tony','total':12.5}

PHONE=dict(now='2026-11-20T15:10:00',new_look=True,width=390,height=900)

# ---- Hoy: aviso de Tony, no se esconde con el ✕ de compras, no va detrás de «Ver más» ----
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v150','CODE_V v150')
    E("d=>{INBOX=d}", [sheet_doc(),purchase_doc()])
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(250)
    t=pg.inner_text('#bsnotice') if pg.locator('#bsnotice').count() else ''
    check(pg.locator('#bsnotice').count()==1,'aviso en Hoy')
    check('Tony envió las cuentas de' in t and 'Revisar y aprobar' in t,'texto del aviso: '+t)
    # las compras siguen en Recordatorios, sin contar la hoja
    rem=pg.inner_text('#remcard') if pg.locator('#remcard').count() else ''
    check('1 compra por revisar' in rem,'recordatorio de compras aparte: '+rem)
    check(rem.lower().count('compra por revisar')==1 or rem.count('compras por revisar')==0,'no cuenta la hoja como compra extra')
    # ✕ en compras no quita el aviso de Tony
    E("()=>{if(typeof remHide==='function')remHide('inbox');tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==1,'aviso sigue tras ocultar compras')
    rem2=pg.inner_text('#remcard') if pg.locator('#remcard').count() else ''
    check('compra por revisar' not in rem2 and 'compras por revisar' not in rem2,'compras ocultas: '+rem2)
    # no queda detrás de «Ver más»: el aviso es una tarjeta propia, no una fila de remcard
    check(pg.locator('#remcard #bsnotice').count()==0 and pg.locator('#bsnotice').count()==1,'aviso no está en Recordatorios')
    mark(pg);pg.locator('#bsnotice').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v150-hoy-aviso-tony-phone.png'))
    # el botón abre el flujo de aprobar
    pg.click('#bsrev-x1');pg.wait_for_timeout(200)
    dlg=pg.inner_text('#dlg') if pg.locator('#dlg').count() else ''
    check('Aprobar' in dlg or pg.locator('#bsok').count()==1,'abre Revisar/Aprobar: '+dlg[:180])
    if pg.locator('#dlg').count() and E("dlg().open"):
        E("()=>{try{dlg().close()}catch(e){}}")

# solo hoja en el buzón: no aparece «compras por revisar»
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    E("d=>{INBOX=d}", [sheet_doc()])
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    rem=pg.inner_text('#remcard') if pg.locator('#remcard').count() else ''
    check(pg.locator('#bsnotice').count()==1 and 'compra por revisar' not in rem and 'compras por revisar' not in rem,
          'sin recordatorio de compras si solo hay hoja: '+rem)

# ---- Cuentas: aviso + etiqueta de copia; montos iguales; tras aprobar se quita ----
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    E("d=>{INBOX=d}", [sheet_doc()])
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(250)
    E("()=>{if(typeof goSec==='function')goSec('billsm')}");pg.wait_for_timeout(150)
    check(pg.locator('#bsnotice').count()==1,'aviso en Cuentas')
    check(pg.locator('#bscopy').count()==1 and 'copia del mes anterior' in pg.inner_text('#bscopy')
          and 'falta la hoja de Tony' in pg.inner_text('#bscopy'),'etiqueta de copia')
    amt=E("M().bills.find(b=>b.name==='Rent House').amount")
    check(amt==800,'monto de renta no cambia antes de aprobar: '+str(amt))
    mark(pg);pg.locator('#billsm').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v150-cuentas-copia-phone.png'))
    r=E("bsApprove('x1')")
    check(r.get('ok'),'aprobó '+str(r))
    check(E("M().bills.find(b=>b.name==='Rent House').amount")==250,'renta pasa a la parte de Joe')
    E("()=>{tab='mov';render();if(typeof goSec==='function')goSec('billsm')}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==0,'aviso desaparece al aprobar')
    check(pg.locator('#bscopy').count()==0,'etiqueta desaparece al aprobar')
    mark(pg);pg.locator('#billsm').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v150-cuentas-aprobado-phone.png'))

# ---- error del buzón visible, no un buzón vacío en silencio ----
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    E("()=>{window.__inboxErr=true;tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#inberr').count()==1,'error en Hoy')
    check('No se pudo cargar el buzón' in pg.inner_text('#inberr'),'texto de error')
    E("()=>{window.__inboxErr=true;tab='mov';render();if(typeof goSec==='function')goSec('billsm')}");pg.wait_for_timeout(200)
    check(pg.locator('#inberr').count()==1,'error también en Cuentas/Operaciones')
    # un fallo real de fbInbox enciende la bandera
    E("""()=>{window.__inboxErr=false;window.__syncReady=true;window.fbUser=()=>true;
      S.links=S.links||{};S.links.Tony={on:true,t:'TT'};
      window.fbInbox=async()=>{throw new Error('network')};window.fbInbox.__v150=false;
      inboxAt=0}""")
    E("()=>inboxLoad(true)");pg.wait_for_timeout(400)
    check(E("!!window.__inboxErr"),'fbInbox fallido marca error')
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#inberr').count()==1,'se ve el error tras un fallo de carga')

# inglés
with app(ROOT,lang='en',state=base(),**PHONE) as pg:
    E=pg.evaluate
    E("d=>{INBOX=d}", [sheet_doc()])
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    t=pg.inner_text('#bsnotice') if pg.locator('#bsnotice').count() else ''
    check('Review and approve' in t or 'Revisar y aprobar' in t,'botón EN/ES: '+t)
    E("()=>{tab='mov';render();if(typeof goSec==='function')goSec('billsm')}");pg.wait_for_timeout(200)
    lab=pg.inner_text('#bscopy') if pg.locator('#bscopy').count() else ''
    check('waiting for Tony' in lab or 'falta la hoja' in lab,'etiqueta EN/ES: '+lab)

print('test_v150 OK',ok)
