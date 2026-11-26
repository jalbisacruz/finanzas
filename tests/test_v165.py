"""v165 (actualizado en v166): entradas «🧾 Compras por revisar (N)» en Hoy y Por hacer, ✉️ Mensaje,
pegar enlace, Rechazar uno a uno, Recuperar acceso. v166 quitó «Ver todas» (si N es 0 no hay nada
que ver) y deja solo las pendientes. python3 tests/test_v165.py
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
docs['shares/%s/inbox/g1'%TGONE]=cdoc(9,'Publix',20.5)
# el token borrado se apunta después de envolver fbInbox, para no cachear una lectura buena
init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps(docs))
with app(ROOT,routes=R,init=init,now='2026-11-26T11:20:00',new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    check(E('CODE_V')>='v165','CODE_V')
    E("(L)=>{S.links=L;save()}",{'Tony':{'t':TT,'on':True},'Carlos':{'t':TC,'on':True}})
    E("""()=>{const f=window.fbInbox;window.fbInbox=async t=>{if(!window.__fs.docs['shares/'+t])throw Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});return f(t)};
            const d=window.fbInboxDel;window.fbInboxDel=async(t,id)=>{if(!window.__fs.docs['shares/'+t])throw Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});return d(t,id)}}""")
    E("()=>inboxLoad(true)");pg.wait_for_timeout(700)
    check(E("INBOX.filter(x=>x.by==='Carlos').length")==0,'como Joe: 0 de Carlos en 📥')
    E("()=>{remHide('inbox');tab='ini';render()}");pg.wait_for_timeout(400)
    hoy=E("(document.getElementById('v165hoy')||{}).innerText||''")
    check('Compras por revisar (0)' in hoy,'Hoy siempre tiene la entrada: '+hoy)
    check('Ver todas' not in hoy,'v166: sin Ver todas en Hoy: '+hoy)
    E("()=>{const c=document.getElementById('v165hoy');const y=c.getBoundingClientRect().top+scrollY-260;scrollTo(0,Math.max(0,y))}");pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v165-hoy-entrada-phone.png'),full_page=False)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(400)
    todo=E("(document.getElementById('todocard')||{}).innerText||''")
    check('Compras por revisar (0)' in todo,'Por hacer: '+todo)
    check('Ver todas' not in todo,'v166: sin Ver todas en Por hacer: '+todo)
    check('✉️ Mensaje Tony' in todo and '✉️ Mensaje Carlos' in todo and '📤' not in todo,'botones de mensaje: '+todo)
    check(E("(()=>{const h=document.getElementById('todocard').innerHTML;return h.indexOf('v165ops')<h.indexOf('Transferir a Tony')})()"),'la fila va arriba en Por hacer')
    E("()=>{const c=document.getElementById('todocard');scrollTo(0,Math.max(0,c.getBoundingClientRect().top+scrollY-90))}");pg.wait_for_timeout(200)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v165-operaciones-por-hacer-phone.png'),full_page=False)
    pg.click('#todocard button:has-text("✉️ Mensaje Carlos")');pg.wait_for_timeout(200)
    check('Mensaje para Carlos' in E("dlg().querySelector('h2').textContent"),'✉️ abre el mensaje');E("dlg().close()")
    # abrir 📥 con 0: mensaje simple; luego el token borrado da error
    E("inboxList()");pg.wait_for_timeout(400)
    v=pg.inner_text('#dlg')
    check('No hay compras pendientes' in v and 'shares/' not in v,'buzón vacío sin rutas: '+v)
    E("dlg().close()")
    E("(t)=>{_v165.reg(t,'Carlos','anterior');inboxAt=0}",TGONE)
    E("()=>inboxLoad(true)");pg.wait_for_timeout(900)
    E("inboxList()");pg.wait_for_timeout(500)
    v=pg.inner_text('#dlg')
    check('No se pudo leer un enlace de Carlos (permission-denied)' in v and 'Recuperar acceso' in v,'error del token borrado: '+v)
    check('shares/' not in v,'el error no muestra la ruta: '+v)
    # pegar el enlace que usa Carlos -> aparecen las 3
    E("document.getElementById('v166paste').open=true")
    pg.fill('#v166url','https://finanzas-joe-12ce2b.web.app/v.html?t='+TOLD);pg.click('#v166go');pg.wait_for_timeout(1200)
    v=pg.inner_text('#dlg')
    check(v.count("Sam's Club")>=3 and '📥 Compras por revisar (3)' in v,'enlace pegado con 3: '+v)
    check(v.count('Rechazar')>=3 and 'guardada' not in v and 'oculta' not in v,'solo pendientes con Rechazar')
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v165-ver-todas-phone.png'))
    n0=len([k for k in E("Object.keys(window.__fs.docs)") if '/inbox/' in k])
    pg.click('.v166rej >> nth=0');pg.wait_for_timeout(800)
    left=sorted(k for k in E("Object.keys(window.__fs.docs)") if '/inbox/' in k)
    check(len(left)==n0-1 and len([k for k in left if TOLD in k])==2,'Rechazar borra solo uno: %s'%left)
    dl=[l for l in E("window.__fs.log") if l.startswith('DEL')]
    check(len(dl)==1 and dl[0].startswith('DEL shares/%s/inbox/c'%TOLD),'un DEL: %s'%dl)
    check('📥 Compras por revisar (2)' in pg.inner_text('#dlg'),'la vista se actualiza')
    pg.click('#dlg button:has-text("Revisar") >> nth=0');pg.wait_for_timeout(500)
    check(E("!!(D&&D._inbox&&D._inbox.t==='%s')"%TOLD),'Revisar desde la lista')
    pg.click('#dlg button:has-text("Cancelar")');pg.wait_for_timeout(300)
    check(len([k for k in E("Object.keys(window.__fs.docs)") if TOLD+'/inbox/' in k])==2,'Cancelar no borra nada')
    # Recuperar acceso al enlace borrado
    E("inboxList()");pg.wait_for_timeout(500)
    pg.click('.v166rec');pg.wait_for_timeout(1200)
    check(E("!!window.__fs.docs['shares/%s']&&window.__fs.docs['shares/%s'].owner==='u1'"%(TGONE,TGONE)),'shares/<token> recreado con owner')
    t=pg.inner_text('#dlg')
    check('Publix' in t,'tras recuperar se lee: '+t)
    # una guardada (p.inboxId) ya no sale (está en Movimientos)
    E("()=>{const m=S.months[S.cur];m.purchases.push({id:'px',store:\"Sam's Club\",date:'2026-11-25',total:132.77,paidBy:'Carlos',inboxId:'c1',shares:{Yo:44.26,Tony:44.26,Carlos:44.25}});save()}")
    E("inboxAt=0;inboxLoad(true)");pg.wait_for_timeout(900)
    E("inboxList()");pg.wait_for_timeout(400)
    check('c1' not in E("INBOX.map(x=>x.id).join(',')") and 'guardada' not in pg.inner_text('#dlg'),'aprobada oculta del buzón')
    E("dlg().close()")
    E("()=>{window.confirm=()=>true;return linkRegen('Carlos')}");pg.wait_for_timeout(600)
    check(TC in E("Object.keys(JSON.parse(localStorage.getItem('finanzas-inbox-tokens')||'{}'))"),'token anterior apuntado al cambiar enlace')
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
# WebKit: la entrada de Hoy y el buzón con 3
with app(ROOT,routes=R,init=init,now='2026-11-26T11:20:00',new_look=True,browser='webkit') as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);E("(L)=>{S.links=L;save()}",{'Tony':{'t':TT,'on':True},'Carlos':{'t':TOLD,'on':True}})
    E("()=>inboxLoad(true)");pg.wait_for_timeout(700);E("()=>{tab='ini';render()}");pg.wait_for_timeout(300)
    v=pg.inner_text('#v')
    check('3 compras por revisar' in v and 'Ver todas' not in v,'WebKit Hoy: 📥 (3) sin Ver todas: '+v)
    E("inboxList()");pg.wait_for_timeout(500)
    d=pg.inner_text('#dlg')
    check('📥 Compras por revisar (3)' in d and d.count('Rechazar')>=3,'WebKit buzón con 3')
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
print('test_v165 OK',ok)
