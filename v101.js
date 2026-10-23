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
