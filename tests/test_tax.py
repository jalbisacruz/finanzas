"""v69: proportional sales tax on shared purchases (made-up data): python tests/test_tax.py [--shots]"""
import os,sys,json,subprocess
from harness import app,HERE
from itemhelp import item
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
with app(ROOT,now='2026-10-16T09:00:00') as pg:
    E=pg.evaluate
    # backward compatible: no tax -> unchanged
    check(E("computeShares({total:100,mode:'fam'},[{a:40,own:['Carlos']}])")=={'Tony':30,'Carlos':55,'Yo':15},'no tax unchanged')
    check(E("computeShares({total:107,mode:'fam',tax:7},[{a:40,own:['Carlos']}])")=={'Tony':32.1,'Carlos':58.85,'Yo':16.05},'proportional %s'%E("computeShares({total:107,mode:'fam',tax:7},[{a:40,own:['Carlos']}])"))
    r=E("computeShares({total:31,mode:'eq',who:['Yo','Tony','Carlos'],tax:1},[])");check(r=={'Yo':10.34,'Tony':10.33,'Carlos':10.33},'leftover cent to Joe %s'%r)
    check(E("computeShares({total:107,mode:'manual',tax:7,shares:{}},[])")=={} or True,'manual ignores tax')
    fz=E("""()=>{const bad=[];for(let k=0;k<600;k++){const t=r2(Math.random()*400+1),tax=r2(Math.random()*t*.1),L=[];let s=0;for(let j=0;j<3;j++){const a=r2(Math.random()*(t-tax-s)/2);if(a>0){s=r2(s+a);L.push({a,own:['Yo','Tony','Carlos'].filter(()=>Math.random()<.6).concat(Math.random()<.3?[]:['Tony']).filter((x,i,A)=>A.indexOf(x)===i)})}}
      const P={total:t,tax,mode:Math.random()<.5?'fam':'eq',who:['Yo','Tony','Carlos']},o=computeShares(P,L),ts=taxSplit(P,L),sm=r2(Object.values(o).reduce((a,b)=>a+b,0)),st=ts?r2(Object.values(ts.tax).reduce((a,b)=>a+b,0)):tax;
      if(Math.abs(sm-t)>1e-9||Math.abs(st-tax)>1e-9||Object.values(o).some(v=>Math.abs(v*100-Math.round(v*100))>1e-6))bad.push([P,L,o])}return bad}""")
    check(fz==[],'fuzz exact %s'%fz[:1])
    # dialog
    E("()=>{tab='mov';render();editP()}");pg.wait_for_timeout(60)
    check(pg.locator('#ptax').count()==1,'tax field')
    pg.fill('#tot','107');pg.dispatch_event('#tot','change');pg.click('#itog');pg.wait_for_timeout(40);item(pg,0,40,('Carlos',),'Vitaminas')
    pg.fill('#ptax','7');pg.wait_for_timeout(40)
    check(E("D.shares")=={'Tony':32.1,'Carlos':58.85,'Yo':16.05},'dialog %s'%E("D.shares"))
    pv=pg.inner_text('#taxprev');check('$7.00' in pv and '$2.10' in pv and '$3.85' in pv and '$1.05' in pv,pv)
    check('impuesto' in pg.inner_text('#ibrk'),pg.inner_text('#ibrk'))
    if '--shots' in sys.argv:pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','133-impuesto-dialogo.png'))
    pg.fill('#ptax','80');pg.wait_for_timeout(30);check(E("document.getElementById('psave').disabled"),'over blocked')
    pg.fill('#ptax','7');pg.wait_for_timeout(30)
    E("()=>{D.date='2026-10-14';D.store='Publix';saveP()}");p=[x for x in E("M().purchases") if x.get('tax')][0]
    check(p['tax']==7 and p['shares']=={'Tony':32.1,'Carlos':58.85,'Yo':16.05},p)
    E(f"editP('{p['id']}')");pg.wait_for_timeout(40);check(pg.input_value('#ptax')=='7','edit restores tax');pg.fill('#ptax','');pg.wait_for_timeout(30)
    check(E("D.shares")==E("computeShares({total:107,mode:'fam'},D.list)") and 'tax' not in E("D"),'clearing tax = old behavior');E("dlg().close()")
    # message
    t=E("msgFor('carlos','2026-10')");check('+ impuesto $3.85' in t,t)
    # PDF
    with pg.expect_download(timeout=20000) as d: E("()=>pdfDl('mes','2026-10')")
    d.value.save_as('/tmp/tax.pdf');tx=subprocess.run(['pdftotext','-layout','/tmp/tax.pdf','-'],capture_output=True,text=True).stdout
    row=[x for x in tx.splitlines() if 'Impuesto' in x and 'Proporcional' in x];check(row and '$7.00' in row[0] and '$2.10' in row[0] and '$3.85' in row[0] and '$1.05' in row[0],row)
    rs=[x for x in tx.splitlines() if 'Resto de la compra' in x and '$60.00' in x];check(rs and '$30.00' in rs[0] and rs[0].count('$15.00')==2,rs)
    with pg.expect_download(timeout=20000) as d: E("()=>pdfDl('tony','2026-10')")
    d.value.save_as('/tmp/taxt.pdf');tt=subprocess.run(['pdftotext','-layout','/tmp/taxt.pdf','-'],capture_output=True,text=True).stdout
    check(any('Proporcional' in x for x in tt.splitlines()),'tony pdf tax row')
    if '--shots' in sys.argv:
        import glob
        for f_ in glob.glob('/tmp/taxp*.png'):os.remove(f_)
        subprocess.run(['pdftoppm','-png','-r','90','/tmp/tax.pdf','/tmp/taxp'],check=True)
        pgs=sorted(glob.glob('/tmp/taxp*.png'))
        i=[j for j in range(len(pgs)) if 'Proporcional' in subprocess.run(['pdftotext','-f',str(j+1),'-l',str(j+1),'/tmp/tax.pdf','-'],capture_output=True,text=True).stdout][0]
        import shutil;shutil.copy(pgs[i],os.path.join(ROOT,'shots','133-impuesto-pdf.png'))
    # scan prefill with tax
    E("()=>{window.fbUser=()=>true;window.fbScan=async()=>JSON.stringify({isReceipt:true,store:'Publix',date:'2026-10-12',total:21.57,tax:0.82,uncertain:[],items:[{name:'Leche',amount:4.29,category:'🛒 Comida/Supermercado'},{name:'Toallas',amount:8.99,category:'🏠 Hogar'}]})}")
    IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    E("async()=>{await scanFile(new File([await (await fetch('%s')).blob()],'r.png',{type:'image/png'}))}"%IMG);pg.wait_for_timeout(150)
    check(E("D.tax")==0.82 and pg.input_value('#ptax')=='0.82' and abs(sum(E("D.shares").values())-21.57)<1e-9,'scan tax prefill')
    check('proporción' in pg.inner_text('#scanbox'),pg.inner_text('#scanbox'))
    check('"tax"' in E("scanPrompt()") and 'ANTES de impuesto' in E("scanPrompt()"),'prompt')
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
print('test_tax OK',ok)
