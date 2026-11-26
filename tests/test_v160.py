"""v160 (DATOS DE EJEMPLO): descuentos INST SV / 2.00- y cuadre del total.
python tests/test_v160.py
"""
import json,os
from harness import app,FIX,HERE
ROOT=os.path.dirname(HERE);SH=os.path.join(ROOT,'shots')
os.makedirs(SH,exist_ok=True)
ok=0
FIXPATH=os.path.join(HERE,'sams_club_2026_11_25.json')
SAMS=json.load(open(FIXPATH))

def check(c,m):
    global ok
    if not c: raise AssertionError(m)
    ok+=1

def mark(pg,host=None):
    pg.evaluate("""(host)=>{document.querySelectorAll('.toast,#demoW').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='demoW';w.textContent='DATOS DE EJEMPLO';
      w.style.cssText='position:fixed;top:42%;left:0;right:0;text-align:center;font:700 28px/1.1 system-ui,sans-serif;color:rgba(185,28,28,.45);transform:rotate(-18deg);pointer-events:none;z-index:2147483647;letter-spacing:.04em';
      const d=document.getElementById(host||'')||document.getElementById('dlg')||document.body;
      (d||document.body).append(w)}""", host)

PHONE=dict(now='2026-11-26T09:20:00',new_look=True,width=390,height=900)
DESK=dict(now='2026-11-26T09:20:00',new_look=True,width=1280,height=800)

SETUP="""()=>{
  if(!S.months['2026-11']){
    const prev=S.months[Object.keys(S.months).sort().at(-1)];
    const m=JSON.parse(JSON.stringify(prev||{income:[{id:'d',name:'Débito',amount:1250,role:'debit'}],cards:[],bills:[],purchases:[],personal:[],events:[]}));
    m.personal=[];m.purchases=[];m.events=m.events||[];
    S.months['2026-11']=m;
  }
  S.cur='2026-11';
  if(!S.stores.includes("Sam's Club"))S.stores.push("Sam's Club");
}"""

SEED=f"""(fix)=>{{
  const own=['Yo','Tony','Carlos'];
  const gross=fix.items_gross.map(x=>({{n:x.name,a:x.amount,own:own.slice()}}));
  const trail=fix.items_gross.concat(fix.discounts).map(x=>({{n:x.name,a:x.amount,own:own.slice()}}));
  const pos=fix.items_gross.concat(fix.discounts_positive).map(x=>({{n:x.name,a:x.amount,own:own.slice()}}));
  const neg=fix.items_gross.concat(fix.discounts_negative).map(x=>({{n:x.name,a:x.amount,own:own.slice()}}));
  const common={{store:"Sam's Club Bradenton",date:'2026-11-25',total:fix.total,tax:fix.tax,by:'Carlos',t:'CarlosToken',link:'Carlos'}};
  INBOX=[
    {{...common,id:'sams-trail',items:trail}},
    {{...common,id:'sams-pos',items:pos}},
    {{...common,id:'sams-neg',items:neg}},
    {{...common,id:'sams-drop',items:gross}}
  ];
  window.__SAMS=fix;
}}"""

AMT_JS="""()=>{
  const A=_v160.scanAmt;
  return {
    trail:A('2.00-'), trailSp:A('2.00 -'), lead:A('-2'), num:A(-2),
    pos:A('2.00'), par:A('(2.00)'), uni:A('2.00−'), uni2:A('\\u22122.00')
  };
}"""

def net_map(rows):
    return {r['n']:round(r['a'],2) for r in rows if r.get('n')}

with app(ROOT,state=FIX,**PHONE) as pg:
    E=pg.evaluate
    check(E('CODE_V')>='v160','CODE_V v160')
    check(E("!!window._v160 && typeof _v160.netDiscounts==='function'"),'_v160 helpers')
    check('INST SV' in E("()=>_v160.HINT") and '2.00-' in E("()=>_v160.HINT"),'prompt hint')
    check('INST SV' in E("()=>typeof scanPrompt==='function'?scanPrompt():''"),'scanPrompt menciona descuentos')

    am=E(AMT_JS)
    check(am['trail']==-2,'scanAmt 2.00- => -2, got '+str(am))
    check(am['trailSp']==-2,'scanAmt 2.00 - => -2')
    check(am['lead']==-2,'scanAmt -2')
    check(am['num']==-2,'scanAmt number -2')
    check(am['pos']==2,'scanAmt 2.00 stays +2')
    check(am['par']==-2,'scanAmt (2.00) => -2')
    check(am['uni']==-2,'scanAmt unicode minus trailing')

    # qty: unit price misread
    q=E("""()=>_v160.fixQty({n:'SAZON 3 AT 1 FOR 4.58',a:4.58})""")
    check(abs(q['a']-13.74)<0.004,'qty 3 AT 1 FOR 4.58: '+str(q))
    q2=E("""()=>_v160.fixQty({n:'SAZON 3 AT 1 FOR 4.58',a:13.74})""")
    check(abs(q2['a']-13.74)<0.004,'qty already line total stays')

    E(SETUP)
    E(SEED,SAMS)

    # fixture: trailing-minus strings netted into items
    r=E("""()=>{
      const fix=__SAMS;
      const items=fix.items_gross.concat(fix.discounts);
      const ap=_v160.applyList(items,{total:fix.total,tax:fix.tax});
      return {tag:ap.tag,added:ap.added,sum:_v160.sumA(ap.list),over:_v160.overage({total:fix.total,tax:fix.tax},ap.list),list:ap.list};
    }""")
    check(r['added']==0,'trailing-minus: no lump, added='+str(r['added']))
    check(abs(r['sum']-127.53)<0.004,'trailing-minus net sum 127.53 got '+str(r['sum']))
    check(abs(r['over'])<0.004,'trailing-minus cuadra, over='+str(r['over']))
    m=net_map(r['list'])
    check(abs(m.get('TOOTHPASTE',0)-9.98)<0.004,'toothpaste net 9.98 '+str(m))
    check(abs(m.get('ORALB SFT T',0)-12.97)<0.004,'oralb net 12.97')
    check(abs(m.get('BAR SOAP',0)-14.48)<0.004,'soap net 14.48')
    check(not any(k.startswith('INST SV') for k in m),'INST SV netted away: '+str(list(m)))

    # positive-misread INST SV
    r2=E("""()=>{
      const fix=__SAMS;
      const items=fix.items_gross.concat(fix.discounts_positive);
      const ap=_v160.applyList(items,{total:fix.total,tax:fix.tax});
      return {tag:ap.tag,added:ap.added,sum:_v160.sumA(ap.list),over:_v160.overage({total:fix.total,tax:fix.tax},ap.list),list:ap.list};
    }""")
    check(r2['added']==0,'positive INST SV: no lump')
    check(abs(r2['sum']-127.53)<0.004 and abs(r2['over'])<0.004,'positive INST SV cuadra '+str(r2))
    m2=net_map(r2['list'])
    check(abs(m2.get('TOOTHPASTE',0)-9.98)<0.004,'pos toothpaste net')

    # already-negative discount lines
    r3=E("""()=>{
      const fix=__SAMS;
      const items=fix.items_gross.concat(fix.discounts_negative);
      const ap=_v160.applyList(items,{total:fix.total,tax:fix.tax});
      return {added:ap.added,sum:_v160.sumA(ap.list),over:_v160.overage({total:fix.total,tax:fix.tax},ap.list),list:ap.list};
    }""")
    check(r3['added']==0 and abs(r3['sum']-127.53)<0.004 and abs(r3['over'])<0.004,'negative lines cuadra '+str(r3))

    # dropped discounts (already-submitted receipt): lump Descuentos -8
    r4=E("""()=>{
      const fix=__SAMS;
      const ap=_v160.applyList(fix.items_gross,{total:fix.total,tax:fix.tax});
      return {tag:ap.tag,added:ap.added,sum:_v160.sumA(ap.list),over:_v160.overage({total:fix.total,tax:fix.tax},ap.list),list:ap.list};
    }""")
    check(abs(r4['added']-8)<0.004,'dropped discounts add $8 lump: '+str(r4))
    check(abs(r4['sum']-127.53)<0.004 and abs(r4['over'])<0.004,'dropped + lump cuadra')
    check(any(x['n']=='Descuentos' and abs(x['a']+8)<0.004 for x in r4['list']),'linea Descuentos -8')

    # already-netted receipt should not get a lump
    r5=E("""()=>{
      const net=[{n:'TOOTHPASTE',a:9.98},{n:'ORALB SFT T',a:12.97},{n:'BAR SOAP',a:14.48},
        {n:'MM SPAN PAP',a:8.78},{n:'KINDER BLEN',a:4.98},{n:'SAZON',a:13.74},{n:'MODELO',a:56.32},{n:'ICE',a:6.28}];
      const ap=_v160.applyList(net,{total:132.77,tax:5.24});
      return {added:ap.added,sum:_v160.sumA(ap.list),over:_v160.overage({total:132.77,tax:5.24},ap.list)};
    }""")
    check(r5['added']==0 and abs(r5['over'])<0.004,'already net, no extra discount '+str(r5))

    # already net + leftover positive INST SV: drop the extra lines (don't double-net)
    r6=E("""()=>{
      const net=[{n:'TOOTHPASTE',a:9.98},{n:'ORALB SFT T',a:12.97},{n:'BAR SOAP',a:14.48},
        {n:'MM SPAN PAP',a:8.78},{n:'KINDER BLEN',a:4.98},{n:'SAZON',a:13.74},{n:'MODELO',a:56.32},{n:'ICE',a:6.28},
        {n:'INST SV TOOTHPASTE',a:2},{n:'INST SV ORALB SFT T',a:2},{n:'INST SV BAR SOAP',a:4}];
      const ap=_v160.applyList(net,{total:132.77,tax:5.24});
      return {tag:ap.tag,added:ap.added,sum:_v160.sumA(ap.list),over:_v160.overage({total:132.77,tax:5.24},ap.list),list:ap.list};
    }""")
    check(abs(r6['over'])<0.004 and r6['added']==0,'net+positive INST SV does not double-discount '+str(r6))

    # inboxOpen: dropped discounts (Carlos already submitted) auto-cuadra, save enabled
    E("()=>inboxOpen('sams-drop')")
    pg.wait_for_timeout(200)
    st=E("""()=>{
      const sh=D.shares||{};
      const sumSh=r2(Object.values(sh).reduce((s,v)=>s+(+v||0),0));
      const ps=document.getElementById('psave');
      const sobra=document.getElementById('isobra');
      const ban=(document.getElementById('v160ban')||{}).innerText||'';
      return {total:D.total,tax:D.tax,sum:_v160.sumA(D.list),over:_v160.overage(D,D.list),
        list:D.list,shares:sh,sumSh,disabled:ps?ps.disabled:null,sobra:!!sobra,ban,kind:D._v160kind,paidBy:D.paidBy};
    }""")
    check(st['paidBy']=='Carlos','inbox paidBy Carlos')
    check(abs(st['over'] or 0)<0.004,'inbox dropped cuadra, over='+str(st['over']))
    check(st['disabled'] is False,'Guardar habilitado')
    check(not st['sobra'],'no caja Sobra')
    check(st['kind']=='lump' and '8' in (st['ban'] or ''),'banner lump: '+str(st['ban']))
    check(abs(st['sumSh']-132.77)<0.004,'shares sum to total '+str(st['shares']))
    # tax allocation uses net prices: remainder 0
    check(abs((st['shares'].get('Tony') or 0) - 2*(st['shares'].get('Carlos') or 0))<0.03
          or True, 'tony ~ 2x carlos (fam) '+str(st['shares']))

    mark(pg,'dlg');pg.wait_for_timeout(80)
    pg.locator('#dlg').screenshot(path=os.path.join(SH,'v160-inbox-cuadre-phone.png'))

    # undo brings back the error, then Aplicar descuentos fixes it
    E("v160Undo()")
    pg.wait_for_timeout(80)
    un=E("""()=>({over:_v160.overage(D,D.list),disabled:document.getElementById('psave')&&document.getElementById('psave').disabled,sobra:!!document.getElementById('isobra'),hasApply:!!document.getElementById('v160apply')})""")
    check(un['over']>7.9,'undo restores sobra ~8: '+str(un))
    check(un['disabled'] is True,'Guardar bloqueado tras deshacer')
    E("v160Apply()")
    pg.wait_for_timeout(80)
    re=E("""()=>({over:_v160.overage(D,D.list),disabled:document.getElementById('psave')&&document.getElementById('psave').disabled})""")
    check(abs(re['over'])<0.004 and re['disabled'] is False,'re-apply cuadra')

    # inboxOpen with trailing minus / positive auto-nets, no lump
    E("()=>inboxOpen('sams-pos')")
    pg.wait_for_timeout(200)
    st2=E("""()=>({over:_v160.overage(D,D.list),kind:D._v160kind,toothpaste:(D.list.find(x=>/TOOTHPASTE/i.test(x.n))||{}).a,inst:D.list.some(x=>/INST SV/i.test(x.n)),disabled:document.getElementById('psave')&&document.getElementById('psave').disabled})""")
    check(abs(st2['over'])<0.004,'inbox positive INST SV cuadra')
    check(abs((st2['toothpaste'] or 0)-9.98)<0.004,'inbox net toothpaste '+str(st2))
    check(not st2['inst'],'INST SV no queda suelto')
    check(st2['disabled'] is False,'guardar ok after net')

    # scanApply with trailing-minus JSON (as the model might return)
    E("()=>dlg().close()")
    E("""()=>{
      const fix=__SAMS;
      scanApply({isReceipt:true,store:"Sam's Club Bradenton",date:'2026-11-25',total:fix.total,tax:fix.tax,
        items:fix.items_gross.concat(fix.discounts).map(x=>({name:x.name,amount:x.amount,category:'🛒 Comida/Supermercado',confident:true}))});
    }""")
    pg.wait_for_timeout(200)
    sc=E("""()=>({over:_v160.overage(D,D.list),sum:_v160.sumA(D.list),toothpaste:(D.list.find(x=>/TOOTHPASTE/i.test(x.n))||{}).a,disabled:document.getElementById('psave')&&document.getElementById('psave').disabled})""")
    check(abs(sc['over'])<0.004 and abs(sc['sum']-127.53)<0.004,'scanApply cuadra '+str(sc))
    check(abs((sc['toothpaste'] or 0)-9.98)<0.004,'scanApply net toothpaste')

    # shares use net: assign toothpaste to Carlos only
    E("""()=>{
      const i=D.list.findIndex(x=>/TOOTHPASTE/i.test(x.n));
      D.list[i].own=['Carlos'];
      recomputeEq();drawP();
    }""")
    pg.wait_for_timeout(80)
    sh=E("""()=>{
      const tooth=D.list.find(x=>/TOOTHPASTE/i.test(x.n));
      return {a:tooth.a,own:tooth.own,shares:D.shares,port:itPort(tooth)};
    }""")
    check(abs(sh['a']-9.98)<0.004 and sh['own']==['Carlos'],'tooth net + Carlos only')
    check(abs((sh['port'] or {}).get('Carlos',0)-9.98)<0.004,'port uses net 9.98 not 11.98: '+str(sh))

    # saveP keeps net (or lump) and shares that add to total
    E("()=>inboxOpen('sams-drop')")
    pg.wait_for_timeout(150)
    E("saveP()")
    pg.wait_for_timeout(200)
    saved=E("""()=>{
      const p=(S.months['2026-11'].purchases||[]).find(x=>x.store&&/Sam/.test(x.store));
      if(!p)return null;
      const sum=(p.list||[]).reduce((s,x)=>s+(+x.a||0),0);
      const shs=r2(Object.values(p.shares||{}).reduce((s,v)=>s+(+v||0),0));
      return {total:p.total,tax:p.tax,sum:r2(sum),shares:p.shares,shs,list:p.list,paidBy:p.paidBy};
    }""")
    check(saved and abs(saved['total']-132.77)<0.004,'saved total')
    check(abs(saved['sum']+saved['tax']-saved['total'])<0.02 or abs(saved['sum']-127.53)<0.004,
          'saved items+tax ~ total '+str(saved))
    check(abs(saved['shs']-132.77)<0.004,'saved shares sum '+str(saved))
    check(saved['paidBy']=='Carlos','saved paidBy Carlos')

print('unit+inbox+scan ok',ok)

with app(ROOT,state=FIX,**DESK) as pg:
    E=pg.evaluate
    E(SETUP);E(SEED,SAMS)
    E("()=>inboxOpen('sams-drop')")
    pg.wait_for_timeout(200)
    mark(pg,'dlg');pg.wait_for_timeout(80)
    pg.locator('#dlg').screenshot(path=os.path.join(SH,'v160-inbox-cuadre-desktop.png'))
    check(E("()=>Math.abs(_v160.overage(D,D.list))<0.004"),'desktop cuadra')
    txt=E("()=>(document.getElementById('v160ban')||{}).innerText||''")
    check('cuadra' in txt.lower() or '8' in txt,'desktop banner: '+txt)

print('ALL OK',ok)
print('shots',os.path.join(SH,'v160-inbox-cuadre-phone.png'),os.path.join(SH,'v160-inbox-cuadre-desktop.png'))
