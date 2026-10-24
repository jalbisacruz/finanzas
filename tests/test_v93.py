"""v93 (made-up data; v95: compras compartidas por 2+ personas las ven los tres): Tony/Carlos solo ven las compras en que participan (enlace privado y PDF). Totales iguales."""
import os,sys,json,base64,subprocess,tempfile
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
ADD="""()=>{const P=S.months['2026-10'].purchases;
P.push({id:'c1',store:'CarlosSoloShop',date:'2026-10-12',total:10,mode:'manual',who:['Carlos'],method:'deb',shares:{Carlos:10}});
P.push({id:'t1',store:'TonySoloShop',date:'2026-10-13',total:16,mode:'manual',who:['Yo','Tony'],method:'deb',shares:{Tony:8,Yo:8}});
P.push({id:'a1',store:'AriannaShop',date:'2026-10-14',total:12,mode:'manual',who:['Yo','Tony'],method:'',paidBy:'Arianna',shares:{Yo:12,Tony:0}});
P.push({id:'y1',store:'JoeSoloShop',date:'2026-10-15',total:9,mode:'manual',who:['Yo'],method:'deb',shares:{Yo:9}});save()}"""
def pdft(pg,kind):
    b=pg.evaluate("async k=>{const f=await makePDF(k,S.cur);const a=new Uint8Array(await f.arrayBuffer());let s='';for(const x of a)s+=String.fromCharCode(x);return btoa(s)}",kind)
    p=tempfile.mktemp(suffix='.pdf');open(p,'wb').write(base64.b64decode(b));return subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout
with app(ROOT,init="localStorage.setItem('finanzas-sync-uid','u1');",routes=R) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);c0=E("calc(M())");E(ADD);c=E("calc(M())")
    E("()=>{tab='cfg';render()}");pg.wait_for_timeout(100);pg.check('#lnkon-Tony');pg.check('#lnkon-Carlos');pg.wait_for_timeout(600)
    L=E("S.links");docs=E("window.__fs.docs");DT,DC=docs['shares/'+L['Tony']['t']],docs['shares/'+L['Carlos']['t']]
    st=lambda d:[p['s'] for p in d['months'][0]['purchases']]
    check('CarlosSoloShop' not in st(DT) and 'JoeSoloShop' not in st(DT),'tony doc hides uninvolved %s'%st(DT))
    check('TonySoloShop' in st(DT) and 'AriannaShop' in st(DT),'tony doc shows involved + Arianna-bought')
    check('TonySoloShop' not in st(DC) and 'AriannaShop' not in st(DC) and 'JoeSoloShop' not in st(DC) and 'CarlosSoloShop' in st(DC),'carlos doc %s'%st(DC))
    check(abs(DT['months'][0]['pending']-c['tonyDue'])<1e-9 and abs(DC['months'][0]['pending']-c['carlosDue'])<1e-9 and abs(DC['months'][0]['share']-c['carlos'])<1e-9,'totals = calc')
    for k in ('tony','carlos'):
        t=pdft(pg,k);own='TonySoloShop' if k=='tony' else 'CarlosSoloShop';other='CarlosSoloShop' if k=='tony' else 'TonySoloShop'
        check(own in t and ('CarlosSoloShop' not in t if k=='tony' else 'TonySoloShop' not in t) and 'JoeSoloShop' not in t,'%s pdf filtered (v104: Joe+Tony not visible to Carlos)'%k)
        if k=='tony':check('AriannaShop' in t,'tony pdf Arianna')
    tm=pdft(pg,'mes');check(all(s in tm for s in ['CarlosSoloShop','TonySoloShop','JoeSoloShop']),'monthly PDF keeps all')
    E("p=>window.__docs=p",[DT,DC])
# shared page
for who,doc,shown,hidden in [('tony',DT,['TonySoloShop','AriannaShop'],['CarlosSoloShop','JoeSoloShop']),('carlos',DC,['CarlosSoloShop'],['AriannaShop','JoeSoloShop','TonySoloShop'])]:
  with app(ROOT,routes=R,init="window.__SHARE_DOC=%s;"%json.dumps(doc),width=390,height=844) as pg:
    pg.goto(pg.url.split('/')[0]+'//'+pg.url.split('/')[2]+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA');pg.wait_for_timeout(500);pg.click('#vdet');pg.wait_for_timeout(200)
    tx=pg.inner_text('main');check(all(s in tx for s in shown) and not any(s in tx for s in hidden),'%s page %s'%(who,tx[:300]))
    if '--shots' in sys.argv or True:pg.screenshot(path=os.path.join(ROOT,'shots','v93-%s.png'%who),full_page=True)
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
# old doc (published before v93) is filtered on the page too; empty month -> message
d=json.loads(json.dumps(DC));[mo.pop('r3',None) for mo in d['months']];d['months'][0]['purchases']=[{'d':'2026-10-15','s':'JoeSoloShop','c':'x','t':9,'rows':[],'tot':{'Yo':9,'Tony':0,'Carlos':0}}]
with app(ROOT,routes=R,init="window.__SHARE_DOC=%s;"%json.dumps(d),width=390,height=844) as pg:
    pg.goto(pg.url.split('/')[0]+'//'+pg.url.split('/')[2]+'/v.html?t=AAAAAAAAAAAAAAAAAAAAAA');pg.wait_for_timeout(500);pg.click('#vdet');pg.wait_for_timeout(200)
    tx=pg.inner_text('main');check('JoeSoloShop' not in tx and 'Sin compras este mes.' in tx,'old doc filtered, empty msg '+tx)
print('test_v93 OK',ok)
