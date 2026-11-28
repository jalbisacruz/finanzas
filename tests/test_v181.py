"""v181 (DATOS DE EJEMPLO, Firestore falso en memoria):
 (1) un solo dispositivo nunca recibe «Datos distintos en la nube» por sus propios cambios;
 (2) «Sincronizado» solo sin cambios pendientes ni aviso abierto;
 (3) texto del aviso (otro dispositivo solo si el id de la nube es otro) y recomendación de la más nueva;
 (4) un gasto con tienda se ve con la tienda en Pagar tarjeta / cargos de tarjeta y se encuentra en la búsqueda.
Las pruebas «antes» corren el sync.js / v148.js / v168.js de v180 (git show 675c7b4).  python3 tests/test_v181.py"""
import os,json,copy,subprocess,datetime
from zoneinfo import ZoneInfo
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def old(f):return subprocess.run(['git','-C',ROOT,'show','675c7b4:'+f],capture_output=True,text=True).stdout
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
R_OLD=dict(R);R_OLD['**/sync.js']=old('sync.js')
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
NY=ZoneInfo('America/New_York')
ms=lambda y,mo,d,h,mi,s:int(datetime.datetime(y,mo,d,h,mi,s,tzinfo=NY).timestamp()*1000)
T_CLOUD=ms(2026,11,26,18,38,51)      # sello de la última subida (como en la captura de Joe)
T_LOCAL=ms(2026,11,28,5,21,38)       # sello del último cambio en el teléfono
SD='users/u1/data/state'
def mk(stamp,marker):
    s=copy.deepcopy(FIX);s['updatedAt']=stamp;s['marker']=marker;return s
cdoc=lambda st,**k:{'state':json.dumps(st),'updatedAt':st['updatedAt'],'ver':3,**k}
def fnv(s):   # igual que hashOf de sync.js (solo ASCII)
    h=2166136261
    for ch in s:
        h^=ord(ch);h=(h*16777619)&0xFFFFFFFF
    import string
    n=h;d='0123456789abcdefghijklmnopqrstuvwxyz';o=''
    while n:o=d[n%36]+o;n//=36
    return (o or '0')+':'+str(len(s))
def run(local,cloud,extra='',routes=None,base='auto',now='2026-11-28T05:30:00',**kw):
    b=local['updatedAt'] if base=='auto' else base
    init="localStorage.setItem('finanzas-sync-uid','u1');"+("localStorage.setItem('finanzas-sync-base','%d');"%b if b is not None else '')
    init+="localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps({SD:cloud}))+extra
    return app(ROOT,state=local,routes=routes or R,init=init,now=now,new_look=True,expand=False,**kw)
cl=lambda E:json.loads(E("__fs.docs['%s'].state"%SD))['marker']
def status(pg):
    pg.evaluate("()=>{tab='ini';render()}");pg.wait_for_timeout(150)
    return pg.inner_text('#syncst') if pg.locator('#syncst').count() else ''
dirty=lambda E:E("localStorage.getItem('finanzas-sync-dirty')")
def mark(pg,host):
    pg.evaluate("""(host)=>{document.querySelectorAll('#demoW,.toast').forEach(x=>x.remove());const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:40%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';
      (document.getElementById(host||'')||document.body).append(w)}""",host)
noerr=lambda pg:check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)

# ---------- A) un solo dispositivo: la subida llega a la nube pero se pierde la confirmación; luego otro guardado ----------
def scenarioA(routes,keep=False):
    with run(mk(T_CLOUD,'T0'),cdoc(mk(T_CLOUD,'T0')),"window.__syncRetryMs=60000;",routes=routes) as pg:
        E=pg.evaluate;pg.wait_for_timeout(1500)
        E("()=>{window.__setLoseAck=1;S.marker='A';save()}");pg.wait_for_timeout(3000)
        a1=(cl(E),dirty(E),status(pg))
        E("()=>{S.marker='B';save()}");pg.wait_for_timeout(4500)
        res={'a1':a1,'dialog':pg.locator('#syncconf').count(),'cloud':cl(E),'dirty':dirty(E),'status':status(pg),'errors':list(pg.errors),
             'dev':E("(__fs.docs['%s']||{}).dev"%SD),'myDev':E("localStorage.getItem('finanzas-device-id')")}
        if res['dialog']:
            E("window.__emit()");pg.wait_for_timeout(300);res['status_con_aviso']=status(pg)
        return res
A_old=scenarioA(R_OLD)
check(A_old['a1'][0]=='A' and A_old['dialog']==1,'ANTES (v180): un solo dispositivo recibe el aviso por sus propios cambios: %s'%A_old)
check('Sincronizado' in A_old['status_con_aviso'],'ANTES: con el aviso abierto el encabezado decía «Sincronizado»: %s'%A_old['status_con_aviso'])
A=scenarioA(R)
check(A['a1'][0]=='A' and A['a1'][1]=='1','despuésA1: llegó a la nube y quedó pendiente (no hay confirmación): %s'%(A['a1'],))
check('Sincronizado' not in A['a1'][2],'sin confirmación no dice Sincronizado: %s'%A['a1'][2])
check(A['dialog']==0,'DESPUÉS: sin aviso: %s'%A)
check(A['cloud']=='B' and A['dirty'] is None and 'Sincronizado' in A['status'],'se sube en silencio y queda sincronizado: %s'%A)
check(A['dev'] and A['dev']==A['myDev'],'la nube lleva el id de este dispositivo: %s'%A)
check(not [e for e in A['errors'] if not e.startswith('DIALOG')],A['errors'])

# ---------- B) el teléfono se reabre: la nube ya tiene lo que él mismo escribió (id propio) y lo local es más nuevo ----------
def scenarioB(routes,devOnCloud='DEV-A'):
    cloud=cdoc(mk(T_CLOUD,'U1'),dev=devOnCloud)
    with run(mk(T_LOCAL,'U2'),cloud,"localStorage.setItem('finanzas-device-id','DEV-A');localStorage.setItem('finanzas-sync-dirty','1');",base=T_CLOUD-9*60000,routes=routes) as pg:
        E=pg.evaluate;pg.wait_for_timeout(2500)
        return {'dialog':pg.locator('#syncconf').count(),'cloud':cl(E),'dirty':dirty(E),'errors':list(pg.errors)}
Bo=scenarioB(R_OLD);check(Bo['dialog']==1,'ANTES: aviso aunque la nube la escribió este dispositivo: %s'%Bo)
Bn=scenarioB(R);check(Bn['dialog']==0 and Bn['cloud']=='U2' and Bn['dirty'] is None,'DESPUÉS (id propio en la nube): se sube sin preguntar: %s'%Bn)

# ---------- C) contenido de la nube igual al último sincronizado (aunque el sello sea otro) ----------
st0=mk(T_CLOUD,'SAME')
cdC=cdoc(st0)
with run(mk(T_LOCAL,'C2'),cdC,"localStorage.setItem('finanzas-sync-hash','%s');localStorage.setItem('finanzas-sync-dirty','1');"%fnv(cdC['state']),base=T_CLOUD-5000) as pg:
    E=pg.evaluate;pg.wait_for_timeout(2500)
    check(pg.locator('#syncconf').count()==0 and cl(E)=='C2' and dirty(E) is None,'contenido igual al último sincronizado: se sube sin preguntar');noerr(pg)

# ---------- D) carrera: una subida lenta y otro guardado mientras tanto (con confirmación en vivo) ----------
with run(mk(T_CLOUD,'T0'),cdoc(mk(T_CLOUD,'T0')),"window.__liveSnap=1;window.__setDelay=2500;") as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    E("()=>{S.marker='C1';save()}");pg.wait_for_timeout(2600)      # la primera subida sigue en camino
    E("()=>{S.marker='C2';save()}");pg.wait_for_timeout(12000)
    check(pg.locator('#syncconf').count()==0,'carrera: sin aviso')
    check(cl(E)=='C2' and dirty(E) is None and E("localStorage.getItem('finanzas-sync-base')")==str(E("S.updatedAt")),'carrera: la nube tiene lo último y la base coincide: %s %s'%(cl(E),dirty(E)))
    check('Sincronizado' in status(pg),'carrera: sincronizado');noerr(pg)

# ---------- E) fallo de subida: reintenta solo y nunca dice «Sincronizado» con cambios pendientes ----------
def scenarioE(routes):
    with run(mk(T_CLOUD,'T0'),cdoc(mk(T_CLOUD,'T0')),"window.__syncRetryMs=2500;",routes=routes) as pg:
        E=pg.evaluate;pg.wait_for_timeout(1500)
        E("()=>{window.__setFail=1;S.marker='E';save()}");pg.wait_for_timeout(2200)
        r={'after_fail':status(pg),'cloud1':cl(E),'dirty1':dirty(E)}
        pg.wait_for_timeout(6000);r.update({'cloud2':cl(E),'dirty2':dirty(E),'final':status(pg)});return r
Eo=scenarioE(R_OLD);check(Eo['cloud2']=='T0','ANTES: sin reintento automático (la nube sigue vieja): %s'%Eo)
En=scenarioE(R)
check(En['cloud1']=='T0' and En['dirty1']=='1' and 'Sincronizado' not in En['after_fail'],'fallo: queda pendiente y no dice Sincronizado: %s'%En)
check(En['cloud2']=='E' and En['dirty2'] is None and 'Sincronizado' in En['final'],'reintento automático: %s'%En)
# snapshot con cambios pendientes: no «Sincronizado»
with run(mk(T_CLOUD,'T0'),cdoc(mk(T_CLOUD,'T0')),"window.__syncRetryMs=60000;") as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    E("()=>{window.__setFail=3;S.marker='E2';save()}");pg.wait_for_timeout(2500)
    E("window.__emit()");pg.wait_for_timeout(300)
    check('Sincronizado' not in status(pg) and dirty(E)=='1','con cambios pendientes un evento de la nube no dice Sincronizado: '+status(pg));noerr(pg)

# ---------- F) cambios reales de OTRO dispositivo: sigue preguntando, con texto claro y recomendación ----------
def conflict(cloud_stamp,local_stamp,dev,lang='es',base=None,extra=''):
    return run(mk(local_stamp,'LOCAL'),cdoc(mk(cloud_stamp,'CLOUD'),**({'dev':dev} if dev else {})),
        "localStorage.setItem('finanzas-device-id','DEV-A');localStorage.setItem('finanzas-sync-dirty','1');"+("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')+extra,
        base=T_CLOUD-9*60000 if base is None else base,lang=lang)
# F1: otro dispositivo, lo más nuevo es este -> recomienda este dispositivo
with conflict(T_CLOUD,T_LOCAL,'DEV-OTHER') as pg:
    E=pg.evaluate;pg.wait_for_timeout(2500)
    t=pg.inner_text('#syncconf')
    check(pg.locator('#syncconf').is_visible() and 'otro dispositivo' in t,'F1: texto de otro dispositivo: '+t)
    check(cl(E)=='CLOUD','F1: no se escribió nada mientras pregunta')
    check(E("document.activeElement&&document.activeElement.id")=='sc-local' and 'Usar este dispositivo (recomendado)' in t and 'Lo más nuevo: este dispositivo' in t,'F1 recomienda lo más nuevo: '+t)
    check('Falta decidir' in status(pg) and 'Sincronizado' not in status(pg),'F1: encabezado «Falta decidir»: '+status(pg))
    E("window.__emit()");pg.wait_for_timeout(300);check('Sincronizado' not in status(pg),'F1: evento de la nube no cambia el encabezado')
    mark(pg,'syncconf');pg.locator('#syncconf').screenshot(path=os.path.join(SH,'v181-aviso-otro-dispositivo-phone.png'))
    # Escape: no decide (se vuelve a preguntar), nada cambia
    pg.keyboard.press('Escape');pg.wait_for_timeout(500)
    check(pg.locator('#syncconf').count()==0 and cl(E)=='CLOUD' and E("S.marker")=='LOCAL','F1: Escape no reemplaza nada')
    # elegir este dispositivo: confirmación + copia en Respaldo
    E("()=>{window.confirm=()=>true;fbReconcile(__fs.docs['%s'])}"%SD);pg.wait_for_timeout(500)
    pg.click('#sc-local');pg.wait_for_timeout(1800)
    bk=[k for k in E("Object.keys(__fs.docs)") if 'antes-de-dispositivo' in k]
    check(cl(E)=='LOCAL' and len(bk)==1 and json.loads(E("__fs.docs['%s'].state"%bk[0]))['marker']=='CLOUD','F1: elegido: se reemplaza la nube y queda copia');noerr(pg)
# F2: otro dispositivo, la nube es más nueva -> recomienda la nube (como antes)
with conflict(T_LOCAL,T_CLOUD,'DEV-OTHER') as pg:
    E=pg.evaluate;pg.wait_for_timeout(2500);t=pg.inner_text('#syncconf')
    check(E("document.activeElement&&document.activeElement.id")=='sc-cloud' and 'Usar la nube (recomendado)' in t and 'MÁS VIEJOS' in t and 'Lo más nuevo: la nube' in t,'F2: '+t)
    pg.keyboard.press('Escape');pg.wait_for_timeout(800);check(E("S.marker")=='CLOUD','F2: Escape = nube');noerr(pg)
# F3: nube sin id (versión anterior): texto neutro, sin «otro dispositivo»
with conflict(T_CLOUD,T_LOCAL,None) as pg:
    pg.wait_for_timeout(2500);t=pg.inner_text('#syncconf')
    check('otro dispositivo' not in t and 'no se sabe desde dónde' in t,'F3 texto neutro: '+t)
# F4: nunca sincronizó (sin base): recomienda la nube aunque lo local parezca más nuevo
with conflict(T_CLOUD,T_LOCAL,'DEV-OTHER',base=None) as pg:
    pg.wait_for_timeout(500)
with run(mk(T_LOCAL,'LOCAL'),cdoc(mk(T_CLOUD,'CLOUD'),dev='DEV-OTHER'),"localStorage.setItem('finanzas-sync-dirty','1');",base=None) as pg:
    pg.wait_for_timeout(2500);check(pg.evaluate("document.activeElement&&document.activeElement.id")=='sc-cloud','F4: sin historial = nube recomendada')
# F5: inglés
with conflict(T_CLOUD,T_LOCAL,'DEV-OTHER',lang='en') as pg:
    pg.wait_for_timeout(2500);t=pg.inner_text('#syncconf')
    check('Newest: this device' in t and 'Use this device (recommended)' in t and 'another device' in t,'F5 EN: '+t)
    check('Choose which data' in status(pg),'F5 EN estado: '+status(pg))

# ---------- G) gasto con tienda: Pagar tarjeta, cargos de tarjeta, búsqueda ----------
def card_state():
    s=copy.deepcopy(FIX);s['cur']='2026-10';m=s['months']['2026-10'];m['cards'][0]['amount']=63.14
    nm=m['cards'][0]['name']
    m['personal']=[
      {'id':'g1','date':'2026-10-27','amount':1,'cat':'🛒 Comida/Supermercado','desc':'','method':'card:'+nm,'store':'Walmart','at':1761600000000},
      {'id':'g2','date':'2026-10-27','amount':1,'cat':'🛒 Comida/Supermercado','desc':'Bolsas de Plástico','method':'card:'+nm,'store':'Walmart','at':1761600001000},
      {'id':'g3','date':'2026-10-26','amount':5,'cat':'🛒 Comida/Supermercado','desc':'Propina','method':'card:'+nm,'at':1761500000000}]
    return s
def card_probe(routes,fix=False):
    with app(ROOT,state=card_state(),routes=routes,now='2026-10-27T10:00:00',new_look=True,expand=False) as pg:
        E=pg.evaluate
        E("()=>{cardPayDlg(M().cards[0].id)}");pg.wait_for_timeout(300)
        rows=E("[...document.querySelectorAll('#cplist .cpl')].map(e=>e.innerText.split('\\n')[0])")
        shot=None
        if fix:
            E("()=>{document.querySelectorAll('.toast').forEach(x=>x.remove())}");mark(pg,'dlg')
            pg.locator('#dlg').screenshot(path=os.path.join(SH,'v181-pagar-tarjeta-tienda-phone.png'))
        E("dlg().close()")
        E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
        flows=E("[...document.querySelectorAll('.v168cf .row .n')].map(e=>e.firstChild.textContent)")
        found={q:E("(q)=>osSearch(q).map(x=>x.desc)",q) for q in ('walmart','bolsas')}
        return {'rows':rows,'flows':flows,'found':found,'errors':list(pg.errors)}
Ro=dict(R);Ro['**/v181.js']='/* antes */';Ro['**/v148.js']=old('v148.js');Ro['**/v168.js']=old('v168.js');Ro['**/v180.js']=old('v180.js')
go=card_probe(Ro)
check('Bolsas de Plástico' in go['rows'] and '🛒 Comida/Supermercado' in go['rows'] and not any('Walmart' in r for r in go['rows']),'ANTES: el diálogo mostraba el artículo/categoría y no la tienda: %s'%go['rows'])
gn=card_probe(R,fix=True)
check('Walmart · Bolsas de Plástico' in gn['rows'] and 'Walmart · 🛒 Comida/Supermercado' in gn['rows'] and 'Propina' in gn['rows'],'DESPUÉS: tienda en Pagar tarjeta: %s'%gn['rows'])
check(any('Walmart' in f for f in gn['flows']),'cargos de la tarjeta (Operaciones) con tienda: %s'%gn['flows'])
check(any('Bolsas' in x for x in gn['found']['walmart']) and any('Bolsas' in x for x in gn['found']['bolsas']),'la búsqueda encuentra por tienda y por artículo: %s'%gn['found'])
check(not gn['errors'],gn['errors'])
# índice de búsqueda: un gasto guardado antes de que cargue la nube (la fecha de guardado no cambia) también se encuentra
with app(ROOT,state=card_state(),routes=R,init="localStorage.setItem('finanzas-sync-uid','u1');window.__snapDelay=60000;window.__getDelay=60000;",now='2026-10-27T10:00:00',new_look=True,expand=False) as pg:
    E=pg.evaluate;E("()=>osSearch('zzz')")      # construye el índice
    E("()=>{M().personal.unshift({id:'gN',date:'2026-10-27',amount:2,cat:'🛒 Comida/Supermercado',desc:'Hielo',method:'deb',store:'Aldi'});save()}")
    check(E("window.__syncReady")==False,'la nube aún no cargó')
    check(any('Hielo' in x for x in E("osSearch('hielo').map(x=>x.desc)")) and any('Hielo' in x for x in E("osSearch('aldi').map(x=>x.desc)")),'búsqueda ve el gasto recién guardado')
    old_idx=E("(OS_KEY)")
# orden por fecha de los gastos personales (tarjeta): más nuevo primero, aunque se hayan agregado después
with app(ROOT,state=card_state(),routes=R,now='2026-10-27T10:00:00',new_look=True,expand=False) as pg:
    E=pg.evaluate
    E("()=>{const c=M().cards[0].id,nm=M().cards[0].name;M().personal.unshift({id:'gD1',date:'2026-10-20',amount:3,cat:'📦 Otros',desc:'ZViejo',method:'card:'+nm,store:'Aldi'},{id:'gD2',date:'2026-10-26',amount:3,cat:'📦 Otros',desc:'ZNuevo',method:'card:'+nm,store:'Aldi'});save();cardPayDlg(c)}");pg.wait_for_timeout(300)
    rows=E("[...document.querySelectorAll('#cplist .cpl')].map(e=>e.innerText.split('\\n')[0])")
    zi=[r for r in rows if r.startswith('Aldi')]
    check(len(zi)==2 and 'ZNuevo' in zi[0] and 'ZViejo' in zi[1],'personales por fecha, nuevo primero: %s'%rows)
print('test_v181 OK',ok)
for n in ('v181-aviso-otro-dispositivo-phone.png','v181-pagar-tarjeta-tienda-phone.png'):print(os.path.join(SH,n))
