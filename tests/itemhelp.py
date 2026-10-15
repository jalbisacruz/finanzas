"""UI helper: fill one shared-purchase item row (v61)."""
import json
def item(pg,i,a,own=('Yo',),n='',c=None):
    while pg.locator('#itbox .itrow').count()<=i:pg.click('#itadd');pg.wait_for_timeout(20)
    pg.fill(f'#itbox input[data-li="{i}"][data-k="a"]',str(a))
    if n:pg.fill(f'#itbox input[data-li="{i}"][data-k="n"]',n)
    for w in pg.evaluate(f"S.people"):
        on=pg.evaluate(f"ownOf(D.list[{i}]).includes({json.dumps(w)})")
        if on!=(w in own):
            if not on or len(own)>0:
                # add first, remove later so it never becomes empty
                pass
    for w in own:
        if not pg.evaluate(f"ownOf(D.list[{i}]).includes({json.dumps(w)})"):pg.click(f'.itrow[data-li="{i}"] button[data-own="{w}"]');pg.wait_for_timeout(15)
    for w in pg.evaluate("S.people"):
        if w not in own and pg.evaluate(f"ownOf(D.list[{i}]).includes({json.dumps(w)})"):pg.click(f'.itrow[data-li="{i}"] button[data-own="{w}"]');pg.wait_for_timeout(15)
    if c:pg.select_option(f'#itbox select[data-li="{i}"]',c)
    pg.wait_for_timeout(20)
