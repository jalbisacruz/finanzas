"""v99 (made-up data): beneficiarios en Personas, Transferencia con líneas de beneficiario, Enviado por persona + Historial de remesas."""
import os,sys,json,base64,subprocess,tempfile,copy,re
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
S=copy.deepcopy(FIX);S['cur']='2026-10'
S['months']['2026-10']={'income':[{'id':'i1','name':'Débito','amount':2950,'role':'debit'}],'cards':[{'id':'c1','name':'Visa Test','amount':64.40}],
 'bills':[{'id':'b1','name':'Hogar','amount':625,'fixed':True},{'id':'b2','name':'Transporte','amount':800,'fixed':True},{'id':'b3','name':'Comunicaciones','amount':101,'fixed':True},
  {'id':'b4','name':'Luz','amount':140,'fixed':False},{'id':'b5','name':'Food','amount':28.55,'tfood':28.55,'fixed':False,'cat':'🛒 Comida/Supermercado'}],
 'purchases':[{'id':'p1','store':'Publix','date':'2026-10-04','total':120,'mode':'fam','shares':{'Tony':60,'Carlos':30,'Yo':30},'method':'deb'},
  {'id':'p2','store':'Aldi','date':'2026-10-11','total':64.40,'mode':'fam','shares':{'Tony':32.2,'Carlos':16.1,'Yo':16.1},'method':'card:Visa Test'},
  {'id':'p3','store':'Walmart Licuadora','date':'2026-10-15','total':49.99,'mode':'manual','who':['Yo'],'shares':{'Yo':49.99},'method':'deb'},
  {'id':'p4','store':'CVS Carlos','date':'2026-10-18','total':18.75,'mode':'manual','who':['Carlos'],'shares':{'Carlos':18.75},'method':'deb'},
  {'id':'p5','store':'Publix T','date':'2026-10-29','total':84.20,'mode':'eq','who':['Yo','Tony','Carlos'],'shares':{'Tony':42.1,'Carlos':21.05,'Yo':21.05},'method':'','paidBy':'Tony'},
  {'id':'p6','store':'Walmart A','date':'2026-10-30','total':46.10,'mode':'manual','who':['Tony'],'shares':{'Tony':46.1,'Carlos':0,'Yo':0},'method':'','paidBy':'Arianna'},
  {'id':'p7','store':'Target','date':'2026-10-31','total':30,'mode':'eq','who':['Yo','Tony','Carlos'],'shares':{'Tony':15,'Carlos':7.5,'Yo':7.5},'method':'','paidBy':'Arianna'}],
 'personal':[],'events':[]}
def pdft(pg,kind):
    b=pg.evaluate("async k=>{const f=await makePDF(k,'2026-10');const a=new Uint8Array(await f.arrayBuffer());let s='';for(const x of a)s+=String.fromCharCode(x);return btoa(s)}",kind)
    p=tempfile.mktemp(suffix='.pdf');open(p,'wb').write(base64.b64decode(b));return subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout

S['budgets']={'🏠 Hogar':700,'💸 Envíos a familia':400}
S['recipients']=['Mamá']
S['months']['2026-10']['personal']=[{'id':'old98','date':'2026-10-05','amount':80,'cat':'💸 Envíos a familia','desc':'v98 vieja','method':'deb','recipient':'Mamá','xfer':True}]
SH=os.path.join(ROOT,'shots')
for lang in ['es','en']:
  with app(ROOT,now='2026-10-31T20:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else ''),expand=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    _p=E("L().personal");check([{k:v for k,v in x.items() if k not in ('catId','recId')} for x in _p]==S['months']['2026-10']['personal'],'v98 data untouched on load %s'%_p)
    ppl0=E("JSON.stringify(S.people)")
    # Personas
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#ctl-recips').count()==0,'no separate recipients card')
    t=pg.inner_text('#ctl-people');check('Mamá' in t and ('Beneficiario' if lang=='es' else 'Beneficiary') in t,t)
    E("CTL.people.add()");pg.fill('#ndn','Abuela Nena');pg.check('#ndben');pg.click('#ndok');pg.wait_for_timeout(150)
    check(E("S.recipients.includes('Abuela Nena')") and E("JSON.stringify(S.people)")==ppl0,'beneficiary not in people')
    E("()=>{tab='ini';render()}");E("editP()");pg.wait_for_timeout(150);dt=pg.inner_text('dialog');check('Abuela Nena' not in dt and 'Mamá' not in dt,'not in shared purchase');E("dlg().close()")
    # form
    d0=E("debAvail()")
    E("fabMenu()");pg.click('#fabxfer');pg.wait_for_timeout(150)
    check(pg.locator('#xbl .xbrow').count()==1 and pg.locator('#xr').count()==0,'one line, no free text')
    check(pg.locator('#xbl .xbn option').count()==len(E("S.recipients"))+2,'selector = beneficiaries only')
    check(E("document.getElementById('xrt').value")=='','no rate yet')
    pg.fill('#xa','300');pg.fill('#xrt','320');check('96,000 CUP' in pg.inner_text('#xcupt'),'cup total')
    pg.locator('#xbl .xbrow').nth(0).locator('select').select_option('Mamá');pg.locator('#xbl .xbrow').nth(0).locator('.xba').fill('48000')
    pg.click('#xbadd');pg.locator('#xbl .xbrow').nth(1).locator('select').select_option('__new');pg.locator('#xbl .xbrow').nth(1).locator('.xbnew').fill('Tía Rosa');pg.locator('#xbl .xbrow').nth(1).locator('.xba').fill('40000')
    bt=pg.inner_text('#xbal');check(('Falta 8,000 CUP' if lang=='es' else 'Missing 8,000 CUP') in bt and '$25.00' in bt,bt)
    pg.errors.clear();pg.click('#xsave');pg.wait_for_timeout(100);check(any('cuadran' in e or "match" in e for e in pg.errors),pg.errors);check(abs(E("debAvail()")-d0)<0.01,'mismatch blocked')
    pg.click('#xbadd');check(pg.locator('#xbl .xbrow').count()==3,'3 lines');pg.locator('#xbl .xbrow').nth(2).locator('.xbx').click();check(pg.locator('#xbl .xbrow').count()==2,'remove line')
    pg.locator('#xbl .xbrow').nth(1).locator('.xba').fill('48000.5')
    check(('Cuadra' if lang=='es' else 'Balanced') in pg.inner_text('#xbal'),'tolerance ±1 CUP');pg.locator('#xbl .xbrow').nth(1).locator('.xba').fill('48000')
    check(('Cuadra' if lang=='es' else 'Balanced') in pg.inner_text('#xbal'),'cuadra')
    pg.fill('#xf','2026-10-28');pg.fill('#xn','Ayuda de octubre')
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v99-transferencia-2-beneficiarios.png'))
    pg.errors.clear();pg.click('#xsave');pg.wait_for_timeout(200)
    x=E("L().personal[0]");check(x['rate']==320 and x['benef']==[{'n':'Mamá','cup':48000,'a':150},{'n':'Tía Rosa','cup':48000,'a':150}] and E('S.xRate')==320 and x['amount']==300 and x['method']=='deb' and x['cat']=='💸 Envíos a familia',x)
    check(abs(E("debAvail()")-(d0-300))<0.01 and E("S.recipients.includes('Tía Rosa')") and E("JSON.stringify(S.people)")==ppl0,'debit + new beneficiary')
    # otra categoría = USD, sin tasa
    E("fabMenu()");pg.click('#fabxfer');pg.wait_for_timeout(100);check(pg.locator('#xrtw').is_visible(),'rate visible for remesas')
    pg.select_option('#xc','📦 Otros');check(not pg.locator('#xrtw').is_visible(),'rate hidden for other category')
    pg.fill('#xa','60');r0=pg.locator('#xbl .xbrow').nth(0);r0.locator('select').select_option('Mamá');r0.locator('.xba').fill('50')
    check(pg.locator('#xbl .xba').first.get_attribute('placeholder')=='$' and ('Falta $10.00' if lang=='es' else 'Missing $10.00') in pg.inner_text('#xbal'),'usd falta')
    pg.errors.clear();pg.click('#xsave');pg.wait_for_timeout(100);check(any('cuadran' in e or 'match' in e for e in pg.errors),'usd mismatch blocked')
    pg.select_option('#xc','💸 Envíos a familia');check(pg.locator('#xrtw').is_visible(),'toggle back');pg.select_option('#xc','📦 Otros')
    r0.locator('.xba').fill('60');check(('Cuadra' if lang=='es' else 'Balanced') in pg.inner_text('#xbal'),'usd cuadra');
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v99-transferencia-usd-otra-categoria.png'))
    pg.click('#xsave');pg.wait_for_timeout(150)
    y=E("L().personal[0]");check(y['cat']=='📦 Otros' and 'rate' not in y and y['benef']==[{'n':'Mamá','a':60}],y)
    # negative block
    d1=E("debAvail()");E("fabMenu()");pg.click('#fabxfer');check(E("document.getElementById('xrt').value")=='320','rate remembered');pg.fill('#xa',str(d1+50));E("v=>{XB=[{n:'Mamá',a:v*320}];xbDraw()}",d1+50);pg.errors.clear();pg.click('#xsave');pg.wait_for_timeout(100)
    check(any('negativ' in e for e in pg.errors) and abs(E("debAvail()")-d1)<0.01,'negative blocked');E("dlg().close()")
    hv=E("xHist('2026-10')");old=[h for h in hv if h['id']=='old98'][0];check(old['rate'] is None and 'cup' not in old['lines'][0],'old = USD only')
    # per person + history
    P={r[0]:r[1:] for r in E("xByPerson('2026-10')")};check(P.get('Mamá')==[290,48000,150] and P.get('Tía Rosa')==[150,48000,150],P)
    H=E("xHist('2026-10')");check([h['id'] for h in H][-1]=='old98' and [h['date'] for h in H]==sorted([h['date'] for h in H],reverse=True) and len(H)==3,'newest first')
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(300)
    t=pg.inner_text('#xpcard');check('Mamá' in t and 'Tía Rosa' in t and '$290.00' in t and '$150.00' in t and 'CUP' not in t and 'Tasa' not in t and 'Rate' not in t and ('Envíos a familia' if lang=='es' else 'Family transfers') in t,t)  # v107: una sola tabla
    T3={k:pdft(pg,k) for k in ['mes','tony','carlos']}
    hh=('Envíos a familia (USD)' if lang=='es' else 'Family transfers (USD)')  # v107
    check(hh.lower() in T3['mes'].lower() and 'Tía Rosa' in T3['mes'] and '$290.00' in T3['mes'] and 'CUP' not in T3['mes'] and 'Tasa' not in T3['mes'] and 'Rate ' not in T3['mes'],'joe pdf')
    for k in ['tony','carlos']:check(hh.lower() not in T3[k].lower() and 'Tía Rosa' not in T3[k] and 'Mamá' not in T3[k],k)
    for w in ['Tony','Carlos']:o=json.dumps(E("w=>r3Data('2026-10',w)",w),ensure_ascii=False);check('Tía Rosa' not in o and 'Mamá' not in o,'r3Data '+w)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200);check(any('Tía Rosa' in (x.get('desc') or '') for x in E('moves(L())')),'movimientos desc')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
    if lang=='es':
      pg.wait_for_timeout(3500)
      E("()=>{tab='cfg';render()}");pg.wait_for_timeout(300);E("()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}");
      if not pg.locator('#ctl-people .row').first.is_visible():pg.locator('#ctl-people h2').first.click();pg.wait_for_timeout(200)
      E("document.getElementById('ctl-people').scrollIntoView({block:'start'});scrollBy(0,-70)");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'v99-personas.png'))
      E("()=>{tab='rep';render()}");pg.wait_for_timeout(300);E("()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}");
      if not pg.locator('#xpcard .row').first.is_visible():pg.locator('#xpcard h2').first.click();pg.wait_for_timeout(200)
      E("document.getElementById('xpcard').scrollIntoView({block:'start'});scrollBy(0,-70)");pg.wait_for_timeout(200)  # v107: ya no se regenera
print('test_v99 OK',ok)
