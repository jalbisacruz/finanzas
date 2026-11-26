// v173 (Joe): en el PDF de Tony, una página nueva (la 2.ª, antes del detalle
// de compras compartidas) con el reparto de las cuentas de la casa: cada
// cuenta con su total y la parte de Tony / Joe / Carlos (% y $), los totales
// por persona, y lo que Joe ya transfirió / queda pendiente, incluido el
// ajuste de pago de más de v172 si lo hay. Misma idea que «De dónde sale tu
// total» del PDF de Carlos, pero con el desglose completo. El PDF de Carlos
// no cambia.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "Reparto de las cuentas de la casa":"Household bill split",
  "Cada cuenta con su total y la parte de Tony, Joe y Carlos.":"Each bill with its total and Tony, Joe and Carlos's share.",
  "Lo que Joe te transfiere":"What Joe transfers to you",
  "Parte de Joe en las cuentas":"Joe's share of the bills",
  "Menos: parte de Tony en las compras":"Minus: Tony's share of purchases",
  "Pendiente":"Pending",
  "Incluye {0}":"Includes {0}",
  "aplicado a {0}":"applied to {0}",
  "Hay un pago de más de {0} todavía no descontado de una cuenta pendiente.":"There is an overpayment of {0} not yet applied to a pending bill."
});
const rr=n=>typeof r2==='function'?r2(n):Math.round((+n||0)*100)/100;
const fm=n=>(n<-0.004?'-':'')+'$'+Math.abs(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const ff=n=>typeof f==='function'?f(n):fm(n);
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};
const pt=s=>String(s??'').replace(/[−–—]/g,'-').replace(/[•·]/g,m=>m==='•'?'-':'·').replace(/[^\x00-\xff]/g,'').replace(/\s+/g,' ').trim();
const billName=b=>typeof billLbl==='function'?billLbl(b):(typeof DN==='function'?DN(b.name):b.name);
function isFoodBill(b){return !!(b&&(+b.tfood||/^(food|comida)\b/i.test(String(b.name||''))))}

function pctOf(b,who,share,total){
  const al=b.sheet&&b.sheet.alloc;
  if(al&&al.mode==='pct'&&al.pct&&al.pct[who]!=null)return rr(+al.pct[who]||0);
  return total>0.004?rr((+share||0)/total*100):0;
}
function pctLbl(p){
  if(!(Math.abs(+p)>0.004))return '';
  const r=Math.round(+p);
  return (Math.abs(+p-r)<0.05?String(r):(+p).toFixed(1).replace(/\.0$/,''))+'%';
}
function cell(p,a){
  if(!(Math.abs(+a)>0.004)&&!(Math.abs(+p)>0.004))return '-';
  const g=pctLbl(p);
  return (g?g+'  ':'')+fm(a);
}

function buildTonySplit(k){
  k=k||(typeof S!=='undefined'?S.cur:'');
  const m=typeof S!=='undefined'&&S.months&&S.months[k];
  if(!m)return null;
  const bills=(m.bills||[]).filter(b=>b&&b.sheet&&b.sheet.sp&&!isFoodBill(b));
  if(!bills.length)return null;
  const rows=bills.map(b=>{
    const sp=b.sheet.sp||{},total=rr(+b.sheet.total||0);
    const share={Tony:rr(+sp.Tony||0),Joe:rr(+sp.Joe||0),Carlos:rr(+sp.Carlos||0)};
    const pct={Tony:pctOf(b,'Tony',share.Tony,total),Joe:pctOf(b,'Joe',share.Joe,total),Carlos:pctOf(b,'Carlos',share.Carlos,total)};
    return {id:b.id,n:billName(b),total,sp:share,pct,paid:typeof billSt2==='function'?billSt2(b)==='paid':!!b.paid};
  });
  const sums={total:rr(rows.reduce((s,r)=>s+r.total,0)),Tony:0,Joe:0,Carlos:0};
  rows.forEach(r=>{sums.Tony=rr(sums.Tony+r.sp.Tony);sums.Joe=rr(sums.Joe+r.sp.Joe);sums.Carlos=rr(sums.Carlos+r.sp.Carlos)});
  const c=typeof calc==='function'?calc(m):{};
  const adjs=(m.events||[]).filter(e=>e&&e.type==='tonyOver').map(e=>{
    const tb=e.billId&&(m.bills||[]).find(x=>x.id===e.billId);
    return {desc:e.desc||tt('Ajuste: pago de más en cuentas de {0}',typeof lbl==='function'?lbl(k):k),amount:rr(+e.amount||0),bill:tb?billName(tb):'',billId:e.billId||''};
  });
  const excess=typeof billExcess==='function'?billExcess(m):(window._v172&&typeof _v172.billExcess==='function'?_v172.billExcess(m):0);
  return {rows,sums,joeBills:rr(c.bills||sums.Joe),tonyPurch:rr(c.tony||0),toTony:rr(c.toTony||0),xfer:rr(c.xfer||0),due:rr(c.tonyDue||0),adjs,excess:rr(+excess||0)};
}

function drawTonySplit(o,R){
  const Splt=R&&R.tonySplit;if(!Splt||!Splt.rows||!Splt.rows.length)return;
  const d=o.d,X=o.X,en=R.lang==='en';
  o.h(tt('Reparto de las cuentas de la casa'));
  o.note(tt('Cada cuenta con su total y la parte de Tony, Joe y Carlos.'));
  o.y+=4;
  const N=x=>(R.names||{})[x]||x;
  const cols=[tt('Cuenta'),tt('Total'),N('Tony')||'Tony',N('Yo')||'Joe',N('Carlos')||'Carlos'];
  const rows=Splt.rows.map(r=>[r.n,fm(r.total),cell(r.pct.Tony,r.sp.Tony),cell(r.pct.Joe,r.sp.Joe),cell(r.pct.Carlos,r.sp.Carlos)]);
  const tot=[tt('Totales'),fm(Splt.sums.total),fm(Splt.sums.Tony),fm(Splt.sums.Joe),fm(Splt.sums.Carlos)];
  o.table(cols,rows,{ws:[150,72,98,98,98],left:[0],tot});
  o.y+=8;
  o.h(tt('Lo que Joe te transfiere'));
  o.row(tt('Parte de Joe en las cuentas'),fm(Splt.joeBills));
  if(Splt.tonyPurch>0.004)o.row(tt('Menos: parte de Tony en las compras'),'- '+fm(Splt.tonyPurch));
  o.row(tt('Ya transferido'),Splt.xfer>0.004?'- '+fm(Splt.xfer):fm(0));
  (Splt.adjs||[]).forEach(a=>{
    const lab=tt('Incluye {0}',(s=>s.charAt(0).toLowerCase()+s.slice(1))(pt(a.desc))+(a.bill?' '+tt('aplicado a {0}',pt(a.bill)):''));
    o.row(lab,fm(a.amount),{muted:true,ind:14});
  });
  if(Splt.due>0.004)o.row(tt('Pendiente'),fm(Splt.due),{b:true});
  else o.row(tt('Todo al día'),fm(0),{b:true});
  if(Splt.excess>0.004)o.note(tt('Hay un pago de más de {0} todavía no descontado de una cuenta pendiente.',ff(Splt.excess)));
}

function placeTonySplit(o,R){
  if(!(o&&o.d&&R&&R.tonySplit&&R.tonySplit.rows&&R.tonySplit.rows.length))return;
  const d=o.d,at=d.getNumberOfPages();
  o.page();
  const made=d.getNumberOfPages();
  ((window._v173&&_v173.drawTonySplit)||drawTonySplit)(o,R);
  if(typeof d.movePage==='function'&&made>at)d.movePage(made,at);
}

if(typeof r3Data==='function'){
  const prev=r3Data;
  r3Data=function(k,who){
    const R=prev.apply(this,arguments);
    try{
      if(R&&(who==='Tony'||R.who==='Tony')){
        const sp=((window._v173&&_v173.buildTonySplit)||buildTonySplit)(k||R.k);
        if(sp)R.tonySplit=sp;
      }
    }catch(e){console.warn('v173 r3',e)}
    return R;
  };
}
if(typeof rep3PDF==='function'){
  const prev=rep3PDF;
  rep3PDF=function(R,extra){
    try{
      if(R&&R.who==='Tony'){
        if(!R.tonySplit&&typeof S!=='undefined')R.tonySplit=((window._v173&&_v173.buildTonySplit)||buildTonySplit)(R.k);
        if(R.tonySplit&&R.tonySplit.rows&&R.tonySplit.rows.length){
          const rest=extra;
          extra=function(o){placeTonySplit(o,R);if(rest)rest(o)};
        }
      }
    }catch(e){console.warn('v173 pdf',e)}
    return prev(R,extra);
  };
}

window._v173={buildTonySplit,drawTonySplit,placeTonySplit,cell,pctOf};
})();
