"""Run against a checkout of the PREVIOUS version to record numbers: python baseline.py <root> <out.json>"""
import sys,json
from harness import app,METRICS_JS,dollars
root,out=sys.argv[1],sys.argv[2]
with app(root) as pg:
    res={'metrics':pg.evaluate(METRICS_JS),'tabs':{}}
    for t in ['ini','res','cue','com','rep']:
        pg.evaluate(f"tab='{t}';render()");pg.wait_for_timeout(100)
        res['tabs'][t]=dollars(pg.inner_text('#v'))
    res['errors']=pg.errors
json.dump(res,open(out,'w'),ensure_ascii=False,indent=1)
print('errors',res['errors']);print(res['metrics']['hoy'])
