// v116 (Joe): Walmart pasa de estimado semanal a estimado del CHEQUE QUINCENAL. Primer cheque jue 5 nov 2026, luego cada 14 días.
// Un estimado general (se puede ajustar cuando quieras) y, opcional, ajuste para un cheque concreto. El día de cobro, en la mañana,
// sale arriba en Hoy "💵 ¿Llegó el cheque de Walmart?" (igual que el depósito de YoWash): confirmas el monto real y entra a débito.
Object.assign(EN,{"Estimado del cheque":"Check estimate","Estimado del cheque quincenal":"Biweekly check estimate","Ajustar estimado":"Adjust estimate",
 "Solo para el cheque del {0}":"Only for the check on {0}","Cada 2 semanas (jueves)":"Every 2 weeks (Thursday)","¿Llegó el cheque de Walmart?":"Did the Walmart check arrive?",
 "Cheque del {0}. Ajusta si llegó otro monto.":"Check of {0}. Adjust if a different amount arrived.","Pon el estimado del cheque":"Enter the check estimate",
 "Sin estimado todavía.":"No estimate yet.","Siguiente":"Following","Cheques cobrados":"Checks received"});
const v116W=()=>{S.wm=S.wm||{};S.wm.paid=S.wm.paid||{};S.wm.chk=S.wm.chk||{};return S.wm};
// monto de un cheque: ajuste de ese cheque > estimado general > (datos viejos v114: suma de semanas)
wmAmt=function(pd){const w=S.wm||{};if(w.chk&&pd in w.chk)return r2(+w.chk[pd]||0);if(+w.est>0)return r2(+w.est);
 const W=w.weeks||{},ks=Object.keys(W).sort();if(!ks.length)return 0;const last=+W[ks.at(-1)]||0;
 return r2([addD(pd,-6),addD(pd,-13)].reduce((a,fr)=>a+(fr in W?+W[fr]||0:fr<ks[0]?0:last),0))};
wmNext=function(){const P=(S.wm||{}).paid||{};let d=(S.wm&&S.wm.anchor)||WM_ANCHOR;while(d in P)d=addD(d,14);return d};
const wmDue=()=>{const d=wmNext();return d<=today()&&wmAmt(d)>0?d:null};
wmCard=function(){const w=S.wm||{},nx=wmNext(),a=wmAmt(nx),P=Object.entries(w.paid||{}).sort().reverse();
 return `<div class="card" id="wmcard"><h2>${T('🏪 Walmart')}<span>${a?'~'+f(a):'—'}</span></h2>
 <div class="row"><span class="n">${T('Próximo cheque Walmart')}<div class="muted">${wd(nx)} · ${T('Cada 2 semanas (jueves)')}</div></span><b>${a?'~'+f(a):'—'}</b></div>
 <div class="row"><span class="n muted">${T('Siguiente')}: ${wd(addD(nx,14))}</span><span class="muted">${wmAmt(addD(nx,14))?'~'+f(wmAmt(addD(nx,14))):''}</span></div>
 ${a?'':`<div class="muted" style="margin-top:6px">${T('Sin estimado todavía.')}</div>`}
 <button id="wmweek" class="sec" style="width:100%;margin-top:8px" onclick="wmWeekDlg()">✏️ ${T('Ajustar estimado')}</button>
 ${P.length?`<div class="muted" style="margin-top:8px">${T('Cheques cobrados')}</div>`+P.slice(0,4).map(([d,v])=>`<div class="row"><span class="n">${fdate(d)}</span>${f(+v)}</div>`).join(''):''}</div>`};
wmWeekDlg=function(){const w=S.wm||{},nx=wmNext();dlg().innerHTML=`<h2>${T('🏪 Walmart')}</h2>
 <label>${T('Estimado del cheque quincenal')}<input id="wma" type="number" inputmode="decimal" step="0.01" value="${wmAmt(nx)||''}" style="font-size:24px"></label>
 <div class="muted">${T('Próximo cheque Walmart')}: ${wd(nx)}</div>
 <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input id="wmone" type="checkbox" style="width:auto"> ${T('Solo para el cheque del {0}',fdate(nx))}</label>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="wmsave" onclick="wmWeekSave()">${T('Guardar')}</button></div>`;
 if(!dlg().open)dlg().showModal();setTimeout(()=>document.getElementById('wma')?.focus(),50)};
wmWeekSave=function(){const a=r2(document.getElementById('wma').value),one=document.getElementById('wmone').checked,nx=wmNext(),w=v116W();
 if(!(a>0))return alert(T('Pon el estimado del cheque'));if(one)w.chk[nx]=a;else{w.est=a;Object.keys(w.chk).forEach(d=>{if(d>=nx)delete w.chk[d]})}
 save();dlg().close();render();toast(T('Walmart guardado'))};
// el cheque esperado del mes = todos los jueves de cobro sin cobrar del mes con el estimado
wmPend=function(fromD,toD){const P=(S.wm||{}).paid||{};return wmPaydays(fromD,toD).filter(d=>d>=WM_ANCHOR&&!(d in P)).map(d=>({date:d,amount:wmAmt(d)})).filter(x=>x.amount>0)};
// confirmación en la mañana del día de cobro, arriba en Hoy (como YoWash)
function wmConfirmCard(){const d=wmDue();if(!d)return'';return `<div class="card" id="wmconf" style="border:2px solid #15803d"><h2>💵 ${T('¿Llegó el cheque de Walmart?')}</h2>
 <div class="muted">${T('Cheque del {0}. Ajusta si llegó otro monto.',fdate(d))}</div>
 <div class="grid" style="margin-top:8px"><input id="wmg" type="number" inputmode="decimal" step="0.01" value="${wmAmt(d)}"><button id="wmgok" onclick="wmGotSave('${d}')">${T('Confirmar')}</button></div></div>`}
{const _i=ini;ini=function(){const h=_i(),c=wmConfirmCard();if(!c)return h;const j=h.indexOf('<div class="card"');return j<0?c+h:h.slice(0,j)+c+h.slice(j)}}
