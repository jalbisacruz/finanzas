"""v155 (DATOS DE EJEMPLO): una sola línea Carlos→Joe, arriba y en negrita.
python tests/test_v155.py
"""
import os,copy,json,re
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
ROUTES={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';
      const d=document.getElementById(host||'')||document.getElementById('vsum')||document.getElementById('bsform');
      (d||document.body).append(w)}""", host)

ALLOC={'who':['Tony','Joe','Carlos'],'mode':'pct','pct':{'Tony':50,'Joe':25,'Carlos':25}}
TOK='AAAAAAAAAAAAAAAAAAAAAA'
PHONE=dict(now='2026-11-20T22:10:00',new_look=True,width=390,height=900)
DESK=dict(now='2026-11-20T22:10:00',new_look=True,width=1280,height=800)

def month11():
    return {'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[],
            'personal':[],'events':[],'tonyBase':0,
            'bills':[{'id':'b1','name':'Rent House','amount':800},{'id':'b2','name':'Phone','amount':60}],
            'purchases':[
                {'id':'pt','store':'Publix','date':'2026-11-04','total':100,'mode':'fam',
                 'paidBy':'Tony','method':'','shares':{'Tony':20,'Carlos':50,'Yo':30}},
                {'id':'pc','store':'Walmart','date':'2026-11-08','total':94.16,'mode':'fam',
                 'paidBy':'Carlos','method':'','shares':{'Tony':29.68,'Carlos':44.48,'Yo':20}},
                {'id':'pj','store':'Target','date':'2026-11-10','total':80,'mode':'fam',
                 'shares':{'Yo':40,'Tony':10,'Carlos':30}}
            ]}

def base():
    S=copy.deepcopy(FIX);S['cur']='2026-11';S['months']['2026-11']=month11();return S

def sheet(iid,rev=0,month='2026-11',at=None,total=1000):
    return {'id':iid,'t':'TT','link':'Tony','kind':'bills','by':'Tony','month':month,'rev':rev,
            'at':at if at is not None else 1000+rev,
            'rows':[{'key':'renta','total':total,'alloc':ALLOC}]}

def xfer_of(R,frm,to):
    for x in (R.get('transfers') or []):
        if x.get('from')==frm and x.get('to')==to:
            return round(float(x['amount']),2)
    return 0.0

def cj_count(R):
    n=0
    for x in (R.get('transfers') or []):
        a,b=x.get('from'),x.get('to')
        if (a=='Carlos' and b=='Yo') or (a=='Yo' and b=='Carlos'):
            n+=1
    return n

def first_is_cj(R):
    tr=R.get('transfers') or []
    if not tr: return False
    a,b=tr[0].get('from'),tr[0].get('to')
    return (a=='Carlos' and b=='Yo') or (a=='Yo' and b=='Carlos')

STUB="""()=>{
  window.__fs=window.__fs||{docs:{},log:[]};
  window.fbUser=()=>({uid:'u1'});
  window.fbShareSet=async(t,d)=>{window.__fs.docs['shares/'+t]=Object.assign(JSON.parse(JSON.stringify(d)),{owner:'u1'});window.__fs.log.push('shares/'+t)};
  if(window._v154&&_v154.patchShareSet)_v154.patchShareSet();
  S.links=S.links||{};
  S.links.Tony={on:true,t:'AAAAAAAAAAAAAAAAAAAAAA'};
  S.links.Carlos={on:true,t:'BBBBBBBBBBBBBBBBBBBBBB'};
}"""

def approve_and_snap(pg):
    E=pg.evaluate
    E(STUB)
    E("d=>{INBOX=[d]}", sheet('new',rev=0,at=2000,total=1000))
    r=E("bsApprove('new')")
    if not r or not r.get('ok'):
        raise AssertionError('no aprobó '+str(r))
    pg.wait_for_timeout(400)
    return E("window.__fs.docs['shares/AAAAAAAAAAAAAAAAAAAAAA']")

def open_tony(pg, doc):
    doc=copy.deepcopy(doc) if isinstance(doc,dict) else doc
    if isinstance(doc,dict) and 'updatedAt' not in doc:
        doc['updatedAt']=1
    baseu='/'.join(pg.url.split('/')[:3])
    pg.add_init_script("window.__SHARE_DOC=%s;"%json.dumps(doc))
    pg.goto(baseu+'/v.html?t='+TOK);pg.wait_for_timeout(900)

def vsum_lines(pg):
    return pg.evaluate("""()=>{
      const box=document.getElementById('vsum');if(!box)return [];
      return [...box.querySelectorAll('.row.r3x')].map(r=>{
        const cs=getComputedStyle(r.querySelector('span')||r);
        return {t:(r.innerText||'').replace(/\\s+/g,' ').trim(), w:cs.fontWeight};
      });
    }""")

def is_cj_text(t):
    return bool(re.search(r'Carlos.+(Joe|Yo)|Joe.+Carlos', t or '', re.I))

saved=None

# ---------- datos: una sola Carlos→Joe y va primero (Tony, Joe, PDF) ----------
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v155','CODE_V v155')
    saved=approve_and_snap(pg)
    RT=E("r3Data('2026-11','Tony')")
    RY=E("r3Data('2026-11','Yo')")
    RC=E("r3Data('2026-11','Carlos')")
    for name,R in (('Tony',RT),('Joe',RY),('Carlos',RC)):
        check(cj_count(R)==1, name+' una sola Carlos→Joe: '+str(R.get('transfers')))
        check(first_is_cj(R), name+' Carlos→Joe va primero: '+str(R.get('transfers')))
        check(abs(xfer_of(R,'Carlos','Yo')-10)<0.005 or abs(xfer_of(R,'Yo','Carlos')-10)<0.005,
              name+' monto 10: '+str(R.get('transfers')))
    check(abs(xfer_of(RT,'Carlos','Tony')-270.32)<0.005,'Tony sigue con Carlos→Tony 270.32')

    # si el arreglo ya trae la línea repetida, se queda una
    dup=E("""()=>{
      const R=JSON.parse(JSON.stringify(r3Data('2026-11','Tony')));
      const cj=(R.transfers||[]).find(x=>x.from==='Carlos'&&x.to==='Yo')||{from:'Carlos',to:'Yo',amount:10};
      R.transfers=(R.transfers||[]).concat([cj,JSON.parse(JSON.stringify(cj))]);
      return _v155.fixTransfers(R);
    }""")
    check(cj_count(dup)==1,'fixTransfers quita el duplicado: '+str(dup.get('transfers')))
    check(first_is_cj(dup),'fixTransfers deja Carlos→Joe arriba')

    # snapshot publicado también una vez y arriba
    r3=((saved or {}).get('months') or [{}])[0].get('r3') or {}
    check(cj_count(r3)==1,'snap Tony una sola Carlos→Joe: '+str(r3.get('transfers')))
    check(first_is_cj(r3),'snap Tony Carlos→Joe primero: '+str(r3.get('transfers')))

    # app: la tarjeta HTML (misma cifra que el PDF)
    E("""()=>{
      const R=r3Data(S.cur,'Yo');
      const v=document.getElementById('v');
      v.innerHTML=(typeof r3CardHtml==='function'?r3CardHtml(R):_v152.r3CardHtml(R));
      if(window._v155)_v155.normalizeVsum();
    }""")
    pg.wait_for_timeout(200)
    lines=vsum_lines(pg)
    cj=[x for x in lines if is_cj_text(x['t'])]
    check(len(cj)==1,'app una sola Carlos→Joe: '+str(lines))
    check(lines and is_cj_text(lines[0]['t']),'app Carlos→Joe arriba: '+str(lines))
    check(int(str(cj[0]['w']).replace('bold','700').replace('normal','400'))>=600 or str(cj[0]['w']) in ('bold','700'),
          'app en negrita: '+str(cj[0]))
    mark(pg,'vsum');pg.wait_for_timeout(80)
    pg.locator('#vsum').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v155-app-xfer-phone.png'))

# Caso real: el snapshot YA trae Carlos→Joe (como tras abrir la app en v154)
# y además lo repetimos, como si injectCjRow lo volviera a pintar.
live_doc=copy.deepcopy(saved)
r3=live_doc['months'][0]['r3']
cj={'from':'Carlos','to':'Yo','amount':10}
# leave existing + an extra copy at the end (pre-v155 snapshot order)
r3['transfers']=[t for t in r3.get('transfers') or [] if not ((t.get('from')=='Carlos' and t.get('to')=='Yo') or (t.get('from')=='Yo' and t.get('to')=='Carlos'))]
r3['transfers']+=[cj,copy.deepcopy(cj)]

def check_tony_page(pg, tag):
    lines=vsum_lines(pg)
    cj=[x for x in lines if is_cj_text(x['t'])]
    check(len(cj)==1, tag+' una sola Carlos→Joe: '+str(lines))
    check(lines and is_cj_text(lines[0]['t']), tag+' Carlos→Joe va arriba: '+str(lines))
    w=str(cj[0]['w']).replace('bold','700').replace('normal','400')
    try: wn=int(re.sub(r'[^0-9]','',w) or '0')
    except Exception: wn=0
    check(wn>=600 or w in ('bold','700'), tag+' mismo peso que las otras (negrita): '+str(cj[0])+' / '+str(lines))
    t=pg.inner_text('#vsum') if pg.locator('#vsum').count() else ''
    check('270.32' in t.replace(',','') or '$270.32' in t, tag+' sigue Carlos→Tony: '+t)
    check('Su parte de las cuentas' in t, tag+' tarjetas de persona: '+t[:200])
    return t

with app(ROOT,state=base(),new_look=True,routes=ROUTES,width=390,height=900,now='2026-11-20T22:10:00') as pg:
    open_tony(pg, live_doc)
    check_tony_page(pg,'página Tony phone')
    mark(pg,'vsum');pg.wait_for_timeout(80)
    pg.locator('#vsum').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v155-tony-page-phone.png'))

with app(ROOT,state=base(),new_look=True,routes=ROUTES,width=1280,height=800,now='2026-11-20T22:10:00') as pg:
    open_tony(pg, live_doc)
    check_tony_page(pg,'página Tony desktop')
    mark(pg,'vsum');pg.wait_for_timeout(80)
    pg.locator('#vsum').scroll_into_view_if_needed()
    pg.screenshot(path=os.path.join(SH,'v155-tony-page-desktop.png'))


# ---------- Kalshi: pérdidas al presupuesto, ganancias al ingreso ----------
KAL='📈 Kalshi'
with app(ROOT,state=base(),**PHONE) as pg:
    E=pg.evaluate
    E("""()=>{
      const m=S.months['2026-11'];
      S.budgets=S.budgets||{};
      S.budgets['📈 Kalshi']=50;
      m.events=m.events||[];
      m.events.push({id:'kwin',type:'income',date:'2026-11-04',amount:12,concept:'📈 Kalshi',desc:'Big Combo soccer',method:'deb'});
      m.personal=m.personal||[];
      m.personal.unshift({id:'kloss',date:'2026-11-21',amount:10,cat:'📈 Kalshi',desc:'Soccer Combo',method:'deb'});
    }""")
    m=E("()=>{const m=S.months['2026-11'];return {sp:spent(m),er:earned(m),exp:_v155.kalExp(m),inc:_v155.kalInc(m),bb:budBy(m)}}")
    check(abs(m['exp']-10)<0.005,'kalExp 10: '+str(m))
    check(abs(m['inc']-12)<0.005,'kalInc 12: '+str(m))
    check(abs((m['sp']['by'] or {}).get(KAL,0)-10)<0.005,'spent Kalshi es el gasto 10, no el neto: '+str(m['sp']))
    check(abs((m['er']['by'] or {}).get(KAL,0)-12)<0.005,'earned Kalshi es la ganancia 12, no el neto: '+str(m['er']))
    check(abs((m['bb']['by'] or {}).get(KAL,0)-10)<0.005,'presupuesto cuenta los 10: '+str(m['bb']))

    E("()=>{tab='rep';render()}")
    pg.wait_for_timeout(300)
    gp=pg.inner_text('#gpcard') if pg.locator('#gpcard').count() else ''
    check('Kalshi' in gp,'Kalshi en gasto/presupuesto: '+gp[:400])
    compact=gp.replace(',','').replace('\xa0','')
    check('10.00' in compact or '$10' in compact,'los $10 salen en el presupuesto: '+gp)
    # no debe mostrar solo el neto 0 o desaparecer el gasto
    check('0.00 de 50' not in compact and '0,00 de 50' not in gp,'no queda en 0 por el neto: '+gp)
    inc=pg.inner_text('#inccard') if pg.locator('#inccard').count() else ''
    check('Kalshi' in inc and ('12.00' in inc.replace(',','') or '$12' in inc),'ganancias en ingresos: '+inc[:300])
    mark(pg,'gpcard');pg.wait_for_timeout(80)
    if pg.locator('#gpcard').count():
        pg.locator('#gpcard').scroll_into_view_if_needed()
        pg.screenshot(path=os.path.join(SH,'v155-kalshi-budget-phone.png'))
    else:
        pg.screenshot(path=os.path.join(SH,'v155-kalshi-budget-phone.png'))

    E("()=>{tab='mov';filt='📈 Kalshi';movQ='';render()}")
    pg.wait_for_timeout(300)
    host='#debflows' if pg.locator('#debflows').count() else ('#bancobox' if pg.locator('#bancobox').count() else '#bal-income')
    mv=pg.inner_text(host) if pg.locator(host).count() else pg.inner_text('main')
    check('Soccer Combo' in mv,'mov pérdida Soccer Combo: '+mv[:400])
    check('Big Combo soccer' in mv,'mov ganancia Big Combo: '+mv[:400])
    check(('-' in mv or '−' in mv) and ('10.00' in mv.replace(',','') or '$10' in mv),'mov muestra -$10')
    check('+' in mv and ('12.00' in mv.replace(',','') or '$12' in mv),'mov muestra +$12')
    mark(pg,'debflows');pg.wait_for_timeout(80)
    loc=pg.locator('#debflows') if pg.locator('#debflows').count() else pg.locator('#bancobox')
    if loc.count(): loc.scroll_into_view_if_needed(); loc.screenshot(path=os.path.join(SH,'v155-kalshi-movimientos-phone.png'))
    else: pg.screenshot(path=os.path.join(SH,'v155-kalshi-movimientos-phone.png'))

print('test_v155 OK',ok)
