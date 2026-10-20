"""v77: each shared purchase as its own block (PDFs + link page) — visual only (made-up data): python tests/test_v77.py [--shots]"""
import json,os,sys,copy,subprocess,re
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
st=copy.deepcopy(FIX);m=st['months']['2026-10']
F3=[{'id':'d1','store':'Detwilers','date':'2026-10-11','total':5.2,'mode':'fam','who':['Yo','Tony','Carlos'],'method':'deb','shares':{'Tony':2.6,'Carlos':1.3,'Yo':1.3}},
    {'id':'d2','store':'Aldi','date':'2026-10-11','total':43.44,'mode':'fam','who':['Yo','Tony','Carlos'],'method':'deb','shares':{'Tony':21.72,'Carlos':10.86,'Yo':10.86}},
    {'id':'d3','store':'Walmart','date':'2026-10-11','total':5.32,'mode':'manual','who':['Carlos'],'method':'deb','cat':'💊 Salud','shares':{'Carlos':5.32}}]
m['purchases']=copy.deepcopy(F3)
def pdftext(path,page=None):
    a=['pdftotext','-layout']+(['-f',str(page),'-l',str(page)] if page else [])+[path,'-'];return subprocess.run(a,capture_output=True,text=True).stdout
with app(ROOT,state=st,init="localStorage.setItem('finanzas-sync-uid','u1');",routes=R) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1200)
    c0=E("calc(M())");s0=json.dumps(E("M().purchases"),sort_keys=True)
    for who,col in [('tony','Tony'),('carlos','Carlos'),(None,None)]:
        with pg.expect_download(timeout=20000) as d: E("w=>w?pdfDl(w,'2026-10'):pdfDl('mes','2026-10')",who) if who else E("()=>pdfDl('mes','2026-10')")
        p='/tmp/v77-%s.pdf'%(who or 'mes');d.value.save_as(p);tx=pdftext(p)
        for s,tot in [('Detwilers','$5.20'),('Aldi','$43.44'),('Walmart','$5.32')]:
            if who=='tony' and s=='Walmart':check('Walmart' not in tx,'v93: Carlos-only purchase hidden in Tony PDF');continue
            check(re.search(r'11 oct · %s.*\$%s'%(s,re.escape(tot[1:])),tx) and 'Total %s'%tot not in tx,'%s header line (date · store ... total) in %s'%(s,who))
        check('Comida/Supermercado' in tx and ('Salud' in tx or who=='tony'),'category chips')
        if who=='tony':
            check('Tu parte del mes' in tx and 'Total cuentas' in tx,'rest of Tony PDF unchanged')
            if '--shots' in sys.argv:
                subprocess.run(['pdftoppm','-png','-r','110','-f','1','-l','2',p,'/tmp/v77t'],check=True)
                import glob,shutil
                pages=sorted(glob.glob('/tmp/v77t-*.png'))
                for i,f in enumerate(pages):shutil.copy(f,os.path.join(ROOT,'shots','141-pdf-tony-p%d.png'%(i+1)))
    # many purchases -> none split across pages
    E("""()=>{const M0=M();for(let i=0;i<14;i++)M0.purchases.push({id:'z'+i,store:'Tienda'+i,date:'2026-10-'+String(12+i%15).padStart(2,'0'),total:30,mode:'fam',who:['Yo','Tony','Carlos'],method:'',shares:{Tony:15,Carlos:7.5,Yo:7.5},
      list:[{a:5,n:'Uno'+i,own:['Tony']},{a:4,n:'Dos'+i,own:['Carlos']},{a:3,n:'Tres'+i,own:['Yo','Tony']}]})}""")
    with pg.expect_download(timeout=20000) as d: E("()=>pdfDl('tony','2026-10')")
    d.value.save_as('/tmp/v77-many.pdf');n=int(re.search(r'Pages:\s+(\d+)',subprocess.run(['pdfinfo','/tmp/v77-many.pdf'],capture_output=True,text=True).stdout).group(1))
    check(n>=2,'multi-page');PT={i:pdftext('/tmp/v77-many.pdf',i) for i in range(1,n+1)}
    for i in range(14):
        pages=[pg_ for pg_ in range(1,n+1) if re.search(r'\b(Tienda|Tres)%d\b'%i,PT[pg_])]
        check(len(pages)==1,'purchase %d on one page %s'%(i,pages))
    E("()=>{M().purchases=M().purchases.filter(p=>!/^z/.test(p.id))}")
    check(E("calc(M())")==c0 and json.dumps(E("M().purchases"),sort_keys=True)==s0,'no data/calculation change')
    SNT=E("snapFor('Tony')")
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
# link page detail (iPhone size)
with app(ROOT,routes=R,init="window.__SHARE_DOC=%s;"%json.dumps({**SNT,'updatedAt':1760600000000}),width=390,height=844) as pg:
    base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t=TokTokTokTokTokTokTok1');pg.wait_for_timeout(500);E=pg.evaluate
    pg.click('#vdet');pg.wait_for_timeout(50)
    check(pg.locator('.pc').count()==2 and pg.locator('.pc .pchip').count()==2 and pg.locator('.pc td.hl').count()>=4,'v93: 2 purchase blocks (Carlos-only Walmart hidden) with chips + highlighted column')
    st_=E("(()=>{const a=document.querySelector('.pc'),s=getComputedStyle(a),t=getComputedStyle(a.querySelector('.pt b')),m=getComputedStyle(a.querySelector('.pamt'));return {bl:s.borderLeftWidth,mb:s.marginBottom,tf:t.fontSize,af:m.fontSize}})()")
    check(st_['bl']=='4px' and float(st_['tf'][:-2])>=16 and float(st_['af'][:-2])>=18 and float(st_['mb'][:-2])>=12,st_)
    check('Detwilers' in pg.inner_text('.pc >> nth=0') and '$5.20' in pg.inner_text('.pc >> nth=0 >> .pamt'),'header content')
    if '--shots' in sys.argv:pg.locator('#vdetb').screenshot(path=os.path.join(ROOT,'shots','141-enlace-detalle.png'))
    with pg.expect_download(timeout=15000) as d: pg.click('#vdl')
    d.value.save_as('/tmp/v77-link.pdf');tx=pdftext('/tmp/v77-link.pdf');check(re.search(r'11 oct · Aldi.*\$43\.44',tx) and 'Walmart' not in tx,'link PDF header line (v93: Carlos-only Walmart hidden)')
    if '--shots' in sys.argv:subprocess.run(['pdftoppm','-png','-r','110','-f','1','-l','1','-singlefile','/tmp/v77-link.pdf',os.path.join(ROOT,'shots','141-pdf-enlace-tony')],check=True)
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
print('test_v77 OK',ok)
