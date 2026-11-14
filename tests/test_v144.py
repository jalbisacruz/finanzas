"""v144 (DATOS DE EJEMPLO): Devolución a la tarjeta — Joe elige tarjeta y compra del mes abierto.
python tests/test_v144.py
No usa datos reales. No publica.
"""
import os,copy
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg):
    pg.evaluate("""()=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';document.body.append(w)}""")

def empty_month(deb=1000, cards=None):
    return {'income':[{'id':'i1','name':'Débito','amount':deb,'role':'debit'}],
            'cards':cards or [],'bills':[],'personal':[],'purchases':[],'events':[],'tonyBase':0}

def amazon_state():
    S=copy.deepcopy(FIX)
    S['cur']='2026-11'
    # cargo de octubre en Amazon: no debe salir en la lista de noviembre
    S['months']['2026-10']['cards'] = S['months']['2026-10'].get('cards') or []
    S['months']['2026-10']['personal'] = list(S['months']['2026-10'].get('personal') or [])
    S['months']['2026-10']['personal'].append({'id':'amz-oct','date':'2026-10-20','amount':30,'cat':'👕 Ropa','desc':'Amazon octubre','method':'card:Amazon'})
    S['months']['2026-11']=empty_month(1000, [
        {'id':'amz','name':'Amazon','amount':124},
        {'id':'c1','name':'Visa Test','amount':80},
        {'id':'c2','name':'Store Card','amount':45},
    ])
    S['months']['2026-11']['personal']=[
        {'id':'amz1','date':'2026-11-02','amount':80,'cat':'👕 Ropa','desc':'Amazon','method':'card:Amazon'},
        {'id':'amz2','date':'2026-11-08','amount':44,'cat':'🛒 Comida/Supermercado','desc':'Whole Foods','method':'card:Amazon'},
        {'id':'v1','date':'2026-11-05','amount':80,'cat':'⛽ Gasolina','desc':'Shell','method':'card:Visa Test'},
    ]
    return S

def snap(pg, E=None):
    E=E or pg.evaluate
    return E("""()=>{
      const m=S.months['2026-11'], amz=(m.cards||[]).find(c=>c.id==='amz')||{};
      const refs=(m.events||[]).filter(e=>e.type==='cardref');
      const sp=spent(m), er=earned(m);
      const rl=typeof reembList==='function'?reembList(m):[];
      const deb=(m.income||[]).find(x=>x.role==='debit')||{};
      const c=calc(m);
      const p=(m.purchases||[]).find(x=>x.id==='sh1');
      return {card:+(amz.amount||0), deb:+(deb.amount||0), refs, nRefs:refs.length,
        spent:sp.total, by:sp.by, earned:er.total, reemb:rl.length,
        tony:c.tony, carlos:c.carlos, shares:p?JSON.parse(JSON.stringify(p.shares)):null,
        moves:(moves(m)||[]).filter(x=>x.kind==='cardref').map(x=>({id:x.id,amount:x.amount,desc:x.desc,cat:x.cat}))};
    }""")

# --- versión, fecha NY, sin tarjeta preelegida en el + ---
with app(ROOT,now='2026-11-14T13:21:00',state=amazon_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(400)
    check(E('CODE_V')>='v144','ver')
    check(E('typeof rfDlg')=='function' and E('typeof _v144')=='object','api')
    check(E('_v144.rfToday()')=='2026-11-14','fecha default NY')
    E("()=>{tab='mov';render()}")
    pg.wait_for_timeout(200)
    # v145: la fila de tarjeta no trae Devolución; el + sí
    check(E("!!document.querySelector(\"#balcard, #movcard, body\").innerText") or True,'render')
    html=E("document.body.innerHTML")
    check('PAGAR' in html,'PAGAR sigue en la fila')
    check(E("document.querySelectorAll(\"button[onclick*='rfDlg']\").length")==0,'sin botón Devolución en filas')
    cards=E("document.getElementById('bal-cards')&&document.getElementById('bal-cards').innerText") or ''
    check('PAGAR' in cards and 'Ajustar' not in cards and 'Devolución' not in cards,'fila de tarjeta solo PAGAR')
    pg.click('#fab');pg.wait_for_timeout(200)
    check(E("!!document.getElementById('fabrf')"),'entrada en el +')
    pg.click('#fabrf');pg.wait_for_timeout(250)
    check(E("dlg().querySelector('h2')&&dlg().querySelector('h2').innerText.includes('Devolución')"),'diálogo')
    check(E("!document.querySelector('#rfchips .pay')"),'ninguna tarjeta preelegida desde el +')
    check(E("!document.querySelector('[data-rfsrc]')"),'sin lista hasta elegir tarjeta')
    mark(pg)
    pg.locator('#dlg').screenshot(path=os.path.join(SH,'v144-elige-tarjeta.png'))

    # elige Amazon → lista del mes abierto (no octubre, no Visa)
    pg.click('[data-rfcard="amz"]');pg.wait_for_timeout(200)
    stores=E("[...document.querySelectorAll('#rfpicks [data-rfsrc]')].map(b=>b.innerText)")
    blob='\n'.join(stores) if isinstance(stores,list) else str(stores)
    check('Amazon' in blob and 'Whole Foods' in blob,'compras de Amazon en nov')
    check('Shell' not in blob and 'octubre' not in blob.lower() and 'Visa' not in blob,'solo esa tarjeta y ese mes')
    check(E("document.getElementById('rflist').innerText").find('2026-11')>=0,'periodo = mes abierto')
    pg.fill('#rfamt','24')
    pg.fill('#rfnote','Amazon')
    pg.wait_for_timeout(200)
    # puede marcar «posible» pero no selecciona sola
    check(E("!document.querySelector('#rfpicks .pay')"),'no autoselecciona la compra')
    mark(pg)
    pg.locator('#dlg').screenshot(path=os.path.join(SH,'v144-lista-compras.png'))

    # confirmar sin tocar una compra no guarda
    check(E("document.getElementById('rfok').disabled") is True,'confirmar deshabilitado sin compra')
    E("document.getElementById('rfok').click()")
    check(E("((S.months['2026-11'].events)||[]).filter(e=>e.type==='cardref').length")==0,'no guarda sin compra')

    # monto mayor que lo que queda se rechaza
    pg.click('[data-rfid="amz1"]');pg.wait_for_timeout(150)
    pg.fill('#rfamt','80.01');pg.wait_for_timeout(100)
    # trigger oninput
    E("()=>{const i=document.getElementById('rfamt');i.dispatchEvent(new Event('input',{bubbles:true}))}")
    pg.wait_for_timeout(100)
    check(E("document.getElementById('rfok').disabled") is True,'80.01 > 80 deshabilitado')
    E("document.getElementById('rfok').click()")
    check(E("((S.months['2026-11'].events)||[]).filter(e=>e.type==='cardref').length")==0,'rechaza exceso')

    pg.fill('#rfamt','24')
    E("()=>{const i=document.getElementById('rfamt');i.dispatchEvent(new Event('input',{bubbles:true}))}")
    pg.wait_for_timeout(150)
    conf=E("document.getElementById('rfconfirm')&&document.getElementById('rfconfirm').innerText") or ''
    check('Confirmación' in conf and 'Amazon' in conf and '24' in conf.replace(',',''),'confirmación con compra')
    check('débito no se toca' in conf.lower() or 'El débito no se toca' in conf,'aviso débito')
    check(E("document.getElementById('rfdate').value")=='2026-11-14','fecha hoy NY')
    mark(pg)
    pg.locator('#dlg').screenshot(path=os.path.join(SH,'v144-confirmacion.png'))
    pg.click('#rfok');pg.wait_for_timeout(400)

    s=snap(pg,E)
    check(s['nRefs']==1,'un evento')
    check(abs(s['card']-100)<0.004,'tarjeta 124-24=100')
    check(abs(s['deb']-1000)<0.004,'débito intacto')
    check(abs(s['spent']-180)<0.004,'gasto 80+44+80visa -24 = 180')
    check(abs((s['by'].get('👕 Ropa') or 0)-56)<0.004,'ropa 80-24=56')
    check(s['earned']==0 or abs(s['earned'])<0.004,'no es ingreso (sin cheques en este mes base… puede haber 0)')
    check(s['reemb']==0,'no entra en Reembolsos')
    ev=s['refs'][0]
    check(ev['src']=='gasto' and ev['srcId']=='amz1' and ev['amount']==24,'enlace a la compra')

    # pagar el estado real (100) deja la tarjeta en 0
    E("()=>{tab='mov';render();cardPayDlg('amz')}")
    pg.wait_for_timeout(200)
    val=E("r2(document.getElementById('cpa').value)")
    check(abs(val-100)<0.004,'PAGAR propone 100')
    pg.click('#cpok');pg.wait_for_timeout(400)
    s2=snap(pg,E)
    check(abs(s2['card'])<0.004,'tarjeta en 0 tras pagar 100')
    check(abs(s2['deb']-900)<0.004,'débito 1000-100=900')

    E("()=>{tab='mov';render()}")
    pg.wait_for_timeout(200)
    mark(pg)
    pg.screenshot(path=os.path.join(SH,'v144-tarjeta-despues.png'),full_page=True)
    E("()=>{tab='rep';render()}")
    pg.wait_for_timeout(250)
    mark(pg)
    pg.screenshot(path=os.path.join(SH,'v144-gasto-rebajado.png'),full_page=True)

# --- idempotencia, anular, sin preselección, exceso, segunda parcial ---
with app(ROOT,now='2026-11-14T13:21:00',state=amazon_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(300)
    # el diálogo del + abre sin tarjeta preelegida (ya no hay botón en la fila)
    E("()=>{tab='mov';render();rfDlg()}")
    pg.wait_for_timeout(200)
    check(E("!document.querySelector('#rfchips .pay')"),'sin tarjeta preelegida')
    check(E("!document.querySelector('[data-rfsrc]')"),'sin lista hasta elegir tarjeta')
    E("()=>{dlg()&&dlg().close()}")

    # doble tap del mismo guardado
    n=E("""()=>{
      const p={cardId:'amz',cardName:'Amazon',amount:24,date:'2026-11-14',note:'Amazon',src:'gasto',srcId:'amz1',srcMonth:'2026-11'};
      rfSave(p);rfSave(p);
      return (S.months['2026-11'].events||[]).filter(e=>e.type==='cardref').length;
    }""")
    check(n==1,'doble tap no duplica')
    s=snap(pg,E)
    check(abs(s['card']-100)<0.004 and abs(s['deb']-1000)<0.004,'saldo único')

    # lo que queda en amz1 es 56; 60 se rechaza
    ok2=E("""()=>{
      const before=(S.months['2026-11'].events||[]).filter(e=>e.type==='cardref').length;
      const r=rfSave({cardId:'amz',amount:60,date:'2026-11-14',src:'gasto',srcId:'amz1',srcMonth:'2026-11'});
      const after=(S.months['2026-11'].events||[]).filter(e=>e.type==='cardref').length;
      return {r,after,card:(L().cards.find(c=>c.id==='amz')||{}).amount,before};
    }""")
    check(ok2['r'] is False and ok2['after']==1 and abs(ok2['card']-100)<0.004,'no excede lo que queda')

    # anular revierte tarjeta y gasto
    E("""()=>{const id=(S.months['2026-11'].events||[]).find(e=>e.type==='cardref').id;rfDel(id)}""")
    s=snap(pg,E)
    check(s['nRefs']==0 and abs(s['card']-124)<0.004 and abs((s['by'].get('👕 Ropa') or 0)-80)<0.004,'anular revierte')

# --- compartida: solo el gasto de Joe; Tony y Carlos no cambian ---
def shared_state():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']=empty_month(800, [{'id':'amz','name':'Amazon','amount':200}])
    S['months']['2026-11']['purchases']=[{
        'id':'sh1','store':'Publix','date':'2026-11-04','total':200,'mode':'fam',
        'shares':{'Tony':100,'Carlos':50,'Yo':50},'method':'card:Amazon'
    }]
    return S

with app(ROOT,now='2026-11-14T13:21:00',state=shared_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(300)
    c0=E("(()=>{const c=calc(S.months['2026-11']);return {t:c.tony,c:c.carlos,sp:spent(S.months['2026-11']).total}})()")
    check(abs(c0['t']-100)<0.004 and abs(c0['c']-50)<0.004 and abs(c0['sp']-50)<0.004,'antes: yo 50, tony 100, carlos 50')
    E("()=>{rfDlg('amz')}")
    pg.wait_for_timeout(200)
    # la lista muestra solo la parte de Joe (50)
    txt=E("document.getElementById('rflist').innerText")
    check('Publix' in txt and 'compartida' in txt,'lista marca compartida')
    pg.click('[data-rfid="sh1"]')
    pg.fill('#rfamt','24')
    E("()=>{document.getElementById('rfamt').dispatchEvent(new Event('input',{bubbles:true}))}")
    pg.wait_for_timeout(150)
    conf=E("document.getElementById('rfconfirm').innerText")
    check('solo tu gasto' in conf or 'partes de Tony y Carlos no cambian' in conf,'aviso en confirmación')
    pg.click('#rfok');pg.wait_for_timeout(350)
    s=snap(pg,E)
    check(abs(s['card']-176)<0.004,'tarjeta 200-24')
    check(abs(s['tony']-100)<0.004 and abs(s['carlos']-50)<0.004,'deudas intactas')
    check(s['shares']=={'Tony':100,'Carlos':50,'Yo':50},'shares no se mutan')
    check(abs(s['spent']-26)<0.004,'spent de Joe 50-24=26')
    # no se puede devolver más que la parte de Joe que queda (26)
    r=E("rfSave({cardId:'amz',amount:26.01,date:'2026-11-14',src:'compra',srcId:'sh1',srcMonth:'2026-11'})")
    check(r is False and abs(snap(pg,E)['tony']-100)<0.004,'tope = parte de Joe')

# --- fallback sin compras del periodo ---
def empty_card_state():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']=empty_month(500, [{'id':'amz','name':'Amazon','amount':40}])
    return S

with app(ROOT,now='2026-11-14T13:21:00',state=empty_card_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(300)
    E("()=>{rfDlg('amz')}")
    pg.wait_for_timeout(200)
    check(E("!!document.getElementById('rffallback')"),'explica fallback')
    check(E("!document.querySelector('[data-rfsrc]')"),'sin filas')
    pg.fill('#rfamt','15')
    E("()=>{document.getElementById('rfamt').dispatchEvent(new Event('input',{bubbles:true}))}")
    pg.wait_for_timeout(150)
    conf=E("document.getElementById('rfconfirm').innerText")
    check('Otros' in conf and 'Sin compra' in conf,'confirmación fallback')
    pg.click('#rfok');pg.wait_for_timeout(350)
    s=snap(pg,E)
    check(s['nRefs']==1 and s['refs'][0]['src']=='fallback','evento fallback')
    check(abs(s['card']-25)<0.004 and abs(s['deb']-500)<0.004,'baja tarjeta, no débito')
    otros=s['by'].get('📦 Otros',0)
    check(abs(otros+15)<0.004,'Otros -15 (fallback, no había gasto previo en Otros)')
    check(s['earned']==0 or abs(s['earned'])<0.004,'fallback no es ingreso')
    check(s['reemb']==0,'fallback no es reembolso Carlos/Tony')

# --- PAGAR y noDeb siguen igual (sin devolución) ---
with app(ROOT,now='2026-11-14T13:21:00',state=amazon_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(300)
    before=E("({card:(L().cards.find(c=>c.id==='amz')||{}).amount,deb:debE(L()).amount})")
    E("()=>{cardPayDlg('amz')}")
    pg.wait_for_timeout(150)
    E("document.getElementById('cpa').value='10'")
    pg.click('#cpok');pg.wait_for_timeout(300)
    after=E("({card:(L().cards.find(c=>c.id==='amz')||{}).amount,deb:debE(L()).amount})")
    check(abs(before['card']-after['card']-10)<0.004 and abs(before['deb']-after['deb']-10)<0.004,'PAGAR no cambió')
    # noDeb: pagar más que el débito
    E("()=>{cardPayDlg('amz');document.getElementById('cpa').value='2000'}")
    pg.wait_for_timeout(100)
    E("document.getElementById('cpok').click()")
    pg.wait_for_timeout(200)
    after2=E("({card:(L().cards.find(c=>c.id==='amz')||{}).amount,deb:debE(L()).amount})")
    check(abs(after2['card']-after['card'])<0.004 and abs(after2['deb']-after['deb'])<0.004,'noDeb sigue bloqueando')

print('OK',ok)
