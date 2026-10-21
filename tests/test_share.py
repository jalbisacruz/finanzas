import re
"""Report sharing (made-up data): python tests/test_share.py [--shots]"""
import os,sys,base64,subprocess,tempfile
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,msg):
    global ok
    if not c: raise AssertionError(msg)
    ok+=1
ADD="""S.months['2026-10'].purchases.push({id:'pi1',store:'Walmart',date:'2026-10-12',total:100,mode:'fam',who:['Yo','Tony','Carlos'],method:'deb',
 shares:{Tony:35,Carlos:42.5,Yo:22.5},items:{Carlos:[{a:10,n:'Shampoo'},{a:20}],Tony:[{a:10,n:'Snacks'}],Yo:[{a:10}]}});
window._sh=[];navigator.canShare=function(d){return true};navigator.share=async d=>{window._sh.push({text:d.text,title:d.title,files:(d.files||[]).map(x=>x.name),size:(d.files||[]).map(x=>x.size)});window._lastFile=d.files&&d.files[0]};save();render()"""
B64="async()=>{const b=await window._lastFile.arrayBuffer();let s='';new Uint8Array(b).forEach(x=>s+=String.fromCharCode(x));return btoa(s)}"
def pdftext(pg,name):
    p=os.path.join(tempfile.gettempdir(),name);open(p,'wb').write(base64.b64decode(pg.evaluate(B64)))
    return p,subprocess.run(['pdftotext','-layout',p,'-'],capture_output=True,text=True).stdout
for lang in ['es','en']:
  with app(ROOT,lang=lang) as pg:
    E=pg.evaluate;E(ADD);pg.wait_for_timeout(80);before=E("JSON.stringify(S.months)")
    t=E("msgFor('tony','2026-10')")
    check(('Walmart' in t and '$35.00' in t and ('+ parte compartida $25.00' in t or '+ shared part $25.00' in t)),t)
    ES=lang=='es'
    check(t.split('\n')[0]==('Hola Tony, estas son las cuentas de Oct 2026:' if ES else 'Hi Tony, here are the bills for Oct 2026:') and t.split('\n')[1]=='','tony greeting+blank: '+t)
    for h in (['CUENTAS','TU PARTE DE LAS COMPRAS','A TRANSFERIRTE  $820.40'] if ES else ['BILLS','YOUR SHARE OF PURCHASES','TO TRANSFER YOU  $820.40']):check(h in t,h+' in '+t)
    check(t.count('⏳')==0 and t.count('(todas pendientes)' if ES else '(all pending)')==1,'all pending said once: '+t)
    check(('Total compras  −$175.00' if ES else 'Purchases total  −$175.00') in t and t.rstrip().endswith('$820.40'),'totals at bottom')
    check('ingreso' not in t.lower() and 'income' not in t.lower(),'no income word tony')
    # v57 rule: no items -> "Tu parte: $Y" only; items -> "solo tuyo X + parte Y = Z"
    YS='Your share' if lang=='en' else 'Tu parte'
    W=('Walmart · 12 oct  $35.00\n   Snacks $10.00\n   + parte compartida $25.00' if ES else 'Walmart · Oct 12  $35.00\n   Snacks $10.00\n   + shared part $25.00')
    check(W in t,'tony breakdown with items: '+t)
    PL=('Publix · 5 oct  $100.00\n' if ES else 'Publix · Oct 5  $100.00\n');check(PL in t and t.split(PL)[1].split('\n')[0].startswith('Aldi') or PL in t and not t.split(PL)[1].startswith('   ('),'tony no-items line: '+t)
    # mixed paid/pending: only pending marked
    E("()=>{const b=S.months['2026-10'].bills[0];window._bp=b.paid;b.paid=b.amount}");t2=E("msgFor('tony','2026-10')")
    check(t2.count('⏳')==4 and ('⏳ = pendiente' if ES else '⏳ = pending') in t2 and '(todas' not in t2 and '(all' not in t2,'mixed pending marks: '+t2)
    E("()=>{const b=S.months['2026-10'].bills[0];if(window._bp===undefined)delete b.paid;else b.paid=window._bp}")
    check(('+ parte $0' not in t) and ('$0.00 +' not in t) and ('(parte' not in t) and ('(share' not in t),'no repeated/zero breakdown tony')
    c=E("msgFor('carlos','2026-10')")
    check('$42.50' in c and 'Shampoo' in c and ('PENDIENTE' in c or 'PENDING' in c),c)
    check(c.split('\n')[1]=='' and (('COMPRAS' if ES else 'PURCHASES') in c),'carlos sections: '+c)
    check(('   Shampoo $10.00\n   🛒 Comida/Supermercado $20.00\n   + parte compartida $12.50' if ES else '   Shampoo $10.00\n   🛒 Food/Groceries $20.00\n   + shared part $12.50') in c,'carlos breakdown: '+c)
    check(('Aldi · 9 oct  $20.00\nPublix · 5 oct  $50.00' if ES else 'Aldi · Oct 9  $20.00\nPublix · Oct 5  $50.00') in c and '$0.00' not in c,'carlos no-items lines: '+c)
    check(c.rstrip().endswith(('PENDIENTE  $92.50' if ES else 'PENDING  $92.50')) and ('YA PAGASTE  −$20.00' if ES else 'ALREADY PAID  −$20.00') in c,'carlos totals: '+c)
    check('ingreso' not in c.lower() and 'income' not in c.lower(),'no income word carlos')
    # dialog from existing 📤 button
    E("tab='res';render()");pg.wait_for_timeout(50)
    btn=pg.locator('button:has-text("📤 Carlos")').first;check(btn.count()==1,'📤 Carlos exists');btn.click();pg.wait_for_timeout(50)
    check(E("dlg().open")and pg.locator('#mmpdf').count()==1 and pg.locator('#mmtxt').count()==1,'share dialog (v70 two options)')
    if '--shots' in sys.argv and lang=='es':pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','123-compartir.png'))
    if '--shots' in sys.argv and lang=='en':pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','123-compartir-en.png'))
    pg.click('#mmtxt');pg.wait_for_timeout(50);pg.click('#msgsh');pg.wait_for_timeout(200);s=E("_sh.at(-1)");check(s and not s['files'] and '$42.50' in s['text'],s)
    check(s['text'].count('\n')>=6 and '\n\n' in s['text'] and s['text']==E("msgShort('carlos','2026-10')"),'share text keeps line breaks')
    pg.click('#mmpdf');pg.wait_for_timeout(50);pg.click('#msgsh');pg.wait_for_function("_sh.length==2",timeout=10000);s=E("_sh.at(-1)")
    check(re.match(r'Carlos-(Octubre|October)-2026-\d{1,2}[a-z]+-\d{1,2}-\d\d(am|pm)\.pdf$',s['files'][0]) and s['size'][0]>1000,s)
    _,tx=pdftext(pg,'c.pdf');check(('Rest of the purchase' if lang=='en' else 'Resto de la compra') in tx and '$12.50' in tx and 'Snacks' in tx and '$0.00' not in tx,'carlos pdf v68 full table: '+tx)
    check('Shampoo' in tx and '42.50' in tx and 'Tony' not in tx.replace('Tony',''),tx[:300])
    # (v58 mailto checks removed in v59)
    # v59: no email button / field in the dialog; stored emails untouched
    check(pg.locator('#msgml').count()==0 and pg.locator('#msgmail').count()==0 and 'Correo' not in pg.locator('#dlg').inner_text() and 'Email' not in pg.locator('#dlg').inner_text(),'no email UI')
    check(pg.locator('#msgsh').count()==1 and pg.locator('#msgcp').count()==1 and pg.locator('#msgdl').count()==1,'Compartir + Copiar + PDF remain')
    E("dlg().close()")
    # Tony pdf
    E("shareMsg('tony','2026-10','pdf')");pg.click('#msgsh');pg.wait_for_function("_sh.length==3",timeout=10000)
    _,tx=pdftext(pg,'t.pdf');check('$0.00' not in tx,'tony pdf no zero items: '+tx)
    check('Walmart' in tx and '35.00' in tx and 'Carlos' in tx and ('Tu parte del mes' in tx or 'Your share this month' in tx),tx[:400]);E("dlg().close()")  # v68: full table
    # month PDF from Reportes
    E("tab='rep';render()");pg.wait_for_timeout(50);check(pg.locator('#pdfbtn').count()==1,'pdf button in Reportes')
    # v91: Ver PDF ya no abre Compartir en la computadora: descarga
    E("()=>{const o=dl;dl=function(f){window._lastFile=f;window._dls=(window._dls||[]).concat(f.name);return o(f)}}")
    E("pdfMes()");pg.wait_for_function("(window._dls||[]).length==1",timeout=10000);fn=E("_dls[0]");check(E("_sh.length")==3 and re.search(r'-(Octubre|October)-2026-Joe-\d{1,2}[a-z]+-\d{1,2}-\d\d(am|pm)\.pdf$',fn),fn)
    p,tx=pdftext(pg,f'm-{lang}.pdf')
    for w in (['Lo que tengo','Lo que debo','Balance','Gasto por categor','Ingresos por concepto','Tony','Carlos (por cobrar)','Compras compartidas','Saldos de tarjetas','Walmart'] if lang=='es' else
              ['What I','Balance','Spending by category','Income by concept','Carlos (to collect)','Shared purchases','Card balances','Walmart']):check(w in tx,f'{lang} pdf has {w}')
    check(('Reembolso de Carlos' not in tx) and ('Carlos reimb' not in tx),'reimbursement not in income')
    if '--shots' in sys.argv and lang=='es':
        txt=E("msgFor('tony','2026-10')")
        P2=pg.context.new_page();P2.evaluate("t=>{document.body.innerHTML='<div id=msgimg style=\"margin:16px;max-width:360px;background:#dcf8c6;border-radius:12px;padding:12px 14px;font:15px/1.45 -apple-system,Helvetica,Arial,sans-serif;white-space:pre-wrap;color:#111;box-shadow:0 1px 2px #0003\"></div>';document.getElementById('msgimg').textContent=t;document.body.style.background='#ece5dd'}",txt)
        P2.locator('#msgimg').screenshot(path=os.path.join(ROOT,'shots','124-mensaje.png'));P2.close()
        subprocess.run(['pdftoppm','-png','-r','90','-f','1','-l','1','-singlefile',p,os.path.join(ROOT,'shots','122-pdf')],check=True)
    # download fallback when files can't be shared
    E("()=>{navigator.canShare=()=>false;window._dl=0;const o=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)window._dl++;else o.call(this)}}")
    E("pdfMes()");pg.wait_for_function("_dl==1",timeout=10000);check(True,'download (anchor) still works')
    E("()=>{S.months['2026-10'].purchases.push({id:'pi2',store:'Aldi',date:'2026-10-13',total:40,mode:'fam',who:['Yo','Tony','Carlos'],method:'',shares:{Tony:15,Carlos:15,Yo:10},items:{Carlos:[{a:10,n:'Leche'}]}});tab='mov';hRange='cur';render()}")
    pg.click('.hrow[data-id="pi2"] .hexp');pg.wait_for_timeout(50);d=pg.locator('.hrow[data-id="pi2"] .hdet').inner_text()
    check('$10.00 + $5.00 =' in d and '$0.00 +' not in d and d.count(' + ')==1,'history expand rule: '+d)
    E("()=>{S.months['2026-10'].purchases.pop();render()}")
    E("()=>{S.pplEmail={Carlos:'c@example.com'};const it=Object.values((S.catalog||{}).items||{}).find(x=>x.t==='ppl'&&x.key==='Tony');if(it)it.email='t@example.com'}");em=E("JSON.stringify([S.pplEmail,S.catalog])")
    E("()=>{tab='cfg';render()}");E("()=>{const i=S.people.indexOf('Carlos');CTL.people.edit(i)}");pg.wait_for_timeout(50)
    check(pg.locator('#npm').count()==0 and pg.locator('#dlg input[type=email]').count()==0,'no email field in Personas');pg.click('#ndok');pg.wait_for_timeout(50)
    check(E("JSON.stringify([S.pplEmail,S.catalog])")==em,'stored emails untouched')
    after=E("JSON.stringify(S.months)");import json,difflib
    if after!=before:print('\n'.join(list(difflib.unified_diff(json.dumps(json.loads(before),indent=0).splitlines(),json.dumps(json.loads(after),indent=0).splitlines(),lineterm=''))[:40]))
    check(after==before,'months untouched')
    check(not pg.errors,pg.errors)
print('OK',ok)
