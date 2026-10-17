"""v81: reembolsos (↩️ Reembolso, cash back) no son ingreso; Kalshi neto; Ingresos esperados solo cheques; Reportes › Reembolsos (made-up data): python tests/test_v81.py [--shots]"""
import json,os,sys,re,subprocess
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
def shot(pg,n,loc=None):
    if not SH:return
    pg.evaluate("()=>document.querySelectorAll('.toast').forEach(t=>t.remove())")
    p=os.path.join(ROOT,'shots','146-%s.png'%n);(pg.locator(loc).screenshot(path=p) if loc else pg.screenshot(path=p))
KAL='📈 Kalshi'
for lang in ['es','en']:
  ES=lang=='es'
  with app(ROOT,lang=lang,width=390,height=844,expand=False) as pg:
    E=pg.evaluate;T=lambda s,*a:E("([s,a])=>T(s,...a)",[s,list(a)])
    # (1) nombre
    check(E("DN('↩️ Reembolso')")==('↩️ Reembolso' if ES else '↩️ Reimbursement'),'name back to just Reembolso')
    E("incDlg()");check('(Carlos/Tony)' not in pg.inner_text('#icats'),'no (Carlos/Tony) in chips');E("dlg().close()")
    # (2) fuera de ingresos; saldos igual que antes
    raw=E("earnedRaw(M())");new=E("earned(M())")
    check('💳 Reembolso en efectivo' in raw['by'] and '💳 Reembolso en efectivo' not in new['by'],'cash back out of income')
    check(abs(new['total']-(raw['total']-raw['by']['💳 Reembolso en efectivo']))<0.001,'income total drops by the cash back only')
    check('↩️ Reembolso de Carlos' not in raw['by'] and '↩️ Reembolso de Carlos' not in new['by'],'Carlos collections were never income (verified)')
    d0=E("debE(L()).amount");P0=E("planNums()")
    E("incDlg()");pg.fill('#ia','7');pg.click('#icats .chip[data-c="↩️ Reembolso"]');pg.click('#isave');pg.wait_for_timeout(60)
    check(abs(E("debE(L()).amount")-(d0+7))<0.001,'money still lands in debit')
    check(abs(E("earned(M()).total")-new['total'])<0.001 and abs(E("earnedRaw(M()).total")-(raw['total']+7))<0.001,'Reembolso income not counted as income')
    P1=E("planNums()");check(P1['inc']==P0['inc'] and P1['real']==P0['real'],'Plan unchanged by a reembolso')
    # Ingresos esperados = solo cheques; Sobrante real = ingreso real
    pr=E("_planNumsV81()");check(abs(P1['inc']-(pr['inc']-pr['rec']+P1['cheq']))<0.001,'Ingresos esperados uses paychecks only %s %s'%(P1,pr))
    E("()=>{L().events.push({id:'pt1',type:'income',date:'2026-10-12',amount:25,concept:'💵 Propinas',desc:'Propinas',method:'deb'})}")
    P2=E("planNums()");check(P2['inc']==P1['inc'] and abs(P2['real']-(P1['real']+25))<0.001,'tips: real income yes, expected no')
    # Kalshi neto
    E("()=>{L().events.push({id:'kx1',type:'income',date:'2026-10-11',amount:50,concept:'%s',desc:'Kalshi',method:'deb'});L().personal.unshift({id:'kx2',date:'2026-10-11',amount:20,cat:'%s',desc:'Kalshi',method:'deb'})}"%(KAL,KAL))
    er=E("earned(L())");sp=E("spent(L())");P3=E("planNums()")
    check(abs(er['by'].get(KAL,0)-30)<0.001 and KAL not in sp['by'],'Kalshi net +30 = income only %s'%er['by'])
    check(P3['inc']==P2['inc'] and abs(P3['real']-(P2['real']+30))<0.001,'Kalshi never in Ingresos esperados; counts in Sobrante real')
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(60)
    check(pg.locator('#gpcard').inner_text().count(E("DN('%s')"%KAL))==0,'no Kalshi in Gastos por categoría when net > 0')
    sp0=E("spent(L()).total")
    E("()=>{L().personal[0].amount=80;}")
    er=E("earned(L())");sp=E("spent(L())")
    check(KAL not in er['by'] and abs(sp['by'].get(KAL,0)-30)<0.001 and abs(sp['total']-(sp0+30))<0.001,'Kalshi net −30 = expense once %s'%sp['by'])
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(60)
    g=E("document.getElementById('gpcard').textContent");check(g.count(E("DN('%s')"%KAL))==1 and E("f(30)") in g,'Kalshi shown once in Gastos por categoría')
    check(E("f(spent(M()).total)") in pg.inner_text('#gastocard'),'Gastos del mes includes the Kalshi net loss')
    check(E("DN('%s')"%KAL) not in E("document.getElementById('inccard').textContent"),'not in Ingresos por concepto')
    # (3) Reportes › Reembolsos: Carlos + Reembolso + cash back con tarjeta, lo más nuevo primero, total
    rc=pg.inner_text('#reemcard');ids=E("[...document.querySelectorAll('#reemcard .row')].map(r=>r.dataset.id)")
    check(T('Cobrado a Carlos') in rc and 'Visa Test' in rc and (('Cash back' in rc)) and E("DN('↩️ Reembolso')") in rc,'three kinds '+rc)
    dates=E("[...document.querySelectorAll('#reemcard .row')].map(r=>findMonth('events',r.dataset.id).events.find(e=>e.id===r.dataset.id).date)")
    check(dates==sorted(dates,reverse=True),'newest first %s'%dates)
    check(E("document.getElementById('reemtot').textContent")==E("f(20+1.24+7)"),'total reembolsos')
    check(pg.locator('#cbcard').count()==1,'per-card cash back report kept')
    inc=E("document.getElementById('inccard').textContent");check('Reembolso' not in inc and 'Reimbursement' not in inc and 'Cash back' not in inc,'Ingresos por concepto without reembolsos')
    check(E("f(earned(M()).total)") in E("document.querySelector('#inccard h2').textContent"),'Ingresos por concepto total')
    if ES:
        E("()=>{document.getElementById('reemcard').scrollIntoView()}");shot(pg,'reembolsos','#reemcard');shot(pg,'ingresos-por-concepto','#inccard')
    E("()=>{tab='mov';render()}");check(E("f(earned(M()).total)") in pg.inner_text('#opinc h2'),'Operaciones › Ingresos total')
    # PDF del mes: Ingresos por concepto sin reembolsos
    with pg.expect_download(timeout=20000) as d: E("()=>pdfDl('mes','2026-10')")
    p='/tmp/v81-%s.pdf'%lang;d.value.save_as(p);tx=subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout
    sec=tx.split(T('Ingresos por concepto'))[1].split(T('Tony: transferencia'))[0]
    check('Reembolso' not in sec and 'Reimbursement' not in sec and 'Cash' not in sec and E("f(earned(M()).total)") in sec,'PDF income section '+sec)
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(60)
    if ES: shot(pg,'hoy-plan','#plancard')
    errs=[x for x in pg.errors if 'DIALOG' not in x];check(not errs,errs)
print('test_v81 OK',ok)
