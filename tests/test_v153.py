"""v153 (DATOS DE EJEMPLO): al aprobar o al abrir la app, se republica el
enlace de Tony con las cifras de v152. python tests/test_v153.py
"""
import os,copy,json
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';
      const d=document.getElementById(host||'')||document.getElementById('vsum')||document.getElementById('bsform');
      (d||document.body).append(w)}""", host)

ALLOC={'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}}
TOK='AAAAAAAAAAAAAAAAAAAAAA'
PHONE=dict(now='2026-11-20T22:10:00',new_look=True,width=390,height=900)
DESK=dict(now='2026-11-20T22:10:00',new_look=True,width=1280,height=800)

def month11():
    return {'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[],
            'personal':[],'events':[],'tonyBase':0,
            'bills':[{'id':'b1','name':'Rent House','amount':800},{'id':'b2','name':'Phone','amount':60}],
            'purchases':[
                {'id':'pt','store':'Publix','date':'2026-11-04','total':100,'mode':'fam',
                 'paidBy':'Tony','method':'','shares':{'Tony':20,'Carlos':50,'Yo':30}},
                {'id':'pc','store':'Walmart','date':'2026-11-08','total':94.16,'mode':'fam',
                 'paidBy':'Carlos','method':'','shares':{'Tony':29.68,'Carlos':44.48,'Yo':20}},
                {'id':'pj','store':'Target','date':'2026-11-10','total':80,'mode':'fam',
                 'shares':{'Yo':40,'Tony':10,'Carlos':30}}
            ]}

def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11';S['months']['2026-11']=month11();return S

def sheet(iid,rev=0,month='2026-11',at=None,total=1000):
    return {'id':iid,'t':'TT','link':'Tony','kind':'bills','by':'Tony','month':month,'rev':rev,
            'at':at if at is not None else 1000+rev,
            'rows':[{'key':'renta','total':total,'alloc':ALLOC}]}

def xfer_of(R,frm,to):
    for x in (R.get('transfers') or []):
        if x.get('from')==frm and x.get('to')==to:
            return round(float(x['amount']),2)
    return 0.0

STUB="""()=>{
  window.__fs=window.__fs||{docs:{},log:[]};
  window.fbUser=()=>({uid:'u1'});
  window.fbShareSet=async(t,d)=>{window.__fs.docs['shares/'+t]=Object.assign(JSON.parse(JSON.stringify(d)),{owner:'u1'});window.__fs.log.push('shares/'+t)};
  S.links=S.links||{};
  S.links.Tony={on:true,t:'AAAAAAAAAAAAAAAAAAAAAA'};
  S.links.Carlos={on:true,t:'BBBBBBBBBBBBBBBBBBBBBB'};
}"""

def tony_doc(E):
    return E("window.__fs&&window.__fs.docs&&window.__fs.docs['shares/AAAAAAAAAAAAAAAAAAAAAA']")

def open_tony(pg, doc):
    E=pg.evaluate
    doc=copy.deepcopy(doc) if isinstance(doc,dict) else doc
    if isinstance(doc,dict) and 'updatedAt' not in doc:
        doc['updatedAt']=1
    baseu='/'.join(pg.url.split('/')[:3])
    pg.add_init_script("window.__SHARE_DOC=%s;"%json.dumps(doc))
    pg.goto(baseu+'/v.html?t='+TOK);pg.wait_for_timeout(800)
    return E

# ---------- al aprobar, se escribe el snapshot con cifras v152 ----------
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v153','CODE_V v153')
    E(STUB)
    E("d=>{INBOX=[d]}", sheet('new',rev=0,at=2000,total=1000))
    r=E("bsApprove('new')");check(r.get('ok'),'aprobó '+str(r))
    pg.wait_for_timeout(400)
    doc=tony_doc(E)
    check(doc and doc.get('who')=='Tony','snapshot de Tony escrito: '+str(bool(doc)))
    check(doc.get('billSheet',{}).get('approved') is True or doc.get('billSheet',{}).get('from')==doc.get('billSheet',{}).get('k'),
          'billSheet aprobado: '+str(doc.get('billSheet')))
    r3=(doc.get('months') or [{}])[0].get('r3') or {}
    check(abs(xfer_of(r3,'Carlos','Tony')-270.32)<0.005,'r3 Carlos→Tony incluye cuentas: '+str(r3.get('transfers')))
    check(abs(((r3.get('people') or {}).get('Carlos') or {}).get('bills') or 0)-250<0.005,'people.bills Carlos 250')
    dc=E("window.__fs.docs['shares/BBBBBBBBBBBBBBBBBBBBBB']")
    r3c=((dc or {}).get('months') or [{}])[0].get('r3') or {}
    check(abs(xfer_of(r3c,'Carlos','Yo')-10)<0.005,'r3 de Carlos incluye Carlos->Joe: '+str(r3c.get('transfers')))
    # no se filtran campos privados al tope
    s=json.dumps(doc)
    for k in ('income','cards','debit'):
        check('"%s"'%k not in s,'no vierte %s'%k)
    saved_doc=doc

    # simula snapshot viejo (solo compras) + «abrir la app»
    stale=copy.deepcopy(doc)
    stale['months'][0]['r3']['transfers']=[t for t in stale['months'][0]['r3']['transfers'] if not (t.get('from')=='Carlos' and t.get('to')=='Tony')]
    stale['months'][0]['r3']['transfers'].append({'from':'Carlos','to':'Tony','amount':20.32})
    if stale['months'][0]['r3'].get('people',{}).get('Carlos'):
        stale['months'][0]['r3']['people']['Carlos']['bills']=0
        stale['months'][0]['r3']['people']['Carlos']['pays']=20.32
    E("d=>{window.__fs.docs['shares/AAAAAAAAAAAAAAAAAAAAAA']=d;localStorage.removeItem('finanzas-link-h-AAAAAAAAAAAAAAAAAAAAAA')}", stale)
    check(abs(xfer_of(tony_doc(E)['months'][0]['r3'],'Carlos','Tony')-20.32)<0.005,'quedó el snapshot viejo')
    E("()=>{_v153.publishShares(true)}")
    pg.wait_for_timeout(400)
    doc2=tony_doc(E)
    check(abs(xfer_of(doc2['months'][0]['r3'],'Carlos','Tony')-270.32)<0.005,'al abrir/publicar se actualiza: '+str(doc2['months'][0]['r3'].get('transfers')))
    saved_doc=doc2

# ---------- la página de Tony muestra las cifras nuevas (phone + desktop) ----------
# reuse saved_doc from first block
with app(ROOT,state=base(),new_look=True,routes=R,width=390,height=900,now='2026-11-20T22:10:00') as pg:
    open_tony(pg, saved_doc)
    pg.wait_for_timeout(400)
    t=pg.inner_text('#vsum') if pg.locator('#vsum').count() else pg.inner_text('main')
    check('Quién transfiere a quién' in t,'tiene la tarjeta')
    check('270.32' in t.replace(',','') or '$270.32' in t,'Carlos→Tony con cuentas en la página: '+t)
    check('Su parte de las cuentas' in t,'etiqueta de cuentas: '+t)
    if pg.locator('#bsst').count():
        check('Aprobada' in pg.inner_text('#bsst'),'estado Aprobada')
    mark(pg,'vsum');pg.wait_for_timeout(80)
    pg.locator('#vsum').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v153-tony-aprobada-phone.png'))

with app(ROOT,state=base(),new_look=True,routes=R,width=1280,height=800,now='2026-11-20T22:10:00') as pg:
    open_tony(pg, saved_doc)
    pg.wait_for_timeout(400)
    t=pg.inner_text('#vsum') if pg.locator('#vsum').count() else ''
    check('270.32' in t.replace(',','') or '$270.32' in t,'desktop cifras: '+t)
    mark(pg,'vsum');pg.wait_for_timeout(80)
    pg.locator('#vsum').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v153-tony-aprobada-desktop.png'))

# save() también dispara la publicación (sin approve de nuevo)
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    E(STUB)
    E("d=>{INBOX=[d]}", sheet('new',rev=0,at=2000,total=1000))
    E("bsApprove('new')");pg.wait_for_timeout(400)
    E("()=>{window.__fs.log=[];localStorage.removeItem('finanzas-link-h-AAAAAAAAAAAAAAAAAAAAAA');save()}")
    pg.wait_for_timeout(1200)
    check(any(x=='shares/AAAAAAAAAAAAAAAAAAAAAA' or str(x).endswith('AAAAAAAAAAAAAAAAAAAAAA') for x in (E("window.__fs.log") or [])),'save republica el enlace')

print('test_v153 OK',ok)
