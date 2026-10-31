// v119 (Joe): en la nota para Tony, la deuda de Carlos salía compra por compra pero sin un TOTAL claro
// (solo «Carlos te debe» al final, mezclado con el resto). Ahora cada grupo trae su «Total» y al final
// sale «TOTAL QUE CARLOS TE DEBE» (o «TOTAL QUE LE DEBES A CARLOS»). Lo mismo, simétrico, en la nota de Carlos.
Object.assign(EN,{"Parte de {0}":"{0}'s share","TOTAL QUE {0} TE DEBE":"TOTAL {0} OWES YOU","TOTAL QUE LE DEBES A {0}":"TOTAL YOU OWE {0}"});
v113Peer=function(who,k){const m=S.months[k];if(!m||typeof tcOf!=='function')return [];const x=tcOf(m);if(!x)return [];
 const me=who==='tony'?'Tony':'Carlos',P=paidOther(m),L=['',T(me==='Carlos'?'ENTRE TÚ Y TONY':'ENTRE TÚ Y CARLOS')];
 const grp=[['Tony',P.filter(p=>TFAM.includes(p.paidBy)&&+(p.shares||{}).Carlos),'Carlos'],['Carlos',P.filter(p=>p.paidBy==='Carlos'&&+(p.shares||{}).Tony),'Tony']];
 grp.forEach(([payer,ps,sh])=>{if(!ps.length)return;L.push(T('Compras que pagó {0}',payer==='Tony'?[...new Set(ps.map(p=>p.paidBy))].map(DN).join('/'):DN(payer))+' — '+(sh===me?T('Tu parte'):T('Parte de {0}',DN(sh)))+':');
  ps.forEach(p=>L.push(`${p.date?fdate(p.date)+' · ':''}${DN(p.store)} — ${f(+(p.shares||{})[sh]||0)}`));
  if(ps.length>1)L.push(mLine(T('Total'),f(r2(ps.reduce((s,p)=>s+(+(p.shares||{})[sh]||0),0)))))});
 L.push('',mLine(x.from===me?T('TOTAL QUE LE DEBES A {0}',DN(x.to).toUpperCase()):T('TOTAL QUE {0} TE DEBE',DN(x.from).toUpperCase()),f(x.amount))+(x.settled?' '+T('(ya pagado ✅)'):''));return L};
