// v107 (Joe): una sola tabla «💸 Envíos a familia» en vez de «Enviado por persona» + «Historial de remesas» (v99), en Reportes y en MI PDF.
// Filas por persona: Este mes (USD) | Acumulado (USD, desde siempre) + Total. En la app, al tocar una persona se ven sus envíos (fecha, USD);
// en el PDF van compactos debajo de su fila. Solo USD.
Object.assign(EN,{"💸 Envíos a familia":"💸 Family transfers","Persona":"Person","Este mes":"This month","Acumulado":"All-time","Toca una persona para ver sus envíos.":"Tap a person to see their transfers.","Sin envíos.":"No transfers."});
function xTable(k){const P={};keys().forEach(mk=>xHist(mk).forEach(h=>h.lines.forEach(l=>{const n=l.n?DN(l.n):T('Sin destinatario'),o=P[n]=P[n]||{n,m:0,t:0,s:[]};
  o.t=r2(o.t+l.a);if(mk===k)o.m=r2(o.m+l.a);o.s.push({d:h.date,a:r2(l.a),k:mk})})));
 const rows=Object.values(P).sort((a,b)=>b.m-a.m||b.t-a.t||a.n.localeCompare(b.n));rows.forEach(r=>r.s.sort((a,b)=>String(dKey(b.d)||'').localeCompare(String(dKey(a.d)||''))));
 return {rows,tm:r2(rows.reduce((s,r)=>s+r.m,0)),tt:r2(rows.reduce((s,r)=>s+r.t,0))}}
xRepCard=function(k){const {rows,tm,tt}=xTable(k);
 return `<div class="card defcol" id="xpcard"><h2>${T('💸 Envíos a familia')}<span>${f(tm)}</span></h2><div class="muted">${lbl(k)} · USD${rows.length?' · '+T('Toca una persona para ver sus envíos.'):''}</div>
 <div class="row" style="font-size:12px;color:#64748b"><span class="n">${T('Persona')}</span><span style="width:92px;text-align:right">${T('Este mes')}</span><span style="width:92px;text-align:right">${T('Acumulado')}</span></div>
 ${rows.map((r,i)=>`<details class="xpr" id="xpr-${i}" style="border-top:1px solid #e5e7eb"><summary class="row" style="border:0;cursor:pointer;list-style:none"><span class="n">▸ ${esc(r.n)}</span><b style="width:92px;text-align:right">${f(r.m)}</b><span style="width:92px;text-align:right">${f(r.t)}</span></summary>
  ${r.s.map(s=>`<div class="muted" style="display:flex;justify-content:space-between;padding:2px 100px 2px 18px${s.k===k?';font-weight:600;color:#0f172a':''}"><span>${s.d?fdate(s.d)+(dKey(s.d).slice(0,4)!==String(k).slice(0,4)?' '+dKey(s.d).slice(0,4):''):lbl(s.k)}</span><span>${f(s.a)}</span></div>`).join('')}</details>`).join('')||`<div class="muted">${T('Sin envíos.')}</div>`}
 ${rows.length?`<div class="row" style="border-top:2px solid #cbd5e1"><span class="n"><b>${T('Total')}</b></span><b style="width:92px;text-align:right">${f(tm)}</b><b style="width:92px;text-align:right">${f(tt)}</b></div>`:''}</div>`};
document.head.insertAdjacentHTML('beforeend','<style>.xpr summary::-webkit-details-marker{display:none}.xpr[open] summary .n{font-weight:700}</style>');
// MI PDF: se apaga la sección de v99 (xHist vacío solo mientras corre) y se agrega la tabla única
{const _p=pdfMine;pdfMine=function(D2,k){const xh=xHist;xHist=()=>[];let r;try{r=_p.apply(this,arguments)}finally{xHist=xh}
 const {rows,tm,tt}=xTable(k);if(!rows.length)return r;
 D2.h(T('💸 Envíos a familia').replace(/^\S+\s/,'')+' (USD)');
 const sub=rows.map(x=>{const parts=x.s.map(s=>(s.d?fdate(s.d)+(dKey(s.d).slice(0,4)!==String(k).slice(0,4)?' '+dKey(s.d).slice(0,4):''):s.k)+' '+f(s.a)),o=[];for(let i=0;i<parts.length;i+=4)o.push(parts.slice(i,i+4).join(' · '));return o});
 D2.table(['',T('Persona'),T('Este mes'),T('Acumulado')],rows.map(x=>['',x.n,f(x.m),f(x.t)]),{ws:[10,256,125,125],left:[1],sub,tot:['',T('Total'),f(tm),f(tt)]});return r}}
