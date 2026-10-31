"""v96 (made-up data): resúmenes sin artículos; PDF único «Detalle de compras» con privacidad de v95."""
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

ITEMS="()=>{const p=M().purchases.find(x=>x.id==='p1');p.list=[{a:20,n:'Shampoo Carlos',own:['Carlos']},{a:30,n:'Pasta Tony',own:['Tony']},{a:12,n:'Vino Joe y Tony',own:['Yo','Tony']}];p.tax=7;p.shares=computeShares(p,p.list);save()}"
SH=os.path.join(ROOT,'shots')
def shot(pg,kind,name):
    b=pg.evaluate("async k=>{const f=await makePDF(k,'2026-10');const a=new Uint8Array(await f.arrayBuffer());let s='';for(const x of a)s+=String.fromCharCode(x);return btoa(s)}",kind)
    p=tempfile.mktemp(suffix='.pdf');open(p,'wb').write(base64.b64decode(b))
    n=int(re.search(r'Pages:\s+(\d+)',subprocess.run(['pdfinfo',p],capture_output=True,text=True).stdout).group(1))
    subprocess.run(['pdftoppm','-png','-r','70','-f',str(n),'-l',str(n),'-singlefile',p,os.path.join(SH,name)])
with app(ROOT,now='2026-10-31T13:00:00',state=S) as pg:
    E=pg.evaluate;pg.wait_for_timeout(800);E(ITEMS)
    check(E("CODE_V")>='v120','ver')
    t=pdft(pg,'tony');c=pdft(pg,'carlos')
    for x,w in [(t,'Tony'),(c,'Carlos')]:
        check('Detalle de compras compartidas' in x,w+' has section')
        i=x.index('Detalle de compras compartidas');tail=x[i:]
        for s in ['Shampoo Carlos','Pasta Tony','Publix','Aldi','Target','Impuesto','Total de la compra','Pagó']:check(s in tail,w+' tail '+s)
        for s in ['Walmart Licuadora','CVS Carlos']:check(s not in tail,w+' no private '+s)
        check('Oct' in tail or '10/' in tail or 'oct' in tail,w+' has date')
    check('Walmart A' not in c[c.index('Detalle de compras compartidas'):],'carlos not Tony-only')
    check('Walmart A' not in t[t.index('Detalle de compras compartidas'):],'tony-only not shared')
    shot(pg,'tony','v120-pdf-tony-detalle');shot(pg,'carlos','v120-pdf-carlos-detalle')
print('test_v120 OK',ok)
