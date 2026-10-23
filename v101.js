// v101 (Joe): suscripciones con monto (cobro habitual) y periodicidad (Semanal, Mensual, Anual, Otra), ambos opcionales.
// Aditivo: S.subs[i].amt / .per; las viejas sin esos campos siguen igual. Editar cambia nombre, monto, periodicidad y cancela/reactiva.
// Cobro automático: al elegir la suscripción se llena el monto (se puede cambiar). Sin fechas de cobro.
Object.assign(EN,{"Monto habitual $ (opcional)":"Usual amount $ (optional)","Periodicidad":"Frequency","Semanal":"Weekly","Mensual":"Monthly","Anual":"Yearly","Otra":"Other","Sin periodicidad":"No frequency"});
const SUB_PER=[['sem','Semanal'],['men','Mensual'],['anu','Anual'],['otr','Otra']];
const subPerL=p=>{const x=SUB_PER.find(([k])=>k===p);return x?T(x[1]):''};
function subExtra(s,edit){s=s||{};return `<input id="ndsa" type="number" inputmode="decimal" step="0.01" style="width:100%;margin-bottom:8px" placeholder="${T('Monto habitual $ (opcional)')}" value="${+s.amt>0?s.amt:''}">
 <select id="ndsp" style="width:100%"><option value="">${T('Periodicidad')} — ${T('Sin periodicidad')}</option>${SUB_PER.map(([k,l])=>`<option value="${k}"${s.per===k?' selected':''}>${T(l)}</option>`).join('')}</select>
 ${edit?`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="ndsubx" style="width:22px;height:22px"${s.active===false?' checked':''}> ${T('Cancelada (se guarda para el historial)')}</label>`:''}`}
function subApply(s){const a=r2(document.getElementById('ndsa').value),p=document.getElementById('ndsp').value;if(a>0)s.amt=a;else delete s.amt;if(p)s.per=p;else delete s.per}
CTL.subs.items=()=>(S.subs||[]).map(s=>({label:DN(s.name),sub:[s.active===false?'⛔ '+T('Cancelada'):'✅ '+T('Activa'),+s.amt>0?f(s.amt):'',subPerL(s.per)].filter(Boolean).join(' · ')}));
CTL.subs.add=function(){nameDlg({title:T('Nuevo'),extra:subExtra({},false),onOk:({n})=>{S.subs=S.subs||[];if(S.subs.some(x=>same(x.name,n)||same(DN(x.name),n))){alert(T('Ya existe'));return false}const s={id:uid(),name:n,active:true};subApply(s);S.subs.push(s)}})};
CTL.subs.edit=function(i){const s=S.subs[i];if(!s)return;nameDlg({title:T('Editar'),name:s.name,extra:subExtra(s,true),
 onOk:({n})=>{if(S.subs.some(x=>x!==s&&(same(x.name,n)||same(DN(x.name),n)))){alert(T('Ya existe'));return false}s.name=n;s.active=!document.getElementById('ndsubx').checked;subApply(s)}})};
{const _d=subDlg;subDlg=function(){const r=_d.apply(this,arguments);const sel=document.getElementById('sbs');if(sel){
 sel.querySelectorAll('option').forEach(o=>{const s=(S.subs||[]).find(x=>x.id===o.value);if(s&&(+s.amt>0||s.per))o.textContent=DN(s.name)+' · '+[+s.amt>0?f(s.amt):'',subPerL(s.per)].filter(Boolean).join(' · ')});
 sel.addEventListener('change',()=>{const s=(S.subs||[]).find(x=>x.id===sel.value);if(s&&+s.amt>0)document.getElementById('sba').value=s.amt})}return r}}
// ---------- v101b (Joe): Préstamos ----------
// Configuración › «🏦 Préstamos»: S.loans=[{id,name,total,cuota,meth,paid0,active}] (aditivo). + › «🏦 Pago de préstamo»: préstamo, cuota (prellenada,
// se puede cambiar), cargado a (prellenado del préstamo), fecha. Débito con bloqueo de negativo; tarjeta sube su saldo. Gasto personal {cat,loan:id}
// en la categoría de deudas/préstamos que ya exista (o «🏦 Préstamos», creada en el primer pago): cuenta en el presupuesto; nunca compartido ni en Tony/Carlos.
// Por préstamo: total, pagado (= ya pagado inicial + pagos), falta, barra, cuotas restantes = ceil(falta/cuota); con falta ≤ 0 → «✅ Pagado» (se queda en el historial).
Object.assign(EN,{"Préstamos":"Loans","Préstamo":"Loan","🏦 Pago de préstamo":"🏦 Loan payment","Pago de préstamo":"Loan payment","Affirm, carro, personal…":"Affirm, car, personal…",
 "Monto total $":"Total amount $","Cuota mensual $":"Monthly payment $","Ya pagado $ (opcional)":"Already paid $ (optional)","El pago sale de":"Payment comes from",
 "Cancelado (se guarda para el historial)":"Cancelled (kept for history)","Cancelado":"Cancelled","✅ Pagado":"✅ Paid off","Pagado":"Paid","Falta":"Left",
 "{0} cuotas restantes":"{0} payments left","1 cuota restante":"1 payment left","Elige el préstamo":"Pick the loan","Cuota $":"Payment $","Pago guardado":"Payment saved",
 "Pon el monto total y la cuota":"Enter the total amount and the payment","{0} tiene pagos guardados. Márcalo como cancelado en vez de eliminarlo.":"{0} has saved payments. Mark it cancelled instead of deleting it.",
 "Total, pagado, falta y cuotas restantes. Sin fechas de pago.":"Total, paid, left and payments left. No due dates.","Sin préstamos.":"No loans.","Pagos de préstamos":"Loan payments"});
const LOAN_RE=/pr[eé]stamo|deuda|loan|debt/i;
const loanCat=()=>(S.cats||[]).find(c=>LOAN_RE.test(c)||LOAN_RE.test(DN(c)));
function loanCatEnsure(){let c=loanCat();if(!c){c='🏦 Préstamos';const i=S.cats.indexOf('🤝 Tony');S.cats.splice(i<0?S.cats.length:i,0,c)}return c}
function loanPays(){const o=[];keys().forEach(k=>(S.months[k].personal||[]).filter(x=>x.loan).forEach(x=>o.push({k,...x})));return o.sort((a,b)=>String(dKey(b.date)||'').localeCompare(String(dKey(a.date)||'')))}
function loanSt(l,P){P=P||loanPays();const ps=P.filter(x=>x.loan===l.id),paid=r2((+l.paid0||0)+ps.reduce((a,x)=>a+(+x.amount||0),0)),tot=r2(+l.total||0),left=r2(Math.max(0,tot-paid)),cu=+l.cuota||0;
 return {paid,tot,left,done:tot>0&&left<=0.004,pct:tot>0?Math.min(100,Math.round(paid/tot*100)):0,rest:left>0&&cu>0?Math.ceil(r2(left/cu)-1e-9):0,ps}}
const loanName=id=>{const l=(S.loans||[]).find(x=>x.id===id);return l?DN(l.name):''};
const loanMethOpts=sel=>[['deb',DN(debE(L()).name||'Débito')],...(L().cards||[]).filter(c=>c.name).map(c=>['card:'+c.name,'💳 '+DN(c.name)])].map(([v,t])=>`<option value="${esc(v)}"${v===sel?' selected':''}>${esc(t)}</option>`).join('');
const loanRest=n=>n===1?T('1 cuota restante'):T('{0} cuotas restantes',n);
function loanBar(st){const col=st.done?'#16a34a':'#2563eb';return `<div class="bt bud" style="margin-top:4px"><div style="width:${Math.max(2,st.pct)}%;background:${col}"></div></div>`}
function loanSub(l,P){const st=loanSt(l,P);return `${l.active===false&&!st.done?'⛔ '+T('Cancelado')+' · ':''}${st.done?T('✅ Pagado')+' · ':''}${T('Total')} ${f(st.tot)} · ${T('Pagado')} ${f(st.paid)} · ${T('Falta')} ${f(st.left)}${!st.done&&st.rest?' · '+loanRest(st.rest):''}${+l.cuota>0?' · '+T('Cuota $').replace(' $','')+' '+f(l.cuota):''}</div>${loanBar(st)}<div>`}
// Movimientos: descripción con el nombre actual del préstamo
{const _mv=moves;moves=function(m){const P={};(m.personal||[]).forEach(p=>P[p.id]=p);return _mv(m).map(x=>{const p=x.kind==='gasto'&&P[x.id];return p&&p.loan?{...x,desc:'🏦 '+(loanName(p.loan)||p.desc||'')}:x})}}
function loanExtra(l,edit){l=l||{};const n=(id,ph,v)=>`<input id="${id}" type="number" inputmode="decimal" step="0.01" style="width:100%;margin-bottom:8px" placeholder="${T(ph)}" value="${+v>0?v:''}">`;
 return n('ndlt','Monto total $',l.total)+n('ndlc','Cuota mensual $',l.cuota)+n('ndlp','Ya pagado $ (opcional)',l.paid0)+
 `<label class="muted" for="ndlm">${T('El pago sale de')}</label><select id="ndlm" style="width:100%">${loanMethOpts(l.meth||'deb')}</select>
 ${edit?`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="ndlx" style="width:22px;height:22px"${l.active===false?' checked':''}> ${T('Cancelado (se guarda para el historial)')}</label>`:''}`}
function loanApply(l){const t=r2(document.getElementById('ndlt').value),c=r2(document.getElementById('ndlc').value),p=r2(document.getElementById('ndlp').value);
 if(!(t>0)||!(c>0)){alert(T('Pon el monto total y la cuota'));return false}l.total=t;l.cuota=c;if(p>0)l.paid0=p;else delete l.paid0;l.meth=document.getElementById('ndlm').value||'deb';return true}
CTL.loans={title:()=>'🏦 '+T('Préstamos'),hint:()=>T('Total, pagado, falta y cuotas restantes. Sin fechas de pago.'),
 items:()=>{const P=loanPays();return (S.loans||[]).map(l=>({label:DN(l.name),sub:loanSub(l,P)}))},
 add(){nameDlg({title:T('Nuevo'),extra:loanExtra({},false),onOk:({n})=>{S.loans=S.loans||[];if(S.loans.some(x=>same(x.name,n)||same(DN(x.name),n))){alert(T('Ya existe'));return false}const l={id:uid(),name:n,active:true};if(!loanApply(l))return false;S.loans.push(l)}})},
 edit(i){const l=S.loans[i];if(!l)return;nameDlg({title:T('Editar'),name:l.name,extra:loanExtra(l,true),onOk:({n})=>{if(S.loans.some(x=>x!==l&&(same(x.name,n)||same(DN(x.name),n)))){alert(T('Ya existe'));return false}
  const c={...l};if(!loanApply(c))return false;Object.keys(l).forEach(k=>delete l[k]);Object.assign(l,c,{name:n,active:!document.getElementById('ndlx').checked})}})},
 del(i){const l=S.loans[i];if(!l)return;if(loanPays().some(x=>x.loan===l.id))return alert(T('{0} tiene pagos guardados. Márcalo como cancelado en vez de eliminarlo.',DN(l.name)));
  if(!confirm(T('¿Eliminar {0}?',DN(l.name))))return;S.loans.splice(i,1);save();dlg().close();render()}};
{const _c=ctlCard;ctlCard=function(id){const h=_c.apply(this,arguments);return id==='stores'?h+_c('loans'):h}}
{const _f=fabMenu;fabMenu=function(){const r=_f.apply(this,arguments);const b=document.getElementById('fabsub')||document.getElementById('fabinc');if(b&&!document.getElementById('fabloan'))b.insertAdjacentHTML('afterend',`<button id="fabloan" class="sec" style="width:100%;text-align:left;min-height:60px;margin-top:8px;padding:10px 14px" onclick="loanDlg()"><b style="font-size:17px">${T('🏦 Pago de préstamo')}</b><div class="muted" style="font-size:13px;margin-top:2px">${T('Affirm, carro, personal…')}</div></button>`);return r}}
{const fb=document.getElementById('fab');if(fb)fb.onclick=fabMenu}
function loanDlg(){const P=loanPays(),act=(S.loans||[]).filter(l=>l.active!==false&&!loanSt(l,P).done);
 dlg().innerHTML=`<h2>${T('Pago de préstamo')}</h2>
 <p><select id="lns" class="name" style="width:100%" onchange="loanPick()"><option value="">${T('Elige el préstamo')}</option>${act.map(l=>{const st=loanSt(l,P);return `<option value="${esc(l.id)}">${esc(DN(l.name))} · ${T('Falta')} ${f(st.left)}</option>`}).join('')}</select></p>
 <div class="muted" id="lninfo"></div>
 <input id="lna" class="name" type="number" inputmode="decimal" step="0.01" placeholder="${T('Cuota $')}" style="font-size:24px">
 <p><label class="muted" for="lnm">${T('Cargado a')}</label><select id="lnm" class="name" style="width:100%">${loanMethOpts('deb')}</select></p>
 <p><input id="lnf" class="name" type="date" value="${today()}"></p>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="lnsave" onclick="saveLoanPay()">${T('Guardar')}</button></div>`;if(!dlg().open)dlg().showModal()}
function loanPick(){const l=(S.loans||[]).find(x=>x.id===document.getElementById('lns').value),i=document.getElementById('lninfo');if(!l){i.innerHTML='';return}
 const st=loanSt(l);document.getElementById('lna').value=r2(Math.min(+l.cuota||0,st.left)||'')||'';const m=document.getElementById('lnm');if([...m.options].some(o=>o.value===l.meth))m.value=l.meth;
 i.innerHTML=`${T('Total')} ${f(st.tot)} · ${T('Pagado')} ${f(st.paid)} · ${T('Falta')} ${f(st.left)}${st.rest?' · '+loanRest(st.rest):''}${loanBar(st)}<div style="height:8px"></div>`}
function saveLoanPay(){const id=document.getElementById('lns').value;if(!id)return alert(T('Elige el préstamo'));const a=r2(document.getElementById('lna').value);if(!a||a<=0)return alert(T('Pon un monto'));
 const method=document.getElementById('lnm').value,date=document.getElementById('lnf').value||today();if(method==='deb'&&noDeb(a,'No se puede: el débito quedaría negativo. Disponible: {0}'))return;
 const cat=loanCatEnsure();spend(method,a);S.months[monthFor(date)].personal.unshift({id:uid(),date,amount:a,cat,desc:loanName(id),method,loan:id});save();dlg().close();render();toast(T('Pago guardado'))}
function loanRepCard(k){const L0=S.loans||[];if(!L0.length)return'';const P=loanPays(),tm=r2(P.filter(x=>x.k===k).reduce((a,x)=>a+(+x.amount||0),0));
 return `<div class="card defcol" id="loancard"><h2>🏦 ${T('Préstamos')}<span>${f(tm)}</span></h2><div class="muted">${lbl(k)} · ${T('Pagos de préstamos')}</div>
 ${L0.map(l=>`<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><span class="n">${esc(DN(l.name))}</span><b>${loanSt(l,P).pct}%</b></div><div class="muted">${loanSub(l,P)}</div></div>`).join('')}
 ${P.length?`<h3 style="margin:12px 0 4px;font-size:15px">🧾 ${T('Historial')}</h3>`+P.map(x=>`<div class="muted" style="display:flex;justify-content:space-between;padding:3px 0"><span>${fdate(x.date)} · ${esc(loanName(x.loan))} · ${methName(x.method)}</span><span>${f(x.amount)}</span></div>`).join(''):''}</div>`}
{const _r=rep;rep=function(){const h=_r(),c=loanRepCard(S.cur);if(!c)return h;const i=h.indexOf('<div class="card defcol" id="acccard"');return i<0?h+c:h.slice(0,i)+c+h.slice(i)}}
{const _p=pdfMine;pdfMine=function(D2,k){const r=_p.apply(this,arguments);const L0=S.loans||[];if(!L0.length)return r;const P=loanPays();
 D2.h(T('Préstamos'));D2.table([T('Préstamo'),T('Total'),T('Pagado'),T('Falta'),T('Cuotas')],L0.map(l=>{const st=loanSt(l,P);return [DN(l.name)+(st.done?' ('+T('Pagado')+')':l.active===false?' ('+T('Cancelado')+')':''),f(st.tot),f(st.paid)+' ('+st.pct+'%)',f(st.left),st.done?T('Pagado'):String(st.rest||'—')]}),{ws:[156,90,110,90,70]});
 if(P.length){D2.h(T('Préstamos')+' · '+T('Historial'));D2.table([T('Fecha'),T('Préstamo'),T('Cargado a'),T('Monto')],P.map(x=>[x.date?fdate(x.date):'',loanName(x.loan),methName(x.method).replace(/^💳 /,'').replace(/&amp;/g,'&'),f(x.amount)]),{ws:[90,170,166,90]})}return r}}
