"""v162 (DATOS DE EJEMPLO): compras de Carlos que llegan por un token que la app ya no tiene como actual.
python tests/test_v162.py
"""
import json,os
from harness import app,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
TT,TC,TOLD='TonyTokenAAAAAAAAAAAAA','CarlosTokenNEWBBBBBBBB','CarlosTokenOLDCCCCCCCC'
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('#demoW').forEach(x=>x.remove());const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';
      (document.getElementById(host||'')||document.getElementById('dlg')||document.body).append(w)}""",host)
CATS=[{'v':'🛒 Comida/Supermercado','l':'🛒 Comida/Supermercado'}]
SNAP={'v':1,'who':'Carlos','lang':'es','buyers':['Carlos'],'cats':CATS,'names':{'Yo':'Joe','Tony':'Tony','Carlos':'Carlos'},'months':[{'k':'2026-11','label':'Nov 2026','purchases':[]}]}
own=['Yo','Tony','Carlos']
sams={'by':'Carlos','store':"Sam's Club",'date':'2026-11-25','total':132.77,'tax':5.24,'scan':True,'at':1700000000000,
      'items':[{'n':'TOOTHPASTE','a':9.98,'own':own,'c':''},{'n':'ORALB SFT T','a':12.97,'own':own,'c':''},{'n':'BAR SOAP','a':14.48,'own':own,'c':''},
               {'n':'MM SPAN PAP','a':8.78,'own':own,'c':''},{'n':'KINDER BLEN','a':4.98,'own':own,'c':''},{'n':'SAZON','a':13.74,'own':own,'c':''},
               {'n':'MODELO','a':56.32,'own':own,'c':''},{'n':'ICE','a':6.28,'own':own,'c':''}]}
def run(case):
    docs={'shares/'+TT:{**SNAP,'who':'Tony','buyers':['Tony','Arianna'],'owner':'u1'},'shares/%s/inbox/t1'%TT:{'by':'Tony','store':'Publix','date':'2026-11-24','total':20,'at':1},
          'shares/'+TC:{**SNAP,'owner':'u1'},'shares/'+TOLD:{**SNAP,'owner':'u1'},'shares/%s/inbox/c-old'%TOLD:sams}
    links={'Tony':{'t':TT,'on':True},'Carlos':{'t':TC,'on':True}}
    seed=''
    if case=='old-token':seed="localStorage.setItem('finanzas-link-h-%s',JSON.stringify({who:'Carlos',v:1}));"%TOLD
    if case=='off':links['Carlos']={'t':TOLD,'on':False}
    init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);%s"%(json.dumps(json.dumps(docs)),seed)
    return init,links
for case in ['old-token','off']:
    init,links=run(case)
    with app(ROOT,routes=R,init=init,now='2026-11-26T10:15:00',new_look=True) as pg:
        E=pg.evaluate;pg.wait_for_timeout(1500)
        check(E('CODE_V')>='v162','CODE_V')
        E("(L)=>{S.links=L;save()}",links);E("()=>inboxLoad(true)");pg.wait_for_timeout(600)
        by=sorted(E("INBOX.map(x=>x.by+':'+x.id)"))
        check('Carlos:c-old' in by and 'Tony:t1' in by,'%s: Carlos visible en 📥: %s'%(case,by))
        E("inboxList()");pg.wait_for_timeout(600)
        st=E("(document.getElementById('v162st')||{}).textContent||''")
        check('Carlos: 1' in st and 'Tony: 1' in st,'%s: estado por persona: %s'%(case,st))
        if case=='off':check('desactivado' in st,'enlace desactivado visible: '+st)
        else:check('anterior' in st and 'enlace anterior' in pg.inner_text('#dlg'),'marca enlace anterior')
        check(TOLD in (E("(S.links.Carlos.alt||[])") or []) or case=='off','token recordado: %s'%E("S.links.Carlos"))
        if case=='old-token':mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v162-buzon-carlos-enlace-anterior-phone.png'))
        i=E("()=>INBOX.filter(x=>x.kind!=='bills').findIndex(x=>x.id==='c-old')")
        pg.click('#dlg button:has-text("Revisar") >> nth=%d'%i);pg.wait_for_timeout(300)
        r=E("()=>({by:D&&D.paidBy,over:_v160.overage(D,D.list),alt:!!document.getElementById('v162alt'),t:D&&D._inbox&&D._inbox.t})")
        check(r['by']=='Carlos' and abs(r['over'])<0.004 and r['t']==TOLD,'%s: revisión ok %s'%(case,r))
        if case=='old-token':
            check(r['alt'],'aviso enlace anterior en la revisión')
            mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v162-revisar-carlos-enlace-anterior-phone.png'))
            # la página del enlace anterior se mantiene al día
            E("()=>linksSync(true)");pg.wait_for_timeout(800)
            check(E("()=>!!(window.__fs.docs['shares/%s'].updatedAt)"%TOLD),'snapshot del enlace anterior actualizado')
        E("saveP()");pg.wait_for_timeout(300)
        check(E("M().purchases.some(p=>p.inboxId==='c-old'&&p.paidBy==='Carlos')"),'guardada')
        E("()=>inboxLoad(true)");pg.wait_for_timeout(600)
        check(not E("INBOX.some(x=>x.id==='c-old')"),'no reaparece tras guardar')
        check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
# error de lectura visible (antes se tragaba)
init,links=run('plain')
with app(ROOT,routes=R,init=init,now='2026-11-26T10:15:00',new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    E("(L)=>{S.links=L;save()}",links)
    E("()=>{const f=window.fbInbox;window.fbInbox=async t=>{if(t==='%s')throw Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});return f(t)}}"%TC)
    E("()=>inboxLoad(true)");pg.wait_for_timeout(500);E("inboxList()");pg.wait_for_timeout(600)
    st=E("(document.getElementById('v162st')||{}).textContent||''")
    check('Carlos: no se pudo leer (permission-denied)' in st,'error visible: '+st)
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v162-buzon-error-lectura-phone.png'))
print('test_v162 OK',ok)

# Mensaje para Carlos / Tony (texto y PDF)
import subprocess
from harness import FIX
with app(ROOT,state=FIX,now='2026-10-20T10:00:00',new_look=True) as pg:
    E=pg.evaluate
    k=E("S.cur")
    E("""(k)=>{const m=S.months[k];
      m.bills.push({id:'bx1',name:'Luz',amount:150,sheet:{total:150,sp:{Joe:50,Tony:50,Carlos:50}}},{id:'bx2',name:'Internet',amount:60,sheet:{total:60,sp:{Joe:20,Tony:20,Carlos:20}}});
      m.purchases.push({id:'pc1',store:'Costco',date:k+'-12',total:200,mode:'fam',who:['Yo','Tony','Carlos'],shares:{Tony:100,Carlos:50,Yo:50},method:'deb'});save();render()}""",k)
    due=E("k=>calc(S.months[k]).carlosDue",k)
    check(due>0,'Carlos debe algo en el ejemplo: %s'%due)
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200)
    tx=pg.input_value('#msgt')
    fd=E("v=>f(v)",due)
    # v163 cambió la primera persona por nombres («Carlos le transfiere a Joe»)
    check(('Carlos le transfiere a Joe '+fd) in tx and ('CARLOS LE TRANSFIERE A JOE  '+fd) in tx,'total con nombres: '+tx)
    check('TU PARTE DE LAS CUENTAS' in tx and 'Luz' in tx and E("v=>f(v)",70) in tx,'parte de las cuentas: '+tx)
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v162-mensaje-carlos-texto-phone.png'))
    E("k=>shareMsg('carlos',k,'pdf')",k);pg.wait_for_timeout(200)
    check(('Carlos le transfiere a Joe '+fd) in pg.input_value('#msgt'),'con PDF: total')
    with pg.expect_download(timeout=20000) as d: E("k=>pdfDl('carlos',k)",k)
    d.value.save_as('/tmp/v162c.pdf');pdf=subprocess.run(['pdftotext','-layout','/tmp/v162c.pdf','-'],capture_output=True,text=True).stdout
    check('Carlos le transfiere a Joe' in pdf and fd.replace('−','-') in pdf,'PDF Carlos: '+pdf[:400])
    subprocess.run(['pdftoppm','-png','-r','70','-f','1','-l','1','/tmp/v162c.pdf',os.path.join(SH,'v162-pdf-carlos')])
    E("k=>shareMsg('tony',k,'txt')",k);pg.wait_for_timeout(200)
    tt=pg.input_value('#msgt');td=E("k=>calc(S.months[k]).tonyDue",k)
    check(td<=0.005 or ('Joe le transfiere a Tony '+E("v=>f(v)",td)) in tt,'Tony: '+tt)
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
print('test_v162 msg OK',ok)
