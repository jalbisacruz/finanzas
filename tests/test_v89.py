"""v89 (made-up data only): Recordatorios en Hoy, Buscar en Operaciones (todos los meses), Respaldo automático (fake Firebase)."""
import json,os,sys
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
HIDE=".toast,#fab{display:none!important}"
# ---------- 1. Recordatorios ----------
with app(ROOT,now='2026-10-17T09:00:00',expand=False,width=390,height=844) as pg:
    E=pg.evaluate
    E("()=>{localStorage.setItem('finanzas-last-export',today());tab='ini';render()}");pg.wait_for_timeout(100)
    pend=E("prevPend().filter(p=>p.c.tonyDue>0.005).map(p=>p.k)")
    E("()=>{prevPend().forEach(p=>{if(p.c.tonyDue>0.005)S.months[p.k].tonyBase=(S.months[p.k].tonyBase||0)})}")
    base=E("remList().map(r=>r.id)")
    # tarjeta que vence en 3 días, otra vencida, buzón con 2, terceros
    E("""()=>{const v=L().cards.find(c=>c.name==='Visa Test'),s=L().cards.find(c=>c.name==='Store Card');S.cardDue['Visa Test']=20;S.cardDue['Store Card']=14;
      INBOX=[{id:'x1',t:'t',link:'Tony',store:'Publix',total:12},{id:'x2',t:'t',link:'Carlos',store:'Aldi',total:8}];
      spend('deb',-152);(S.held=S.held||[]).push({id:'h1',who:'Amigo',amount:152,date:'2026-10-17',method:'deb',via:'Western Union',note:'',at:1,sends:[]});save();render()}""");pg.wait_for_timeout(150)
    ids=E("remList().map(r=>r.id)")
    check(ids[0]=='card:Store Card' and ids.index('card:Visa Test')<ids.index('inbox')<ids.index('held'),'order by urgency %s'%ids)
    check(all(('tony:'+k) in ids for k in pend),'previous months Tony pending %s'%pend)
    check('tony:2026-10' not in ids,'current month Tony not before the 25th')
    rows=pg.locator('#remcard .remrow');check(rows.count()==3,'max 3 visible');check('Ver %d más'%(len(ids)-3) in pg.inner_text('#remcard'),'ver más')
    txt=pg.inner_text('#remcard')
    check('Store Card venció hace 3 días · $45.00' in txt,'overdue line with amount '+txt)
    order=E("[...document.querySelectorAll('#v>.card')].map(c=>c.id)");check(order.index('remcard')>order.index('herocard') and order.index('remcard')<order.index('todoline'),'below Disponible/Mi balance, above Por hacer %s'%order)
    if SH:
        pg.add_style_tag(content=HIDE);E("window.scrollTo(0,document.getElementById('remcard').getBoundingClientRect().top+scrollY-300)");pg.wait_for_timeout(100)
        pg.screenshot(path=os.path.join(ROOT,'shots','v89-recordatorios.png'))
    pg.click('#remmore');pg.wait_for_timeout(100);check(pg.locator('#remcard .remrow').count()==len(ids),'ver más shows all')
    check('📥 2 compras por revisar' in pg.inner_text('#remcard') and '🤝 $152.00 de terceros por enviar' in pg.inner_text('#remcard'),'inbox + terceros')
    # tocar: tarjeta abre PAGAR; buzón abre la lista
    pg.click('#remcard [data-rem="card:Visa Test"] .remgo');pg.wait_for_timeout(150);check(E("dlg().open") and 'Visa Test' in pg.inner_text('dialog'),'tap card → pay dialog');E("dlg().close()")
    pg.click('#remcard [data-rem="inbox"] .remgo');pg.wait_for_timeout(150);check('Compras por revisar (2)' in pg.inner_text('dialog'),'tap inbox → list');E("dlg().close()")
    pg.click('#remcard [data-rem="held"] .remgo');pg.wait_for_timeout(250);check(E("tab")=='mov' and 'col' not in pg.locator('#heldcard').get_attribute('class').split(),'tap terceros → Operaciones section open')
    # ✕ = hasta mañana
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(100)
    pg.click('#remcard [data-rem="inbox"] .remx');pg.wait_for_timeout(100);check(pg.locator('#remcard [data-rem="inbox"]').count()==0,'dismissed')
    E("()=>{render()}");check(pg.locator('#remcard [data-rem="inbox"]').count()==0,'stays dismissed today')
    pg.clock.set_system_time('2026-10-18T08:00:00');E("render()");check(pg.locator('#remcard [data-rem="inbox"]').count()==1,'back tomorrow')
    # Tony del mes actual desde el día 25
    pg.clock.set_system_time('2026-10-25T08:00:00');E("render()");check('tony:2026-10' in E("remList().map(r=>r.id)"),'current-month Tony from the 25th')
    # nada aplica = no hay tarjeta
    E("()=>{localStorage.setItem('finanzas-last-export',today());S.cardDue={};INBOX=[];S.held=[];keys().slice(0,-1).forEach(k=>delete S.months[k]);L().bills=[];save();render()}");pg.wait_for_timeout(100)
    check(pg.locator('#remcard').count()==0,'nothing applies → nothing shown %s'%E("remList().map(r=>r.id)"))
    E("()=>{localStorage.removeItem('finanzas-last-export');render()}");check('Sin respaldo hace más de 7 días' in pg.inner_text('#remcard'),'signed out + no export → backup line')
    E("LANG='en';render()");check('No backup in over 7 days' in pg.inner_text('#remcard'),'EN')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
# ---------- 2. Buscar ----------
with app(ROOT,now='2026-10-17T09:00:00',expand=False,width=390,height=844) as pg:
    E=pg.evaluate
    E("""()=>{const m=L(),ks=keys();const pk=ks[ks.length-2]||ks[0];
      S.months[pk].personal.unshift({id:'gx',date:pk+'-17',amount:48.06,cat:'🛒 Comida/Supermercado',desc:'Panadería La Esquina',method:'deb'});
      m.personal.unshift({id:'gy',date:'2026-10-11',amount:48,cat:'🍽️ Restaurantes',desc:'Café',method:'deb'});
      S.held=[{id:'h1',who:'Amigo',amount:152,date:'2026-10-16',method:'deb',via:'Western Union',note:'para la renta',at:1,sends:[{id:'s1',amount:50,date:'2026-10-17',via:'Zelle',note:'primera parte'}]}];save();tab='mov';render()}""");pg.wait_for_timeout(150)
    pk=E("keys()[keys().length-2]||keys()[0]")
    order=E("[...document.querySelectorAll('#v>.card')].map(c=>c.id)");check(order[0]=='oscard','search at top of Operaciones %s'%order)
    def q(s):
        pg.fill('#osq',s);pg.wait_for_timeout(250);return E("OS_R.map(x=>[x.kind,x.id,x.k,x.d])")
    r=q('PANADERIA esquina');check(len(r)==1 and r[0][1]=='gx' and r[0][2]==pk,'accent/case-insensitive across months %s'%r)
    r=q('48.06');check([x[1] for x in r]==['gx'],'exact amount %s'%r)
    r=q('48');ids=[x[1] for x in r];check('gx' in ids and 'gy' in ids and ids.index('gy')<ids.index('gx'),'integer amount, newest first %s'%r)
    r=q('17 oct');check(r and all(x[3].endswith('-10-17') for x in r) and any(x[0]=='heldsend' for x in r),'date 17 oct %s'%r)
    r2_=q('10/17');check([x[1] for x in r2_]==[x[1] for x in r],'10/17 same as 17 oct')
    r=q('oct 17');check(len(r)==len(r2_),'oct 17')
    r=q('zelle');check([x[0] for x in r]==['heldsend'],'terceros by method %s'%r)
    r=q('renta');check(any(x[0]=='held' for x in r),'terceros by note')
    r=q('publix');check(r and all(x[0]=='compra' for x in r) and len({x[2] for x in r})>=1,'purchases %s'%r)
    r=q('rent house');check(r and all(x[0]=='bill' for x in r) and len({x[2] for x in r})==len(E("keys().filter(k=>S.months[k].bills.some(b=>b.name==='Rent House'))")),'Tony bills in every month %s'%r)
    r=q('pago visa');check(r and r[0][0]=='cardpay','bank movement (card payment)')
    txt=pg.inner_text('#osres');check('Banco' in txt and 'resultado' in txt,'labels and count '+txt[:200])
    check(E("window.__osMs")<50,'fast %.1fms'%E("window.__osMs"))
    # tocar: compra abre editar; ingreso abre editar; terceros abre envío; gasto lleva a Movimientos de ese mes
    r=q('publix');pg.locator('#osres .osr .n').first.click();pg.wait_for_timeout(150);check(E("dlg().open") and E("S.cur")==r[0][2],'purchase → edit');E("dlg().close()")
    r=q('propinas');pg.locator('#osres .osr .n').first.click();pg.wait_for_timeout(150);check(E("dlg().open"),'income → edit');E("dlg().close()")
    E("()=>{tab='mov';render()}");r=q('zelle');pg.locator('#osres .osr .n').first.click();pg.wait_for_timeout(150);check(E("document.getElementById('hsa').value")=='50','terceros send → edit');E("dlg().close()")
    E("()=>{tab='mov';render()}");r=q('panaderia');pg.locator('#osres .osr .n').first.click();pg.wait_for_timeout(250);check(E("S.cur")==pk and 'Panadería' in pg.inner_text('#movcard'),'expense → its month Movimientos')
    E("()=>{S.cur=keys().at(-1);tab='mov';render()}");q('48')
    if SH:
        pg.add_style_tag(content=HIDE);E("window.scrollTo(0,0)");pg.wait_for_timeout(100);pg.screenshot(path=os.path.join(ROOT,'shots','v89-buscar.png'))
    E("LANG='en';OS_IDX=null;tab='mov';render()");q('48');check('results' in pg.inner_text('#osres') and 'Expense' in pg.inner_text('#osres'),'EN')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
# ---------- 3. Respaldo automático (fake Firebase) ----------
with app(ROOT,now='2026-10-17T09:00:00') as pg:MIG=json.loads(pg.evaluate("JSON.stringify(S)"))   # ya en formato v2 (sin copia «antes de v2»)
def fb(now,docs,extra=''):
    init=f"localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',{json.dumps(json.dumps(docs))});"+extra
    return app(ROOT,now=now,state=MIG,init=init,routes={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE})
B='users/u1/backups/'
T0=lambda s:int(__import__('datetime').datetime.fromisoformat(s).timestamp()*1000)
toastjs="window.__toasts=[];new MutationObserver(m=>m.forEach(r=>r.addedNodes.forEach(n=>n.className==='toast'&&__toasts.push(n.textContent)))).observe(document.documentElement,{childList:true,subtree:true})"
old={B+'2026-09-01_08-00-00':{'state':'{}','createdAt':T0('2026-09-01T08:00:00')},B+'2026-09-02_08-00-00_antes-de-restaurar':{'state':'{}','createdAt':T0('2026-09-02T08:00:00')}}
for i in range(10):old[B+'2026-08-%02d_08-00-00_auto'%(i+1)]={'state':'{}','createdAt':T0('2026-08-%02dT08:00:00'%(i+1)),'auto':True}
with fb('2026-10-17T09:00:00',old,"addEventListener('DOMContentLoaded',()=>{"+toastjs+"})") as pg:
    E=pg.evaluate;pg.wait_for_timeout(6500)
    keys_=lambda:E("Object.keys(__fs.docs).filter(k=>k.startsWith('users/u1/backups/')).map(k=>k.split('/').pop()).sort()")
    ks=keys_();new=[k for k in ks if k.startswith('2026-10-17') and k.endswith('_auto')]
    check(len(new)==1,'auto backup on open %s'%ks)
    d=E(f"__fs.docs['{B}{new[0]}']");check(d['auto'] and d['label'].startswith('Automático · ') and json.loads(d['state'])['months'],'same path, labelled, real state')
    check(len([k for k in ks if k.endswith('_auto')])==8,'keeps 8 automatic')
    check('2026-09-01_08-00-00' in ks and '2026-09-02_08-00-00_antes-de-restaurar' in ks,'manual and antes-de-restaurar never pruned')
    check('Respaldo automático guardado ☁️' in E("__toasts"),'toast')
    check(E("fbAutoBackup()")=='fresh' and len(keys_())==len(ks),'weekly: not again the same day')
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(600)
    check(E("document.getElementById('abon').checked") and E("document.getElementById('abfreq').value")=='w','toggle on + weekly by default')
    check('Automático' in pg.inner_text('#bktree') and 'Último automático' in pg.inner_text('#abcfg'),'shown in Año/Mes/Día tree')
    check(E("remList().every(r=>r.id!=='bk')"),'no backup reminder while auto works')
    if SH:
        pg.add_style_tag(content=HIDE);E("goSec('bkcfg')");pg.wait_for_timeout(500);pg.screenshot(path=os.path.join(ROOT,'shots','v89-respaldo.png'))
    # diario: el de hoy basta; mañana se guarda otro
    E("()=>{abSetCfg({freq:'d'})}");check(E("fbAutoBackup()")=='fresh','daily: today already has one')
    pg.clock.set_system_time('2026-10-18T07:00:00');check(E("fbAutoBackup()")=='saved','daily: next day saves')
    # sin conexión: falla en silencio, reintenta; 3 fallos + >7 días → recordatorio
    pg.clock.set_system_time('2026-10-30T07:00:00');pg.context.set_offline(True)
    n=len(keys_());check(E("fbAutoBackup()")=='fail' and len(keys_())==n and not [x for x in E('__toasts') if 'No' in x],'offline: fails quietly')
    E("fbAutoBackup()");E("fbAutoBackup()");E("()=>{tab='ini';render()}");check('No se ha podido hacer el respaldo automático' in pg.inner_text('#remcard'),'keeps failing → reminder')
    pg.context.set_offline(False);check(E("fbAutoBackup()")=='saved' and E("remList().every(r=>r.id!=='bk')"),'retry works, reminder gone')
    # apagado
    E("()=>{abSetCfg({on:false})}");check(E("fbAutoBackup()")=='off','off: nothing saved')
    pg.clock.set_system_time('2026-11-09T07:00:00');E("()=>{tab='ini';render()}");check('El respaldo automático está apagado' in pg.inner_text('#remcard'),'off + >7 days → reminder')
    # el respaldo manual sigue podando 20 manuales sin tocar automáticos
    E("for(let i=0;i<25;i++)__fs.docs['users/u1/backups/2026-01-'+String(i+1).padStart(2,'0')+'_08-00-00']={state:'{}',createdAt:1000+i}")
    a0=len([k for k in keys_() if k.endswith('_auto')]);E("window.fbBackupNow()");pg.wait_for_timeout(500)
    ks=keys_();check(len([k for k in ks if k.endswith('_auto')])==a0 and '2026-09-02_08-00-00_antes-de-restaurar' in ks,'manual pruning leaves automatic/antes-de-restaurar')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v89 OK',ok)
