"""v166 (DATOS DE EJEMPLO): el buzón solo muestra pendientes; si N es 0, «No hay compras pendientes»
sin rutas ni bloques de token. Rechazar en cada una. python3 tests/test_v166.py
"""
import json,os,re
from harness import app,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
TT,TC,TOLD,TGONE='TonyTokenAAAAAAAAAAAAA','CarlosTokenNEWBBBBBBBB','CarlosTokenOLDCCCCCCCC','CarlosTokenGONEDDDDDDD'
SNAP={'v':1,'who':'Carlos','lang':'es','buyers':['Carlos'],'names':{'Yo':'Joe','Tony':'Tony','Carlos':'Carlos'},'months':[]}
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('#demoW').forEach(x=>x.remove());const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';
      (document.getElementById(host||'')||document.getElementById('dlg')||document.body).append(w)}""",host)
def cdoc(i,store="Sam's Club",total=132.77):
    return {'by':'Carlos','store':store,'date':'2026-11-25','total':total,'tax':5.24,'at':1700000000000+i,'items':[{'n':'A','a':127.53,'own':['Yo','Tony','Carlos']}]}
docs={'shares/'+TT:{**SNAP,'who':'Tony','owner':'u1'},'shares/'+TC:{**SNAP,'owner':'u1'},'shares/'+TOLD:{**SNAP,'owner':'u1'}}
for i in range(3):docs['shares/%s/inbox/c%d'%(TOLD,i)]=cdoc(i)
docs['shares/%s/inbox/g1'%TGONE]=cdoc(9,'Publix',20.5)
init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps(docs))
def deny_gone(E):
    E("""()=>{const f=window.fbInbox;window.fbInbox=async t=>{if(!window.__fs.docs['shares/'+t])throw Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});return f(t)};
            const d=window.fbInboxDel;window.fbInboxDel=async(t,id)=>{if(!window.__fs.docs['shares/'+t])throw Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});return d(t,id)}}""")
def no_paths(s,m):
    check(not re.search(r'shares/',s),'sin rutas shares/ (%s): %s'%(m,s))
    check('Ver todas' not in s and 'See all' not in s and 'Buzón: todo' not in s,'sin Ver todas (%s): %s'%(m,s))

with app(ROOT,routes=R,init=init,now='2026-11-26T11:20:00',new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    check(E('CODE_V')>='v166','CODE_V')
    E("(L)=>{S.links=L;save()}",{'Tony':{'t':TT,'on':True},'Carlos':{'t':TC,'on':True}})
    deny_gone(E)
    E("()=>inboxLoad(true)");pg.wait_for_timeout(900)
    # 0 pendientes (el token borrado aún no está apuntado)
    E("()=>{remHide('inbox');tab='ini';render()}");pg.wait_for_timeout(400)
    hoy=E("(document.getElementById('v165hoy')||{}).innerText||''")
    check('Compras por revisar (0)' in hoy,'Hoy (0): '+hoy)
    check('Ver todas' not in hoy and 'See all' not in hoy,'Hoy sin Ver todas: '+hoy)
    E("()=>{const c=document.getElementById('v165hoy');const y=c.getBoundingClientRect().top+scrollY-260;scrollTo(0,Math.max(0,y))}");pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v166-hoy-cero-phone.png'),full_page=False)
    # Por hacer: solo la cifra, sin Revisar ni Ver todas
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(400)
    todo=E("(document.getElementById('todocard')||{}).innerText||''")
    check('Compras por revisar (0)' in todo,'Por hacer (0): '+todo)
    check('Ver todas' not in todo,'Por hacer sin Ver todas: '+todo)
    check(E("!document.getElementById('v165ops-all') && !document.getElementById('v165ops-rev')"),'sin botones extra cuando N=0')
    check('✉️ Mensaje Tony' in todo and '✉️ Mensaje Carlos' in todo and '📤' not in todo,'botones de mensaje: '+todo)
    E("()=>{const c=document.getElementById('todocard');scrollTo(0,Math.max(0,c.getBoundingClientRect().top+scrollY-90))}");pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v166-operaciones-cero-phone.png'),full_page=False)
    pg.click('#todocard button:has-text("✉️ Mensaje Carlos")');pg.wait_for_timeout(200)
    check('Mensaje para Carlos' in E("dlg().querySelector('h2').textContent"),'✉️ abre el mensaje');E("dlg().close()")
    # abrir el buzón con 0: solo «No hay compras pendientes», sin rutas ni errores
    E("inboxList()");pg.wait_for_timeout(500)
    v=pg.inner_text('#dlg')
    check('No hay compras pendientes' in v,'vacío: '+v)
    check('📥 Compras por revisar (0)' in v,'título (0): '+v)
    no_paths(v,'buzón 0')
    check('No se pudo leer' not in v and 'Recuperar acceso' not in v and 'permission-denied' not in v,'sin diagnóstico si no hay error: '+v)
    check(E("!!document.getElementById('v166paste')") and not E("document.getElementById('v166paste').open"),'pegar enlace queda cerrado')
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v166-buzon-cero-phone.png'))
    E("dlg().close()")
    # apuntar el token cuyo shares/<token> se borró: 0 + error (sin documentos viejos en caché)
    E("(t)=>{_v165.reg(t,'Carlos','anterior');inboxAt=0}",TGONE)
    E("()=>inboxLoad(true)");pg.wait_for_timeout(900)
    E("inboxList()");pg.wait_for_timeout(500)
    v=pg.inner_text('#dlg')
    check('No hay compras pendientes' in v and '📥 Compras por revisar (0)' in v,'sigue en 0: '+v)
    check('No se pudo leer un enlace de Carlos (permission-denied)' in v and 'Recuperar acceso' in v,'error visible: '+v)
    no_paths(v,'buzón 0 con error')
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v166-buzon-cero-error-phone.png'))
    # Recuperar el token borrado: aparece Publix
    pg.click('.v166rec');pg.wait_for_timeout(1200)
    check(E("!!window.__fs.docs['shares/%s']&&window.__fs.docs['shares/%s'].owner==='u1'"%(TGONE,TGONE)),'shares/<token> recreado')
    v=pg.inner_text('#dlg')
    check('Publix' in v and 'Rechazar' in v and '📥 Compras por revisar (1)' in v,'tras recuperar: '+v)
    no_paths(v,'tras recuperar')
    # rechazar esa y seguir con las 3 del enlace viejo
    n0=len([k for k in E("Object.keys(window.__fs.docs)") if '/inbox/' in k])
    pg.click('.v166rej');pg.wait_for_timeout(800)
    check(not E("!!window.__fs.docs['shares/%s/inbox/g1']"%TGONE),'rechazada la recuperada')
    check(len([k for k in E("Object.keys(window.__fs.docs)") if '/inbox/' in k])==n0-1,'un solo DEL')
    v=pg.inner_text('#dlg')
    check('No hay compras pendientes' in v and 'Publix' not in v,'ya no está: '+v)
    # pegar el enlace que usa Carlos
    E("document.getElementById('v166paste').open=true")
    pg.fill('#v166url','https://finanzas-joe-12ce2b.web.app/v.html?t='+TOLD);pg.click('#v166go');pg.wait_for_timeout(1200)
    v=pg.inner_text('#dlg')
    check(v.count("Sam's Club")>=3 and '📥 Compras por revisar (3)' in v,'3 pendientes: '+v)
    check(v.count('Revisar')>=3 and v.count('Rechazar')>=3,'Revisar y Rechazar en cada una')
    check('guardada' not in v and 'oculta' not in v,'sin estados de historial: '+v)
    no_paths(v,'3 pendientes')
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v166-buzon-pendientes-phone.png'))
    # Rechazar uno
    left0=sorted(k for k in E("Object.keys(window.__fs.docs)") if TOLD+'/inbox/' in k)
    pg.click('.v166rej >> nth=0');pg.wait_for_timeout(800)
    left=sorted(k for k in E("Object.keys(window.__fs.docs)") if TOLD+'/inbox/' in k)
    check(len(left)==2 and len(left0)==3,'Rechazar borra solo uno: %s -> %s'%(left0,left))
    dl=[l for l in E("window.__fs.log") if l.startswith('DEL') and TOLD in l]
    check(len(dl)>=1,'DEL del token viejo: %s'%dl)
    v=pg.inner_text('#dlg')
    check('📥 Compras por revisar (2)' in v and v.count("Sam's Club")==2,'quedan 2: '+v)
    # Revisar + Cancelar no borra
    pg.click('#dlg button:has-text("Revisar") >> nth=0');pg.wait_for_timeout(400)
    check(E("!!(D&&D._inbox)"),'abre revisión')
    pg.click('#dlg button:has-text("Cancelar")');pg.wait_for_timeout(300)
    E("inboxList()");pg.wait_for_timeout(400)
    check(len([k for k in E("Object.keys(window.__fs.docs)") if TOLD+'/inbox/' in k])==2,'Cancelar no borra')
    check('📥 Compras por revisar (2)' in pg.inner_text('#dlg'),'siguen 2 tras Cancelar')
    # una guardada (p.inboxId) no se lista
    ids=E("INBOX.filter(x=>x.store===\"Sam's Club\").map(x=>x.id)")
    check(len(ids)==2,'ids pendientes')
    saved=ids[0]
    E("(id)=>{const m=S.months[S.cur];m.purchases.push({id:'px',store:\"Sam's Club\",date:'2026-11-25',total:132.77,paidBy:'Carlos',inboxId:id,shares:{Yo:44.26,Tony:44.26,Carlos:44.25}});save()}",saved)
    E("dlg().close();inboxAt=0;inboxLoad(true)");pg.wait_for_timeout(900)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(400)
    todo=E("(document.getElementById('todocard')||{}).innerText||''")
    check('Compras por revisar (1)' in todo and 'Ver todas' not in todo,'Por hacer (1) sin la guardada: '+todo)
    check(E("!!document.getElementById('v165ops-rev')"),'Revisar visible con N>0')
    E("()=>{const c=document.getElementById('todocard');scrollTo(0,Math.max(0,c.getBoundingClientRect().top+scrollY-90))}");pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v166-operaciones-pendientes-phone.png'),full_page=False)
    pg.click('#v165ops-rev');pg.wait_for_timeout(500)
    v=pg.inner_text('#dlg')
    check('📥 Compras por revisar (1)' in v and v.count("Sam's Club")==1,'lista sin la guardada: '+v)
    check(saved not in E("INBOX.map(x=>x.id)"),'INBOX sin el inboxId guardado')
    check(E("!!window.__fs.docs['shares/%s/inbox/%s']"%(TOLD,saved)),'la copia en la nube de la aprobada sigue (v110)')
    # rechazada no vuelve aunque la nube la devuelva
    other=E("INBOX.map(x=>x.id)[0]")
    E("(id)=>{const s=JSON.parse(localStorage.getItem('finanzas-inbox-rejected')||'[]');s.push(id);localStorage.setItem('finanzas-inbox-rejected',JSON.stringify(s))}",other)
    E("inboxList()");pg.wait_for_timeout(300)
    v=pg.inner_text('#dlg')
    check('No hay compras pendientes' in v and "Sam's Club" not in v,'rechazada oculta: '+v)
    E("dlg().close()")
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(400)
    hoy=E("(document.getElementById('v165hoy')||{}).innerText||''")
    check('Compras por revisar (0)' in hoy,'Hoy vuelve a (0): '+hoy)
    # inboxAll abre 📥, no la vista vieja
    E("inboxAll()");pg.wait_for_timeout(400)
    check('📥 Compras por revisar' in E("dlg().querySelector('h2').textContent") and 'Buzón: todo' not in pg.inner_text('#dlg'),'inboxAll = 📥')
    E("dlg().close()")
    # cambiar enlace sigue apuntando el token
    E("()=>{window.confirm=()=>true;return linkRegen('Carlos')}");pg.wait_for_timeout(600)
    check(TC in E("Object.keys(JSON.parse(localStorage.getItem('finanzas-inbox-tokens')||'{}'))"),'token anterior apuntado')
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)

# pendientes en el enlace actual: Hoy muestra la línea 📥, no se duplica
with app(ROOT,routes=R,init=init,now='2026-11-26T11:20:00',new_look=True,browser='webkit') as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    E("(L)=>{S.links=L;save()}",{'Tony':{'t':TT,'on':True},'Carlos':{'t':TOLD,'on':True}})
    E("()=>inboxLoad(true)");pg.wait_for_timeout(900);E("()=>{tab='ini';render()}");pg.wait_for_timeout(400)
    v=pg.inner_text('#v');hoy=E("(document.getElementById('v165hoy')||{}).innerText||''")
    check('3 compras por revisar' in v,'WebKit Hoy 📥 (3): '+v)
    check('Ver todas' not in v and 'Ver todas' not in hoy,'WebKit sin Ver todas')
    check(not hoy or 'Compras por revisar' not in hoy,'no se duplica la entrada si ya está 📥: '+hoy)
    # abrir desde la línea 📥
    E("inboxList()");pg.wait_for_timeout(400)
    d=pg.inner_text('#dlg')
    check('📥 Compras por revisar (3)' in d and d.count("Sam's Club")>=3 and d.count('Rechazar')>=3,'WebKit 📥: '+d)
    no_paths(d,'WebKit 📥')
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v166-buzon-webkit-phone.png'))
    E("dlg().close()")
    E("""() => { const e = document.querySelector('.remrow[data-rem="inbox"]') || document.getElementById('remcard');
      if (e) { const y = e.getBoundingClientRect().top + scrollY - 260; scrollTo(0, Math.max(0, y)); } }""")
    pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v166-hoy-pendientes-phone.png'),full_page=False)
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)

print('test_v166 OK',ok)
