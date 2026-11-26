"""v177 (DATOS DE EJEMPLO): al abrir 📅 Calendario sale siempre Día con la fecha de hoy (Nueva York),
aunque se dejara en Mes/Semana u otra fecha; dentro de la sección se navega normal; botón «Hoy».
Google Calendar SIMULADO (ninguna llamada real). python3 tests/test_v177.py
"""
import os,json
SRC=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'test_v176.py')).read()
exec(SRC[:SRC.index('SHOTS=[]')])   # mismos eventos falsos, API simulada, estado, marca de agua
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SHOTS=[]
UIK='finanzas-cal-ui'
def ui(E): return E(f"JSON.parse(localStorage.getItem('{UIK}')||'{{}}')")
def lbl(pg): return pg.inner_text('#cal .cper b')
def connect(pg):
    pg.route('https://www.googleapis.com/calendar/**',handler);pg.wait_for_timeout(300)
    pg.locator('nav [data-t="cal"]').click();pg.wait_for_timeout(200)
    pg.click('#calconn');pg.wait_for_timeout(700)
def leave_and_back(pg,via='nav'):
    pg.locator('nav [data-t="ini"]').click();pg.wait_for_timeout(150)
    if via=='nav':pg.locator('nav [data-t="cal"]').click()
    else:pg.evaluate("navGo('cal')")
    pg.wait_for_timeout(250)

for W,H,tag in ((390,900,'phone'),(1280,900,'laptop')):
    with app(ROOT,state=state(),now='2026-11-25T09:00:00',width=W,height=H,new_look=True,expand=False,routes=RT,init="localStorage.setItem('finanzas-sync-uid','u1');") as pg:
        E=pg.evaluate
        if tag=='phone':
            check(E('CODE_V')>='v177','CODE_V');check('v177.js' in pg.content(),'index carga v177.js')
            check(E('_v177.nyToday()')=='2026-11-25','hoy en Nueva York')
        connect(pg)
        check(pg.locator('#cal .cseg').count()==1,'calendario conectado')
        # lo deja en Mes de octubre y se va a Hoy
        E("calGo('mes','2026-10-14')");pg.wait_for_timeout(150)
        check('Octubre' in lbl(pg) and ui(E)['view']=='mes','quedó en Mes octubre')
        if tag=='phone':SHOTS.append(shot(pg,'v177-cal-1-dejado-en-mes-phone'))
        check(pg.locator('#caltoday').count()==1 and pg.get_attribute('#caltoday','class')=='','botón Hoy resaltado fuera de hoy')
        leave_and_back(pg)
        u=ui(E);check(u['view']=='dia' and u['d']=='2026-11-25','al volver: Día de hoy (%s)'%u)
        check(pg.locator('#calv-dia.on').count()==1 and 'Miércoles 25 nov' in lbl(pg),'vista Día 25 nov: '+lbl(pg))
        check(pg.locator('#calday,.ctl').count()>=1,'línea de tiempo del día')
        check(pg.get_attribute('#caltoday','class')=='sec','Hoy en gris cuando ya ves hoy')
        if tag=='phone':SHOTS.append(shot(pg,'v177-cal-2-al-volver-abre-hoy-phone'))
        else:SHOTS.append(shot(pg,'v177-cal-abre-en-hoy-laptop'))
        # dentro de la sección se navega normal; un render() cualquiera no lo resetea
        pg.click('#calv-semana');pg.wait_for_timeout(150);pg.click('#calnext');pg.wait_for_timeout(200)
        check(ui(E)['view']=='semana' and '30 nov' in lbl(pg),'Semana siguiente: '+lbl(pg))
        E("render()");pg.wait_for_timeout(150)
        check(ui(E)['view']=='semana' and '30 nov' in lbl(pg),'render dentro de Calendario no resetea')
        pg.click('#caltoday');pg.wait_for_timeout(200)
        check(ui(E)['view']=='semana' and '23' in lbl(pg) and '29 nov' in lbl(pg),'Hoy en Semana → semana de hoy: '+lbl(pg))
        pg.click('#calv-mes');pg.wait_for_timeout(150);pg.click('#calprev');pg.wait_for_timeout(250)
        check('Octubre' in lbl(pg),'Mes anterior')
        pg.click('#caltoday');pg.wait_for_timeout(200)
        check(ui(E)['view']=='mes' and 'Noviembre' in lbl(pg),'Hoy en Mes → noviembre')
        pg.click('#calv-dia');pg.wait_for_timeout(100);pg.click('#calprev');pg.wait_for_timeout(150);pg.click('#calprev');pg.wait_for_timeout(150)
        check('23 nov' in lbl(pg),'Día anterior x2: '+lbl(pg))
        pg.click('#caltoday');pg.wait_for_timeout(150);check('25 nov' in lbl(pg),'Hoy en Día')
        # otra entrada (nav.js navGo) también abre en hoy
        E("calGo('semana','2026-12-08')");leave_and_back(pg,via='navGo')
        check(ui(E)['view']=='dia' and ui(E)['d']=='2026-11-25','navGo(cal) también abre Día de hoy')
        # recargar con la vista guardada en Mes → al entrar, Día de hoy
        E("calGo('mes','2026-09-03')");pg.reload();pg.wait_for_timeout(900)
        E("()=>{unlocked=true;try{closeLock()}catch(e){};document.body.classList.remove('locked');render()}");pg.wait_for_timeout(200)
        check(ui(E)['view']=='mes','guardado Mes antes de recargar')
        pg.locator('nav [data-t="cal"]').click();pg.wait_for_timeout(300)
        check(ui(E)['view']=='dia' and ui(E)['d']=='2026-11-25' and 'Miércoles 25 nov' in lbl(pg),'tras recargar: Día de hoy')
        check(not pg.errors,'sin errores JS: %s'%pg.errors)

# fecha de Nueva York aunque el teléfono esté en otra zona: 03:00 en Madrid del 26 = 21:00 del 25 en NY
with app(ROOT,state=state(),now='2026-11-26T03:00:00+01:00',width=390,height=900,new_look=True,expand=False,routes=RT,init="localStorage.setItem('finanzas-sync-uid','u1');",ctx_opts={'timezone_id':'Europe/Madrid'}) as pg:
    E=pg.evaluate
    check(E('today()')=='2026-11-26' and E('_v177.nyToday()')=='2026-11-25','zona: dispositivo 26, Nueva York 25')
    connect(pg);E("calGo('mes','2026-10-01')");leave_and_back(pg)
    check(ui(pg.evaluate)['d']=='2026-11-25','abre en el día de Nueva York')
    check(not pg.errors,'sin errores JS: %s'%pg.errors)

# ---- ONE SAVINGS desactivado: % del bruto, por defecto 0 %; migración única de 16.07 → 0 %; cheques reales intactos ----
def ck19(E):return E("_v176.checksIn('2026-11-19','2026-11-19').find(c=>c.job==='wm')")
def st_with(cp):
    S=state()
    if cp is not None:S['calPay']=cp
    return S
cases=[('sin ajuste',None),('guardado 16.07',{'wm':15,'lunch':60,'wmSave':16.07}),('ya migrado y puso 3 %',{'wmSavePct':3,'m177':1})]
for name,cp in cases:
    with app(ROOT,state=st_with(cp),now='2026-11-25T09:00:00',width=390,height=900,new_look=True,expand=False,routes=RT,init="localStorage.setItem('finanzas-sync-uid','u1');") as pg:
        E=pg.evaluate;connect(pg)
        P=E("_v176.PAY()");C=E("S.calPay");w=ck19(E);w5=E("_v176.checksIn('2026-11-05','2026-11-05').find(c=>c.job==='wm')")
        check(E("S.wm.paid['2026-11-05']")==812.5 and w5['real']==812.5 and w5['realBank']==812.5,name+': cheque real Walmart 5 nov sin cambios')
        check(E("S.checks.map(c=>c.amount).join(',')")=='421.3,409.55,431.1',name+': cheques YoWash reales sin cambios')
        if name=='ya migrado y puso 3 %':
            check(P['wmSavePct']==3 and abs(w['ded']-31.62)<0.01 and abs(w['est']-770.64)<0.01,'3 %% del bruto 900 = 27 + W+ 4.62: %s'%w)
        else:
            check(C.get('m177')==1 and C.get('wmSavePct')==0 and 'wmSave' not in C,name+': migrado a 0 %%: %s'%C)
            check(abs(w['ded']-4.62)<0.01 and abs(w['est']-797.64)<0.01 and abs(w['bank']-647.64)<0.01,name+': estimado 900 − 97.74 − 4.62 = 797.64; al banco 647.64: %s'%w)
            check(E("_v177.migSave()")==False,name+': la migración no se repite')
        if name=='guardado 16.07':
            check(C.get('wm')==15 and C.get('lunch')==60,'las demás tarifas se conservan')
            check('"m177":1' in E("localStorage.getItem('finanzas-v1')"),'migración guardada')
            # Configuración: campo en %, editable
            h=E("calPayCard()");check('ONE SAVINGS (% del bruto)' in h and 'id="cpws"' in h and 'value="0"' in h.split('id="cpws"')[1][:80],'campo ONE SAVINGS en %, 0 por defecto')
            pg.locator('nav [data-t="cfg"]').click();pg.wait_for_timeout(250)
            E("()=>{const c=document.getElementById('calpaycard');c.classList.remove('col');c.classList.add('open');c.querySelectorAll(':scope>*').forEach(x=>x.style.display='')}");pg.wait_for_timeout(100)
            pg.locator('#calpaycard').scroll_into_view_if_needed()
            pg.evaluate("()=>{const n=document.querySelector('nav');n.style.position='static'}");mark(pg)
            pth=os.path.join(SH,'v177-config-one-savings-phone.png');pg.locator('#calpaycard').screenshot(path=pth);SHOTS.append(pth)
            pg.evaluate("()=>{document.querySelectorAll('.demoW').forEach(x=>x.remove());document.querySelector('nav').style.position=''}")
            E("document.getElementById('cpws').value='3'");E("calPaySave()");pg.wait_for_timeout(200)
            C=E("S.calPay");check(C.get('wmSavePct')==3 and 'wmSave' not in C and C.get('m177')==1,'guardar 3 %%: %s'%C)
            w=ck19(E);check(abs(w['est']-770.64)<0.01,'con 3 %%: 900 − 97.74 − 27 − 4.62 = 770.64: %s'%w)
            E("_v177.migSave()");check(E("S.calPay.wmSavePct")==3,'3 % no se migra otra vez')
        check(not pg.errors,name+': sin errores JS: %s'%pg.errors)

# v.html (sin la app) no se rompe
with app(ROOT,state=state(),now='2026-11-25T09:00:00',width=390,height=900,new_look=True,routes=RT) as pg:
    pg.goto(pg.url.rstrip('/')+'/v.html');pg.wait_for_timeout(600)
    check(not [e for e in pg.errors if 'v177' in e],'v.html sin errores de v177: %s'%pg.errors)
print('test_v177 OK',ok)
for s in SHOTS:print(s)
