"""v92 (made-up data): una compra cuenta exactamente la parte calculada de Joe (aquí $0: Gillette es de Carlos y el impuesto va con él).
Partes guardadas viejas se recalculan al cargar/restaurar; 1¢ de redondeo antiguo y reparto Manual no se tocan."""
import os,json,base64,subprocess,tempfile
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
CAT='🧴 Cuidados Personales'
def state(shares):
    st=json.loads(json.dumps(FIX));m=st['months']['2026-10'];st['cats']=st.get('cats',[])+[CAT];st['budgets'][CAT]=10
    m['purchases'].append({'id':'wm','store':'Walmart','date':'2026-10-07','total':5.32,'tax':0.35,'mode':'fam','who':['Yo','Tony','Carlos'],'cat':CAT,'method':'card:Visa Test',
      'list':[{'a':4.97,'n':'Gillette','own':['Carlos']}],'shares':shares})
    # 1¢ de redondeo antiguo (sin ítems) y un reparto manual: no se tocan
    m['purchases'].append({'id':'old1','store':'Publix','date':'2026-10-02','total':50.91,'mode':'fam','who':['Yo','Tony','Carlos'],'method':'deb','shares':{'Tony':25.45,'Carlos':12.73,'Yo':12.73}})
    m['purchases'].append({'id':'man','store':'Target','date':'2026-10-03','total':30,'mode':'manual','who':['Yo','Tony'],'method':'deb','shares':{'Tony':10,'Yo':20}})
    return st
def pdftext(pg):
    b=pg.evaluate("async()=>{const f=await makePDF('mes',S.cur);const a=new Uint8Array(await f.arrayBuffer());let s='';for(const x of a)s+=String.fromCharCode(x);return btoa(s)}")
    p=tempfile.mktemp(suffix='.pdf');open(p,'wb').write(base64.b64decode(b));return subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout
def views(pg,E):
    E("()=>{tab='rep';render();const c=document.getElementById('gpcard');if(c.classList.contains('col'))c.querySelector('h2').click()}");pg.wait_for_timeout(150);gp=pg.inner_text('#gpcard')
    return {'sp':E(f"spent(L()).by['{CAT}']||0"),'bud':E(f"budBy(L()).by['{CAT}']||0"),'gp':gp,'plan':E("planNums().sp"),'yo':E("L().purchases.find(p=>p.id==='wm').shares")}
GOOD={'Tony':0,'Carlos':5.32,'Yo':0}
for label,stale in [('correct',GOOD),('stale Yo 3 (sum ≠ total)',{'Tony':0,'Carlos':5.32,'Yo':3}),('stale Tony+Carlos 2.32 (sum = total)',{'Tony':0,'Carlos':2.32,'Yo':3}),('before tax/items (Familia on total)',{'Tony':2.66,'Carlos':1.33,'Yo':1.33})]:
    with app(ROOT,now='2026-10-17T09:00:00',state=state(stale),expand=False) as pg:
        E=pg.evaluate;v=views(pg,E)
        check(v['yo']==GOOD,'%s: shares computed %s'%(label,v['yo']))
        check(v['sp']==0 and v['bud']==0,'%s: category counts $0 for Joe (%s/%s)'%(label,v['sp'],v['bud']))
        row=[l for l in v['gp'].split('\n\n') if 'Cuidados' in l];check(row and '$0.00 de $10.00' in v['gp'],'%s: report shows $0.00 of $10.00 %s'%(label,row))
        check(E("L().purchases.find(p=>p.id==='old1').shares")=={'Tony':25.45,'Carlos':12.73,'Yo':12.73} and E("L().purchases.find(p=>p.id==='man').shares")=={'Tony':10,'Yo':20},'%s: 1¢ old rounding and Manual untouched'%label)
        healed=E("JSON.parse(localStorage.getItem('finanzas-v92-healed')||'[]').map(x=>x.id)");check(healed==([] if stale==GOOD else ['wm']),'%s: healed %s'%(label,healed))
        if stale!=GOOD:check(E("JSON.parse(localStorage.getItem('finanzas-v1')).months['2026-10'].purchases.find(p=>p.id==='wm').shares")==GOOD,'%s: saved'%label)
        t=pdftext(pg);ln=[l for l in t.split('\n') if 'Cuidados' in l];check(ln and '$0.00' in ln[0] and '$3.00' not in t.replace('$3.00 de','') or not ln,'%s: monthly PDF %s'%(label,ln))
        c=E("calc(L())");check(abs(c['carlos']-E("calc(L()).carlos"))<1e-9,'calc ok')
        E("()=>{tab='ini';render()}");check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
# restaurar / sincronizar un estado viejo también lo arregla
with app(ROOT,now='2026-10-17T09:00:00',expand=False) as pg:
    E=pg.evaluate;E("o=>setState(o)",state({'Tony':0,'Carlos':5.32,'Yo':3}));check(E("L().purchases.find(p=>p.id==='wm').shares")==GOOD and E(f"spent(L()).by['{CAT}']||0")==0,'setState heals')
    # guardado desde el diálogo (la forma exacta de la compra de Joe)
    E(f"""()=>{{editP(null);D.store='Walmart';D.date='2026-10-07';D.total=5.32;D.tax=0.35;D.cat='{CAT}';D.method='card:Visa Test';D.mode='fam';D.list=[{{a:4.97,n:'Gillette',own:['Carlos']}}];drawP()}}""");pg.wait_for_timeout(100)
    check('Compartido $0.00' in pg.inner_text('dialog'),'dialog shows Shared $0.00');E("saveP()");pg.wait_for_timeout(100)
    p=E("L().purchases.filter(p=>p.store==='Walmart'&&p.date==='2026-10-07').at(-1)");check(p['shares']==GOOD,'dialog saves Carlos 5.32 %s'%p['shares'])
    # otras fuentes legítimas de la categoría (lo que Joe debe revisar): cuenta de Tony con esa categoría, ítem propio en otra compra, gasto
    E(f"""()=>{{const m=L();m.bills.push({{id:'bx',name:'Barbería',amount:3,paid:3,cat:'{CAT}'}});tab='rep';render();const c=document.getElementById('gpcard');if(c.classList.contains('col'))c.querySelector('h2').click()}}""");pg.wait_for_timeout(100)
    gp=pg.inner_text('#gpcard');check('$3.00 de $10.00' in gp and 'incl. Tony $3.00' in gp,'Tony bill with that category shows as incl. Tony: '+gp[:300])
    E("()=>{L().bills=L().bills.filter(b=>b.id!=='bx');const p=L().purchases.find(p=>p.store==='Publix');p.list=[{a:3,n:'Desodorante',own:['Yo'],c:'%s'}];p.shares=computeShares(p,p.list);render()}"%CAT)
    check(abs(E(f"spent(L()).by['{CAT}']")-3)<0.005,'Joe own item in another purchase with that category counts there')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v92 OK',ok)
