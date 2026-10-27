// v111 (Joe): Cobro parcial por compra. Al marcar una compra en «💵 Cobro» aparece una cajita con lo que manda (por defecto su parte
// pendiente completa). Se puede escribir menos (ej. Carlos manda $150 de $150.87): se guarda items:[{id,a:150}] y los $0.87 siguen
// pendientes de esa compra; vuelve a salir en el Cobro como «Falta» y la transferencia de fin de mes liquida el resto.
Object.assign(EN,{"Pagado":"Paid","Falta {0} de {1}":"{0} left of {1}","El monto no puede ser mayor que lo pendiente ({0})":"Amount can't be more than what's pending ({0})","Escribe un monto mayor que 0":"Enter an amount greater than 0"});
function cobPaid(w){const s={};keys().forEach(k=>cobEv(S.months[k]).filter(e=>e.who===w).forEach(e=>(e.items||[]).forEach(i=>s[i.id]=r2((s[i.id]||0)+(+i.a||0)))));return s}
cobDone=function(w){const P=cobPaid(w),s=new Set();keys().forEach(k=>(S.months[k].purchases||[]).forEach(p=>{const a=r2(+(p.shares||{})[w]||0);if(P[p.id]!=null&&P[p.id]>=a-0.004)s.add(p.id)}));return s};
cobList=function(w){const P=cobPaid(w),last=keys().at(-1),o=[];
 keys().forEach(k=>{const m=S.months[k],c=calc(m),due=w==='Tony'?c.tonyDue:c.carlosDue;if(k!==last&&!(due>0.005))return;
  byNew(m.purchases,undefined,k).forEach(p=>{const sh=r2(+(p.shares||{})[w]||0),a=r2(sh-(P[p.id]||0));if(!p.paidBy&&a>0.004)o.push({k,p,a,sh})})});return o};
{const _d=cobDlg;cobDlg=function(w){_d.apply(this,arguments);if(!w)return;const L2=cobList(w),M={};L2.forEach(x=>M[x.p.id]=x);
 document.querySelectorAll('#cbl .cbx').forEach(b=>{const x=M[b.dataset.id],lab=b.closest('label'),bb=lab&&lab.querySelector(':scope>b');if(!x||!bb)return;
  if(x.a<x.sh-0.004){const mu=lab.querySelector('.n .muted');if(mu)mu.insertAdjacentHTML('beforeend',` · ${T('Falta {0} de {1}',f(x.a),f(x.sh))}`)}
  bb.insertAdjacentHTML('afterend',`<input type="number" class="cba" data-id="${esc(x.p.id)}" inputmode="decimal" step="0.01" min="0.01" max="${x.a}" value="${x.a}" aria-label="${T('Pagado')}" style="display:none;width:96px;font-size:17px;padding:6px;text-align:right" oninput="cobTot()">`);
  b.addEventListener('change',()=>{const i=lab.querySelector('.cba');bb.style.display=b.checked?'none':'';i.style.display=b.checked?'':'none';if(b.checked){i.value=x.a;i.focus();i.select()}cobTot()})})}}
const cobAmt=b=>{const i=document.querySelector(`.cba[data-id="${CSS.escape(b.dataset.id)}"]`);return i?r2(+i.value||0):r2(+b.dataset.a||0)};
cobTot=function(){const t=r2([...document.querySelectorAll('.cbx:checked')].reduce((s,b)=>s+cobAmt(b),0));const e=document.getElementById('cbt');if(e)e.textContent=f(t);return t};
saveCob=function(w){const ck=[...document.querySelectorAll('.cbx:checked')];if(!ck.length)return alert(T('Marca al menos una compra'));
 const M={};cobList(w).forEach(x=>M[x.p.id]=x);const date=document.getElementById('cbf').value||today(),by={};
 for(const b of ck){const x=M[b.dataset.id];if(!x)return alert(T('Marca al menos una compra'));const a=cobAmt(b);
  if(!(a>0.004))return alert(T('Escribe un monto mayor que 0'));if(a>x.a+0.004)return alert(T('El monto no puede ser mayor que lo pendiente ({0})',f(x.a)));
  (by[x.k]=by[x.k]||[]).push({id:x.p.id,a})}
 let tot=0;Object.entries(by).forEach(([k,items])=>{const a=r2(items.reduce((s,i)=>s+i.a,0));tot=r2(tot+a);S.months[k].events=S.months[k].events||[];S.months[k].events.push({id:uid(),type:'cobro',who:w,date,amount:a,items,method:'deb'})});
 spend('deb',-tot);save();dlg().close();render();toast(T('Cobro guardado'))};
