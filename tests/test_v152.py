"""v152 (DATOS DE EJEMPLO): parte de Carlos en las cuentas aprobadas entra en
«Quién transfiere a quién»; aviso de Tony no reaparece tras aprobar; estados
Pendiente/Aprobada; un PDF por persona. python tests/test_v152.py
"""
import os,copy,json,base64
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

def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';
      const d=document.getElementById(host||'')||document.getElementById('vsum')||document.getElementById('bsform')||document.getElementById('vbsent')||document.getElementById('dlg');
      (d&&(d.querySelector&&(d.querySelector('.vbbox')||d.open))?d:document.body).append(w)}""", host)

ALLOC={'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}}
TOK='AAAAAAAAAAAAAAAAAAAAAA'
PHONE=dict(now='2026-11-20T22:10:00',new_look=True,width=390,height=900)
DESK=dict(now='2026-11-20T22:10:00',new_look=True,width=1280,height=800)

def month11():
    # Compras: Carlos le debe a Tony $20.32 (solo compras, como en la queja de Joe)
    return {'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[],
            'personal':[],'events':[],'tonyBase':0,
            'bills':[{'id':'b1','name':'Rent House','amount':800},{'id':'b2','name':'Phone','amount':60}],
            'purchases':[
                {'id':'pt','store':'Publix','date':'2026-11-04','total':100,'mode':'fam',
                 'paidBy':'Tony','method':'','shares':{'Tony':20,'Carlos':50,'Yo':30}},
                {'id':'pc','store':'Walmart','date':'2026-11-08','total':94.16,'mode':'fam',
                 'paidBy':'Carlos','method':'','shares':{'Tony':29.68,'Carlos':44.48,'Yo':20}},
                # Compra de Joe: Carlos le debe a Joe $30 de compras (no toca Carlos↔Tony)
                {'id':'pj','store':'Target','date':'2026-11-10','total':80,'mode':'fam',
                 'shares':{'Yo':40,'Tony':10,'Carlos':30}}
            ]}

def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11';S['months']['2026-11']=month11();return S

def sheet(iid,rev=0,month='2026-11',at=None,total=1000):
    return {'id':iid,'t':'TT','link':'Tony','kind':'bills','by':'Tony','month':month,'rev':rev,
            'at':at if at is not None else 1000+rev,
            'rows':[{'key':'renta','total':total,'alloc':ALLOC}]}

def show_card(pg,who='Yo'):
    pg.evaluate("""who=>{
      const R=r3Data('2026-11',who);
      document.getElementById('v').innerHTML=_v152.r3CardHtml(R);
    }""", who)

def xfer_of(R,frm,to):
    for x in (R.get('transfers') or []):
        if x.get('from')==frm and x.get('to')==to:
            return round(float(x['amount']),2)
    return 0.0

def open_tony(pg, doc, clear=True):
    E=pg.evaluate
    if doc is None:
        doc=E("snapFor('Tony')")
    doc=copy.deepcopy(doc) if isinstance(doc,dict) else doc
    if isinstance(doc,dict) and 'updatedAt' not in doc:
        doc['updatedAt']=1
    baseu='/'.join(pg.url.split('/')[:3])
    pg.add_init_script("window.__SHARE_DOC=%s;"%json.dumps(doc))
    pg.goto(baseu+'/v.html?t='+TOK);pg.wait_for_timeout(800)
    if clear:
        E("()=>{try{localStorage.removeItem('vbills-%s-2026-11');localStorage.removeItem('vbills-sent-%s-2026-11')}catch(e){}}"% (TOK,TOK))
        pg.reload();pg.wait_for_timeout(800)
    return E

def save_pdf(pg, kind, path):
    b64=pg.evaluate("""async kind=>{
      await loadPDF();
      const k='2026-11';
      const doc=kind==='joe'?pdfMonth(k):kind==='tony'?pdfTony(k):pdfCarlos(k);
      const n=doc.getNumberOfPages();
      for(let i=1;i<=n;i++){
        doc.setPage(i);
        doc.setFont('helvetica','bold');doc.setFontSize(32);
        doc.setTextColor(185,28,28);
        try{doc.setGState(new doc.GState({opacity:0.2}))}catch(e){}
        doc.text('DATOS DE EJEMPLO',306,420,{align:'center',angle:-18});
      }
      const a=new Uint8Array(doc.output('arraybuffer'));
      let s='';for(const x of a)s+=String.fromCharCode(x);
      return btoa(s);
    }""", kind)
    Path=os.path
    open(path,'wb').write(base64.b64decode(b64))
    return os.path.getsize(path)

# ---------- 1) bug: tras aprobar, Carlos→Tony incluye su parte de las cuentas ----------
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v152','CODE_V v152')
    R0=E("r3Data('2026-11','Yo')")
    check(abs(xfer_of(R0,'Carlos','Tony')-20.32)<0.005,'antes solo compras 20.32: '+str(R0.get('transfers')))
    check(abs((R0.get('people') or {}).get('Carlos',{}).get('bills') or 0)<0.005,'sin parte de cuentas antes')
    tc=next(p for p in R0['pairs'] if {p['a'],p['b']}=={'Carlos','Tony'})
    check(not any('cuentas' in (x.get('l') or '').lower() for x in tc['lines']),'sin línea de cuentas antes')
    show_card(pg);mark(pg,'vsum');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v152-xfer-antes-phone.png'))

    E("d=>{INBOX=[d]}", sheet('new',rev=0,at=2000,total=1000))
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==1,'aviso antes de aprobar')
    # Las compras no se tocan; calc() sigue igual en la parte de compras.
    c0=E("calc(M())")
    r=E("bsApprove('new')")
    check(r.get('ok'),'aprobó '+str(r))
    c1=E("calc(M())")
    for k in ('tony','carlos','joeCS','joeOwesCarlos'):
        check(abs((c1.get(k) or 0)-(c0.get(k) or 0))<0.005,'calc compras (%s) no cambia: %s → %s'%(k,c0.get(k),c1.get(k)))
    R1=E("r3Data('2026-11','Yo')")
    check(abs(xfer_of(R1,'Carlos','Tony')-270.32)<0.005,'después compras+cuentas 270.32: '+str(R1.get('transfers')))
    tc=next(p for p in R1['pairs'] if {p['a'],p['b']}=={'Carlos','Tony'})
    purch=sum(x['v'] for x in tc['lines'] if 'cuentas' not in (x.get('l') or '').lower())
    check(abs(purch-20.32)<0.005,'las líneas de compras siguen en 20.32: '+str(tc['lines']))
    check(abs((R1['people']['Carlos']['bills'] or 0)-250)<0.005,'Carlos su parte de las cuentas 250')
    check(abs((R1['people']['Yo']['bills'] or 0)-250)<0.005,'Joe su parte de las cuentas 250')
    check(abs((R1['people']['Tony']['bills'] or 0)-500)<0.005,'Tony su parte de las cuentas 500')
    tc=next(p for p in R1['pairs'] if {p['a'],p['b']}=={'Carlos','Tony'})
    check(any('cuentas de Tony' in (x.get('l') or '') for x in tc['lines']),'línea Parte de Carlos en las cuentas')
    check(R1.get('billsFull') is True,'PDF de Joe trae todas las partes')
    # Tony/Carlos: solo sus parejas, pero sí la parte de cuentas
    RT=E("r3Data('2026-11','Tony')")
    check(all(p['a']=='Tony' or p['b']=='Tony' for p in RT['pairs']),'Tony solo sus parejas')
    check(abs(xfer_of(RT,'Carlos','Tony')-270.32)<0.005,'Tony ve la deuda de Carlos con cuentas')
    check(not any((p['a']=='Carlos' and p['b']=='Yo') or (p['a']=='Yo' and p['b']=='Carlos') for p in RT['pairs']),'Tony no ve Joe-Carlos')
    RC=E("r3Data('2026-11','Carlos')")
    check(all(p['a']=='Carlos' or p['b']=='Carlos' for p in RC['pairs']),'Carlos solo sus parejas')
    check(abs(xfer_of(RC,'Carlos','Tony')-270.32)<0.005,'Carlos ve su deuda con cuentas')
    show_card(pg);mark(pg,'vsum');pg.wait_for_timeout(80)
    t=pg.inner_text('#vsum')
    check('Su parte de las cuentas' in t and '270.32' in t.replace(',','') or '$270.32' in t,'tarjeta después: '+t)
    pg.screenshot(path=os.path.join(SH,'v152-xfer-despues-phone.png'))
    # Reparto de cuentas: Carlos → Tony (cuentas+compras) y Carlos → Joe (compras)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(250)
    check(pg.locator('#bscard').count()==1,'tarjeta Reparto de cuentas')
    card=pg.inner_text('#bscard')
    check('Carlos → Tony' in card and ('$270.32' in card or '270.32' in card.replace(',','')),'card Carlos→Tony 270.32: '+card)
    check('cuentas' in card.lower() and 'compras' in card.lower(),'desglose cuentas+compras: '+card)
    fl=E("_v152.carlosFlows(M())")
    check(abs((fl.get('toTony') or 0)-270.32)<0.005 and abs((fl.get('billsTony') or 0)-250)<0.005 and abs((fl.get('purchTony') or 0)-20.32)<0.005,fl)
    # compras con Joe: Carlos 30 − parte de Joe en lo que pagó Carlos 20 = 10
    check('Carlos → Joe' in card and ('$10.00' in card or '10.00' in card),'card Carlos→Joe 10: '+card)
    check(abs((fl.get('pendJoe') or 0)-10)<0.005,'pendJoe 10: '+str(fl))
    # coherente con Quién transfiere a quién
    check(abs(xfer_of(R1,'Carlos','Tony')-fl['toTony'])<0.005 and abs(xfer_of(R1,'Carlos','Yo')-fl['pendJoe'])<0.005,'tarjeta y resumen coinciden')
    mark(pg);pg.locator('#bscard').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v152-reparto-despues-phone.png'))
    # aviso desaparece
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==0,'aviso desaparece al aprobar')
    saved=E("()=>JSON.parse(localStorage.getItem('finanzas-v1'))")

# escritorio: misma tarjeta después de aprobar
with app(ROOT,state=saved,**DESK) as pg:
    E=pg.evaluate
    show_card(pg);mark(pg,'vsum');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v152-xfer-despues-desktop.png'))
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200)
    mark(pg);pg.locator('#bscard').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v152-reparto-despues-desktop.png'))

# ---------- 2) el aviso no reaparece (viejos, recarga); sí vuelve con un update ----------
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    E("d=>{INBOX=d}", [sheet('old',rev=0,at=1000,total=800),sheet('new',rev=0,at=2000,total=1000)])
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice .bsrev').count()==1,'un aviso, el nuevo')
    r=E("bsApprove('new')");check(r.get('ok'),'aprobó el nuevo')
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==0,'sin aviso tras aprobar')
    # un envío viejo (incluso si no estaba en handled) no reaparece
    E("d=>{INBOX=d}", [sheet('old',rev=0,at=1000,total=800),sheet('new',rev=0,at=2000,total=1000),sheet('ghost',rev=0,at=500,total=700)])
    E("()=>{tab='ini';render();if(typeof inboxList==='function')inboxList()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==0 and pg.locator('#bsrow-ghost').count()==0,'viejos no reaparecen, tampoco en el buzón')
    saved2=E("()=>JSON.parse(localStorage.getItem('finanzas-v1'))")

# recarga / otro dispositivo: mismo S (se sincroniza), inbox con los docs viejos
with app(ROOT,state=saved2,**PHONE) as pg:
    E=pg.evaluate
    E("d=>{INBOX=d}", [sheet('old',rev=0,at=1000,total=800),sheet('new',rev=0,at=2000,total=1000),sheet('ghost',rev=0,at=500,total=700)])
    E("()=>{tab='ini';render();if(typeof inboxList==='function')inboxList()}");pg.wait_for_timeout(250)
    check(pg.locator('#bsnotice').count()==0,'tras recargar, sin aviso')
    # Cuentas tampoco
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==0,'sin aviso en Cuentas/Operaciones')
    # Tony envía una actualización más nueva → un solo aviso
    E("d=>{INBOX=(INBOX||[]).concat(d)}", [sheet('upd',rev=1,at=9000,total=1100)])
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
    check(pg.locator('#bsnotice').count()==1 and pg.locator('#bsrev-upd').count()==1,'el update sí aparece, una vez')
    check(pg.locator('#bsrev-old').count()==0 and pg.locator('#bsrev-ghost').count()==0,'viejos siguen ocultos')
    mark(pg);pg.locator('#bsnotice').scroll_into_view_if_needed();pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v152-aviso-update-phone.png'))

# ---------- 3) hoja de Tony: Pendiente / Aprobada + hint en la tarjeta ----------
with app(ROOT,state=base(),new_look=True,routes=R,width=390,height=900,now='2026-11-20T22:10:00') as pg:
    E=pg.evaluate
    doc=E("snapFor('Tony')")
    doc['billSheet']['pending']=True
    doc['billSheet']['approved']=False
    if doc.get('months') and doc['months'][0].get('r3'):
        doc['months'][0]['r3']['sheetPending']=True
    E=open_tony(pg,doc,clear=True)
    E("""()=>{localStorage.setItem('vbills-sent-%s-2026-11',JSON.stringify({rev:0,at:Date.now()}));
         const k='vbills-%s-2026-11';let o={};try{o=JSON.parse(localStorage.getItem(k)||'{}')}catch(e){}
         o.sent=true;localStorage.setItem(k,JSON.stringify(o));
         if(window.vBillsDraw)vBillsDraw();if(window._v152){_v152.enhanceVsum&&_v152.enhanceVsum()}}"""%(TOK,TOK))
    pg.wait_for_timeout(300)
    st=pg.inner_text('#bsst') if pg.locator('#bsst').count() else ''
    check('Pendiente de aprobación' in st or pg.locator('#bsst').count()==1,'pendiente: '+st)
    # hint en la tarjeta si está
    if pg.locator('#vsum').count():
        hint=pg.inner_text('#vsum')
        check('Falta aprobar la hoja de Tony' in hint or pg.locator('#vsumpend').count()==1,'hint en tarjeta: '+hint[:200])
    mark(pg,'bsform');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v152-tony-pendiente-phone.png'))

with app(ROOT,state=base(),new_look=True,routes=R,width=1280,height=800,now='2026-11-20T22:10:00') as pg:
    E=pg.evaluate
    doc=E("snapFor('Tony')")
    doc['billSheet']['pending']=True
    E=open_tony(pg,doc,clear=True)
    E("""()=>{localStorage.setItem('vbills-sent-%s-2026-11',JSON.stringify({rev:0,at:1}));
         if(window.vBillsDraw)vBillsDraw()}"""%TOK)
    pg.wait_for_timeout(300)
    mark(pg,'bsform');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v152-tony-pendiente-desktop.png'))

# Aprobada: Joe aprueba, el snapshot ya trae from=k
with app(ROOT,state=base(),new_look=True,routes=R,width=390,height=900,now='2026-11-20T22:10:00') as pg:
    E=pg.evaluate
    E("d=>{INBOX=[d]}", sheet('new',rev=0,at=2000,total=1000))
    r=E("bsApprove('new')");check(r.get('ok'),'aprobó para snapshot')
    doc=E("snapFor('Tony')")
    check(doc['billSheet'].get('approved') is True or doc['billSheet'].get('from')==doc['billSheet'].get('k'),'snap aprobado: '+str(doc['billSheet']))
    # r3 del mes actual debe incluir la parte de Carlos
    r3=(doc.get('months') or [{}])[0].get('r3') or {}
    check(abs(xfer_of(r3,'Carlos','Tony')-270.32)<0.005,'snap r3 con cuentas: '+str(r3.get('transfers')))
    E=open_tony(pg,doc,clear=True)
    pg.wait_for_timeout(400)
    if window_ok := True:
        # vBillsDraw after snap approved
        txt=pg.inner_text('#bsst') if pg.locator('#bsst').count() else pg.inner_text('body')
        check('Aprobada' in txt,'aprobada en la hoja: '+txt[:180])
    if pg.locator('#vsum').count():
        t=pg.inner_text('#vsum')
        check('Falta aprobar' not in t,'sin hint una vez aprobada')
        # after enhance, bills line may appear from snapshot people.bills
    mark(pg,'bsform');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v152-tony-aprobada-phone.png'))

with app(ROOT,state=base(),new_look=True,routes=R,width=1280,height=800,now='2026-11-20T22:10:00') as pg:
    E=pg.evaluate
    E("d=>{INBOX=[d]}", sheet('new',rev=0,at=2000,total=1000))
    E("bsApprove('new')")
    doc=E("snapFor('Tony')")
    open_tony(pg,doc,clear=True)
    pg.wait_for_timeout(400)
    mark(pg,'bsform');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'v152-tony-aprobada-desktop.png'))

# ---------- 4) un PDF por persona (falsos, con marca DATOS DE EJEMPLO) ----------
PDFS={}
with app(ROOT,state=base(),**DESK) as pg:
    E=pg.evaluate
    E("d=>{INBOX=[d]}", sheet('new',rev=0,at=2000,total=1000))
    E("bsApprove('new')")
    # Joe: completo
    RJ=E("r3Data('2026-11','Yo')")
    check(len(RJ.get('pairs') or [])>=3,'Joe ve las 3 parejas')
    check(RJ.get('billsFull') is True and RJ.get('showBills') is True,'Joe: cuentas con todas las partes')
    check(any(b.get('sp') and abs((b['sp'].get('Carlos') or 0)-250)<0.005 for b in RJ.get('bills') or []),'Joe ve parte de Carlos en la renta')
    RT=E("r3Data('2026-11','Tony')")
    check(RT.get('billsFull') in (False,None),'Tony no lleva la tabla completa de todos')
    check(all(p['a']=='Tony' or p['b']=='Tony' for p in RT['pairs']),'PDF Tony solo su resumen')
    RC=E("r3Data('2026-11','Carlos')")
    check(all(p['a']=='Carlos' or p['b']=='Carlos' for p in RC['pairs']),'PDF Carlos solo su resumen')
    bd=RC.get('breakDown') or {}
    titles=[s.get('h') for s in (bd.get('sections') or [])]
    check(bd.get('title') in ('De dónde sale tu total','Where your total comes from') or 'De dónde' in str(bd.get('title')),'desglose título: '+str(bd.get('title')))
    check(any(h and 'Cuentas' in h for h in titles) and any(h and 'Compras' in h for h in titles) and any(h and 'transferir' in (h or '').lower() or 'Tony' in str(s.get('rows')) for h,s in zip(titles,bd.get('sections') or [])),'secciones cuentas/compras/split: '+str(titles))
    split=next((s for s in (bd.get('sections') or []) if s.get('h') and 'transferir' in s['h'].lower()),None)
    check(split and any('Tony' in str(r[0]) and '270.32' in str(r[1]).replace(',','') for r in split.get('rows') or []),'split A Tony 270.32: '+str(split))
    check(split and any('Joe' in str(r[0]) and '10.00' in str(r[1]).replace(',','') for r in split.get('rows') or []),'split A Joe 10: '+str(split))
    cuentas=next((s for s in (bd.get('sections') or []) if s.get('h')=='Cuentas'),None)
    check(cuentas and any('Renta' in str(r[0]) or 'Rent' in str(r[0]) for r in cuentas.get('rows') or []),'cada cuenta + su parte: '+str(cuentas))
    for kind,name in [('joe','v152-joe-resumen.pdf'),('tony','v152-tony.pdf'),('carlos','v152-carlos.pdf')]:
        path=os.path.join(SH,name)
        sz=save_pdf(pg,kind,path)
        check(sz>1000,name+' size '+str(sz))
        PDFS[kind]=path
        check(open(path,'rb').read(5)==b'%PDF-','es un PDF: '+name)

# capturas de la 1ª página de cada PDF (si hay pdftoppm)
import shutil,subprocess
if shutil.which('pdftoppm'):
    for kind,path in PDFS.items():
        out=os.path.join(SH,'v152-%s-pdf'%kind)
        subprocess.check_call(['pdftoppm','-png','-r','120','-f','1','-l','1',path,out])
        # pdftoppm writes out-1.png
        src=out+'-1.png'
        dst=os.path.join(SH,'v152-%s-pdf-p1.png'%kind)
        if os.path.exists(src):
            os.replace(src,dst)

print('test_v152 OK',ok)
print('PDFs:',PDFS)
