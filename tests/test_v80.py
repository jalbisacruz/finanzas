"""v80 (plan fases 5-6): Editar ingreso, Reembolso (Carlos/Tony), Reembolsos en Reportes, respaldos Año › Mes › Día, nombres con fecha y hora,
carpeta de respaldos (Chrome/Edge), PDF con hora (made-up data): python tests/test_v80.py [--shots]"""
import json,os,sys,re
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
def shot(pg,n,loc=None):
    if not SH:return
    pg.evaluate("()=>document.querySelectorAll('.toast').forEach(t=>t.remove())")
    p=os.path.join(ROOT,'shots','145-%s.png'%n);(pg.locator(loc).screenshot(path=p) if loc else pg.screenshot(path=p))
FAKEFS="""window.__fs=[];(()=>{const dir=(path,name)=>({kind:'directory',name,queryPermission:async()=>'granted',requestPermission:async()=>'granted',
 getDirectoryHandle:async n=>dir(path+n+'/',n),getFileHandle:async n=>({createWritable:async()=>({write:async t=>window.__fs.push([path+n,t]),close:async()=>{}})})});
 window.showDirectoryPicker=async()=>dir('','Finanzas respaldos')})();"""
bal=lambda E:E("(()=>{const m=L();return {deb:debE(m).amount,inc:m.income.map(x=>[x.name,x.amount]),cards:m.cards.map(x=>x.amount)}})()")
for lang in ['es','en']:
  ES=lang=='es'
  with app(ROOT,lang=lang,width=390,height=844,expand=False,init=FAKEFS) as pg:
    E=pg.evaluate;T=lambda s,*a:E("([s,a])=>T(s,...a)",[s,list(a)])
    def acc(d):
        try:d.accept()
        except Exception:pass
    pg.on('dialog',acc)
    pre=json.dumps(E("S.months"),sort_keys=True)
    # ---- Fase 5: Editar ingreso ----
    E("()=>{tab='mov';OPS_ALLM=true;render()}");pg.wait_for_timeout(60)
    row=pg.locator('#movcard .row .n[onclick="incEdit(\'v5\')"]');check(row.count()==1,'income row is tappable')
    check(pg.locator('#movcard .n[onclick^="incEdit"]').count()==E("moves(M()).filter(x=>x.kind==='income').length"),'every income in Movimientos opens Editar ingreso')
    b0=bal(E);row.click();pg.wait_for_timeout(60);check(E("dlg().open") and T('Editar ingreso') in pg.inner_text('#dlg h2'),'opens Editar ingreso')
    for i in ['ea','ecats','ed_','ef_','em','esave','edel']:check(pg.locator('#dlg #'+i).count()==1,'field '+i)
    if ES: shot(pg,'editar-ingreso','#dlg')
    # concepto + nota: saldos iguales
    pg.click('#ecats .chip[data-c="🎁 Regalo"]');pg.fill('#ed_','');pg.click('#esave');pg.wait_for_timeout(60)
    e=E("findMonth('events','v5').events.find(x=>x.id==='v5')");check(e['concept']=='🎁 Regalo' and e['desc']=='Regalo' and e.get('conId') and e['amount']==30,e)
    check(bal(E)==b0,'concept/note change keeps balances')
    # monto: el débito cambia solo por la diferencia
    E("incEdit('v5')");pg.fill('#ea','45');pg.click('#esave');pg.wait_for_timeout(60)
    check(abs(bal(E)['deb']-(b0['deb']+15))<0.001 and E("findMonth('events','v5').events.find(x=>x.id==='v5').amount")==45,'amount change reapplies the difference')
    # cuenta: sale del débito, entra a Efectivo
    E("incEdit('v5')");pg.select_option('#em','money:Efectivo');pg.click('#esave');pg.wait_for_timeout(60);b=bal(E)
    check(abs(b['deb']-(b0['deb']-30))<0.001 and abs(dict(b['inc'])['Efectivo']-(dict(b0['inc'])['Efectivo']+45))<0.001,'account change moves the money %s'%b)
    # igual que borrar y volver a registrar
    E("()=>{window._s1=JSON.stringify(S)}")
    E("incEdit('v5')");pg.fill('#ea','12.5');pg.select_option('#em','deb');pg.click('#esave');pg.wait_for_timeout(60);bE=bal(E)
    E("()=>{const s=JSON.parse(window._s1);S=s;const m=findMonth('events','v5'),e=m.events.find(x=>x.id==='v5');spend(e.method,e.amount);m.events=m.events.filter(x=>x!==e);spend('deb',-12.5);m.events.push({...e,amount:12.5,method:'deb'})}")
    check(bal(E)==bE,'edit == delete + re-add %s %s'%(bal(E),bE))
    # fecha a otro mes: el ingreso se mueve, saldos iguales
    b1=bal(E);E("incEdit('v5')");pg.fill('#ef_','2026-09-20');pg.click('#esave');pg.wait_for_timeout(60)
    check(E("S.months['2026-09'].events.some(x=>x.id==='v5')") and not E("S.months['2026-10'].events.some(x=>x.id==='v5')") and bal(E)==b1,'date change moves month, balances same')
    # no deja el débito negativo
    E("()=>{const m=findMonth('events','v5'),e=m.events.find(x=>x.id==='v5');e.amount=99999}");b2=bal(E)
    E("incEdit('v5')");pg.select_option('#em','money:Efectivo');pg.click('#esave');pg.wait_for_timeout(60)
    check(bal(E)==b2 and E("findMonth('events','v5').events.find(x=>x.id==='v5').method")=='deb','blocked when debit would go negative')
    E("dlg().close()")
    # ---- Reembolso (Carlos/Tony) ----
    nm='↩️ Reembolso (Carlos/Tony)' if ES else '↩️ Reimbursement (Carlos/Tony)'
    check(E("DN('↩️ Reembolso')")==nm,'new visible name')
    E("incDlg()");pg.wait_for_timeout(40);check(nm in pg.inner_text('#icats'),'name in Ingreso chips')
    pg.fill('#ia','7');pg.click('#icats .chip[data-c="↩️ Reembolso"]');pg.click('#isave');pg.wait_for_timeout(60)
    ev=E("L().events.at(-1)");check(ev['concept']=='↩️ Reembolso','stored concept unchanged (no migration)')
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(60);rc=pg.inner_text('#reemcard')
    check(T('Reembolsos') in rc and nm in rc and T('Cobrado a Carlos') in rc and E("f(27)") in rc,'Reembolsos card '+rc)
    check(E("[...document.querySelectorAll('#v>.card')].map(c=>c.id).indexOf('reemcard')")==E("[...document.querySelectorAll('#v>.card')].map(c=>c.id).indexOf('inccard')")+1,'after Ingresos por concepto')
    if ES: shot(pg,'reembolsos','#reemcard')
    E("()=>{tab='cfg';render()}");check(nm in E("document.getElementById('v').textContent"),'new name in Configuración › Conceptos')
    # ---- Cargar recibo ----
    E("()=>{tab='mov';render()}");check(T('📷 Cargar recibo') in pg.inner_text('#comcard'),'Compras receipt button says Cargar recibo')
    # ---- PDFs con hora ----
    for k,rx in [('mes',r'^%s-%s-2026-Joe-13oct-10-0\d(am|pm)\.pdf$'%(('Resumen','Octubre') if ES else ('Summary','October'))),('tony',r'^Tony-%s-2026-13oct-10-0\d(am|pm)\.pdf$'%('Octubre' if ES else 'October')),('carlos',r'^Carlos-%s-2026-13oct-10-0\d(am|pm)\.pdf$'%('Octubre' if ES else 'October'))]:
        n=E(f"async()=>(await makePDF('{k}','2026-10')).name");check(re.match(rx,n),n)
    # ---- Respaldos ----
    with pg.expect_download() as d: E("exp()")
    check(re.match(r'^finanzas-2026-10-13-10\d\d\.json$',d.value.suggested_filename),d.value.suggested_filename)
    E("()=>{window.fbUser=()=>true;window._rs=[];window.fbRestore=async id=>window._rs.push(id);window.fbBackups=async()=>[{id:'2026-10-13_09-30-00',createdAt:5},{id:'2026-10-13_08-00-00',createdAt:4},{id:'2026-10-02_21-05-00',createdAt:3},{id:'2026-09-28_10-00-00',createdAt:2},{id:'2025-12-31_23-00-00',createdAt:1},{id:'2025-12-30',createdAt:0}];tab='cfg';render()}")
    pg.wait_for_timeout(300);E("()=>document.getElementById('bkcfg').classList.remove('col')")
    tr=E("""(()=>{const o=[];document.querySelectorAll('#bktree details').forEach(d=>o.push([d.className,d.open,d.querySelector(':scope>summary').textContent.trim()]));return o})()""")
    ys=[x for x in tr if x[0]=='bky'];ms=[x for x in tr if x[0]=='bkm'];ds=[x for x in tr if x[0]=='bkd']
    check([y[2][:7] for y in ys]==['📁 2026 ','📁 2025 '] and ys[0][1] and not ys[1][1],'years newest first, only latest open %s'%ys)
    check(len(ms)==3 and ms[0][1] and not ms[1][1] and not ms[2][1] and (('Octubre' if ES else 'October') in ms[0][2]),'months %s'%ms)
    check(len(ds)==5 and ds[0][1] and not any(x[1] for x in ds[1:]) and '13' in ds[0][2],'days %s'%ds)
    check(pg.locator('#bktree .bkd').first.locator('.row').count()==2,'two backups that day')
    t=E("[...document.querySelectorAll('#bktree .bkd')][0].querySelectorAll('.row .n')[0].textContent");check('9:30' in t,'newest time first '+t)
    if ES: shot(pg,'respaldos','#bkcfg')
    # copia antes de restaurar, mismo nombre
    with pg.expect_download() as d: E("restoreBk('2026-10-02_21-05-00')")
    pg.wait_for_timeout(100);check(re.match(r'^finanzas-2026-10-13-10\d\d\.json$',d.value.suggested_filename) and E("window._rs")==['2026-10-02_21-05-00'],'pre-restore copy named like exports')
    # carpeta (Chrome/Edge): Año / Mes / Día
    check(pg.locator('#bkfolder').count()==1 and pg.locator('#bkpick').count()==1,'folder option shown where supported')
    E("bkPick()");pg.wait_for_timeout(300);E("()=>document.getElementById('bkcfg').classList.remove('col')")
    fs=E("window.__fs.map(x=>x[0])");mon='10-Octubre' if ES else '10-October'
    check(len(fs)==1 and re.match(r'^2026/%s/13/finanzas-2026-10-13-10\d\d\.json$'%mon,fs[0]),fs)
    check(json.loads(E("window.__fs[0][1]"))['months'].keys()==json.loads(E("JSON.stringify(S)"))['months'].keys(),'folder file is a full backup')
    E("exp()");pg.wait_for_timeout(200);check(E("window.__fs.length")==2,'export goes to the folder')
    E("()=>window.fbBackupNow=async()=>{}");pg.wait_for_timeout(50)
    check('Finanzas respaldos' in pg.inner_text('#bkfolder') and pg.locator('#bkunpick').count()==1,'chosen folder shown')
    if ES: shot(pg,'carpeta','#bkfolder')
    E("bkUnpick()");pg.wait_for_timeout(100)
    errs=[x for x in pg.errors if 'DIALOG' not in x];check(not errs,errs)
# sin File System Access (iPhone): la opción no aparece
with app(ROOT,init="delete window.showDirectoryPicker;",expand=False) as pg:
    E=pg.evaluate;E("()=>{tab='cfg';render()}");check(pg.locator('#bkfolder').count()==0 and E("FS_OK")==False,'folder option hidden where unsupported')
with app(ROOT,init="Object.defineProperty(navigator,'userAgent',{get:()=>'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'});window.showDirectoryPicker=async()=>{};",expand=False) as pg:
    E=pg.evaluate;E("()=>{tab='cfg';render()}");check(pg.locator('#bkfolder').count()==0,'hidden on iPhone')
print('test_v80 OK',ok)
