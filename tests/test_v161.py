"""v161 (DATOS DE EJEMPLO): compras de Carlos de punta a punta hasta 📥 (Firebase falso).
python tests/test_v161.py
"""
import json,os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
FAKE=open(os.path.join(HERE,'fakefb.js')).read()
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
TT,TC='TonyTokenAAAAAAAAAAAAA','CarlosTokenBBBBBBBBBBB'
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('#demoW').forEach(x=>x.remove());const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';
      (document.getElementById(host||'')||document.getElementById('dlg')||document.body).append(w)}""",host)
CATS=[{'v':'🛒 Comida/Supermercado','l':'🛒 Comida/Supermercado'},{'v':'🏠 Hogar','l':'🏠 Hogar'}]
SNAP={'v':1,'who':'Carlos','lang':'es','buyers':['Carlos'],'cats':CATS,'names':{'Yo':'Joe','Tony':'Tony','Carlos':'Carlos'},'from':'Joe','updatedAt':1760600000000,
 'months':[{'k':'2026-11','label':'Nov 2026','purchases':[],'joeOwes':0,'bills':[],'billsTotal':0,'share':0,'toTransfer':0,'paid':0,'pending':0}]}
S=json.load(open(os.path.join(HERE,'sams_club_2026_11_25.json')))
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
FILE="()=>{const o=HTMLInputElement.prototype.click;HTMLInputElement.prototype.click=function(){if(this.type==='file'){HTMLInputElement.prototype.click=o;fetch('%s').then(r=>r.blob()).then(b=>{Object.defineProperty(this,'files',{value:[new File([b],'r.png',{type:'image/png'})]});this.onchange()})}else o.call(this)}}"%IMG
def vai(disc):
    items=[{'name':x['name'],'amount':x['amount'],'category':'🏠 Hogar'} for x in S['items_gross']+S[disc]]
    return "window.vAI=async()=>JSON.stringify(%s);"%json.dumps({'isReceipt':True,'store':"Sam's Club",'date':'2026-11-25','total':132.77,'tax':5.24,'items':items})

sent=[]
# 1) página de Carlos: escanear (descuentos 2.00-) y enviar dos veces (envío + reenvío)
for disc,shot in [('discounts','v161-carlos-escaneo-neto-phone.png'),('discounts_positive',None)]:
    with app(ROOT,routes=R,now='2026-11-26T09:45:00',init="window.__SHARE_DOC=%s;%s"%(json.dumps(SNAP),vai(disc))) as pg:
        base='/'.join(pg.url.split('/')[:3]);pg.goto(base+'/v.html?t='+TC);pg.wait_for_timeout(600);E=pg.evaluate
        check(E('!!window._v161Share'),'v161 share hook')
        pg.click('#vreg');pg.wait_for_timeout(50);E(FILE);pg.click('#vscan');pg.wait_for_timeout(900)
        it=E("REG.items.map(x=>[x.n,x.a])");m=dict(it)
        check(abs(m.get('TOOTHPASTE',0)-9.98)<0.004 and abs(m.get('BAR SOAP',0)-14.48)<0.004,'escaneo neto por ítem (%s): %s'%(disc,it))
        check(not any('INST SV' in n or n=='Descuentos' for n,_ in it),'sin líneas sueltas de descuento: %s'%it)
        if shot:
            mark(pg,'regbox');pg.locator('#regbox').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,shot),full_page=True)
        pg.click('#rsend');pg.wait_for_timeout(400)
        check('Enviado' in (E("(document.getElementById('regok')||{}).textContent") or ''),'Carlos ve «Enviado»')
        docs=E("window.__fs.docs");k=[x for x in docs if '/inbox/' in x];check(len(k)==1,k)
        d=docs[k[0]];d['at']=1700000000000+len(sent);sent.append((k[0],d))
        check(abs(sum(i['a'] for i in d['items'])+d['tax']-d['total'])<0.01,'envío cuadra: %s'%d['items'])
        check(pg.errors==[],pg.errors)

# 2) app de Joe: aparece el primero, Revisar abre la revisión; el reenvío aparece al actualizar
k1,d1=sent[0];k2,d2=sent[1]
docs={k1:d1,'shares/%s/inbox/t1'%TT:{'by':'Tony','store':'Publix','date':'2026-11-24','total':20,'at':1},
      'shares/'+TC:{**SNAP,'owner':'u1'},'shares/'+TT:{**SNAP,'who':'Tony','buyers':['Tony','Arianna'],'owner':'u1'}}
init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps(docs))
for br in ['chromium','webkit']:
  with app(ROOT,routes=R,init=init,now='2026-11-26T09:52:00',new_look=True,browser=br) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    check(E('CODE_V')>='v161','CODE_V v161')
    E("()=>{S.links={Tony:{t:'%s',on:true},Carlos:{t:'%s',on:true}};save()}"%(TT,TC));E("()=>inboxLoad(true)");pg.wait_for_timeout(300)
    check(sorted(E("INBOX.map(x=>x.by)"))==['Carlos','Tony'],'Carlos y Tony en 📥')
    E("inboxList()");pg.wait_for_timeout(300)
    check(pg.locator('#v161ref').count()==1 and 'Actualizado' in pg.inner_text('#v161bar'),'barra Actualizar')
    if br=='chromium':mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v161-buzon-actualizar-phone.png'))
    # reenvío llega con la lista abierta y el inbox recién cargado (antes: esperar 1 min y salir de la lista)
    E("([k,d])=>{window.__fs.docs[k]=d}",[k2,d2]);E("()=>{inboxAt=Date.now()}")
    pg.click('#v161ref');pg.wait_for_timeout(400)
    check(E("INBOX.filter(x=>x.by==='Carlos').length")==2 and pg.locator('#dlg button:has-text("Revisar")').count()==3,'reenvío visible tras ↻')
    # abrir la lista de nuevo también recarga sin esperar el minuto
    E("dlg().close()");k3=k2.rsplit('/',1)[0]+'/again';E("([k,d])=>{window.__fs.docs[k]=d;inboxAt=Date.now()}",[k3,d2])
    E("inboxList()");pg.wait_for_timeout(400)
    check(pg.locator('#dlg button:has-text("Revisar")').count()==4,'abrir 📥 recarga al momento')
    # Revisar (clic real) en la compra de Carlos
    i=E("id=>INBOX.filter(x=>x.kind!=='bills').findIndex(x=>x.id===id)",k1.split('/')[-1])
    pg.click('#dlg button:has-text("Revisar") >> nth=%d'%i);pg.wait_for_timeout(300)
    st=E("()=>({open:dlg().open,by:D&&D.paidBy,tot:D&&D.total,inb:!!document.getElementById('inbbox'),over:_v160.overage(D,D.list),dis:document.getElementById('psave').disabled,n:D.list.length})")
    check(st['open'] and st['by']=='Carlos' and st['inb'] and abs(st['over'])<0.004 and st['dis'] is False and st['n']==8,'revisión Carlos (%s): %s'%(br,st))
    if br=='chromium':mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v161-revisar-carlos-phone.png'))
    E("saveP()");pg.wait_for_timeout(300)
    check(E("M().purchases.some(p=>p.paidBy==='Carlos'&&p.inboxId)") and not E("id=>INBOX.some(x=>x.id===id)",k1.split('/')[-1]),'guardada y oculta del 📥')
    # Revisar sobre una lista vieja: el envío ya no está → aviso, no silencio
    E("()=>{inboxOpen('noexiste')}");pg.wait_for_timeout(400)
    tx=E("[...document.querySelectorAll('.toast')].map(x=>x.textContent).join(' | ')");check('ya no está' in tx,'aviso si ya no está: '+tx)
    # fallo al preparar → se abre igual con aviso (nunca en blanco)
    E("()=>{const e=editP;editP=function(){editP=e;throw new Error('prueba')}}")
    t2=E("INBOX.find(x=>x.by==='Tony').id");E("id=>inboxOpen(id)",t2);pg.wait_for_timeout(300)
    fb=E("()=>({open:dlg().open,warn:!!document.getElementById('v161warn'),by:D&&D.paidBy,tot:D&&D.total})")
    check(fb['open'] and fb['by']=='Tony' and fb['tot']==20,'nunca en blanco: %s'%fb)
    check(E("JSON.parse(localStorage.getItem('finanzas-inbox-lasterr')||'{}').where")in('open','open-empty'),'error guardado para diagnóstico')
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
print('test_v161 OK',ok)
