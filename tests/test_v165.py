"""v165 (DATOS DE EJEMPLO): 🧾 Compras por revisar siempre visible (Hoy y Por hacer), «Ver todas» por token con
conteos y errores, Rechazar uno a uno, Recuperar acceso a un enlace borrado, pegar enlace, ✉️ Mensaje.
python3 tests/test_v165.py
"""
import json,os
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
def cdoc(i,store="Sam's Club",total=132.77):return {'by':'Carlos','store':store,'date':'2026-11-25','total':total,'tax':5.24,'at':1700000000000+i,'items':[{'n':'A','a':127.53,'own':['Yo','Tony','Carlos']}]}
docs={'shares/'+TT:{**SNAP,'who':'Tony','owner':'u1'},'shares/'+TC:{**SNAP,'owner':'u1'},'shares/'+TOLD:{**SNAP,'owner':'u1'}}
for i in range(3):docs['shares/%s/inbox/c%d'%(TOLD,i)]=cdoc(i)
# un token cuyo shares/<token> se borró (Cambiar enlace): sus envíos quedan, pero no se pueden leer
docs['shares/%s/inbox/g1'%TGONE]=cdoc(9,'Publix',20.5)
init=("localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps(docs))+
      # el teléfono recuerda el token borrado (como lo hace v165 antes de Cambiar enlace)
      "localStorage.setItem('finanzas-inbox-tokens',JSON.stringify({'%s':{who:'Carlos',src:'anterior',at:1}}));"%TGONE)
# fakefb: las reglas piden shares/<token> con owner para leer/borrar el buzón
RULES="""(()=>{const fs=window.__fs;if(!fs||fs.__v165)return;fs.__v165=1;})()"""
with app(ROOT,routes=R,init=init,now='2026-11-26T11:20:00',new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    check(E('CODE_V')>='v165','CODE_V')
    # el token actual no tiene nada; los 3 están en un token que la app ya no conoce (Hoy sin 📥)
    E("(L)=>{S.links=L;save()}",{'Tony':{'t':TT,'on':True},'Carlos':{'t':TC,'on':True}})
    # simula permission-denied para el token cuyo shares/<token> no existe
    E("""(g)=>{const f=window.fbInbox;window.fbInbox=async t=>{if(!window.__fs.docs['shares/'+t])throw Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});return f(t)};
            const d=window.fbInboxDel;window.fbInboxDel=async(t,id)=>{if(!window.__fs.docs['shares/'+t])throw Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});return d(t,id)}}""",TGONE)
    E("()=>inboxLoad(true)");pg.wait_for_timeout(700)
    check(E("INBOX.filter(x=>x.by==='Carlos').length")==0,'como Joe: 0 de Carlos en 📥')
    # aunque se haya cerrado el 📥 de Hoy con ✕
    E("()=>{remHide('inbox');tab='ini';render()}");pg.wait_for_timeout(400)
    hoy=E("(document.getElementById('v165hoy')||{}).innerText||''")
    check('Compras por revisar (0)' in hoy and 'Ver todas' in hoy,'Hoy siempre tiene la entrada: '+hoy)
    E("()=>{const c=document.getElementById('v165hoy');const y=c.getBoundingClientRect().top+scrollY-260;scrollTo(0,Math.max(0,y))}");pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v165-hoy-entrada-phone.png'),full_page=False)
    # Operaciones: fila en Por hacer y ✉️ Mensaje
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(400)
    todo=E("(document.getElementById('todocard')||{}).innerText||''")
    check('Compras por revisar (0)' in todo and 'Ver todas' in todo,'Por hacer: '+todo)
    check('✉️ Mensaje Tony' in todo and '✉️ Mensaje Carlos' in todo and '📤' not in todo,'botones de mensaje: '+todo)
    check(E("(()=>{const h=document.getElementById('todocard').innerHTML;return h.indexOf('v165ops')<h.indexOf('Transferir a Tony')})()"),'la fila va arriba en Por hacer')
    E("()=>{const c=document.getElementById('todocard');scrollTo(0,Math.max(0,c.getBoundingClientRect().top+scrollY-90))}");pg.wait_for_timeout(200)
    check(E("(()=>{const a=document.getElementById('v165ops-all').getBoundingClientRect(),r=document.getElementById('v165ops-rev').getBoundingClientRect();return Math.abs(a.top-r.top)<4})()"),'Revisar y Ver todas en la misma línea')
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v165-operaciones-por-hacer-phone.png'),full_page=False)
    # ✉️ Mensaje Carlos sigue abriendo el mensaje
    pg.click('#todocard button:has-text("✉️ Mensaje Carlos")');pg.wait_for_timeout(200)
    check('Mensaje para Carlos' in E("dlg().querySelector('h2').textContent"),'✉️ abre el mensaje');E("dlg().close()")
    # Ver todas: sin el token viejo todavía -> se ve el actual (0) y el borrado (error)
    pg.click('#v165ops-all');pg.wait_for_timeout(1200)
    v=pg.inner_text('#dlg')
    check('Buzón: todo lo que llegó' in v,'abre Ver todas')
    check('shares/…BBBBBB/inbox · sin documentos' in v,'ruta y conteo del actual: '+v)
    check('shares/…DDDDDD/inbox · no se pudo leer (permission-denied)' in v and 'Recuperar acceso' in v,'error visible del token borrado: '+v)
    # pegar el enlace que usa Carlos (token viejo) -> aparecen los 3
    pg.fill('#v165paste','https://finanzas-joe-12ce2b.web.app/v.html?t='+TOLD);pg.click('#v165go');pg.wait_for_timeout(1200)
    v=pg.inner_text('#dlg')
    check('shares/…CCCCCC/inbox · 3 documentos' in v and v.count("Sam's Club")>=3 and 'oculta' in v,'enlace pegado con 3: '+v)
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v165-ver-todas-phone.png'))
    # Rechazar uno (confirmar): solo ese se borra
    n0=len([k for k in E("Object.keys(window.__fs.docs)") if '/inbox/' in k])
    pg.click('.v165tok[data-t="%s"] .v165rej >> nth=0'%TOLD);pg.wait_for_timeout(800)
    left=sorted(k for k in E("Object.keys(window.__fs.docs)") if '/inbox/' in k)
    check(len(left)==n0-1 and len([k for k in left if TOLD in k])==2,'Rechazar borra solo uno: %s'%left)
    dl=[l for l in E("window.__fs.log") if l.startswith('DEL')]
    check(len(dl)==1 and dl[0].startswith('DEL shares/%s/inbox/c'%TOLD),'un DEL: %s'%dl)
    check('2 documentos' in pg.inner_text('.v165tok[data-t="%s"]'%TOLD),'la vista se actualiza')
    # Revisar una oculta la lleva a la revisión
    pg.click('.v165tok[data-t="%s"] button:has-text("Revisar") >> nth=0'%TOLD);pg.wait_for_timeout(500)
    check(E("!!(D&&D._inbox&&D._inbox.t==='%s')"%TOLD),'Revisar desde Ver todas')
    pg.click('#dlg button:has-text("Cancelar")');pg.wait_for_timeout(300)
    check(len([k for k in E("Object.keys(window.__fs.docs)") if TOLD+'/inbox/' in k])==2,'Cancelar no borra nada')
    # Recuperar acceso al enlace borrado y rechazar lo que quedó
    E("inboxAll()");pg.wait_for_timeout(1200)
    pg.click('.v165tok[data-t="%s"] .v165rec'%TGONE);pg.wait_for_timeout(1200)
    check(E("!!window.__fs.docs['shares/%s']&&window.__fs.docs['shares/%s'].owner==='u1'"%(TGONE,TGONE)),'shares/<token> recreado con owner')
    t=pg.inner_text('.v165tok[data-t="%s"]'%TGONE)
    check('1 documento' in t and 'Publix' in t,'tras recuperar se lee: '+t)
    pg.click('.v165tok[data-t="%s"] .v165rej'%TGONE);pg.wait_for_timeout(800)
    check(not E("!!window.__fs.docs['shares/%s/inbox/g1']"%TGONE),'rechazada la del enlace recuperado')
    # una guardada (p.inboxId) sale como guardada, con Rechazar
    E("()=>{const m=S.months[S.cur];m.purchases.push({id:'px',store:\"Sam's Club\",date:'2026-11-25',total:132.77,paidBy:'Carlos',inboxId:'c1',shares:{Yo:44.26,Tony:44.26,Carlos:44.25}});save()}")
    E("inboxAll()");pg.wait_for_timeout(1200)
    row=E("(document.querySelector('.v165doc[data-id=\"c1\"]')||{}).innerText||''")
    check('guardada' in row and 'Rechazar' in row,'guardada visible: '+row)
    # el 📥 normal tiene «Ver todas»
    E("dlg().close();inboxList()");pg.wait_for_timeout(800)
    check(E("!!document.getElementById('v165list-all')"),'📥 tiene Ver todas')
    # Cambiar enlace: el token anterior queda apuntado
    E("dlg().close()")
    E("()=>{window.confirm=()=>true;return linkRegen('Carlos')}");pg.wait_for_timeout(600)
    check(TC in E("Object.keys(JSON.parse(localStorage.getItem('finanzas-inbox-tokens')||'{}'))"),'token anterior apuntado al cambiar enlace')
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
# WebKit: la entrada de Hoy y Ver todas
with app(ROOT,routes=R,init=init,now='2026-11-26T11:20:00',new_look=True,browser='webkit') as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);E("(L)=>{S.links=L;save()}",{'Tony':{'t':TT,'on':True},'Carlos':{'t':TOLD,'on':True}})
    E("()=>inboxLoad(true)");pg.wait_for_timeout(700);E("()=>{tab='ini';render()}");pg.wait_for_timeout(300)
    hoy=E("(document.getElementById('v165hoy')||{}).innerText||''");v=pg.inner_text('#v')
    check('Buzón' in hoy and 'Ver todas' in hoy and v.count('por revisar')==1 and '3 compras por revisar' in v,'WebKit Hoy: 📥 (3) una vez + Buzón · Ver todas: '+hoy)
    pg.click('#v165hoy-all');pg.wait_for_timeout(1200)
    check('3 documentos' in pg.inner_text('#dlg') and 'pendiente' in pg.inner_text('#dlg'),'WebKit Ver todas')
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
print('test_v165 OK',ok)
