"""v174 (DATOS DE EJEMPLO): el PDF de Tony quita la tabla vieja «Cuentas de Tony»
(Cuenta / Monto / Estado) cuando hay página 2 «Reparto de las cuentas de la casa».
Sin hoja aprobada (sin página 2) la tabla vieja se queda. Joe y Carlos sin cambios.
python3 tests/test_v174.py
"""
import os,re,subprocess,shutil,copy
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
PHONE=dict(now='2026-10-20T10:00:00',new_look=True,width=390,height=900)
H={'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}}
def B(i,n,key,total,alloc=H):
    p=alloc['pct'];sp={x:round(total*p.get(x,0)/100,2) for x in ('Joe','Tony','Carlos')};sp['Arianna']=0
    return {'id':i,'name':n,'sheetKey':key,'amount':sp['Joe'],'paid':sp['Joe'],'sheet':{'total':total,'alloc':alloc,'sp':sp}}
def state(sheet=True):
    S=copy.deepcopy(FIX);m=S['months'][S['cur']]
    if sheet:
        m['bills']=[B('b1','Renta de casa','renta',1800),B('b2','Teléfono','telefono',120),B('b3','Internet','internet',80),
                    B('b4','Purificador','purificador',40),B('b5','Gas','gas',60)]
        for i in range(34):m['purchases'].append({'id':'pp%d'%i,'store':'Tienda %d'%i,'date':'2026-10-%02d'%(1+i%28),'total':30,'mode':'eq','who':['Yo','Tony','Carlos'],'shares':{'Yo':10,'Tony':10,'Carlos':10},'method':'deb'})
        m['events']=[e for e in m['events'] if e.get('type')!='tony']+[{'id':'x1','type':'tony','date':'2026-10-15','amount':525,'desc':'Transferencia a Tony'}]
    return S
def pdf(pg,kind,path):
    with pg.expect_download(timeout=20000) as d: pg.evaluate("k=>pdfDl(k,S.cur)",kind)
    d.value.save_as(path);return path
def txt(p,a=None,b=None):
    c=['pdftotext','-layout']+(['-f',str(a),'-l',str(b)] if a else [])+[p,'-']
    return subprocess.run(c,capture_output=True,text=True).stdout
def pages(p):return int(re.search(r'Pages:\s+(\d+)',subprocess.run(['pdfinfo',p],capture_output=True,text=True).stdout).group(1))
def oldtable(t):return bool(re.search(r'Cuenta\s+Monto\s+Estado',t)) or 'Total cuentas' in t or bool(re.search(r'\b(pagada|pendiente)\b',t)) or 'Cuentas de Tony\n' in t or bool(re.search(r'^\s*Cuentas de Tony\s*$',t,re.M))
def shot(p,n,name):
    from PIL import Image,ImageDraw,ImageFont
    out=os.path.join(SH,name);subprocess.check_call(['pdftoppm','-png','-r','120','-f',str(n),'-l',str(n),'-singlefile',p,out]);png=out+'.png'
    im=Image.open(png).convert('RGBA');t=Image.new('RGBA',im.size,(0,0,0,0));dr=ImageDraw.Draw(t)
    try: fn=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',36)
    except Exception: fn=ImageFont.load_default()
    dr.text((im.size[0]//6,im.size[1]//3),'DATOS DE EJEMPLO',fill=(185,28,28,115),font=fn)
    Image.alpha_composite(im,t.rotate(18)).convert('RGB').save(png);return png

# 1) con hoja aprobada: sin tabla vieja; página 2 sigue
with app(ROOT,state=state(True),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v174','CODE_V');check('v174.js' in pg.content(),'index carga v174.js')
    t=pdf(pg,'tony','/tmp/v174t.pdf');n=pages(t);all_=txt(t)
    check(not oldtable(all_),'Tony sin tabla vieja: '+all_[:300])
    p1=txt(t,1,1);p2=txt(t,2,2)
    check('TRANSFIERE' in p1.upper() and 'Cómo se calcula' in p1,'página 1 intacta')
    check('Reparto de las cuentas de la casa' in p2,'página 2 reparto')
    for s in ('Renta de casa','Teléfono','Internet','Purificador','Gas','Totales'):check(s in p2,'p2 '+s)
    check('Pendiente' in p2 or 'Todo al día' in p2,'p2 pendiente/al día')
    check('Compras del mes' in all_ and 'Detalle de compras compartidas' in all_,'compras y detalle siguen')
    check(all_.find('Reparto de las')<all_.find('Compras del mes')<all_.find('Detalle de compras compartidas'),'orden')
    R=E("r3Data(S.cur,'Tony')");check(R.get('showBills') is True,'r3Data no se toca (enlace/app)')
    snap=E("(()=>{const d=snapFor('Tony');return (d.months||[])[0].r3})()")
    check(snap and snap.get('tonySplit') and len(snap['tonySplit']['rows'])==5,'el enlace de Tony recibe tonySplit (su PDF también quita la tabla)')
    c=pdf(pg,'carlos','/tmp/v174c.pdf');ct=txt(c)
    check('De dónde sale tu total' in txt(c,1,1) and 'Reparto de las cuentas de la casa' not in ct,'Carlos igual')
    j=pdf(pg,'mes','/tmp/v174j.pdf');jt=txt(j)
    check('Total cuentas' in jt,'Joe conserva su tabla de cuentas')
    # mismo PDF que en v.html: rep3PDF con el r3 del enlace
    vt=E("""(()=>{const R=snapFor('Tony').months[0].r3;const d=rep3PDF(R);let s='';for(let i=1;i<=d.getNumberOfPages();i++)s+=i;return d.getNumberOfPages()})()""")
    check(vt>=2,'rep3PDF con r3 del enlace funciona')
    shutil.copy(t,os.path.join(SH,'v174-tony.pdf'))
    for i in range(1,n+1):check(not oldtable(txt(t,i,i)),'página %d sin restos de la tabla vieja'%i)
    ALL=[shot(t,i,'v174-tony-pdf-p%d'%i) for i in range(1,n+1)];print('Tony pages',n)

# 2) sin hoja aprobada: no hay página 2, se queda la tabla vieja
with app(ROOT,state=state(False),**PHONE) as pg:
    t=pdf(pg,'tony','/tmp/v174t0.pdf');all_=txt(t)
    check('Reparto de las cuentas de la casa' not in all_,'sin hoja no hay página 2')
    check(oldtable(all_),'sin hoja se queda Cuentas de Tony')
    shutil.copy(t,os.path.join(SH,'v174-tony-sin-hoja.pdf'))
    P0=shot(t,2,'v174-tony-sin-hoja-p2')
print('test_v174 OK',ok)
for p in ALL+[P0]:print(p)
