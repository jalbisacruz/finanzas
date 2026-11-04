// v125 (Joe): el próximo cheque de Walmart sale en la caja azul, justo debajo del de YoWash, con su botón Ajustar / ＋ Añadir estimado.
// Y cuenta en el "Disponible proyectado" (como el próximo cheque de YoWash). La tarjeta aparte de Walmart sale de Hoy (era solo el próximo cheque);
// el "Siguiente" y los últimos cobrados pasan a la ventana de Ajustar.
Object.assign(EN,{"Próximo cheque Walmart":"Next Walmart check","Incluye Walmart {0}":"Includes Walmart {0}"});
const wmProj=()=>{const d=wmNext();if(!d)return{d:null,a:0};const a=wmAmt(d);return{d,a:a>0?r2(a):0}};
{const _b=chkBox;chkBox=function(){const h=_b(),{d,a}=wmProj();if(!d)return h;
 const btn=a>0?`<button id="wmadj" class="sec" style="min-height:34px;padding:4px 12px;font-size:14px" onclick="wmWeekDlg()">${T('Ajustar')}</button>`
  :`<button id="wmadj" style="min-height:34px;padding:4px 12px;font-size:14px" onclick="wmWeekDlg()">＋ ${T('Añadir estimado')}</button>`;
 return h+`<div class="row" id="wmhero" style="border:0;margin-top:2px"><span class="n" style="color:#cbd5e1">🏪 ${T('Próximo cheque Walmart')}: <b style="color:#fff">${a?'~'+f(a):'—'}</b> · ${wd(d)}</span>${btn}</div>`}}
// Disponible proyectado + próximo cheque Walmart (sin cobrar)
{const _p=planV78;planV78=function(){const h=_p(),{a}=wmProj();if(!(a>0))return h;const m=L(),c=calc(m),pc=pendingCheck();
 const n=r2(sum(m.income,x=>x.amount)-(window.heldPend?heldPend():0)+(pc?+pc.amount||0:0)-c.tonyDue-sum(prevPend(),p=>p.c.tonyDue)-c.credit+a);
 return h.replace(/(<div class="row pl" id="pl-proj"><span class="n">[\s\S]*?)(<\/span><b class=")[^"]*(">)[^<]*(<\/b>)/,(m0,o,mid,q,c2)=>
  o+`<div class="muted" id="pl-wm" style="font-size:12px">${T('Incluye Walmart {0}','~'+f(a))}</div>`+mid+(n>=-0.004?'':'neg')+q+f(n)+c2)}}
// fuera la tarjeta aparte de Walmart en Hoy
{const _i=ini;ini=function(){const h=_i(),j=h.indexOf('<div class="card" id="wmcard"');if(j<0)return h;const k=h.indexOf('<div class="card"',j+10);return h.slice(0,j)+(k<0?'':h.slice(k))}}
{const _d=wmWeekDlg;wmWeekDlg=function(){_d();const nx=wmNext(),s=addD(nx,14),P=Object.entries((S.wm||{}).paid||{}).sort().reverse().slice(0,4),m=dlg().querySelector('.muted');
 if(m)m.insertAdjacentHTML('afterend',`<div class="muted">${T('Siguiente')}: ${wd(s)}${wmAmt(s)?' · ~'+f(wmAmt(s)):''}</div>`+(P.length?`<div class="muted" style="margin-top:6px">${T('Cheques cobrados')}: ${P.map(([d,v])=>fdate(d)+' '+f(+v)).join(' · ')}</div>`:''))}}
