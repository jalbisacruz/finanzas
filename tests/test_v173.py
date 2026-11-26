"""v173 (DATOS DE EJEMPLO): el PDF de Tony incluye una 2.ª página, antes del
detalle de compras compartidas, con el reparto de las cuentas de la casa
(total y parte Tony / Joe / Carlos en % y $), totales por persona, y lo que
Joe transfirió / queda pendiente, incluido el ajuste de pago de más.
python3 tests/test_v173.py
"""
import os,re,subprocess,shutil
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

PHONE=dict(now='2026-10-20T10:00:00',new_look=True,width=390,height=900)

OVER="""(k)=>{
  const m=S.months[k];
  m.purchases=[{id:'pc1',store:'Costco',date:k+'-12',total:90,mode:'eq',who:['Yo','Tony','Carlos'],shares:{Tony:30,Carlos:30,Yo:30},method:'deb'}];
  m.events=(m.events||[]).filter(e=>e.type!=='tony'&&e.type!=='tonyOver');
  delete m.tonyBase;delete m.tonyPaid;
  m.bills=[
    {id:'btel',name:'Teléfono',sheetKey:'telefono',amount:100,paid:100,sheet:{total:100,alloc:{who:['Joe'],mode:'pct',pct:{Joe:100}},sp:{Joe:100,Tony:0,Carlos:0,Arianna:0}}},
    {id:'bnet',name:'Internet',sheetKey:'internet',amount:100,paid:100,sheet:{total:100,alloc:{who:['Joe'],mode:'pct',pct:{Joe:100}},sp:{Joe:100,Tony:0,Carlos:0,Arianna:0}}},
    {id:'bcar',name:'Letra del carro',sheetKey:'letra',amount:650,sheet:{total:650,alloc:{who:['Joe'],mode:'pct',pct:{Joe:100}},sp:{Joe:650,Tony:0,Carlos:0,Arianna:0}}}
  ];
  m.events.push({id:'xfer1',type:'tony',date:k+'-20',amount:200,desc:'Transferencia a Tony',bills:[{id:'btel',prev:0},{id:'bnet',prev:0}]});
  m.tonyPaid=tXfer(m);
  save();render();
  return {due:calc(m).tonyDue,xfer:tXfer(m)};
}"""
FIXSPLIT="""(k)=>{
  const m=S.months[k];
  const tel=m.bills.find(b=>b.id==='btel'),net=m.bills.find(b=>b.id==='bnet');
  const sp={Joe:25,Tony:50,Carlos:25,Arianna:0};
  tel.amount=25;tel.sheet={total:100,alloc:{who:['Tony','Joe','Carlos'],mode:'pct',pct:{Tony:50,Joe:25,Carlos:25}},sp};
  net.amount=25;net.sheet={total:100,alloc:{who:['Tony','Joe','Carlos'],mode:'pct',pct:{Tony:50,Joe:25,Carlos:25}},sp};
  save();render();
  const c=calc(m),p=_v172.overplan(m),sp2=_v173.buildTonySplit(k);
  return {due:c.tonyDue,xfer:c.xfer,bills:c.bills,excess:p.excess,carlos:sp2&&sp2.sums.Carlos,tony:sp2&&sp2.sums.Tony,joe:sp2&&sp2.sums.Joe};
}"""

def norm(s):
    return re.sub(r'\s+',' ',s or '').replace(',','').replace('\u2212','-').replace('\u2013','-').replace('\u2014','-')

def money_in(s,val):
    t=norm(s)
    a=f'{val:.2f}'
    return a in t or a.replace('.00','') in t

def save_pdf(pg,kind,path,k=None):
    E=pg.evaluate
    with pg.expect_download(timeout=20000) as d:
        if k: E("(p)=>pdfDl(p[0],p[1])",[kind,k])
        else: E("kind=>pdfDl(kind,S.cur)",kind)
    d.value.save_as(path)
    return os.path.getsize(path)

def pdf_text(path,first=None,last=None):
    cmd=['pdftotext','-layout']
    if first is not None: cmd += ['-f',str(first)]
    if last is not None: cmd += ['-l',str(last)]
    cmd += [path,'-']
    return subprocess.run(cmd,capture_output=True,text=True).stdout

def watermark(png):
    from PIL import Image,ImageDraw,ImageFont
    im=Image.open(png).convert('RGBA')
    t=Image.new('RGBA',im.size,(0,0,0,0));dr=ImageDraw.Draw(t)
    try: fn=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',36)
    except Exception: fn=ImageFont.load_default()
    dr.text((im.size[0]//6,im.size[1]//3),'DATOS DE EJEMPLO',fill=(185,28,28,115),font=fn)
    Image.alpha_composite(im,t.rotate(18,expand=0,fillcolor=(0,0,0,0))).convert('RGB').save(png)

def pages_of(path):
    info=subprocess.run(['pdfinfo',path],capture_output=True,text=True).stdout
    m=re.search(r'Pages:\s+(\d+)',info)
    return int(m.group(1)) if m else 0

with app(ROOT,state=FIX,**PHONE) as pg:
    E=pg.evaluate;k=E("S.cur")
    check(E('CODE_V')>='v173','CODE_V v173')
    check('v173.js' in pg.content(),'index carga v173.js')
    check(E("typeof _v173==='object'&&typeof _v173.buildTonySplit==='function'"),'_v173 helpers')

    # Sin hoja aprobada, el PDF de Tony no inventa la página de reparto
    R0=E("r3Data(S.cur,'Tony')")
    check(not (R0.get('tonySplit') and (R0.get('tonySplit') or {}).get('rows')),'sin hoja no hay tonySplit: '+str(R0.get('tonySplit')))

    E(OVER,k)
    r=E(FIXSPLIT,k)
    check(abs(r['excess']-150)<0.005,'pago de más 150: '+str(r))
    check(abs(r['tony']-100)<0.005 and abs(r['joe']-700)<0.005 and abs(r['carlos']-50)<0.005,'totales persona '+str(r))

    # Aún no se aplicó el ajuste: r3Data debe exponer excess y no adjs
    SP=E("k=>r3Data(k,'Tony').tonySplit",k)
    check(SP and len(SP['rows'])==3,'3 cuentas en tonySplit')
    names=' '.join(x['n'] for x in SP['rows'])
    check('Tel' in names or 'Phone' in names,'teléfono en filas: '+names)
    check('Internet' in names,'internet en filas: '+names)
    check('Letra' in names or 'Car' in names,'letra en filas: '+names)
    tel=next(x for x in SP['rows'] if 'Tel' in x['n'] or 'Phone' in x['n'])
    check(abs(tel['total']-100)<0.005 and abs(tel['sp']['Tony']-50)<0.005 and abs(tel['sp']['Joe']-25)<0.005 and abs(tel['sp']['Carlos']-25)<0.005,tel)
    check(abs(tel['pct']['Tony']-50)<0.05 and abs(tel['pct']['Joe']-25)<0.05 and abs(tel['pct']['Carlos']-25)<0.05,'pct tel '+str(tel['pct']))
    car=next(x for x in SP['rows'] if 'Letra' in x['n'] or 'Car' in x['n'] or 'carro' in x['n'].lower())
    check(abs(car['total']-650)<0.005 and abs(car['sp']['Joe']-650)<0.005 and abs(car['pct']['Joe']-100)<0.05,car)
    check(abs(SP['xfer']-200)<0.005 and abs(SP['due']-470)<0.005 and abs(SP['tonyPurch']-30)<0.005,'xfer/due pre-ajuste '+str((SP['xfer'],SP['due'],SP.get('tonyPurch'))))
    check(abs((SP.get('excess') or 0)-150)<0.005,'excess 150 visible')
    check(not SP.get('adjs'),'sin eventos de ajuste todavía')

    # Carlos no lleva tonySplit; sí sigue su desglose en la 1.ª página
    RC=E("r3Data(S.cur,'Carlos')")
    check(not RC.get('tonySplit'),'Carlos sin tonySplit')
    check((RC.get('breakDown') or {}).get('sections'),'Carlos conserva breakDown')

    # Aplicar el ajuste a la letra
    ap=E("(k)=>v172Apply(k,'bcar',150)",k)
    check(ap.get('ok') and abs(ap.get('use')-150)<0.005,ap)
    SP2=E("k=>r3Data(k,'Tony').tonySplit",k)
    check(SP2.get('adjs') and abs(SP2['adjs'][0]['amount']-150)<0.005,'ajuste en datos: '+str(SP2.get('adjs')))
    check('Ajuste' in (SP2['adjs'][0].get('desc') or '') or 'Adjustment' in (SP2['adjs'][0].get('desc') or ''),SP2['adjs'][0])
    check(abs(SP2['due']-470)<0.005 and abs(SP2.get('excess') or 0)<0.005,'pending 470, excess 0')

    tpdf=os.path.join(SH,'v173-tony.pdf')
    cpdf=os.path.join(SH,'v173-carlos.pdf')
    check(save_pdf(pg,'tony',tpdf,k)>1000,'PDF Tony')
    check(save_pdf(pg,'carlos',cpdf,k)>1000,'PDF Carlos')
    n=pages_of(tpdf)
    check(n>=3,'Tony tiene >=3 páginas (resumen, reparto, compras/detalle): '+str(n))

    all_t=pdf_text(tpdf)
    p1=pdf_text(tpdf,1,1)
    p2=pdf_text(tpdf,2,2)
    rest=pdf_text(tpdf,3,n)

    check('Reparto de las cuentas de la casa' in p2 or 'Household bill split' in p2,'título en página 2: '+p2[:400])
    check('Reparto de las cuentas de la casa' not in p1 and 'Household bill split' not in p1,'el reparto no va en la 1.ª página')
    check('TRANSFIERE' in p1.upper() or 'TRANSFERS' in p1.upper(),'página 1 sigue siendo el resumen: '+p1[:200])
    check('Detalle de compras compartidas' in rest or 'Shared purchase detail' in rest,'detalle de compras después del reparto')
    check('Compras del mes' in rest or 'Purchases this month' in rest,'Compras del mes después del reparto')
    check('Reparto de las cuentas de la casa' not in rest and 'Household bill split' not in rest,'el reparto no se cuela en páginas posteriores')

    # Orden en el texto completo: reparto antes de compras y del detalle
    iR=all_t.find('Reparto de las cuentas de la casa')
    if iR<0: iR=all_t.find('Household bill split')
    iC=all_t.find('Compras del mes')
    if iC<0: iC=all_t.find('Purchases this month')
    iD=all_t.find('Detalle de compras compartidas')
    if iD<0: iD=all_t.find('Shared purchase detail')
    check(iR>=0 and iC>iR and iD>iC,'orden páginas: reparto < compras < detalle (%s %s %s)'%(iR,iC,iD))

    n2=norm(p2)
    for s in ('Teléfono','Internet','Letra del carro','50%','25%','100%','Totales','Ya transferido','Pendiente','ajuste: pago de más'):
        check(s in p2 or s.replace('é','e') in n2 or s in n2,'página 2 tiene '+s+': '+p2[:500])
    check(money_in(p2,100) and money_in(p2,50) and money_in(p2,25),'montos tel/internet')
    check(money_in(p2,650) and money_in(p2,700),'letra 650 y total Joe 700')
    check(money_in(p2,200) and money_in(p2,150) and money_in(p2,470) and money_in(p2,30),'xfer 200, ajuste 150, compras Tony 30, pendiente 470')
    check('Costco' not in p2,'la página de cuentas no lista compras')

    all_c=pdf_text(cpdf)
    c1=pdf_text(cpdf,1,1)
    check('De dónde sale tu total' in c1 or 'Where your total comes from' in c1,'Carlos: desglose sigue en la 1.ª página')
    check('Reparto de las cuentas de la casa' not in all_c and 'Household bill split' not in all_c,'Carlos no tiene la página nueva de Tony')

    # Render de la nueva página, marca de agua
    if shutil.which('pdftoppm'):
        out=os.path.join(SH,'v173-tony-pdf-p2')
        subprocess.check_call(['pdftoppm','-png','-r','120','-f','2','-l','2','-singlefile',tpdf,out])
        png=out+'.png'
        check(os.path.exists(png) and os.path.getsize(png)>1000,'png página 2')
        watermark(png)
        # también la 1.ª y el detalle, por contexto, misma marca
        out1=os.path.join(SH,'v173-tony-pdf-p1')
        subprocess.check_call(['pdftoppm','-png','-r','120','-f','1','-l','1','-singlefile',tpdf,out1])
        watermark(out1+'.png')
        outd=os.path.join(SH,'v173-tony-pdf-detalle')
        subprocess.check_call(['pdftoppm','-png','-r','120','-f',str(n),'-l',str(n),'-singlefile',tpdf,outd])
        watermark(outd+'.png')

print('test_v173 OK',ok)
print('shots:',os.path.join(SH,'v173-tony-pdf-p2.png'))
