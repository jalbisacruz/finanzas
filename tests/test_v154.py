"""v154 (DATOS DE EJEMPLO): el snapshot de Carlos se limpia para Firestore;
en Quién transfiere a quién siempre sale Carlos→Joe. python tests/test_v154.py
"""
import os,copy,json,re
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
  if(window._v154&&_v154.patchShareSet)_v154.patchShareSet();
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

saved_doc=None

with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v154','CODE_V v154')
    E(STUB)
    E("d=>{INBOX=[d]}", sheet('new',rev=0,at=2000,total=1000))
    r=E("bsApprove('new')");check(r.get('ok'),'aprobó '+str(r))
    pg.wait_for_timeout(400)

    # El desglose crudo de Carlos tiene arreglos anidados; Firestore los rechaza.
    raw=E("snapFor('Carlos')")
    check(E("_v154.hasNestedArray(snapFor('Carlos'))"),'snapshot crudo de Carlos tiene arreglos anidados: '+str(((raw or {}).get('months') or [{}])[0].get('r3',{}).get('breakDown')))
    clean=E("_v154.fireSafe(snapFor('Carlos'))")
    check(not E("_v154.hasNestedArray(_v154.fireSafe(snapFor('Carlos')))"),'fireSafe quita arreglos anidados')
    check(clean and 'who' in clean and clean.get('who')=='Carlos','fireSafe conserva who')

    # r3 de Tony (app / PDF / snapshot) incluye Carlos→Joe
    r3t=E("r3Data('2026-11','Tony')")
    check(abs(xfer_of(r3t,'Carlos','Yo')-10)<0.005,'r3 Tony incluye Carlos→Joe: '+str(r3t.get('transfers')))
    check(abs(xfer_of(r3t,'Carlos','Tony')-270.32)<0.005,'r3 Tony sigue con Carlos→Tony 270.32: '+str(r3t.get('transfers')))
    r3y=E("r3Data('2026-11','Yo')")
    check(abs(xfer_of(r3y,'Carlos','Yo')-10)<0.005,'r3 de Joe también tiene Carlos→Joe')

    doc=tony_doc(E)
    check(doc and doc.get('who')=='Tony','snapshot de Tony escrito')
    r3=(doc.get('months') or [{}])[0].get('r3') or {}
    check(abs(xfer_of(r3,'Carlos','Tony')-270.32)<0.005,'snap Tony Carlos→Tony 270.32')
    check(abs(xfer_of(r3,'Carlos','Yo')-10)<0.005,'snap Tony incluye Carlos→Joe: '+str(r3.get('transfers')))

    dc=E("window.__fs.docs['shares/BBBBBBBBBBBBBBBBBBBBBB']")
    check(dc and dc.get('who')=='Carlos','snapshot de Carlos escrito')
    # el documento escrito ya va limpio (sin arreglos anidados)
    check(not E("_v154.hasNestedArray(window.__fs.docs['shares/BBBBBBBBBBBBBBBBBBBBBB'])"),'doc de Carlos escrito está limpio')
    r3c=((dc or {}).get('months') or [{}])[0].get('r3') or {}
    check(abs(xfer_of(r3c,'Carlos','Yo')-10)<0.005,'snap Carlos incluye Carlos→Joe')
    saved_doc=doc

    # Un fallo transitorio no muestra el aviso; si persiste, sí.
    E("""()=>{
      window.__toasts=[];
      window.toast=function(m){window.__toasts.push(String(m||''))};
      _v154.patchToast();
      window.__fails=0;
      window.fbShareSet=async(t,d)=>{window.__fails++;const e=new Error('unavailable');e.code='unavailable';throw e};
      _v154.linkToast.n=0;_v154.linkToast.t0=0;
      _v154.patchShareSet();
    }""")
    # trigger one write cycle (3 retries, one exhausted failure)
    E("()=>{localStorage.removeItem('finanzas-link-h-AAAAAAAAAAAAAAAAAAAAAA');localStorage.removeItem('finanzas-link-h-BBBBBBBBBBBBBBBBBBBBBB')}")
    E("()=>{_v153.publishShares(true)}")
    pg.wait_for_timeout(2500)
    toasts=E("window.__toasts") or []
    link_toasts=[x for x in toasts if 'enlace' in x.lower() or 'link' in x.lower()]
    check(len(link_toasts)==0,'primer fallo se silencia: '+str(toasts))
    # second exhausted cycle → aviso
    E("()=>{_v153.publishShares(true)}")
    pg.wait_for_timeout(2500)
    toasts=E("window.__toasts") or []
    link_toasts=[x for x in toasts if 'enlace' in x.lower() or 'link' in x.lower()]
    check(len(link_toasts)>=1,'si persiste se avisa: '+str(toasts))
    if link_toasts:
        check('Revisa la conexión' in link_toasts[-1] or 'Check your connection' in link_toasts[-1] or 'inténtalo' in link_toasts[-1].lower(),
              'mensaje más útil: '+link_toasts[-1])

# ---------- página de Tony: las 3 transferencias, phone + desktop ----------
with app(ROOT,state=base(),new_look=True,routes=R,width=390,height=900,now='2026-11-20T22:10:00') as pg:
    open_tony(pg, saved_doc)
    pg.wait_for_timeout(500)
    t=pg.inner_text('#vsum') if pg.locator('#vsum').count() else pg.inner_text('main')
    check('Quién transfiere a quién' in t,'tiene la tarjeta')
    check('270.32' in t.replace(',','') or '$270.32' in t,'Carlos→Tony con cuentas: '+t)
    check('Su parte de las cuentas' in t,'etiqueta de cuentas: '+t)
    compact=t.replace(',','').replace('\xa0','')
    check(('Carlos' in t and 'Joe' in t) and ('10.00' in compact or '$10' in compact or '10' in compact),
          'Carlos→Joe en la página de Tony: '+t)
    if pg.locator('#bsst').count():
        check('Aprobada' in pg.inner_text('#bsst'),'estado Aprobada')
    mark(pg,'vsum');pg.wait_for_timeout(80)
    pg.locator('#vsum').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v154-tony-aprobada-phone.png'))

with app(ROOT,state=base(),new_look=True,routes=R,width=1280,height=800,now='2026-11-20T22:10:00') as pg:
    open_tony(pg, saved_doc)
    pg.wait_for_timeout(500)
    t=pg.inner_text('#vsum') if pg.locator('#vsum').count() else ''
    compact=t.replace(',','')
    check('270.32' in compact or '$270.32' in t,'desktop Carlos→Tony: '+t)
    check(('Carlos' in t and 'Joe' in t) and ('10.00' in compact or '$10' in compact),
          'desktop Carlos→Joe: '+t)
    mark(pg,'vsum');pg.wait_for_timeout(80)
    pg.locator('#vsum').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v154-tony-aprobada-desktop.png'))

print('test_v154 OK',ok)
