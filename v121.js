// v121 (Joe): la cuota mensual de cada préstamo activo (Affirm…) cuenta en «Lo que debo» / Mi balance del mes abierto
// hasta que se guarda el pago de ese mes (+ › 🏦 Pago de préstamo). Solo la cuota, no lo que falta del préstamo.
// Aditivo: la sección Préstamos no cambia. Pago parcial → queda pendiente la diferencia.
Object.assign(EN,{"Préstamos (cuota del mes)":"Loans (this month's payment)","Cuota pendiente":"Payment due"});
function loanDue(m,k){k=k||keys().find(x=>S.months[x]===m);if(!k||k!==keys().at(-1))return {tot:0,by:[]};const P=loanPays(),by=[];
 (S.loans||[]).filter(l=>l.active!==false&&+l.cuota>0).forEach(l=>{const st=loanSt(l,P);const pm=r2(P.filter(x=>x.loan===l.id&&x.k===k).reduce((a,x)=>a+(+x.amount||0),0));
  const d=r2(Math.min(+l.cuota,st.left+pm)-pm);if(d>0.004)by.push({id:l.id,name:DN(l.name),amt:d})});return {tot:r2(by.reduce((a,x)=>a+x.amt,0)),by}}
{const _c=calc;calc=function(m){const r=_c(m),D=loanDue(m);if(!(D.tot>0))return r;return {...r,loanDue:D.tot,loanBy:D.by,debt:r2(r.debt+D.tot),bal:r2(r.bal-D.tot)}}}
{const _b=balBox;balBox=function(){const h=_b.apply(this,arguments),c=calc(L());if(!(c.loanDue>0))return h;
 const rows=c.loanBy.map(x=>`<div class="row bsub"><span class="n">🏦 ${esc(x.name)} · ${T('Cuota pendiente')}</span><span>${f(x.amt)}</span></div>`).join('');
 const i=h.indexOf('</div>',h.indexOf(T('Tarjetas de crédito')));return i<0?h:h.slice(0,i+6)+rows+h.slice(i+6)}}
{const _r=res;res=function(){const h=_r.apply(this,arguments),c=calc(M());if(!(c.loanDue>0))return h;const t='<div class="row"><span class="n"><b>'+T('Total que debo');
 const rows=c.loanBy.map(x=>`<div class="row"><span class="n">🏦 ${esc(x.name)} · ${T('Cuota pendiente')}</span>${f(x.amt)}</div>`).join('');return h.replace(t,rows+t)}}
