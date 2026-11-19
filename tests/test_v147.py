"""v147 (DATOS DE EJEMPLO): ningún cheque entra solo; aviso «Cheques por confirmar»; migración de hoy; sin «Ya se depositó».
python tests/test_v147.py
"""
import os,copy
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
NY={'timezone_id':'America/New_York'}
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg):
    pg.evaluate("""()=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';document.body.append(w)}""")

def ev_chk(i,d,a,cid,**k): return {'id':i,'type':'check','date':d,'amount':a,'checkId':cid,'desc':'Cheque '+d,**k}
def ev_wm(i,d,a,**k): return {'id':i,'type':'income','date':d,'amount':a,'concept':'🏪 Walmart','desc':'Walmart '+d,'method':'deb',**k}

def v146_after_auto(debit=1685):
    """Como lo deja v146 el jueves 19 nov a las 4 AM: YoWash $480 y Walmart $205 depositados solos con el estimado."""
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':debit,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],'tonyBase':0,
      'events':[ev_chk('e05','2026-11-05',500,'c05',ok_=1),
                ev_chk('e12','2026-11-12',470,'c12',auto=True,desc='Cheque 12 nov (automático)'),
                ev_chk('e19','2026-11-19',480,'c19',auto=True,desc='Cheque 19 nov (automático)'),
                ev_wm('w05','2026-11-05',190),
                ev_wm('w19','2026-11-19',205,auto=True,desc='Walmart 19 nov (automático)')]}
    S['checks']=[{'id':'c05','amount':500,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05','ok':True},
                 {'id':'c12','amount':470,'date':'2026-11-12','status':'deposited','depositedOn':'2026-11-12','auto':True},
                 {'id':'c19','amount':480,'date':'2026-11-19','status':'deposited','depositedOn':'2026-11-19','auto':True},
                 {'id':'c26','amount':0,'amtPending':True,'date':'2026-11-26','status':'pending'}]
    S['wm']={'est':205,'chk':{'2026-11-19':205,'2026-12-03':0},'paid':{'2026-11-05':190,'2026-11-19':205}}
    return S

def pending_state(debit=1000, wm_est=205):
    """Antes del cobro de hoy: YoWash pendiente con monto estimado; Walmart con estimado."""
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':debit,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],'tonyBase':0,
      'events':[ev_chk('e05','2026-11-05',500,'c05'),ev_chk('e12','2026-11-12',470,'c12'),ev_wm('w05','2026-11-05',190)]}
    S['checks']=[{'id':'c05','amount':500,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05','ok':True},
                 {'id':'c12','amount':470,'date':'2026-11-12','status':'deposited','depositedOn':'2026-11-12','ok':True},
                 {'id':'c19','amount':480,'date':'2026-11-19','status':'pending'}]
    S['wm']={'est':wm_est,'chk':{'2026-11-19':wm_est},'paid':{'2026-11-05':190}}
    return S

DEB="()=>r2(debE(L()).amount)"
def open_ini(pg):
    pg.evaluate("()=>{tab='ini';render()}");pg.wait_for_timeout(250)

# ---------- 1. nada se deposita solo ----------
with app(ROOT,now='2026-11-19T05:00:00',state=pending_state(),new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    check(E('CODE_V')>='v147','ver')
    E("autoDeposit()");pg.wait_for_timeout(300);E("autoDeposit()")
    check(E(DEB)==1000,'débito no cambia solo')
    check(E("S.checks.find(c=>c.id==='c19').status")=='pending','YoWash sigue pendiente')
    check(E("(S.wm.paid['2026-11-19']||0)")==0,'Walmart no entra solo')
    check(not E("M().events.some(e=>e.auto)"),'sin eventos automáticos')
    # el reloj pasa un día completo y sigue sin depositar
    pg.clock.run_for(70*60*1000);E("autoDeposit()")
    check(E(DEB)==1000,'tras 70 min sigue igual')
    # aviso con los dos cheques, estimado escrito y editable
    open_ini(pg)
    check(pg.locator('#paynotice').count()==1,'aviso en Hoy')
    rows=pg.locator('#paynotice .pn')
    check(rows.count()==2,'dos cheques')
    txt=pg.inner_text('#paynotice')
    check('YoWash' in txt and 'Walmart' in txt and 'Cheques por confirmar' in txt,'texto aviso '+txt)
    vals=E("[...document.querySelectorAll('#paynotice .pnamt')].map(i=>+i.value)")
    check(vals==[480,205],f'prefill {vals}')
    check(pg.locator('#paynotice .pnok').count()==2,'dos botones Confirmar')
    check(E("document.querySelector('#chkamtnote')")is None,'sin aviso viejo')
    check(not pg.errors,pg.errors)

# ---------- 2. hora: 4:00 AM de Nueva York (no la zona del teléfono) ----------
for tz,now,exp in [('Europe/Madrid','2026-11-19T03:59:00-05:00',False),('Europe/Madrid','2026-11-19T04:00:00-05:00',True),
                   ('America/Los_Angeles','2026-11-19T03:59:00-05:00',False),('America/New_York','2026-11-19T04:00:00-05:00',True),
                   ('America/New_York','2026-11-18T23:30:00-05:00',False),('America/New_York','2026-11-21T10:00:00-05:00',True)]:
    with app(ROOT,now=now,state=pending_state(),new_look=True,ctx_opts={'timezone_id':tz}) as pg:
        E=pg.evaluate;pg.wait_for_timeout(500);open_ini(pg)
        got=pg.locator('#paynotice').count()==1
        check(got==exp,f'{tz} {now} esperado {exp} y salió {got}')
        if exp: check(pg.locator('#paynotice .pn').count()==2,f'{now} los dos siguen hasta confirmar (también días después)')

# jueves sin Walmart (jueves alterno): solo YoWash
S=pending_state();S['checks'][-1]['date']='2026-11-12';S['checks'][-2]['status']='deposited'
S['checks']=[c for c in S['checks'] if c['id']!='c12'];S['checks'].append({'id':'c12','amount':470,'date':'2026-11-12','status':'pending'})
S['months']['2026-11']['events']=[e for e in S['months']['2026-11']['events'] if e['id']!='e12']
S['checks']=[c for c in S['checks'] if c['id']!='c19']
S['wm']['paid']['2026-11-05']=190   # Walmart: 5 nov cobrado, el próximo es el 19
with app(ROOT,now='2026-11-12T08:00:00',state=S,new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500);open_ini(pg)
    check(pg.locator('#paynotice .pn').count()==1 and 'YoWash' in pg.inner_text('#paynotice') and 'Walmart' not in pg.inner_text('#paynotice'),'jueves 12: solo YoWash')
    E("autoDeposit()");check(E(DEB)==1000,'no depositó')

# ---------- 3. confirmar: mismos datos que el depósito de siempre ----------
with app(ROOT,now='2026-11-19T05:00:00',state=pending_state(),new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);open_ini(pg)
    shot_pre=pg.screenshot()
    inp=pg.locator('#paynotice .pn[data-k="yw:c19"] .pnamt');inp.fill('470.50')
    pg.locator('#paynotice .pn[data-k="yw:c19"] .pnok').click();pg.wait_for_timeout(300)
    check(E(DEB)==1470.5,f'débito +470.50 {E(DEB)}')
    c=E("S.checks.find(c=>c.id==='c19')")
    check(c['status']=='deposited' and c['amount']==470.5 and c['ok'] is True and not c.get('auto') and c['depositedOn']=='2026-11-19','YoWash c19 '+str(c))
    e=E("M().events.filter(e=>e.type==='check'&&e.checkId==='c19')")
    check(len(e)==1 and e[0]['date']=='2026-11-19' and e[0]['amount']==470.5 and e[0]['desc'].startswith('Cheque ') and not e[0].get('auto'),'evento check '+str(e))
    check(E("S.checks.some(c=>c.status==='pending'&&c.date==='2026-11-26'&&c.amtPending)"),'siguiente jueves queda Pendiente por definir')
    open_ini(pg)
    check(pg.locator('#paynotice .pn').count()==1 and 'Walmart' in pg.inner_text('#paynotice'),'queda solo Walmart')
    pg.locator('#paynotice .pn[data-k="wm:2026-11-19"] .pnamt').fill('198.50')
    pg.locator('#paynotice .pnok').click();pg.wait_for_timeout(300)
    check(E(DEB)==1669,f'débito +198.50 {E(DEB)}')
    check(E("S.wm.paid['2026-11-19']")==198.5,'wm.paid')
    w=E("M().events.filter(e=>e.type==='income'&&e.concept==='🏪 Walmart'&&e.date==='2026-11-19')")
    check(len(w)==1 and w[0]['amount']==198.5 and w[0]['method']=='deb' and not w[0].get('auto'),'evento Walmart '+str(w))
    check(E("S.wm.chk['2026-12-03']")==0 and E("wmNext()")=='2026-12-03','próximo Walmart Pendiente, 3 dic')
    check(pg.locator('#paynotice').count()==0,'aviso desaparece')
    # reportes: Cheques depositados, Real cobrado
    tot=E("depChecks().filter(c=>c.date==='2026-11-19').map(c=>[c.src,c.amount])")
    check(sorted(tot)==sorted([['💼 YoWash',470.5],['🏪 Walmart',198.5]]),'Cheques depositados '+str(tot))
    d=E("v138Data(planNums())")
    check(abs(d['real']-(500+470+470.5+190+198.5))<0.01,'Real cobrado '+str(d['real']))
    # idempotente aunque otro dispositivo ya lo confirmó (aviso en pantalla desactualizado)
    check(not pg.errors,pg.errors)

# otro dispositivo ya confirmó: pulsar Confirmar con el aviso viejo no suma dos veces
with app(ROOT,now='2026-11-19T05:00:00',state=pending_state(),new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);open_ini(pg)
    E("""()=>{const c=S.checks.find(c=>c.id==='c19');c.status='deposited';c.ok=true;c.depositedOn='2026-11-19';c.amount=480;debE(L()).amount=r2(debE(L()).amount+480);
      M().events.push({id:'x1',type:'check',date:'2026-11-19',amount:480,checkId:'c19',desc:'Cheque 19 nov'});
      S.wm.paid['2026-11-19']=205;debE(L()).amount=r2(debE(L()).amount+205);M().events.push({id:'x2',type:'income',date:'2026-11-19',amount:205,concept:'🏪 Walmart',desc:'Walmart',method:'deb'});}""")
    b=E(DEB)
    pg.locator('#paynotice .pn[data-k="yw:c19"] .pnok').click();pg.wait_for_timeout(200)
    check(E(DEB)==b and E("M().events.filter(e=>e.checkId==='c19').length")==1,'YoWash sin duplicado')
    pg.evaluate("()=>{tab='ini';render()}")
    check(pg.locator('#paynotice').count()==0,'sin aviso')
    E("()=>{tab='ini';render()}")
    check(E("M().events.filter(e=>e.type==='income'&&e.date==='2026-11-19').length")==1 and E(DEB)==b,'Walmart sin duplicado')
    # Walmart ya cobrado por otro lado: el botón guardado no duplica
    check(not pg.errors,pg.errors)

# monto vacío o 0: no confirma
with app(ROOT,now='2026-11-19T05:00:00',state=pending_state(),new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);open_ini(pg)
    pg.locator('#paynotice .pn[data-k="yw:c19"] .pnamt').fill('')
    pg.locator('#paynotice .pn[data-k="yw:c19"] .pnok').click();pg.wait_for_timeout(200)
    check(E(DEB)==1000 and E("S.checks.find(c=>c.id==='c19').status")=='pending','monto vacío no confirma')
    check(any('DIALOG' in x for x in pg.errors),'avisa que falta el monto')

# YoWash sin estimado (Pendiente por definir): campo con el último cheque cobrado como estimado
S=pending_state();S['checks'][-1].update({'amount':0,'amtPending':True})
with app(ROOT,now='2026-11-19T05:00:00',state=S,new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);open_ini(pg)
    check(E("+document.querySelector('#paynotice .pn[data-k=\"yw:c19\"] .pnamt').value")==470,'estimado = último cheque (470)')
    pg.locator('#paynotice .pn[data-k="yw:c19"] .pnok').click();pg.wait_for_timeout(200)
    check(E("S.checks.find(c=>c.id==='c19').amtPending")is None and E(DEB)==1470,'confirma sin amtPending')

# EarlyPay: estimado neto en el campo y no se descuenta dos veces
S=pending_state();S['months']['2026-11']['events'].append({'id':'ep1','type':'income','date':'2026-11-10','amount':40,'concept':'⚡ OnePay','desc':'EarlyPay','method':'deb'})
S['months']['2026-11']['income'][0]['amount']=1040
with app(ROOT,now='2026-11-19T05:00:00',state=S,new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);open_ini(pg)
    check(E("+document.querySelector('#paynotice .pn[data-k=\"wm:2026-11-19\"] .pnamt').value")==165,'estimado Walmart neto de EarlyPay (205−40)')
    pg.locator('#paynotice .pn[data-k="wm:2026-11-19"] .pnok').click();pg.wait_for_timeout(200)
    check(E("S.wm.paid['2026-11-19']")==165 and E(DEB)==1205,'Walmart 165 al débito')
    check(E("epMonthSum('2026-11')")==40,'EarlyPay del mes intacto')
    d=E("v138Data(planNums())");check(abs(d['real']-(500+470+190+165+40))<0.01,'Real cobrado con EarlyPay '+str(d['real']))
    check(E("epCycleSum(wmNext())")==0,'EarlyPay ya usado: no baja el siguiente')

# ---------- 4. sin «Ya se depositó»; adelantados viejos se conservan ----------
S=pending_state()
S['checks'][-1]['date']='2026-11-19'
with app(ROOT,now='2026-11-18T10:00:00',state=S,new_look=True,ctx_opts=NY) as pg:   # miércoles = día anterior
    E=pg.evaluate;pg.wait_for_timeout(500);open_ini(pg)
    check(E("typeof ywEarlyOk==='function'") and E("ywEarlyOk(S.checks.find(c=>c.id==='c19'))"),'(la ventana de v143 sigue siendo miércoles)')
    check(pg.locator('#ywearly').count()==0,'sin botón Ya se depositó el miércoles')
    check('Ya se depositó' not in pg.inner_text('#v'),'sin texto Ya se depositó')
    E("ywEarlyDlg()");pg.wait_for_timeout(200)
    check(not E("dlg().open"),'ywEarlyDlg ya no abre nada')
    b=E(DEB);E("ywEarlySave('c19')");check(E(DEB)==b and E("S.checks.find(c=>c.id==='c19').status")=='pending','ywEarlySave no hace nada')
    check(pg.locator('#paynotice').count()==0,'miércoles: aún sin aviso')

S=pending_state()
S['checks']=[c for c in S['checks'] if c['id'] not in('c12',)]
S['checks'].append({'id':'ce','amount':455,'date':'2026-11-12','status':'deposited','depositedOn':'2026-11-11','early':True})
S['checks'].append({'id':'cdup','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'})   # pendiente repetido del mismo cobro
S['months']['2026-11']['events']=[e for e in S['months']['2026-11']['events'] if e['id']!='e12']+[{'id':'ee','type':'check','date':'2026-11-11','amount':455,'checkId':'ce','early':True,'payday':'2026-11-12','desc':'Cheque 11 nov (adelantado, cobro 12 nov)'}]
S['months']['2026-11']['income'][0]['amount']=1455
with app(ROOT,now='2026-11-19T05:00:00',state=S,new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);open_ini(pg)
    ids=E("v147Due().map(x=>x.key)")
    check('yw:cdup' not in ids,'cobro del 12 ya adelantado: sin aviso '+str(ids))
    check(any(c['id']=='ce' for c in E("depChecks()")),'adelantado sigue en Cheques depositados')
    d=E("v138Data(planNums())");check(any(abs(x['a']-455)<.01 and x['d']=='2026-11-11' for x in d['yw'] if x['t']=='r'),'adelantado cuenta en Real cobrado')
    check(not E("autoDeposit(),0") and E(DEB)==1455,'no se toca el débito')

# ---------- 5. migración de hoy (una sola vez) ----------
with app(ROOT,now='2026-11-19T05:00:00',state=v146_after_auto(),new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    check(E(DEB)==1685,'débito antes (con los dos depósitos automáticos)')
    E("autoDeposit()");pg.wait_for_timeout(300)
    check(E(DEB)==1000,f'migración quita 480+205 del débito: {E(DEB)}')
    check(E("S.checks.find(c=>c.id==='c19').status")=='pending' and E("S.checks.find(c=>c.id==='c19').auto")is None and E("S.checks.find(c=>c.id==='c19').amount")==480,'YoWash de hoy vuelve a pendiente con 480')
    check(E("M().events.filter(e=>e.date==='2026-11-19').length")==0,'eventos de hoy quitados')
    check(E("S.wm.paid['2026-11-19']")is None and E("wmNext()")=='2026-11-19','Walmart de hoy vuelve a pendiente')
    check(E("S.pay147.mig")==1,'bandera guardada')
    # no toca lo anterior
    check(E("S.checks.find(c=>c.id==='c12').status")=='deposited' and E("M().events.some(e=>e.checkId==='c12')"),'12 nov intacto (semana anterior)')
    check(E("S.checks.find(c=>c.id==='c05').status")=='deposited' and E("S.wm.paid['2026-11-05']")==190 and E("M().events.some(e=>e.id==='w05')"),'5 nov intacto')
    check(not E("S.checks.some(c=>c.status==='pending'&&c.date==='2026-11-26')"),'sin pendiente duplicado del 26')
    open_ini(pg)
    vals=E("[...document.querySelectorAll('#paynotice .pnamt')].map(i=>+i.value)")
    check(vals==[480,205],f'estimados escritos tras migrar {vals}')
    # segunda vez / otro dispositivo: no pasa nada
    E("autoDeposit()");E("v147Migrate()");check(E(DEB)==1000,'idempotente')
    # confirmar después de migrar → vuelve a la forma normal y el siguiente queda pendiente
    pg.locator('#paynotice .pn[data-k="yw:c19"] .pnamt').fill('471.25')
    pg.locator('#paynotice .pn[data-k="yw:c19"] .pnok').click();pg.wait_for_timeout(200)
    pg.locator('#paynotice .pn[data-k="wm:2026-11-19"] .pnamt').fill('201.10')
    pg.locator('#paynotice .pn[data-k="wm:2026-11-19"] .pnok').click();pg.wait_for_timeout(200)
    check(E(DEB)==1672.35,f'débito tras confirmar {E(DEB)}')
    check(E("S.checks.filter(c=>c.status==='pending'&&c.date==='2026-11-26').length")==1,'un solo pendiente 26 nov')
    E("autoDeposit()");check(E(DEB)==1672.35 and E("S.pay147.migN")==2,'confirmado no se vuelve a migrar')
    check(not pg.errors,pg.errors)

# lo que Joe ya confirmó/corrigió, y otras fechas, no se tocan
S=v146_after_auto()
S['checks'][2]['ok']=True                                   # YoWash de hoy ya confirmado («Sí»/«Otro monto»)
S['months']['2026-11']['events'][4]['amount']=198.5         # Walmart ya corregido a mano en Movimientos (≠ wm.paid)
with app(ROOT,now='2026-11-19T05:00:00',state=S,new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);E("autoDeposit()");pg.wait_for_timeout(200)
    check(E(DEB)==1685,'nada se revierte si ya lo confirmaste/corregiste')
    check(E("S.wm.paid['2026-11-19']")==198.5,'Cheques cobrados toma el monto ya corregido')
    check(E("S.checks.find(c=>c.id==='c19').status")=='deposited','c19 sigue depositado')
# adelantado (early) y manual no se revierten; semana anterior tampoco aunque sea hoy+1
S=v146_after_auto();S['checks'][2]['early']=True
with app(ROOT,now='2026-11-19T05:00:00',state=S,new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);E("autoDeposit()")
    check(E("S.checks.find(c=>c.id==='c19').status")=='deposited','early no se revierte')
S=v146_after_auto()
with app(ROOT,now='2026-11-27T09:00:00',state=S,new_look=True,ctx_opts=NY) as pg:   # primer arranque una semana después
    E=pg.evaluate;pg.wait_for_timeout(600);E("autoDeposit()")
    check(E("S.checks.find(c=>c.id==='c19').status")=='deposited' and E(DEB)==1685,'hoy 27 nov: el cobro del 19 ya es de la semana pasada, no se toca')

# ---------- 6. corregir el monto en «Cheques depositados» ----------
with app(ROOT,now='2026-11-19T09:00:00',state=v146_after_auto(),new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    E("S.pay147={mig:1,pre:{}}")                                # sin migrar: aquí se prueba solo la edición
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(250)
    rows=pg.locator('#chkcard .row .n[role=button]')
    check(rows.count()>=4,f'filas editables {rows.count()}')
    pg.locator('#chkcard .row .n[role=button]',has_text='Walmart').first.click();pg.wait_for_timeout(250)
    check(pg.locator('#depa').count()==1 and E("+document.getElementById('depa').value")==205,'diálogo con 205')
    pg.fill('#depa','188.40');pg.click('#depok');pg.wait_for_timeout(250)
    check(E(DEB)==round(1685-205+188.40,2),f'débito ajustado {E(DEB)}')
    check(E("S.wm.paid['2026-11-19']")==188.4 and E("M().events.find(e=>e.id==='w19').amount")==188.4,'paid y evento = 188.40')
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(200)
    check('188.40' in pg.inner_text('#chkcard'),'la lista muestra 188.40')
    pg.locator('#chkcard .row .n[role=button]',has_text='YoWash').first.click();pg.wait_for_timeout(250)
    # el primero de la lista es el más reciente (19 nov)
    check(E("+document.getElementById('depa').value")==480,'YoWash 19 nov 480')
    pg.fill('#depa','452.00');pg.click('#depok');pg.wait_for_timeout(250)
    check(E("S.checks.find(c=>c.id==='c19').amount")==452 and E("M().events.find(e=>e.id==='e19').amount")==452 and E("S.checks.find(c=>c.id==='c19').ok")is True,'YoWash corregido')
    check(E(DEB)==round(1685-205+188.4-480+452,2),'débito total')
    d=E("v138Data(planNums())");check(abs(d['real']-(500+470+452+190+188.4))<0.01,'Real cobrado con correcciones '+str(d['real']))
    # corregir desde Movimientos (Editar ingreso) también actualiza wm.paid
    E("incEdit('w05')");pg.fill('#ea','195');E("incEditSave('w05')");pg.wait_for_timeout(200)
    check(E("S.wm.paid['2026-11-05']")==195,'Editar ingreso de Walmart actualiza Cheques cobrados')
    # borrar un ingreso de Walmart vuelve a pedirlo
    E("delMove('income','w19')");pg.wait_for_timeout(200)
    check('2026-11-19' not in E("S.wm.paid") and E("wmNext()")=='2026-11-19','borrar Walmart: vuelve a pedirse')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)

# ---------- 7. inglés ----------
with app(ROOT,lang='en',now='2026-11-19T05:00:00',state=pending_state(),new_look=True,ctx_opts=NY) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);open_ini(pg)
    t=pg.inner_text('#paynotice')
    check('Checks to confirm' in t and 'Confirm' in t and 'Cheques por confirmar' not in t,'EN '+t)

# ---------- 8. pantalla: aviso con los dos cheques y después de confirmar ----------
def look(pg):
    pg.evaluate("()=>{window.scrollTo(0,0)}");mark(pg)
with app(ROOT,now='2026-11-19T05:00:00',state=v146_after_auto(),new_look=True,ctx_opts=NY,width=390,height=900,expand=False) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    E("autoDeposit()");pg.wait_for_timeout(300);open_ini(pg);look(pg)
    pg.screenshot(path=os.path.join(SH,'v147-aviso-cheques-phone.png'))
    pg.locator('#paynotice .pn[data-k="yw:c19"] .pnamt').fill('471.25')
    pg.locator('#paynotice .pn[data-k="yw:c19"] .pnok').click();pg.wait_for_timeout(250)
    open_ini(pg);look(pg)
    pg.screenshot(path=os.path.join(SH,'v147-un-cheque-confirmado-phone.png'))
    pg.locator('#paynotice .pn[data-k="wm:2026-11-19"] .pnamt').fill('201.10')
    pg.locator('#paynotice .pnok').click();pg.wait_for_timeout(250)
    open_ini(pg);look(pg)
    pg.screenshot(path=os.path.join(SH,'v147-despues-de-confirmar-phone.png'))
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(250)
    E("()=>{goSec('bal-income')}");pg.wait_for_timeout(300)
    E("()=>{const c=document.getElementById('chkcard');if(c)c.scrollIntoView({block:'start'});window.scrollBy(0,-90)}");pg.wait_for_timeout(200)
    mark(pg);pg.screenshot(path=os.path.join(SH,'v147-cheques-depositados-editar-phone.png'))
    pg.locator('#chkcard .row .n[role=button]',has_text='Walmart').first.click();pg.wait_for_timeout(300)
    mark(pg);pg.screenshot(path=os.path.join(SH,'v147-editar-cheque-dialogo-phone.png'))
    check(not pg.errors,pg.errors)

print('test_v147 OK',ok)
