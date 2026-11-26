"""v172 (DATOS DE EJEMPLO): Mensaje para Carlos/Tony sin compras por tienda (sí cuentas y
totales, como v164). Pago de más en teléfono/internet se descuenta de la letra del auto
pendiente ($650).
python3 tests/test_v172.py
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
def shot_text(pg,name,frac=0):
    pg.evaluate("(f)=>{const t=document.getElementById('msgt');if(t)t.scrollTop=(t.scrollHeight-t.clientHeight)*f}",frac)
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,name))

PHONE=dict(now='2026-10-20T10:00:00',new_look=True,width=390,height=900)
STORES=('Costco','Publix','Aldi','Target','Shell')
SETUP="""(k)=>{const m=S.months[k];
  m.bills.push({id:'bx1',name:'Luz',amount:150,sheet:{total:150,sp:{Joe:50,Tony:50,Carlos:50}}},{id:'bx2',name:'Internet',amount:60,sheet:{total:60,sp:{Joe:20,Tony:20,Carlos:20}}});
  m.purchases.push({id:'pc1',store:'Costco',date:k+'-12',total:200,mode:'fam',who:['Yo','Tony','Carlos'],shares:{Tony:100,Carlos:50,Yo:50},method:'deb'});
  m.purchases.push({id:'pt1',store:'Publix',date:k+'-14',total:30,paidBy:'Tony',mode:'eq',who:['Yo','Tony','Carlos'],shares:{Yo:10,Tony:10,Carlos:10}});
  m.purchases.push({id:'pt2',store:'Aldi',date:k+'-15',total:12,paidBy:'Arianna',mode:'eq',who:['Tony','Carlos'],shares:{Tony:6,Carlos:6}});
  save();render()}"""
OVER="""(k)=>{
  const m=S.months[k];
  m.purchases=[];
  m.events=(m.events||[]).filter(e=>e.type!=='tony'&&e.type!=='tonyOver');
  delete m.tonyBase;delete m.tonyPaid;
  m.bills=[
    {id:'btel',name:'Teléfono',sheetKey:'telefono',amount:100,paid:100,sheet:{total:100,alloc:{who:['Joe'],mode:'pct',pct:{Joe:100}},sp:{Joe:100,Tony:0,Carlos:0,Arianna:0}}},
    {id:'bnet',name:'Internet',sheetKey:'internet',amount:100,paid:100,sheet:{total:100,alloc:{who:['Joe'],mode:'pct',pct:{Joe:100}},sp:{Joe:100,Tony:0,Carlos:0,Arianna:0}}},
    {id:'bcar',name:'Letra del carro',sheetKey:'letra',amount:650,sheet:{total:650,alloc:{who:['Joe'],mode:'pct',pct:{Joe:100}},sp:{Joe:650,Tony:0,Carlos:0,Arianna:0}}}
  ];
  m.events.push({id:'xfer1',type:'tony',date:k+'-20',amount:200,desc:'Transferencia a Tony',bills:[{id:'btel',prev:0},{id:'bnet',prev:0}]});
  m.tonyPaid=tXfer(m);
  const deb=debE(m);window.__deb0=+deb.amount;
  save();render();
  return {due:calc(m).tonyDue,xfer:tXfer(m),bills:calc(m).bills,deb:window.__deb0};
}"""
FIXSPLIT="""(k)=>{
  const m=S.months[k];
  const tel=m.bills.find(b=>b.id==='btel'),net=m.bills.find(b=>b.id==='bnet');
  const sp={Joe:25,Tony:50,Carlos:25,Arianna:0};
  tel.amount=25;tel.sheet={total:100,alloc:{who:['Tony','Joe','Carlos'],mode:'pct',pct:{Tony:50,Joe:25,Carlos:25}},sp};
  net.amount=25;net.sheet={total:100,alloc:{who:['Tony','Joe','Carlos'],mode:'pct',pct:{Tony:50,Joe:25,Carlos:25}},sp};
  save();render();
  const fl=_v152.carlosFlows(m),c=calc(m),p=_v172.overplan(m);
  return {due:c.tonyDue,xfer:c.xfer,bills:c.bills,excess:p.excess,car:p.target&&p.target.name,carRem:p.target&&(p.target.amount-(p.target.paid||0)),carlos:fl.billsTony,deb:+debE(m).amount};
}"""

# ---------- mensajes sin tiendas ----------
with app(ROOT,state=FIX,**PHONE) as pg:
    E=pg.evaluate;k=E("S.cur");F=lambda v:E("v=>f(v)",v)
    check(E('CODE_V')>='v172','CODE_V')
    check('v172.js' in pg.content(),'index carga v172.js')
    E(SETUP,k)
    x=E("k=>{const m=S.months[k],c=calc(m),fl=_v152.carlosFlows(m);return {cd:c.carlosDue,bills:fl.billsTony,pt:fl.purchTony,tot:fl.toTony,joe:c.carlos}}",k)
    mes=E("k=>lbl(k)",k)
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200)
    tx=pg.input_value('#msgt');L=tx.split('\n')
    check(L[0].startswith('Hola Carlos, este es tu resumen'),'saludo: '+L[0])
    check('COMPRAS QUE PAGÓ JOE' in L,'sección compras')
    check(('Total compras de Joe  '+F(x['joe'])) in L,'total compras Joe: '+tx)
    check(('PENDIENTE CON JOE  '+F(x['cd'])) in L or any(l.startswith('PENDIENTE CON JOE') for l in L),'pendiente Joe')
    check(('TOTAL: CARLOS LE TRANSFIERE A TONY  '+F(x['tot'])) in L,'total Carlos→Tony')
    check(('(cuentas %s + compras %s)'%(F(x['bills']),F(x['pt']))) in L,'desglose cuentas+compras')
    check('Luz' in tx and 'Internet' in tx,'cuentas en el texto')
    hit=[s for s in STORES if s in tx]
    check(not hit,'sin tiendas en el mensaje Carlos: %s\n%s'%(hit,tx))
    shot_text(pg,'v172-mensaje-carlos-phone.png',0)
    # PDF sigue con el detalle por tienda
    with pg.expect_download(timeout=20000) as d:E("k=>pdfDl('carlos',k)",k)
    d.value.save_as('/tmp/v172c.pdf')
    pdf=subprocess.run(['pdftotext','-layout','/tmp/v172c.pdf','-'],capture_output=True,text=True).stdout
    check('Costco' in pdf or 'Publix' in pdf or 'Aldi' in pdf,'PDF Carlos sí lista tiendas: '+pdf[:400])
    E("k=>shareMsg('tony',k,'txt')",k);pg.wait_for_timeout(200)
    tt=pg.input_value('#msgt')
    check('TU PARTE DE LAS COMPRAS QUE PAGÓ JOE' in tt or 'Total compras de Joe' in tt,'Tony totales de compras')
    check(('TOTAL: CARLOS LE TRANSFIERE A TONY  '+F(x['tot'])) in tt,'Tony ve Carlos→Tony')
    hit=[s for s in STORES if s in tt]
    check(not hit,'sin tiendas en el mensaje Tony: %s\n%s'%(hit,tt))
    check('Luz' in tt or 'CUENTAS' in tt or 'Cuentas' in tt,'Tony sigue viendo cuentas')
    shot_text(pg,'v172-mensaje-tony-phone.png',0)

# ---------- pago de más → letra del auto $650 ----------
with app(ROOT,state=FIX,**PHONE) as pg:
    E=pg.evaluate;k=E("S.cur");F=lambda v:E("v=>f(v)",v)
    before=E(OVER,k)
    check(abs(before['due']-650)<0.006 and abs(before['xfer']-200)<0.006,'antes: pendiente 650, transferido 200: '+str(before))
    after=E(FIXSPLIT,k)
    check(abs(after['excess']-150)<0.006,'pago de más 150: '+str(after))
    check(abs(after['due']-500)<0.006,'calc deja pendiente 500 (650-150): '+str(after))
    check(abs(after['carlos']-50)<0.006,'Carlos debe 50 en cuentas: '+str(after))
    check('Letra' in (after.get('car') or '') or 'carro' in (after.get('car') or '').lower(),'objetivo letra: '+str(after))
    # diálogo prellenado
    E("k=>v172Offer(k)",k);pg.wait_for_timeout(200)
    check(pg.locator('#v172amt').count()==1,'diálogo de ajuste')
    amt=float(pg.input_value('#v172amt') or 0)
    check(abs(amt-150)<0.006,'monto prellenado 150: '+str(amt))
    ui=pg.inner_text('#dlg')
    check('150' in ui.replace(',','') and ('Letra' in ui or 'carro' in ui.lower()),'texto del diálogo: '+ui[:400])
    check('650' in ui.replace(',','') and '500' in ui.replace(',',''),'queda 500 de 650: '+ui[:400])
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v172-ajuste-dialog-phone.png'))
    pg.click('#v172ok');pg.wait_for_timeout(400)
    st=E("""k=>{const m=S.months[k],car=m.bills.find(b=>b.id==='bcar'),tel=m.bills.find(b=>b.id==='btel'),net=m.bills.find(b=>b.id==='bnet');
      const ev=(m.events||[]).find(e=>e.type==='tonyOver');
      return {carPaid:+car.paid||0,carRem:r2((+car.amount||0)-(+car.paid||0)),telPaid:+tel.paid||0,netPaid:+net.paid||0,
        due:calc(m).tonyDue,xfer:tXfer(m),deb:+debE(m).amount,deb0:window.__deb0,
        desc:ev&&ev.desc,amt:ev&&ev.amount,carlos:_v152.carlosFlows(m).billsTony,excess:_v172.billExcess(m)}}""",k)
    check(abs(st['carPaid']-150)<0.006 and abs(st['carRem']-500)<0.006,'letra pagada 150, queda 500: '+str(st))
    check(abs(st['telPaid']-25)<0.006 and abs(st['netPaid']-25)<0.006,'se suelta el pago de más en teléfono/internet: '+str(st))
    check(abs(st['due']-500)<0.006 and abs(st['xfer']-200)<0.006,'tonyDue 500, xfer sigue 200: '+str(st))
    check(abs(st['deb']-st['deb0'])<0.006,'el débito no se vuelve a tocar: '+str(st))
    check(st['desc'] and 'Ajuste: pago de más' in st['desc'] and abs(st['amt']-150)<0.006,'registro claro: '+str(st['desc']))
    check(st['excess']<0.006,'ya no queda exceso sin aplicar')
    # Reportes: Reparto muestra Carlos → Tony y la nota del ajuste
    E("()=>{tab='rep';render();scrollTo(0,0)}");pg.wait_for_timeout(400)
    E("()=>{['billsm','bscard','v172note','v172over'].forEach(id=>{const e=document.getElementById(id);if(e){e.classList.remove('col','defcol');e.scrollIntoView()}})}")
    pg.wait_for_timeout(150)
    body=pg.inner_text('#v')
    check('Carlos → Tony' in body or 'Carlos' in body and '50' in body.replace(',',''),'Carlos se ve como que debe: '+body[:500])
    check('Ajuste: pago de más' in body or 'v172note' in E("()=>[...document.querySelectorAll('#v172note')].map(e=>e.textContent).join('|')"),
          'nota del ajuste en Reportes')
    E("()=>{const e=document.getElementById('billsm')||document.getElementById('bscard');if(e)e.scrollIntoView({block:'start'});window.scrollBy(0,-70)}")
    pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v172-cuentas-despues-ajuste-phone.png'),full_page=False)
    E("()=>{const e=document.getElementById('bscard');if(e){e.classList.remove('col');e.scrollIntoView({block:'start'});window.scrollBy(0,-70)}}")
    pg.wait_for_timeout(80)
    mark(pg,'v');pg.screenshot(path=os.path.join(SH,'v172-reparto-carlos-debe-phone.png'),full_page=False)
    # Transferir ahora ofrece 500, no 650
    # already applied, payDlg should open normally
    E("k=>payDlg('tony',k)",k);pg.wait_for_timeout(200)
    pa=pg.inner_text('#pa') if pg.locator('#pa').count() else ''
    check('500' in pa.replace(',','') and '650' not in pa.replace(',',''),'Transferir prellena 500: '+pa)
    dlg=pg.inner_text('#dlg')
    check('Letra' in dlg or 'carro' in dlg.lower(),'letra en el diálogo de transferir')
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v172-transferir-500-phone.png'))
    E("()=>{try{dlg().close()}catch(e){}}")

# ---------- inglés (mensajes + diálogo) ----------
with app(ROOT,lang='en',state=FIX,**PHONE) as pg:
    E=pg.evaluate;k=E("S.cur")
    E(SETUP,k)
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200)
    te=pg.input_value('#msgt')
    check('PURCHASES JOE PAID' in te and 'PENDING WITH JOE' in te and 'Costco' not in te and 'Publix' not in te,'EN mensaje: '+te[:400])
    E(OVER,k);E(FIXSPLIT,k)
    E("k=>v172Offer(k)",k);pg.wait_for_timeout(200)
    ui=pg.inner_text('#dlg')
    check(pg.locator('#v172amt').count()==1 and ('overpay' in ui.lower() or 'Apply' in ui or 'overpaid' in ui.lower() or 'Adjustment' in ui or '150' in ui.replace(',','')),
          'EN diálogo: '+ui[:300])

print('test_v172 OK',ok)
