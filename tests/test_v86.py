"""v86: restaurar en iPhone (app de pantalla de inicio) sin descargar ni salir de la app; copia «antes de restaurar» en la nube y en el teléfono;
Exportar/PDF en iOS por Compartir; en la computadora sigue la descarga (WebKit con UA de iPhone + standalone; made-up data)"""
import json,os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
MOCK="""()=>{window.__safe=[];window.__share=[];window.__restored=null;
 const B=JSON.parse(JSON.stringify(S));B.months[S.cur].cards.forEach(c=>c.amount=111.11);B.updatedAt=1;window.__bk=B;
 window.fbUser=()=>true;window.fbBackups=async()=>[{id:'2026-10-16_09-00-00',createdAt:Date.parse('2026-10-16T09:00:00')},{id:'2026-10-17_17-40-00_antes-de-restaurar',createdAt:Date.parse('2026-10-17T17:40:00')}];
 window.fbSafetyBackup=async()=>{if(window.__safeFail)throw new Error('offline');window.__safe.push(JSON.stringify(S));return 'x_antes-de-restaurar'};
 window.fbRestore=async id=>{window.__restored=id;const st=JSON.parse(JSON.stringify(window.__bk));st.updatedAt=Date.now();setState(st)};
 navigator.canShare=()=>true;navigator.share=async o=>{if(window.__shareDeny){window.__shareDeny=false;const e=new Error('no gesture');e.name='NotAllowedError';throw e}window.__share.push({n:o.files&&o.files[0]&&o.files[0].name,t:o.files&&o.files[0]&&o.files[0].type,s:o.files&&o.files[0]&&o.files[0].size})}}"""
def run(browser,ios):
    opts={'user_agent':UA,'is_mobile':True,'has_touch':True} if ios else {}
    init="Object.defineProperty(navigator,'standalone',{get:()=>true});" if ios else ''
    with app(ROOT,now='2026-10-17T17:45:00',expand=False,browser=browser,ctx_opts=opts,init=init) as pg:
        E=pg.evaluate;nav=[];dls=[];base=pg.url
        pg.on('framenavigated',lambda f:f==pg.main_frame and nav.append(f.url));pg.on('download',lambda d:dls.append(d.suggested_filename))
        pg.on('popup',lambda p:nav.append('popup'))
        E(MOCK);before=E("JSON.stringify(S.months[S.cur].cards.map(c=>c.amount))")
        check(E("NO_DL()")==ios,'%s detects iOS standalone=%s'%(browser,ios))
        E("()=>{tab='cfg';render()}");pg.wait_for_timeout(300)
        btn=pg.locator('#bklist button[onclick*="2026-10-16_09-00-00"]')
        if not btn.is_visible():
            E("()=>{document.querySelectorAll('#bklist details').forEach(d=>d.open=true);const c=document.getElementById('bklist').closest('.card');if(c&&c.classList.contains('col'))c.querySelector('h2').click()}");pg.wait_for_timeout(300)
            E("()=>document.querySelectorAll('#bklist details').forEach(d=>d.open=true)")
        check(pg.locator('#bklist .prer').count()==1,'safety copies labelled (antes de restaurar)')
        pg.locator('#bklist button[onclick*="2026-10-16_09-00-00"]').click();pg.wait_for_timeout(1500)
        after=E("JSON.stringify(S.months[S.cur].cards.map(c=>c.amount))")
        check(E("window.__restored")=='2026-10-16_09-00-00' and after!=before and '111.11' in after,'%s restore completed %s'%(browser,after))
        check(not nav and pg.url==base,'%s no navigation %s'%(browser,nav))
        pre=json.loads(E("localStorage.getItem('finanzas-pre-restore')"));check(json.loads(pre['state'])['months']['2026-10']['cards'][0]['amount']==json.loads(before)[0],'local safety copy = data before')
        if ios:
            check(not dls,'iOS: no download %s'%dls)
            check(len(E("window.__safe"))==1 and json.loads(E("window.__safe[0]"))['months']['2026-10']['cards'][0]['amount']==json.loads(before)[0],'iOS: cloud safety copy of data before restore')
            check(E("localStorage.getItem('finanzas-v1')").find('111.11')>0,'restored data saved')
            E("()=>{tab='ini';render()}");pg.wait_for_timeout(200);check(pg.locator('#v').inner_text().strip()!='','app still usable')
            # deshacer
            E("()=>{tab='cfg';render()}");pg.wait_for_timeout(300);E("()=>{const c=document.getElementById('bklist').closest('.card');if(c&&c.classList.contains('col'))c.querySelector('h2').click()}");pg.wait_for_timeout(300)
            if SH:
                pg.locator('#bklist').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(ROOT,'shots','151-restaurar-iphone.png'))
            check(pg.locator('#undorestore').count()==1,'undo offered')
            E("undoRestore()");pg.wait_for_timeout(300);check(E("JSON.stringify(S.months[S.cur].cards.map(c=>c.amount))")==before,'undo returns to data before restore')
            # nube falla: avisa y deja elegir (aceptado por el harness), copia local sí
            E("()=>{window.__safeFail=true;window.__restored=null}");E("restoreBk('2026-10-16_09-00-00')");pg.wait_for_timeout(800)
            check(any('No se pudo guardar la copia en la nube' in e for e in pg.errors) and E("window.__restored"),'cloud failure asks, still restores with local copy')
            # Exportar y PDF: Compartir, sin descargar
            E("exp()");pg.wait_for_timeout(300);s=E("window.__share");check(s and s[-1]['n'].startswith('finanzas-2026-10-17-') and s[-1]['n'].endswith('.json'),'export via share %s'%s)
            E("()=>pdfDl('carlos','2026-10')");pg.wait_for_timeout(2500);s=E("window.__share");check(s[-1]['n'].endswith('.pdf') and s[-1]['t']=='application/pdf','PDF via share %s'%s[-1])
            # iOS sin gesto: muestra «Archivo listo» y comparte al tocar
            n=len(s);E("()=>{window.__shareDeny=true;exp()}");pg.wait_for_timeout(300);check(pg.locator('#fileready').is_visible(),'file-ready prompt when share needs a tap')
            if SH:pg.screenshot(path=os.path.join(ROOT,'shots','151-archivo-listo.png'))
            pg.click('#fileshare');pg.wait_for_timeout(200);check(len(E("window.__share"))==n+1 and pg.locator('#fileready').count()==0,'shared after tap')
            check(not dls and not nav,'still no download/navigation %s %s'%(dls,nav))
        else:
            check(len(dls)==1 and dls[0].startswith('finanzas-2026-10-17-') and E("window.__safe.length")==0,'desktop: safety copy downloaded as before %s'%dls)
        check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
run('webkit',True)
run('chromium',False)
print('test_v86 OK',ok)
