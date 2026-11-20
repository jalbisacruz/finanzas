"""v149 (DATOS DE EJEMPLO): envío de hoja (payload limpio) y reparto por montos con Falta/Sobra/Cuadra.
python tests/test_v149.py
"""
import os,copy,json,re
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg):
    pg.evaluate("""()=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';
      const d=document.getElementById('vbed')||document.getElementById('dlg');
      (d&&(d.open||d.querySelector('.vbbox'))?d:document.body).append(w)}""")

def month():
    return {'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[],'personal':[],'purchases':[],'events':[],'tonyBase':0,
            'bills':[{'id':'b1','name':'Rent House','amount':800},{'id':'b2','name':'Phone','amount':60,'sheetKey':'telefono'}]}
def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11';S['months']['2026-11']=month();return S
TOK='AAAAAAAAAAAAAAAAAAAAAA'

def open_tony(pg):
    E=pg.evaluate
    doc=E("snapFor('Tony')");doc['updatedAt']=E("Date.now()");baseu='/'.join(pg.url.split('/')[:3])
    pg.add_init_script("window.__SHARE_DOC=%s;"%json.dumps(doc))
    pg.goto(baseu+'/v.html?t='+TOK);pg.wait_for_timeout(800)
    E("()=>{localStorage.removeItem('vbills-%s-2026-11')}"%TOK);pg.reload();pg.wait_for_timeout(800)
    E("""()=>{window.__fs=window.__fs||{docs:{},log:[]};
      window.vFsLib=async()=>({F:{addDoc:async(c,d)=>{const id='i'+Math.random().toString(36).slice(2,10);const path=(c&&c.path||'shares/inbox')+'/'+id;window.__fs.docs[path]=JSON.parse(JSON.stringify(d));window.__fs.log.push(path);return {id}},
        collection:(db,...p)=>({path:['shares',...p].join('/')}),serverTimestamp:()=>Date.now()},db:{}})}""")
    return E

# ---- versión y payload limpio (10 cuentas + nueva, decimales, sin campos de más) ----
with app(ROOT,now='2026-11-20T15:10:00',state=base(),new_look=True,routes=R,width=390,height=900) as pg:
    E=open_tony(pg)
    check(E('typeof payloadRow')=='function' or E("typeof payloadRow==='function'"),'payloadRow exported')
    # fill all 10 standard with decimals + add one
    for k,v in [('renta','800.50'),('ventanas','100'),('agua','45.67'),('luz','120'),('gas','30'),
                ('telefono','60'),('internet','79.99'),('purificador','20'),('seguro','150'),('letra','400')]:
        pg.fill('#bst-'+k,v)
    pg.click('#bsadd');pg.wait_for_timeout(150);pg.fill('#vbnn','Jardín');pg.click('#vbnmok');pg.wait_for_timeout(150)
    garden=E("vbState().rows.find(r=>r.name==='Jardín')");key=garden['key']
    pg.fill('#bst-'+key,'55.50')
    # dirty the alloc with leftover amt (like after switching modes) then send
    E("""()=>{const r=vbState().rows.find(x=>x.key==='renta');r.alloc={who:['Tony','Joe','Carlos'],mode:'pct',pct:{Tony:50,Joe:25,Carlos:25},amt:{Tony:'',Joe:0,extra:1},def:true}}""")
    pg.click('#bssend')
    pg.wait_for_function("()=>{const ok=document.getElementById('bsok'),e=document.getElementById('bserr');return (ok&&/Enviado/.test(ok.innerText))||(e&&e.innerText)}",timeout=8000)
    err=E("document.getElementById('bserr')&&document.getElementById('bserr').innerText") or ''
    check(not err,'send error: '+err)
    ib=E("window.__fs&&window.__fs.docs?Object.values(window.__fs.docs).filter(v=>v&&v.kind==='bills'):[]")
    check(len(ib)==1 and len(ib[0]['rows'])==11,'11 filas enviadas '+str(len(ib[0]['rows']) if ib else 0))
    renta=[r for r in ib[0]['rows'] if r['key']=='renta'][0]
    check(renta['total']==800.5,'decimal 800.50')
    check(set(renta.keys())<=set(['key','total','alloc','name','group','fixed']),'row keys '+str(renta.keys()))
    check(set(renta['alloc'].keys())==set(['who','mode','pct']) and 'amt' not in renta['alloc'] and 'def' not in renta['alloc'],'alloc limpio '+str(renta['alloc']))
    jard=[r for r in ib[0]['rows'] if r['key']==key][0]
    check(jard['name']=='Jardín' and jard['group']=='otro' and jard['total']==55.5,'nueva cuenta')
    # el borrador sigue en este dispositivo (localStorage) después de enviar
    raw=E("localStorage.getItem('vbills-%s-2026-11')"%TOK)
    check(raw and '800.50' in raw or raw and '800.5' in raw,'borrador persiste')

# fallar el envío no borra el borrador; al recargar sigue y se puede reenviar
S=base()
with app(ROOT,now='2026-11-20T15:10:00',state=S,new_look=True,routes=R,width=390,height=900) as pg:
    E=open_tony(pg)
    pg.fill('#bst-renta','800');pg.wait_for_timeout(80)
    check(E("JSON.parse(localStorage.getItem('vbills-%s-2026-11')||'{}').rows.renta.total"%TOK) in (800,'800',800.0),'guardado al escribir')
    E("""()=>{window.vFsLib=async()=>({F:{addDoc:async()=>{throw new Error('permission-denied')},collection:()=>({}),serverTimestamp:()=>Date.now()},db:{}})}""")
    pg.click('#bssend');pg.wait_for_timeout(400)
    msg=pg.inner_text('#bserr')
    check('No se pudo enviar. Inténtalo otra vez.' in msg,'mensaje exacto: '+msg)
    # recargar: el borrador sigue (como le pasará a Tony después del arreglo)
    pg.reload();pg.wait_for_timeout(800)
    # after reload __SHARE_DOC may still be there from init script; vBillsDraw should load draft
    E("()=>{if(window.vBillsDraw)vBillsDraw()}")
    pg.wait_for_timeout(300)
    val=E("document.getElementById('bst-renta')&&document.getElementById('bst-renta').value")
    check(str(val) in ('800','800.00'),'tras recargar sigue el 800: '+str(val))

# ---- Cambiar reparto por montos: total, Falta / Sobra / Cuadra, último campo ----
def open_amt(pg, width=390, height=900):
    E=open_tony(pg)
    pg.fill('#bst-renta','100')
    pg.click('#bsr-renta .bsch');pg.wait_for_timeout(200)
    # Montos
    pg.locator('#vbed button', has_text='Montos').click();pg.wait_for_timeout(200)
    return E

with app(ROOT,now='2026-11-20T15:10:00',state=base(),new_look=True,routes=R,width=390,height=900) as pg:
    E=open_amt(pg)
    box=pg.inner_text('#vbed')
    check('Total' in box and '$100.00' in box,'total visible '+box[:200])
    check(pg.locator('#vbtotal').count()==1,'bloque total')
    # default amt values empty; last person is Carlos (who = Tony, Joe, Carlos)
    check(pg.locator('#vbv-Tony').count()==1 and pg.locator('#vbv-Carlos').count()==1,'campos de los tres')
    ph=pg.get_attribute('#vbv-Carlos','placeholder')
    check(ph=='100' or ph=='100.00' or '100' in (ph or ''),'último campo muestra el resto del total: '+str(ph))
    check('para llegar al total' in box,'hint en el último campo')
    # Falta: Tony 50, Joe 20 → suma 70, falta 30
    pg.fill('#vbv-Tony','50');pg.fill('#vbv-Joe','20');pg.wait_for_timeout(80)
    st=pg.inner_text('#vbsum')
    check('Falta $30.00' in st and 'Suma $70.00 de $100.00' in st,'Falta 30 '+st)
    ph=pg.get_attribute('#vbv-Carlos','placeholder')
    check('30' in (ph or ''),'placeholder del último se actualiza a 30: '+str(ph))
    mark(pg);pg.screenshot(path=os.path.join(SH,'v149-reparto-montos-falta-phone.png'))
    # Sobra
    pg.fill('#vbv-Carlos','40');pg.wait_for_timeout(80)
    st=pg.inner_text('#vbsum')
    check('Sobra $10.00' in st,'Sobra 10 '+st)
    mark(pg);pg.screenshot(path=os.path.join(SH,'v149-reparto-montos-sobra-phone.png'))
    # Cuadra
    pg.fill('#vbv-Carlos','30');pg.wait_for_timeout(80)
    st=pg.inner_text('#vbsum')
    check('✅ Cuadra' in st and 'Suma $100.00 de $100.00' in st,'Cuadra '+st)
    mark(pg);pg.screenshot(path=os.path.join(SH,'v149-reparto-montos-cuadra-phone.png'))
    pg.click('#vbedok');pg.wait_for_timeout(150)
    a=E("vbState().rows.find(r=>r.key==='renta').alloc")
    check(a['mode']=='amt' and a['amt']['Tony']==50 and a['amt']['Joe']==20 and a['amt']['Carlos']==30,'se guardó el reparto por montos')
    check(not pg.errors,pg.errors)

# escritorio
with app(ROOT,now='2026-11-20T15:10:00',state=base(),new_look=True,routes=R,width=1280,height=800) as pg:
    open_amt(pg)
    check('$100.00' in pg.inner_text('#vbtotal') and pg.locator('#vbv-Carlos').count()==1,'total y último campo en escritorio')
    pg.fill('#vbv-Tony','50');pg.fill('#vbv-Joe','20');pg.wait_for_timeout(80)
    check('Falta $30.00' in pg.inner_text('#vbsum'),'Falta desktop')
    mark(pg);pg.screenshot(path=os.path.join(SH,'v149-reparto-montos-falta-desktop.png'))
    pg.fill('#vbv-Carlos','30');pg.wait_for_timeout(80)
    check('✅ Cuadra' in pg.inner_text('#vbsum'),'Cuadra desktop')
    mark(pg);pg.screenshot(path=os.path.join(SH,'v149-reparto-montos-cuadra-desktop.png'))

# inglés
with app(ROOT,lang='en',now='2026-11-20T15:10:00',state=base(),new_look=True,routes=R,width=390,height=900) as pg:
    # v.html uses ES from DOC.lang; open_tony may stay in Spanish if share doc is lang es
    E=open_tony(pg)
    E("()=>{if(window.ES!==undefined)ES=false;if(window.DOC)DOC.lang='en';vBillsDraw()}")
    pg.wait_for_timeout(200)
    pg.fill('#bst-renta','100')
    pg.click('#bsr-renta .bsch');pg.wait_for_timeout(200)
    # button might be Amounts
    btn=pg.locator('#vbed button', has_text=re.compile('Montos|Amounts'))
    btn.click();pg.wait_for_timeout(200)
    pg.fill('#vbv-Tony','40');pg.wait_for_timeout(80)
    st=pg.inner_text('#vbsum')
    check('Short' in st or 'Falta' in st,'status EN o ES '+st)

print('test_v149 OK',ok)
