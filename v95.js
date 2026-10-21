// v95 (decisión de Joe): los 3 resúmenes (Mi resumen, Tony, Carlos) muestran TODAS las compras compartidas, quién pagó y la parte de cada uno,
// las cuentas entre cada pareja (Joe-Tony, Joe-Carlos, Tony-Carlos) y el mismo bloque final «Quién transfiere a quién».
// Compartida = 2 o más personas con parte > $0 → aparece en los 3. Compra de una sola persona (licuadora de Joe, CVS solo de Carlos):
// en el de Joe y en el de esa persona (y de quien la pagó); en los demás va sumada en una fila «Compras personales … sin detalle»,
// así los totales del mes de los tres son SIEMPRE completos e iguales en los 3 PDF.
// Joe↔Tony = lógica de siempre (Cuentas de Tony − parte de Tony en lo que pagó Joe − ya transferido). Tony↔Carlos: la app no lleva cuándo se pagan.
Object.assign(EN,{"Cuentas de Tony (sin compras)":"Tony's bills (without purchases)","Parte de Joe en compras que pagaron Tony/Arianna":"Joe's share of purchases paid by Tony/Arianna",
 "Parte de Tony en compras que pagó Joe":"Tony's share of purchases paid by Joe","Parte de Carlos en compras que pagó Joe":"Carlos's share of purchases paid by Joe",
 "Parte de Joe en compras que pagó Carlos":"Joe's share of purchases paid by Carlos","Parte de Carlos en compras que pagaron Tony/Arianna":"Carlos's share of purchases paid by Tony/Arianna",
 "Parte de Tony en compras que pagó Carlos":"Tony's share of purchases paid by Carlos","Ya transferido":"Already transferred","Ya pagado a Joe":"Already paid to Joe","Mis finanzas":"My finances","solo {0}":"only {0}"});
const R3P=['Yo','Tony','Carlos'];
const r3Grp=p=>!p.paidBy?'Yo':TFAM.includes(p.paidBy)?'Tony':p.paidBy==='Carlos'?'Carlos':'Yo';
const r3On=p=>R3P.filter(x=>(+(p.shares||{})[x]||0)>0.004);
// ¿la ve esta persona? Joe ve todo; compartida (2+) la ven los tres; si no, solo quien tiene parte o quien pagó
function r3Vis(p,w){if(!w||w==='Yo')return true;const on=r3On(p);return on.length>=2||on.includes(w)||r3Grp(p)===w}
function r3Data(k,who){who=who||'Yo';const m=S.months[k],c=calc(m),P=byNew(m.purchases,undefined,k),po=paidOther(m);
 const s3=p=>Object.fromEntries(R3P.map(x=>[x,r2(+(p.shares||{})[x]||0)]));const tot={Yo:0,Tony:0,Carlos:0},hid={n:0,t:0,sh:{Yo:0,Tony:0,Carlos:0}},rows=[];let totAll=0;
 P.forEach(p=>{const s=s3(p);R3P.forEach(x=>tot[x]=r2(tot[x]+s[x]));totAll=r2(totAll+(+p.total||0));
  if(r3Vis(p,who)){const L=pList(p).filter(it=>+it.a>0),ex=L.filter(it=>new Set(ownOf(it)).size<3).map(it=>({n:String(it.n||DN(itCat(it,p))).slice(0,40),a:r2(it.a),o:(o=>o.length===1?T('solo {0}',pdfNm(o[0])):ownTxt(o))([...new Set(ownOf(it))])}));
   if(ex.length&&+p.tax>0)ex.push({n:T('Impuesto'),a:r2(p.tax),o:T('Proporcional').toLowerCase()});rows.push({d:dKey(p.date),dl:p.date?fdate(p.date):'',s:DN(p.store),c:DN(pCat(p)),by:p.paidBy||'Yo',t:r2(p.total),sh:s,...(ex.length?{it:ex.slice(0,15)}:{})})}
  else{hid.n++;hid.t=r2(hid.t+(+p.total||0));R3P.forEach(x=>hid.sh[x]=r2(hid.sh[x]+s[x]))}});
 const tf=r2(sum(m.bills,b=>+b.tfood||0)),cT=r2(po.filter(p=>TFAM.includes(p.paidBy)).reduce((s,p)=>s+(+(p.shares||{}).Carlos||0),0)),tC=r2(po.filter(p=>p.paidBy==='Carlos').reduce((s,p)=>s+(+(p.shares||{}).Tony||0),0)),joeCS=r2(c.joeCS||0);
 const pairs=[
  {a:'Yo',b:'Tony',lines:[{l:T('Cuentas de Tony (sin compras)'),v:r2(c.bills-tf)},{l:T('Parte de Joe en compras que pagaron Tony/Arianna'),v:tf},{l:T('Parte de Tony en compras que pagó Joe'),v:-r2(c.tony)}],net:r2(c.toTony),paid:r2(c.xfer||0),paidL:T('Ya transferido'),pend:r2(c.toTony-(c.xfer||0))},
  {a:'Carlos',b:'Yo',lines:[{l:T('Parte de Carlos en compras que pagó Joe'),v:r2(c.carlos)},{l:T('Parte de Joe en compras que pagó Carlos'),v:-joeCS}],net:r2(c.carlos-joeCS),paid:r2(c.recv||0),paidL:T('Ya pagado a Joe'),pend:r2(c.carlos-joeCS-(c.recv||0))},
  {a:'Carlos',b:'Tony',lines:[{l:T('Parte de Carlos en compras que pagaron Tony/Arianna'),v:cT},{l:T('Parte de Tony en compras que pagó Carlos'),v:-tC}],net:r2(cT-tC),paid:null,pend:r2(cT-tC),tc:1}];
 const transfers=[],people={};R3P.forEach(x=>people[x]={pays:0,gets:0,part:tot[x]});
 pairs.forEach(p=>{const v=p.pend;if(Math.abs(v)<0.005)return;const x=v>0?{from:p.a,to:p.b,amount:r2(v)}:{from:p.b,to:p.a,amount:r2(-v)};transfers.push(x);people[x.from].pays=r2(people[x.from].pays+x.amount);people[x.to].gets=r2(people[x.to].gets+x.amount)});
 const bills=who==='Carlos'?[]:m.bills.filter(b=>+b.amount).map(b=>({n:typeof billLbl==='function'?billLbl(b):DN(b.name),a:r2(b.amount),paid:billSt2(b)==='paid'}));
 return {v:1,lang:LANG,k,label:lblL(k),who,from:pdfWho(),gen:new Date().toLocaleDateString(LOC(),{day:'numeric',month:'short',year:'numeric'}).replace('.',''),names:{Yo:'Joe',Tony:DN('Tony'),Carlos:DN('Carlos')},
  transfers,people,pairs,purchases:rows,hid,tot,totAll,bills,billsTotal:r2(c.bills),showBills:who!=='Carlos'}}
// Joe: después del resumen de la casa, sus finanzas (lo que tengo / debo, gasto por categoría, ingresos, tarjetas)
function pdfMine(D2,k){const m=S.months[k],c=calc(m);D2.page();D2.h(T('Mis finanzas')+' · '+T('Lo que tengo'));D2.row(T('Débito, efectivo y cheques'),f(c.inc));D2.row(T('Por cobrar Tony'),f(c.tony));D2.row(T('Por cobrar Carlos'),f(c.carlosDue));D2.row(T('Total a mi favor'),f(c.money),{b:1});
 D2.h(T('Lo que debo'));D2.row(T('Tarjetas de crédito'),f(c.credit));D2.row(T('Cuentas de Tony'),f(c.bills));if(c.xfer)D2.row(T('− Ya transferido a Tony'),f(c.xfer));if(c.joeOwesCarlos>0.004)D2.row(T('Le debes a Carlos (neto)'),f(c.joeOwesCarlos));if(c.held)D2.row(T('Dinero de terceros'),f(c.held));D2.row(T('Total que debo'),f(c.debt),{b:1});
 D2.h(T('Balance'));D2.row(T('Lo que tengo − lo que debo'),f(c.bal),{b:1});
 const sp=spent(m),bb=budBy(m).by,lim=S.budgets||{},cats=[...new Set([...Object.keys(sp.by),...Object.keys(lim).filter(x=>+lim[x]>0)])].sort((a,b)=>(sp.by[b]||0)-(sp.by[a]||0));
 D2.h(T('Gasto por categoría vs presupuesto'));
 if(cats.length)D2.table([T('Categoría'),T('Gastado'),T('Presupuesto'),'%'],cats.map(x=>{const l=+lim[x]||0;return [DN(x),f(sp.by[x]||0),l?f(l):'—',l?Math.round((bb[x]||0)/l*100)+'%':'—']}),{ws:[246,90,90,90],tot:[T('Total'),f(sp.total),'','']});
 else D2.note(T('Sin gastos registrados.'));D2.note(T('compras compartidas cuentan solo tu parte'));
 const er=earned(m);D2.h(T('Ingresos por concepto'));
 if(Object.keys(er.by).length)D2.table([T('Concepto'),T('Monto')],Object.entries(er.by).sort((a,b)=>b[1]-a[1]).map(([x,v])=>[DN(x),f(v)]),{ws:[366,150],tot:[T('Total'),f(er.total)]});else D2.note(T('Sin ingresos registrados.'));
 D2.note(T('sin reembolsos, transferencias entre tus cuentas ni pagos de tarjeta'));
 D2.h(T('Saldos de tarjetas'));if(m.cards.length)D2.table([T('Tarjeta'),T('Saldo')],m.cards.map(x=>[DN(x.name),f(x.amount)]),{ws:[366,150],tot:[T('Total'),f(c.credit)]});else D2.note('—')}
pdfMonth=k=>rep3PDF(r3Data(k,'Yo'),D2=>pdfMine(D2,k));
pdfTony=k=>rep3PDF(r3Data(k,'Tony'));
pdfCarlos=k=>rep3PDF(r3Data(k,'Carlos'));
// enlace de Tony/Carlos: mismas compras que su PDF y el objeto r3 completo (la página dibuja y genera el PDF igual)
{const _snap=snapMonth;snapMonth=function(k,who){const o=_snap(k,who);if(!o)return o;const m=S.months[k];
 o.purchases=byNew(m.purchases,undefined,k).filter(p=>r3Vis(p,who)).map(snapPurch);o.r3=r3Data(k,who);return o}}
