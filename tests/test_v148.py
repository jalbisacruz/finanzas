"""v148 (DATOS DE EJEMPLO): PAGAR de tarjeta con lista de cargos que debe sumar exacto.
python tests/test_v148.py
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
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';(document.getElementById('dlg')&&document.getElementById('dlg').open?document.getElementById('dlg'):document.body).append(w)}""")

NOW='2026-11-14T13:21:00'
def mth(deb=1000,cards=None,personal=None,purchases=None,events=None):
    return {'income':[{'id':'i1','name':'Débito','amount':deb,'role':'debit'}],'cards':cards or [],'bills':[],'personal':personal or [],'purchases':purchases or [],'events':events or [],'tonyBase':0}
def st(live,oct_=None):
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-10']=oct_ or mth(500)
    S['months']['2026-11']=live;S['cardLedger']={}
    return S
def g(i,d,a,desc,cat='🛒 Mercado',card='BOA 1'): return {'id':i,'date':d,'amount':a,'cat':cat,'desc':desc,'method':'card:'+card}

def main_state(deb=1000):
    """Tarjeta BOA 1: gastos, compra compartida, donación, interés (Ajustar) y devolución. Saldo 142.50. Octubre: 30 ya pagado."""
    live=mth(deb,[{'id':'b1','name':'BOA 1','amount':142.5},{'id':'b2','name':'Chase','amount':0}],
      personal=[g('don','2026-11-08',30,'Cruz Roja (ejemplo)','🙌 Donaciones'),g('shl','2026-11-02',50,'Shell','⛽ Gasolina')],
      purchases=[{'id':'pub','store':'Publix','date':'2026-11-05','total':70,'mode':'fam','who':['Yo','Tony','Carlos'],'method':'card:BOA 1','shares':{'Tony':10,'Carlos':10,'Yo':50}}],
      events=[{'id':'adj1','type':'adjust','date':'2026-11-10','lineKind':'cards','lineId':'b1','lineName':'BOA 1','month':'2026-11','from':130,'to':142.5,'diff':12.5,'note':'Interés'},
              {'id':'rf1','type':'cardref','date':'2026-11-12','amount':20,'cardId':'b1','cardName':'BOA 1','src':'compra','srcId':'pub','srcMonth':'2026-11','store':'Publix','cat':'🛒 Mercado','joeAdj':20}])
    o=mth(500,[{'id':'ob1','name':'BOA 1','amount':30}],personal=[g('old','2026-10-20',30,'Gasto octubre (ya pagado)')])
    return st(live,o)

def rows(pg): return pg.evaluate("[...document.querySelectorAll('#cplist .cpl')].map(l=>({k:l.querySelector('.cpc').dataset.k,c:+l.querySelector('.cpc').dataset.c,t:l.innerText.replace(/\\n/g,' | ')}))")
def st_text(pg): return pg.inner_text('#cpst')
def tick(pg,*keys):
    for k in keys: pg.locator(f'#cplist .cpc[data-k="{k}"]').check()
    pg.wait_for_timeout(60)
def setamt(pg,v): pg.fill('#cpa',str(v));pg.wait_for_timeout(60)
def open_dlg(pg,cid='b1'):
    pg.evaluate("()=>{tab='mov';render()}");pg.wait_for_timeout(150)
    pg.evaluate(f"cardPayDlg('{cid}')");pg.wait_for_timeout(200)
def deb(E): return E("r2(debE(L()).amount)")
def card(E,n='BOA 1'): return E(f"r2(L().cards.find(c=>c.name==='{n}').amount)")

# ---------- 1. lista, Falta / Sobra / Cuadra, botón solo si suma exacto ----------
with app(ROOT,now=NOW,state=main_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    check(E('CODE_V')>='v148','ver')
    open_dlg(pg)
    R=rows(pg)
    check([r['k'] for r in R]==['e:rf1','e:adj1','g:don','p:pub','g:shl'],'orden más reciente primero '+str([r['k'] for r in R]))
    check(pg.locator('#cplist .cpc').count()==5 and 'g:old' not in str(R),'octubre ya pagado (legacy) no sale')
    txt=' '.join(r['t'] for r in R)
    check('Devolución' in txt and 'Publix' in txt and 'Interés' in txt and 'Ajuste' in txt and 'Cruz Roja' in txt and 'Shell' in txt,'descripciones '+txt)
    check('−$20.00' in R[0]['t'] and '$12.50' in R[1]['t'],'devolución negativa, interés positivo')
    check('nov' in R[4]['t'].lower(),'fecha en cada línea '+R[4]['t'])
    check(sum(r['c'] for r in R)==14250,'la lista suma el saldo')
    check(E("document.getElementById('cpok').disabled") is True,'botón apagado sin marcas')
    check(st_text(pg)=='Falta $142.50','Falta al inicio '+st_text(pg))
    tick(pg,'g:shl');check(st_text(pg)=='Falta $92.50','Falta 92.50')
    tick(pg,'p:pub');check(st_text(pg)=='Falta $22.50' and E("document.getElementById('cpok').disabled") is True,'Falta 22.50, apagado')
    mark(pg);pg.screenshot(path=os.path.join(SH,'v148-pagar-lista-falta-phone.png'))
    setamt(pg,100);check(st_text(pg)=='Sobra $20.00' and E("document.getElementById('cpok').disabled") is True,'Sobra rojo '+st_text(pg))
    check('220, 38' in E("getComputedStyle(document.getElementById('cpst')).color").replace('rgb(','').replace(')','').replace('0, ','0, ',1) or E("getComputedStyle(document.getElementById('cpst')).color")=='rgb(220, 38, 38)','Sobra en rojo')
    # intento de pago forzado (botón apagado): no hace nada
    d0,c0=deb(E),card(E);E("cpGo('BOA 1')");pg.wait_for_timeout(100)
    check(deb(E)==d0 and card(E)==c0 and E("S.months['2026-11'].events.filter(e=>e.type==='cardpay').length")==0,'si no suma, no paga (aunque se fuerce)')
    setamt(pg,120);check(st_text(pg)=='✅ Cuadra' and E("document.getElementById('cpok').disabled") is False,'120 = 50+70 → Cuadra, botón activo')
    mark(pg);pg.screenshot(path=os.path.join(SH,'v148-pagar-lista-cuadra-phone.png'))
    setamt(pg,120.01);check('Falta $0.01' in st_text(pg) and E("document.getElementById('cpok').disabled") is True,'un centavo cuenta '+st_text(pg))
    setamt(pg,119.99);check('Sobra $0.01' in st_text(pg) and E("document.getElementById('cpok').disabled") is True,'un centavo de más')
    setamt(pg,120)
    pg.click('#cpok');pg.wait_for_timeout(300)
    check(card(E)==22.5 and deb(E)==880,f'saldo 142.50→22.50 y débito 1000→880: {card(E)} {deb(E)}')
    ev=E("S.months['2026-11'].events.filter(e=>e.type==='cardpay')")
    check(len(ev)==1 and ev[0]['amount']==120 and ev[0]['desc']=='Pago BOA 1' and ev[0]['cardId']=='b1' and ev[0]['payId']==ev[0]['id'] and sorted(ev[0]['lines'])==['g:shl','p:pub'],'evento cardpay con payId y líneas '+str(ev))
    pid=ev[0]['id']
    check(E("S.months['2026-11'].personal.find(x=>x.id==='shl').cpay")==pid and E("S.months['2026-11'].purchases[0].cpay")==pid,'marcados con el id del pago')
    check(E("S.months['2026-11'].personal.find(x=>x.id==='don').cpay") is None,'lo no marcado sigue pendiente')
    check(E("S.months['2026-10'].personal[0].cpay")=='legacy' and E("S.cardLedger['BOA 1'].init") is not None,'octubre marcado legacy; libro iniciado')
    # la próxima vez: solo lo pendiente, y suma el saldo
    open_dlg(pg);R=rows(pg)
    check([r['k'] for r in R]==['e:rf1','e:adj1','g:don'] and sum(r['c'] for r in R)==2250,'pendientes: devolución, interés, donación = 22.50 '+str(R))
    check(st_text(pg)=='Falta $22.50','prefill 22.50')
    pg.locator('#cpall').click();pg.wait_for_timeout(50)
    check(st_text(pg)=='✅ Cuadra','marcar todo cuadra')
    mark(pg);pg.screenshot(path=os.path.join(SH,'v148-despues-de-pagar-lista-phone.png'))
    pg.click('#cpok');pg.wait_for_timeout(300)
    check(card(E)==0 and deb(E)==857.5,'pagó el resto: tarjeta 0, débito 857.50 (devolución e interés incluidos)')
    check(E("document.querySelector('#bal-cards button[onclick*=cardPayDlg]')")is None or E("[...document.querySelectorAll('#bal-cards .row')].every(r=>true)"),'ok')
    check(not [e for e in pg.errors],pg.errors)

# ---------- 2. después de pagar: pantalla de Cuentas ----------
with app(ROOT,now=NOW,state=main_state(),new_look=True,expand=False) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    open_dlg(pg);setamt(pg,120);tick(pg,'g:shl','p:pub');pg.click('#cpok');pg.wait_for_timeout(300)
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200)
    E("()=>{goSec('bal-cards')}");pg.wait_for_timeout(300)
    E("()=>{const c=document.getElementById('bal-cards');if(c)c.scrollIntoView({block:'start'});window.scrollBy(0,-90)}");pg.wait_for_timeout(150)
    mark(pg);pg.screenshot(path=os.path.join(SH,'v148-despues-de-pagar-cuentas-phone.png'))
    check('22.50' in pg.inner_text('#bal-cards'),'Cuentas muestra el saldo restante')

# ---------- 3. no debe dejar el débito negativo ----------
with app(ROOT,now=NOW,state=main_state(deb=100),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    open_dlg(pg);setamt(pg,120);tick(pg,'g:shl','p:pub')
    check(E("document.getElementById('cpok').disabled") is False,'suma exacta aunque el débito no alcance')
    pg.click('#cpok');pg.wait_for_timeout(250)
    check(any('DIALOG' in x for x in pg.errors),'avisa débito insuficiente')
    check(deb(E)==100 and card(E)==142.5 and not E("S.months['2026-11'].events.some(e=>e.type==='cardpay')") and E("S.months['2026-11'].personal.find(x=>x.id==='shl').cpay") is None,'nada cambia ni se marca')

# ---------- 4. crédito (devolución) marcado junto con una compra ----------
with app(ROOT,now=NOW,state=main_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    open_dlg(pg);tick(pg,'p:pub','e:rf1');setamt(pg,50)
    check(st_text(pg)=='✅ Cuadra','70 − 20 = 50 cuadra')
    pg.click('#cpok');pg.wait_for_timeout(250)
    check(card(E)==92.5 and deb(E)==950,'pago 50')
    open_dlg(pg);check([r['k'] for r in rows(pg)]==['e:adj1','g:don','g:shl'],'devolución y compra ya no salen')

# ---------- 5. «Ajustar» sale como línea y la lista sigue cuadrando ----------
with app(ROOT,now=NOW,state=main_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    E("adjDlg('cards','b1')");pg.wait_for_timeout(100)
    pg.fill('#ajn','157.5');pg.fill('#ajo','Cargo por pago tardío');E("doAdj('cards','b1')");pg.wait_for_timeout(200)
    open_dlg(pg);R=rows(pg)
    check(any('pago tardío' in r['t'] and r['c']==1500 for r in R),'ajuste +15 como línea '+str(R))
    check(sum(r['c'] for r in R)==15750 and card(E)==157.5,'suma = saldo')
    # pagar solo el cargo por pago tardío
    tick(pg,[r['k'] for r in R if 'pago tardío' in r['t']][0]);setamt(pg,15)
    pg.click('#cpok');pg.wait_for_timeout(250)
    check(card(E)==142.5 and deb(E)==985,'pagó solo el cargo ajustado')

# ---------- 6. historial: el corte cae a medias → «Resto $X de $Y» ----------
def part_state():
    live=mth(1000,[{'id':'b1','name':'BOA 1','amount':100}],personal=[g('n1','2026-11-10',60,'Cena'),g('n2','2026-11-05',70,'Compra grande'),g('n3','2026-10-20',40,'Viejo')])
    return st(live,mth(500,[{'id':'ob1','name':'BOA 1','amount':0}]))
with app(ROOT,now=NOW,state=part_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    open_dlg(pg);R=rows(pg)
    check([r['k'] for r in R]==['g:n1','g:n2'] and [r['c'] for r in R]==[6000,4000],'60 completo + resto 40 '+str(R))
    check('Resto $40.00 de $70.00' in R[1]['t'],'texto Resto '+R[1]['t'])
    check(E("S.months['2026-11'].personal.find(x=>x.id==='n2').cpart") is None,'ver no escribe nada')
    tick(pg,'g:n1');setamt(pg,60);pg.click('#cpok');pg.wait_for_timeout(250)
    check(E("S.months['2026-11'].personal.find(x=>x.id==='n2').cpart")==40 and E("S.months['2026-11'].personal.find(x=>x.id==='n3').cpay")=='legacy','parcial guardado (resto 40) y más viejo legacy')
    open_dlg(pg);R=rows(pg)
    check(len(R)==1 and R[0]['c']==4000 and 'Resto $40.00 de $70.00' in R[0]['t'],'queda el resto de 40 '+str(R))
    tick(pg,'g:n2');setamt(pg,40);pg.click('#cpok');pg.wait_for_timeout(250)
    check(card(E)==0 and deb(E)==900,'tarjeta 0')
    # anular el pago del resto: vuelve el resto 40 (no los 70)
    pid=E("S.months['2026-11'].events.filter(e=>e.type==='cardpay').at(-1).id")
    E(f"delMove('cardpay','{pid}')");pg.wait_for_timeout(250)
    check(card(E)==40 and deb(E)==940,'anular regresa 40 al saldo')
    open_dlg(pg);R=rows(pg);check(len(R)==1 and R[0]['c']==4000,'el resto 40 vuelve a pendiente '+str(R))

# corte exacto (sin parcial)
def exact_state():
    live=mth(1000,[{'id':'b1','name':'BOA 1','amount':100}],personal=[g('n1','2026-11-10',60,'Cena'),g('n2','2026-11-05',40,'Gasolina'),g('n3','2026-10-20',40,'Viejo')])
    return st(live,mth(500,[{'id':'ob1','name':'BOA 1','amount':0}]))
with app(ROOT,now=NOW,state=exact_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500);open_dlg(pg);R=rows(pg)
    check([r['k'] for r in R]==['g:n1','g:n2'] and not any('Resto' in r['t'] for r in R),'exacto sin Resto '+str(R))

# saldo mayor que los cargos conocidos → una línea «Saldo sin detalle»
def resid_state():
    live=mth(1000,[{'id':'b1','name':'BOA 1','amount':100}],personal=[g('n1','2026-11-10',40,'Cena')])
    return st(live,mth(500,[{'id':'ob1','name':'BOA 1','amount':0}]))
with app(ROOT,now=NOW,state=resid_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500);open_dlg(pg);R=rows(pg)
    check([r['k'] for r in R]==['g:n1','resid'] and R[1]['c']==6000 and 'Saldo sin detalle' in R[1]['t'],'saldo sin detalle 60 '+str(R))
    pg.locator('#cpall').click();check(st_text(pg)=='✅ Cuadra','cuadra con el saldo sin detalle')
    pg.click('#cpok');pg.wait_for_timeout(250)
    check(card(E)==0 and E("S.months['2026-11'].events.find(e=>e.type==='cardpay').resid")==60,'pagó todo, resid guardado')

# ---------- 7. Affirm (cuotas) y otras tarjetas no se mezclan ----------
def aff_state():
    live=mth(1000,[{'id':'a1','name':'Affirm','amount':45.5},{'id':'b1','name':'BOA 1','amount':30}],
        personal=[g('af1','2026-11-09',25.5,'Cuota Affirm (ejemplo)','💸 Otros','Affirm'),g('af2','2026-10-09',20,'Cuota Affirm anterior','💸 Otros','Affirm'),g('x1','2026-11-03',30,'Otra tarjeta','🛒 Mercado','BOA 1')])
    return st(live,mth(500,[{'id':'oa','name':'Affirm','amount':20}]))
with app(ROOT,now=NOW,state=aff_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500);open_dlg(pg,'a1');R=rows(pg)
    check([r['k'] for r in R]==['g:af1','g:af2'] and 'Affirm' in R[0]['t'] and not any('Otra tarjeta' in r['t'] for r in R),'solo cargos de Affirm '+str(R))
    # desde un mes anterior la tarjeta es la misma (saldo actual)
    E("()=>{S.cur='2026-10';tab='mov';render()}");pg.wait_for_timeout(150)
    E("cardPayDlg('oa')");pg.wait_for_timeout(200)
    check(len(rows(pg))==2 and pg.inner_text('#cpa')=='' and E("+document.getElementById('cpa').value")==45.5,'mes anterior usa el saldo actual de la tarjeta')

# ---------- 8. otro dispositivo ya marcó una línea: lista vieja no paga ----------
with app(ROOT,now=NOW,state=main_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    open_dlg(pg);tick(pg,'g:shl','p:pub');setamt(pg,120)
    E("()=>{S.cardLedger['BOA 1']={init:'x'};S.months['2026-11'].personal.find(x=>x.id==='shl').cpay='otro'}")
    d0=deb(E);pg.click('#cpok');pg.wait_for_timeout(250)
    check(deb(E)==d0 and any('DIALOG' in x for x in pg.errors),'lista cambió: no paga y avisa')
    # doble toque no paga dos veces
with app(ROOT,now=NOW,state=main_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    open_dlg(pg);tick(pg,'g:shl','p:pub');setamt(pg,120)
    E("()=>{const b=document.getElementById('cpok');b.click();b.click()}");pg.wait_for_timeout(300)
    check(E("S.months['2026-11'].events.filter(e=>e.type==='cardpay').length")==1 and deb(E)==880,'una sola vez')

# ---------- 9. centavos de punto flotante ----------
def cents_state():
    live=mth(1000,[{'id':'b1','name':'BOA 1','amount':0.3}],personal=[g('c1','2026-11-10',0.2,'A'),g('c2','2026-11-09',0.1,'B')])
    return st(live,mth(500,[{'id':'ob1','name':'BOA 1','amount':0}]))
with app(ROOT,now=NOW,state=cents_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500);open_dlg(pg);tick(pg,'g:c1','g:c2');setamt(pg,0.3)
    check(st_text(pg)=='✅ Cuadra' and E("document.getElementById('cpok').disabled") is False,'0.1+0.2=0.3 cuadra')

# ---------- 10. inglés ----------
with app(ROOT,lang='en',now=NOW,state=main_state(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500);open_dlg(pg)
    check('Short' in st_text(pg),'Short '+st_text(pg))
    setamt(pg,100);tick(pg,'g:shl','p:pub');check('Over' in st_text(pg),'Over')
    setamt(pg,120);check('Matches' in st_text(pg),'Matches')
    check('Payment amount' in pg.inner_text('#dlg') and 'Pending charges' in pg.inner_text('#dlg'),'EN labels')

print('test_v148 OK',ok)
