"""v163 (DATOS DE EJEMPLO): Mensaje para Carlos / Tony con nombres, no en primera persona.
python3 tests/test_v163.py
"""
import os,subprocess
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots');os.makedirs(SH,exist_ok=True)
ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('#demoW').forEach(x=>x.remove());const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647';
      (document.getElementById(host||'')||document.getElementById('dlg')||document.body).append(w)}""",host)
def wm(png):
    from PIL import Image,ImageDraw,ImageFont
    im=Image.open(png).convert('RGBA');t=Image.new('RGBA',im.size,(0,0,0,0));d=ImageDraw.Draw(t)
    try:fn=ImageFont.truetype('DejaVuSans-Bold.ttf',40)
    except Exception:fn=ImageFont.load_default()
    d.text((im.size[0]//6,im.size[1]//3),'DATOS DE EJEMPLO',fill=(185,28,28,115),font=fn)
    Image.alpha_composite(im,t.rotate(18)).convert('RGB').save(png)
FIRST=['me debes','ME DEBES','te transfiero','TE TRANSFIERO','Te transfiero','A TRANSFERIRTE','Te debo','Mi parte','te debo','se la pagas']
def pdftext(pg,who,k,path):
    with pg.expect_download(timeout=20000) as d: pg.evaluate("([w,k])=>pdfDl(w,k)",[who,k])
    d.value.save_as(path);return subprocess.run(['pdftotext','-layout',path,'-'],capture_output=True,text=True).stdout
SETUP="""(k)=>{const m=S.months[k];
  m.bills.push({id:'bx1',name:'Luz',amount:150,sheet:{total:150,sp:{Joe:50,Tony:50,Carlos:50}}},{id:'bx2',name:'Internet',amount:60,sheet:{total:60,sp:{Joe:20,Tony:20,Carlos:20}}});
  m.purchases.push({id:'pc1',store:'Costco',date:k+'-12',total:200,mode:'fam',who:['Yo','Tony','Carlos'],shares:{Tony:100,Carlos:50,Yo:50},method:'deb'});
  m.purchases.push({id:'pc2',store:"Sam's Club",date:k+'-14',total:30,paidBy:'Carlos',mode:'eq',who:['Yo','Carlos'],shares:{Yo:15,Carlos:15},method:'deb'});save();render()}"""
with app(ROOT,state=FIX,now='2026-10-20T10:00:00',new_look=True) as pg:
    E=pg.evaluate;k=E("S.cur")
    check(E('CODE_V')>='v163','CODE_V')
    E(SETUP,k)
    c=E("k=>{const c=calc(S.months[k]);return {cd:c.carlosDue,td:c.tonyDue,jcs:c.joeCS,ct:_v152.carlosFlows(S.months[k]).toTony}}",k)
    F=lambda v:E("v=>f(v)",v)
    check(c['cd']>0.005 and c['jcs']>0.004 and c['td']>0.005 and c['ct']>0.004,'ejemplo: %s'%c)
    fd,ft,fct=F(c['cd']),F(c['td']),F(c['ct'])
    # Carlos, Solo texto
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200);tx=pg.input_value('#msgt');L=tx.split('\n')
    check(L[1]=='Carlos le transfiere a Joe '+fd,'línea 2 Carlos→Joe: '+tx)
    check(L[2]=='Carlos le transfiere a Tony '+fct,'línea 3 Carlos→Tony: '+tx)
    check(L[-1]=='TOTAL: CARLOS LE TRANSFIERE A JOE  '+fd,'total al final: '+tx)
    check('− Parte de Joe en tus compras' in tx,'parte de Joe con nombre: '+tx)
    check('TU PARTE DE LAS CUENTAS (Carlos le transfiere a Tony)' in tx and 'Luz  '+F(50) in tx,'cuentas: '+tx)
    check(('PENDIENTE CON JOE  '+fd) in tx,'PENDIENTE igual que Por hacer: '+tx)
    check(not [w for w in FIRST if w in tx],'sin primera persona: '+str([w for w in FIRST if w in tx]))
    por=E("(k)=>{const c=calc(S.months[k]);return f(c.carlosDue)}",k)
    check(por==fd,'mismo total que «Carlos te debe»')
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v163-mensaje-carlos-texto-phone.png'))
    pg.evaluate("document.getElementById('msgt').scrollTop=1e6");mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v163-mensaje-carlos-texto-final-phone.png'))
    # Carlos, Enviar con PDF
    E("k=>shareMsg('carlos',k,'pdf')",k);pg.wait_for_timeout(200);tp=pg.input_value('#msgt')
    check(tp.split('\n')[1]=='Carlos le transfiere a Joe '+fd and ('TOTAL: CARLOS LE TRANSFIERE A JOE  '+fd) in tp and tp.endswith('El detalle está en el PDF.'),'con PDF: '+tp)
    check(not [w for w in FIRST if w in tp],'con PDF sin primera persona')
    pt=E("k=>msgPdfText('carlos',k)",k)
    check(pt.split('\n')[1]=='Carlos le transfiere a Joe '+fd and not [w for w in FIRST if w in pt] and 'PENDIENTE:' not in pt,'msgPdfText Carlos: '+pt)
    pdf=pdftext(pg,'carlos',k,'/tmp/v163c.pdf')
    check(('Carlos le transfiere a Joe '+fd).replace('−','-') in pdf.split('\n',3)[0]+pdf.split('\n',3)[1]+pdf.split('\n',3)[2] or ('Carlos le transfiere a Joe '+fd) in pdf,'PDF Carlos cabecera: '+pdf[:500])
    check('me debes' not in pdf,'PDF Carlos sin primera persona')
    head=subprocess.run(['pdftotext','-f','1','-l','1','-x','300','-y','0','-W','312','-H','70','/tmp/v163c.pdf','-'],capture_output=True,text=True).stdout
    check('Carlos le transfiere a Joe' in head,'en la franja azul: '+head)
    subprocess.run(['pdftoppm','-png','-r','70','-f','1','-l','1','-singlefile','/tmp/v163c.pdf',os.path.join(SH,'v163-pdf-carlos')]);wm(os.path.join(SH,'v163-pdf-carlos.png'))
    # Tony
    E("k=>shareMsg('tony',k,'txt')",k);pg.wait_for_timeout(200);tt=pg.input_value('#msgt');TL=tt.split('\n')
    check(TL[1]=='Joe le transfiere a Tony '+ft and TL[-1]=='TOTAL: JOE LE TRANSFIERE A TONY  '+ft,'Tony: '+tt)
    check(not [w for w in FIRST if w in tt] and tt.count(ft)>=2,'Tony sin primera persona: '+tt)
    mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v163-mensaje-tony-texto-phone.png'))
    pt=E("k=>msgPdfText('tony',k)",k)
    check(pt.split('\n')[1]=='Joe le transfiere a Tony '+ft and 'Te transfiero' not in pt,'msgPdfText Tony: '+pt)
    pdf=pdftext(pg,'tony',k,'/tmp/v163t.pdf')
    check('Joe le transfiere a Tony' in pdf and 'te transfiero' not in pdf.lower(),'PDF Tony: '+pdf[:400])
    subprocess.run(['pdftoppm','-png','-r','70','-f','1','-l','1','-singlefile','/tmp/v163t.pdf',os.path.join(SH,'v163-pdf-tony')]);wm(os.path.join(SH,'v163-pdf-tony.png'))
    # Joe le debe a Carlos: con nombres también
    E("(k)=>{const m=S.months[k];m.purchases.push({id:'pc3',store:'Walmart',date:k+'-15',total:600,paidBy:'Carlos',mode:'eq',who:['Yo','Carlos'],shares:{Yo:300,Carlos:300},method:'deb'});save();render()}",k)
    jo=E("k=>calc(S.months[k]).joeOwesCarlos",k)
    if jo>0.004:
        E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200);tj=pg.input_value('#msgt')
        check(tj.split('\n')[1]=='Joe le transfiere a Carlos '+F(jo) and ('TOTAL: JOE LE TRANSFIERE A CARLOS  '+F(jo)) in tj,'Joe→Carlos: '+tj)
        check(not [w for w in FIRST if w in tj],'Joe→Carlos sin primera persona: '+tj)
    # todo al día: sin línea de total
    E("(k)=>{const m=S.months[k];m.purchases=[];m.bills=[];save();render()}",k)
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200);tz=pg.input_value('#msgt')
    check('TOTAL:' not in tz and 'le transfiere a Joe' not in tz and not tz.split('\n')[1].startswith(('Carlos le','Joe le')) and 'Todo al día' in tz,'al día: '+tz)
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
# inglés
with app(ROOT,lang='en',state=FIX,now='2026-10-20T10:00:00',new_look=True) as pg:
    E=pg.evaluate;k=E("S.cur");E(SETUP,k)
    E("k=>shareMsg('carlos',k,'txt')",k);pg.wait_for_timeout(200);te=pg.input_value('#msgt')
    check('Carlos transfers ' in te and ' to Joe' in te and 'TOTAL: CARLOS TRANSFERS TO JOE' in te,'EN: '+te)
    check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
print('test_v163 OK',ok)

# ---- AB-3: Cancelar en Revisar no borra ni oculta las demás ----
import json
from harness import HERE as H2
FAKE=open(os.path.join(H2,'fakefb.js')).read()
RT={'**/firebase-config.js':"window.FB_CONFIG={projectId:'test'};",'https://www.gstatic.com/firebasejs/**':FAKE}
TT,TC,TOLD='TonyTokenAAAAAAAAAAAAA','CarlosTokenNEWBBBBBBBB','CarlosTokenOLDCCCCCCCC'
SNAP={'v':1,'who':'Carlos','lang':'es','buyers':['Carlos'],'names':{'Yo':'Joe','Tony':'Tony','Carlos':'Carlos'},'months':[]}
def cdoc(i):return {'by':'Carlos','store':"Sam's Club",'date':'2026-11-25','total':132.77,'tax':5.24,'at':1700000000000+i,'items':[{'n':'A','a':127.53,'own':['Yo','Tony','Carlos']}]}
def seed(tok,old_key):
    docs={'shares/'+TT:{**SNAP,'who':'Tony','owner':'u1'},'shares/'+TC:{**SNAP,'owner':'u1'},'shares/'+TOLD:{**SNAP,'owner':'u1'}}
    for i in range(3):docs['shares/%s/inbox/c%d'%(tok,i)]=cdoc(i)
    s="localStorage.setItem('finanzas-sync-uid','u1');localStorage.setItem('__fsdocs',%s);"%json.dumps(json.dumps(docs))
    if old_key:s+="localStorage.setItem('finanzas-link-h-%s',JSON.stringify({who:'Carlos',v:1}));"%TOLD
    return s
LINKS={'Tony':{'t':TT,'on':True},'Carlos':{'t':TC,'on':True}}
def ids(E):return sorted(E("INBOX.filter(x=>x.by==='Carlos').map(x=>x.id)"))
for br in ['chromium','webkit']:
  for case in ['cur','old']:
    with app(ROOT,routes=RT,init=seed(TC if case=='cur' else TOLD,case=='old'),now='2026-11-26T10:15:00',new_look=True,browser=br) as pg:
        E=pg.evaluate;pg.wait_for_timeout(1500);E("(L)=>{S.links=L;save()}",LINKS)
        E("()=>inboxLoad(true)");pg.wait_for_timeout(700)
        check(ids(E)==['c0','c1','c2'],'%s/%s: 3 pendientes %s'%(br,case,ids(E)))
        E("inboxList()");pg.wait_for_timeout(700)
        pg.click('#dlg button:has-text("Revisar") >> nth=1');pg.wait_for_timeout(500)
        check(E("!!(D&&D._inbox)"),'revisión abierta')
        pg.click('#dlg button:has-text("Cancelar")');pg.wait_for_timeout(400)
        check(ids(E)==['c0','c1','c2'],'%s/%s: tras Cancelar siguen 3: %s'%(br,case,ids(E)))
        # recargas después de Cancelar (Hoy al minuto, volver a la app)
        pg.clock.run_for(65000);E("()=>{tab='ini';render()}");pg.wait_for_timeout(1000)
        E("()=>window.dispatchEvent(new Event('focus'))");pg.wait_for_timeout(1000)
        check(ids(E)==['c0','c1','c2'],'%s/%s: tras recargas siguen 3: %s'%(br,case,ids(E)))
        check(not [l for l in E("window.__fs.log") if l.startswith('DEL')],'%s/%s: nada borrado en la nube'%(br,case))
        check(E("remList().some(r=>r.id==='inbox')"),'%s/%s: 📥 en Hoy'%(br,case))
        # la lectura falla después (sin red / permiso): se mantienen las últimas
        tok=TC if case=='cur' else TOLD
        if case=='cur' and br=='chromium':
            E("""(t)=>{const prev=window.fbInbox;const raw=async x=>{if(x===t)throw Object.assign(new Error('offline'),{code:'unavailable'});return []};
                  // envolver la lectura cruda: v163 usa la que había al instalarse, así que se instala una nueva capa y se vuelve a envolver
                  raw.__v163=0;window.fbInbox=raw}""",tok)
            E("()=>{_v163in.wrapRead();return inboxLoad(true)}");pg.wait_for_timeout(800)
            check(ids(E)==['c0','c1','c2'],'falla la lectura: se mantienen las últimas %s'%ids(E))
            E("inboxList()");pg.wait_for_timeout(800)
            st=E("(document.getElementById('v163st')||{}).textContent||''")
            check('No se pudo actualizar (unavailable)' in st,'aviso de lectura fallida: '+st)
            mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v163-buzon-sin-red-siguen-phone.png'))
        if case=='old' and br=='chromium':
            # la nube trae un estado sin el enlace anterior recordado: siguen saliendo
            E("()=>{S.links.Carlos={t:'%s',on:true};delete S.links.Carlos.alt;localStorage.removeItem('finanzas-link-h-%s')}"%(TC,TOLD))
            E("()=>inboxLoad(true)");pg.wait_for_timeout(800)
            check(ids(E)==['c0','c1','c2'],'estado de la nube sin alt: siguen 3 %s'%ids(E))
            # otro dispositivo guardó c1: deja de salir y se dice por qué
            E("()=>{const m=S.months[S.cur];m.purchases.push({id:'px',store:\"Sam's Club\",date:'2026-11-25',total:132.77,paidBy:'Carlos',inboxId:'c1',shares:{Yo:44.26,Tony:44.26,Carlos:44.25}});}")
            E("()=>inboxLoad(true)");pg.wait_for_timeout(800)
            check(ids(E)==['c0','c2'],'c1 guardada en otro dispositivo %s'%ids(E))
            E("inboxList()");pg.wait_for_timeout(800)
            st=E("(document.getElementById('v163st')||{}).textContent||''")
            check('Ya no salen 1: 1 guardada en otro dispositivo' in st,'motivo visible: '+st)
            dr=E("_v163in.drops()")
            check(dr and dr[-1]['items'][0]['id']=='c1','registro de lo que dejó de salir: %s'%dr)
            mark(pg,'dlg');pg.locator('#dlg').screenshot(path=os.path.join(SH,'v163-buzon-motivo-phone.png'))
            # Rechazar (con confirmación) sí borra solo esa, y no se marca como inesperada
            i=E("()=>INBOX.filter(x=>x.kind!=='bills').findIndex(x=>x.id==='c2')")
            pg.click('#dlg button:has-text("Revisar") >> nth=%d'%i);pg.wait_for_timeout(400)
            pg.click('#inbrej');pg.wait_for_timeout(600)
            dels=[l for l in E("window.__fs.log") if l.startswith('DEL')]
            check(dels==['DEL shares/%s/inbox/c2'%TOLD],'Rechazar borra solo esa: %s'%dels)
            check(ids(E)==['c0'],'queda c0: %s'%ids(E))
        check(not [e for e in pg.errors if e.startswith('PE:')],pg.errors)
print('test_v163 inbox OK',ok)
