"""v84: PDF de Carlos (y todas las listas) con lo más nuevo primero aunque una fecha venga con el año mal (recibo escaneado 2025 dentro de
Oct 2026) u otro formato; escaneo corrige el año; versión del código visible + aviso de actualización (made-up data, como la captura de Joe)"""
import base64,json,os,re,subprocess,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
P=lambda i,s,d,t,**k:{'id':'q'+i,'store':s,'date':d,'total':t,'mode':'fam','who':['Yo','Tony','Carlos'],'method':'deb','shares':{'Yo':round(t/4,2),'Tony':round(t/2,2),'Carlos':round(t-round(t/4,2)-round(t/2,2),2)},**k}
# como en la captura: filas importadas de Excel (luego con fecha 11 oct), Sam's Club 13 oct, otras de la app, y el Aldi escaneado del 17 que quedó con año 2025
BASE=[P('1','Publix','2026-10-15',62.10),P('2','Costco','2026-10-14',120.00),P('3',"Sam's Club",'2026-10-13',88.94),
      P('4',"Sam's Club",'2026-10-11',48.06,note='Importado de Excel'),P('5','Walmart','2026-10-11',5.32,note='Importado de Excel',mode='manual',shares={'Tony':0,'Carlos':5.32}),
      P('6','Aldi','2026-10-11',43.44,note='Importado de Excel'),P('7','Detwilers','2026-10-11',5.20,note='Importado de Excel')]
LEG=P('8','Aldi','2025-10-17',14.72)   # dato ya guardado con el año mal
EXP=['Aldi $14.72','Publix','Costco',"Sam's Club $88.94",'Detwilers','Aldi $43.44','Walmart',"Sam's Club $48.06"]
def blocks(tx):
    out=[]
    for L in tx.splitlines():
        m=re.match(r'\s*(\d{1,2} oct(?: \d{4})?)\s+(.+?)\s{2,}(?:Joe|Tony|Arianna|Carlos)\s+(\$[\d.,]+)',L)  # v95: fila fecha  tienda  pagó  total
        if m:out.append((m.group(1),m.group(2).strip(),m.group(3)))
    return out
def names(bl):
    r=[]
    for d,s,t in bl:r.append(s+' '+t if s in ('Aldi',"Sam's Club") else s)
    return r
def pdftxt(p):return subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout
def chk_pdf(tx,tag,exp=EXP):
    bl=blocks(tx);n=names(bl);check(n==exp,'%s order %s'%(tag,n));return bl
for case in ['legacy','scan']:
  with app(ROOT,now='2026-10-17T15:40:00',expand=False) as pg:
    pg.on('dialog',lambda d:d.accept());E=pg.evaluate
    E("o=>{S.cur='2026-10';S.months['2026-10'].purchases=o;save();render()}",([LEG] if case=='legacy' else [])+BASE)
    if case=='scan':
        # recibo escaneado por el flujo real (scan.js) con el año mal leído
        R={"isReceipt":True,"store":"Aldi","date":"2025-10-17","total":14.72,"uncertain":[],"items":[
           {"name":"Piernas de pollo","amount":5.59,"category":"🛒 Comida/Supermercado","confident":True},{"name":"Piernas de pollo","amount":5.61,"category":"🛒 Comida/Supermercado","confident":True},
           {"name":"Leche entera","amount":3.52,"category":"🛒 Comida/Supermercado","confident":True}]}
        E("r=>{window.fbUser=()=>true;window.fbScan=async()=>r}",json.dumps(R))
        E(f"async()=>{{const b=await (await fetch('{IMG}')).blob();await scanFile(new File([b],'r.png',{{type:'image/png'}}))}}");pg.wait_for_timeout(200)
        check(E("D.date")=='2026-10-17','scan: year fixed to this year %s'%E("D.date"))
        check('fecha' in pg.inner_text('#scanwarn'),'scan: corrected date flagged for review')
        E("()=>{D.list[2].own=['Tony'];saveP()}");pg.wait_for_timeout(100)
        check(E("dlg().open")==False and E("M().purchases.length")==8,'scanned purchase saved')
        check(E("M().purchases[0].date")=='2026-10-17' and len(E("M().purchases[0].list"))==3,'stored with this year')
    # todas las entradas al PDF de Carlos
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(150)
    with pg.expect_download() as d:pg.evaluate("pdfDl('carlos',S.cur)")
    d.value.save_as('/tmp/v84a.pdf');bl=chk_pdf(pdftxt('/tmp/v84a.pdf'),case+' Reportes › PDF de Carlos')
    check(bl[0][0]==('17 oct 2025' if case=='legacy' else '17 oct'),'%s date label %s'%(case,bl[0][0]))
    check(bl[3][0]=='13 oct','Sam\'s Club is 13 oct')
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(150);btn=pg.locator('button:has-text("📤 Carlos")');btn.first.click() if btn.count() else E("shareMsg('carlos','2026-10','pdf')");pg.wait_for_timeout(200)
    with pg.expect_download() as d:pg.click('#msgdl')
    d.value.save_as('/tmp/v84b.pdf');chk_pdf(pdftxt('/tmp/v84b.pdf'),case+' Por hacer › Carlos › Descargar PDF')
    E("()=>{navigator.canShare=()=>true;navigator.share=async o=>{const f=o.files&&o.files[0];window.__sh=f?btoa(String.fromCharCode(...new Uint8Array(await f.arrayBuffer()))):''}}")
    if pg.locator('#msgsh').is_visible():
        if 'PDF' not in pg.inner_text('#msgsh'):pg.click('#mmpdf');pg.wait_for_timeout(100)
        pg.click('#msgsh');pg.wait_for_function("window.__sh!==undefined",timeout=20000)
        b=E("window.__sh");
        if b:open('/tmp/v84c.pdf','wb').write(base64.b64decode(b));chk_pdf(pdftxt('/tmp/v84c.pdf'),case+' Compartir con PDF')
    E("()=>{if(dlg().open)dlg().close()}")
    # makePDF directo (lo que usan todos los botones)
    b=E("async()=>{const f=await makePDF('carlos','2026-10');return btoa(String.fromCharCode(...new Uint8Array(await f.arrayBuffer())))}")
    open('/tmp/v84d.pdf','wb').write(base64.b64decode(b));chk_pdf(pdftxt('/tmp/v84d.pdf'),case+' makePDF')
    # listas de la app y foto del enlace
    hl=[x.split('\n')[0] for x in E("(OPS_ALLP=true,tab='mov',render(),[...document.querySelectorAll('#comcard .hrow')].map(e=>e.innerText))")]
    check(hl[0].startswith('Aldi') and hl[1].startswith('Publix'),'%s Ver todas %s'%(case,hl[:3]))
    mv=E("moves(M()).filter(x=>x.kind==='compra').map(x=>M().purchases.find(p=>p.id===x.id).store)");check(mv[:3]==['Aldi','Publix','Costco'],'%s Movimientos %s'%(case,mv[:3]))
    sp=[p['s'] for p in E("snapFor('Carlos')")['months'][0]['purchases']];check(sp[:4]==['Aldi','Publix','Costco',"Sam's Club"],'%s link snapshot %s'%(case,sp))
    tx=E("msgFor('carlos','2026-10')");check(tx.find('Aldi')<tx.find('Publix')<tx.find('Costco'),'%s text message'%case)
    if SH and case=='legacy':subprocess.run(['pdftoppm','-png','-r','70','-f','1','-l','1','/tmp/v84a.pdf','/tmp/v84sh'],check=True)
    # versión
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(300)
    sw=open(os.path.join(ROOT,'sw.js')).read();v=re.search(r"finanzas-(v\d+)",sw).group(1)
    check(E("CODE_V")==v and pg.inner_text('#appver').startswith('Versión '+v),'version = running code = sw %s'%pg.inner_text('#appver'))
# formatos de fecha
with app(ROOT,now='2026-10-17T15:40:00',expand=False) as pg:
    E=pg.evaluate
    for inp,exp in [('2026-10-17','2026-10-17'),('2026-10-7','2026-10-07'),('2026-10-17T09:30:00Z'[:19],'2026-10-17'),('10/17/2026','2026-10-17'),('10/17/26','2026-10-17'),('2026/10/17','2026-10-17'),
                    ('Oct 17, 2026','2026-10-17'),('October 17 2026','2026-10-17'),('17 oct 2026','2026-10-17'),('17 de octubre de 2026','2026-10-17'),('sáb, 17 de octubre de 2026'.split(', ')[1],'2026-10-17'),
                    ({'seconds':1792258800,'nanoseconds':0},'2026-10-17'),(1792258800000,'2026-10-17'),(1792258800,'2026-10-17'),('','')]:
        got=E("v=>dKey(v)",inp);check(got==exp,'dKey %r -> %r'%(inp,got))
    E("()=>{const m=M();m.purchases=[{id:'a',store:'Aldi',date:{seconds:1792258800},total:5,shares:{Carlos:1}},{id:'b',store:'Publix',date:'10/15/2026',total:5,shares:{Carlos:1}},{id:'c',store:'Costco',date:'Oct 16, 2026',total:5,shares:{Carlos:1}}];save()}")
    check(E("byNew(M().purchases).map(p=>p.store)")==['Aldi','Costco','Publix'],'mixed formats sorted')
    check(E("fdate('10/15/2026')")=='15 oct' and E("fdate('2025-10-17')")=='17 oct 2025','labels')
    # aviso de nueva versión
    E("()=>{CODE_V}");E("()=>{APP_V='v1';NEW_V='v999';tab='cfg';render()}");pg.wait_for_timeout(100)
    check('Actualizar' in pg.inner_text('#appver') and pg.locator('#appupd').count()==1,'update prompt when a newer version is published')
if SH:
    import glob,shutil;shutil.copy(sorted(glob.glob('/tmp/v84sh*.png'))[0],os.path.join(ROOT,'shots','149-pdf-carlos.png'))
print('test_v84 OK',ok)
