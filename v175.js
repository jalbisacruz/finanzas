// v175 (Joe): en la página 2 del PDF de Tony, la columna Joe de la tabla y
// «Parte de Joe en las cuentas» no cuadraban. La tabla (v173) suma solo las
// cuentas con hoja aprobada (sheet.sp.Joe); el bloque usaba calc().bills, que
// suma el monto de TODAS las cuentas del mes (b.amount): también Comida (la
// parte de Joe de compras que pagaron Tony/Arianna), cuentas sin hoja, y una
// cuenta con hoja cuyo monto se cambió a mano después de aprobar.
// Ahora: (1) una sola fuente: cada cuenta con hoja aprobada usa la parte de
// Joe de la hoja (b.amount = sheet.sp.Joe); si alguien la cambió a mano se
// corrige y queda anotado (m.v175fix). Así el bloque, Pendiente y Transferir
// usan la misma cifra que la tabla. (2) el bloque muestra, con su nombre, todo
// lo que se suma aparte de la tabla (Comida/compras de Tony, cuentas sin hoja)
// y cuadra siempre con lo pendiente.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "Parte de Joe en las cuentas (tabla)":"Joe's share of the bills (table)",
  "Parte de Joe en compras que pagaron Tony/Arianna":"Joe's share of purchases paid by Tony/Arianna",
  "{0} (monto a mano)":"{0} (typed amount)",
  "{0} (sin hoja aprobada)":"{0} (no approved sheet)",
  "Total de Joe para Tony":"Joe's total for Tony",
  "Otros ajustes":"Other adjustments",
  "{0}: se usó la parte de la hoja aprobada {1} (antes {2})":"{0}: used the approved sheet share {1} (was {2})"
});
const rr=n=>typeof r2==='function'?r2(n):Math.round((+n||0)*100)/100;
const fm=n=>(n<-0.004?'-':'')+'$'+Math.abs(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};
const pt=s=>String(s??'').replace(/[−–—]/g,'-').replace(/[^\x00-\xff]/g,'').replace(/\s+/g,' ').trim();
const nm=b=>typeof DN==='function'?DN(b.name):b.name;
const isFood=b=>!!b&&(typeof isComidaBill==='function'?isComidaBill(b):/^(food|comida)$/i.test(String(b.name||'').trim()))||!!(b&&+b.tfood);
const hasSheet=b=>!!(b&&b.sheet&&b.sheet.sp&&!isFood(b));

// (1) una sola fuente para las cuentas con hoja
function syncSheetAmounts(m,k){
  if(!m||!m.bills)return [];
  const fixes=[];
  m.bills.forEach(b=>{
    if(!hasSheet(b))return;
    const want=rr(+b.sheet.sp.Joe||0),have=rr(+b.amount||0);
    if(Math.abs(want-have)>0.004){fixes.push({id:b.id,name:b.name,from:have,to:want,at:Date.now()});b.amount=want}
  });
  if(fixes.length){m.v175fix=(m.v175fix||[]).concat(fixes).slice(-20)}
  return fixes;
}
const syncAll=()=>{let n=0;Object.entries((typeof S!=='undefined'&&S.months)||{}).forEach(([k,m])=>{n+=syncSheetAmounts(m,k).length});return n};
if(typeof save==='function'){
  const prev=save;
  save=function(){try{syncAll()}catch(e){console.warn('v175',e)}return prev.apply(this,arguments)};
}
setTimeout(()=>{try{if(syncAll()){save();if(typeof render==='function')render()}}catch(e){console.warn('v175',e)}},0);

// (2) bloque que cuadra con la tabla
const base=window._v173&&_v173.buildTonySplit;
function buildTonySplit(k){
  const R=base?base(k):null;if(!R)return R;
  const m=S.months[k||S.cur];if(!m)return R;
  const inTable=new Set(R.rows.map(r=>r.id));
  const extras=[];
  (m.bills||[]).forEach(b=>{
    if(inTable.has(b.id))return;
    const a=rr(+b.amount||0);if(!(Math.abs(a)>0.004))return;
    if(isFood(b)){
      const tf=rr(+b.tfood||0),man=rr(a-tf);
      if(tf>0.004)extras.push({n:tt('Parte de Joe en compras que pagaron Tony/Arianna'),a:tf,kind:'food'});
      if(Math.abs(man)>0.004)extras.push({n:tt('{0} (monto a mano)',nm(b)),a:man,kind:'foodman'});
    }else extras.push({n:tt('{0} (sin hoja aprobada)',nm(b)),a,kind:'nosheet'});
  });
  const joeTable=rr(R.sums.Joe),joeAll=rr(R.joeBills),diff=rr(joeAll-joeTable-extras.reduce((s,x)=>s+x.a,0));
  if(Math.abs(diff)>0.004)extras.push({n:tt('Otros ajustes'),a:diff,kind:'other'});
  const fixes=(m.v175fix||[]).map(x=>tt('{0}: se usó la parte de la hoja aprobada {1} (antes {2})',nm(x),fm(x.to),fm(x.from)));
  return Object.assign(R,{joeTable,extras,fixes});
}
function drawTonySplit(o,R){
  const Sp=R&&R.tonySplit;if(!Sp||!Sp.rows||!Sp.rows.length)return;
  if(!Sp.extras){const prev=window._v173._draw0;return prev&&prev(o,R)}
  const N=x=>(R.names||{})[x]||x,c=window._v173.cell;
  o.h(tt('Reparto de las cuentas de la casa'));
  o.note(tt('Cada cuenta con su total y la parte de Tony, Joe y Carlos.'));o.y+=4;
  o.table([tt('Cuenta'),tt('Total'),N('Tony'),N('Yo'),N('Carlos')],
    Sp.rows.map(r=>[r.n,fm(r.total),c(r.pct.Tony,r.sp.Tony),c(r.pct.Joe,r.sp.Joe),c(r.pct.Carlos,r.sp.Carlos)]),
    {ws:[150,72,98,98,98],left:[0],tot:[tt('Totales'),fm(Sp.sums.total),fm(Sp.sums.Tony),fm(Sp.sums.Joe),fm(Sp.sums.Carlos)]});
  o.y+=8;o.h(tt('Lo que Joe te transfiere'));
  o.row(tt('Parte de Joe en las cuentas (tabla)'),fm(Sp.joeTable));
  if(Sp.extras.length){Sp.extras.forEach(x=>o.row('+ '+pt(x.n),fm(x.a)));o.row(tt('Total de Joe para Tony'),fm(Sp.joeBills),{b:true})}
  if(Sp.tonyPurch>0.004)o.row(tt('Menos: parte de Tony en las compras'),'- '+fm(Sp.tonyPurch));
  o.row(tt('Ya transferido'),Sp.xfer>0.004?'- '+fm(Sp.xfer):fm(0));
  (Sp.adjs||[]).forEach(a=>{const s=pt(a.desc);o.row(tt('Incluye {0}',s.charAt(0).toLowerCase()+s.slice(1)+(a.bill?' '+tt('aplicado a {0}',pt(a.bill)):'')),fm(a.amount),{muted:true,ind:14})});
  if(Sp.due>0.004)o.row(tt('Pendiente'),fm(Sp.due),{b:true});else o.row(tt('Todo al día'),fm(0),{b:true});
  if(Sp.excess>0.004)o.note(tt('Hay un pago de más de {0} todavía no descontado de una cuenta pendiente.',fm(Sp.excess)));
  (Sp.fixes||[]).forEach(s=>o.note(s));
}
if(window._v173){
  _v173._draw0=_v173.drawTonySplit;_v173.drawTonySplit=drawTonySplit;
  if(typeof S!=='undefined'&&S&&S.months&&base)_v173.buildTonySplit=buildTonySplit;
}
window._v175={syncSheetAmounts,syncAll,buildTonySplit,drawTonySplit};
})();
