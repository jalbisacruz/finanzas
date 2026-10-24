// v95: los 3 resúmenes (Joe, Tony, Carlos) con el MISMO diseño y las MISMAS cifras. Archivo puro (sin estado de la app):
// lo usan la app (index.html) y la página del enlace (v.html). Recibe un objeto R ya calculado por la app (r3Data en v95.js).
(function(){
const L3={es:{title:'Cuentas de la casa · {0}',sub:'Resumen de {0} · De {1} · {2}',xfer:'Quién transfiere a quién',x1:'{0} le transfiere a {1}',ok:'Todo al día: nadie le debe a nadie.',
 pays:'Paga',gets:'Recibe',even:'Al día',part:'Su parte de las compras',you:'TÚ',how:'Cómo se calcula',between:'{0} y {1}',owes:'{0} le debe a {1}',paid:'Ya pagado',pend:'Falta',
 tcNote:'Entre Tony y Carlos: la app no lleva cuándo se pagan; esta cifra es lo que se deben este mes.',purch:'Compras del mes',cob:'Cobros',cobW:'Quién pagó',cobP:'Compras saldadas',cobT:'Total cobrado',date:'Fecha',store:'Tienda',by:'Pagó',tot:'Total',
 mtot:'Total del mes',hid:'Otras compras personales ({0})',only:'solo {0}',none:'Sin compras este mes.',bills:'Cuentas de Tony',bill:'Cuenta',amt:'Monto',st:'Estado',
 paidB:'pagada',pendB:'pendiente',billsT:'Total cuentas',pnote:'Cada compra se divide según su parte. Quien la pagó recibe de los demás su parte (ver Cómo se calcula).',zero:'nada',mm:'Mi mes',mbud:'Presupuesto',msp:'Gastado',mpct:'{0}% del presupuesto',minc:'Ingresos recibidos',msav:'Ahorrado',mnote:'Gastado = categorías con presupuesto (de las compras compartidas solo tu parte). Ahorrado = ingresos recibidos - gastado.'},
 en:{title:'Household accounts · {0}',sub:'Summary for {0} · From {1} · {2}',xfer:'Who transfers to whom',x1:'{0} transfers {1}',ok:'All settled: nobody owes anybody.',
 pays:'Pays',gets:'Receives',even:'Settled',part:'Share of purchases',you:'YOU',how:'How it is calculated',between:'{0} and {1}',owes:'{0} owes {1}',paid:'Already paid',pend:'Left',
 tcNote:'Between Tony and Carlos: the app does not track when they pay; this is what they owe each other this month.',purch:'Purchases this month',cob:'Collected payments',cobW:'Paid by',cobP:'Purchases settled',cobT:'Total collected',date:'Date',store:'Store',by:'Paid by',tot:'Total',
 mtot:'Month total',hid:'Other personal purchases ({0})',only:'only {0}',none:'No purchases this month.',bills:"Tony's bills",bill:'Bill',amt:'Amount',st:'Status',
 paidB:'paid',pendB:'pending',billsT:'Bills total',pnote:'Each purchase is split by share. Whoever paid gets the others\' shares back (see How it is calculated).',zero:'nothing',mm:'My month',mbud:'Budget',msp:'Spent',mpct:'{0}% of budget',minc:'Income received',msav:'Saved',mnote:'Spent = budgeted categories (only your share of shared purchases). Saved = income received - spent.'}};
const P3=['Yo','Tony','Carlos'];
const pt=s=>String(s??'').replace(/[−–—]/g,'-').replace(/[•·]/g,m=>m==='•'?'-':'·').replace(/[^\x00-\xff]/g,'').replace(/\s+/g,' ').trim();
const fm=n=>(n<-0.004?'-':'')+'$'+Math.abs(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fill=(s,...a)=>s.replace(/\{(\d)\}/g,(_,i)=>a[i]);
// mini documento (mismas funciones que Doc de share.js: h, row, note, table) para que el resumen de Joe añada sus secciones
function R3Doc(title,sub){const d=new jspdf.jsPDF({unit:'pt',format:'letter'}),W=612,X=48,R=W-48;let y=0;
 const head=()=>{d.setFillColor(30,58,138);d.rect(0,0,W,70,'F');d.setFillColor(37,99,235);d.rect(0,64,W,6,'F');d.setTextColor(255);d.setFont('helvetica','bold');d.setFontSize(20);d.text(pt(title),X,32);d.setFont('helvetica','normal');d.setFontSize(10);d.setTextColor(203,213,225);d.text(pt(sub),X,51);d.setTextColor(15,23,42);y=96};head();
 const o={d,X,R,get y(){return y},set y(v){y=v},
  need(h){if(y+h>742){d.addPage();y=52;return true}return false},
  page(){d.addPage();y=52},
  h(t){o.need(40);y+=8;d.setFont('helvetica','bold');d.setFontSize(13);d.setTextColor(37,99,235);d.text(pt(t),X,y);d.setDrawColor(203,213,225);d.setLineWidth(0.8);d.line(X,y+5,R,y+5);d.setTextColor(15,23,42);y+=20},
  row(l,v,{b,muted,ind}={}){o.need(16);d.setFont('helvetica',b?'bold':'normal');d.setFontSize(10.5);d.setTextColor(...(muted?[100,116,139]:[15,23,42]));
   const ls=d.splitTextToSize(pt(l),R-X-110-(ind||0));d.text(ls,X+(ind||0),y);if(v!==undefined)d.text(pt(v),R,y,{align:'right'});y+=14*ls.length;d.setTextColor(15,23,42)},
  sep(){y+=4},
  note(t){o.need(14);d.setFont('helvetica','italic');d.setFontSize(9);d.setTextColor(100,116,139);const ls=d.splitTextToSize(pt(t),R-X);d.text(ls,X,y);y+=12*ls.length;d.setTextColor(15,23,42)},
  table(cols,rows,{ws,tot,left,hi,sub}={}){const n=cols.length,w=ws||cols.map(()=>(R-X)/n),xs=[];let a=X;w.forEach(v=>{xs.push(a);a+=v});
   const line=(cells,bold,bg)=>{if(o.need(18)&&cols)hdr();if(bg){d.setFillColor(...bg);d.rect(X,y-11,R-X,16,'F')}if(hi!=null){d.setFillColor(...(bold?[147,197,253]:[219,234,254]));d.rect(xs[hi],y-11,w[hi],16,'F')}d.setFontSize(9.5);
    cells.forEach((c,i)=>{d.setFont('helvetica',bold||i===hi?'bold':'normal');const s=d.splitTextToSize(pt(c),w[i]-6)[0]||'';if(i===0||(left||[]).includes(i))d.text(s,xs[i]+3,y);else d.text(s,xs[i]+w[i]-3,y,{align:'right'})});y+=16};
   const hdr=()=>line(cols,true,[241,245,249]);hdr();
   rows.forEach((r,j)=>{const sl=sub&&sub[j];if(sl&&sl.length&&o.need(18+12*sl.length))hdr();line(r,false,j%2?[248,250,252]:null);if(sl&&sl.length)sl.forEach(s=>{o.need(13);d.setFont('helvetica','italic');d.setFontSize(8.5);d.setTextColor(71,85,105);d.text(pt(s),xs[1]+3,y-2);d.setTextColor(15,23,42);y+=12})});
   if(tot)(Array.isArray(tot[0])?tot:[tot]).forEach(t=>line(t,true,[226,232,240]));y+=4},
  out(){const p=d.getNumberOfPages();for(let i=1;i<=p;i++){d.setPage(i);d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(148,163,184);d.text(i+'/'+p,R,770,{align:'right'})}return d}};
 return o}
// R = {lang,k,label,who,from,gen,names,transfers:[{from,to,amount}],people:{Yo:{pays,gets,part}},pairs:[{a,b,lines:[{l,v}],net,paid,paidL,pend,tc}],purchases:[...],hid,tot,bills,billsTotal,showBills}
function rep3PDF(R,extra){const t=L3[R.lang==='en'?'en':'es'],N=x=>(R.names||{})[x]||x,o=R3Doc(fill(t.title,R.label),fill(t.sub,N(R.who),R.from,R.gen)),d=o.d,X=o.X,RR=o.R,W=RR-X;
 // v97: «Mi mes» (solo el resumen de Joe: R.mimes = {bud,sp,pct,rec,sav})
 if(R.mimes){const M=R.mimes,y0=o.y,bh=74,cw=(W+12)/4;d.setFillColor(248,250,252);d.setDrawColor(203,213,225);d.setLineWidth(0.8);d.roundedRect(X-6,y0-14,W+12,bh,8,8,'FD');
  d.setFont('helvetica','bold');d.setFontSize(10);d.setTextColor(30,58,138);d.text(pt(t.mm).toUpperCase(),X+6,y0+2);
  [[t.mbud,M.bud,[15,23,42]],[t.msp,M.sp,M.sp>M.bud+0.004?[185,28,28]:[15,23,42],fill(t.mpct,M.pct==null?'-':M.pct)],[t.minc,M.rec,[15,23,42]],[t.msav,M.sav,M.sav>=-0.004?[21,128,61]:[185,28,28]]].forEach(([l,v,col,sub],i)=>{const cx=X-6+i*cw+10;
   d.setFont('helvetica','normal');d.setFontSize(9);d.setTextColor(100,116,139);d.text(pt(l),cx,y0+20);d.setFont('helvetica','bold');d.setFontSize(15);d.setTextColor(...col);d.text(fm(v),cx,y0+38);
   if(sub){d.setFont('helvetica','normal');d.setFontSize(8.5);d.setTextColor(100,116,139);d.text(pt(sub),cx,y0+52)}});
  d.setTextColor(15,23,42);o.y=y0-14+bh+8;o.note(t.mnote);o.y+=16}
 // 1) Quién transfiere a quién (bloque verde, igual en los 3)
 const TR=R.transfers||[];let y=o.y;const bh=TR.length?40+TR.length*24:58;
 d.setFillColor(240,253,244);d.setDrawColor(134,239,172);d.setLineWidth(1);d.roundedRect(X-6,y-14,W+12,bh,8,8,'FD');
 d.setFont('helvetica','bold');d.setFontSize(10);d.setTextColor(21,128,61);d.text(pt(t.xfer).toUpperCase(),X+6,y+2);y+=26;
 if(!TR.length){d.setFontSize(14);d.setTextColor(15,23,42);d.text(pt(t.ok),X+6,y)}
 TR.forEach(x=>{const me=x.from===R.who||x.to===R.who;d.setFont('helvetica',me?'bold':'normal');d.setFontSize(15);d.setTextColor(15,23,42);d.text(pt(fill(t.x1,N(x.from),N(x.to))),X+6,y);d.setFont('helvetica','bold');d.setFontSize(16);d.text(fm(x.amount),RR-6,y,{align:'right'});y+=24});
 o.y=o.y-14+bh+22;
 // 2) tarjeta por persona: paga / recibe (cifras grandes) y su parte de las compras
 y=o.y;const cw=(W+12-2*10)/3,ch=92;
 P3.forEach((p,i)=>{const P=(R.people||{})[p]||{},cx=X-6+i*(cw+10),me=p===R.who;
  d.setFillColor(...(me?[239,246,255]:[248,250,252]));d.setDrawColor(...(me?[37,99,235]:[203,213,225]));d.setLineWidth(me?1.6:0.7);d.roundedRect(cx,y-14,cw,ch,8,8,'FD');
  d.setFont('helvetica','bold');d.setFontSize(13);d.setTextColor(15,23,42);d.text(pt(N(p)),cx+10,y+3);
  if(me){d.setFontSize(7.5);const tw=d.getTextWidth(t.you)+10,tx=cx+cw-10-tw;d.setFillColor(37,99,235);d.roundedRect(tx,y-6,tw,12,6,6,'F');d.setTextColor(255);d.text(t.you,tx+5,y+2.5)}
  let yy=y+26;const big=(lbl,v,col)=>{d.setFont('helvetica','normal');d.setFontSize(9);d.setTextColor(100,116,139);d.text(pt(lbl),cx+10,yy);d.setFont('helvetica','bold');d.setFontSize(15);d.setTextColor(...col);d.text(fm(v),cx+cw-10,yy+1,{align:'right'});yy+=20};
  if(P.pays>0.004)big(t.pays,P.pays,[185,28,28]);if(P.gets>0.004)big(t.gets,P.gets,[21,128,61]);if(!(P.pays>0.004)&&!(P.gets>0.004))big(t.even,0,[100,116,139]);
  d.setFont('helvetica','normal');d.setFontSize(8.5);d.setTextColor(100,116,139);d.text(pt(t.part)+': '+fm(P.part),cx+10,y+ch-22)});
 o.y=y-14+ch+28;
 // 3) Cómo se calcula: una caja por pareja
 o.h(t.how);
 o.y+=4;(R.pairs||[]).forEach(pr=>{const LS=pr.lines.filter(x=>Math.abs(x.v)>0.004),sp=pr.paid!=null&&Math.abs(pr.paid)>0.004,nL=LS.length+1+(sp?2:0)+(pr.tc?1:0),bh=30+nL*14;o.need(bh+8);let y=o.y;
  d.setFillColor(255,255,255);d.setDrawColor(226,232,240);d.setLineWidth(0.8);d.roundedRect(X-6,y-12,W+12,bh,6,6,'FD');
  const inv=pr.a===R.who||pr.b===R.who;d.setFillColor(...(inv?[37,99,235]:[148,163,184]));d.roundedRect(X-6,y-12,4,bh,2,2,'F');
  d.setFont('helvetica','bold');d.setFontSize(11.5);d.setTextColor(15,23,42);d.text(pt(fill(t.between,N(pr.a),N(pr.b))),X+6,y+2);y+=18;
  const ln=(l,v,b,col)=>{d.setFont('helvetica',b?'bold':'normal');d.setFontSize(10);d.setTextColor(...(col||[51,65,85]));d.text(d.splitTextToSize(pt(l),W-110)[0]||'',X+14,y);d.text(v,RR-6,y,{align:'right'});y+=14};
  LS.forEach(x=>ln(x.l,(x.v<-0.004?'- ':'+ ')+fm(Math.abs(x.v))));
  d.setDrawColor(226,232,240);d.line(X+14,y-9,RR-6,y-9);
  const s=(n)=>n>0.004?fill(t.owes,N(pr.a),N(pr.b)):n<-0.004?fill(t.owes,N(pr.b),N(pr.a)):t.even;
  ln(s(pr.net),fm(Math.abs(pr.net)),true,[15,23,42]);
  if(sp){ln(pr.paidL||t.paid,'- '+fm(pr.paid));ln(t.pend+': '+s(pr.pend),fm(Math.abs(pr.pend)),true,[30,64,175])}
  if(pr.tc){d.setFont('helvetica','italic');d.setFontSize(8.5);d.setTextColor(100,116,139);d.text(pt(t.tcNote),X+14,y);y+=14}
  o.y=o.y-12+bh+14});
 // v105: Cobros (pagos parciales a Joe)
 if(R.cobros&&R.cobros.length){o.h(t.cob);o.table([t.date,t.cobW,t.cobP,t.amt],R.cobros.map(c=>[c.dl,N(c.who),c.s.join(', '),fm(c.a)]),{ws:[70,80,266,100],left:[1,2],tot:['','',t.cobT,fm(R.cobros.reduce((s,c)=>s+c.a,0))]})}
 // 4) Compras del mes: una fila por compra; columnas de los tres SIEMPRE completas
 o.page();o.h(t.purch);const P=R.purchases||[];
 if(!P.length&&!(R.hid&&R.hid.n))o.note(t.none);else{
  const hi=4+P3.indexOf(R.who),rows=P.map(p=>[p.dl,p.s,N(p.by),fm(p.t),...P3.map(x=>(+p.sh[x]||0)>0.004?fm(p.sh[x]):'-')]),sub=P.map(()=>[]);  // v96: sin detalle de artículos (va en «Detalle de compras»)
  if(R.hid&&R.hid.n){rows.push(['',fill(t.hid,R.hid.n),'',fm(R.hid.t),...P3.map(x=>R.hid.sh[x]>0.004?fm(R.hid.sh[x]):'-')]);sub.push([])}
  o.table([t.date,t.store,t.by,t.tot,...P3.map(N)],rows,{ws:[56,178,58,56,56,56,56],left:[1,2],hi:R.who&&hi>=4?hi:undefined,sub,tot:['',t.mtot,'',fm(R.totAll),...P3.map(x=>fm(R.tot[x]))]});
  o.note(t.pnote)}
 // 5) Cuentas de Tony
 if(R.showBills&&R.bills&&R.bills.length){o.h(t.bills);o.table([t.bill,t.amt,t.st],R.bills.map(b=>[b.n,fm(b.a),b.paid?t.paidB:t.pendB]),{ws:[316,100,100],tot:[t.billsT,fm(R.billsTotal),'']})}
 if(extra)extra(o);
 return o.out()}
// v96: «Detalle de compras»: un solo PDF con cada compra del mes (más nueva primero), quién pagó, sus artículos con la parte de cada uno,
// resto de la compra, impuesto y total por persona; al final el total del mes (= los resúmenes). Recibe R=r3Data (usa R.det).
const LD={es:{title:'Detalle de compras · {0}',sub:'Para {0} · De {1} · {2}',paid:'Pagó {0}',art:'Artículo',pr:'Precio',ptot:'Total de la compra',rest:'Resto de la compra',all:'Toda la compra',tax:'Impuesto',
 mtot:'Total del mes',n:'{0} compras',none:'Sin compras este mes.',hidN:'Solo se suman: no son de {0}.'},
 en:{title:'Purchase detail · {0}',sub:'For {0} · From {1} · {2}',paid:'Paid by {0}',art:'Item',pr:'Price',ptot:'Purchase total',rest:'Rest of the purchase',all:'Whole purchase',tax:'Tax',
 mtot:'Month total',n:'{0} purchases',none:'No purchases this month.',hidN:'Only added up: they are not {0}\'s.'}};
function rep3Det(R){const t=L3[R.lang==='en'?'en':'es'],u=LD[R.lang==='en'?'en':'es'],N=x=>(R.names||{})[x]||x,D=R.det||{rows:[]},o=R3Doc(fill(u.title,R.label),fill(u.sub,N(R.who),R.from,R.gen)),d=o.d,X=o.X,RR=o.R;
 const hi=R.who&&P3.includes(R.who)?2+P3.indexOf(R.who):undefined,ws=[236,70,70,70,70],cols=[u.art,u.pr,...P3.map(N)],sh=s=>P3.map(x=>Math.abs(+s[x]||0)>0.004?fm(s[x]):'-');
 if(!D.rows.length&&!(R.hid&&R.hid.n))o.note(u.none);
 D.rows.forEach(p=>{o.need(16*(p.lines.length+2)+40);let y=o.y;
  d.setFillColor(239,246,255);d.setDrawColor(191,219,254);d.setLineWidth(0.8);d.roundedRect(X-6,y-13,RR-X+12,22,5,5,'FD');
  d.setFont('helvetica','bold');d.setFontSize(11);d.setTextColor(15,23,42);d.text(pt((p.dl?p.dl+'  ·  ':'')+p.s),X+2,y+2);
  d.setFont('helvetica','normal');d.setFontSize(9.5);d.setTextColor(71,85,105);const pw=fill(u.paid,N(p.by));d.text(pt(pw),RR-90,y+2,{align:'right'});
  d.setFont('helvetica','bold');d.setFontSize(11);d.setTextColor(15,23,42);d.text(fm(p.t),RR-2,y+2,{align:'right'});o.y=y+24;
  o.table(cols,p.lines.map(l=>[l.k==='rest'?u.rest:l.k==='all'?u.all:l.k==='tax'?u.tax:l.n,fm(l.a),...sh(l.sh)]),{ws,hi,tot:[u.ptot,fm(p.t),...sh(p.sh)]});o.y+=8});
 if(R.hid&&R.hid.n){o.h(fill(t.hid,R.hid.n));o.table([t.tot,...P3.map(N)],[[fm(R.hid.t),...sh(R.hid.sh)]],{ws:[236,93,93,94],hi:hi!=null?hi-1:undefined});o.note(fill(u.hidN,N(R.who)))}
 o.h(u.mtot+' · '+fill(u.n,D.rows.length+((R.hid&&R.hid.n)||0)));
 o.table(['',t.tot,...P3.map(N)],[],{ws:[166,70,70,70,70],hi,tot:[u.mtot,fm(R.totAll),...P3.map(x=>fm(R.tot[x]))]});
 return o.out()}
window.R3Doc=R3Doc;window.rep3PDF=rep3PDF;window.rep3Det=rep3Det;window.R3L=L3;
})();
