"""v70: Tony/Carlos dialog: 📎 Enviar con PDF / 💬 Solo texto (made-up data): python tests/test_msg2.py [--shots]"""
import os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
ADD="""()=>{S.months['2026-10'].purchases.push({id:'m70',store:'Aldi',date:'2026-10-14',total:107,tax:7,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',shares:{Tony:32.1,Carlos:58.85,Yo:16.05},list:[{a:40,n:'Vitaminas',own:['Carlos']}]});save();
 window._sh=[];navigator.canShare=d=>true;navigator.share=async d=>{_sh.push({text:d.text,files:(d.files||[]).map(x=>x.name)})}}"""
for lang in ['es','en']:
  ES=lang=='es'
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate;E(ADD)
    E("()=>shareMsg('carlos','2026-10','pdf')");pg.wait_for_timeout(50)
    t=pg.input_value('#msgt');check(('Aldi — $58.85' in t) and 'Vitaminas' not in t and t==E("msgShort('carlos','2026-10')")+'\n\n'+('El detalle está en el PDF.' if ES else 'The details are in the PDF.') and ('El detalle está en el PDF.' if ES else 'The details are in the PDF.') in t and E("f(calc(M()).carlosDue)") in t,t)
    if '--shots' in sys.argv:pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','134-enviar-con-pdf'+('' if ES else '-en')+'.png'))
    pg.click('#msgsh');pg.wait_for_function("_sh.length==1",timeout=15000);s=E("_sh[0]");check(s['files']==['Carlos-2026-10.pdf'] and s['text']==t,s)
    pg.click('#mmtxt');pg.wait_for_timeout(50);t=pg.input_value('#msgt')
    ln=[x for x in t.splitlines() if 'Aldi' in x];check(('14 oct · Aldi — $58.85' if ES else 'Oct 14 · Aldi — $58.85') in ln,ln)
    check('Vitaminas' not in t and ('PENDIENTE' if ES else 'PENDING') in t,'short, total por cobrar: '+t)
    if '--shots' in sys.argv:pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','134-solo-texto'+('' if ES else '-en')+'.png'))
    pg.click('#msgsh');pg.wait_for_timeout(200);s=E("_sh.at(-1)");check(s['files']==[] and s['text']==t,s)
    check(pg.locator('#msgcp').count()==1 and pg.locator('#msgdl').count()==1,'copy + download kept')
    E("dlg().close()")
    # Tony: bills + transfer lines kept, purchases one line each
    E("()=>shareMsg('tony','2026-10','txt')");t=pg.input_value('#msgt')
    check(('CUENTAS' if ES else 'BILLS') in t and ('A TRANSFERIRTE' if ES else 'TO TRANSFER YOU') in t and any(x.endswith('$32.10') and 'Aldi' in x for x in t.splitlines()),t)
    E("()=>shareMsg('tony','2026-10','pdf')");t=pg.input_value('#msgt');check(('A TRANSFERIRTE' if ES else 'TO TRANSFER YOU') in t and ('PDF' in t.splitlines()[-1]) and E("f(calc(M()).tonyDue)") in t,t)
    E("dlg().close()")
    # desktop: no file sharing -> download + copy + explanation
    E("()=>{navigator.canShare=()=>false;window._cp=null;navigator.clipboard.writeText=async x=>{window._cp=x}}")
    E("()=>shareMsg('carlos','2026-10','pdf')")
    with pg.expect_download(timeout=15000) as d: pg.click('#msgsh')
    check(d.value.suggested_filename=='Carlos-2026-10.pdf','downloaded');pg.wait_for_timeout(100)
    check(E("window._cp")==pg.input_value('#msgt') and len(pg.inner_text('#msgnote'))>20,'copied + note: '+pg.inner_text('#msgnote'))
    errs=[e for e in pg.errors if 'DIALOG' not in e];check(not errs,errs)
print('test_msg2 OK',ok)
