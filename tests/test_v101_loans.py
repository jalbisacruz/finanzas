"""v101b (made-up data): préstamos."""
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

S['budgets']={'🏠 Hogar':700}
S['subs']=[{'id':'sNet','name':'Netflix','active':True},{'id':'sHulu','name':'Hulu','active':False}]
S['months']['2026-09']=copy.deepcopy(S['months'].get('2026-09') or {'income':[{'id':'i0','name':'Débito','amount':500,'role':'debit'}],'cards':[],'bills':[],'purchases':[],'personal':[],'events':[]})
S['months']['2026-09'].setdefault('personal',[]).append({'id':'oldh','date':'2026-09-12','amount':7.99,'cat':'📺 Suscripciones','desc':'Hulu','method':'deb','sub':'sHulu','auto':True})
SH=os.path.join(ROOT,'shots')
REAL="()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}"
for lang in ['es','en']:
  with app(ROOT,now='2026-10-31T20:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    cats0=E("JSON.stringify(S.cats)");check(E("S.loans")==None,'no loans field on load (additive)')
    cn=E("L().cards[0].name")
    E("CTL.loans.add()");pg.fill('#ndn','Affirm Sofá');pg.fill('#ndlt','1350');pg.fill('#ndlc','225');pg.fill('#ndlp','450');pg.select_option('#ndlm','deb');pg.click('#ndok');pg.wait_for_timeout(100)
    E("CTL.loans.add()");pg.fill('#ndn','Laptop');pg.fill('#ndlt','300');pg.fill('#ndlc','100');pg.select_option('#ndlm','card:'+cn);pg.click('#ndok');pg.wait_for_timeout(100)
    E("CTL.loans.add()");pg.fill('#ndn','Sin cuota');pg.fill('#ndlt','100');pg.errors.clear();pg.click('#ndok');pg.wait_for_timeout(100);check(any('cuota' in e or 'payment' in e for e in pg.errors) and len(E("S.loans"))==2,'requires total+cuota');E("dlg().close()")
    l0=E("S.loans[0]");check(l0['total']==1350 and l0['cuota']==225 and l0['paid0']==450 and l0['meth']=='deb' and l0['active'],l0)
    st=E("loanSt(S.loans[0])");check(st['paid']==450 and st['left']==900 and st['rest']==4 and st['pct']==33 and not st['done'],st)
    # payment form
    d0=E("debAvail()");E("fabMenu()");check(pg.locator('#fabloan').count()==1,'menu');pg.click('#fabloan');pg.wait_for_timeout(100)
    pg.select_option('#lns',l0['id']);check(E("document.getElementById('lna').value")=='225' and E("document.getElementById('lnm').value")=='deb','prefill cuota + meth')
    pg.fill('#lnf','2026-10-05')
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v101-pago-prestamo.png'))
    pg.click('#lnsave');pg.wait_for_timeout(150)
    x=E("L().personal[0]");check(x['loan']==l0['id'] and x['amount']==225 and x['method']=='deb' and abs(E("debAvail()")-(d0-225))<0.01,x)
    lc=E("loanCat()");check(lc=='🏦 Préstamos' and E("S.cats.includes('🏦 Préstamos')"),'category created on first use')
    check(E("loanSt(S.loans[0])")['rest']==3,'3 left')
    # card loan, edited amount
    c0=E("L().cards[0].amount");l1=E("S.loans[1].id");E("fabMenu()");pg.click('#fabloan');pg.select_option('#lns',l1);check(E("document.getElementById('lnm').value")=='card:'+cn,'meth from loan')
    pg.fill('#lna','200');pg.fill('#lnf','2026-10-10');pg.click('#lnsave');pg.wait_for_timeout(150);check(abs(E("L().cards[0].amount")-(c0+200))<0.01,'card up')
    E("fabMenu()");pg.click('#fabloan');pg.select_option('#lns',l1);check(E("document.getElementById('lna').value")=='100','prefill capped at falta');pg.fill('#lnf','2026-10-20');pg.click('#lnsave');pg.wait_for_timeout(150)
    st1=E("loanSt(S.loans[1])");check(st1['done'] and st1['left']==0,'paid off')
    E("fabMenu()");pg.click('#fabloan');o=E("[...document.querySelectorAll('#lns option')].map(o=>o.value)");check(l1 not in o and l0['id'] in o,'paid-off not offered');E("dlg().close()")
    # negative block
    d1=E("debAvail()");n1=E("L().personal.length");E("fabMenu()");pg.click('#fabloan');pg.select_option('#lns',l0['id']);pg.select_option('#lnm','deb');pg.fill('#lna',str(d1+5));pg.errors.clear();pg.click('#lnsave');pg.wait_for_timeout(100)
    check(any('negativ' in e for e in pg.errors) and E("L().personal.length")==n1,'neg blocked');E("dlg().close()")
    # budget, not shared
    check(abs(E("budBy(L()).by['🏦 Préstamos']")-525)<0.01 and E("L().purchases.length")==7,'budget + not shared')
    E("CTL.loans.del(0)");check(len(E("S.loans"))==2,'cannot delete with payments')
    # cfg list
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(200);t=pg.inner_text('#ctl-loans')
    check('Affirm Sofá' in t and '$675.00' in t and ('3 cuotas restantes' if lang=='es' else '3 payments left') in t and ('✅ Pagado' if lang=='es' else '✅ Paid off') in t,t)
    # report + pdfs
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(300);t=pg.inner_text('#loancard');check('50%' in t and '100%' in t and '$525.00' in t and 'Laptop' in t and '$200.00' in t and ('Historial' if lang=='es' else 'History') in t,t)
    T3={k:pdft(pg,k) for k in ['mes','tony','carlos']}
    check(('Préstamos' if lang=='es' else 'Loans') in T3['mes'] and 'Affirm Sofá' in T3['mes'] and '$675.00' in T3['mes'],'joe pdf')
    for k in ['tony','carlos']:check('Affirm Sofá' not in T3[k] and 'Laptop' not in T3[k],k)
    for w in ['Tony','Carlos']:o=json.dumps(E("w=>r3Data('2026-10',w)",w),ensure_ascii=False);check('Affirm Sofá' not in o and 'Laptop' not in o,'r3 '+w)
    # edit + cancel
    E("CTL.loans.edit(0)");pg.fill('#ndlc','250');pg.check('#ndlx');pg.click('#ndok');pg.wait_for_timeout(100);e0=E("S.loans[0]");check(e0['cuota']==250 and e0['active']==False and e0['paid0']==450,e0)
    E("fabMenu()");pg.click('#fabloan');o=E("[...document.querySelectorAll('#lns option')].map(o=>o.value)");check(e0['id'] not in o,'cancelled hidden');E("dlg().close()")
    E("CTL.loans.edit(0)");pg.uncheck('#ndlx');pg.fill('#ndlc','225');pg.click('#ndok');pg.wait_for_timeout(100)
    E("save()");pg.reload();pg.wait_for_timeout(1000);check(len(E("S.loans"))==2,'persisted')
    E("()=>{unlocked=true;try{closeLock()}catch(e){};document.body.classList.remove('locked');render()}")
    if lang=='en':E("()=>{LANG='en';render()}")
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
    if lang=='es':
      for tb,cid,nm in [('cfg','ctl-loans','v101-prestamos-lista.png'),('rep','loancard','v101-reportes-prestamos.png')]:
        E("()=>{tab='%s';render()}"%tb);pg.wait_for_timeout(300);E(REAL)
        if not pg.locator('#%s .row'%cid).first.is_visible():pg.locator('#%s h2'%cid).first.click();pg.wait_for_timeout(200)
        E("document.getElementById('%s').scrollIntoView({block:'start'});scrollBy(0,-70)"%cid);pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,nm))
print('test_v101_loans OK',ok)
