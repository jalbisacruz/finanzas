"""v140 (DATOS DE EJEMPLO): hoja de cuentas de Tony → buzón → Joe aprueba. python tests/test_v140.py"""
import os,copy,json
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');FAKE=open(os.path.join(HERE,'fakefb.js')).read()
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
S=copy.deepcopy(FIX);S['cur']='2026-11'
# Comida NO va en la hoja (Tony ya no pasa factura; lo llevan los recibos). El abono de comida de mitad de mes
# se conserva y se resta del pendiente. Phone.paid=10 es un abono excepcional: debe conservarse.
S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[],'personal':[],'purchases':[],
 'events':[{'id':'t1','type':'tony','date':'2026-11-03','amount':80,'desc':'Abono de comida','bills':[{'id':'b6','prev':0}]}],'tonyBase':0,
 'bills':[{'id':'b1','name':'Rent House','amount':800,'fixed':True},{'id':'b2','name':'Phone','amount':60,'fixed':True,'paid':10},
          {'id':'b3','name':'Electricity','amount':95.4,'fixed':False},{'id':'b4','name':'Gas','amount':40,'fixed':False},
          {'id':'b5','name':'Car Insurance','amount':150,'fixed':True},{'id':'b6','name':'Food','amount':100,'fixed':False,'paid':80}]}
with app(ROOT,now='2026-11-10T16:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700);check(E('CODE_V')=='v140','ver')
    # ---- reparto puro ----
    sp=E("BS.split(1000,BS.def('renta'))");check(sp=={'Joe':250,'Tony':500,'Carlos':250,'Arianna':0},sp)
    sp=E("BS.split(100.01,BS.def('agua'))");check(abs(sum(sp.values())-100.01)<1e-9 and sp['Tony']==50.01,sp)       # centavo al mayor resto
    sp=E("BS.split(10,{who:['Joe','Tony','Carlos'],mode:'eq'})");check(abs(sum(sp.values())-10)<1e-9 and sorted(sp.values())==[0,3.33,3.33,3.34],sp)
    check(E("BS.split(150,BS.def('seguro')).Joe")==150 and E("BS.split(150,BS.def('seguro')).Carlos")==0,'seguro 100% Joe, Carlos 0')
    check(E("BS.split(90,{who:['Tony','Arianna'],mode:'amt',amt:{Tony:50,Arianna:30}}).err")=='suma','amt must sum')
    check(E("BS.split(90,{who:['Tony','Arianna'],mode:'pct',pct:{Tony:50,Arianna:40}}).err")=='pct','pct must be 100')
    check(E("BS.split(90,{who:[],mode:'eq'}).err")=='nadie','nobody')
    check(E("BS.split(80,{who:['Arianna'],mode:'one'}).Arianna")==80,'one person')
    # ---- enlace: noviembre en blanco, sin saldos ----
    d=E("snapFor('Tony')");bs=d['billSheet'];check(bs['k']=='2026-11' and all(r['total'] is None and r['fixed'] is None for r in bs['rows']),'blank sheet')
    keys=[r['key'] for r in bs['rows']];check(keys[:2]==['renta','ventanas'] and 'comida' not in keys and any(r['name']=='Ventanas de impacto' for r in bs['rows']),'ventanas in, comida out %s'%keys)
    s=json.dumps(bs);check(all(k not in s for k in ['income','cards','balance','paid','events']),'no balances in sheet')
    check('billSheet' not in E("snapFor('Carlos')"),'carlos no sheet')
    bills0=E("JSON.stringify(M().bills)")
    # ---- envío de Tony → buzón (nada cambia) ----
    doc={'id':'x1','t':'TT','link':'Tony','kind':'bills','by':'Tony','month':'2026-11','rev':0,'rows':[
      {'key':'renta','total':1000,'fixed':True,'alloc':{'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}}},
      {'key':'ventanas','total':120,'fixed':True,'alloc':{'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}}},
      {'key':'luz','total':0,'fixed':False,'alloc':{'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}}},
      {'key':'gas','total':40,'fixed':False,'alloc':{'who':['Tony','Arianna','Joe'],'mode':'eq'}},
      {'key':'comida','total':300,'fixed':False,'alloc':{'who':['Joe','Tony'],'mode':'pct','pct':{'Joe':50,'Tony':50}}}]}
    E("d=>{INBOX=[d];window.fbInboxDel=async()=>{window.__del=(window.__del||0)+1}}",doc)
    check(E("JSON.stringify(M().bills)")==bills0,'submission alone changes nothing')
    E("()=>{tab='ini';render();inboxList()}");pg.wait_for_timeout(150)
    check(pg.locator('#bsrow-x1').count()==1,'inbox row')
    E("bsReview('x1')");pg.wait_for_timeout(150)
    t=pg.inner_text('#dlg');check('Te queda por pagar' in t and 'Ventanas de impacto' in t,t)
    check('Comida' not in t.split('Te queda')[0] or 'Abono de comida' not in t,'comida must not be a sheet row: %s'%t)
    check('Ya pagado' in t and '$80.00' in t,'xfer/abonos still in summary')
    pg.screenshot(path=os.path.join(SH,'v140-joe-aprobar.png'))
    c0=E("calc(M())")
    pg.click('#bsok');pg.wait_for_timeout(200)
    B={b['name']:b for b in E("M().bills")}
    check(B['Rent House']['amount']==250 and not B['Rent House'].get('paid'),'rent → Joe share 250; unpaid till month end %s'%B['Rent House'])
    check(B['Ventanas de impacto']['amount']==30,'ventanas created')
    check(B['Electricity']['amount']==0 and B['Electricity']['sheet']['total']==0,'explicit zero applied')
    check(B['Phone']['amount']==60 and B['Phone']['paid']==10 and 'sheet' not in B['Phone'],'blank row + exceptional paid untouched')
    check(B['Car Insurance']['amount']==150,'omitted untouched')
    check(abs(B['Gas']['amount']-13.33)<1e-9 or abs(B['Gas']['amount']-13.34)<1e-9,'gas eq 3 %s'%B['Gas'])
    check(abs(B['Gas']['sheet']['sp']['Arianna']+B['Gas']['sheet']['sp']['Tony']+B['Gas']['sheet']['sp']['Joe']-40)<1e-9,'gas sums')
    check(B['Food']['amount']==100 and B['Food']['paid']==80 and 'sheet' not in B['Food'],'Food untouched by sheet (recibos, no factura) %s'%B['Food'])
    ev=E("M().events.filter(e=>e.type==='tony').length");check(ev==1,'no new payment entries')
    c1=E("calc(M())");check(abs(c1['xfer']-80)<1e-9 and abs(c1['tonyDue']-max(0,c1['toTony']-80))<1e-9,'abono resta del pendiente %s'%c1)
    # tarjeta de deudas (antes de rechazos / revisiones, sin toast)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200);check(pg.locator('#bscard').count()==1,'share card')
    card=pg.inner_text('#bscard');check('abonos de comida $80.00' in card.lower() and 'queda $20.00' in card,card)
    check('Pendiente' in card,'pending on card')
    E("()=>{document.querySelectorAll('.toast').forEach(x=>x.remove());document.getElementById('bscard').scrollIntoView({block:'center'})}");pg.wait_for_timeout(100)
    pg.screenshot(path=os.path.join(SH,'v140-deudas-actualizadas.png'))
    # idempotente
    b1=E("JSON.stringify(M().bills)");E("d=>{INBOX=[d]}",doc);r=E("bsApprove('x1')");check(r.get('done') and E("JSON.stringify(M().bills)")==b1,'idempotent')
    check(E("bsMonth('2026-11').rev")==1,'rev 1')
    # conflicto de versión: envío basado en rev 0
    doc2=dict(doc,id='x2',rows=[{'key':'renta','total':1100,'fixed':True,'alloc':doc['rows'][0]['alloc']}])
    E("d=>{INBOX=[d]}",doc2);r=E("bsApprove('x2')");check(r.get('err')=='stale' and E("M().bills.find(b=>b.id==='b1').amount")==250,'stale blocked')
    r=E("bsApprove('x2',true)");check(r.get('ok') and E("M().bills.find(b=>b.id==='b1').amount")==275,'forced apply')
    # reparto inválido no se aplica
    doc3=dict(doc,id='x3',rev=2,rows=[{'key':'agua','total':50,'fixed':False,'alloc':{'who':['Joe'],'mode':'amt','amt':{'Joe':40}}}])
    E("d=>{INBOX=[d]}",doc3);r=E("bsApprove('x3')");check(r.get('err')=='bad','invalid alloc rejected')
    # rechazar
    E("()=>{window.confirm=()=>true}");E("bsReview('x3')");pg.wait_for_timeout(100);pg.click('#bsrej');pg.wait_for_timeout(150);check(E("INBOX.length")==0 and E("window.__del")==1,'reject')
    # Comida sigue solo por recibos: un recibo de Arianna suma tfood, el abono no se toca, la hoja no interviene
    E("()=>{M().purchases.push({id:'pa',store:'Publix',date:'2026-11-08',total:40,mode:'fam',who:['Yo','Tony','Carlos'],method:'',paidBy:'Arianna',shares:{Tony:20,Carlos:10,Yo:10}});save()}")
    F=E("comidaBill(M())");check(F['amount']==110 and F['tfood']==10 and F['paid']==80,'Food 100 + 10 recibos, abono 80; hoja no interviene %s'%F)
    # un envío viejo/malicioso con fila comida se ignora
    food=E("JSON.stringify(comidaBill(M()))");docF=dict(doc,id='xfood',rev=2,rows=[{'key':'comida','total':300,'fixed':False,'alloc':{'who':['Joe'],'mode':'one'}}]);E("d=>{INBOX=[d]}",docF);r=E("bsApprove('xfood')");check(E("JSON.stringify(comidaBill(M()))")==food and (r.get('err')=='empty' or r.get('ok') or r.get('err')),'comida row ignored, Food unchanged %s'%r)
    # ---- mes siguiente: lo último que Tony puso, variables a revisar; noviembre aprobado intacto ----
    E("()=>{S.months['2026-12']={income:[{id:'d',name:'Débito',amount:0,role:'debit'}],cards:[],bills:[],personal:[],purchases:[],events:[]};S.cur='2026-12';save()}")
    d=E("snapFor('Tony')['billSheet']");R={r['key']:r for r in d['rows']}
    check(d['k']=='2026-12' and R['renta']['total']==1100 and R['renta']['fixed'] is True and not R['renta']['review'],'fixed prefilled')
    check(R['gas']['total']==40 and R['gas']['review'] is True and R['gas']['alloc']['mode']=='eq','variable prefilled + review, alloc kept')
    check(R['telefono']['total'] is None and 'comida' not in R,'never-entered stays blank; comida absent from prefill')
    check(E("bsMonth('2026-11').rev")==2 and len(E("bsMonth('2026-11').hist"))==2,'nov history kept')
print('OK',ok)
