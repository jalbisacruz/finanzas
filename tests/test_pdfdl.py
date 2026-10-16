"""v64: ⬇️ Descargar PDF downloads directly (no share sheet); made-up fixture"""
import os
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
for lang,lbl,name in [('es','⬇️ Descargar PDF','Resumen-mensual-2026-10.pdf'),('en','⬇️ Download PDF','Monthly-summary-2026-10.pdf')]:
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate;E("()=>{window._shared=0;navigator.share=async()=>{window._shared++};navigator.canShare=()=>true}")
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(50)
    check(pg.inner_text('#pdfdl')==lbl,'label %s'%lang)
    with pg.expect_download(timeout=15000) as d: pg.click('#pdfdl')
    dd=d.value;check(dd.suggested_filename==name,dd.suggested_filename);p=dd.path();check(open(p,'rb').read(5)==b'%PDF-','is pdf')
    check(E("window._shared")==0,'no share sheet')
    for who,fn in [('tony','Tony-2026-10.pdf'),('carlos','Carlos-2026-10.pdf')]:
        E(f"()=>shareMsg('{who}',S.cur)");pg.wait_for_timeout(50)
        with pg.expect_download(timeout=15000) as d: pg.click('#msgdl')
        check(d.value.suggested_filename==fn,d.value.suggested_filename);E("dlg().close()")
    check(E("window._shared")==0,'no share')
print('test_pdfdl OK',ok)
