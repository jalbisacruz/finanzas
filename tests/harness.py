"""Shared helpers for Finanzas UI tests. Uses ONLY tests/fixture.json (made-up data)."""
import json, os, socket, subprocess, sys, time, contextlib
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
FIX=json.load(open(os.path.join(HERE,'fixture.json')))
NOW='2026-10-13T10:00:00'   # a Tuesday
METRICS_JS=r"""()=>{const o={};for(const k of keys()){const m=S.months[k],c=calc(m);
 const SP=window.spentRaw||spent,ER=window.earnedRaw||earned,bud=window.spentRaw?(()=>{const by={...SP(m).by},t=tonyBy(m);Object.entries(t).forEach(([c,v])=>by[c]=r2((by[c]||0)+v));return by})():budBy(m).by; /* v81: reembolsos/Kalshi neto se prueban en test_v81; aquí, los totales de siempre */
 o[k]={calc:Object.fromEntries(Object.entries(c).map(([a,b])=>[a,r2(b)])),spent:SP(m),earned:ER(m),bud,cb:cbBy([m])}}
 const m=L(),c=calc(m),disp=r2(sum(m.income,x=>x.amount)),pc=pendingCheck(),oldT=sum(prevPend(),p=>p.c.tonyDue);
 o.hoy={disp,proj:r2(disp+(pc?pc.amount:0)-c.tonyDue-oldT-c.credit),deb:r2(debE(m).amount),oldT:r2(oldT)};
 o.cbAll=cbBy(keys().map(k=>S.months[k]));return JSON.parse(JSON.stringify(o))}"""
def free_port():
    s=socket.socket();s.bind(('',0));p=s.getsockname()[1];s.close();return p
@contextlib.contextmanager
def app(root, lang='es', now=NOW, state=None, width=390, height=900, init='', routes=None, expand=True, browser='chromium', ctx_opts=None, new_look=False):
    port=free_port()
    srv=subprocess.Popen([sys.executable,'-m','http.server',str(port)],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    time.sleep(0.7)
    try:
        with sync_playwright() as p:
            b=getattr(p,browser).launch();ctx=b.new_context(viewport={'width':width,'height':height},service_workers='block',**(ctx_opts or {}))
            pg=ctx.new_page();pg.errors=[]
            pg.clock.install(time=now)
            pg.on('pageerror',lambda e:pg.errors.append('PE:'+str(e)))
            pg.on('console',lambda m:m.type=='error' and pg.errors.append('CE:'+m.text))
            pg.on('dialog',lambda d:(pg.errors.append('DIALOG:'+d.message), d.accept()))
            R={'**/firebase-config.js':''};R.update(routes or {})
            for pat,body in R.items(): pg.route(pat,(lambda b:(lambda r:r.fulfill(body=b,content_type='text/javascript',headers={'Access-Control-Allow-Origin':'*'})))(body))
            st=json.dumps(state or FIX)
            pg.add_init_script(f"if(!sessionStorage.getItem('seeded')){{localStorage.clear();localStorage.setItem('finanzas-v1',{json.dumps(st)});localStorage.setItem('finanzas-sync-asked','1');localStorage.setItem('finanzas-lang','{lang}');sessionStorage.setItem('seeded','1')}}")
            # v114: todo cerrado por defecto; las pruebas viejas usan la regla anterior (defcol) salvo new_look=True
            if not new_look: pg.add_init_script('window.V114_LEGACY_OPEN=1')
            if init: pg.add_init_script(init)
            # v79 closes most sections by default; older suites read/click inside them, so show their contents (expand=False = real look)
            if expand: pg.add_init_script("addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='.card.col>:not(h2){display:revert!important}';document.head.appendChild(s)})")
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

# v81: reembolsos y cash back ya no son ingreso; Ingresos esperados solo cheques. Estos montos de antes cambian a propósito.
V81_GONE_JS=r"""()=>{if(!window.earnedRaw)return [];const o=[];keys().forEach(k=>{const m=S.months[k],ri=earnedRaw(m).total,rs=spentRaw(m).total;o.push(f(ri),f(ri-rs),f(rs))});o.push(f(keys().map(k=>spentRaw(S.months[k]).total).reduce((a,b)=>a+b,0)));
 const all=keys().map(k=>earnedRaw(S.months[k]).total);o.push(f(all.reduce((a,b)=>a+b,0)));
 const P=planNums(),ro=earnedRaw(L()).total,inc=P.inc-P.cheq+ro;o.push(f(inc),f(inc-P.bud),f(ro-P.sp),f(r2(inc)),f(r2(inc-P.bud)),f(r2(ro-P.sp)));return [...o,...o.map(x=>'−'+x)]}"""
