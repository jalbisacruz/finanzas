"""v143 (DATOS DE EJEMPLO) — actualizado en v147: «Ya se depositó» ya no existe en ningún día; los ayudantes de fecha (NY) siguen.
python tests/test_v143.py
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

def base(pending='2026-11-12', extra_months=None):
    S=copy.deepcopy(FIX);S['cur']='2026-11'
    S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':1000,'role':'debit'}],'cards':[],'bills':[],'personal':[],'purchases':[],
      'events':[{'id':'e05','type':'check','date':'2026-11-05','amount':500,'checkId':'c05','desc':'Cheque 5 nov'}],'tonyBase':0}
    S['checks']=[{'id':'c05','amount':500,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05'},
                 {'id':'c12','amount':0,'amtPending':True,'date':pending,'status':'pending'}]
    S['wm']={'est':200,'chk':{},'paid':{}}
    if extra_months:
        for k,m in extra_months.items():
            S['months'][k]=m
    return S

# helpers de fecha (calendario de Nueva York) siguen disponibles
with app(ROOT,now='2026-11-11T10:00:00',state=base(),new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    check(E('CODE_V')>='v143','ver')
    check(E("ywPrevDay('2026-11-12')")=='2026-11-11','prev of Thu 12 is Wed 11')
    check(E("ywPrevDay('2026-10-01')")=='2026-09-30','month boundary')
    check(E("ywPrevDay('2026-01-01')")=='2025-12-31','year boundary')
    check(E("ywTodayNY(new Date('2026-11-11T23:30:00-05:00'))")=='2026-11-11','late Wed')
    check(E("ywTodayNY(new Date('2026-11-12T00:15:00-05:00'))")=='2026-11-12','just after midnight Thu')

# v147: el botón no sale ningún día (martes, miércoles anterior, jueves) y guardar no hace nada
for now in ('2026-11-10T16:00:00','2026-11-11T10:00:00','2026-11-11T23:30:00','2026-11-12T10:00:00'):
    with app(ROOT,now=now,state=base(),new_look=True,ctx_opts={'timezone_id':'America/New_York'}) as pg:
        E=pg.evaluate;pg.wait_for_timeout(600)
        E("()=>{tab='ini';render()}");pg.wait_for_timeout(200)
        check(pg.locator('#ywearly').count()==0 and 'Ya se depositó' not in pg.inner_text('#v'),'sin botón '+now)
        deb=E("debE(L()).amount")
        E("""()=>{document.body.insertAdjacentHTML('beforeend','<input id="ywea" value="480"><input id="ywed" value="2026-11-11">');ywEarlyDlg();ywEarlySave('c12');ywEarlySave()}""");pg.wait_for_timeout(150)
        check(E("S.checks.find(c=>c.id==='c12').status")=='pending' and abs(E("debE(L()).amount")-deb)<0.001 and not E("dlg().open"),'ywEarly* no acreditan '+now)
        check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)

print('test_v143 OK',ok)
