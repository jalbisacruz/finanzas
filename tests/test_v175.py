"""v175 (DATOS DE EJEMPLO): página 2 del PDF de Tony: la columna Joe de la tabla y el
bloque «Lo que Joe te transfiere» usan la misma fuente y cuadran con Pendiente y Transferir.
Reproduce las cifras del PDF real de Joe (Nov 2026) con datos falsos: tabla Joe $1,958.93,
bloque $2,006.85 (dif $47.92). Caso A: la diferencia es Comida (parte de Joe de compras que
pagó Tony). Caso B: Teléfono con monto cambiado a mano ($225.55 vs hoja $177.63).
python3 tests/test_v175.py
"""
import os,re,subprocess,copy
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
PHONE=dict(now='2026-11-26T16:00:00',new_look=True,width=390,height=900)
def state():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':5000,'role':'debit'}],'cards':[],'personal':[],'events':[],'bills':[],'purchases':[]}
    return S
SETUP="""(o)=>{const k='2026-11',m=S.months[k];
 const H={who:['Tony','Joe','Carlos'],mode:'pct',pct:{Tony:50,Joe:25,Carlos:25}},J={who:['Joe'],mode:'pct',pct:{Joe:100}};
 const V={who:['Tony','Joe','Carlos'],mode:'pct',pct:{Tony:25,Joe:50,Carlos:25}};
 const TEL={who:['Tony','Joe','Carlos'],mode:'amt',amt:{Tony:351.93,Joe:177.63,Carlos:216.83}};
 const L=[['bseg','Car Insurance','seguro',130,J],['bcar','Car Letter','letra',650,J],['bren','Rent House','renta',2826.80,H],['btel','Phone','telefono',746.39,TEL],
  ['bnet','Internet','internet',85,H],['bpur','Purifier','purificador',100,H],['bgas','Gas','gas',40,H],['bagu','Water','agua',112.49,H],['bele','Electricity','luz',265.33,H],
  ['bven','Ventanas de impacto y puerta','ventanas',287.80,V]];
 m.bills=L.map(([id,name,key,total,al])=>{const sp=BS.split(total,al);return {id,name,sheetKey:key,amount:sp.Joe,paid:sp.Joe,sheet:{total,alloc:al,sp}}});
 const car=m.bills.find(b=>b.id==='bcar');car.paid=138.75;
 m.purchases=[{id:'pj',store:'Costco',date:k+'-05',total:883.99,mode:'manual',who:['Yo','Tony','Carlos'],shares:{Yo:294.66,Tony:294.67,Carlos:294.66},method:'deb'}];
 if(o.food)m.purchases.push({id:'pt',store:'Publix',date:k+'-09',total:143.76,paidBy:'Tony',mode:'manual',who:['Yo','Tony','Carlos'],shares:{Yo:47.92,Tony:47.92,Carlos:47.92},method:''});
 m.events=[{id:'x1',type:'tony',date:k+'-10',amount:1200.93,desc:'Transferencia a Tony'},
   {id:'ov1',type:'tonyOver',date:k+'-20',amount:138.75,desc:'Ajuste: pago de más en cuentas de Nov 2026',billId:'bcar',bills:[]}];
 m.tonyPaid=tXfer(m);
 if(o.drift){const t=m.bills.find(b=>b.id==='btel');t.amount=225.55;t.paid=225.55}
 S.months[k]=m;
 if(o.raw){return null}
 save();render();return null}"""
INFO="""()=>{const m=S.months['2026-11'],c=calc(m),R=r3Data('2026-11','Tony'),Sp=R.tonySplit;
 return {bills:c.bills,tony:c.tony,xfer:c.xfer,due:c.tonyDue,Sp,tel:m.bills.find(b=>b.id==='btel').amount,fix:m.v175fix||[],food:(m.bills.find(b=>+b.tfood)||{}).tfood||0}}"""
def pdf(pg,path):
    with pg.expect_download(timeout=20000) as d: pg.evaluate("()=>pdfDl('tony','2026-11')")
    d.value.save_as(path);return path
def txt(p,a=None,b=None):
    return subprocess.run(['pdftotext','-layout']+(['-f',str(a),'-l',str(b)] if a else [])+[p,'-'],capture_output=True,text=True).stdout
def shot(p,n,name):
    from PIL import Image,ImageDraw,ImageFont
    out=os.path.join(SH,name);subprocess.check_call(['pdftoppm','-png','-r','120','-f',str(n),'-l',str(n),'-singlefile',p,out]);png=out+'.png'
    im=Image.open(png).convert('RGBA');t=Image.new('RGBA',im.size,(0,0,0,0));dr=ImageDraw.Draw(t)
    try: fn=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',36)
    except Exception: fn=ImageFont.load_default()
    dr.text((im.size[0]//6,im.size[1]//3),'DATOS DE EJEMPLO',fill=(185,28,28,115),font=fn)
    Image.alpha_composite(im,t.rotate(18)).convert('RGB').save(png);return png
def transferir(pg):
    pg.evaluate("()=>payDlg('tony','2026-11')");pg.wait_for_timeout(250)
    if pg.locator('#v172amt').count():  # oferta de pago de más; cancelar no abre Transferir
        pg.evaluate("()=>dlg().close()");return None
    v=pg.inner_text('#pa');pg.evaluate("()=>dlg().close()");return float(v.replace('$','').replace(',',''))
SHOTS=[]
# ---------- Caso A: Comida (compras que pagó Tony) ----------
with app(ROOT,state=state(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v175','CODE_V');check('v175.js' in pg.content(),'index carga v175.js')
    E(SETUP,{'food':True})
    I=E(INFO);Sp=I['Sp']
    check(abs(Sp['sums']['Joe']-1958.93)<0.005 and abs(Sp['sums']['Tony']-2138.70)<0.005 and abs(Sp['sums']['Carlos']-1146.18)<0.005 and abs(Sp['sums']['total']-5243.81)<0.005,'tabla = PDF real: '+str(Sp['sums']))
    check(abs(I['bills']-2006.85)<0.005 and abs(I['food']-47.92)<0.005,'calc.bills 2006.85 = tabla + Comida 47.92: '+str((I['bills'],I['food'])))
    check(abs(I['tony']-294.67)<0.005 and abs(I['xfer']-1200.93)<0.005 and abs(I['due']-511.25)<0.005,'pendiente 511.25: '+str(I))
    ex=Sp['extras'];check(len(ex)==1 and ex[0]['kind']=='food' and abs(ex[0]['a']-47.92)<0.005,'línea aparte Comida: '+str(ex))
    check(abs(Sp['joeTable']+sum(x['a'] for x in ex)-I['bills'])<0.005,'tabla + extras = total de Joe')
    tr=transferir(pg);check(tr is not None and abs(tr-511.25)<0.005,'Transferir = Pendiente: '+str(tr))
    p=pdf(pg,'/tmp/v175a.pdf');p2=txt(p,2,2);n=re.sub(r'\s+',' ',p2)
    for s in ('Parte de Joe en las cuentas (tabla) $1,958.93','+ Parte de Joe en compras que pagaron Tony/Arianna $47.92','Total de Joe para Tony $2,006.85','- $294.67','- $1,200.93','$138.75','Pendiente $511.25','$1,958.93'):
        check(s in n,'A p2 tiene «%s»: %s'%(s,n[-700:]))
    check('Comida' not in n.split('Lo que Joe')[0] and 'Food' not in n.split('Lo que Joe')[0],'Comida no entra a la tabla de cuentas')
    import shutil;shutil.copy(p,os.path.join(SH,'v175-tony-comida.pdf'))
    SHOTS+= [shot(p,1,'v175-tony-comida-p1'),shot(p,2,'v175-tony-comida-p2')]

# ---------- Caso B: Teléfono cambiado a mano ($225.55 vs hoja $177.63) ----------
with app(ROOT,state=state(),**PHONE) as pg:
    E=pg.evaluate
    E(SETUP,{'drift':True,'raw':True})
    c0=E("calc(S.months['2026-11'])");check(abs(c0['bills']-2006.85)<0.005 and abs(c0['tonyDue']-511.25)<0.005,'antes de v175: mismo 2006.85 / 511.25: '+str((c0['bills'],c0['tonyDue'])))
    E("()=>{save();render()}")
    I=E(INFO);Sp=I['Sp']
    check(abs(I['tel']-177.63)<0.005,'Teléfono vuelve a la parte de la hoja: '+str(I['tel']))
    check(I['fix'] and abs(I['fix'][0]['from']-225.55)<0.005 and abs(I['fix'][0]['to']-177.63)<0.005,'corrección anotada: '+str(I['fix']))
    check(abs(I['bills']-1958.93)<0.005 and abs(Sp['joeTable']-I['bills'])<0.005 and not Sp['extras'],'bloque = tabla 1958.93')
    check(abs(I['due']-463.33)<0.005,'pendiente corregido 463.33: '+str(I['due']))
    check(abs((Sp.get('excess') or 0)-47.92)<0.005,'el pago de más 47.92 de Teléfono se ve: '+str(Sp.get('excess')))
    p=pdf(pg,'/tmp/v175b.pdf');n=re.sub(r'\s+',' ',txt(p,2,2))
    for s in ('Parte de Joe en las cuentas (tabla) $1,958.93','Pendiente $463.33','Teléfono: se usó la parte de la hoja aprobada $177.63 (antes $225.55)','pago de más de $47.92'):
        check(s in n,'B p2 tiene «%s»: %s'%(s,n[-700:]))
    check('Total de Joe para Tony' not in n,'sin extras no hay subtotal')
    shutil.copy(p,os.path.join(SH,'v175-tony-telefono.pdf'))
    SHOTS+=[shot(p,2,'v175-tony-telefono-p2')]
    # Carlos sin cambios
    with pg.expect_download(timeout=20000) as d: E("()=>pdfDl('carlos','2026-11')")
    d.value.save_as('/tmp/v175c.pdf');ct=txt('/tmp/v175c.pdf')
    check('De dónde sale tu total' in ct and 'Lo que Joe te transfiere' not in ct,'Carlos igual')
print('test_v175 OK',ok)
for s in SHOTS:print(s)
