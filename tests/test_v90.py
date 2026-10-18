"""v90 «Nada de redundar» (made-up data): en Hoy cada cosa una sola vez."""
import os,sys,re
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
with app(ROOT,now='2026-10-17T09:00:00',expand=False,width=390,height=844) as pg:
    E=pg.evaluate
    E("""()=>{localStorage.setItem('finanzas-last-export',today());S.cardDue['Visa Test']=20;S.cardDue['Store Card']=14;
      INBOX=[{id:'x1',t:'t',link:'Tony',store:'Publix',total:12}];spend('deb',-152);S.held=[{id:'h1',who:'Amigo',amount:152,date:'2026-10-17',method:'deb',via:'Western Union',note:'',at:1,sends:[]}];tab='ini';REM_ALL=true;render()}""");pg.wait_for_timeout(200)
    v=pg.inner_text('#v')
    check(pg.locator('#inbbtn').count()==0 and v.count('por revisar')==1,'inbox once on Hoy (Recordatorios)')
    E("REM_ALL=true;render()");v=pg.inner_text('#v')
    check(len(re.findall('terceros',v))==1 and 'Tuyo:' in pg.inner_text('#herocard'),'terceros once (Disponible ahora subtitle) %s'%re.findall('.*terceros.*',v))
    check(v.count('Store Card')==1 and v.count('Visa Test')==1,'card due once')
    check(v.count('Sept 2026 sin transferir')==1,'Tony previous month once')
    n=E("todoN()");rem=E("remList().filter(r=>/^(card|tony):/.test(r.id)).length")
    t=pg.inner_text('#todobtn');check(t.startswith('📌 %d cosas más por hacer'%(n-rem)),'Por hacer counts only the rest: %s (todo %d, in reminders %d)'%(t,n,rem))
    pg.click('#todobtn');pg.wait_for_timeout(150);check(E("tab")=='mov' and pg.locator('#todocard .row').count()==n,'Operaciones › Por hacer still lists everything')
    check('(1)' in pg.inner_text('#inbbtn'),'Operaciones › Compras keeps an entry to the inbox')
    pg.click('#inbbtn');pg.wait_for_timeout(100);check('Compras por revisar (1)' in pg.inner_text('dialog'),'opens list');E("dlg().close()")
    E("()=>{tab='ini';render()}");pg.click('#remcard [data-rem="inbox"] .remgo');pg.wait_for_timeout(100);check('Compras por revisar (1)' in pg.inner_text('dialog'),'reminder opens list');E("dlg().close()")
    # ✕ en la tarjeta: vuelve a contarse en Por hacer
    pg.click('#remcard [data-rem="card:Visa Test"] .remx');pg.wait_for_timeout(100);check(pg.inner_text('#todobtn').startswith('📌 %d cosas más'%(n-rem+1)),'dismissed reminder counted again in Por hacer')
    if SH:
        E("()=>{localStorage.removeItem('finanzas-rem-hide');REM_ALL=false;render()}");pg.add_style_tag(content='.toast,#fab{display:none!important}');E("scrollTo(0,0)");pg.wait_for_timeout(100)
        pg.screenshot(path=os.path.join(ROOT,'shots','v90-hoy.png'),full_page=False)
    # todo lo de Por hacer ya está en Recordatorios → sin línea; nada pendiente → «todo al día»
    E("()=>{localStorage.removeItem('finanzas-rem-hide');keys().slice(0,-1).forEach(k=>delete S.months[k]);const m=L();m.bills=[];m.purchases=[];m.events=m.events.filter(e=>e.type!=='carlos');m.tonyBase=0;m.carlosBase=0;save();render()}");pg.wait_for_timeout(100)
    n2=E("todoN()");rem2=E("remList().filter(r=>/^(card|tony):/.test(r.id)).length")
    if n2==rem2 and n2>0:check(pg.locator('#todoline').count()==0 and pg.locator('#remcard').count()==1,'all todo items are reminders → no extra line')
    E("()=>{S.cardDue={};render()}");n3=E("todoN()")
    if n3==0:check('todo al día' in pg.inner_text('#todoline'),'nothing pending → todo al día')
    check(E("[...document.querySelectorAll('#v>.card')].map(c=>c.id)").index('remcard') if pg.locator('#remcard').count() else True,'ok')
    E("LANG='en';S.cardDue={'Visa Test':20};INBOX=[{id:'x1',t:'t',link:'Tony'}];render()");check(pg.locator('#inbbtn').count()==0,'EN no button')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v90 OK',ok)
