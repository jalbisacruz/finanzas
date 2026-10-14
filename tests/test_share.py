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
    check(('Walmart' in t and '$35.00' in t and ('solo tuyo $10.00 + parte $25.00' in t or 'only yours $10.00 + share $25.00' in t)),t)
    check(('⏳' in t or '✅' in t) and ('Te transfiero' in t or "I'll transfer" in t or 'pendientes' in t or 'pending' in t),t)
    check('ingreso' not in t.lower() and 'income' not in t.lower(),'no income word tony')
    # v57 rule: no items -> "Tu parte: $Y" only; items -> "solo tuyo X + parte Y = Z"
    YS='Your share' if lang=='en' else 'Tu parte'
    BR=('only yours $10.00 + share $25.00 = $35.00' if lang=='en' else 'solo tuyo $10.00 + parte $25.00 = $35.00')
    check(BR in t,'tony breakdown with items: '+t)
    check(f'Publix 5 oct · {YS}: $100.00'.replace('5 oct','Oct 5' if lang=='en' else '5 oct') in t,'tony no-items line: '+t)
    check(('+ parte $0' not in t) and ('$0.00 +' not in t) and ('(parte' not in t) and ('(share' not in t),'no repeated/zero breakdown tony')
    c=E("msgFor('carlos','2026-10')")
    check('$42.50' in c and 'Shampoo' in c and ('Pendiente' in c or 'Pending' in c),c)
    check(('only yours $30.00 + share $12.50 = $42.50' if lang=='en' else 'solo tuyo $30.00 + parte $12.50 = $42.50') in c,'carlos breakdown: '+c)
    check(f'{YS}: $50.00' in c and f'{YS}: $20.00' in c and '$0.00 +' not in c and c.count('$50.00')==1,'carlos no-items lines: '+c)
    check('ingreso' not in c.lower() and 'income' not in c.lower(),'no income word carlos')
    # dialog from existing 📤 button
    E("tab='res';render()");pg.wait_for_timeout(50)
    btn=pg.locator('button:has-text("📤 Carlos")').first;check(btn.count()==1,'📤 Carlos exists');btn.click();pg.wait_for_timeout(50)
    check(E("dlg().open")and pg.locator('#msgpdf').count()==1 and pg.locator('#msgml').count()==1,'share dialog')
    if '--shots' in sys.argv and lang=='es':pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','123-compartir.png'))
    if '--shots' in sys.argv and lang=='en':pg.locator('#dlg').screenshot(path=os.path.join(ROOT,'shots','123-compartir-en.png'))
    pg.click('#msgsh');pg.wait_for_timeout(200);s=E("_sh.at(-1)");check(s and not s['files'] and '$42.50' in s['text'],s)
    pg.check('#msgpdf');pg.click('#msgsh');pg.wait_for_function("_sh.length==2",timeout=10000);s=E("_sh.at(-1)")
    check(s['files']==['Carlos-2026-10.pdf'] and s['size'][0]>1000,s)
    _,tx=pdftext(pg,'c.pdf');check(('only yours $30.00 + share $12.50' if lang=='en' else 'solo tuyo $30.00 + parte $12.50') in tx and f'{YS}:' in tx and '$0.00' not in tx,'carlos pdf rule: '+tx)
    check('Shampoo' in tx and '42.50' in tx and 'Tony' not in tx.replace('Tony',''),tx[:300])
    # mailto, email remembered (additive)
    pg.fill('#msgmail','carlos@example.com')
    E("void(msgMail=function(w,k){const P='Carlos',to=document.getElementById('msgmail').value.trim();setMail(P,to);window._lastMail=mailURL(to,T('Compras de {0} – Carlos',lbl(k)),document.getElementById('msgt').value)})")
    pg.click('#msgml');u=E("_lastMail")
    check(u.startswith('mailto:carlos@example.com?subject=') and 'body=' in u and '42.50' in u,u)
    check(E("getMail('Carlos')")=='carlos@example.com','email remembered')
    E("dlg().close()")
    # Tony pdf
    E("shareMsg('tony','2026-10')");pg.check('#msgpdf');pg.click('#msgsh');pg.wait_for_function("_sh.length==3",timeout=10000)
    _,tx=pdftext(pg,'t.pdf');check('$0.00' not in tx,'tony pdf no zero items: '+tx)
    check('Walmart' in tx and '35.00' in tx and 'Carlos' not in tx,tx[:400]);E("dlg().close()")
    # month PDF from Reportes
    E("tab='rep';render()");pg.wait_for_timeout(50);check(pg.locator('#pdfbtn').count()==1,'pdf button in Reportes')
    pg.click('#pdfbtn');pg.wait_for_function("_sh.length==4",timeout=10000);s=E("_sh.at(-1)");check(s['files'][0].endswith('-2026-10.pdf'),s)
    p,tx=pdftext(pg,f'm-{lang}.pdf')
    for w in (['Lo que tengo','Lo que debo','Balance','Gasto por categor','Ingresos por concepto','Tony','Carlos (por cobrar)','Compras compartidas','Saldos de tarjetas','Walmart'] if lang=='es' else
              ['What I','Balance','Spending by category','Income by concept','Carlos (to collect)','Shared purchases','Card balances','Walmart']):check(w in tx,f'{lang} pdf has {w}')
    check(('Reembolso de Carlos' not in tx) and ('Carlos reimb' not in tx),'reimbursement not in income')
    if '--shots' in sys.argv and lang=='es':
        subprocess.run(['pdftoppm','-png','-r','90','-f','1','-l','1','-singlefile',p,os.path.join(ROOT,'shots','122-pdf')],check=True)
    # download fallback when files can't be shared
    E("()=>{navigator.canShare=()=>false;window._dl=0;const o=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)window._dl++;else o.call(this)}}")
    pg.click('#pdfbtn');pg.wait_for_function("_dl==1",timeout=10000);check(True,'download fallback')
    E("()=>{S.months['2026-10'].purchases.push({id:'pi2',store:'Aldi',date:'2026-10-13',total:40,mode:'fam',who:['Yo','Tony','Carlos'],method:'',shares:{Tony:15,Carlos:15,Yo:10},items:{Carlos:[{a:10,n:'Leche'}]}});tab='mov';hRange='cur';render()}")
    pg.click('.hrow[data-id="pi2"] .hexp');pg.wait_for_timeout(50);d=pg.locator('.hrow[data-id="pi2"] .hdet').inner_text()
    check('$10.00 + $5.00 =' in d and '$0.00 +' not in d and d.count(' + ')==1,'history expand rule: '+d)
    E("()=>{S.months['2026-10'].purchases.pop();render()}")
    after=E("JSON.stringify(S.months)");import json,difflib
    if after!=before:print('\n'.join(list(difflib.unified_diff(json.dumps(json.loads(before),indent=0).splitlines(),json.dumps(json.loads(after),indent=0).splitlines(),lineterm=''))[:40]))
    check(after==before,'months untouched')
    check(not pg.errors,pg.errors)
print('OK',ok)
