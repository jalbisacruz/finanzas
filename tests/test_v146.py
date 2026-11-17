"""v146 (DATOS DE EJEMPLO): defaults 50/25/25, sin Arianna en la hoja, agregar/renombrar cuentas.
python tests/test_v146.py
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
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';document.body.append(w)}""")

def month():
    return {'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[],'personal':[],'purchases':[],'events':[],'tonyBase':0,
            'bills':[{'id':'b1','name':'Rent House','amount':800},{'id':'b2','name':'Phone','amount':60,'sheetKey':'telefono'}]}

def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11';S['months']['2026-11']=month();return S

TOK='AAAAAAAAAAAAAAAAAAAAAA'

# ---- defaults y compat en la app de Joe ----
with app(ROOT,now='2026-11-17T11:50:00',state=base(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    check(E('CODE_V')=='v146','ver')
    check(E("JSON.stringify(BS.SHEET_WHO)")=='["Joe","Tony","Carlos"]','sheet who')
    check(E("BS.PEOPLE").count('Arianna')==1 if False else E("BS.PEOPLE.includes('Arianna')"),'cálculo aún acepta Arianna (recibos / hojas viejas)')
    for k in ('renta','ventanas','agua','luz','gas','telefono','internet','purificador'):
        sp=E(f"BS.split(100,BS.def('{k}'))")
        check(sp=={'Joe':25,'Tony':50,'Carlos':25,'Arianna':0},f'def 50/25/25 {k} {sp}')
    check(E("BS.split(150,BS.def('seguro')).Joe")==150 and E("BS.split(200,BS.def('letra')).Joe")==200,'letra y seguro Joe 100%')
    check(E("JSON.stringify(BS.def('jardin'))")==E("JSON.stringify(BS.def('renta'))"),'cuenta nueva 50/25/25')
    # split viejo con Arianna sigue cuadrando
    check(abs(E("BS.split(80,{who:['Arianna'],mode:'one'}).Arianna")-80)<1e-9,'legacy one Arianna')
    d=E("snapFor('Tony')['billSheet']");R={r['key']:r for r in d['rows']}
    check('Tony 50%' in E("BS.txt(BS.def('telefono'))") and not R['telefono'].get('def'),'teléfono ya no es como hoy / Joe 100%')
    check(R['seguro']['alloc']['pct']['Joe']==100,'seguro sigue 100')
    # recibo de Arianna (Publix) no se rompe
    E("()=>{M().purchases.push({id:'pa',store:'Publix',date:'2026-11-08',total:40,mode:'fam',who:['Yo','Tony','Carlos'],method:'',paidBy:'Arianna',shares:{Tony:20,Carlos:10,Yo:10}});save()}")
    # paidBy Arianna is allowed; just ensure no throw and purchase stays
    check(E("M().purchases.some(p=>p.paidBy==='Arianna'&&p.store==='Publix')"),'recibo Arianna intacto')

# ---- pantalla de Tony, teléfono y escritorio ----
def open_tony(pg, width_note=''):
    E=pg.evaluate
    doc=E("snapFor('Tony')");doc['updatedAt']=E("Date.now()");base='/'.join(pg.url.split('/')[:3])
    pg.add_init_script("window.__SHARE_DOC=%s;"%json.dumps(doc))
    pg.goto(base+'/v.html?t='+TOK);pg.wait_for_timeout(800)
    E("()=>{localStorage.removeItem('vbills-%s-2026-11')}"%TOK);pg.reload();pg.wait_for_timeout(800)
    E("""()=>{window.__fs=window.__fs||{docs:{},log:[]};
      window.vFsLib=async()=>({F:{addDoc:async(c,d)=>{const id='i'+Math.random().toString(36).slice(2,10);const path=(c&&c.path||'shares/inbox')+'/'+id;window.__fs.docs[path]=JSON.parse(JSON.stringify(d));window.__fs.log.push(path);return {id}},
        collection:(db,...p)=>({path:['shares',...p].join('/')}),serverTimestamp:()=>Date.now()},db:{}})}""")
    return E

S=base()
with app(ROOT,now='2026-11-17T11:50:00',state=S,new_look=True,routes=R,width=390,height=900) as pg:
    E=open_tony(pg)
    form=pg.inner_text('#bsform')
    check(pg.locator('#bsform').count()==1,'hoja')
    check('Arianna' not in form,'sin Arianna en la hoja (teléfono)')
    check('como hoy' not in form,'sin como hoy')
    check('Tony 50%' in pg.inner_text('#bsr-telefono') and 'Joe 25%' in pg.inner_text('#bsr-telefono'),'teléfono 50/25/25')
    check('Tony 50%' in pg.inner_text('#bsr-internet') and 'Tony 50%' in pg.inner_text('#bsr-purificador'),'internet y purificador')
    check('Joe 100%' in pg.inner_text('#bsr-letra') and 'Joe 100%' in pg.inner_text('#bsr-seguro'),'auto Joe 100%')
    check(pg.locator('#bsadd').count()==1 and '+ Agregar cuenta' in form,'link agregar')
    check(pg.locator('#bsr-renta .bsed').count()==1,'lápiz de renombrar')
    pg.fill('#bst-renta','1000');pg.fill('#bst-telefono','80');pg.wait_for_timeout(100)
    tot=pg.inner_text('#bstot')
    check('Joe' in tot and 'Tony' in tot and 'Carlos' in tot and 'Arianna' not in tot,'pie sin Arianna')
    # 1000 renta 250/500/250 + 80 tel 20/40/20 → Joe 270, Tony 540, Carlos 270
    check('$270.00' in tot and '$540.00' in tot,'totales pie')
    mark(pg)
    pg.screenshot(path=os.path.join(SH,'v146-tony-hoja-phone.png'),full_page=True)
    pg.click('#bsr-renta .bsch');pg.wait_for_timeout(150)
    ed=pg.inner_text('#vbed')
    check('Arianna' not in ed and 'Joe' in ed and 'Tony' in ed and 'Carlos' in ed,'reparto sin Arianna')
    mark(pg)
    pg.screenshot(path=os.path.join(SH,'v146-cambiar-reparto-phone.png'))
    pg.click('text=Cancelar');pg.wait_for_timeout(100)
    # agregar + renombrar
    pg.click('#bsadd');pg.wait_for_timeout(150)
    check(pg.locator('#vbnn').count()==1,'diálogo agregar')
    pg.fill('#vbnn','Jardín');pg.click('#vbnmok');pg.wait_for_timeout(150)
    check(pg.locator('.bsr', has_text='Jardín').count()==1,'cuenta nueva en la lista')
    garden=E("vbState().rows.find(r=>r.name==='Jardín')")
    check(garden and re.match(r'^c-[a-z0-9]{8}$',garden['key']) and garden['alloc']['pct']['Tony']==50,'nueva key estable 50/25/25')
    key=garden['key']
    pg.fill('#bst-'+key,'40')
    # renombrar Teléfono (key telefono se queda)
    pg.click('#bsr-telefono .bsed');pg.wait_for_timeout(150)
    pg.fill('#vbnn','Teléfono casa');pg.click('#vbnmok');pg.wait_for_timeout(150)
    check('Teléfono casa' in pg.inner_text('#bsr-telefono') and E("vbState().rows.find(r=>r.key==='telefono').key")=='telefono','rename mantiene key')
    mark(pg)
    pg.screenshot(path=os.path.join(SH,'v146-agregar-renombrar-phone.png'),full_page=True)
    pg.click('#bssend')
    pg.wait_for_function("()=>{const ok=document.getElementById('bsok'),e=document.getElementById('bserr');return (ok&&/Enviado/.test(ok.innerText))||(e&&e.innerText)}",timeout=8000)
    err=E("document.getElementById('bserr')&&document.getElementById('bserr').innerText") or ''
    check(not err,'send error: '+err+' errors='+str(pg.errors))
    ib=E("window.__fs&&window.__fs.docs?Object.values(window.__fs.docs).filter(v=>v&&v.kind==='bills'):[]")

    check(len(ib)==1,'un envío')
    rows={r['key']:r for r in ib[0]['rows']}
    check('name' not in rows['renta'] and rows['renta']['total']==1000,'renta estándar sin name (compatible con reglas actuales)')
    check(rows['telefono']['name']=='Teléfono casa' and rows['telefono']['key']=='telefono','rename en payload')
    check(key in rows and rows[key]['name']=='Jardín' and rows[key]['total']==40 and rows[key]['group']=='otro','nueva en payload')
    sent=ib[0]

# escritorio
with app(ROOT,now='2026-11-17T11:50:00',state=base(),new_look=True,routes=R,width=1280,height=800) as pg:
    open_tony(pg)
    check(pg.locator('#bsform').count()==1 and 'Arianna' not in pg.inner_text('#bsform'),'hoja desktop')
    check('+ Agregar cuenta' in pg.inner_text('#bsform') and 'Tony 50%' in pg.inner_text('#bsr-telefono'),'defaults desktop')
    mark(pg)
    pg.screenshot(path=os.path.join(SH,'v146-tony-hoja-desktop.png'),full_page=True)
    pg.click('#bsr-agua .bsch');pg.wait_for_timeout(150)
    check('Arianna' not in pg.inner_text('#vbed'),'reparto desktop sin Arianna')
    mark(pg)
    pg.screenshot(path=os.path.join(SH,'v146-cambiar-reparto-desktop.png'))

# ---- Joe aprueba: nuevas, renombres, no reescribe historia, pie sin Arianna ----
S=base()
# historia ya aprobada en octubre (teléfono era Joe 100%) no se debe reescribir
S['months']['2026-10']=copy.deepcopy(S['months']['2026-11'])
S['months']['2026-10']['bills']=[{'id':'p1','name':'Phone','amount':60,'sheetKey':'telefono','sheet':{'total':60,'alloc':{'who':['Joe'],'mode':'pct','pct':{'Joe':100}},'sp':{'Joe':60,'Tony':0,'Carlos':0,'Arianna':0}}}]
S['bsheet']={'months':{'2026-10':{'rev':1,'rows':{'telefono':{'total':60,'alloc':{'who':['Joe'],'mode':'pct','pct':{'Joe':100}}}},'applied':{'old':1},'hist':[{'rev':1}]}}}
with app(ROOT,now='2026-11-17T11:50:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    # prefill de un mes nuevo (nov sin rows propias) no debe copiar el J100 de teléfono; sí el monto si existiera en from. Nov is blank own... from is 2026-10
    # Wait: S.cur is 2026-11, last key might be 2026-11. snapFor uses keys().at(-1) = 2026-11.
    # 2026-11 has no bsheet rows, so from=2026-10, telefono total 60, alloc should flip to 50/25/25
    sh=E("snapFor('Tony')['billSheet']");R={r['key']:r for r in sh['rows']}
    check(sh['from']=='2026-10' and R['telefono']['total']==60,'prefill monto de oct')
    check(R['telefono']['alloc']['pct']['Tony']==50 and R['telefono']['alloc']['pct']['Joe']==25,'prefill usa default nuevo, no reescribe oct')
    oct_alloc=E("S.bsheet.months['2026-10'].rows.telefono.alloc")
    check(oct_alloc=={'who':['Joe'],'mode':'pct','pct':{'Joe':100}},'octubre intacto')
    phone10=E("S.months['2026-10'].bills.find(b=>b.sheetKey==='telefono')")
    check(phone10['amount']==60 and phone10['sheet']['sp']['Joe']==60,'historia oct no reescrita')

    doc={'id':'n1','t':'TT','link':'Tony','kind':'bills','by':'Tony','month':'2026-11','rev':0,'rows':[
      {'key':'telefono','total':80,'alloc':{'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}},'name':'Teléfono casa'},
      {'key':'c-jardin1','total':40,'alloc':{'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}},'name':'Jardín','group':'otro'}]}
    bills0=E("JSON.stringify(S.months['2026-10'].bills)")
    E("d=>{INBOX=[d]}",doc)
    E("()=>{tab='ini';render();inboxList()}");pg.wait_for_timeout(150)
    E("bsReview('n1')");pg.wait_for_timeout(200)
    t=pg.inner_text('#dlg')
    check('Teléfono casa' in t and 'Jardín' in t and 'nueva' in t,'review nombres')
    check('Arianna' not in t,'review sin Arianna')
    heads=E("[...document.querySelectorAll('#bsdiff tr.muted td')].map(x=>x.textContent.trim())")
    check(heads[1]=='Oct' and heads[2]=='Nov','columnas Oct / Nov (mes anterior y mes de la hoja) %s'%heads)
    check('Tu parte antes' not in t and 'Tu parte ahora' not in t,'sin etiquetas antes/ahora')
    check(E("_v146.bsPrevKey('2026-01')")=='2025-12' and E("_v146.bsMonthShort('2026-01')")=='Ene' and E("_v146.bsMonthShort('2025-12')")=='Dic','corte de año ES')
    E("()=>{LANG='en'}")
    check(E("_v146.bsMonthShort('2026-11')")=='Nov' and E("_v146.bsMonthShort('2026-10')")=='Oct' and E("_v146.bsMonthShort('2026-01')")=='Jan','nombres cortos EN')
    E("()=>{LANG='es'}")
    # Joe 20 + 10 = 30 de lo enviado
    mark(pg)
    pg.screenshot(path=os.path.join(SH,'v146-joe-revisar.png'))
    pg.click('#bsok');pg.wait_for_timeout(250)
    B={b.get('sheetKey') or b['name']:b for b in E("M().bills")}
    tel=E("M().bills.find(b=>b.sheetKey==='telefono')")
    jard=E("M().bills.find(b=>b.sheetKey==='c-jardin1')")
    check(tel and tel['name']=='Teléfono casa' and abs(tel['amount']-20)<1e-9,'rename + parte de Joe 25% de 80')
    check(jard and jard['name']=='Jardín' and abs(jard['amount']-10)<1e-9 and jard['cat'] in ('📦 Otros','🏠 Hogar'),'cuenta nueva aplicada')
    check(E("JSON.stringify(S.months['2026-10'].bills)")==bills0,'octubre no cambia al aprobar nov')
    # segundo envío con el mismo key no duplica
    doc2={'id':'n2','t':'TT','link':'Tony','kind':'bills','by':'Tony','month':'2026-11','rev':1,'rows':[
      {'key':'c-jardin1','total':80,'alloc':{'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}},'name':'Jardín y patio'}]}
    E("d=>{INBOX=[d]}",doc2)
    r=E("bsApprove('n2',true)")
    check(r.get('ok'),r)
    n=E("M().bills.filter(b=>b.sheetKey==='c-jardin1').length")
    jard=E("M().bills.find(b=>b.sheetKey==='c-jardin1')")
    check(n==1 and jard['name']=='Jardín y patio' and abs(jard['amount']-20)<1e-9,'rename de nueva no duplica')
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200)
    card=pg.inner_text('#bscard') if pg.locator('#bscard').count() else ''
    check('Arianna' not in card,'tarjeta de reparto sin Arianna')

# ---- texto pendN ----
vjs=open(os.path.join(ROOT,'v.js'),encoding='utf-8').read()
check("pendN:'Enviadas desde este dispositivo: {0}'" in vjs,'pendN ES')
check("pendN:'Sent from this device: {0}'" in vjs and "pendN:'Sent from this phone:" not in vjs,'pendN EN')
with app(ROOT,now='2026-11-17T11:50:00',state=base(),new_look=True,routes=R,width=390,height=900) as pg:
    E=pg.evaluate
    doc=E("snapFor('Tony')");doc['updatedAt']=E("Date.now()");baseu='/'.join(pg.url.split('/')[:3])
    pg.add_init_script("window.__SHARE_DOC=%s;localStorage.setItem('vsent-%s','2')"%(json.dumps(doc),TOK))
    pg.goto(baseu+'/v.html?t='+TOK);pg.wait_for_timeout(800)
    body=pg.inner_text('body')
    check('Enviadas desde este dispositivo' in body,'texto visible en el enlace')

print('OK',ok)
