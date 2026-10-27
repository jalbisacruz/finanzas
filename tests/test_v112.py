"""v112 (datos inventados, Firestore falso en memoria): la laptop con datos viejos nunca pisa lo más nuevo del móvil."""
import os,json,copy
from harness import app,HERE,FIX
ROOT=os.path.dirname(HERE);ok=0;FAKE=open(os.path.join(HERE,'fakefb.js')).read()
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
R={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
SH=os.path.join(ROOT,'shots');SD='users/u1/data/state'
sat=copy.deepcopy(FIX);sat['updatedAt']=1761346740000;sat['marker']='SABADO'      # laptop: datos del sábado
pho=copy.deepcopy(FIX);pho['updatedAt']=1761500000000;pho['marker']='MOVIL-HOY'   # móvil: Sam's, gasolina, Arianna
cdoc=lambda st:{'state':json.dumps(st),'updatedAt':st['updatedAt'],'ver':3}
def run(local,cloud,extra='',lang='es'):
    init="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps({SD:cdoc(cloud)}))+extra
    if lang=='en':init+="localStorage.setItem('finanzas-lang','en');"
    return app(ROOT,state=local,routes=R,init=init,now='2026-10-27T08:00:00',lang=lang)
cloudSt=lambda E:json.loads(E("__fs.docs['%s'].state"%SD))
noerr=lambda pg:check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
# A) reproducción: laptop abre con datos del sábado, base del sábado, y algo se guarda solo al abrir (antes de la nube)
with run(sat,pho,"localStorage.setItem('finanzas-sync-base','%d');window.__snapDelay=2500;window.__getDelay=2500;"%sat['updatedAt']) as pg:
    E=pg.evaluate;E("S.tipsAuto=1;save()");check(E("S.updatedAt")==sat['updatedAt'],'pre-sync save keeps date')
    check(E("localStorage.getItem('finanzas-sync-dirty')") is None,'pre-sync save is not a local change')
    E("unlock()");pg.wait_for_timeout(9000)
    check(cloudSt(E)['marker']=='MOVIL-HOY','cloud (phone) NOT overwritten');check(E("S.marker")=='MOVIL-HOY','laptop loaded phone data')
    check(pg.locator('#syncconf').count()==0,'no prompt');noerr(pg)
# B) reproducción: restaurar en la laptop un respaldo .json viejo (antes: hora actual + subir a ciegas)
for lang in ['es','en']:
  with run(sat,pho,"localStorage.setItem('finanzas-force-push','1');",lang) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    check(cloudSt(E)['marker']=='MOVIL-HOY','old file did not overwrite cloud')
    check(pg.locator('#syncconf').is_visible() and pg.locator('#sc-old').is_visible(),'conflict + older warning')
    check(E("document.activeElement&&document.activeElement.id")=='sc-cloud','cloud default')
    if lang=='es':pg.screenshot(path=os.path.join(SH,'v112-laptop-vieja.png'))
    else:check('OLDER' in pg.inner_text('#syncconf'),'EN text')
    pg.keyboard.press('Escape');pg.wait_for_timeout(800);check(E("S.marker")=='MOVIL-HOY','Escape = cloud');noerr(pg)
# C) elegir «este dispositivo» con datos viejos -> aviso fuerte; si cancela, la nube queda intacta; si confirma, se reemplaza (copia en respaldo)
with run(sat,pho,"localStorage.setItem('finanzas-force-push','1');") as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);E("window.__c=[];window.confirm=m=>{__c.push(m);return false}")
    pg.click('#sc-local');pg.wait_for_timeout(800)
    check("MÁS VIEJOS" in str(E("__c")),"strong warning %s %s"%(E("__c"),pg.errors));check(cloudSt(E)['marker']=='MOVIL-HOY','cancel keeps cloud')
    E("window.confirm=()=>true");pg.click('#sc-local');pg.wait_for_timeout(1500)
    check(cloudSt(E)['marker']=='SABADO','explicit choice honored')
    bk=[k for k in E("Object.keys(__fs.docs)") if 'antes-de-dispositivo' in k];check(len(bk)==1 and json.loads(E("__fs.docs['%s'].state"%bk[0]))['marker']=='MOVIL-HOY','phone copy kept');noerr(pg)
# D) push nunca sube local más viejo que la nube aunque la base coincida (antes: subía)
with run(pho,pho) as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500);r=copy.deepcopy(pho);r['marker']='NUEVO';r['updatedAt']=pho['updatedAt']+9000
    E("d=>{__fs.docs['%s']=d;localStorage.setItem('finanzas-sync-base',String(d.updatedAt))}"%SD,cdoc(r))
    E("S.marker='VIEJO';S.updatedAt=%d;localStorage.setItem(K,JSON.stringify(S));fbSyncNow()"%(pho['updatedAt']+1));pg.wait_for_timeout(2000)
    check(cloudSt(E)['marker']=='NUEVO','older local not uploaded');check(E("S.marker")=='NUEVO','took newer cloud');noerr(pg)
# E) la nube cambió pero es MÁS VIEJA que lo local -> pregunta, no se aplica en silencio
with run(pho,sat,"localStorage.setItem('finanzas-sync-base','1');") as pg:
    E=pg.evaluate;pg.wait_for_timeout(1500)
    check(pg.locator('#syncconf').is_visible(),'older cloud asks');check(E("S.marker")=='MOVIL-HOY','local not replaced silently');noerr(pg)
print('test_v112 OK',ok)
