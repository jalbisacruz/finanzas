"""v179 (DATOS DE EJEMPLO): Inicio sin la tarjeta «🧾 Deudas de compras».
Antes/después con los mismos datos falsos: la tarjeta desaparece y NADA más cambia
(calc, Mi balance, Reparto de cuentas, Transferir a Tony, PDFs de Tony y Carlos).
python3 tests/test_v179.py
"""
import os,re,subprocess,json,copy
from harness import app,FIX,HERE
SRC=open(os.path.join(HERE,'test_v175.py')).read()
exec(SRC[SRC.index('PHONE='):SRC.index('def shot(')])   # PHONE, state(), SETUP, INFO, pdf(), txt()
exec(SRC[SRC.index('def transferir('):SRC.index('SHOTS=[]')])
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
EXTRA="""()=>{const m=S.months['2026-11'];m.income[0].amount=727.75;m.cards=[{id:'c1',name:'Visa',amount:171.14}];
 m.events.push({id:'cr1',type:'carlos',date:'2026-11-12',amount:157.47,desc:'Carlos'});save();tab='ini';BAL_OPEN=true;render();return null}"""
def grab(pg,tag):
    E=pg.evaluate;E(SETUP,{'food':True});E(EXTRA);pg.wait_for_timeout(250)
    o={'owe':pg.locator('#owecard').count(),'oweTxt':pg.inner_text('#owecard') if pg.locator('#owecard').count() else '',
       'calc':E("JSON.stringify(calc(S.months['2026-11']))"),'owesBy':E("JSON.stringify(owesBy(S.months['2026-11']))"),
       'bal':pg.inner_text('#balcard'),'cards':E("[...document.querySelectorAll('#v>.card')].map(c=>c.id||'').join(',')")}
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200)
    o['bs']=pg.inner_text('#bscard') if pg.locator('#bscard').count() else ''
    o['xfer']=transferir(pg)
    o['tony']=re.sub(r'\s+',' ',txt(pdf(pg,'/tmp/v179-%s-tony.pdf'%tag)))
    with pg.expect_download(timeout=20000) as d: E("()=>pdfDl('carlos','2026-11')")
    p='/tmp/v179-%s-carlos.pdf'%tag;d.value.save_as(p);o['carlos']=re.sub(r'\s+',' ',txt(p))
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200);o['errors']=list(pg.errors);return o
with app(ROOT,state=state(),routes={'**/v179.js':'/* antes */'},**PHONE) as pg:
    A=grab(pg,'antes')
check(A['owe']==1 and 'Le debes a Tony' in A['oweTxt'] and 'Ya incluido en Transferir a Tony' in A['oweTxt'] and 'le debe a Tony' in A['oweTxt'],'antes: la tarjeta existe (como en la captura de Joe): '+A['oweTxt'])
with app(ROOT,state=state(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v179','CODE_V');check('v179.js' in pg.content(),'index carga v179.js')
    B=grab(pg,'despues')
    check(B['owe']==0 and 'owecard' not in B['cards'],'Inicio sin «Deudas de compras»: '+B['cards'])
    check('Deudas de compras' not in pg.inner_text('#v') and 'Compras que pagaron otros' not in pg.inner_text('#v'),'ni el título ni el pie')
    for k in ('calc','owesBy','bal','bs','xfer','tony','carlos'):
        check(A[k]==B[k],'%s sin cambios'%k)
    check(abs(B['xfer']-511.25)<0.005 and 'Pendiente $511.25' in B['bs'].replace('\n',' '),'Transferir y Reparto 511.25')
    check('$511.25' in B['bal'] and '$182.55' in B['bal'],'Mi balance igual (v178)')
    check(A['cards'].replace('owecard,','').replace(',owecard','')==B['cards'],'resto de Inicio igual y en el mismo orden: %s | %s'%(A['cards'],B['cards']))
    # varias vueltas por las pestañas + menú: no vuelve a salir, sin errores
    for t in ('mov','rep','cfg','cal','ini','ini'):
        E("t=>{tab=t;render()}",t);pg.wait_for_timeout(120)
    check(pg.locator('#owecard').count()==0,'no reaparece al volver a Inicio')
    if E("typeof openDrawer==='function'"):
        E("openDrawer()");pg.wait_for_timeout(150);check('Deudas de compras' not in pg.inner_text('body'),'menú sin enlace a Deudas de compras');E("closeDrawer()")
    check(not B['errors'] and not pg.errors,'sin errores JS: %s %s'%(B['errors'],pg.errors))
    # captura de Inicio (después)
    E("()=>{tab='ini';BAL_OPEN=false;render();scrollTo(0,0);const n=document.querySelector('nav');n.style.position='static';const fb=document.getElementById('fab');if(fb)fb.style.display='none';document.querySelectorAll('.toast').forEach(x=>x.remove())}");pg.wait_for_timeout(200)
    E("""()=>{const H=document.documentElement.scrollHeight;for(let y=180;y<H;y+=420){const w=document.createElement('div');w.className='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:absolute;left:0;right:0;top:'+y+'px;text-align:center;font:700 30px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.40);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';document.body.append(w)}}""")
    SHOT=os.path.join(SH,'v179-inicio-sin-deudas-phone.png');pg.screenshot(path=SHOT,full_page=True)
with app(ROOT,state=state(),**PHONE) as pg:
    pg.goto(pg.url.rstrip('/')+'/v.html');pg.wait_for_timeout(600)
    check(not [e for e in pg.errors if 'v179' in e],'v.html: %s'%pg.errors)
print('test_v179 OK',ok);print(SHOT)
