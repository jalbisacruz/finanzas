// v127 (Joe): cheques del jueves parejos.
// 1) El "¿Llegó el cheque de Walmart?" salía desde las 12:00 AM del jueves, pero YoWash se deposita/pregunta a las 5:00 AM
//    (autoDeposit + chkDue). Ahora Walmart usa la misma hora (5:00 AM) y los dos salen juntos.
// 2) Al confirmar Walmart, la línea pasa al próximo jueves de cobro (correcto) pero no se notaba: ahora dice debajo
//    "✅ Cobrado 5/11 $X" por 3 días, para que se vea que el de hoy ya entró al débito.
Object.assign(EN,{"Cobrado {0}":"Received {0}"});
{const _w=wmConfirmCard;wmConfirmCard=function(){const d=wmNext();return d&&chkDue({date:d})?_w():''}}
{const _b=chkBox;chkBox=function(){const h=_b();if(chkEdit)return h;const P=(S.wm||{}).paid||{},t=today();
 const last=Object.keys(P).sort().filter(d=>d<=t&&d>=addD(t,-3)).at(-1);if(!last)return h;
 const tp=document.createElement('template');tp.innerHTML=h;const w=tp.content.querySelector('#wmhero .n div');
 if(w)w.insertAdjacentHTML('afterend',`<div style="font-size:12px;color:#4ade80;margin-top:1px;white-space:nowrap">✅ ${T('Cobrado {0}',fdate(last))} ${f(+P[last])}</div>`);
 return tp.innerHTML}}
// 3) Joe: al cargar un cheque al débito, el SIGUIENTE de YoWash y de Walmart queda "Pendiente por definir"
//    (sin monto fijo) hasta que él lo ponga con Ajustar. No cuenta en el proyectado mientras esté pendiente.
Object.assign(EN,{"Pendiente por definir":"To be set"});
function v127NextYW(){const dep=S.checks.filter(c=>c.status==='deposited'&&c.date).sort((a,b)=>a.date<b.date?-1:1).at(-1);
 if(!dep||pendingCheck())return;S.checks.push({id:uid(),amount:0,amtPending:true,date:addD(dep.date,7),status:'pending'});save()}
{const _a=autoDeposit;autoDeposit=function(){const n=S.checks.filter(c=>c.status==='deposited').length;_a();if(S.checks.filter(c=>c.status==='deposited').length>n){v127NextYW();if(unlocked)render()}}}
{const _c=confirmCheck;confirmCheck=function(){_c();v127NextYW();if(unlocked)render()}}
{const _s=chkAmtSave;chkAmtSave=function(){_s();v127NextYW();if(unlocked)render()}}
{const _g=wmGotSave;wmGotSave=function(pd){const was=pd in (((S.wm||{}).paid)||{});_g(pd);if(was||!(pd in ((S.wm||{}).paid||{})))return;
 const w=S.wm;w.chk=w.chk||{};const nx=wmNext();if(nx&&!(nx in w.chk)){w.chk[nx]=0;save();render()}}}
{const _b=chkBox;chkBox=function(){const h=_b();if(chkEdit)return h;const t=document.createElement('template');t.innerHTML=h;
 const pp=`<b style="color:#fbbf24;margin-left:4px;font-weight:600">${T('Pendiente por definir')}</b>`;
 const w=t.content.querySelector('#wmhero .n b');if(w&&w.textContent.trim()==='—')w.outerHTML=pp;
 const pc=pendingCheck(),y=t.content.querySelector('#chkadj');
 if(y&&pc&&pc.amtPending){const b=y.parentElement.querySelector('.n b');if(b)b.outerHTML=pp}
 return t.innerHTML}}
