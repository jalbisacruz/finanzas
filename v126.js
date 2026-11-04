// v126 (Joe): solo diseño. Las dos líneas de cheques en la caja azul, simples y claras:
//   💼 YoWash   $531.60        [Ajustar]     🏪 Walmart  ~$226.51      [Ajustar]
//      jue 5/11 · cada jueves                   jue 5/11 · jueves alternos
// No cambia montos, fechas, proyectado ni lógica.
Object.assign(EN,{"YoWash":"YoWash","Walmart":"Walmart","cada jueves":"every Thursday","jueves alternos":"every other Thursday"});
const v126Row=(ic,name,amt,sub)=>`<span class="n" style="color:#cbd5e1;min-width:0;line-height:1.25"><span style="white-space:nowrap">${ic} ${T(name)} <b style="color:#fff;margin-left:4px">${amt}</b></span><div style="font-size:12px;color:#94a3b8;margin-top:2px;white-space:nowrap">${sub}</div></span>`;
{const _b=chkBox;chkBox=function(){const h=_b();if(chkEdit)return h;const t=document.createElement('template');t.innerHTML=h;
 const pc=pendingCheck(),y=t.content.querySelector('#chkadj'),w=t.content.querySelector('#wmhero');
 if(y&&pc){const r=y.parentElement,n=r.querySelector('.n');
  const amt=pc.amtPending?`${T('Pendiente')} <span style="color:#94a3b8;font-weight:400">~${f(chkEst())}</span>`:f(pc.amount);
  if(n)n.outerHTML=v126Row('💼','YoWash',amt,`${wd(pc.date)} · ${T('cada jueves')}`);r.style.alignItems='center';r.style.gap='8px'}
 if(w){const {d,a}=wmProj(),n=w.querySelector('.n');if(n)n.outerHTML=v126Row('🏪','Walmart',a?'~'+f(a):'—',`${wd(d)} · ${T('jueves alternos')}`);w.style.alignItems='center';w.style.gap='8px';w.style.marginTop='8px'}
 return t.innerHTML}}
