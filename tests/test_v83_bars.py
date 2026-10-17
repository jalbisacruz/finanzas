"""v83: Reportes › Gasto y presupuesto por categoría: barra = gastado/presupuesto (tope 100%, roja si se pasa), color igual al %,
sin presupuesto gris y relativa (made-up data con los números del caso de Joe): python tests/test_v83_bars.py [--shots]"""
import os,sys
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
GREEN,YEL,RED,GREY='rgb(22, 163, 74)','rgb(245, 158, 11)','rgb(220, 38, 38)','rgb(148, 163, 184)'
with app(ROOT,now='2026-10-16T10:00:00',expand=False,width=390,height=844) as pg:
    E=pg.evaluate;pg.on('dialog',lambda d:d.accept())
    cats=E("pCats? pCats():S.cats");cat=lambda s:[c for c in cats if s in c][0]
    C={'com':cat('Comida'),'sal':cat('Salud'),'kal':'📈 Kalshi','gas':cat('Gasolina'),'ropa':cat('Ropa'),'ent':cat('Entreten') if any('Entreten' in c for c in cats) else cat('Casa')}
    E("""C=>{const m=L();m.personal=[];m.purchases=[];m.events=(m.events||[]).filter(e=>!(e.type==='income'&&/Kalshi/.test(e.concept||'')));
     const add=(c,a)=>m.personal.unshift({id:uid(),date:'2026-10-10',amount:a,cat:c,desc:'x',method:'deb'});
     add(C.com,93.64);add(C.sal,38);add(C.kal,10);add(C.gas,180);add(C.ropa,200);add(C.ent,40.4);
     S.budgets={[C.com]:150,[C.sal]:50,[C.kal]:40,[C.gas]:160,[C.ent]:50};save();tab='rep';render()}""",C)
    pg.wait_for_timeout(150)
    E("()=>{const h=document.querySelector('#gpcard>h2');if(document.querySelector('#gpcard').classList.contains('col'))h.click()}");pg.wait_for_timeout(150)
    rows=E("""()=>[...document.querySelectorAll('#gpcard .bar')].map(b=>{const bt=b.querySelector('.bt'),i=bt.firstElementChild,pc=b.querySelector('.muted b');
      return {n:b.querySelector('.bl span').textContent,w:Math.round(i.getBoundingClientRect().width/bt.getBoundingClientRect().width*1000)/10,bg:getComputedStyle(i).backgroundColor,
       pct:pc?pc.textContent:null,pcol:pc?getComputedStyle(pc).color:null,txt:b.innerText}})""")
    R={r['n']:r for r in rows};print(rows)
    dn=lambda k:E("c=>DN(c)",C[k])
    def bar(k,w,col,pct=None):
        r=R[dn(k)];check(abs(r['w']-w)<=1,'%s width %s≈%s'%(k,r['w'],w));check(r['bg']==col,'%s colour %s'%(k,r['bg']))
        if pct is not None:check(r['pct']==pct and r['pcol']==col,'%s %% text %s %s matches bar'%(k,r['pct'],r['pcol']))
    bar('com',62.4,GREEN,'62%')      # Joe: $93.64 de $150 → 62%, ya no barra llena
    bar('sal',76,GREEN,'76%')        # Joe: $38 de $50 → 76%
    bar('kal',25,GREEN,'25%')        # Joe: $10 de $40 → 25%
    bar('ent',80.8,YEL,'81%')        # ≥80% amarillo
    bar('gas',100,RED,'113%')        # se pasó: barra llena roja
    bar('ropa',100,GREY)             # sin presupuesto: gris, relativa al mayor gasto ($200 es el mayor)
    check('Sin presupuesto' in R[dn('ropa')]['txt'] and R[dn('ropa')]['pct'] is None,'no-budget row labelled')
    check('$93.64' in R[dn('com')]['txt'] and '$150.00' in R[dn('com')]['txt'],'amounts shown')
    if SH:
        pg.locator('#gpcard').scroll_into_view_if_needed();pg.wait_for_timeout(100);pg.locator('#gpcard').screenshot(path=os.path.join(ROOT,'shots','148-barras-presupuesto.png'))
    # inglés
    E("()=>{LANG='en';render()}");pg.wait_for_timeout(150)
    E("()=>{const h=document.querySelector('#gpcard>h2');if(document.querySelector('#gpcard').classList.contains('col'))h.click()}");pg.wait_for_timeout(100)
    check('No budget' in pg.inner_text('#gpcard'),'EN no-budget label')
    check(not [e for e in pg.errors if 'DIALOG' not in e],pg.errors)
print('test_v83_bars OK',ok)
