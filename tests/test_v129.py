"""v129: Ingresos esperados = cobrados del mes + (próximo monto × cobros sin cobrar). Sin inventar si Pendiente."""
import os,copy,json
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)

def nov_base():
    S=copy.deepcopy(FIX)
    S['cur']='2026-11'
    octm=S['months']['2026-10']
    S['months']['2026-11']={
        'income':[{'id':'i1','name':'Débito','amount':500,'role':'debit'}],
        'cards':copy.deepcopy(octm.get('cards') or []),
        'bills':[],'purchases':[],'personal':[],
        'events':[
            {'id':'yw5','type':'check','date':'2026-11-05','amount':531.60,'desc':'Cheque 11/05','checkId':'yw5'},
            {'id':'wm5','type':'income','date':'2026-11-05','amount':226.51,'concept':'🏪 Walmart','desc':'Walmart','method':'deb'},
        ],
    }
    S['checks']=[
        {'id':'yw5','amount':531.60,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05'},
        {'id':'yw12','amount':531.60,'date':'2026-11-12','status':'pending'},
    ]
    # próximo Walmart YA definido (pendCleared evita que v128Heal lo ponga a 0)
    S['wm']={'est':226.51,'paid':{'2026-11-05':226.51},'chk':{'2026-11-19':226.51},'pendCleared':'2026-11-19','anchor':'2026-11-05'}
    S['incCats']=list(dict.fromkeys((S.get('incCats') or [])+['🏪 Walmart']))
    return S

# 1) Con montos del próximo: cobrados + restantes × próximo
S=nov_base()
with app(ROOT,now='2026-11-05T10:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    assert E('CODE_V')=='v129'
    P=E('planNums()');print('CON',json.dumps({k:P[k] for k in ['inc','n','ywGot','wmGot','ywEst','wmEst','plan']},indent=2))
    # YoWash left: 12,19,26 → 3×531.60=1594.80; Walmart left: 19 → 1×226.51
    assert abs(P['ywGot']-531.60)<0.01 and abs(P['wmGot']-226.51)<0.01,P
    assert abs(P['ywEst']-1594.80)<0.01 and abs(P['wmEst']-226.51)<0.01,P
    assert abs(P['inc']-(531.60+226.51+1594.80+226.51))<0.01,P
    assert P['n']==4,P  # 3 YoWash + 1 Walmart
    t=pg.inner_text('#plancard');print('PLAN',t)
    assert 'Ingresos esperados' in t
    pg.locator('#plancard').screenshot(path=os.path.join(SH,'v129-ingresos-con-montos.png'))
    pg.locator('#herocard').screenshot(path=os.path.join(SH,'v129-caja-azul.png'))

# 2) Pendiente: no inventar — solo cobrados
S2=nov_base()
S2['checks']=[
    {'id':'yw5','amount':531.60,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05'},
    {'id':'yw12','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'},
]
S2['wm']={'est':226.51,'paid':{'2026-11-05':226.51},'chk':{'2026-11-19':0},'anchor':'2026-11-05'}
with app(ROOT,now='2026-11-05T10:00:00',state=S2,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    P=E('planNums()');print('PEND',json.dumps({k:P[k] for k in ['inc','n','ywGot','wmGot','ywEst','wmEst']},indent=2))
    assert abs(P['ywGot']-531.60)<0.01 and abs(P['wmGot']-226.51)<0.01,P
    assert P['ywEst']==0 and P['wmEst']==0 and P['n']==0,P
    assert abs(P['inc']-(531.60+226.51))<0.01,P
    # withEst no debe colar el último cheque en ingresos esperados
    P2=E('withEst(planNums)');assert P2['ywEst']==0 and abs(P2['inc']-P['inc'])<0.01,P2
    t=pg.inner_text('#plancard');print('PLAN2',t)
    pg.locator('#plancard').screenshot(path=os.path.join(SH,'v129-ingresos-pendiente.png'))

# 3) Inicio de mes (antes del 1er cobro): 4 YoWash + 2 Walmart × próximo
S3=copy.deepcopy(FIX)
S3['cur']='2026-11'
S3['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':100,'role':'debit'}],'cards':[],'bills':[],'purchases':[],'personal':[],'events':[]}
S3['checks']=[{'id':'yw5','amount':531.60,'date':'2026-11-05','status':'pending'}]
S3['wm']={'est':226.51,'paid':{},'chk':{},'anchor':'2026-11-05'}
S3['incCats']=list(dict.fromkeys((S3.get('incCats') or [])+['🏪 Walmart']))
with app(ROOT,now='2026-11-04T10:00:00',state=S3,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    P=E('planNums()');print('START',json.dumps({k:P[k] for k in ['inc','n','ywGot','wmGot','ywEst','wmEst']},indent=2))
    assert P['ywGot']==0 and P['wmGot']==0,P
    assert abs(P['ywEst']-531.60*4)<0.01 and abs(P['wmEst']-226.51*2)<0.01,P
    assert P['n']==6,P
    assert abs(P['inc']-(531.60*4+226.51*2))<0.01,P
    pg.locator('#plancard').screenshot(path=os.path.join(SH,'v129-ingresos-inicio-mes.png'))
    assert not [e for e in pg.errors if 'DIALOG' not in e],pg.errors
print('test_v129 OK')
