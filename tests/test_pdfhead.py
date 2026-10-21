"""v65: PDF header title/subtitle (made-up fixture)"""
import os,subprocess,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
def grab(pg,kind,path):
    with pg.expect_download(timeout=15000) as d: pg.evaluate(f"()=>pdfDl('{kind}','2026-10')")
    d.value.save_as(path);return subprocess.run(['pdftotext','-layout','-l','1',path,'-'],capture_output=True,text=True).stdout
for lang,init,exp in [('es','',['Cuentas de la casa · Octubre 2026','Resumen de Joe · De Joe Albisa Cruz · 16 oct 2026','Resumen de Tony · De Joe Albisa Cruz','Resumen de Carlos · De Joe Albisa Cruz']),
                      ('en',"window.fbName=()=>'Test Person';",['Household accounts · October 2026','Summary for Joe · From Test Person · Oct 16, 2026'])]:
  with app(ROOT,lang=lang,now='2026-10-16T09:00:00') as pg:
    if init: pg.evaluate("()=>{"+init+"}")
    t=grab(pg,'mes','/tmp/m-%s.pdf'%lang)+grab(pg,'tony','/tmp/t-%s.pdf'%lang)+grab(pg,'carlos','/tmp/c-%s.pdf'%lang)
    for e in exp: check(e in t,'%s missing in\n%s'%(e,t[:600]))
    check('Finanzas · Oct' not in t and 'Finanzas · Oct 2026' not in t,'old line removed')
    if lang=='es' and '--shots' in sys.argv:
        subprocess.run(['pdftoppm','-png','-r','110','-f','1','-l','1','-y','0','-H','160','-W','935','/tmp/m-es.pdf','/tmp/head'],check=True)
        import shutil,glob;shutil.copy(glob.glob('/tmp/head*.png')[0],os.path.join(ROOT,'shots','129-encabezado-pdf.png'))
print('test_pdfhead OK',ok)
