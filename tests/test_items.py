"""Shared-purchase items with owners (v61; made-up data): python tests/test_items.py [--shots]"""
import os,sys,json,subprocess,tempfile,random
from harness import app,HERE,METRICS_JS
from itemhelp import item
ROOT=os.path.dirname(HERE);ok=0
def check(c,msg):
    global ok
    if not c: raise AssertionError(msg)
    ok+=1
def newp(pg,total,mode='fam',cat=None):
    pg.evaluate("()=>{tab='mov';render();editP()}");pg.wait_for_timeout(60)
    if cat:pg.select_option('#pcat',cat)
    if mode!='fam':pg.click('#meq' if mode=='eq' else '#mman')
    pg.fill('#tot',str(total));pg.dispatch_event('#tot','change');pg.click('#itog');pg.wait_for_timeout(40)
HOG,SAL,FOOD='🏠 Hogar','💊 Salud','🛒 Comida/Supermercado'
for lang in ['es','en']:
  ES=lang=='es'
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate
    E("()=>{tab='mov';render();editP()}");pg.wait_for_timeout(80)
    check(pg.locator('#itbox').count()==0,'collapsed by default')
    pg.fill('#tot','100');pg.click('#itog');pg.wait_for_timeout(40)
    check(pg.locator('#itbox .itrow').count()==1 and E("ownOf(D.list[0])")==['Yo'],'one row, owner Yo by default')
    # worked example (single owners): Carlos 10+20, Tony 10, Yo 10 -> Tony 35, Carlos 42.50, Yo 22.50
    item(pg,0,10,('Carlos',),'Shampoo');item(pg,1,20,('Carlos',));item(pg,2,10,('Tony',));item(pg,3,10,('Yo',))
    sh=E("D.shares");check(sh=={'Tony':35,'Carlos':42.5,'Yo':22.5},f'example {sh}')
    br=pg.inner_text('#ibrk');check('$50.00' in br and '$42.50' in br and '$12.50' in br,br)
    check(E("document.querySelector('#dlg input[data-w=Carlos]').value")=='42.5','share field live')
    # last owner can't be removed
    pg.click('.itrow[data-li="3"] button[data-own="Yo"]');pg.wait_for_timeout(20);check(E("ownOf(D.list[3])")==['Yo'],'at least one owner')
    # over -> red Sobra, blocked
    item(pg,4,80,('Tony',));check(pg.locator('#isobra').count()==1 and '$30.00' in pg.inner_text('#isobra') and E("document.getElementById('psave').disabled"),'Sobra blocked')
    n0=E("M().purchases.length");E("saveP()");check(E("M().purchases.length")==n0,'not saved when over')
    pg.click('.itrow[data-li="4"] button[aria-label]');pg.wait_for_timeout(30);check(pg.locator('#itbox .itrow').count()==4 and pg.locator('#isobra').count()==0,'remove item')
    if '--shots' in sys.argv:pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','120-compartida'+('' if ES else '-en')+'.png'))
    c0=E("calc(M())");e0=E("earned(M()).total");E("saveP()");p=E("M().purchases[0]")
    check(p['shares']=={'Tony':35,'Carlos':42.5,'Yo':22.5},p)
    check(p['items']['Carlos'][0]=={'a':10,'n':'Shampoo'} and len(p['items']['Carlos'])==2 and len(p['list'])==4,'single owners also saved in old format %s'%p)
    c1=E("calc(M())");check(abs(c1['tony']-c0['tony']-35)<1e-9 and abs(c1['carlos']-c0['carlos']-42.5)<1e-9,'Por cobrar')
    check(abs(E("earned(M()).total")-e0)<1e-9,'not income')
    E(f"editP('{p['id']}')");pg.wait_for_timeout(50);check(pg.locator('#itbox .itrow').count()==4 and pg.input_value('#itbox input[data-li="0"][data-k="n"]')=='Shampoo','edit restores')
    E("dlg().close()")
    # ---- owner combinations (fam remainder 50/25/25) ----
    newp(pg,100);item(pg,0,40,('Carlos',))
    check(E("D.shares")=={'Tony':30,'Carlos':55,'Yo':15},'1 owner %s'%E("D.shares"))
    item(pg,0,40,('Yo','Carlos'));check(E("D.shares")=={'Tony':30,'Carlos':35,'Yo':35},'2 owners 50/50 %s'%E("D.shares"))
    item(pg,0,40,('Tony','Carlos'));check(E("D.shares")=={'Tony':50,'Carlos':35,'Yo':15},'2 owners Tony+Carlos %s'%E("D.shares"))
    item(pg,0,40,('Yo','Tony','Carlos'));check(E("D.shares")=={'Tony':50,'Carlos':25,'Yo':25},'3 owners 50/25/25 %s'%E("D.shares"))
    E("dlg().close()")
    # eq mode remainder follows the mode; manual hides items
    newp(pg,100,'eq');item(pg,0,10,('Tony',));check(E("D.shares")=={'Yo':30,'Tony':40,'Carlos':30},'eq %s'%E("D.shares"))
    E("()=>{D.mode='manual';drawP()}");check(pg.locator('#itbox').count()==0 and pg.locator('#splitbal').count()==1,'manual unchanged');E("dlg().close()")
    # rounding: every total sums exactly; leftover cent on Yo
    newp(pg,10.01);item(pg,0,0.03,('Yo','Carlos'));sh=E("D.shares");check(abs(sum(sh.values())-10.01)<1e-9,'cents exact %s'%sh)
    item(pg,0,0.01,('Tony','Carlos'));sh=E("D.shares");check(abs(sum(sh.values())-10.01)<1e-9 and sh['Tony']==5.01 and sh['Carlos']==2.51 and sh['Yo']==2.49,'Yo absorbs the rounding %s'%sh);E("dlg().close()")
    fz=E("""()=>{let bad=[];for(let k=0;k<800;k++){const t=r2(Math.random()*500+0.01),L=[];let s=0;const n=Math.floor(Math.random()*4);
      for(let j=0;j<n;j++){const a=r2(Math.random()*(t-s)/2);if(a<=0)continue;s=r2(s+a);const ow=['Yo','Tony','Carlos'].filter(()=>Math.random()<.6);L.push({a,own:ow.length?ow:['Carlos']})}
      const P={total:t,mode:Math.random()<.5?'fam':'eq',who:['Yo','Tony','Carlos'].slice(0,1+Math.floor(Math.random()*3))},o=computeShares(P,L),sum=r2(Object.values(o).reduce((a,b)=>a+b,0));
      if(Math.abs(sum-t)>1e-9||Object.values(o).some(v=>Math.round(v*100)!==Math.round(v*100*1e6)/1e6))bad.push([t,L,o])}return bad}""")
    check(fz==[],'fuzz exact cents %s'%fz[:2])
    # ---- mixed categories -> budget ----
    b0=E(METRICS_JS)['2026-10']
    newp(pg,100);item(pg,0,40,('Yo','Carlos'),'Microondas',HOG);item(pg,1,10,('Yo',),'Vitaminas',SAL);item(pg,2,6,('Carlos',),'Shampoo',SAL)
    check(E("D.shares")=={'Tony':22,'Carlos':37,'Yo':41},'mixed %s'%E("D.shares"))
    if '--shots' in sys.argv:pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','127-items-compartidos'+('' if ES else '-en')+'.png'))
    E("saveP()");q=E("M().purchases[0]")
    check(q['list'][0]['own']==['Yo','Carlos'] and q['list'][0]['c']==HOG and q['list'][0]['catId'].startswith('cat') and 'items' not in q,'multi-owner saved as list %s'%q)
    b1=E(METRICS_JS)['2026-10'];d=lambda k:round(b1['spent']['by'].get(k,0)-b0['spent']['by'].get(k,0),2)
    check(d(HOG)==20 and d(SAL)==10 and d(FOOD)==11 and round(b1['spent']['total']-b0['spent']['total'],2)==41,'Joe portions by category %s'%{k:d(k) for k in (HOG,SAL,FOOD)})
    check(b1['earned']==b0['earned'] and round(b1['calc']['carlos']-b0['calc']['carlos'],2)==37,'Por cobrar, not income')
    c=E("msgFor('carlos','2026-10')");M2=E("DN('🏠 Hogar')")
    check(f"Microondas ({'conmigo' if ES else 'with me'}) · {M2} $40.00 → {'tu parte' if ES else 'your share'} $20.00" in c and f"Shampoo · {E('DN(\"💊 Salud\")')} $6.00" in c,'carlos lines: '+c)
    check(('+ parte compartida $11.00' if ES else '+ shared part $11.00') in c,'shared part line')
    t=E("msgFor('tony','2026-10')");check('Microondas' not in t,'tony sees only his items')
    E("()=>{const p=M().purchases[0];p.list[0].own=['Tony','Carlos']}")
    t=E("msgFor('tony','2026-10')");check(f"Microondas ({'con' if ES else 'with'} Carlos) · {M2} $40.00 → {'tu parte' if ES else 'your share'} $20.00" in t,'spec example line: '+t)
    E("()=>{const p=M().purchases[0];p.list[0].own=['Yo','Carlos']}")
    E("()=>{hRange='cur';render()}");pid=q['id'];pg.click(f'.hrow[data-id="{pid}"] .hexp');pg.wait_for_timeout(30)
    hd=pg.inner_text(f'.hrow[data-id="{pid}"] .hdet');check('Microondas' in hd and E("DN('Yo')")+' + Carlos' in hd and '$30.00 + $11.00' in hd and '$26.00 + $11.00' in hd,'history: '+hd)
    # simple purchase: no items/list
    E("()=>{editP()}");pg.fill('#tot','80');pg.dispatch_event('#tot','change');E("saveP()")
    q=E("M().purchases[0]");check('items' not in q and 'list' not in q and q['shares']=={'Tony':40,'Carlos':20,'Yo':20},q)
    check([e for e in pg.errors if not e.startswith('DIALOG')]==[],pg.errors)
# ---- backward compatibility: old 'solo de' purchases give identical totals in v60 and v61 ----
sha=subprocess.run(['git','log','--grep','^v60:','--format=%H','-1'],cwd=ROOT,capture_output=True,text=True).stdout.strip()
old=tempfile.mkdtemp();subprocess.run(f'git archive {sha} | tar -x -C {old}',shell=True,cwd=ROOT,check=True)
OLDP="""()=>{const m=S.months['2026-10'];m.purchases.push(
 {id:'o1',store:'Walmart',date:'2026-10-12',total:100,mode:'fam',who:['Yo','Tony','Carlos'],method:'',shares:{Tony:35,Carlos:42.5,Yo:22.5},items:{Carlos:[{a:10,n:'Shampoo',c:'💊 Salud'},{a:20}],Tony:[{a:10}],Yo:[{a:10,n:'Pilas',c:'🏠 Hogar'}]}},
 {id:'o2',store:'Publix',date:'2026-10-11',total:57.33,mode:'eq',who:['Yo','Carlos'],cat:'🏠 Hogar',method:'',shares:{Yo:30.16,Carlos:27.17},items:{Yo:[{a:3,c:'💊 Salud'}],Carlos:[{a:0.01}]}});
 S.months['2026-09'].purchases.push({id:'o3',store:'Aldi',date:'2026-09-03',total:12.34,mode:'fam',who:['Yo','Tony','Carlos'],method:'',shares:{Tony:5.67,Carlos:2.84,Yo:3.83},items:{Yo:[{a:1}]}});save();render()}"""
res={}
for root in (old,ROOT):
  with app(root) as pg:
    pg.evaluate(OLDP);pg.wait_for_timeout(50);res[root]=(pg.evaluate(METRICS_JS),pg.evaluate("JSON.stringify(S.months)"))
    if root==ROOT:
        for k in ('tony','carlos'):pg.evaluate(f"msgFor('{k}','2026-10')")
        pg.evaluate("()=>{tab='mov';hRange='all';hOpen.add('o1');hOpen.add('o2');render()}");check(pg.locator('.hdet').count()==2,'old purchases render in history')
        pg.evaluate("editP('o1')");pg.wait_for_timeout(50);check(pg.locator('#itbox .itrow').count()==4 and pg.evaluate("D.shares")=={'Tony':35,'Carlos':42.5,'Yo':22.5},'old items load as single owners, same split')
        pg.evaluate("dlg().close()");check(pg.evaluate("JSON.stringify(S.months)")==res[root][1],'read-only conversion (no data written)')
check(res[old][0]==res[ROOT][0],'identical totals v60 vs v61:\n%s\n%s'%(json.dumps(res[old][0])[:400],json.dumps(res[ROOT][0])[:400]))
print(f'OK {ok} checks')
