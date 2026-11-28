"""v180 (DATOS DE EJEMPLO): «Compras por revisar» y la lista 📥 usan la misma fuente;
un aviso de pago no cuenta como compra. Las listas de compras van por fecha (más nueva
primero), con la hora de creación como desempate.
python3 tests/test_v180.py
"""
import json,os,copy
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
PHONE=dict(now='2026-11-27T16:00:00',new_look=True,width=390,height=900)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
TT,TC='TonyTokenAAAAAAAAAAAAA','CarlosTokenNEWBBBBBBBB'
SNAP={'v':1,'who':'Carlos','lang':'es','buyers':['Carlos'],'names':{'Yo':'Joe','Tony':'Tony','Carlos':'Carlos'},'months':[]}
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('#demoW,.toast').forEach(x=>x.remove());const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';
      (document.getElementById(host||'')||document.getElementById('dlg')||document.body).append(w)}""",host)
def state():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    m=S['months'].setdefault('2026-11',copy.deepcopy(FIX['months'].get('2026-11') or {'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[{'id':'k1','name':'Visa','amount':40}],'bills':[],'personal':[],'events':[],'purchases':[]}))
    if not m.get('income'):m['income']=[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}]
    if not m.get('cards'):m['cards']=[{'id':'k1','name':'Visa','amount':40}]
    m['purchases']=[
        {'id':'pA','store':'Aldi 20 nov','date':'2026-11-20','total':30,'mode':'manual','who':['Yo','Tony'],'shares':{'Yo':15,'Tony':15},'method':'deb','at':1763600000000},
        {'id':'pB','store':'Walmart 25 nov','date':'2026-11-25','total':40,'mode':'manual','who':['Yo','Tony'],'shares':{'Yo':20,'Tony':20},'method':'card:Visa','at':1764000000000},
        {'id':'pC','store':'Publix 10 nov','date':'11/10/2026','total':50,'mode':'manual','who':['Yo','Tony'],'shares':{'Yo':25,'Tony':25},'method':'card:Visa','at':1762700000000},
        {'id':'pD1','store':'Sam 22 nov (más vieja)','date':'2026-11-22','total':11,'mode':'manual','who':['Yo','Tony'],'shares':{'Yo':5.5,'Tony':5.5},'method':'deb','at':1763800000000},
        {'id':'pD2','store':'Sam 22 nov (más nueva)','date':'2026-11-22','total':12,'mode':'manual','who':['Yo','Tony'],'shares':{'Yo':6,'Tony':6},'method':'deb','at':1763900000000},
    ]
    m['personal']=[{'id':'g1','date':'2026-11-23','amount':12,'cat':'🍔 Restaurantes','desc':'Cena 23 nov','method':'card:Visa','at':1763850000000}]
    return S
docs={'shares/'+TT:{**SNAP,'who':'Tony','owner':'u1'},'shares/'+TC:{**SNAP,'owner':'u1'},
      'shares/%s/inbox/s1'%TC:{'kind':'settle','by':'Carlos','month':'2026-11','amount':49.89,'at':1764000000000}}
init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps(docs))

# ---------- wiring + sort ----------
with app(ROOT,state=state(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v180','CODE_V')
    check('v180.js' in pg.content(),'index carga v180.js')
    check(E("typeof _v180==='object'&&typeof v180Pending==='function'"),'_v180')
    E("()=>{tab='mov';OPS_ALLP=true;hRange='cur';render()}");pg.wait_for_timeout(300)
    stores=E("[...document.querySelectorAll('#comcard .hrow .tot span:first-child')].map(e=>e.textContent)")
    check(stores==['Walmart 25 nov','Sam 22 nov (más nueva)','Sam 22 nov (más vieja)','Aldi 20 nov','Publix 10 nov'],
          'Compras por fecha (y desempate por at): '+str(stores))
    check(E("dKey('11/10/2026')")=='2026-11-10',"dKey de fecha con barras: "+str(E("dKey('11/10/2026')")))
    # flujos de la Visa: fecha real, no el string crudo
    flows=E("[...document.querySelectorAll('#cardflows-k1 .row .n')].map(e=>e.firstChild.textContent)")
    check(flows==['Walmart 25 nov','Cena 23 nov','Publix 10 nov'],'flujos de tarjeta por fecha: '+str(flows))
    # byNew / PDF
    r3=E("r3Data('2026-11','Yo').purchases.map(x=>x.s||x.store)")
    check(r3[0]=='Walmart 25 nov' and r3[-1]=='Publix 10 nov','r3Data por fecha: '+str(r3))
    # compra manual: la fecha se lee del input aunque D.date no se haya actualizado (sin change)
    E("""()=>{editP();D.store="Sam's Club";D.total=60;D.method='deb';D.mode='manual';D.shares={Yo:30,Tony:30};D.date='2026-11-27';
      const el=dlg().querySelector('input[type=date]');el.value='2026-11-18'; /* sin disparar change */ saveP()}""")
    pg.wait_for_timeout(250)
    E("()=>{tab='mov';OPS_ALLP=true;hRange='cur';render()}");pg.wait_for_timeout(200)
    stores2=E("[...document.querySelectorAll('#comcard .hrow .tot span:first-child')].map(e=>e.textContent)")
    check("Sam's Club" in stores2,'la compra manual aparece: '+str(stores2))
    check(stores2.index("Sam's Club")==stores2.index('Aldi 20 nov')+1,'manual del 18 nov queda entre el 20 y el 10: '+str(stores2))
    saved=E("S.months['2026-11'].purchases.find(p=>p.store===\"Sam's Club\").date")
    check(saved=='2026-11-18','saveP leyó la fecha del campo: '+str(saved))
    # captura: lista de compras ordenada
    E("()=>{tab='mov';OPS_ALLP=true;hRange='cur';render();const n=document.querySelector('nav');if(n)n.style.position='static';const fb=document.getElementById('fab');if(fb)fb.style.display='none';document.querySelectorAll('.toast').forEach(x=>x.remove());const c=document.getElementById('comcard');scrollTo(0,Math.max(0,c.getBoundingClientRect().top+scrollY-80))}")
    pg.wait_for_timeout(200)
    mark(pg,'v')
    pg.locator('#comcard').screenshot(path=os.path.join(SH,'v180-compras-por-fecha-phone.png'))
    check(not pg.errors,'sin errores JS (sort): %s'%pg.errors)

# ---------- aviso de pago: misma fuente en Inicio y en 📥 ----------
with app(ROOT,state=state(),routes=R,init=init,**PHONE) as pg:
    E=pg.evaluate
    E("(L)=>{S.links=L;save()}",{'Tony':{'t':TT,'on':True},'Carlos':{'t':TC,'on':True}})
    E("()=>inboxLoad(true)");pg.wait_for_timeout(900)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(400)
    pr=E("JSON.stringify(v180Pending())")
    check(E("v180Pending().n")==1 and E("v180Pending().notices.length")==1 and E("v180Pending().purchases.length")==0,
          'pendingReview = 1 aviso, 0 compras: '+pr)
    hoy=E("((document.getElementById('v165hoy')||{}).innerText||'')+((remList()||[]).filter(r=>r.id==='inbox').map(r=>r.t).join(' '))")
    check('compra por revisar' not in hoy.lower() or 'aviso' in hoy.lower(),'Inicio no lo llama «compra»: '+hoy)
    check('aviso de pago' in hoy.lower() or 'Avisos de pago' in hoy,'Inicio habla de aviso: '+hoy)
    check('(1)' in hoy or '1 aviso' in hoy,'Inicio cifra 1: '+hoy)
    # captura Inicio con el aviso (no «1 compra»)
    E("()=>{tab='ini';BAL_OPEN=false;render();scrollTo(0,0);const n=document.querySelector('nav');if(n)n.style.position='static';const fb=document.getElementById('fab');if(fb)fb.style.display='none';document.querySelectorAll('.toast').forEach(x=>x.remove())}")
    pg.wait_for_timeout(250)
    # llevar el recordatorio / tarjeta a la vista
    E("""()=>{const el=document.getElementById('v165hoy')||document.getElementById('remcard')||document.querySelector('#v .card');
      if(el)scrollTo(0,Math.max(0,el.getBoundingClientRect().top+scrollY-80))}""")
    pg.wait_for_timeout(150)
    mark(pg,'v')
    pg.screenshot(path=os.path.join(SH,'v180-inicio-aviso-pago-phone.png'),full_page=False)
    # la lista muestra el mismo aviso, no «No hay compras pendientes»
    E("inboxList()");pg.wait_for_timeout(500)
    v=pg.inner_text('#dlg')
    check('No hay compras pendientes' not in v,'lista no vacía: '+v)
    check('dice que ya pagó' in v and 'aviso de pago' in v.lower(),'lista muestra el aviso: '+v)
    check('Avisos de pago por revisar (1)' in v,'título de lista = 1 aviso: '+v)
    # la cifra de Inicio y la de 📥 coinciden
    check(E("v180Pending().n")==1,'sigue siendo 1 al abrir la lista')
    mark(pg,'dlg')
    pg.locator('#dlg').screenshot(path=os.path.join(SH,'v180-buzon-aviso-pago-phone.png'))
    # Actualizar no inventa un vacío distinto de Inicio
    E("()=>typeof v161Refresh==='function'?v161Refresh():inboxLoad(true)");pg.wait_for_timeout(900)
    v2=pg.inner_text('#dlg') if E("dlg().open") else ''
    if not v2:
        E("inboxList()");pg.wait_for_timeout(400);v2=pg.inner_text('#dlg')
    check('dice que ya pagó' in v2 and 'No hay compras pendientes' not in v2,'tras Actualizar sigue el aviso: '+v2)
    E("dlg().close()")
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(300)
    hoy2=E("((document.getElementById('v165hoy')||{}).innerText||'')+((remList()||[]).filter(r=>r.id==='inbox').map(r=>r.t).join(' '))")
    check('aviso' in hoy2.lower(),'Inicio sigue en 1 aviso tras actualizar: '+hoy2)
    # ocultar en local: Inicio y lista quedan en 0
    E("v180Dismiss('s1')");pg.wait_for_timeout(400)
    check(E("v180Pending().n")==0,'pendingReview = 0 tras ocultar')
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(250)
    hoy3=E("((document.getElementById('v165hoy')||{}).innerText||'')+((remList()||[]).filter(r=>r.id==='inbox').map(r=>r.t).join(' '))")
    check('Compras por revisar (0)' in hoy3 or E("v180Pending().n")==0,'Inicio en 0: '+hoy3)
    check('1 aviso' not in hoy3 and '1 compra' not in hoy3,'ya no dispara 1: '+hoy3)
    E("inboxList()");pg.wait_for_timeout(400)
    v3=pg.inner_text('#dlg')
    check('No hay compras pendientes' in v3 and 'Compras por revisar (0)' in v3,'lista vacía y en 0: '+v3)
    check('dice que ya pagó' not in v3,'el aviso oculto no se lista: '+v3)
    mark(pg,'dlg')
    pg.locator('#dlg').screenshot(path=os.path.join(SH,'v180-buzon-vacio-tras-ocultar-phone.png'))
    E("dlg().close()")
    # si llega una compra de verdad, cuenta y lista coinciden (1 compra, no aviso)
    E("""(t)=>{window.__fs.docs['shares/'+t+'/inbox/c1']={id:'c1',by:'Carlos',store:'Publix',date:'2026-11-25',total:20.5,tax:0,at:Date.now(),items:[{n:'Leche',a:20.5,own:['Yo','Tony','Carlos']}]};
      inboxAt=0}""",TC)
    E("()=>inboxLoad(true)");pg.wait_for_timeout(900)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(250)
    check(E("v180Pending().n")==1 and E("v180Pending().purchases.length")==1,'1 compra real: '+str(E("JSON.stringify(v180Pending())")))
    hoy4=E("(document.getElementById('v165hoy')||{}).innerText||''")+(E("(remList()||[]).filter(r=>r.id==='inbox').map(r=>r.t).join(' ')"))
    check('Compras por revisar (1)' in hoy4 or '1 compra por revisar' in hoy4,'Inicio: 1 compra: '+hoy4)
    E("inboxList()");pg.wait_for_timeout(300)
    v4=pg.inner_text('#dlg')
    check('Publix' in v4 and 'Compras por revisar (1)' in v4,'lista: 1 compra: '+v4)
    E("dlg().close()")
    # Operaciones › botón usa la misma N (0 si solo hay un aviso ya oculto + la compra = 1)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
    btn=E("(document.getElementById('inbbtn')||{}).innerText||''")
    check('1' in btn and 'Compras por revisar' in btn,'botón Operaciones = misma N: '+btn)
    check(not pg.errors,'sin errores JS (inbox): %s'%pg.errors)

with app(ROOT,state=state(),**PHONE) as pg:
    pg.goto(pg.url.rstrip('/')+'/v.html');pg.wait_for_timeout(600)
    check('v180.js' in pg.content(),'v.html carga v180.js')
    check(not [e for e in pg.errors if 'v180' in e],'v.html: %s'%pg.errors)

print('test_v180 OK',ok)
for n in ('v180-compras-por-fecha-phone.png','v180-inicio-aviso-pago-phone.png','v180-buzon-aviso-pago-phone.png','v180-buzon-vacio-tras-ocultar-phone.png'):
    print(os.path.join(SH,n))
