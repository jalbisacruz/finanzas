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
    sh=[x for x in L if 'Shampoo' in x][0];check('Hogar' in sh and ' No ' in sh and '$20.00' in sh,sh)
    vi=[x for x in L if 'Vino Tinto' in x][0];check('Joe y Tony' in vi and vi.count('$10.00')==2,vi)
    re_=[x for x in L if 'Resto de la compra' in x][0];check('Todos' in re_ and '50/25/25' not in m and '$60.00' in re_ and '$30.00' in re_ and re_.count('$15.00')==2,re_)
    co=[x for x in L if 'Toda la compra' in x and '$80.00' in x][0];check('Todos' in co and '$80.00' in co and '$40.00' in co and '$20.00' in co,co)
    check(any('Total del mes' in x for x in L),'month totals');hd=[x for x in L if 'Compartida' in x][0];check('Joe' in hd and 'Tony' in hd and 'Carlos' in hd and ' Yo ' not in hd,hd)
    check('Generado' not in m.split('Resumen mensual')[-1].split('Lo que tengo')[-1] and 'Finanzas ·' not in m,'footer only page')
    check(subprocess.run(['pdfinfo','/tmp/v66m.pdf'],capture_output=True,text=True).stdout.count('Pages:')==1,'pdf ok')
    # Tony: only items where Tony is owner (+resto); not Carlos's Shampoo, not Yo's articles
    check('Vino Tinto' in t and 'Shampoo' not in t and 'Articulo largo' not in t and 'Resto de la compra' in t,'tony private items hidden')
    check('Shampoo' in c and 'Vino Tinto' not in c and 'Articulo largo' not in c,'carlos private items hidden')
    tl=[x for x in t.splitlines() if 'Total del mes' in x];check(tl,'tony month total')
    check(' 1/' in m or '1/' in m,'page numbers')
    if '--shots' in sys.argv:
        for f_ in glob.glob('/tmp/v66p*.png'):os.remove(f_)
        subprocess.run(['pdftoppm','-png','-r','90','/tmp/v66m.pdf','/tmp/v66p'],check=True)
        pgs=sorted(glob.glob('/tmp/v66p*.png'));
        from shutil import copy
        txt=[subprocess.run(['pdftotext','-f',str(i+1),'-l',str(i+1),'/tmp/v66m.pdf','-'],capture_output=True,text=True).stdout for i in range(len(pgs))]
        i=[j for j,x in enumerate(txt) if 'Resto de la compra' in x][0];copy(pgs[i],os.path.join(ROOT,'shots','131-pdf-compartida.png'))
        subprocess.run(['pdftoppm','-png','-r','90','-f','1','-l','2','/tmp/v66t.pdf','/tmp/v66t'],check=True);copy(sorted(glob.glob('/tmp/v66t*.png'))[-1],os.path.join(ROOT,'shots','131-pdf-tony-compartida.png'))
print('test_pdfitems OK',ok)
