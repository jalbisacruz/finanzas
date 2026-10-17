"""v83: compras compartidas, lo más nuevo primero en TODAS las listas y PDF (empates del mismo día: lo último agregado primero),
con compras viejas sin 'at', importadas de Excel sin fecha, fechas raras, escaneadas y aceptadas del buzón (made-up data)"""
import json,os,re,subprocess,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
# estado como en los datos reales: lo agregado en la app (unshift, sin 'at') al principio; lo importado de Excel (sin fecha, más viejo primero) al final
P=lambda i,s,d,t,**k:{'id':'p'+i,'store':s,'date':d,'total':t,'mode':'manual','who':['Yo','Tony','Carlos'],'method':'deb','shares':{'Yo':t/4,'Tony':t/2,'Carlos':t/4},**k}
OLD=[P('1','Publix','2026-10-14',40),P('2','Costco','2026-10-14',80),P('3','Target','2026-10-7',20),P('4','Amazon','2026-10-12T15:30:00',24),P('5','Aldi','2026-10-14',16),
     P('6',"Sam's Club",'',60,note='Importado de Excel'),P('7','Walmart','',12,note='Importado de Excel'),P('8','Detwilers','',8,note='Importado de Excel')]
NEW=[('Kroger','2026-10-14',28,''),('Trader Joes','2026-10-14',36,'scan'),('Lidl','2026-10-14',32,'inbox'),('BJs Wholesale','2026-10-16',44,'')]
EXP=['BJs Wholesale','Lidl','Trader Joes','Kroger','Publix','Costco','Aldi','Amazon','Target','Detwilers','Walmart',"Sam's Club"]
def order(txt,names):
    pos={n:txt.find(n) for n in names};miss=[n for n in names if pos[n]<0];check(not miss,'missing %s'%miss);return sorted(names,key=lambda n:pos[n])
def pdftxt(p):return subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout
def grab(pg,fn,path):
    with pg.expect_download(timeout=20000) as d: pg.evaluate(fn)
    d.value.save_as(path);return pdftxt(path)
with app(ROOT,now='2026-10-16T21:00:00',expand=False,routes=R) as pg:
    pg.on('dialog',lambda d:d.accept());E=pg.evaluate
    E("o=>{S.cur='2026-10';S.months['2026-10'].purchases=o;save();window.fbInboxDel=async()=>{};render()}",OLD)
    for s,d,t,how in NEW:
        sh=json.dumps({'Yo':t/4,'Tony':t/2,'Carlos':t/4})
        if how=='inbox':
            E("o=>{INBOX=[{id:'ib1',t:'tok',link:'Carlos',store:o.s,date:o.d,total:o.t,by:'Carlos',items:[]}];inboxOpen('ib1')}",{'s':s,'d':d,'t':t})
            E(f"()=>{{D.mode='manual';D.shares={sh};saveP()}}")
        else:
            E(f"()=>{{editP();D.store={json.dumps(s)};D.date='{d}';D.total={t};D.mode='manual';D.who=['Yo','Tony','Carlos'];D.shares={sh};{'D._scan={u:[],bad:[],isum:0,none:true};' if how=='scan' else ''}saveP()}}")
        pg.wait_for_timeout(60)
    check(E("dlg().open")==False,'dialogs closed')
    arr=E("S.months['2026-10'].purchases.map(p=>p.store)");check(len(arr)==12,arr)
    check(E("S.months['2026-10'].purchases.filter(p=>+p.at>0).length")==4,'new purchases get a creation time')
    check(E("S.months['2026-10'].purchases.find(p=>p.store==='Lidl').paidBy")=='Carlos','inbox-accepted kept buyer')
    dd=E("S.months['2026-10'].purchases.filter(p=>/^p\\d$/.test(p.id)).map(p=>p.date)");check(dd==[p['date'] for p in OLD],'stored dates untouched (no migration) %s'%dd)
    # Operaciones › Compras: vista previa (3) y Ver todas
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(150)
    pv=[x.split('\n')[0] for x in pg.locator('#comcard .hrow').all_inner_texts()];check(order('\n'.join(pv),EXP[:3])==EXP[:3] and len(pv)==3,'preview last 3 %s'%pv)
    pg.click('#comall');pg.wait_for_timeout(150)
    al='\n'.join(pg.locator('#comcard .hrow').all_inner_texts());check(order(al,EXP)==EXP,'Ver todas %s'%order(al,EXP))
    check('7 oct' in al and '12 oct' in al and 'Invalid' not in al,'odd dates shown as dates')
    # Movimientos
    mv=E("moves(S.months['2026-10']).filter(x=>x.kind==='compra').map(x=>x.id)");ids=E("S.months['2026-10'].purchases.reduce((o,p)=>(o[p.id]=p.store,o),{})")
    check([ids[i] for i in mv]==EXP,'Movimientos %s'%[ids[i] for i in mv])
    # historial (todos los meses)
    hl=E("(hRange='all',hList().filter(o=>o.k==='2026-10').map(o=>o.p.store))");E("hRange='cur'");check(hl==EXP,'historial %s'%hl)
    # PDFs de Joe: Carlos (lo que vio Joe), Tony, resumen del mes
    for kind in ['carlos','tony','mes']:
        tx=grab(pg,f"()=>pdfDl('{kind}','2026-10')",f'/tmp/v83{kind}.pdf');tx=tx.split('Compras compartidas')[-1] if kind!='tony' else tx.split('Tu parte de las compras')[1]
        check(order(tx,EXP)==EXP,'%s PDF %s'%(kind,order(tx,EXP)))
        check('7 oct · Target' in tx and '12 oct · Amazon' in tx,'%s PDF dates'%kind)
    # mensajes de texto (Carlos/Tony): sin la que pagó Carlos
    E2=[x for x in EXP if x!='Lidl']
    for w in ['carlos','tony']:
        for fn in ['msgFor','msgText']:
            if E(f"typeof {fn}")!='function':continue
            tx=E(f"{fn}('{w}','2026-10')");check(order(tx,E2)==E2,'%s %s %s'%(fn,w,order(tx,E2)))
    # foto para el enlace de Carlos
    doc=E("snapFor('Carlos')");sp=[p['s'] for p in doc['months'][0]['purchases']];check(sp==EXP,'link snapshot %s'%sp)
    check([p['d'] for p in doc['months'][0]['purchases']][7:9]==['2026-10-12','2026-10-07'],'snapshot dates normalized')
    doc['updatedAt']='2026-10-16T21:00:00'
# página del enlace y su PDF
def vpage(d,tag):
    with app(ROOT,routes=R,init="window.__SHARE_DOC=%s;"%json.dumps(d),width=390,height=844) as pg:
        base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA');pg.wait_for_timeout(500)
        pg.click('#vdet');pg.wait_for_timeout(200)
        tx=pg.inner_text('main');check(order(tx,EXP)==EXP,'%s link page %s'%(tag,order(tx,EXP)))
        if SH and tag=='new':pg.screenshot(path=os.path.join(ROOT,'shots','148-enlace-carlos.png'),full_page=True)
        with pg.expect_download(timeout=20000) as dl: pg.click('#vdl')
        dl.value.save_as('/tmp/v83v.pdf');pt=pdftxt('/tmp/v83v.pdf');check(order(pt,EXP)==EXP,'%s link PDF %s'%(tag,order(pt,EXP)))
        if SH and tag=='new':subprocess.run(['pdftoppm','-png','-r','70','-f','1','-l','1','/tmp/v83v.pdf','/tmp/v83vp'],check=True)
vpage(doc,'new')
# foto vieja (antes de v79): fecha ascendente, empates en orden de la app, sin fecha al principio
old=json.loads(json.dumps(doc));mo=old['months'][0];del mo['nf']
dated=[p for p in mo['purchases'] if p['d']];und=[p for p in mo['purchases'] if not p['d']][::-1]
mo['purchases']=und+sorted(dated,key=lambda p:p['d'])  # Python sort is stable, same as the old JS
vpage(old,'old')
# Joe's PDF screenshot
if SH:
    subprocess.run(['pdftoppm','-png','-r','70','-f','1','-l','1','/tmp/v83carlos.pdf','/tmp/v83cp'],check=True)
    import shutil,glob
    shutil.copy(sorted(glob.glob('/tmp/v83cp*.png'))[0],os.path.join(ROOT,'shots','148-pdf-carlos-joe.png'))
    shutil.copy(sorted(glob.glob('/tmp/v83vp*.png'))[0],os.path.join(ROOT,'shots','148-pdf-carlos-enlace.png'))
print('test_v83 OK',ok)
