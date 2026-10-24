"""v108 (made-up data only): Cuadrar con el banco (solo lectura)."""
import os,sys,json,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
SH=os.path.join(ROOT,'shots')
S=copy.deepcopy(FIX);S['cur']='2026-10'
S['months']['2026-10']={'income':[{'id':'i1','name':'Débito','amount':1901.80,'role':'debit'}],'cards':[{'id':'c1','name':'Chase Test','amount':65.64}],'bills':[],'purchases':[],
 'personal':[{'id':'g1','date':'2026-10-16','amount':10,'cat':'📦 Otros','desc':'Kalshi','method':'deb'},{'id':'g2','date':'2026-10-20','amount':50,'cat':'📦 Otros','desc':'Azador Eléctrico','method':'deb'},
  {'id':'g3','date':'2026-10-13','amount':38,'cat':'📦 Otros','desc':'Amazon aceite','method':'card:Chase Test'},{'id':'g4','date':'2026-10-23','amount':27.64,'cat':'📦 Otros','desc':'Amazon libro','method':'card:Chase Test'}],
 'events':[{'id':'e0','type':'adjust','date':'2026-10-14','lineKind':'income','lineId':'i1','lineName':'Débito','month':'2026-10','from':0,'to':1000,'diff':1000,'note':''},
  {'id':'e1','type':'check','date':'2026-10-15','amount':625.57,'desc':'Cheque'},{'id':'e2','type':'income','date':'2026-10-18','amount':2.91,'concept':'Reembolso en efectivo','method':'deb'},
  {'id':'e3','type':'cardpay','date':'2026-10-21','amount':85.11,'desc':'Pago Chase Test','cardId':'c1','cardMonth':'2026-10'},
  {'id':'e4','type':'adjust','date':'2026-10-12','lineKind':'cards','lineId':'c1','lineName':'Chase Test','month':'2026-10','from':0,'to':85.11,'diff':85.11,'note':''}]}
S['checks']=[]
BOA='''Description,,Summary Amt.
Beginning balance as of 10/01/2026,,"1,000.00"
Total credits,,"1,253.05"
Total debits,,"-281.51"
Ending balance as of 10/23/2026,,"1,971.54"

Date,Description,Amount,Running Bal.
10/01/2026,Beginning balance as of 10/01/2026,,"1,000.00"
10/10/2026,"OLD STORE","-20.00","980.00"
10/16/2026,"ACME DES:PAYROLLDD","486.23","1,466.23"
10/16/2026,"ACME DES:PAYROLLDD","139.34","1,605.57"
10/17/2026,"KALSHI DES:TRANSFER","-10.00","1,595.57"
10/20/2026,"Zelle payment to RIGO Conf# x1","-50.00","1,545.57"
10/21/2026,"CHASE DES:RWRD RDM ID:1","2.91","1,548.48"
10/22/2026,"AMAZON PRIME*X1","-15.37","1,533.11"
'''
CHASE='''Transaction Date,Post Date,Description,Category,Type,Amount,Memo
10/11/2026,10/12/2026,OLD SHOP,Shopping,Sale,-20.00,
10/13/2026,10/14/2026,AMAZON MKTPL,Shopping,Sale,-38.00,
10/21/2026,10/21/2026,Payment Thank You-Mobile,,Payment,85.11,
'''
up=lambda pg,name,txt:pg.set_input_files('#rcfile',files=[{'name':name,'mimeType':'text/csv','buffer':txt.encode()}])
for lang in ['es','en']:
  with app(ROOT,now='2026-10-24T13:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    snap=E("JSON.stringify(S)")
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(200);check(pg.locator('#rcopen').count()==1,'button in Reportes')
    pg.click('#rcopen');pg.wait_for_timeout(150)
    up(pg,'x.csv','foo,bar\n1,2\n');pg.wait_for_timeout(200);check(('No reconozco' if lang=='es' else "don't recognize") in pg.inner_text('#rcinfo'),'bad file')
    up(pg,'boa.csv',BOA);pg.wait_for_timeout(200);check(E("document.getElementById('rcbal').value")=='1971.54' and '7' in pg.inner_text('#rcinfo'),'boa parsed '+pg.inner_text('#rcinfo'))
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v108-subir.png'))
    pg.click('#rcgo');pg.wait_for_timeout(200);Rr=E("window.__rc")
    check(Rr['A']['start']=='2026-10-14','start = adjust')
    check(len(Rr['ok'])==4 and any(o.get('pair') for o in Rr['ok']),'matches incl. split check %s'%[o['app']['desc'] for o in Rr['ok']])
    check([x['a'] for x in Rr['appOnly']]==[-85.11],'app only')
    check([x['a'] for x in Rr['bankOnly']]==[-15.37],'bank only (old row excluded)')
    check(Rr['diff']==-15.37 and abs(Rr['exp']-(1971.54-85.11))<0.01,'diff')
    t=pg.inner_text('#rcres');check('15.37' in t and ('Todo cuadra' if lang=='es' else 'All matches') not in t,'red diff')
    check(('Nómina' in t or 'suma de 2' in t) if lang=='es' else ('sum of 2' in t),'labels')
    if lang=='es':
      E("document.getElementById('rcsum').scrollIntoView({block:'start'})");pg.wait_for_timeout(100);pg.screenshot(path=os.path.join(SH,'v108-resultado.png'),full_page=False)
    # scan fails -> manual still possible; scan ok -> line added
    E("()=>{window.fbScan=async()=>{throw new Error('x')}}");pg.set_input_files('#rcscan',files=[{'name':'p.png','mimeType':'image/png','buffer':open(os.path.join(ROOT,'icon-192.png'),'rb').read()}]);pg.wait_for_timeout(800)
    check(('No se pudo leer' if lang=='es' else "Couldn't read") in pg.inner_text('#rcinfo'),'scan fail message')
    E("()=>{window.fbScan=async()=>'{\"lines\":[{\"desc\":\"CHASE CREDIT CRD\",\"amount\":-85.11}]}'}");pg.set_input_files('#rcscan',files=[{'name':'p2.png','mimeType':'image/png','buffer':open(os.path.join(ROOT,'icon-180.png'),'rb').read()}]);pg.wait_for_timeout(800)
    check(pg.locator('#rcpl .rcp').count()==1,'scanned line')
    pg.click('#rcadd');pg.locator('#rcpl .rcpd').nth(1).fill('Amazon Prime');pg.locator('#rcpl .rcpa').nth(1).fill('-15.37')
    # app records Amazon Prime -> everything matches (read-only check: done outside dialog in state copy)
    pg.click('#rcgo');pg.wait_for_timeout(200);Rr=E("window.__rc");check(Rr['diff']==-30.74 and len(Rr['bankOnly'])==2,'manual pending line counted, unmatched in app')
    E("()=>{L().personal.unshift({id:'g5',date:'2026-10-22',amount:15.37,cat:'📺 Suscripciones',desc:'Amazon Prime',method:'deb'});debE(L()).amount=r2(debE(L()).amount-15.37)}")
    E("RC.pend.splice(1,1);rcDraw()");up(pg,'boa.csv',BOA);pg.wait_for_timeout(200)
    pg.click('#rcgo');pg.wait_for_timeout(200);Rr=E("window.__rc")
    check(abs(Rr['diff'])<0.005 and not Rr['appOnly'] and not Rr['bankOnly'] and any(o.get('pend') for o in Rr['ok']),'todo cuadra')
    check(('Todo cuadra' if lang=='es' else 'All matches') in pg.inner_text('#rcdiff'),'green')
    if lang=='es':E("document.getElementById('rcsum').scrollIntoView({block:'start'})");pg.wait_for_timeout(100);pg.screenshot(path=os.path.join(SH,'v108-todo-cuadra.png'))
    E("()=>{L().personal=L().personal.filter(p=>p.id!=='g5');debE(L()).amount=r2(debE(L()).amount+15.37)}")
    # card (Chase CSV): bank balance typed (owed)
    pg.select_option('#rcacct','card:Chase Test');up(pg,'chase.csv',CHASE);pg.wait_for_timeout(200)
    E("RC.pend=[];rcDraw()");pg.fill('#rcbal','38');pg.click('#rcgo');pg.wait_for_timeout(200);Rr=E("window.__rc")
    check(Rr['A']['start']=='2026-10-12' and len(Rr['ok'])==2 and [x['a'] for x in Rr['appOnly']]==[-27.64] and not Rr['bankOnly'] and abs(Rr['diff'])<0.005,'card '+json.dumps({k:Rr[k] for k in ['appOnly','bankOnly','diff']}))
    check(E("localStorage.getItem('finanzas-recon-acct')")=='card:Chase Test','last account remembered')
    check(E("JSON.stringify(S)")==snap,'read-only: no data changed')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v108 OK',ok)
