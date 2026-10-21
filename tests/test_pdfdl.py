import re
"""v64: ⬇️ Descargar PDF downloads directly (no share sheet); made-up fixture"""
import os
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
for lang,lbl,name in [('es','⬇️ Descargar PDF','Resumen-Octubre-2026-Joe'),('en','⬇️ Download PDF','Summary-October-2026-Joe')]:  # v80: names carry month and time
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate;E("()=>{window._shared=0;navigator.share=async()=>{window._shared++};navigator.canShare=()=>true}")
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(50)
    check(pg.locator('#pdfdl').count()==0,'v94: no Descargar button in Resumen %s'%lang)
    with pg.expect_download(timeout=15000) as d: E("pdfDl('mes')")
    dd=d.value;check(re.match(re.escape(name)+r'-13oct-10-0\d(am|pm)\.pdf$',dd.suggested_filename),dd.suggested_filename);p=dd.path();check(open(p,'rb').read(5)==b'%PDF-','is pdf')
    check(E("window._shared")==0,'no share sheet')
    for who,fn in [('tony','Tony'),('carlos','Carlos')]:
        E(f"()=>shareMsg('{who}',S.cur)");pg.wait_for_timeout(50)
        with pg.expect_download(timeout=15000) as d: pg.click('#msgdl')
        check(re.match(fn+'-'+('Octubre' if lang=='es' else 'October')+r'-2026-13oct-10-0\d(am|pm)\.pdf$',d.value.suggested_filename),d.value.suggested_filename);E("dlg().close()")
    check(E("window._shared")==0,'no share')
print('test_pdfdl OK',ok)
