"""v164 (DATOS DE EJEMPLO): Mensaje para Carlos/Tony: «COMPRAS QUE PAGÓ JOE», «PENDIENTE CON JOE»,
y el total entre Carlos y Tony = cuentas + compras (igual que el encabezado y el PDF), sin «debes».
python3 tests/test_v164.py
"""
import os,subprocess
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('#demoW').forEach(x=>x.remove());const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';
      (document.getElementById(host||'')||document.getElementById('dlg')||document.body).append(w)}""",host)
def shot_text(pg,name,frac):
    pg.evaluate("(f)=>{const t=document.getElementById('msgt');t.scrollTop=(t.scrollHeight-t.clientHeight)*f}",frac)
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,name))
BAD=['debes','DEBES','te debe','TE DEBE','Te debo','te transfiero','Te transfiero','A TRANSFERIRTE','Mi parte']
SETUP="""(k)=>{const m=S.months[k];
  m.bills.push({id:'bx1',name:'Luz',amount:150,sheet:{total:150,sp:{Joe:50,Tony:50,Carlos:50}}},{id:'bx2',name:'Internet',amount:60,sheet:{total:60,sp:{Joe:20,Tony:20,Carlos:20}}});
  m.purchases.push({id:'pc1',store:'Costco',date:k+'-12',total:200,mode:'fam',who:['Yo','Tony','Carlos'],shares:{Tony:100,Carlos:50,Yo:50},method:'deb'});
  m.purchases.push({id:'pt1',store:'Publix',date:k+'-14',total:30,paidBy:'Tony',mode:'eq',who:['Yo','Tony','Carlos'],shares:{Yo:10,Tony:10,Carlos:10}});
  m.purchases.push({id:'pt2',store:'Aldi',date:k+'-15',total:12,paidBy:'Arianna',mode:'eq',who:['Tony','Carlos'],shares:{Tony:6,Carlos:6}});
  save();render()}"""
with app(ROOT,state=FIX,now='2026-10-20T10:00:00',new_look=True) as pg:
    E=pg.evaluate;k=E("S.cur");F=lambda v:E("v=>f(v)",v)
    check(E('CODE_V')>='v164','CODE_V')
    E(SETUP,k)
    x=E("k=>{const m=S.months[k],c=calc(m),fl=_v152.carlosFlows(m);return {cd:c.carlosDue,bills:fl.billsTony,pt:fl.purchTony,tot:fl.toTony,joe:c.carlos,td:c.tonyDue}}",k)
    check(x['bills']>0 and x['pt']>0 and abs(x['tot']-x['bills']-x['pt'])<0.006,'ejemplo: %s'%x)
    mes=E("k=>lbl(k)",k)
    # Carlos, Solo texto
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200);tx=pg.input_value('#msgt');L=tx.split('\n')
    check(L[0]=='Hola Carlos, este es tu resumen de %s:'%mes,'saludo: '+L[0])
    check(L[1]=='Carlos le transfiere a Joe '+F(x['cd']) and L[2]=='Carlos le transfiere a Tony '+F(x['tot']),'encabezado: '+tx)
    check('COMPRAS QUE PAGÓ JOE' in L and 'COMPRAS' not in L,'COMPRAS de Joe: '+tx)
    check(('Total compras de Joe  '+F(x['joe'])) in L,'Total compras de Joe: '+tx)
    check(('PENDIENTE CON JOE  '+F(x['cd'])) in L and not [l for l in L if l.startswith('PENDIENTE  ')],'PENDIENTE CON JOE: '+tx)
    check(any(l.startswith('YA LE PAGASTE A JOE  ') for l in L),'YA LE PAGASTE A JOE')
    check(('Total compras de Tony/Arianna  '+F(x['pt'])) in L,'subtotal Tony/Arianna: '+tx)
    i=L.index('TOTAL: CARLOS LE TRANSFIERE A TONY  '+F(x['tot']))
    check(L[i+1]=='(cuentas %s + compras %s)'%(F(x['bills']),F(x['pt'])),'desglose: '+L[i+1])
    check(i>L.index('ENTRE TÚ Y TONY'),'el total con Tony va al final de su sección')
    check(L[-1]=='TOTAL: CARLOS LE TRANSFIERE A JOE  '+F(x['cd']),'último: '+L[-1])
    check(not [w for w in BAD if w in tx],'sin «debes»/primera persona: %s'%[w for w in BAD if w in tx])
    shot_text(pg,'v164-mensaje-carlos-arriba-phone.png',0);shot_text(pg,'v164-mensaje-carlos-tony-phone.png',0.72);shot_text(pg,'v164-mensaje-carlos-final-phone.png',1)
    # Enviar con PDF
    E("k=>shareMsg('carlos',k,'pdf')",k);pg.wait_for_timeout(200);tp=pg.input_value('#msgt')
    check(tp.startswith('Hola Carlos, este es tu resumen') and 'PENDIENTE CON JOE' in tp and ('TOTAL: CARLOS LE TRANSFIERE A TONY  '+F(x['tot'])) in tp and tp.endswith('El detalle está en el PDF.'),'con PDF: '+tp)
    check(not [w for w in BAD if w in tp],'con PDF sin «debes»')
    st=E("k=>msgPdfText('carlos',k)",k).split('\n')
    check(st==['Hola Carlos, te envío tu resumen de %s.'%mes,'Carlos le transfiere a Joe '+F(x['cd']),'Carlos le transfiere a Tony '+F(x['tot']),'El detalle está en el PDF.'],'texto corto PDF: %s'%st)
    with pg.expect_download(timeout=20000) as d:E("k=>pdfDl('carlos',k)",k)
    d.value.save_as('/tmp/v164c.pdf');pdf=subprocess.run(['pdftotext','-layout','/tmp/v164c.pdf','-'],capture_output=True,text=True).stdout
    check('Carlos le transfiere a Tony' in pdf and F(x['tot']) in pdf and 'Parte de Carlos en compras que pagó Joe' in pdf and 'debes' not in pdf,'PDF Carlos')
    subprocess.run(['pdftoppm','-png','-r','70','-f','1','-l','1','-singlefile','/tmp/v164c.pdf',os.path.join(SH,'v164-pdf-carlos')])
    from PIL import Image,ImageDraw,ImageFont
    im=Image.open(os.path.join(SH,'v164-pdf-carlos.png')).convert('RGBA');t=Image.new('RGBA',im.size,(0,0,0,0));dr=ImageDraw.Draw(t)
    try:fn=ImageFont.truetype('DejaVuSans-Bold.ttf',40)
    except Exception:fn=ImageFont.load_default()
    dr.text((im.size[0]//6,im.size[1]//3),'DATOS DE EJEMPLO',fill=(185,28,28,115),font=fn);Image.alpha_composite(im,t.rotate(18)).convert('RGB').save(os.path.join(SH,'v164-pdf-carlos.png'))
    # Tony
    E("k=>shareMsg('tony',k,'txt')",k);pg.wait_for_timeout(200);tt=pg.input_value('#msgt');TL=tt.split('\n')
    check('TU PARTE DE LAS COMPRAS QUE PAGÓ JOE' in TL and any(l.startswith('Total compras de Joe  ') for l in TL),'Tony compras de Joe: '+tt)
    check(('TOTAL: CARLOS LE TRANSFIERE A TONY  '+F(x['tot'])) in TL and ('(cuentas %s + compras %s)'%(F(x['bills']),F(x['pt']))) in TL,'Tony total Carlos→Tony: '+tt)
    check(('Total compras de Tony/Arianna  '+F(x['pt'])) in TL,'Tony subtotal')
    check(TL[1]=='Joe le transfiere a Tony '+F(x['td']) and TL[-1]=='TOTAL: JOE LE TRANSFIERE A TONY  '+F(x['td']),'Tony Joe→Tony')
    check(not [w for w in BAD if w in tt],'Tony sin «debe»: %s'%[w for w in BAD if w in tt])
    shot_text(pg,'v164-mensaje-tony-final-phone.png',1)
    st=E("k=>msgPdfText('tony',k)",k).split('\n')
    check('Carlos le transfiere a Tony '+F(x['tot']) in st and not [w for w in BAD if w in '\n'.join(st)],'Tony texto corto: %s'%st)
    # solo cuentas con Tony (sin compras entre ellos): total con Tony igual
    E("(k)=>{const m=S.months[k];m.purchases=m.purchases.filter(p=>!['Tony','Arianna'].includes(p.paidBy));save();render()}",k)
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200);t2=pg.input_value('#msgt')
    check(('TOTAL: CARLOS LE TRANSFIERE A TONY  '+F(x['bills'])) in t2 and 'ENTRE TÚ Y TONY' not in t2 and '(cuentas' not in t2,'solo cuentas: '+t2)
    # Carlos pagó y Tony tiene parte: subtotal con el nombre de Carlos y total neto
    E("(k)=>{const m=S.months[k];m.purchases.push({id:'pcx',store:'Target',date:k+'-16',total:300,paidBy:'Carlos',mode:'eq',who:['Tony','Carlos'],shares:{Tony:150,Carlos:150}});save();render()}",k)
    y=E("k=>_v152.carlosFlows(S.months[k])",k)
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200);t3=pg.input_value('#msgt')
    if y['toTony']<-0.004:
        check(('TOTAL: TONY LE TRANSFIERE A CARLOS  '+F(-y['toTony'])) in t3 and ('(cuentas %s − compras %s)'%(F(y['billsTony']),F(-y['purchTony']))) in t3,'neto Tony→Carlos: '+t3)
    check(('Total compras de Carlos  '+F(150)) in t3 and ('Tony le transfiere a Carlos '+F(-y['toTony'])) in t3.split('\n')[:4] and not [w for w in BAD if w in t3],'subtotal Carlos: '+t3)
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
with app(ROOT,lang='en',state=FIX,now='2026-10-20T10:00:00',new_look=True) as pg:
    E=pg.evaluate;k=E("S.cur");E(SETUP,k)
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200);te=pg.input_value('#msgt')
    check('PURCHASES JOE PAID' in te and 'PENDING WITH JOE' in te and '(bills ' in te and 'YOU OWE' not in te,'EN: '+te)
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
print('test_v164 OK',ok)
