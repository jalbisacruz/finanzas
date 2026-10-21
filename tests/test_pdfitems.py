"""v66: per-person shared-purchase detail in PDFs (made-up data)"""
import os,subprocess,sys,glob,shutil
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
ADD="""()=>{const P=S.months['2026-10'].purchases;
 P.push({id:'v66a',store:'Publix',date:'2026-10-11',total:100,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',shares:{Tony:40,Carlos:35,Yo:25},
  list:[{a:20,n:'Shampoo',own:['Carlos'],c:'🏠 Hogar'},{a:20,n:'Vino Tinto',own:['Yo','Tony']}]});
 P.push({id:'v66b',store:'Costco',date:'2026-10-13',total:80,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',shares:{Tony:40,Carlos:20,Yo:20}});
 for(let i=0;i<14;i++)P.push({id:'v66x'+i,store:'Aldi',date:'2026-10-2'+(i%9),total:30,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',shares:{Tony:15,Carlos:7.5,Yo:7.5},
  list:[{a:6,n:'Articulo largo de prueba numero '+i+' con nombre muy largo',own:['Yo']}]});save()}"""
def grab(pg,kind,path):
    with pg.expect_download(timeout=20000) as d: pg.evaluate(f"()=>pdfDl('{kind}','2026-10')")
    d.value.save_as(path);return subprocess.run(['pdftotext','-layout',path,'-'],capture_output=True,text=True).stdout
with app(ROOT,now='2026-10-16T09:00:00') as pg:
    pg.evaluate(ADD)
    m=grab(pg,'mes','/tmp/v66m.pdf');t=grab(pg,'tony','/tmp/v66t.pdf');c=grab(pg,'carlos','/tmp/v66c.pdf')
    L=[x for x in m.splitlines()]
    # v95: una fila por compra (fecha, tienda, pagó, total, Joe/Tony/Carlos); debajo solo los ítems que NO son de todos
    sh=[x for x in L if 'Shampoo' in x][0];check('$20.00' in sh and 'solo Carlos' in sh,sh)
    vi=[x for x in L if 'Vino Tinto' in x][0];check('Joe y Tony' in vi and '$20.00' in vi,vi)
    pu=[x for x in L if 'Publix' in x and '$100.00' in x][0];check('$25.00' in pu and '$40.00' in pu and '$35.00' in pu and 'Joe' in pu,pu)
    co=[x for x in L if 'Costco' in x and '$80.00' in x][0];check('$40.00' in co and co.count('$20.00')==2,co)
    hd=[x for x in L if 'Tienda' in x and 'Pagó' in x][0];check('Joe' in hd and 'Tony' in hd and 'Carlos' in hd and ' Yo ' not in hd,hd)
    check('Finanzas ·' not in m,'footer only page')
    check(subprocess.run(['pdfinfo','/tmp/v66m.pdf'],capture_output=True,text=True).stdout.count('Pages:')==1,'pdf ok')
    # all 3 PDFs: same shared purchases and the same complete month totals
    for x in (t,c):check('Vino Tinto' in x and 'Shampoo' in x and 'Articulo largo' in x and 'Costco' in x,'shared purchases in every PDF')
    tot=lambda s:[x for x in s.splitlines() if 'Total del mes' in x][-1].split()
    check(tot(m)==tot(t)==tot(c),'same month totals %s %s %s'%(tot(m),tot(t),tot(c)))
    check(all('Quién transfiere a quién'.upper() in x and 'Cómo se calcula' in x for x in (m,t,c)),'transfer block in all')
    check(' 1/' in m or '1/' in m,'page numbers')
    if '--shots' in sys.argv:
        for f_ in glob.glob('/tmp/v66p*.png'):os.remove(f_)
        subprocess.run(['pdftoppm','-png','-r','90','/tmp/v66m.pdf','/tmp/v66p'],check=True)
        pgs=sorted(glob.glob('/tmp/v66p*.png'));
        from shutil import copy
        txt=[subprocess.run(['pdftotext','-f',str(i+1),'-l',str(i+1),'/tmp/v66m.pdf','-'],capture_output=True,text=True).stdout for i in range(len(pgs))]
        i=[j for j,x in enumerate(txt) if 'Resto de la compra' in x][0];copy(pgs[i],os.path.join(ROOT,'shots','132-pdf-mes.png'))
        subprocess.run(['pdftoppm','-png','-r','90','-f','1','-l','2','/tmp/v66t.pdf','/tmp/v66t'],check=True);copy(sorted(glob.glob('/tmp/v66t*.png'))[0],os.path.join(ROOT,'shots','132-pdf-tony.png'))
        for f_ in glob.glob('/tmp/v66c*.png'):os.remove(f_)
        subprocess.run(['pdftoppm','-png','-r','90','-f','1','-l','1','/tmp/v66c.pdf','/tmp/v66c'],check=True);copy(sorted(glob.glob('/tmp/v66c*.png'))[0],os.path.join(ROOT,'shots','132-pdf-carlos.png'))
print('test_pdfitems OK',ok)
