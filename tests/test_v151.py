"""v151 (DATOS DE EJEMPLO): un aviso por mes en Joe; Tony confirma antes de actualizar.
python tests/test_v151.py
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
      const d=document.getElementById(host||'')||document.getElementById('vbsent')||document.getElementById('vbed')||document.getElementById('dlg');
      (d&&(d.querySelector&&(d.querySelector('.vbbox')||d.open))?d:document.body).append(w)}""", host)

def month11():
    return {'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[],
            'personal':[],'purchases':[],'events':[],'tonyBase':0,
            'bills':[{'id':'b1','name':'Rent House','amount':800},{'id':'b2','name':'Phone','amount':60}]}
def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11';S['months']['2026-11']=month11();return S

ALLOC={'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}}
def sheet(iid,rev=0,month='2026-11',at=None,total=1000):
    return {'id':iid,'t':'TT','link':'Tony','kind':'bills','by':'Tony','month':month,'rev':rev,
            'at':at if at is not None else 1000+rev,
            'rows':[{'key':'renta','total':total,'alloc':ALLOC}]}

PHONE=dict(now='2026-11-20T22:10:00',new_look=True,width=390,height=900)
TOK='AAAAAAAAAAAAAAAAAAAAAA'

# ---- Joe: dos envíos del mismo mes → un solo aviso, el más nuevo ----
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v151','CODE_V v151')
    E("d=>{INBOX=d}", [sheet('old',rev=0,at=1000,total=800),sheet('new',rev=1,at=2000,total=1000)])
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(250)
    check(pg.locator('#bsnotice').count()==1,'un bloque de aviso')
    check(pg.locator('#bsnotice .bsrev').count()==1,'un solo botón')
    t=pg.inner_text('#bsnotice')
    check(t.count('Tony envió las cuentas de')==1,'texto una vez: '+t)
    check(pg.locator('#bsrev-new').count()==1 and pg.locator('#bsrev-old').count()==0,'abre el más nuevo')
    # inbox list also deduped
    E("inboxList()");pg.wait_for_timeout(150)
    check(pg.locator('#bsrow-new').count()==1 and pg.locator('#bsrow-old').count()==0,'lista del buzón sin el viejo')
    E("()=>{try{dlg().close()}catch(e){}}")
    mark(pg);pg.locator('#bsnotice').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v151-hoy-un-aviso-phone.png'))
    # Revisar abre el nuevo
    pg.click('#bsrev-new');pg.wait_for_timeout(200)
    check(pg.locator('#bsok').count()==1,'flujo de aprobar del nuevo')
    # aprobar el nuevo también atiende el viejo
    r=E("bsApprove('new')")
    check(r.get('ok'),'aprobó el nuevo '+str(r))
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==0,'aviso desaparece')
    # si el viejo vuelve al buzón (sigue en Firestore), no reaparece
    E("d=>{INBOX=d}", [sheet('old',rev=0,at=1000,total=800)])
    E("()=>{tab='ini';render();if(typeof inboxList==='function')inboxList()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==0 and pg.locator('#bsrow-old').count()==0,'el viejo queda atendido y no vuelve')
    check(E("_v151.isHandled('old')") is True,'marcado handled en el cliente')
    E("()=>{try{dlg().close()}catch(e){}}")

# rechazar el nuevo también atiende los anteriores, sin borrar el viejo en Firestore
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    E("d=>{INBOX=d;window.__del=[]}", [sheet('old',rev=0,at=1000),sheet('new',rev=1,at=2000)])
    E("()=>{window.fbInboxDel=async(t,id)=>{window.__del.push(id)};window.confirm=()=>true}")
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    E("bsReject('new')");pg.wait_for_timeout(200)
    dels=E("window.__del")
    check(dels==['new'] or (isinstance(dels,list) and dels==['new']),'solo se borra el nuevo: '+str(dels))
    check(E("_v151.isHandled('old')") is True,'el viejo se marca atendido')
    E("d=>{INBOX=(INBOX||[]).concat(d)}", [sheet('old',rev=0,at=1000)])
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(150)
    check(pg.locator('#bsnotice').count()==0,'no reaparece tras rechazar el nuevo')

# dos meses distintos → dos avisos
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    S=base();S['months']['2026-10']=S['months']['2026-10'] if '2026-10' in S.get('months',{}) else month11()
    E("d=>{INBOX=d}", [sheet('n11',rev=0,month='2026-11',at=2000),sheet('n10',rev=0,month='2026-10',at=1000)])
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice .bsrev').count()==2,'un aviso por mes')

# envío más nuevo por fecha si el rev es igual
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    E("d=>{INBOX=d}", [sheet('a',rev=0,at=1000,total=800),sheet('b',rev=0,at=5000,total=900)])
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsrev-b').count()==1 and pg.locator('#bsrev-a').count()==0,'el más reciente por fecha')

# ---- Tony: primer envío sin diálogo; el segundo pide confirmación ----
def open_tony(pg, clear=True):
    E=pg.evaluate
    doc=E("snapFor('Tony')");doc['updatedAt']=E("Date.now()");baseu='/'.join(pg.url.split('/')[:3])
    pg.add_init_script("window.__SHARE_DOC=%s;"%json.dumps(doc))
    pg.goto(baseu+'/v.html?t='+TOK);pg.wait_for_timeout(700)
    if clear:
        E("()=>{localStorage.removeItem('vbills-%s-2026-11');localStorage.removeItem('vbills-sent-%s-2026-11')}"%(TOK,TOK))
        pg.reload();pg.wait_for_timeout(700)
    E("""()=>{window.__fs=window.__fs||{docs:{},log:[]};
      window.vFsLib=async()=>({F:{addDoc:async(c,d)=>{const id='i'+Math.random().toString(36).slice(2,10);const path=(c&&c.path||'shares/inbox')+'/'+id;const copy=JSON.parse(JSON.stringify(d));window.__fs.docs[path]=copy;window.__fs.log.push(copy);return {id}},
        collection:(db,...p)=>({path:['shares',...p].join('/')}),serverTimestamp:()=>Date.now()},db:{}})}""")
    return E

def bills_sent(E):
    return E("window.__fs&&window.__fs.log?window.__fs.log.filter(d=>d&&d.kind==='bills'):[]")

with app(ROOT,state=base(),new_look=True,routes=R,width=390,height=900,now='2026-11-20T22:10:00') as pg:
    E=open_tony(pg)
    pg.fill('#bst-renta','800');pg.wait_for_timeout(80)
    pg.click('#bssend')
    pg.wait_for_function("()=>{const ok=document.getElementById('bsok');return ok&&/Enviado/.test(ok.innerText)}",timeout=8000)
    check(pg.locator('#vbsent').count()==0,'primer envío sin diálogo')
    first=bills_sent(E)
    check(len(first)==1 and first[0]['rev']==0,'primer rev 0')
    # segundo clic: pide confirmación, no envía todavía
    pg.click('#bssend');pg.wait_for_timeout(250)
    check(pg.locator('#vbsent').count()==1,'diálogo de actualizar')
    txt=pg.inner_text('#vbsent')
    check('Ya enviaste las cuentas de' in txt and '¿Quieres actualizar los datos?' in txt,'texto: '+txt)
    check('Actualizar' in txt and 'Cancelar' in txt,'botones')
    mark(pg,'vbsent');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v151-tony-actualizar-phone.png'))
    pg.click('#vbcancel');pg.wait_for_timeout(150)
    check(pg.locator('#vbsent').count()==0 and len(bills_sent(E))==1,'Cancelar no envía de nuevo')
    # Actualizar sí envía, con rev más alto
    pg.click('#bssend');pg.wait_for_timeout(200)
    pg.click('#vbupd')
    pg.wait_for_function("()=>window.__fs&&window.__fs.log&&window.__fs.log.filter(d=>d&&d.kind==='bills').length>=2",timeout=8000)
    sent=bills_sent(E)
    check(len(sent)==2 and sent[1]['rev']>sent[0]['rev'],'actualiza con rev mayor: '+str([d['rev'] for d in sent]))

# diálogo en escritorio
with app(ROOT,state=base(),new_look=True,routes=R,width=1280,height=800,now='2026-11-20T22:10:00') as pg:
    E=open_tony(pg)
    pg.fill('#bst-renta','800');pg.click('#bssend')
    pg.wait_for_function("()=>{const ok=document.getElementById('bsok');return ok&&/Enviado/.test(ok.innerText)}",timeout=8000)
    pg.click('#bssend');pg.wait_for_timeout(250)
    check(pg.locator('#vbsent').count()==1,'diálogo en escritorio')
    mark(pg,'vbsent');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v151-tony-actualizar-desktop.png'))

# persistencia local: al recargar, Enviar sigue pidiendo confirmación
with app(ROOT,state=base(),new_look=True,routes=R,width=390,height=900,now='2026-11-20T22:10:00') as pg:
    E=open_tony(pg)
    pg.fill('#bst-renta','800');pg.click('#bssend')
    pg.wait_for_function("()=>{const ok=document.getElementById('bsok');return ok&&/Enviado/.test(ok.innerText)}",timeout=8000)
    # recargar dejando el localStorage (no clear)
    pg.reload();pg.wait_for_timeout(800)
    E("""()=>{window.__fs=window.__fs||{docs:{},log:[]};
      window.vFsLib=async()=>({F:{addDoc:async(c,d)=>{const id='x';const copy=JSON.parse(JSON.stringify(d));window.__fs.log.push(copy);return {id}},
        collection:()=>({path:'shares/inbox'}),serverTimestamp:()=>Date.now()},db:{}})}""")
    # el total sigue del borrador
    if pg.locator('#bst-renta').count():
        pg.click('#bssend');pg.wait_for_timeout(250)
        check(pg.locator('#vbsent').count()==1,'tras recargar sigue pidiendo actualizar')

print('test_v151 OK',ok)
