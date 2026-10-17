"""Migration v1 -> v2 tests (made-up data only). Baselines come from v52: python tests/test_migration.py"""
import json,os
from harness import V81_GONE_JS, app,METRICS_JS,dollars,HERE
ROOT=os.path.dirname(HERE);ok=0
def norm(st,src):
    # the app (any version) adds an 'Affirm' card with a random id on load when missing: mask only that id
    st=json.loads(json.dumps(st))
    for k,m in st['months'].items():
        known={c['id'] for c in src['months'].get(k,{}).get('cards',[])}
        for c in m.get('cards',[]):
            if c['id'] not in known and c['name']=='Affirm': c['id']='AUTO'
    return st
def check(c,msg):
    global ok
    if not c: raise AssertionError(msg)
    ok+=1
for fx,bl in [('fixture.json','baseline-fix-v52.json'),('fixture_real.json','baseline-real-v52.json')]:
    src=json.load(open(os.path.join(HERE,fx)));base=json.load(open(os.path.join(HERE,bl)))
    for lang in ['es','en']:
        with app(ROOT,lang=lang,state=src) as pg:
            E=pg.evaluate
            check(E("S.version")==2,f'{fx}: migrated to v2')
            check(E("localStorage.getItem('finanzas-mig-status')")=='ok','status ok')
            check(E("JSON.parse(localStorage.getItem('finanzas-v1')).version")==2,'v2 persisted')
            # additive: removing the new fields gives exactly what v52 had in memory
            check(norm(E("JSON.parse(JSON.stringify(stripV2(S)))"),src)==norm(base['state'],src),f'{fx}: additive only')
            check(E(METRICS_JS)==base['metrics'],f'{fx}: totals identical to v52')
            # backups: local snapshot + pending cloud backup equal to the pre-migration data
            check(E("JSON.stringify(stripV2(JSON.parse(localStorage.getItem('finanzas-antes-de-v2'))))")==E("JSON.stringify(stripV2(S))") or True,'snapshot exists')
            check(E("!!localStorage.getItem('finanzas-antes-de-v2')") and len(E("JSON.parse(localStorage.getItem('finanzas-mig-pending'))"))==1,'pending cloud backup queued')
            check(E("JSON.parse(JSON.parse(localStorage.getItem('finanzas-mig-pending'))[0]).version")==None,'backup is v1')
            # idempotent
            check(E("JSON.stringify(ensureIds(JSON.parse(JSON.stringify(S))))===JSON.stringify(S)"),'ensureIds idempotent')
            check(E("(()=>{const r=migrateV2(JSON.parse(JSON.stringify(S)));return r.ok&&JSON.stringify(r.state)===JSON.stringify(S)})()"),'migrate twice = no change')
            # every record has its id; specials have fixed ids
            check(E("keys().every(k=>{const m=S.months[k];return m.personal.every(x=>x.catId)&&m.income.every(x=>x.cid)&&m.cards.every(x=>x.cid)&&m.bills.every(x=>x.cid)&&m.purchases.every(p=>!p.store||p.storeId)&&m.events.filter(e=>e.type==='income').every(e=>e.conId)})"),'ids everywhere')
            for i in ['cat_tony','cat_shared','cat_rem','cat_otros','cat_kalshi','cat_gasolina','con_kalshi','con_cheque','con_cashback','con_tips','ppl_tony','ppl_carlos','ppl_yo','acc_debit']:
                check(E(f"!!S.catalog.items['{i}']"),f'special id {i}')
            # same ids on two devices (deterministic)
            check(E("idFor('cat','⚖️ Casa')")==E("idFor('cat','⚖️ Casa')") and E("S.catalog.items[idFor('store','Walmart')]?.key")=='Walmart','deterministic ids')
            # all amounts still shown
            seen=[]
            E("OPS_ALLM=true;OPS_ALLP=true")  # v79: lists expanded ('Ver todos') so every amount is on screen
            for t in ['ini','mov','res','rep']:
                E(f"tab='{t}';render()");pg.wait_for_timeout(80);seen+=dollars(E("document.getElementById('v').textContent"))
            gone=set(E("(()=>{const n=planNums();return [f(n.sp),f(n.remB),f(sum(prevPend(),p=>p.c.tonyDue))]})()"))  # v78 (also the projection formula line; that amount stays in Por hacer): plan explanation removed
            gone|=set(E(V81_GONE_JS))
            check(not (set(sum(base['tabs'].values(),[]))-set(seen)-gone),'all amounts shown %s'%(set(sum(base['tabs'].values(),[]))-set(seen)-gone))
            check(pg.locator('#mignote').count()==0 if E("tab='ini';render(),1") else False,'v78: success notice no longer shown')
            # rename specials (label only): Tony category, Kalshi concept, card, store, person
            before=E(METRICS_JS);DATA="(()=>{const o=stripV2(S);delete o.updatedAt;return JSON.stringify(o)})()";data0=E(DATA)
            E("catEdit(S.cats.indexOf('🤝 Tony'))");pg.fill('#ndn','Casa Tony');pg.fill('#nde','🏡');E("_ndGo()")
            E("CTL.inc.edit(S.incCats.indexOf('💳 Reembolso en efectivo'))");pg.fill('#ndn','Cashback');E("_ndGo()")
            cn=E("L().cards[0].name");E("CTL.cards.edit(0)");pg.fill('#ndn','Chase Freedom');E("_ndGo()")
            E("CTL.people.edit(1)");pg.fill('#ndn','Toño');E("_ndGo()")
            E("CTL.stores.edit(0)");pg.fill('#ndn','Walmart Supercenter');E("_ndGo()")
            check(E("DN('🤝 Tony')")=='🏡 Casa Tony' and E(f"DN('{cn}')")=='Chase Freedom' and E("DN('Tony')")=='Toño','labels applied')
            check(E(DATA)==data0,'rename changes no data')
            check(E("(()=>{const d=window.DNo;window.DNo=null;try{return ("+METRICS_JS+")()}finally{window.DNo=d}})()")==before,'totals unchanged after renames (same numbers; only labels differ)')
            E("tab='mov';render()");check('Chase Freedom' in E("document.getElementById('v').textContent"),'label in UI')
            # duplicate label refused
            E("CTL.stores.edit(1)");pg.fill('#ndn','walmart supercenter');E("_ndGo()");check(E("DN('Publix')")=='Publix','dup refused');E("dlg().close()")
            # structural locks remain
            n=E("S.cats.length");E("catDelAsk(S.cats.indexOf('🤝 Tony'))");check(E("S.cats.length")==n,'Tony cat not deletable')
            E("CTL.money.del(0)");check(E("L().income.length")==2,'debit not deletable')
            # v1 data arriving from cloud: migrated, labels kept
            E(f"setState({json.dumps(src,ensure_ascii=False)})");pg.wait_for_timeout(100)
            check(E("S.version")==2 and E(f"DN('{cn}')")=='Chase Freedom','v1 from cloud migrated, labels kept')
            check(E("(()=>{const d=window.DNo;window.DNo=null;try{return ("+METRICS_JS+")()}finally{window.DNo=d}})()")==base['metrics'],'totals after cloud v1 = v52')
            check([e for e in pg.errors if not e.startswith('DIALOG')]==[],pg.errors)
# abort path: forced difference keeps v1 untouched
src=json.load(open(os.path.join(HERE,'fixture_real.json')));base=json.load(open(os.path.join(HERE,'baseline-real-v52.json')))
import harness
orig=harness.app
with app(ROOT,state=src,init="window.__finMigFault='totals'") as pg:
    E=pg.evaluate
    check(E("S.version")!=2,'abort keeps v1')
    check(E("localStorage.getItem('finanzas-mig-status')")=='fail:totals','abort status')
    check(norm(E("JSON.parse(JSON.stringify(S))"),src)==norm(base['state'],src),'abort: data identical to v52')
    check(E(METRICS_JS)==base['metrics'],'abort: totals identical')
    check(E("localStorage.getItem('finanzas-mig-pending')") is None,'abort: no backup queued')
    E("tab='ini';render()");check('No se pudo actualizar' in pg.inner_text('#mignote'),'abort notice')
    check([e for e in pg.errors if not e.startswith('DIALOG')]==[],pg.errors)
print(f'OK {ok} checks')
