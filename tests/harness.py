"""Shared helpers for Finanzas UI tests. Uses ONLY tests/fixture.json (made-up data)."""
import json, os, socket, subprocess, sys, time, contextlib
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
FIX=json.load(open(os.path.join(HERE,'fixture.json')))
NOW='2026-10-13T10:00:00'   # a Tuesday
METRICS_JS=r"""()=>{const o={};for(const k of keys()){const m=S.months[k],c=calc(m);
 o[k]={calc:Object.fromEntries(Object.entries(c).map(([a,b])=>[a,r2(b)])),spent:spent(m),earned:earned(m),bud:budBy(m).by,cb:cbBy([m])}}
 const m=L(),c=calc(m),disp=r2(sum(m.income,x=>x.amount)),pc=pendingCheck(),oldT=sum(prevPend(),p=>p.c.tonyDue);
 o.hoy={disp,proj:r2(disp+(pc?pc.amount:0)-c.tonyDue-oldT-c.credit),deb:r2(debE(m).amount),oldT:r2(oldT)};
 o.cbAll=cbBy(keys().map(k=>S.months[k]));return JSON.parse(JSON.stringify(o))}"""
def free_port():
    s=socket.socket();s.bind(('',0));p=s.getsockname()[1];s.close();return p
@contextlib.contextmanager
def app(root, lang='es', now=NOW, state=None, width=390, height=900):
    port=free_port()
    srv=subprocess.Popen([sys.executable,'-m','http.server',str(port)],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    time.sleep(0.7)
    try:
        with sync_playwright() as p:
            b=p.chromium.launch();ctx=b.new_context(viewport={'width':width,'height':height},service_workers='block')
            pg=ctx.new_page();pg.errors=[]
            pg.clock.install(time=now)
            pg.on('pageerror',lambda e:pg.errors.append('PE:'+str(e)))
            pg.on('console',lambda m:m.type=='error' and pg.errors.append('CE:'+m.text))
            pg.on('dialog',lambda d:(pg.errors.append('DIALOG:'+d.message) if getattr(pg,'strict_dialogs',False) else None, d.accept()))
            pg.route('**/firebase-config.js',lambda r:r.fulfill(body='',content_type='text/javascript'))
            st=json.dumps(state or FIX)
            pg.add_init_script(f"if(!sessionStorage.getItem('seeded')){{localStorage.clear();localStorage.setItem('finanzas-v1',{json.dumps(st)});localStorage.setItem('finanzas-sync-asked','1');localStorage.setItem('finanzas-lang','{lang}');sessionStorage.setItem('seeded','1')}}")
            pg.goto(f'http://127.0.0.1:{port}/');pg.wait_for_timeout(800)
            pg.evaluate("()=>{unlocked=true;try{closeLock()}catch(e){};document.body.classList.remove('locked');render()}")
            pg.wait_for_timeout(200)
            yield pg
            b.close()
    finally:
        srv.kill()
def dollars(text):
    import re
    return re.findall(r'−?\$[\d,]+\.\d\d',text)
