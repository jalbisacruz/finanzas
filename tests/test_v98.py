"""v98 (adaptado en v99: el destinatario ahora es una línea de beneficiario) (made-up data): movimiento Transferencia (con selector de categoría) en el +."""
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

S['budgets']={'🏠 Hogar':700,'🛒 Comida/Supermercado':400,'💸 Envíos a familia':300}
SH=os.path.join(ROOT,'shots');import tempfile as _t;SH=_t.mkdtemp()  # v99: las fotos de v98 se conservan
for lang in ['es','en']:
  with app(ROOT,now='2026-10-31T20:00:00',state=S,routes=R,init=("localStorage.setItem('finanzas-lang','en');" if lang=='en' else '')) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    if lang=='en':E("()=>{LANG='en';render()}")
    cats0=E("JSON.stringify(S.cats)")
    d0=E("debAvail()");sp0=E("miMes('2026-10').sp");n0=E("L().purchases.length")
    E("fabMenu()");pg.click("#fabxfer");pg.wait_for_timeout(150)
    check(pg.locator('#xa').count()==1 and pg.locator('#xbl .xbrow').count()==1 and pg.locator('#xf').count()==1 and pg.locator('#xn').count()==1,'form fields')
    check(pg.locator('dialog #qcats').count()==0,'no category/item chips in transfer form')
    check(E("document.getElementById('xc').value")=='💸 Envíos a familia','default category')
    opts=E("[...document.querySelectorAll('#xc option')].map(o=>o.value)");check('🤝 Tony' not in opts and '💸 Remesas' not in opts and '📦 Otros' in opts,opts)
    pg.fill('#xa','250');E("([n,a])=>{XB=[{n:'',nw:1,nn:n,a:a}];xbDraw()}",['Familia (Cuba)','250']);pg.fill('#xf','2026-10-30');pg.fill('#xn','Remesa de octubre')
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v98-transferencia-form.png'))
    pg.click('#xsave');pg.wait_for_timeout(200)
    check(abs(E("debAvail()")-(d0-250))<0.01,'debit debited')
    x=E("L().personal[0]");check(x['cat']=='💸 Envíos a familia' and x['benef']==[{'n':'Familia (Cuba)','a':250}] and x['method']=='deb' and x['xfer'],x)
    check(E("JSON.stringify(S.cats)")==cats0,'no new category');check(E("L().purchases.length")==n0,'not a shared purchase')
    check(abs(E("miMes('2026-10').sp")-(sp0+250))<0.01,'counts in budget spending')
    check(abs(E("budBy(L()).by['💸 Envíos a familia']")-250)<0.01,'budBy')
    E("fabMenu()");pg.click("#fabxfer");pg.fill('#xa','40');E("([n,a])=>{XB=[{n:'',nw:1,nn:n,a:a}];xbDraw()}",['Juan','40']);pg.select_option('#xc','📦 Otros');pg.click('#xsave');pg.wait_for_timeout(150)
    check(E("L().personal[0].cat")=='📦 Otros' and E("L().personal[0].xfer"),'other category via selector')
    # blocked
    pg.errors.clear();d1=E("debAvail()");np=E("L().personal.length")
    E("fabMenu()");pg.click("#fabxfer");pg.fill('#xa',str(d1+100));E("([n,a])=>{XB=[{n:'',nw:1,nn:n,a:a}];xbDraw()}",['Familia',str(d1+100)])
    if lang=='es':
      pg.evaluate("()=>{window._al=window.alert;window.alert=m=>{window._msg=m;const b=document.createElement('div');b.id='fakealert';b.style='position:fixed;left:20px;right:20px;top:300px;background:#fff;border:2px solid #b91c1c;border-radius:12px;padding:18px;z-index:99999;font:16px system-ui;box-shadow:0 6px 30px #0006';b.innerHTML='<b>finanzas-joe-12ce2b.web.app</b><p>'+m+'</p><div style=\"text-align:right;color:#2563eb\">OK</div>';(document.querySelector('dialog[open]')||document.body).appendChild(b)}}")
      pg.click('#xsave');pg.wait_for_timeout(150);msg=E("window._msg")
      pg.screenshot(path=os.path.join(SH,'v98-bloqueo-negativo.png'));E("()=>{document.getElementById('fakealert').remove();window.alert=window._al}")
    else:
      pg.click('#xsave');pg.wait_for_timeout(150);msg=pg.errors[-1]
    check('negativ' in msg or 'negative' in msg,msg)
    check(abs(E("debAvail()")-d1)<0.01 and E("L().personal.length")==np,'blocked: nothing changed')
    E("dlg().close()")
    T3={k:pdft(pg,k) for k in ['mes','tony','carlos']}
    rl='Envíos a familia' if lang=='es' else 'Remittances to family'
    check(rl in T3['mes'],'Remesas in Joe pdf')
    for k in ['tony','carlos']:check(rl not in T3[k] and 'Familia (Cuba)' not in T3[k] and 'Remesa de octubre' not in T3[k],'%s pdf clean'%k)
    for w in ['tony','carlos']:
      try:o=json.dumps(E("w=>r3Data('2026-10',w==='tony'?'Tony':'Carlos')",w),ensure_ascii=False);check('Familia (Cuba)' not in o and 'Envíos a familia' not in o and 'Juan' not in o,'r3Data '+w)
      except Exception as e:
        if isinstance(e,AssertionError):raise
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
    check('Juan' in pg.inner_text('#v'),'in Movimientos')
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(300)
    t=pg.inner_text('#v');check(rl in t,'in Reportes')
    if lang=='es':
      el=pg.locator('#v .bar:has-text("Envíos a familia")').first
      el.scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'v98-envios-resumen.png'))
      E("()=>{tab='ini';render()}");pg.wait_for_timeout(300);pg.locator('#plancard').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'v98-plan-del-mes.png'))
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v98 OK',ok)
