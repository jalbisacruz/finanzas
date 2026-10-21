"""v97 (made-up data): «Mi mes» en el resumen de Joe y «Gastado (Y% del presupuesto)» en el Plan del mes."""
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

S['budgets']={'🏠 Hogar':700,'🚗 Transporte':850,'🛒 Comida/Supermercado':400,'📡 Comunicaciones':110,'📦 Otros':180}
S['months']['2026-10']['events']=[{'id':'v1','type':'check','date':'2026-10-16','amount':1100},{'id':'v4','type':'income','date':'2026-10-10','amount':85,'concept':'💵 Propinas','desc':'Propinas','method':'deb'}]
S['months']['2026-10']['bills'][0]['cat']='🏠 Hogar';S['months']['2026-10']['bills'][1]['cat']='🚗 Transporte';S['months']['2026-10']['bills'][2]['cat']='📡 Comunicaciones'
fm=lambda v:('-' if v<-0.004 else '')+'${:,.2f}'.format(abs(v))
for lang in ['es','en']:
  with app(ROOT,now='2026-10-31T20:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    M=E("miMes('2026-10')");P=E("(({bud,sp,rec,real})=>({bud,sp,rec,real}))(planNums())")
    check(M['bud']==P['bud'] and M['sp']==P['sp'] and M['rec']==P['rec'] and M['sav']==P['real'],'same as planNums %s %s'%(M,P))
    check(M['bud']==2240 and M['pct']==round(M['sp']/M['bud']*100),M)
    T3={k:pdft(pg,k) for k in ['mes','tony','carlos']}
    mm='Mi mes' if lang=='es' else 'My month'
    check(mm.upper() in T3['mes'].split('\n\n')[0]+T3['mes'][:1500],'block on top of Joe pdf')
    for v in [M['bud'],M['sp'],M['rec'],M['sav']]:check(fm(v) in T3['mes'][:1500],'value %s in pdf'%v)
    check(('%d%% del presupuesto' if lang=='es' else '%d%% of budget')%M['pct'] in T3['mes'],'pct')
    for k in ['tony','carlos']:check(mm.upper() not in T3[k] and 'Ahorrado' not in T3[k] and 'Saved' not in T3[k],'%s has no Mi mes'%k)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    t=pg.inner_text('#plancard')
    check(pg.locator('#pl-sp').count()==1 and fm(M['sp']) in pg.inner_text('#pl-sp'),'hoy line')
    check(t.count('Gastado' if lang=='es' else 'Spent')==1,'no duplicate spent line: '+t)
    if lang=='en':check('Spent (%d%% of budget)'%M['pct'] in t,t)
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v97 OK',ok)
