"""v178 (DATOS DE EJEMPLO): Mi balance neto con Tony = Pendiente de «Reparto de cuentas».
Reproduce con datos falsos la tarjeta real de Joe (Nov 2026): cuentas 2,006.85, ya pagado 1,200.93,
parte de Tony en compras que pagó Joe 294.67 → Pendiente 511.25. Antes: Por cobrar Tony 294.67 y
Cuentas de Tony 805.92. Ahora: Cuentas de Tony 511.25 y sin Por cobrar Tony; balance igual 182.55.
python3 tests/test_v178.py
"""
import os,re,subprocess,copy
from harness import app,FIX,HERE
SRC=open(os.path.join(HERE,'test_v175.py')).read()
exec(SRC[SRC.index('PHONE='):SRC.index('def pdf(')])   # PHONE, state(), SETUP, INFO (los mismos datos falsos de v175)
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
def mark(pg):
    pg.evaluate("""()=>{document.querySelectorAll('.demoW').forEach(x=>x.remove());const H=document.documentElement.scrollHeight;
     for(let y=200;y<H;y+=520){const w=document.createElement('div');w.className='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:absolute;left:0;right:0;top:'+y+'px;text-align:center;font:700 30px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.40);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';document.body.append(w)}}""")
# Nov: débito 727.75, tarjetas 171.14, Carlos ya pagó 157.47 de 294.66 → por cobrar Carlos 137.19
EXTRA="""()=>{const m=S.months['2026-11'];m.income[0].amount=727.75;m.cards=[{id:'c1',name:'Visa',amount:171.14}];
 m.events.push({id:'cr1',type:'carlos',date:'2026-11-12',amount:157.47,desc:'Carlos'});save();tab='ini';BAL_OPEN=true;render();return null}"""
def setup(pg):
    pg.evaluate(SETUP,{'food':True});pg.evaluate(EXTRA);pg.wait_for_timeout(200)
def bal(pg):
    t=pg.inner_text('#balcard');rows={}
    for l in pg.locator('#baldet .row').all_inner_texts():
        p=l.split('\n');p=[x.strip() for x in p if x.strip()]
        if len(p)>=2:rows[p[0]]=p[-1]
    return t,rows
def snap(pg,name):
    pg.evaluate("()=>{const n=document.querySelector('nav');if(n)n.style.position='static';const fb=document.getElementById('fab');if(fb)fb.style.display='none'}")
    pg.locator('#balcard').scroll_into_view_if_needed()
    pg.evaluate("""()=>{const c=document.getElementById('balcard');c.style.position='relative';c.style.overflow='hidden';
     [30,58].forEach(y=>{const w=document.createElement('div');w.className='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:absolute;left:0;right:0;top:'+y+'%;text-align:center;font:700 30px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.38);transform:rotate(-14deg);pointer-events:none;z-index:9';c.append(w)})}""")
    p=os.path.join(SH,name);pg.locator('#balcard').screenshot(path=p)
    pg.evaluate("()=>document.querySelectorAll('.demoW').forEach(x=>x.remove())");return p
SHOTS=[]
# ---------- ANTES (v177: v178 vacío) ----------
with app(ROOT,state=state(),routes={'**/v178.js':'/* antes */'},**PHONE) as pg:
    setup(pg);t,R=bal(pg)
    check(R.get('Por cobrar Tony')=='$294.67' and R.get('Cuentas de Tony')=='$805.92','antes = captura de Joe: %s'%R)
    check('$1,159.61' in t and '$977.06' in t and '$182.55' in t,'antes totales: '+t)
    SHOTS.append(snap(pg,'v178-mi-balance-antes-phone.png'))
# ---------- DESPUÉS ----------
with app(ROOT,state=state(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v178','CODE_V');check('v178.js' in pg.content(),'index carga v178.js')
    setup(pg);I=E(INFO);c=E("calc(S.months['2026-11'])")
    check(abs(I['due']-511.25)<0.005 and abs(c['tonyOwe']-511.25)<0.005 and c['tonyRecv']==0,'neto con Tony = Pendiente 511.25: %s'%{k:c[k] for k in ('tonyOwe','tonyRecv','tonyGross','tonyDue')})
    check(abs(c['tonyGross']-294.67)<0.005,'294.67 = parte de Tony en la compra Costco que pagó Joe')
    check(abs(c['money']-864.94)<0.005 and abs(c['debt']-682.39)<0.005 and abs(c['bal']-182.55)<0.005,'A mi favor 864.94, Debo 682.39, balance 182.55: %s'%[c['money'],c['debt'],c['bal']])
    t,R=bal(pg)
    check('Por cobrar Tony' not in R,'sin «Por cobrar Tony»: %s'%R)
    check(R.get('Cuentas de Tony')=='$511.25','Cuentas de Tony = Pendiente $511.25: %s'%R)
    check(R.get('Débito, efectivo y cheques')=='$727.75' and R.get('Por cobrar Carlos')=='$137.19' and R.get('Tarjetas de crédito')=='$171.14','demás líneas iguales: %s'%R)
    check('$864.94' in t and '$682.39' in t and '$182.55' in t and 'ya resta $294.67' in t,'totales y nota: '+t)
    SHOTS.append(snap(pg,'v178-mi-balance-despues-phone.png'))
    # cerrado (sin detalles): mismas cifras arriba
    E("BAL_OPEN=false;render()");t2=pg.inner_text('#balcard');check('$864.94' in t2 and '$682.39' in t2,'resumen cerrado: '+t2)
    # Reparto de cuentas sigue igual (misma fuente)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200)
    bs=pg.inner_text('#bscard') if pg.locator('#bscard').count() else ''
    check('Pendiente $511.25' in bs.replace('\n',' '),'Reparto: Pendiente 511.25: '+bs[:300])
    # PDF de Joe (Mis finanzas)
    with pg.expect_download(timeout=20000) as d: E("()=>pdfDl('mes','2026-11')")
    d.value.save_as('/tmp/v178.pdf');n=re.sub(r'\s+',' ',subprocess.run(['pdftotext','-layout','/tmp/v178.pdf','-'],capture_output=True,text=True).stdout)
    seg=n[n.find('Mis finanzas'):][:900]
    check('Cuentas de Tony (pendiente) $511.25' in seg and 'Por cobrar Tony' not in seg and 'Ya transferido a Tony' not in seg,'PDF Mis finanzas neto: '+seg)
    check('Total a mi favor $864.94' in seg and 'Total que debo $682.39' in seg and '$182.55' in seg,'PDF totales: '+seg)
    # Otros casos: el balance nunca cambia; cuentas = Pendiente; un cobro real a Tony no se pierde
    CASES=E("""()=>{const B=_v178.base,mk=(bills,tony,xfer,cob)=>{const m={income:[{id:'d',name:'Débito',amount:1000,role:'debit'}],cards:[{id:'k',name:'Visa',amount:50}],personal:[],
        bills:bills.map((a,i)=>({id:'b'+i,name:'B'+i,amount:a})),purchases:tony?[{id:'p',store:'X',date:'2026-12-03',total:tony*2,mode:'manual',who:['Yo','Tony'],shares:{Yo:tony,Tony:tony},method:'deb'}]:[],
        events:[...(xfer?[{id:'t',type:'tony',date:'2026-12-05',amount:xfer}]:[]),...(cob?[{id:'cb',type:'cobro',who:'Tony',date:'2026-12-06',amount:cob}]:[])]};S.months['2026-12']=m;
        const o=B(m),n=calc(m);delete S.months['2026-12'];return {o:{bal:o.bal,due:o.tonyDue},n:{bal:n.bal,owe:n.tonyOwe,recv:n.tonyRecv,money:n.money,debt:n.debt}}};
      return {joeOwes:mk([600,200],150,300,0),tonyOwes:mk([100],300,0,0),overXfer:mk([500],0,600,0),cobro:mk([400],250,0,100),none:mk([],0,0,0)}}""")
    for k,v in CASES.items():
        check(abs(v['o']['bal']-v['n']['bal'])<0.006,'%s: balance igual %s'%(k,v))
        check(abs(v['n']['owe']-v['o']['due'])<0.006,'%s: Cuentas de Tony = Pendiente %s'%(k,v))
        check(not (v['n']['owe']>0 and v['n']['recv']>0),'%s: o debe uno o el otro'%k)
    check(abs(CASES['joeOwes']['n']['owe']-350)<0.006,'800 − 150 − 300 = 350')
    check(abs(CASES['tonyOwes']['n']['recv']-200)<0.006 and CASES['tonyOwes']['n']['owe']==0,'Tony debe 200 (compras > cuentas): sigue como Por cobrar')
    check(abs(CASES['overXfer']['n']['recv']-100)<0.006,'transferido de más 100 → Por cobrar Tony')
    check(abs(CASES['cobro']['n']['owe']-250)<0.006,'cobro de 100 ya hecho: 400 − (250−100) = 250')
    # el caso «Tony debe» se ve en Mi balance
    E("""()=>{const m=S.months['2026-11'];m.purchases[0].shares.Tony=2000;m.purchases[0].total=2589.32;save();tab='ini';BAL_OPEN=true;render()}""");pg.wait_for_timeout(150)
    c2=E("calc(S.months['2026-11'])");t,R=bal(pg)
    check(c2['tonyRecv']>0 and R.get('Por cobrar Tony')=='$'+format(c2['tonyRecv'],',.2f') and R.get('Cuentas de Tony')=='$0.00','Tony debe de verdad → Por cobrar Tony: %s'%R)
    check(not pg.errors,'sin errores JS: %s'%pg.errors)
# v.html sin errores de v178
with app(ROOT,state=state(),**PHONE) as pg:
    pg.goto(pg.url.rstrip('/')+'/v.html');pg.wait_for_timeout(600)
    check(not [e for e in pg.errors if 'v178' in e],'v.html: %s'%pg.errors)
print('test_v178 OK',ok)
for s in SHOTS:print(s)
