"""v176 (DATOS DE EJEMPLO): 📅 Calendario con Google Calendar SIMULADO (ninguna llamada real).
Conectar (permiso calendar.readonly), turnos Walmart/YoWash, estado de la descripción,
sueño/libre según las reglas de Joe, conflicto, salario estimado (bruto + neto aprox. por
cheques), PDF del período, responsive (390 / 820 / 1280).
python3 tests/test_v176.py
"""
import os,re,json,copy,subprocess,datetime as dt
from zoneinfo import ZoneInfo
from urllib.parse import urlparse,parse_qs
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
RT={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
TZ=ZoneInfo('America/New_York')
def ev(i,d,a,b,job,st):
    t={'wm':'Walmart (Front End Checkout)','yw':'YoWash (turno PM)'}[job]
    f=lambda hm:dt.datetime.combine(d,dt.time(*hm),TZ).isoformat()
    return {'id':'e%d'%i,'status':'confirmed','summary':t,'description':f'Estado: {st}<br>Turno de ejemplo','start':{'dateTime':f(a)},'end':{'dateTime':f(b)}}
EV=[];i=0
d=dt.date(2026,9,14)
while d<=dt.date(2026,12,13):
    w=d.weekday()
    if w in (0,1,2,4): i+=1;EV.append(ev(i,d,(6,0),(14,30),'wm','confirmado'))
    if w in (0,2,3,5):
        cf=(w==2 and d.day in (11,25) and d.month==11)
        a=(10,0) if w==5 else ((14,30) if cf else (15,0));b=(18,0) if w==5 else (22,30)
        if not (d==dt.date(2026,11,18)):
            i+=1;EV.append(ev(i,d,a,b,'yw','conflicto' if cf else 'estimado' if d>=dt.date(2026,11,26) else 'confirmado'))
    d+=dt.timedelta(days=1)
EV.append({'id':'x1','status':'confirmed','summary':'Dentista','start':{'dateTime':'2026-11-24T16:00:00-05:00'},'end':{'dateTime':'2026-11-24T17:00:00-05:00'}})
EV.append({'id':'x2','status':'cancelled','summary':'Walmart (Front End Checkout)','start':{'dateTime':'2026-11-29T06:00:00-05:00'},'end':{'dateTime':'2026-11-29T14:30:00-05:00'}})
CALLS=[]
def handler(route):
    req=route.request;CALLS.append(req.url)
    if req.headers.get('authorization')!='Bearer fake-cal-token':
        return route.fulfill(status=401,body='{"error":{"message":"bad token"}}',content_type='application/json')
    q=parse_qs(urlparse(req.url).query);a=dt.datetime.fromisoformat(q['timeMin'][0].replace('Z','+00:00'));b=dt.datetime.fromisoformat(q['timeMax'][0].replace('Z','+00:00'))
    items=[e for e in EV if a<=dt.datetime.fromisoformat(e['start']['dateTime'])<b]
    route.fulfill(status=200,body=json.dumps({'items':items}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})
def state():
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months'].setdefault('2026-11',{'income':[{'id':'i1','name':'Débito','amount':2000,'role':'debit'}],'cards':[],'bills':[],'purchases':[],'personal':[],'events':[]})
    # cheques reales FALSOS: YoWash (S.checks, jueves) y Walmart (S.wm.paid, quincenal) → estimado vs real
    S['checks']=[{'id':'c%d'%n,'amount':a_,'date':d_,'status':'deposited','depositedOn':d_} for n,(d_,a_) in enumerate([('2026-11-05',421.30),('2026-11-12',409.55),('2026-11-19',431.10)])]
    S['wm']={'paid':{'2026-11-05':812.50}}
    # OnePay FALSO ya cobrado dentro de la quincena del 19 nov → se resta del depósito
    S['months']['2026-11']['events'].append({'id':'ep1','type':'income','concept':'OnePay','date':'2026-11-10','amount':150})
    return S
def mark(pg):
    pg.evaluate("""()=>{document.querySelectorAll('.demoW').forEach(x=>x.remove());const H=document.documentElement.scrollHeight;
     for(let y=260;y<H;y+=650){const w=document.createElement('div');w.className='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:absolute;left:0;right:0;top:'+y+'px;text-align:center;font:700 30px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.40);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';document.body.append(w)}}""")
def shot(pg,name):
    pg.evaluate("()=>{const n=document.querySelector('nav');n.style.position='static';const f=document.getElementById('fab');if(f)f.style.display='none';const t=document.getElementById('totop');if(t)t.style.display='none'}")
    mark(pg);p=os.path.join(SH,name+'.png');pg.screenshot(path=p,full_page=True)
    pg.evaluate("()=>{document.querySelector('nav').style.position='';document.querySelectorAll('.demoW').forEach(x=>x.remove())}");return p
SHOTS=[]
def open_cal(pg):
    pg.route('https://www.googleapis.com/calendar/**',handler)
    pg.wait_for_timeout(300)
    pg.locator('nav [data-t="cal"]').click();pg.wait_for_timeout(200)

for W,H,tag in ((390,900,'phone'),(820,1100,'tablet'),(1280,900,'laptop')):
    with app(ROOT,state=state(),now='2026-11-25T09:00:00',width=W,height=H,new_look=True,expand=False,routes=RT,init="localStorage.setItem('finanzas-sync-uid','u1');") as pg:
        E=pg.evaluate
        if tag=='phone':
            check(E("_v176.wmG(44)")==690 and E("_v176.wmG(32)")==480,'Walmart: extra >40 h/semana a $22.50')
            check(E("_v176.wmWeek('2026-11-13')")=='2026-11-07' and E("_v176.wmWeek('2026-10-31')")=='2026-10-31','semana Walmart sáb–vie')
            check(E("_v176.epIn('2026-11-05','2026-11-19')")==150 and E("_v176.epIn('2026-10-22','2026-11-05')")==0,'OnePay de la quincena')
            check(E('CODE_V')>='v176','CODE_V');check('v176.js' in pg.content(),'index carga v176.js')
            check(pg.locator('nav [data-t="cal"]').count()==1,'botón Calendario en la barra')
        open_cal(pg)
        check(pg.locator('#calconnect').count()==1 and 'Conectar Google Calendar' in pg.inner_text('#calconn'),'pantalla conectar')
        check(not CALLS or tag!='phone','no llama a Google antes de conectar')
        SHOTS.append(shot(pg,f'v176-cal-conectar-{tag}'))
        pg.click('#calconn');pg.wait_for_timeout(600)
        check(E("window.__gpScopes&&window.__gpScopes.includes('https://www.googleapis.com/auth/calendar.readonly')"),'pide calendar.readonly')
        check(E("window.__calAuthCalls")==1,'consentimiento incremental (reauthenticateWithPopup) 1 vez')
        check(pg.locator('#cal .cseg').count()==1 and pg.locator('#calconnect').count()==0,'calendario cargado')
        C=E("JSON.parse(localStorage.getItem('finanzas-cal-cache'))")
        check(all(x['job'] in ('wm','yw') for x in C['items']) and not any(x['id'] in ('x1','x2') for x in C['items']),'solo Walmart/YoWash, sin cancelados')
        check(E("JSON.stringify(window.__fs.docs).includes('finanzas-cal')")==False and 'items' not in json.dumps(E("S.calPay||{}")),'turnos solo en el dispositivo')
        # ---- Día 25 nov: conflicto ----
        E("calGo('dia','2026-11-25')");pg.wait_for_timeout(150)
        m=E("_v176.dayModel('2026-11-25')")
        check(m['wake']==4*60+50,'despierta 4:50 (Walmart 6:00): %s'%m['wake'])
        check(abs(m['sleep']-(6*60+50))<1,'durmió 22:00→4:50 = 6h50 (noche libre + Walmart): %s'%m['sleep'])
        check(m['bed']==24*60+5,'a dormir 00:05 tras YoWash 22:30: %s'%m['bed'])
        check(pg.locator('#cal .cwarn').count()>=1 and 'Walmart termina 14:30 y YoWash empieza 14:30' in pg.inner_text('#cal'),'aviso de conflicto')
        check(pg.locator('.cblk.ccf').count()==1,'bloque YoWash en rojo')
        if tag=='phone':
            m24=E("_v176.dayModel('2026-11-24')");check(abs(m24['sleep']-(4*60+45))<1,'tras YoWash lunes: 00:05→4:50 = 4h45 (rojo)')
            check(pg.locator('#calday .cbdg.a').count()==1,'badge ámbar 6h50')
            ph=E("getComputedStyle(document.getElementById('cal')).getPropertyValue('--ph').trim()");check(ph=='26px','filas de hora compactas (26px): '+ph)
            th=pg.evaluate("document.querySelector('.ctl').offsetHeight");check(th<=540,'línea de tiempo 4:00–24:00 compacta: %s px'%th)
        SHOTS.append(shot(pg,f'v176-cal-dia-{tag}'))
        # ---- Semana 23–29 nov ----
        E("calGo('semana','2026-11-25')");pg.wait_for_timeout(150)
        check(pg.locator('#cal .cdc').count()==7,'7 tarjetas lun–dom')
        txt=pg.inner_text('#cal');check('23 – 29 nov' in txt,'período semana: '+txt[:120])
        check(pg.locator('.csh.est').count()>=2,'estimado con borde punteado')
        S7=E("_v176.stats(_v176.period())")
        check(abs(S7['g']['hwm']-30)<0.01 and abs(S7['g']['wm']-450)<0.01,'Walmart 4×(8.5h−1h almuerzo)=30h×$15=$450: %s'%S7['g'])
        check(abs(S7['g']['hyw']-31)<0.01 and abs(S7['g']['yw']-496)<0.01,'YoWash solo horas programadas 31h×$16=$496: %s'%S7['g'])
        check(abs(S7['net']['yw']-424.72)<0.01 and abs(S7['net']['wm']-401.13)<0.01 and abs(S7['g']['tax']['wm']-48.87)<0.01,'neto YoWash 424.72; Walmart 450 − 10.86%% = 401.13: %s'%S7['net'])
        ck=S7['ck'];check(len(ck)==1 and ck[0]['job']=='yw' and ck[0]['d']=='2026-11-26' and abs(ck[0]['est']-315.12)<0.01 and ck[0]['real'] is None and ck[0]['fut'],'cheque jue 26 (semana 12–18 nov, 23h): est 315.12, por llegar: %s'%ck)
        if tag=='phone':
            M28=E("_v176.dayModel('2026-11-28')");M29=E("_v176.dayModel('2026-11-29')")
            check(M28['bed']==23*60 and M29['sleep']==510 and not any(s.get('k')=='home' for s in M28['seg']),'YoWash sábado 10–18 no es cierre: dormir 23:00, sueño dom 8h30: %s %s'%(M28['bed'],M29['sleep']))
            check(E("_v176.ywGross(46.43)")==794.32 and E("_v176.ywGross(40)")==640,'YoWash: 40h×$16 + extra×$24')
            check(E("_v176.ywWeek('2026-11-25')")=='2026-11-19' and E("_v176.ywWeek('2026-11-26')")=='2026-11-26','semana de pago jue–mié')
            t7=pg.inner_text('#calsum');check('Salario estimado' in t7 and '$946.00' in t7 and '$825.85' in t7 and E('_v176.PAY().lunch')==60 and 'llega jue 26 nov' in t7,'salario bruto $946 (neto $825.85) + cheque por llegar: '+t7)
        SHOTS.append(shot(pg,f'v176-cal-semana-{tag}'))
        # ---- Mes noviembre ----
        E("calGo('mes','2026-11-25')");pg.wait_for_timeout(150)
        check(pg.locator('.cmd').count()>=30,'cuadrícula del mes');check('Noviembre 2026' in pg.inner_text('#cal'),'título mes')
        check(pg.locator('.cmd .bC').count()>=2,'días con conflicto en rojo')
        CK=E("_v176.stats(_v176.period()).ck");byk={(c['job'],c['d']):c for c in CK}
        y5,y19,w5,w19=byk.get(('yw','2026-11-05')),byk.get(('yw','2026-11-19')),byk.get(('wm','2026-11-05')),byk.get(('wm','2026-11-19'))
        check(y5 and abs(y5['est']-417.87)<0.01 and y5['real']==421.30,'YoWash 5 nov: est 417.87 vs real 421.30: %s'%y5)
        check(y19 and abs(y19['est']-424.72)<0.01 and y19['real']==431.10,'YoWash 19 nov (semana con 8h el 11): %s'%y19)
        check(w5 and w5['gross']==900 and abs(w5['tax']-97.74)<0.01 and abs(w5['ded']-4.62)<0.01 and abs(w5['est']-797.64)<0.01 and w5['real']==812.5 and w5['realBank']==812.5,'Walmart 5 nov: 60h → 900 − 97.74 − W+ 4.62 (ONE SAVINGS 0%%) = 797.64 vs real 812.50: %s'%w5)
        check(w19 and w19['real'] is None and not w19['fut'] and w19['ep']==150 and abs(w19['bank']-647.64)<0.01,'Walmart 19 nov: total 797.64 − OnePay 150 = 647.64 al banco, falta registrar: %s'%w19)
        tck=pg.inner_text('#calck');check('al banco $647.64' in tck and 'OnePay −$150.00' in tck and '+$14.86' in tck,'desglose Walmart en la tabla: '+tck)
        check('falta registrar' in pg.inner_text('#calck') and '+$3.43' in pg.inner_text('#calck'),'tabla estimado vs real: '+pg.inner_text('#calck'))
        OV=E("(()=>{const W=document.documentElement.clientWidth;return [document.documentElement.scrollWidth,W,[...document.querySelectorAll('#cal *')].filter(e=>e.getBoundingClientRect().right>W+1).length]})()");check(OV[0]<=OV[1] and OV[2]==0,'sin desborde horizontal en %s: %s'%(tag,OV))
        SHOTS.append(shot(pg,f'v176-cal-mes-{tag}'))
        if tag=='phone':
            pg.locator('.cmd').nth(10).click();pg.wait_for_timeout(150);check(E("_v176.period().a")!=None and E("document.getElementById('calday')!==null"),'tocar un día abre el Día')
            E("calGo('mes','2026-11-25')");E("calMove(1)");pg.wait_for_timeout(500)
            check('Diciembre 2026' in pg.inner_text('#cal'),'› cambia de mes');E("calMove(-1)")
            # PDF
            E("calGo('semana','2026-11-25')")
            with pg.expect_download(timeout=20000) as dlw: pg.click('#calpdf')
            pp='/tmp/v176cal.pdf';dlw.value.save_as(pp);t=subprocess.run(['pdftotext','-layout',pp,'-'],capture_output=True,text=True).stdout
            for s in ('Calendario','Horas de trabajo','Salario estimado','Cheque YoWash 2026-11-26','Walmart 6:00-14:30','YoWash 14:30-22:30 (!)','(est.)','Libre'):check(s in t,'PDF tiene '+s)
            import shutil;shutil.copy(pp,os.path.join(SH,'v176-cal-semana.pdf'))
            subprocess.check_call(['pdftoppm','-png','-r','90','-f','1','-l','1','-singlefile',pp,os.path.join(SH,'v176-cal-pdf')])
            from PIL import Image,ImageDraw,ImageFont;_im=Image.open(os.path.join(SH,'v176-cal-pdf.png')).convert('RGBA');_ov=Image.new('RGBA',(700,90),(0,0,0,0));ImageDraw.Draw(_ov).text((10,10),'DATOS DE EJEMPLO',fill=(220,38,38,120),font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',58));_ov=_ov.rotate(18,expand=1);[_im.alpha_composite(_ov,(60,y)) for y in (120,520)];_im.convert('RGB').save(os.path.join(SH,'v176-cal-pdf.png'))
            # Configuración: tarifas
            E("()=>{tab='cfg';render()}");pg.wait_for_timeout(150)
            check(pg.locator('#calpaycard').count()==1,'tarjeta de tarifas en Configuración')
            E("()=>{document.getElementById('cpwm').value='16';calPaySave()}");check(E("S.calPay.wm")==16,'tarifa editable')
            # token vencido → «Actualizar» pide permiso otra vez; 401 se avisa
            E("()=>{sessionStorage.removeItem('finanzas-cal-tok');tab='cal';render()}");pg.wait_for_timeout(100)
            pg.click('#calref');pg.wait_for_timeout(500);check(E("window.__calAuthCalls")==2,'reconectar tras vencer')
            # API sin activar → mensaje claro
            pg.unroute('https://www.googleapis.com/calendar/**')
            pg.route('https://www.googleapis.com/calendar/**',lambda r:r.fulfill(status=403,body=json.dumps({'error':{'message':'Google Calendar API has not been used in project 123 before or it is disabled.','status':'PERMISSION_DENIED'}}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'}))
            pg.click("#calref");pg.wait_for_timeout(500);check('Google Calendar API no está activada' in pg.inner_text('#cal'),'mensaje API desactivada')
        check(not [e for e in pg.errors if 'favicon' not in e and 'DIALOG' not in e and '403' not in e and 'Failed to load resource' not in e],'sin errores JS: %s'%pg.errors)
print('test_v176 OK',ok)
for s in SHOTS:print(s)
