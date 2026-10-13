import sys
from harness import app,dollars
with app('/workspace/finanzas',lang=sys.argv[1] if len(sys.argv)>1 else 'es') as pg:
    for t in ['ini','mov','res','rep','cfg']:
        pg.evaluate(f"tab='{t}';render()");pg.wait_for_timeout(150)
        print('==',t,pg.inner_text('#v')[:1500].replace('\n',' | '))
    print('ERR',pg.errors)
