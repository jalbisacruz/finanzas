"""v140 (DATOS DE EJEMPLO): pantalla de Tony en su enlace: hoja en blanco, reparto, envío al buzón."""
import os,copy,json
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');FAKE=open(os.path.join(HERE,'fakefb.js')).read()
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
S=copy.deepcopy(FIX);S['cur']='2026-11'
S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':3000,'role':'debit'}],'cards':[],'personal':[],'purchases':[],'events':[],'tonyBase':0,
 'bills':[{'id':'b1','name':'Rent House','amount':800,'fixed':True}]}
TOK='AAAAAAAAAAAAAAAAAAAAAA'
with app(ROOT,now='2026-11-10T16:00:00',state=S,new_look=True,routes=R) as pg:
    E=pg.evaluate;pg.wait_for_timeout(700)
    doc=E("snapFor('Tony')");doc['updatedAt']=E("Date.now()");base='/'.join(pg.url.split('/')[:3])
    pg.add_init_script("window.__SHARE_DOC=%s;"%json.dumps(doc))
    pg.goto(base+'/v.html?t='+TOK);pg.wait_for_timeout(800)
    E("()=>{localStorage.removeItem('vbills-%s-2026-11')}"%TOK);pg.reload();pg.wait_for_timeout(800)
    assert pg.locator('#bsform').count()==1,pg.inner_text('main')[:300]
    assert pg.locator('#bst-renta').input_value()=='' and pg.locator('#bsr-renta .chip.on').count()==0,'blank, no Fija/Variable'
    sub=pg.inner_text('#sub');assert 'Invalid Date' not in sub and 'Invalid Date' not in pg.inner_text('body')
    assert 'Actualizado' in sub and '2026' in sub,'expected a real date in header: '+sub
    E("()=>{DOC.updatedAt=undefined;vRedraw()}");pg.wait_for_timeout(200)
    assert 'Invalid Date' not in (pg.inner_text('#sub')+' '+pg.inner_text('header'))
    E("()=>{DOC.updatedAt=Date.now();vRedraw()}");pg.wait_for_timeout(200)
    assert 'Actualizado' in pg.inner_text('#sub') and 'Invalid Date' not in pg.inner_text('#sub')
    assert pg.locator('#bst-comida').count()==0 and 'Comida' not in pg.inner_text('#bsform'),'comida excluded from Tony sheet'
    body=pg.inner_text('#bsform');assert all(x not in body for x in ['3000','Débito','Transferencia','paid','balance']),'leak in form: '+body[:200]
    assert 'Tony 50%' in pg.inner_text('#bsr-renta') and 'Joe 100%' in pg.inner_text('#bsr-seguro')
    E("document.getElementById('bsform').scrollIntoView({block:'start'})");pg.wait_for_timeout(150)
    pg.screenshot(path=os.path.join(SH,'v140-tony-hoja-en-blanco.png'), full_page=True)
    # enviar sin Fija/Variable → error
    pg.fill('#bst-renta','1000');pg.click('#bssend');pg.wait_for_timeout(100)
    assert 'Fija o Variable' in pg.inner_text('#bserr')
    pg.click('#bsr-renta [data-fx="true"]');pg.wait_for_timeout(50)
    # editor de reparto: Gas entre Tony, Arianna y Joe, iguales
    pg.fill('#bst-gas','40');pg.click('#bsr-gas [data-fx="false"]')
    pg.click('#bsr-gas .bsch');pg.wait_for_timeout(100)
    pg.click("#vbed .chip:text-is('Carlos')");pg.click("#vbed .chip:text-is('Arianna')");pg.click("#vbed .chip:text-is('Iguales')");pg.wait_for_timeout(100)
    t=pg.inner_text('#vbsum');assert 'Arianna $13.33' in t or 'Arianna $13.34' in t,t
    pg.screenshot(path=os.path.join(SH,'v140-tony-cambiar-reparto.png'))
    pg.click('#vbedok');pg.wait_for_timeout(100)
    # montos que no cuadran
    pg.click('#bsr-agua .bsch');pg.wait_for_timeout(50);pg.click("#vbed .chip:text-is('Montos')");pg.wait_for_timeout(50)
    pg.click('#vbed .chip:text-is("Cancelar")') if pg.locator('#vbed .chip:text-is("Cancelar")').count() else None
    # borrador guardado (parcial) sobrevive a recargar
    pg.reload();pg.wait_for_timeout(800)
    assert pg.locator('#bst-renta').input_value()=='1000' and 'Arianna' in pg.inner_text('#bsr-gas')
    pg.click('#bssend');pg.wait_for_timeout(400)
    docs=E("window.__fs.docs");ib=[v for k,v in docs.items() if k.startswith('shares/%s/inbox/'%TOK)]
    assert len(ib)==1 and ib[0]['kind']=='bills' and ib[0]['month']=='2026-11',ib
    keys=sorted(ib[0].keys());assert keys==['at','by','kind','month','rev','rows'],keys
    assert sorted(r['key'] for r in ib[0]['rows'])==['gas','renta'],'only filled rows sent'
    assert 'Enviado' in pg.inner_text('#bsok')
print('OK')
