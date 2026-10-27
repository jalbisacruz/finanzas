// v113 (Joe): la nota (texto) para Carlos y para Tony también muestra las deudas entre ellos (Carlos ↔ Tony),
// con las compras que las explican (las que pagó Tony/Arianna con parte de Carlos, o las que pagó Carlos con parte de Tony).
// El PDF (rep3) ya traía la pareja Carlos–Tony; ahora el texto también. Regla v104: solo compras donde esa persona está.
Object.assign(EN,{"ENTRE TÚ Y TONY":"BETWEEN YOU AND TONY","ENTRE TÚ Y CARLOS":"BETWEEN YOU AND CARLOS","Le debes a {0}":"You owe {0}","{0} te debe":"{0} owes you",
 "Compras que pagó {0}":"Purchases paid by {0}","(ya pagado ✅)":"(already paid ✅)","Tu parte":"Your share"});
function v113Peer(who,k){const m=S.months[k];if(!m||typeof tcOf!=='function')return [];const x=tcOf(m);if(!x)return [];
 const me=who==='tony'?'Tony':'Carlos',ot=me==='Tony'?'Carlos':'Tony',P=paidOther(m),L=['',T(me==='Carlos'?'ENTRE TÚ Y TONY':'ENTRE TÚ Y CARLOS')];
 const grp=[['Tony',P.filter(p=>TFAM.includes(p.paidBy)&&+(p.shares||{}).Carlos),'Carlos'],['Carlos',P.filter(p=>p.paidBy==='Carlos'&&+(p.shares||{}).Tony),'Tony']];
 grp.forEach(([payer,ps,sh])=>{if(!ps.length)return;L.push(T('Compras que pagó {0}',DN(payer==='Tony'?[...new Set(ps.map(p=>p.paidBy))].map(DN).join('/'):payer))+' — '+T('Tu parte')+(sh===me?'':' ('+DN(sh)+')')+':');
  ps.forEach(p=>L.push(`${p.date?fdate(p.date)+' · ':''}${DN(p.store)} — ${f(+(p.shares||{})[sh]||0)}`))});
 L.push(mLine(x.from===me?T('Le debes a {0}',DN(x.to)):T('{0} te debe',DN(x.from)),f(x.amount))+(x.settled?' '+T('(ya pagado ✅)'):''));return L}
{const _s=msgShort;msgShort=function(who,k){const t=_s(who,k),e=v113Peer(who,k);return e.length?t+'\n'+e.join('\n'):t}}
{const _p=msgPdfText;msgPdfText=function(who,k){const t=_p(who,k).split('\n'),e=v113Peer(who,k);if(!e.length)return t.join('\n');const x=e[e.length-1];t.splice(t.length-1,0,x);return t.join('\n')}}
