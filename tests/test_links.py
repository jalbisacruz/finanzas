"""v71: private read-only links for Tony/Carlos (fake Firebase, made-up data): python tests/test_links.py [--shots]"""
import json,os,sys
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
ADD="""()=>{S.months['2026-10'].purchases.push({id:'l71',store:'Aldi',date:'2026-10-14',total:107,tax:7,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',shares:{Tony:32.1,Carlos:58.85,Yo:16.05},list:[{a:40,n:'Vitaminas',own:['Carlos']}]});save()}"""
FORBID=['cards','income','accounts','debit','spent','budgets','incCats','events','recipients','balance','credit']
with app(ROOT,init="localStorage.setItem('finanzas-sync-uid','u1');",routes=R) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);E(ADD)
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(100)
    check(pg.locator('#lnkcard').count()==1 and pg.locator('#lnkon-Tony').count()==1,'config section')
    pg.check('#lnkon-Tony');pg.check('#lnkon-Carlos');pg.wait_for_timeout(600)
    L=E("S.links");tt,tc=L['Tony']['t'],L['Carlos']['t'];check(len(tt)==22 and tt!=tc,'128-bit tokens %s'%L)
    docs=E("window.__fs.docs");dt,dc=docs.get('shares/'+tt),docs.get('shares/'+tc);check(dt and dc and dt['owner']=='u1','written')
    for d in (dt,dc):
        s=json.dumps(d,ensure_ascii=False)
        for k in FORBID: check('"%s"'%k not in s,'forbidden key %s'%k)
        check(set(d.keys())=={'v','who','lang','names','from','months','updatedAt','owner','buyers','cats'},d.keys())
    # nothing from accounts/cards (names) leaks
    m=E("M()");s=json.dumps(dc,ensure_ascii=False)
    for x in m['cards']+m['income']:
        if x.get('name'):check(x['name'] not in s,'leak '+x['name'])
    c=E("calc(M())");mo=dc['months'][0];check(mo['k']=='2026-10' and abs(mo['pending']-c['carlosDue'])<1e-9 and abs(mo['share']-c['carlos'])<1e-9,'carlos totals')
    mt=dt['months'][0];check(abs(mt['pending']-c['tonyDue'])<1e-9 and mt['bills'] and 'cards' not in mt,'tony totals + bills')
    p=[x for x in mo['purchases'] if x['s']=='Aldi' and x['t']==107][0];names=[r['n'] for r in p['rows']]
    check(names==['Vitaminas','Resto de la compra','Impuesto'] and p['tot']['Carlos']==58.85,p)
    check(abs(sum(sum(r['v'].values()) for r in p['rows'])-107)<1e-6,'rows sum to total')
    # auto update on change
    E("()=>{S.months['2026-10'].purchases.find(x=>x.id==='l71').shares.Carlos=60;save()}");pg.wait_for_timeout(6000)
    check(E(f"window.__fs.docs['shares/{tc}'].months[0].purchases.find(p=>p.t===107).tot.Carlos")==60,'auto updated')
    # regenerate deletes old doc
    E("()=>{window.confirm=()=>true}");pg.click('#lnkrg-Carlos');pg.wait_for_timeout(400)
    n=E("S.links.Carlos.t");docs=E("window.__fs.docs");check(n!=tc and 'shares/'+tc not in docs and 'shares/'+n in docs,'regenerated')
    # copy link
    E("()=>{window._cp=null;navigator.clipboard.writeText=async x=>{window._cp=x}}");pg.click('#lnkcp-Tony');pg.wait_for_timeout(100)
    check(E("window._cp").endswith('/v.html?t='+tt),E("window._cp"))
    if '--shots' in sys.argv:pg.locator('#lnkcard').screenshot(path=os.path.join(ROOT,'shots','135-enlaces-config.png'))
    # off deletes
    pg.uncheck('#lnkon-Tony');pg.wait_for_timeout(300);check('shares/'+tt not in E("window.__fs.docs") and not E("S.links.Tony.on"),'off deletes')
    DOCT,DOCC=dt,E(f"window.__fs.docs['shares/{n}']")
# public page with a fake doc
for who,doc in [('tony',DOCT),('carlos',DOCC)]:
  with app(ROOT,routes=R,init="window.__SHARE_DOC=%s;"%json.dumps(doc),width=390,height=844) as pg:
    pg.goto(pg.url.split('/')[0]+'//'+pg.url.split('/')[2]+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA');pg.wait_for_timeout(500)
    # v76: summary only on open; details collapsed; icon buttons in header
    tx=pg.inner_text('main');check('Pendiente' in tx and 'Aldi' not in tx and pg.locator('#vdetb').is_hidden(),'collapsed on open '+tx)
    keys=['A transferirte','Ya transferido','Pendiente'] if who=='tony' else ['Tu parte','Ya pagado','Pendiente']
    check(all(k in pg.inner_text('#vsum') for k in keys),'key totals %s'%pg.inner_text('#vsum'))
    if who=='tony':check('Total cuentas' not in tx and 'Comida' not in tx,'bills list hidden')
    for bid,cap,lab in [('#vreg','Registrar','Registrar compra'),('#vdl','PDF','Descargar PDF')]:
        bx=pg.locator('header '+bid).bounding_box();check(bx and bx['width']>=44 and bx['height']>=44 and bx['x']>390/2,'%s top-right 44px %s'%(bid,bx))
        check(pg.inner_text(bid).split()[-1]==cap and pg.get_attribute(bid,'aria-label')==lab and pg.get_attribute(bid,'title')==lab,'%s caption/labels'%bid)
    check(pg.locator('button.dl#vreg,button.dl#vdl,main #vreg,main #vdl').count()==0,'old big buttons removed')
    sb=pg.locator('#vdet').bounding_box();check(sb['y']+sb['height']<=844,'summary + toggle fit without scrolling %s'%sb)
    check('Ver detalle' in pg.inner_text('#vdet') and pg.get_attribute('#vdet','aria-expanded')=='false','toggle label')
    if '--shots' in sys.argv:pg.screenshot(path=os.path.join(ROOT,'shots','140-enlace-%s-resumen.png'%who))
    pg.click('#vdet');pg.wait_for_timeout(50)
    tx=pg.inner_text('main');check('Aldi' in tx and pg.locator('td.hl').count()>3 and 'Ocultar detalle' in pg.inner_text('#vdet'),'expanded')
    if who=='tony':check('Total cuentas' in tx,'bills in details')
    if '--shots' in sys.argv:pg.screenshot(path=os.path.join(ROOT,'shots','140-enlace-%s-detalle.png'%who),full_page=True)
    pg.click('#vreg');pg.wait_for_timeout(50);check(pg.locator('#regform').count()==1 and pg.locator('#vdetb').is_visible(),'register opens, details stay')
    pg.click('#vdet');pg.wait_for_timeout(50);check(pg.locator('#regform').count()==1 and pg.locator('#vdetb').is_hidden(),'collapse keeps form')
    with pg.expect_download(timeout=15000) as d: pg.click('#vdl')
    check(d.value.suggested_filename.endswith('-2026-10.pdf'),d.value.suggested_filename)
  if who=='carlos':
    with app(ROOT,routes=R,init="window.__SHARE_DOC=%s;"%json.dumps({**doc,'lang':'en'}),width=390,height=844) as pg:
      pg.goto(pg.url.split('/')[0]+'//'+pg.url.split('/')[2]+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA');pg.wait_for_timeout(500)
      check(pg.inner_text('#vreg').split()[-1]=='Add' and pg.get_attribute('#vreg','aria-label')=='Record purchase' and pg.inner_text('#vdl').split()[-1]=='PDF' and 'See details' in pg.inner_text('#vdet'),'EN captions')
      if '--shots' in sys.argv:pg.screenshot(path=os.path.join(ROOT,'shots','140-enlace-carlos-en.png'))
  with app(ROOT,routes=R) as pg:
    pg.goto(pg.url.split('/')[0]+'//'+pg.url.split('/')[2]+'/v.html?t=bad');pg.wait_for_timeout(300);check('no es válido' in pg.inner_text('main') or 'not valid' in pg.inner_text('main'),'bad token')
print('test_links OK',ok)
