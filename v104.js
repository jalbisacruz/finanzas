// v104 (Joe): en el resumen y PDF de Tony y de Carlos salen SOLO las compras donde esa persona está involucrada
// (tiene parte en el reparto, o la pagó él / su familia). Antes: cualquier compra de 2+ personas la veían los tres
// (p. ej. Joe+Carlos salía en la de Tony) y las demás se resumían en «Otras compras personales (n)». Ahora no se ven ni se resumen.
// v104b: en «Cómo se calcula» y «Quién transfiere a quién» solo salen sus parejas (cada pareja se calcula aparte, sin compensar entre parejas).
// Lo que cada uno debe/recibe (pares y transferencias) sale de calc() y no cambia. Los reportes de Joe (who='Yo') siguen igual.
r3Vis=function(p,w){if(!w||w==='Yo')return true;return r3On(p).includes(w)||r3Grp(p)===w};
{const _r=r3Data;r3Data=function(k,who){const o=_r(k,who);who=who||'Yo';if(who==='Yo')return o;
 const tot={Yo:0,Tony:0,Carlos:0};let ta=0;(o.purchases||[]).forEach(x=>{R3P.forEach(y=>tot[y]=r2(tot[y]+(+(x.sh||{})[y]||0)));ta=r2(ta+(+x.t||0))});
 o.tot=tot;o.pairs=(o.pairs||[]).filter(p=>p.a===who||p.b===who);o.transfers=(o.transfers||[]).filter(x=>x.from===who||x.to===who);
 const pe={};R3P.forEach(y=>pe[y]={pays:0,gets:0,part:0});o.transfers.forEach(x=>{pe[x.from].pays=r2(pe[x.from].pays+x.amount);pe[x.to].gets=r2(pe[x.to].gets+x.amount)});o.people=pe;o.totAll=ta;o.hid={n:0,t:0,sh:{Yo:0,Tony:0,Carlos:0}};R3P.forEach(y=>{if(o.people&&o.people[y])o.people[y].part=tot[y]});return o}}
