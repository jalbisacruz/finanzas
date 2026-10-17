"""v88: Hoy › Disponible ahora muestra lo REAL en la cuenta (incluye terceros) + subtítulo legible 'Tuyo: $X · sin $Y de terceros';
sin terceros pendiente = tarjeta como antes; proyectado/Te queda/Plan/Mi balance siguen sin terceros (datos inventados)"""
import os,sys,re
from harness import app,HERE
ROOT=os.path.dirname(HERE);ok=0
def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1
SH='--shots' in sys.argv
with app(ROOT,now='2026-10-17T18:30:00',expand=False,width=390,height=844) as pg:
    E=pg.evaluate
    E("()=>{tab='ini';render()}");pg.wait_for_timeout(100)
    check(pg.locator('#heldnote').count()==0 and pg.locator('#dispv').count()==0,'no terceros: no subtitle')
    check(E("hero()===_heroV87()"),'no terceros: card exactly as before v87')
    nums=lambda:E("""(()=>{const p=planNums(),c=calc(L());return {proj:p.proj,bal:c.bal,v2:(document.getElementById('v')||document.body).innerText}})()""")
    b=nums();disp0=E("r2(sum(L().income,x=>x.amount))")
    # depósito de $152 de un amigo (inventado), luego envío de $50
    E("()=>{spend('deb',-152);(S.held=S.held||[]).push({id:'h1',who:'Amigo',amount:152,date:'2026-10-17',method:'deb',via:'Western Union',note:'',at:Date.now(),sends:[]});save();render()}");pg.wait_for_timeout(150)
    disp=E("r2(sum(L().income,x=>x.amount))");check(abs(disp-disp0-152)<.005,'debit up 152')
    big=pg.inner_text('#dispv');check(big=='$'+format(disp,',.2f'),'big number = real account incl. terceros %s'%big)
    sub=pg.inner_text('#heldnote');check(sub=='Tuyo: $%s · sin $152.00 de terceros'%format(disp-152,',.2f'),'subtitle '+sub)
    st=E("""(()=>{const s=getComputedStyle(document.getElementById('heldnote'));return [parseFloat(s.fontSize),+s.fontWeight,s.color]})()""")
    check(15<=st[0]<=16 and st[1]>=600,'readable: %s'%st)
    rgb=[int(x) for x in re.findall(r'\d+',st[2])[:3]];check(min(rgb)>=200,'light text on blue %s'%st[2])
    small=E("parseFloat(getComputedStyle(document.querySelector('#herocard .muted')).fontSize)");check(st[0]>small,'larger than small notes')
    a=nums();check(abs(a['proj']-b['proj'])<.005 and abs(a['bal']-b['bal'])<.005,'proyectado / Mi balance still exclude terceros %s %s'%(a['proj'],b['proj']))
    if SH:
        pg.add_style_tag(content='.toast,#fab{display:none!important}');E("window.scrollTo(0,0)");pg.wait_for_timeout(100)
        pg.screenshot(path=os.path.join(ROOT,'shots','152-hoy-v88.png'))
    # envío de 50 → 102 pendiente
    E("()=>{spend('deb',50);S.held[0].sends.push({id:'s1',amount:50,date:'2026-10-18',via:'Zelle',note:''});save();render()}");pg.wait_for_timeout(100)
    check('sin $102.00 de terceros' in pg.inner_text('#heldnote') and pg.inner_text('#dispv')=='$'+format(disp-50,',.2f'),'after send')
    # completado → como antes
    E("()=>{spend('deb',102);S.held[0].sends.push({id:'s2',amount:102,date:'2026-10-19',via:'Zelle',note:''});save();render()}");pg.wait_for_timeout(100)
    check(pg.locator('#heldnote').count()==0 and E("hero()===_heroV87()"),'0 pending: card as before')
    E("()=>{S.held[0].sends.pop();spend('deb',-102);LANG='en';render()}");pg.wait_for_timeout(100)
    check(pg.inner_text('#heldnote').startswith('Yours: $') and 'without $102.00 held for others' in pg.inner_text('#heldnote'),'EN')
    check(not [e for e in pg.errors if not e.startswith('DIALOG')],pg.errors)
print('test_v88 OK',ok)
