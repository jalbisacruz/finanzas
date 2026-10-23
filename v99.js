// v99 (Joe): beneficiarios y remesas.
// 1) Personas: además de quienes comparten compras (S.people), se añaden «beneficiarios» (familia/amigos) en la misma tarjeta.
//    Se guardan en S.recipients (la lista de destinatarios que ya existía), así nunca entran en compras ni repartos. La tarjeta
//    «Destinatarios de envíos» se une a Personas (sin duplicar).
// 2) Transferencia: beneficiarios uno a uno con «+ Añadir beneficiario» (persona + monto, ✕ para quitar), indicador Falta/Sobra/✅ Cuadra;
//    no guarda si no cuadra. Se guarda benef:[{n,a}] (aditivo). Las de v98 (recipient de texto libre) se leen como una sola línea.
// v99b: se manda en USD (sale del débito y cuenta en el presupuesto) y se reparte en CUP: tasa (CUP por USD, se recuerda la última en S.xRate),
//    montos por persona en CUP; benef:[{n,cup,a}] con a = USD = cup/tasa (ajustado para sumar el total). Las viejas (sin tasa) se muestran solo en USD.
//    Solo con categoría de remesas (isRem: «💸 Envíos a familia»); con otra categoría todo es en USD, sin tasa (se cambia al elegir la categoría).
//    Reportes y PDF: solo USD por persona (CUP y tasa se guardan, pero no se muestran; decisión de Joe).
// 3) Reportes y MI PDF (no Tony/Carlos): «Enviado por persona» del mes + «Historial de remesas» (más nuevo primero).
Object.assign(EN,{"Tasa de cambio (CUP por USD)":"Exchange rate (CUP per USD)","Total en USD":"Total in USD","Monto CUP":"Amount CUP","Tasa {0}":"Rate {0}","Pon la tasa de cambio":"Enter the exchange rate","Tasa":"Rate","Falta {0} CUP (≈ {1})":"Missing {0} CUP (≈ {1})","Sobra {0} CUP (≈ {1})":"Over by {0} CUP (≈ {1})","Total: {0} CUP":"Total: {0} CUP","Beneficiario":"Beneficiary","beneficiario":"beneficiary","Beneficiarios":"Beneficiaries","+ Añadir beneficiario":"+ Add beneficiary",
 "Es beneficiario (recibe envíos; no entra en compras compartidas)":"Beneficiary (receives transfers; not part of shared purchases)",
 "Comparten compras: Yo, Tony, Carlos y los que añadas sin marcar. Beneficiarios: reciben envíos, no entran en compras.":"Share purchases: Me, Tony, Carlos and those added unchecked. Beneficiaries: receive transfers, not part of purchases.",
 "Elige…":"Pick…","+ Nuevo beneficiario…":"+ New beneficiary…","Nombre del beneficiario":"Beneficiary name","Quitar":"Remove",
 "Añade al menos un beneficiario":"Add at least one beneficiary","Cada beneficiario necesita nombre y monto":"Each beneficiary needs a name and an amount",
 "Los montos no cuadran con el total: {0}":"Amounts don't match the total: {0}","Enviado por persona":"Sent per person","Historial de remesas":"Transfer history",
 "Sin envíos este mes.":"No transfers this month.","Persona":"Person","Fecha":"Date","Categoría":"Category","Monto":"Amount","Sin destinatario":"No recipient"});
// ---------- datos ----------
const xLines=x=>Array.isArray(x.benef)&&x.benef.length?x.benef.map(b=>({n:b.n,a:r2(+b.a||0),...(+x.rate>0&&b.cup!=null?{cup:r2(+b.cup)}:{})})):[{n:x.recipient||'',a:r2(+x.amount||0)}];
const fcup=v=>(+v).toLocaleString('en-US',{maximumFractionDigits:2})+' CUP';
const isXf=x=>!!x.xfer||(isRem(x.cat)&&!!x.recipient)||Array.isArray(x.benef);
function xHist(k){const m=S.months[k];if(!m)return[];return (m.personal||[]).filter(isXf).map(x=>({id:x.id,date:x.date,cat:x.cat,total:r2(+x.amount||0),rate:+x.rate>0?+x.rate:null,desc:x.desc||'',lines:xLines(x)}))
 .sort((a,b)=>String(dKey(b.date)||'').localeCompare(String(dKey(a.date)||''))||0)}
function xByPerson(k){const by={},cu={},cuU={};xHist(k).forEach(h=>h.lines.forEach(l=>{const n=l.n?DN(l.n):T('Sin destinatario');by[n]=r2((by[n]||0)+l.a);if(l.cup!=null){cu[n]=r2((cu[n]||0)+l.cup);cuU[n]=r2((cuU[n]||0)+l.a)}}));return Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([n,v])=>[n,v,cu[n]!=null?cu[n]:null,cuU[n]!=null?cuU[n]:null])}
const xNames=x=>xLines(x).map(l=>l.n?DN(l.n):T('Sin destinatario'));
// descripción en Movimientos: «→ Mamá $100 · Tía $50 · nota»
{const _mv=moves;moves=function(m){const P={};(m.personal||[]).forEach(p=>P[p.id]=p);return _mv(m).map(x=>{const p=x.kind==='gasto'&&P[x.id];if(!p||!Array.isArray(p.benef)||!p.benef.length)return x;
 return {...x,desc:'→ '+p.benef.map(b=>DN(b.n)+(p.benef.length>1||+p.rate>0?' '+(+p.rate>0&&b.cup!=null?fcup(b.cup):f(b.a)):'')).join(' · ')+(p.desc?' · '+p.desc:'')}})}}
// ---------- 1) Personas + beneficiarios ----------
{const P=CTL.people,_it=P.items,_ed=P.edit,_dl=P.del,np=()=>S.people.length;
 P.hint=()=>T('Comparten compras: Yo, Tony, Carlos y los que añadas sin marcar. Beneficiarios: reciben envíos, no entran en compras.');
 P.items=()=>[..._it(),...(S.recipients||[]).map(r=>({label:DN(r),sub:'💸 '+T('Beneficiario')}))];
 P.add=function(){nameDlg({title:T('Nuevo'),extra:`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="ndben" style="width:22px;height:22px"> ${T('Es beneficiario (recibe envíos; no entra en compras compartidas)')}</label>`,
  onOk:({n})=>{const ben=document.getElementById('ndben').checked,all=[...S.people,...(S.recipients||[])];if(all.some(x=>same(x,n)||same(DN(x),n))){alert(T('Ya existe'));return false}
   if(ben){S.recipients=S.recipients||[];S.recipients.push(n)}else S.people.push(n)}})};
 P.edit=i=>i<np()?_ed(i):CTL.recips.edit(i-np());P.del=i=>i<np()?_dl(i):CTL.recips.del(i-np())}
{const _c=ctlCard;ctlCard=function(id){return id==='recips'?'':_c.apply(this,arguments)}}
// ---------- 2) formulario ----------
let XB=[];
function xbOpts(sel){return `<option value="">${T('Elige…')}</option>`+(S.recipients||[]).map(r=>`<option value="${esc(r)}"${r===sel?' selected':''}>${esc(DN(r))}</option>`).join('')+`<option value="__new">${T('+ Nuevo beneficiario…')}</option>`}
function xbRow(b,i){return `<div class="xbrow" data-i="${i}" style="display:grid;grid-template-columns:1fr 110px 40px;gap:6px;align-items:center;margin-top:6px">
 <div><select class="xbn" style="width:100%" onchange="xbSel(${i},this)">${xbOpts(b.n)}</select>${b.nw?`<input class="xbnew name" style="margin-top:4px" placeholder="${T('Nombre del beneficiario')}" value="${esc(b.nn||'')}" oninput="XB[${i}].nn=this.value">`:''}</div>
 <input class="xba" type="number" inputmode="decimal" step="0.01" placeholder="${xCup()?'CUP':'$'}" value="${b.a||''}" oninput="XB[${i}].a=this.value;xbBal()">
 <button class="rm xbx" aria-label="${T('Quitar')}" title="${T('Quitar')}" onclick="XB.splice(${i},1);xbDraw()">✕</button></div>`}
function xbDraw(){const el=document.getElementById('xbl');if(el)el.innerHTML=XB.map(xbRow).join('');xbBal()}
function xbSel(i,s){if(s.value==='__new'){XB[i].nw=1;XB[i].n=''}else{XB[i].nw=0;XB[i].n=s.value}xbDraw()}
function xbAdd(){XB.push({n:'',a:''});xbDraw()}
const xCup=()=>isRem(document.getElementById('xc')?.value||'');
const xRate=()=>xCup()?(+document.getElementById('xrt')?.value||0):1;
function xbMode(){const c=xCup(),w=document.getElementById('xrtw');if(w)w.hidden=!c;document.querySelectorAll('#xbl .xba').forEach(e=>e.placeholder=c?'CUP':'$');xbBal()}
function xbDiff(){const tot=r2(document.getElementById('xa').value),rt=xRate(),s=r2(XB.reduce((a,b)=>a+(+b.a||0),0));return {tot,rt,s,d:r2(tot*rt-s)}}
function xbBalHtml(){const {rt,d,tot,s}=xbDiff();if(!xCup())return splitBalHtml(s,tot);if(!(rt>0))return '';if(Math.abs(d)<=1)return`<span style="color:#15803d;font-weight:700">${T('✅ Cuadra')}</span>`;
 return `<span style="color:${d>0?'#d97706':'#b91c1c'};font-weight:700">${T(d>0?'Falta {0} CUP (≈ {1})':'Sobra {0} CUP (≈ {1})',Math.abs(d).toLocaleString('en-US',{maximumFractionDigits:2}),f(r2(Math.abs(d)/rt)))}</span>`}
function xbBal(){const el=document.getElementById('xbal');if(!el)return;const {tot,rt}=xbDiff(),t=document.getElementById('xcupt');if(t)t.textContent=xCup()&&rt>0&&tot>0?T('Total: {0} CUP',(tot*rt).toLocaleString('en-US',{maximumFractionDigits:2})):'';el.innerHTML=XB.length?xbBalHtml():''}
xferDlg=function(){XB=[];dlg().innerHTML=`<h2>${T('Nueva transferencia')}</h2>
 <input id="xa" class="name" type="number" inputmode="decimal" step="0.01" placeholder="${T('Total en USD')} $" style="font-size:24px" oninput="xbBal()">
 <p><select id="xc" class="name" style="width:100%" onchange="xbMode()">${xCats().map(c=>`<option value="${esc(c)}"${c===xDef()?' selected':''}>${esc(DN(c))}</option>`).join('')}</select></p>
 <div id="xrtw"><div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:6px"><label class="muted" for="xrt">${T('Tasa de cambio (CUP por USD)')}</label><input id="xrt" type="number" inputmode="decimal" step="0.01" style="width:110px" value="${+S.xRate>0?S.xRate:''}" oninput="xbBal()"></div><div class="muted" id="xcupt"></div></div>
 <div id="xbl"></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><button class="sec" id="xbadd" onclick="xbAdd()">${T('+ Añadir beneficiario')}</button><span id="xbal"></span></div>
 <p><input id="xf" class="name" type="date" value="${today()}"></p>
 <p><input id="xn" class="name" placeholder="${T('Nota (opcional)')}"></p>
 <div class="muted">${T('Sale del débito. Disponible: {0}',f(debAvail()))}</div>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="xsave" onclick="saveXfer()">${T('Guardar')}</button></div>`;if(!dlg().open)dlg().showModal();xbAdd();xbMode()};
saveXfer=function(){const a=r2(document.getElementById('xa').value);if(!a||a<=0)return alert(T('Pon un monto'));
 const cup=xCup(),rate=xRate();if(cup&&!(rate>0))return alert(T('Pon la tasa de cambio'));
 const L2=XB.map(b=>({n:(b.nw?String(b.nn||'').trim().replace(/\s+/g,' '):b.n)||'',a:r2(+b.a||0)}));
 if(!L2.length)return alert(T('Añade al menos un beneficiario'));if(L2.some(l=>!l.n||!(l.a>0)))return alert(T('Cada beneficiario necesita nombre y monto'));
 if(cup?Math.abs(xbDiff().d)>1:Math.abs(xbDiff().d)>0.004)return alert(T('Los montos no cuadran con el total: {0}',xbBalHtml().replace(/<[^>]+>/g,'')));
 if(noDeb(a,'No se puede: el débito quedaría negativo. Disponible: {0}'))return;
 S.recipients=S.recipients||[];const merged={};L2.forEach(l=>{const ex=S.recipients.find(r=>same(r,l.n)||same(DN(r),l.n));if(ex)l.n=ex;else S.recipients.push(l.n);merged[l.n]=r2((merged[l.n]||0)+l.a)});
 const benef=Object.entries(merged).map(([n,v])=>cup?({n,cup:v,a:r2(v/rate)}):({n,a:v}));if(cup&&benef.length){const dd=r2(a-benef.reduce((x,b)=>x+b.a,0));benef[benef.length-1].a=r2(benef[benef.length-1].a+dd);S.xRate=rate}const cat=document.getElementById('xc').value||xDef(),date=document.getElementById('xf').value||today();spend('deb',a);
 S.months[monthFor(date)].personal.unshift({id:uid(),date,amount:a,cat,desc:document.getElementById('xn').value.trim(),method:'deb',xfer:true,...(cup?{rate}:{}),benef});
 save();dlg().close();render();toast(T('Transferencia registrada'))};
// ---------- 3) Reportes y PDF de Joe ----------
function xRepCard(k){const H=xHist(k),P=xByPerson(k),tot=r2(H.reduce((a,h)=>a+h.total,0));
 return `<div class="card defcol" id="xpcard"><h2>💸 ${T('Enviado por persona')}<span>${f(tot)}</span></h2><div class="muted">${lbl(k)}</div>
 ${P.map(([n,v,c,cu])=>`<div class="row"><span class="n">${esc(n)}</span><b>${f(v)}</b></div>`).join('')||`<div class="muted">${T('Sin envíos este mes.')}</div>`}
 ${H.length?`<h3 style="margin:12px 0 4px;font-size:15px">🧾 ${T('Historial de remesas')}</h3>`+H.map(h=>`<div class="xh" style="border-top:1px solid #e5e7eb;padding:6px 0"><div class="row" style="border:0;padding:0"><span class="n">${fdate(h.date)} · ${esc(DN(h.cat))}${h.desc?` · ${esc(h.desc)}`:''}</span><b>${f(h.total)}</b></div>
  ${h.lines.map(l=>`<div class="muted" style="display:flex;justify-content:space-between;padding-left:10px"><span>→ ${esc(l.n?DN(l.n):T('Sin destinatario'))}</span><span>${f(l.a)}</span></div>`).join('')}</div>`).join(''):''}</div>`}
{const _r=rep;rep=function(){const h=_r(),c=xRepCard(S.cur);const i=h.indexOf('<div class="card defcol" id="acccard"');return i<0?h+c:h.slice(0,i)+c+h.slice(i)}}
{const _p=pdfMine;pdfMine=function(D2,k){const r=_p.apply(this,arguments);const H=xHist(k);if(!H.length)return r;
 D2.h(T('Enviado por persona'));D2.table([T('Persona'),'USD'],xByPerson(k).map(([n,v])=>[n,f(v)]),{ws:[366,150],tot:[T('Total'),f(r2(H.reduce((a,h)=>a+h.total,0)))]});
 D2.h(T('Historial de remesas'));D2.table([T('Fecha'),T('Persona'),T('Categoría'),'USD'],H.flatMap(h=>h.lines.map(l=>[h.date?fdate(h.date):'',l.n?DN(l.n):T('Sin destinatario'),DN(h.cat).replace(/^\S+\s/,''),f(l.a)])),{ws:[90,170,166,90]});return r}}
