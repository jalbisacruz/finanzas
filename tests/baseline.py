"""Record numbers + loaded state from a checkout of the PREVIOUS version:
python baseline.py <root> <fixture.json> <out.json>"""
import sys,json
from harness import app,METRICS_JS,dollars
root,fx,out=sys.argv[1],sys.argv[2],sys.argv[3]
with app(root,state=json.load(open(fx))) as pg:
    res={'metrics':pg.evaluate(METRICS_JS),'state':pg.evaluate('JSON.parse(JSON.stringify(S))'),'tabs':{}}
    for t in ['ini','res','cue','com','rep']:
        pg.evaluate(f"tab='{t}';render()");pg.wait_for_timeout(100)
        res['tabs'][t]=dollars(pg.evaluate("document.getElementById('v').textContent"))
    res['errors']=pg.errors
json.dump(res,open(out,'w'),ensure_ascii=False)
print('errors',res['errors'])
