"""v102 (made-up data): editar categoría de gastos personales / cobros automáticos."""
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
S['subs']=[{'id':'sApl','name':'Apple Com Bill','active':True,'amt':0.99,'per':'men'}]
L10=S['months']['2026-10']
L10['personal']=[{'id':'g1','date':'2026-10-21','amount':0.99,'cat':'📺 Suscripciones','desc':'Apple Com Bill','method':'card:Visa Test','sub':'sApl','auto':True},
 {'id':'g2','date':'2026-10-20','amount':2.00,'cat':'📺 Suscripciones','desc':'Car Wash','method':'card:Visa Test','sub':'sCW','auto':True},
 {'id':'g3','date':'2026-10-14','amount':3.99,'cat':'📺 Suscripciones','desc':'Suscripciones','method':'deb'},
 {'id':'g4','date':'2026-10-10','amount':50,'cat':'💸 Envíos a familia','desc':'Mamá','method':'deb','xfer':True}]
S['subs'].append({'id':'sCW','name':'Car Wash','active':True})
SH=os.path.join(ROOT,'shots')
REAL="()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('display:revert'))st.remove()}"
for lang in ['es','en']:
  with app(ROOT,now='2026-10-23T09:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    E("()=>{OPS_ALLM=true;tab='mov';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#movcard [data-g]').count()==4,E("document.getElementById('movcard')?.innerHTML.slice(0,1500)"))
    bal0=E("JSON.stringify([L().income.map(x=>x.amount),L().cards.map(x=>x.amount),calc(L())])")
    E("()=>{if(!S.cats.includes('🚗 Carro'))S.cats.splice(1,0,'🚗 Carro');if(!S.cats.includes('💸 Envíos a familia'))S.cats.splice(1,0,'💸 Envíos a familia')}")
    pg.locator('#movcard [data-g="g2"]').click();pg.wait_for_timeout(150)
    opts=E("[...document.querySelectorAll('#mvc option')].map(o=>o.value)");check(opts[0]=='📺 Suscripciones' and '🤝 Tony' not in opts and '🚗 Carro' in opts,opts)
    pg.select_option('#mvc','🚗 Carro');check(pg.locator('#mvsubw').is_visible(),'warning')
    if lang=='es':
      E(REAL);pg.screenshot(path=os.path.join(SH,'v102-editar-cobro.png'))
    pg.click('#mvsave');pg.wait_for_timeout(150)
    x=E("L().personal.find(p=>p.id==='g2')");check(x['cat']=='🚗 Carro' and 'sub' not in x and 'auto' not in x and x['amount']==2 and x['date']=='2026-10-20' and x['method']=='card:Visa Test' and x['desc']=='Car Wash',x)
    check(not any(a['id']=='g2' for a in E("subAll()")),'left sub history')
    # g3: plain gasto in subs cat -> Otros
    pg.locator('#movcard [data-g="g3"]').click();pg.wait_for_timeout(100)
    oth=E("S.cats.find(c=>/otros/i.test(c))");pg.select_option('#mvc',oth);pg.fill('#mvd','Tienda');pg.click('#mvsave');pg.wait_for_timeout(150)
    x=E("L().personal.find(p=>p.id==='g3')");check(x['cat']==oth and x['desc']=='Tienda' and x['amount']==3.99,x)
    # g1 stays sub, desc kept
    pg.locator('#movcard [data-g="g1"]').click();pg.wait_for_timeout(100);pg.click('#mvsave');pg.wait_for_timeout(100)
    check(E("L().personal.find(p=>p.id==='g1').sub")=='sApl','g1 still sub')
    # transfer: no sub cat offered
    pg.locator('#movcard [data-g="g4"]').click();pg.wait_for_timeout(100)
    check('📺 Suscripciones' not in E("[...document.querySelectorAll('#mvc option')].map(o=>o.value)"),'xfer cats');E("dlg().close()")
    check(E("JSON.stringify([L().income.map(x=>x.amount),L().cards.map(x=>x.amount),calc(L())])")==bal0,'balances unchanged')
    check(E("L().purchases.length")==7,'not shared')
    E("save()");pg.reload();pg.wait_for_timeout(1000);check(E("S.months['2026-10'].personal.find(p=>p.id==='g2').cat")=='🚗 Carro','persisted')
    E("()=>{unlocked=true;try{closeLock()}catch(e){};document.body.classList.remove('locked');OPS_ALLM=true;tab='mov';render()}")
    if lang=='en':
      E("()=>{LANG='en';render()}");t=pg.inner_text('#movcard');check('Edit' in E("document.querySelector('#movcard [data-g]').title"),'EN title')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
    if lang=='es':
      E(REAL);E("document.getElementById('movcard').scrollIntoView({block:'start'});scrollBy(0,-70)");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'v102-movimientos.png'))
print('test_v102 OK',ok)
