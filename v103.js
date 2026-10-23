// v103 (Joe): «🔄 Cobro automático» sin campo de monto: usa el monto definido en la suscripción (Configuración › Suscripciones).
// Si el precio cambia, se edita allí. Si la suscripción no tiene monto (o es nueva), se pide una sola vez y se guarda en la suscripción.
// Los cobros pasados guardan su propio monto.
Object.assign(EN,{"Monto: {0}":"Amount: {0}","Si cambia, edítalo en Configuración › Suscripciones.":"If it changes, edit it in Settings › Subscriptions.",
 "Monto de la suscripción $ (se guarda en la suscripción)":"Subscription amount $ (saved on the subscription)"});
function sub103(){const sel=document.getElementById('sbs'),a=document.getElementById('sba'),inf=document.getElementById('sbinfo');if(!sel||!a||!inf)return;
 const s=(S.subs||[]).find(x=>x.id===sel.value),has=s&&+s.amt>0;
 if(has){a.value=s.amt;a.hidden=true;inf.hidden=false;inf.innerHTML=`<b style="font-size:20px">${T('Monto: {0}',f(s.amt))}</b><div class="muted">${T('Si cambia, edítalo en Configuración › Suscripciones.')}</div>`}
 else{inf.hidden=!sel.value;inf.innerHTML=`<div class="muted">${T('Monto de la suscripción $ (se guarda en la suscripción)')}</div>`;a.hidden=!sel.value;a.value='';a.placeholder=T('Monto de la suscripción $ (se guarda en la suscripción)');a.style.fontSize='17px'}}
{const _d=subDlg;subDlg=function(){const r=_d.apply(this,arguments);const a=document.getElementById('sba'),sel=document.getElementById('sbs');
 if(a&&sel){a.insertAdjacentHTML('beforebegin','<div id="sbinfo" hidden style="margin:6px 0"></div>');sel.addEventListener('change',sub103);sub103()}return r}}
{const _s=saveSub;saveSub=function(){const sel=document.getElementById('sbs'),a=document.getElementById('sba'),id=sel&&sel.value,nw=(document.getElementById('sbnw')||{}).value||'';
 const s=(S.subs||[]).find(x=>x.id===id);if(s&&+s.amt>0)a.value=s.amt;const ask=!(s&&+s.amt>0),v=r2(a&&a.value),n0=(S.subs||[]).length;
 const r=_s.apply(this,arguments);
 if(ask&&v>0&&!dlg().open){const t=id==='__new'?((S.subs||[]).length>n0?S.subs[S.subs.length-1]:(S.subs||[]).find(x=>same(x.name,nw.trim())||same(DN(x.name),nw.trim()))):s;if(t&&!(+t.amt>0)){t.amt=v;save()}}return r}}
