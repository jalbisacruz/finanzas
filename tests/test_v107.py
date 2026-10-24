"""v107 (made-up data): una sola tabla Envíos a familia (este mes + acumulado)."""
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

S['recipients']=['Mamá','Tía Rosa','Primo Leo']
S['months']['2026-10']['personal']=[
 {'id':'x1','date':'2026-10-20','amount':150,'cat':'💸 Envíos a familia','desc':'','method':'deb','xfer':True,'rate':400,'benef':[{'n':'Mamá','cup':40000,'a':100},{'n':'Tía Rosa','cup':20000,'a':50}]},
 {'id':'x2','date':'2026-10-05','amount':80,'cat':'💸 Envíos a familia','desc':'v98 vieja','method':'deb','recipient':'Mamá','xfer':True}]
S['months'].setdefault('2026-09',copy.deepcopy(S['months']['2026-10']))
S['months']['2026-09']['personal']=[{'id':'x3','date':'2026-09-12','amount':120,'cat':'💸 Envíos a familia','desc':'','method':'deb','xfer':True,'benef':[{'n':'Mamá','a':70},{'n':'Primo Leo','a':50}]}]
SH=os.path.join(ROOT,'shots')
REAL="()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}"
for lang in ['es','en']:
  with app(ROOT,now='2026-10-31T20:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    X=E("xTable('2026-10')");rows={r['n']:(r['m'],r['t'],len(r['s'])) for r in X['rows']}
    check(rows=={'Mamá':(180,250,3),'Tía Rosa':(50,50,1),'Primo Leo':(0,50,1)} and X['tm']==230 and X['tt']==350,rows)
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(200);E(REAL)
    c=pg.locator('#xpcard');
    if not c.locator('.xpr').first.is_visible():c.locator('h2').click();pg.wait_for_timeout(200)
    t=c.inner_text()
    check(('Envíos a familia' in t) if lang=='es' else ('Family transfers' in t),t)
    hist='Historial de remesas' if lang=='es' else 'Transfer history';sp='Enviado por persona' if lang=='es' else 'Sent per person'
    check(hist not in pg.inner_text('#v') and sp not in pg.inner_text('#v'),'old sections gone')
    check('$230.00' in t and '$350.00' in t and 'CUP' not in t,'totals USD only')
    check(not pg.locator('#xpr-0 > div').first.is_visible(),'collapsed')
    pg.locator('#xpr-0 summary').click();pg.wait_for_timeout(150)
    sends=pg.locator('#xpr-0 > div').all_inner_texts();check(len(sends)==3 and '$70.00' in sends[-1] and '$100.00' in sends[0],sends)
    if lang=='es':
      E("document.getElementById('xpcard').scrollIntoView({block:'start'});scrollBy(0,-70)");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'v107-envios-tabla.png'))
    mt=pdft(pg,'mes')
    check(hist not in mt and sp not in mt,'old pdf sections gone')
    hd='Envíos a familia (USD)' if lang=='es' else 'Family transfers (USD)';check(hd in mt,'pdf heading')
    sec=mt.split(hd)[1][:1500];check('$230.00' in sec and '$350.00' in sec and '$70.00' in sec and 'Primo Leo' in sec and 'CUP' not in sec,sec)
    for k in ['tony','carlos']:check('Mamá' not in pdft(pg,k),'not in '+k)
    if lang=='es':open('/tmp/v107.txt','w').write(sec)
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
    if lang=='es':
      b=E("async()=>{const f=await makePDF('mes','2026-10');const a=new Uint8Array(await f.arrayBuffer());let s='';for(const x of a)s+=String.fromCharCode(x);return btoa(s)}")
      p='/tmp/v107.pdf';open(p,'wb').write(base64.b64decode(b))
print('test_v107 OK',ok)
