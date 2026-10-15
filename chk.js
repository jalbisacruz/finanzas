// v60: monto del cheque "pendiente". Campo nuevo opcional check.amtPending=true (amount=0 hasta que llegue el email).
Object.assign(EN,{"Monto pendiente":"Amount pending","Pendiente":"Pending","estimado":"estimated","Pon el monto del cheque cuando llegue el email":"Enter the check amount when the email arrives",
 "Poner monto":"Enter amount","Monto del cheque":"Check amount","Cheque del {0}":"Check of {0}","Llegó el cheque del {0}: ¿cuánto fue?":"The {0} check arrived: how much was it?","Depositar":"Deposit",
 "Monto guardado":"Amount saved","Se depositará automáticamente el {0}.":"It will be deposited automatically on {0}.","Se depositará al débito ahora.":"It will be deposited to debit now.","Cheque de {0} depositado":"Check of {0} deposited",
 "Usa el último cheque ({0}) como estimado.":"Uses the last check ({0}) as the estimate."});
const chkEst=()=>{const d=S.checks.filter(c=>c.status==='deposited'&&+c.amount>0&&!c.amtPending).sort((a,b)=>(a.date||'')<(b.date||'')?-1:1).at(-1);return d?r2(d.amount):0};
const pcAmtPend=()=>{const pc=pendingCheck();return pc&&pc.amtPending?pc:null};
// proyecciones: mientras el monto está pendiente se usa el último cheque como estimado (solo en memoria, sin guardar)
function withEst(fn){const L2=S.checks.filter(c=>c.status==='pending'&&c.amtPending),e=chkEst();if(!L2.length)return fn();
 L2.forEach(c=>c.amount=e);try{return fn()}finally{L2.forEach(c=>c.amount=0)}}
const estTag=()=>`<span class="muted estt" style="color:#94a3b8;font-style:italic"> (${T('estimado')})</span>`;
const _planV60=planV2;planV2=function(){const pe=pcAmtPend(),h=withEst(_planV60);if(!pe)return h;const e=f(chkEst());
 return h.replace(`${T('+ Próximo cheque')} ${e}`,`${T('+ Próximo cheque')} <span style="color:#94a3b8">${e}</span>${estTag()}`).replace(`id="plancard"`,`id="plancard" data-est="1"`)};
const _thuV60=thuCard;thuCard=function(){const pe=pcAmtPend(),h=withEst(_thuV60);if(!pe)return h;
 return h.replace(/(💼 [^<]*<\/span>)(\$[\d,.]+)/,(m0,a,b)=>`${a}<span style="color:#94a3b8">${b}${estTag()}</span>`)};
// Hoy: tarjeta del cheque
const _chkBoxV60=chkBox;chkBox=function(){const pc=pendingCheck();
 if(pc&&pc.amtPending&&!chkEdit)return `<div class="row" style="border:0;margin-top:6px"><span class="n" style="color:#cbd5e1">${T('Próximo cheque')}: <b style="color:#fff">${T('Pendiente')}</b> <span style="color:#94a3b8">~${f(chkEst())} ${T('estimado')}</span> · ${wd(pc.date)}</span><button id="chkadj" class="sec" style="min-height:34px;padding:4px 12px;font-size:14px" onclick="chkEdit=true;render()">${T('Ajustar')}</button></div>`;
 let h=_chkBoxV60();if(!/id="chkbtn"/.test(h))return h;
 h=h.replace(/(<input id="chk" [^>]*?)value="[^"]*"/,(m0,a)=>a+(pc&&pc.amtPending?'value="" disabled':`value="${pc?pc.amount:''}"`));
 return h.replace(/(<input id="chkd"[^>]*>)<\/div>/,`$1</div><label style="display:flex;gap:8px;align-items:center;margin-top:8px;color:#cbd5e1;font-size:14px"><input type="checkbox" id="chkp" style="width:auto;min-height:0" ${pc&&pc.amtPending?'checked':''} onchange="const i=document.getElementById('chk');i.disabled=this.checked;if(this.checked)i.value=''"> ${T('Monto pendiente')}</label>`)};
const _setCheckV60=setCheck;setCheck=function(){const p=document.getElementById('chkp');
 if(p&&p.checked){const d=document.getElementById('chkd').value,pc=pendingCheck();if(pc){pc.amount=0;pc.amtPending=true;pc.date=d}else S.checks.push({id:uid(),amount:0,amtPending:true,date:d,status:'pending'});
  chkEdit=false;save();render();toast(T('Próximo cheque guardado'));return}
 const pc0=pendingCheck();_setCheckV60();const pc=pendingCheck();if(pc&&pc===pc0&&pc.amtPending&&+pc.amount>0){delete pc.amtPending;save();render()}};
// aviso discreto + diálogo rápido
const chkDue=c=>c&&c.date&&new Date(c.date+'T05:00:00')<=new Date();
function chkAmtNote(){const pc=pcAmtPend();if(!pc)return'';const due=chkDue(pc);
 return `<div class="card" id="chkamtnote"${due?' data-due="1"':''} style="padding:10px 12px;${due?'border:2px solid #f59e0b':'background:#f8fafc;border:1px dashed #cbd5e1'}"><div style="display:flex;gap:8px;align-items:center"><span style="flex:1;font-size:14px">${due?'💵 '+T('Llegó el cheque del {0}: ¿cuánto fue?',wd(pc.date)):'⏳ '+T('Pon el monto del cheque cuando llegue el email')}</span><button id="chkamtbtn" class="${due?'':'sec'}" style="min-height:34px;padding:2px 12px;font-size:14px" onclick="chkAmtDlg()">${T('Poner monto')}</button></div></div>`}
function chkAmtDlg(){const pc=pcAmtPend();if(!pc)return;const due=chkDue(pc);
 dlg().innerHTML=`<h2>💼 ${T('Cheque del {0}',wd(pc.date))}</h2><label>${T('Monto del cheque')}<input id="cka2" type="number" inputmode="decimal" step="0.01" placeholder="~${r2(chkEst())}" style="font-size:24px"></label>
 <div class="muted" style="margin-top:6px">${due?T('Se depositará al débito ahora.'):T('Se depositará automáticamente el {0}.',wd(pc.date))}</div>
 <div class="grid" style="margin-top:10px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="cka2ok" onclick="chkAmtSave()">${due?T('Depositar'):T('Guardar')}</button></div>`;dlg().showModal();setTimeout(()=>document.getElementById('cka2')?.focus(),50)}
function chkAmtSave(){const pc=pcAmtPend(),a=r2(document.getElementById('cka2').value);if(!pc)return dlg().close();if(!(a>0))return alert(T('Pon el monto del cheque'));
 pc.amount=a;delete pc.amtPending;
 if(chkDue(pc)){const m=L();pc.status='deposited';pc.depositedOn=today();pc.ok=true;debE(m).amount=r2((+debE(m).amount||0)+a);
  S.months[monthFor(pc.date)].events.push({id:uid(),type:'check',date:pc.date,amount:a,desc:'Cheque '+fdate(pc.date),checkId:pc.id});save();dlg().close();render();toast(T('Cheque de {0} depositado',f(a)));return}
 save();dlg().close();render();toast(T('Monto guardado'))}
const _iniV60=ini;ini=function(){const h=_iniV60(),n=chkAmtNote();if(!n)return h;const i=h.indexOf('<div class="card hero"');return i<0?n+h:h.slice(0,i)+n+h.slice(i)};
// depósito automático del jueves: si el monto sigue pendiente, NO deposita un estimado; pide el monto (aviso en Hoy)
autoDeposit=function(){if(!S.checks)return;const now=new Date(),all=S.checks.filter(c=>c.status==='pending'&&c.date&&new Date(c.date+'T05:00:00')<=now).sort((a,b)=>a.date<b.date?-1:1),dueL=all.filter(c=>!c.amtPending&&+c.amount>0);
 if(!dueL.length){if(all.length&&unlocked&&tab==='ini'&&!dlg().open&&!document.querySelector('#chkamtnote[data-due]'))render();return}
 let tot=0;const m=L();
 dueL.forEach(c=>{c.status='deposited';c.auto=true;c.depositedOn=today();debE(m).amount=r2((+debE(m).amount||0)+c.amount);tot+=c.amount;
  S.months[monthFor(c.date)].events.push({id:uid(),type:'check',date:c.date,amount:c.amount,desc:'Cheque '+fdate(c.date)+' (automático)',checkId:c.id,auto:true})});
 autoNote={total:r2(tot),n:dueL.length};save();if(unlocked)render();toast(T('Cheque de {0} depositado automáticamente',f(tot)))};
