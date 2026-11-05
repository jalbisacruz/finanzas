"""v131: desglose bajo Ingresos esperados — Real cobrado + YoWash/Walmart con fechas."""
import os,copy,json,re
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
    S['wm']={'est':226.51,'paid':{'2026-11-05':226.51},'chk':{'2026-11-19':226.51},'pendCleared':'2026-11-19','anchor':'2026-11-05'}
    S['incCats']=list(dict.fromkeys((S.get('incCats') or [])+['🏪 Walmart']))
    return S

# 1) Con montos definidos: breakdown con fechas
S=nov_base()
with app(ROOT,now='2026-11-05T10:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    assert E('CODE_V')>='v131'
    P=E('planNums()');print('CON',json.dumps({k:P[k] for k in ['inc','n','real','ywGot','wmGot','ywEst','wmEst','ywLines','wmLines']},indent=2))
    assert abs(P['real']-758.11)<0.01,P
    assert abs(P['ywEst']-1594.80)<0.01 and abs(P['wmEst']-226.51)<0.01,P
    assert abs(P['inc']-2579.42)<0.01,P
    assert [x['d'] for x in P['ywLines']]==['2026-11-12','2026-11-19','2026-11-26'],P
    assert [x['d'] for x in P['wmLines']]==['2026-11-19'],P
    t=pg.inner_text('#plancard');print('PLAN',t)
    assert 'Real cobrado' in t and 'YoWash' in t and 'Walmart' in t
    assert re.search(r'12\s*nov',t,re.I) and re.search(r'19\s*nov',t,re.I) and re.search(r'26\s*nov',t,re.I)
    assert pg.locator('#pl-inc-break').count()==1
    pg.locator('#plancard').screenshot(path=os.path.join(SH,'v131-ingresos-desglose.png'))
    pg.locator('#pl-inc-break').screenshot(path=os.path.join(SH,'v131-break-only.png'))

# 2) Pendiente: mismas cifras vía último cobrado + desglose visible
S2=nov_base()
S2['checks']=[
    {'id':'yw5','amount':531.60,'date':'2026-11-05','status':'deposited','depositedOn':'2026-11-05'},
    {'id':'yw12','amount':0,'amtPending':True,'date':'2026-11-12','status':'pending'},
]
S2['wm']={'est':226.51,'paid':{'2026-11-05':226.51},'chk':{'2026-11-19':0},'anchor':'2026-11-05'}
with app(ROOT,now='2026-11-05T10:00:00',state=S2,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600)
    P=E('planNums()');print('PEND',json.dumps({k:P[k] for k in ['inc','n','real','ywEst','wmEst','ywLines','wmLines']},indent=2))
    assert abs(P['inc']-2579.42)<0.01 and P['n']==4,P
    assert len(P['ywLines'])==3 and len(P['wmLines'])==1,P
    t=pg.inner_text('#pl-inc-break');print('BR',t)
    assert 'Real cobrado' in t and '$758.11' in t
    assert 'YoWash' in t and 'Walmart' in t
    pg.locator('#plancard').screenshot(path=os.path.join(SH,'v131-ingresos-pendiente.png'))

# 3) Inicio de mes: sin Real cobrado, 4 YoWash + 2 Walmart
S3=copy.deepcopy(FIX)
S3['cur']='2026-11'
S3['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':100,'role':'debit'}],'cards':[],'bills':[],'purchases':[],'personal':[],'events':[]}
S3['checks']=[{'id':'yw5','amount':531.60,'date':'2026-11-05','status':'pending'}]
S3['wm']={'est':226.51,'paid':{},'chk':{},'anchor':'2026-11-05'}
S3['incCats']=list(dict.fromkeys((S3.get('incCats') or [])+['🏪 Walmart']))
with app(ROOT,now='2026-11-04T10:00:00',state=S3,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(500)
    P=E('planNums()');print('START',json.dumps({k:P[k] for k in ['inc','n','real','ywEst','wmEst','ywLines','wmLines']},indent=2))
    assert P['real']==0 and len(P['ywLines'])==4 and len(P['wmLines'])==2,P
    t=pg.inner_text('#pl-inc-break')
    assert 'Real cobrado' not in t
    assert 'YoWash' in t and 'Walmart' in t
    assert re.search(r'5\s*nov',t,re.I)
    pg.locator('#plancard').screenshot(path=os.path.join(SH,'v131-ingresos-inicio-mes.png'))
    assert not [e for e in pg.errors if 'DIALOG' not in e],pg.errors
print('test_v131 OK')
