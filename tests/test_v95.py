"""v95 (made-up data): los 3 resúmenes (Joe, Tony, Carlos) = mismas compras compartidas, mismas cuentas por pareja y mismo
bloque «Quién transfiere a quién». Números verificados a mano (escenario de fin de mes de prueba_v95)."""
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
XF=[{'from':'Yo','to':'Tony','amount':1602.35},{'from':'Carlos','to':'Yo','amount':64.85},{'from':'Carlos','to':'Tony','amount':28.55}]
with app(ROOT,now='2026-10-31T20:00:00',state=S,init="localStorage.setItem('finanzas-sync-uid','u1');",routes=R) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    D={w:E("w=>r3Data('2026-10',w)",w) for w in ['Yo','Tony','Carlos']}
    for w,d in D.items():
        check(d['transfers']==[x for x in XF if w=='Yo' or w in (x['from'],x['to'])],'%s transfers %s'%(w,d['transfers']))
        check((d['tot']=={'Yo':124.64,'Tony':195.4,'Carlos':93.4} and d['totAll']==413.44) if w=='Yo' else (d['tot'][w]==D['Yo']['tot'][w] and d['hid']['n']==0),'%s complete month totals %s'%(w,d['tot']))
        check(abs(sum(d['tot'].values())-d['totAll'])<1e-6,'columns add up to total')
        cols={x:round(sum(p['sh'][x] for p in d['purchases'])+d['hid']['sh'][x],2) for x in ['Yo','Tony','Carlos']};check(cols==d['tot'],'visible + hidden = total %s'%cols)
        PP={'Yo':{'pays':1602.35,'gets':64.85},'Tony':{'pays':0,'gets':1630.9},'Carlos':{'pays':93.4,'gets':0}};check((w=='Yo' and all(d['people'][x]['pays']==PP[x]['pays'] and d['people'][x]['gets']==PP[x]['gets'] for x in PP)) or (w!='Yo' and d['people'][w]['pays']==PP[w]['pays'] and d['people'][w]['gets']==PP[w]['gets']),d['people'])
        pr={(p['a'],p['b']):p for p in d['pairs']}
        check(('Yo','Tony') not in pr or [x['v'] for x in pr[('Yo','Tony')]['lines']]==[1666,28.55,-92.2] and pr[('Yo','Tony')]['net']==1602.35,'Joe-Tony = cuentas + parte Joe − parte Tony')
        check(('Carlos','Tony') not in pr or pr[('Carlos','Tony')]['paid'] is None and pr[('Carlos','Tony')]['tc']==1,'no settle tracking for Tony-Carlos')
    st=lambda w:[p['s'] for p in D[w]['purchases']]
    check(st('Yo')==['Target','Walmart A','Publix T','CVS Carlos','Walmart Licuadora','Aldi','Publix'],'Joe sees all, newest first %s'%st('Yo'))
    check(st('Tony')==['Target','Walmart A','Publix T','Aldi','Publix'] and D['Tony']['hid']['n']==0,'Tony: only involved (v104) %s'%D['Tony']['hid'])
    check(st('Carlos')==['Target','Publix T','CVS Carlos','Aldi','Publix'] and D['Carlos']['hid']['n']==0,'Carlos view')
    check(D['Carlos']['bills']==[] and not D['Carlos']['showBills'] and len(D['Tony']['bills'])==5,'bills only Joe/Tony')
    T3={k:pdft(pg,k) for k in ['mes','tony','carlos']}
    tl=lambda s:[x.split() for x in s.splitlines() if 'Total del mes' in x][-1]
    for k,tx in T3.items():
        XS={'mes':['Joe le transfiere a Tony','Carlos le transfiere a Joe','Carlos le transfiere a Tony','$1,602.35','$64.85','$28.55'],'tony':['Joe le transfiere a Tony','Carlos le transfiere a Tony','$1,602.35','$28.55'],'carlos':['Carlos le transfiere a Joe','Carlos le transfiere a Tony','$64.85','$28.55']}[k]
        for s_ in XS+['Cómo se calcula','Compras del mes']:check(s_ in tx,'%s pdf has %s'%(k,s_))
        if k=='tony':check('Carlos le transfiere a Joe' not in tx,'tony no Carlos-Joe')
        if k=='carlos':check('Joe le transfiere a Tony' not in tx,'carlos no Joe-Tony')
        check(k!='mes' or tl(tx)==['Total','del','mes','$413.44','$124.64','$195.40','$93.40'],'%s month total %s'%(k,tl(tx)))
        check(('Cuentas de Tony' in tx.split('Compras del mes')[1])==(k!='carlos'),'%s bills section'%k)
    check('Mis finanzas' in T3['mes'] and 'Mis finanzas' not in T3['tony'] and 'Lo que tengo' not in T3['carlos'],'personal finances only in Joe')
    check('Licuadora' in T3['mes'] and 'Licuadora' not in T3['tony'] and 'Licuadora' not in T3['carlos'],'Joe personal purchase only in his')
    # Hoy: no mark-paid for Tony-Carlos; the debt is still shown
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#tcok').count()==0 and pg.locator('#tcprev').count()==0 and 'Carlos le debe a Tony' in pg.inner_text('#owecard'),'Hoy: info only')
    # direction flips when Carlos pays: Joe owes Carlos, Tony owes Carlos
    E("()=>{M().purchases.push({id:'p8',store:'Home Depot',date:'2026-10-20',total:200,mode:'manual',who:['Yo','Tony','Carlos'],shares:{Yo:100,Tony:50,Carlos:50},method:'',paidBy:'Carlos'});save()}")
    d2=E("r3Data('2026-10','Carlos')");check(d2['transfers']==[{'from':'Yo','to':'Carlos','amount':35.15},{'from':'Tony','to':'Carlos','amount':21.45}],d2['transfers'])
    tx=pdft(pg,'carlos');check('Joe le transfiere a Carlos' in tx and 'Tony le transfiere a Carlos' in tx and '$35.15' in tx and '$21.45' in tx,'flipped sentences')
    E("()=>{M().purchases=M().purchases.filter(p=>p.id!=='p8');save()}")
    # link docs carry the same r3
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(100);pg.check('#lnkon-Tony');pg.check('#lnkon-Carlos');pg.wait_for_timeout(600)
    L=E("S.links");docs=E("window.__fs.docs");DT,DC=docs['shares/'+L['Tony']['t']],docs['shares/'+L['Carlos']['t']]
    check(DT['months'][0]['r3']['transfers']==[XF[0],XF[2]] and DC['months'][0]['r3']['transfers']==[XF[1],XF[2]],'docs carry transfers')
    check([p['s'] for p in DC['months'][0]['purchases']]==st('Carlos'),'doc purchases = PDF purchases')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
for who,doc in [('tony',DT),('carlos',DC)]:
  with app(ROOT,routes=R,now='2026-10-31T20:00:00',init="window.__SHARE_DOC=%s;"%json.dumps({**doc,'updatedAt':1761940000000}),width=390,height=844) as pg:
    pg.goto('/'.join(pg.url.split('/')[:3])+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA');pg.wait_for_timeout(500)
    sm=pg.inner_text('#vsum');check(all(x in sm for x in (['Joe le transfiere a Tony','Carlos le transfiere a Tony','$1,602.35','$28.55'] if who=='tony' else ['Carlos le transfiere a Joe','Carlos le transfiere a Tony','$64.85','$28.55'])),sm)
    check(pg.locator('#vtcpay').count()==0,'no Ya pagué')
    sb=pg.locator('#vdet').bounding_box();check(sb['y']+sb['height']<=844,'summary fits iPhone %s'%sb)
    pg.screenshot(path=os.path.join(ROOT,'shots','v95-enlace-%s.png'%who))
    pg.click('#vdet');pg.wait_for_timeout(100);tx=pg.inner_text('main')
    check('Cómo se calcula' in tx and 'Otras compras personales' not in tx and '$413.44' not in tx,'detail')
    tt=pg.inner_text('#r3tot');check(('$195.40' if who=='tony' else '$93.40') in tt,'complete month totals on page '+tt)
    pg.screenshot(path=os.path.join(ROOT,'shots','v95-enlace-%s-detalle.png'%who),full_page=True)
    with pg.expect_download(timeout=15000) as dd: pg.click('#vdl')
    p=tempfile.mktemp(suffix='.pdf');dd.value.save_as(p);lt=subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout
    strip=lambda s:'\n'.join(x for x in s.splitlines() if 'Resumen de' not in x and 'Summary for' not in x)
    check(strip(lt)==strip(T3[who]),'link PDF = app PDF (%s)'%who)
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v95 OK',ok)
