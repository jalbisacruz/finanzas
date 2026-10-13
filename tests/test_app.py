"""Repeatable UI tests (made-up data only). Run: python tests/test_app.py [--shots]
Requires: pip install playwright && playwright install chromium"""
import json, os, sys, re
from harness import app, METRICS_JS, dollars, HERE
ROOT=os.path.dirname(HERE); SHOTS='--shots' in sys.argv
ok=0
def check(c,msg):
    global ok
    if not c: raise AssertionError(msg)
    ok+=1
base=json.load(open(os.path.join(HERE,'baseline-v51.json')))
# 1) Totals identical to v51 and every amount shown before is still shown somewhere
for lang in ['es','en']:
    with app(ROOT,lang=lang) as pg:
        check(pg.evaluate(METRICS_JS)==base['metrics'],'metrics differ from v51')
        seen=[]
        for t in ['ini','mov','res','rep']:
            pg.evaluate(f"tab='{t}';render()");pg.wait_for_timeout(120);seen+=dollars(pg.evaluate("document.getElementById('v').textContent"))
        old=set(sum(base['tabs'].values(),[]));missing=old-set(seen)
        check(not missing,f'amounts missing in new UI: {missing}')
        txt=''
        for t in ['ini','mov','res','rep','cfg']:
            pg.evaluate(f"tab='{t}';render()");pg.wait_for_timeout(120);txt+=pg.inner_text('#v')
            ids=pg.evaluate("[...document.querySelectorAll('[id]')].map(x=>x.id)");check(len(ids)==len(set(ids)),f'duplicate ids on {t}')
            if SHOTS and lang=='es':
                pg.screenshot(path=os.path.join(ROOT,'shots',f'11{["ini","mov","res","rep","cfg"].index(t)}-{t}.png'),full_page=False)
        if lang=='en':
            for w in ['Débito','Ingreso','Configuración','Cuentas de Tony','Pendiente','Transferir']:
                check(w not in txt,f'Spanish text in EN mode: {w}')
        check('Ingreso Tony' not in txt and 'Ingreso Carlos' not in txt,'reimbursement labelled as income')
        check(pg.errors==[],pg.errors)
# 2) Behaviour
with app(ROOT) as pg:
    E=pg.evaluate
    # nav: 4 tabs + settings in drawer
    check(E("[...document.querySelectorAll('nav button')].map(b=>b.dataset.t).join()")=='ini,mov,res,rep','bottom tabs')
    E("openDrawer()");check('Configuración' in pg.inner_text('#drawer'),'settings in menu');E("closeDrawer()")
    # check 1-tap: simulate auto deposit today then "Otro monto"
    E("()=>{const c=S.checks.find(x=>x.id==='k3');c.date=today();c.status='deposited';c.auto=true;c.depositedOn=today();debE(L()).amount=r2(debE(L()).amount+720);L().events.push({id:'vx',type:'check',date:today(),amount:720,checkId:'k3',auto:true});tab='ini';render()}")
    check(pg.locator('#chknote').count()==1,'check note shown')
    d0=E("debE(L()).amount");E("chkOther('k3')");pg.fill('#cka','700');E("chkFix('k3')")
    check(abs(E("debE(L()).amount")-(d0-20))<0.001 and E("L().events.find(e=>e.id==='vx').amount")==700,'check fix adjusts debit and event')
    check(pg.locator('#chknote').count()==0,'note gone after fix')
    # debit never negative: shrinking a check below available is blocked
    E("()=>{const c=S.checks.find(x=>x.id==='k3');c.ok=false;debE(L()).amount=5;render()}");E("chkOther('k3')");pg.fill('#cka','1');E("chkFix('k3')")
    check(E("debE(L()).amount")==5,'debit stayed non-negative');E("dlg().close();debE(L()).amount=1000")
    # share message
    t=E("msgFor('tony','2026-10')");check('855.40' in t and 'Rent House' not in t or 'Renta de casa' in t,'tony msg');check('$50.00' in E("msgFor('carlos','2026-10')"),'carlos msg')
    E("navigator.share=undefined;shareMsg('carlos','2026-10')");check(pg.locator('#msgt').count()==1,'copy fallback');E("dlg().close()")
    # store memory: quick expense
    E("quick()");pg.fill('#qa','10');pg.fill('#qd','Shell');E("document.querySelector('#qcats .chip[data-c=\"⛽ Gasolina\"]').click();document.getElementById('qm').value='card:Visa Test'");E("saveQuick()")
    E("quick()");pg.locator('#qd').fill('shell');pg.wait_for_timeout(50)
    check(E("document.querySelector('#qcats .chip.on').dataset.c")=='⛽ Gasolina' and E("document.getElementById('qm').value")=='card:Visa Test','remembered cat+card');E("dlg().close()")
    # catalogs: rename card updates refs everywhere; totals unchanged
    before=E("JSON.stringify(Object.fromEntries(keys().map(k=>[k,calc(S.months[k])])))")
    E("CTL.cards.edit(0)");pg.fill('#ndn','Visa Nueva');pg.fill('#ndd','20');E("_ndGo()")
    check(E("DN('Visa Test')")=='Visa Nueva' and E("S.cardDue['Visa Test']")==20,'card label renamed (data keeps its key)')
    check(before==E("JSON.stringify(Object.fromEntries(keys().map(k=>[k,calc(S.months[k])])))"),'totals unchanged after rename')
    # duplicate refused
    E("CTL.stores.add()");pg.fill('#ndn','walmart');E("_ndGo()");check(E("S.stores.length")==3,'dup store refused');E("dlg().close()")
    # income concept in use -> move dialog; locked can't delete
    E("CTL.inc.add()");pg.fill('#ndn','Venta');pg.fill('#nde','🧾');E("_ndGo()");check('🧾 Venta' in E("S.incCats"),'concept added')
    # people locked
    E("CTL.people.del(1)");check('Tony' in E("S.people"),'Tony locked')
    # bill with amount can't be removed
    n=E("L().bills.length");E("CTL.bills.del(0)");check(E("L().bills.length")==n,'bill with amount kept')
    # debit line can't be removed
    E("CTL.money.del(0)");check(E("L().income.length")==2,'debit kept')
    E("tab='cfg';render()");check('v' in pg.inner_text('#appver'),'version shown')
    check([e for e in pg.errors if not e.startswith('DIALOG')]==[],pg.errors)
print(f'OK {ok} checks')
