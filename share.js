// v56: compartir reportes. Nada se envía solo: siempre pasa por la hoja de compartir o el correo del usuario.
Object.assign(EN,{"📄 PDF del mes":"📄 Monthly PDF","Resumen mensual":"Monthly summary","Generado":"Generated","Gasto por categoría vs presupuesto":"Spending by category vs budget","Categoría":"Category","Gastado":"Spent","Presupuesto":"Budget",
"Ingresos por concepto":"Income by concept","Concepto":"Concept","Monto":"Amount","Tony: transferencia":"Tony: transfer","Carlos (por cobrar)":"Carlos (to collect)","Total compras":"Purchases total","Ya cobrado":"Already collected",
"Saldos de tarjetas":"Card balances","Tarjeta":"Card","Saldo":"Balance","Fecha":"Date","Tienda":"Store","pagada":"paid","pendiente":"pending","Compartir":"Share","Correo":"Email","Adjuntar PDF":"Attach PDF",
"Correo de {0} (opcional)":"{0}'s email (optional)","El correo no adjunta archivos: usa Compartir para enviar el PDF.":"Email can't attach files: use Share to send the PDF.","Generando PDF…":"Generating PDF…","PDF descargado":"PDF downloaded",
"No se pudo generar el PDF":"Couldn't generate the PDF","Nada se envía solo: revisas y envías tú.":"Nothing is sent automatically: you review and send.","Cuentas":"Bills","= A transferir":"= To transfer","Te transfiero":"I'll transfer you",
"Hola Tony, cuentas de {0}:":"Hi Tony, bills for {0}:","solo tuyo {0} + parte {1} = {2}":"only yours {0} + share {1} = {2}","Tu parte: {0}":"Your share: {0}","solo tuyo {0} + parte {1}":"only yours {0} + share {1}","Cuentas de {0} – Tony":"{0} bills – Tony","Compras de {0} – Carlos":"{0} purchases – Carlos",
"Hola Carlos, tus compras de {0}:":"Hi Carlos, your purchases for {0}:","Tu parte":"Your share","Ya pagado":"Already paid","Pendiente":"Pending","Ya transferido":"Already transferred","Tu parte de las compras":"Your share of purchases","Sin pendientes ✅":"Nothing pending ✅","Correo":"Email","Email":"Email","Compras compartidas":"Shared purchases"});
// ---------- datos (solo lectura) ----------
const shI=(p,w)=>r2(((p.items||{})[w]||[]).reduce((s,x)=>s+(+x.a||0),0));
function pShare(p,w){const t=r2(+(p.shares||{})[w]||0),i=shI(p,w);return {t,i,s:r2(t-i),notes:((p.items||{})[w]||[]).map(x=>[itLbl(x,p),f(x.a)].filter(Boolean).join(' '))}}
const billSt2=b=>{const a=+b.amount||0,p=+b.paid||0;return a>0&&p>=a-0.005?'paid':'pend'};
function tonyData(k){const m=S.months[k],c=calc(m);return {m,c,bills:m.bills.filter(b=>+b.amount),pur:m.purchases.filter(p=>+(p.shares||{}).Tony).map(p=>({p,...pShare(p,'Tony')}))}}
function carlosData(k){const m=S.months[k],c=calc(m);return {m,c,pur:m.purchases.filter(p=>+(p.shares||{}).Carlos).map(p=>({p,...pShare(p,'Carlos')}))}}
// v57: desglose solo si esa persona tiene ítems individuales (X>0); si no, solo "Tu parte"
const hasI=x=>x.i>0.004,brk=x=>hasI(x)?T('solo tuyo {0} + parte {1} = {2}',f(x.i),f(x.s),f(x.t)):T('Tu parte: {0}',f(x.t));
// ---------- mensajes ----------
// v58: mensaje legible en WhatsApp/Mail/Gmail: saludo corto, secciones con título, un ítem por línea, totales al final
const mLine=(l,v)=>`${l}  ${v}`,mNeg=v=>'−'+f(v).replace(/^−/,'');
const mSub=x=>hasI(x)?`   (${T('solo tuyo {0} + parte {1}',f(x.i),f(x.s))}${x.notes&&x.notes.length?' · '+x.notes.join(', '):''})`:null;
msgFor=function(who,k){const L2=[],add=(...a)=>a.filter(x=>x!==null&&x!==undefined).forEach(x=>L2.push(x));
 if(who==='tony'){const{c,bills,pur}=tonyData(k),pend=bills.filter(b=>billSt2(b)!=='paid'),all=pend.length===bills.length,none=!pend.length;
  add(T('Hola Tony, estas son las cuentas de {0}:',lbl(k)),'',T('CUENTAS')+(bills.length&&all?' '+T('(todas pendientes)'):bills.length&&none?' '+T('(todas pagadas ✅)'):''));
  bills.forEach(b=>add(mLine(DN(b.name),f(b.amount))+(!all&&!none&&billSt2(b)!=='paid'?' ⏳':'')));
  add(mLine(T('Total cuentas'),f(c.bills)));if(!all&&!none)add(T('⏳ = pendiente'));
  if(pur.length){add('',T('TU PARTE DE LAS COMPRAS'));pur.forEach(x=>add(mLine(DN(x.p.store)+(x.p.date?' · '+fdate(x.p.date):'')+(pCat(x.p)!==SHARED_CAT?' · '+DN(pCat(x.p)):''),f(x.t)),mSub(x)));add(mLine(T('Total compras'),mNeg(c.tony)))}
  if(c.xfer)add('',mLine(T('YA TRANSFERIDO'),mNeg(c.xfer)));
  add('',c.tonyDue>0.005?mLine(T('A TRANSFERIRTE'),f(c.tonyDue)):T('Todo al día ✅'))}
 else{const{c,pur}=carlosData(k);pur.forEach(x=>x.who='Carlos');
  add(T('Hola Carlos, estas son tus compras de {0}:',lbl(k)),'',T('COMPRAS'));
  pur.forEach(x=>add(mLine(DN(x.p.store)+(x.p.date?' · '+fdate(x.p.date):'')+(pCat(x.p)!==SHARED_CAT?' · '+DN(pCat(x.p)):''),f(x.t)),mSub(x)));add(mLine(T('Total compras'),f(c.carlos)));
  if(c.recv)add('',mLine(T('YA PAGASTE'),mNeg(c.recv)));
  add('',c.carlosDue>0.005?mLine(T('PENDIENTE'),f(c.carlosDue)):T('Todo al día ✅'))}
 return L2.join('\n')};
Object.assign(EN,{"Hola Tony, estas son las cuentas de {0}:":"Hi Tony, here are the bills for {0}:","CUENTAS":"BILLS","(todas pendientes)":"(all pending)","(todas pagadas ✅)":"(all paid ✅)","⏳ = pendiente":"⏳ = pending",
 "TU PARTE DE LAS COMPRAS":"YOUR SHARE OF PURCHASES","Total compras":"Purchases total","YA TRANSFERIDO":"ALREADY TRANSFERRED","A TRANSFERIRTE":"TO TRANSFER YOU","Todo al día ✅":"All settled ✅",
 "Hola Carlos, estas son tus compras de {0}:":"Hi Carlos, here are your purchases for {0}:","COMPRAS":"PURCHASES","YA PAGASTE":"ALREADY PAID","PENDIENTE":"PENDING",
 "Cuentas de {0} – Joe":"{0} bills – Joe","Compras de {0} – Joe":"{0} purchases – Joe"});
// ---------- correo por persona (campo nuevo opcional en el catálogo de Personas) ----------
function pplItem(p){const it=Object.values((S.catalog||{}).items||{}).find(x=>x.t==='ppl'&&x.key===p);return it}
function getMail(p){const it=pplItem(p);return (it&&it.email)||(S.pplEmail||{})[p]||''}
function setMail(p,v){v=(v||'').trim();if(v===getMail(p))return;const it=pplItem(p);
 if(it){if(v)it.email=v;else delete it.email}else{S.pplEmail=S.pplEmail||{};if(v)S.pplEmail[p]=v;else delete S.pplEmail[p]}save()}
// v59: el campo de correo ya no se muestra (Gmail iOS quita los saltos de línea en mailto). Los correos guardados no se tocan.
// ---------- PDF ----------
let _jsp=null;function loadPDF(){if(window.jspdf)return Promise.resolve();return _jsp=_jsp||new Promise((ok,ko)=>{const s=document.createElement('script');s.src='vendor/jspdf.umd.min.js';s.onload=ok;s.onerror=ko;document.head.append(s)})}
const pt=s=>String(s??'').replace(/[−–—]/g,'-').replace(/[•·]/g,m=>m==='•'?'-':'·').replace(/[✅]/g,'').replace(/[^\x00-\xff]/g,'').replace(/\s+/g,' ').trim();
function Doc(title,sub){const d=new jspdf.jsPDF({unit:'pt',format:'letter'}),W=612,X=48,R=W-48;let y=0;
 const head=()=>{d.setFillColor(37,99,235);d.rect(0,0,W,64,'F');d.setTextColor(255);d.setFont('helvetica','bold');d.setFontSize(18);d.text(pt(title),X,30);d.setFont('helvetica','normal');d.setFontSize(10);d.text(pt(sub),X,48);d.setTextColor(15,23,42);y=88};head();
 const need=h=>{if(y+h>742){d.addPage();y=48}};
 const o={d,
  h(t){need(40);y+=8;d.setFont('helvetica','bold');d.setFontSize(13);d.setTextColor(37,99,235);d.text(pt(t),X,y);d.setDrawColor(203,213,225);d.line(X,y+5,R,y+5);d.setTextColor(15,23,42);y+=20},
  row(l,v,{b,muted,ind}={}){need(16);d.setFont('helvetica',b?'bold':'normal');d.setFontSize(10.5);d.setTextColor(...(muted?[100,116,139]:[15,23,42]));
   const ls=d.splitTextToSize(pt(l),R-X-110-(ind||0));d.text(ls,X+(ind||0),y);if(v!==undefined)d.text(pt(v),R,y,{align:'right'});y+=14*ls.length;d.setTextColor(15,23,42)},
  sep(){y+=4},
  note(t){need(14);d.setFont('helvetica','italic');d.setFontSize(9);d.setTextColor(100,116,139);const ls=d.splitTextToSize(pt(t),R-X);d.text(ls,X,y);y+=12*ls.length;d.setTextColor(15,23,42)},
  table(cols,rows,{ws,tot}={}){const n=cols.length,w=ws||cols.map(()=>(R-X)/n),xs=[];let a=X;w.forEach(v=>{xs.push(a);a+=v});
   const line=(cells,bold,fill)=>{need(18);if(fill){d.setFillColor(...fill);d.rect(X,y-11,R-X,16,'F')}d.setFont('helvetica',bold?'bold':'normal');d.setFontSize(9.5);
    cells.forEach((c,i)=>{const s=pt(c);if(i===0)d.text(d.splitTextToSize(s,w[i]-6)[0]||'',xs[i]+3,y);else d.text(s,xs[i]+w[i]-3,y,{align:'right'})});y+=16};
   line(cols,true,[241,245,249]);rows.forEach((r,j)=>line(r,false,j%2?[248,250,252]:null));if(tot)line(tot,true,[226,232,240]);y+=4},
  out(){const p=d.getNumberOfPages();for(let i=1;i<=p;i++){d.setPage(i);d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(148,163,184);d.text(pt('Finanzas · '+T('Generado')+' '+new Date().toLocaleString(LOC())+'   '+i+'/'+p),X,770)}return d}};
 return o}
function pdfMonth(k){const m=S.months[k],c=calc(m),D2=Doc(T('Resumen mensual')+' – '+lbl(k),'Finanzas · '+lbl(k));
 D2.h(T('Lo que tengo'));D2.row(T('Débito, efectivo y cheques'),f(c.inc));D2.row(T('Por cobrar Tony'),f(c.tony));D2.row(T('Por cobrar Carlos'),f(c.carlosDue));D2.row(T('Total a mi favor'),f(c.money),{b:1});
 D2.h(T('Lo que debo'));D2.row(T('Tarjetas de crédito'),f(c.credit));D2.row(T('Cuentas de Tony'),f(c.bills));if(c.xfer)D2.row(T('− Ya transferido a Tony'),f(c.xfer));D2.row(T('Total que debo'),f(c.debt),{b:1});
 D2.h(T('Balance'));D2.row(T('Lo que tengo − lo que debo'),f(c.bal),{b:1});
 const sp=spent(m),bb=budBy(m).by,lim=S.budgets||{},cats=[...new Set([...Object.keys(sp.by),...Object.keys(lim).filter(x=>+lim[x]>0)])].sort((a,b)=>(sp.by[b]||0)-(sp.by[a]||0));
 D2.h(T('Gasto por categoría vs presupuesto'));
 if(cats.length)D2.table([T('Categoría'),T('Gastado'),T('Presupuesto'),'%'],cats.map(x=>{const l=+lim[x]||0;return [DN(x),f(sp.by[x]||0),l?f(l):'—',l?Math.round((bb[x]||0)/l*100)+'%':'—']}),{ws:[246,90,90,90],tot:[T('Total'),f(sp.total),'','']});
 else D2.note(T('Sin gastos registrados.'));D2.note(T('compras compartidas cuentan solo tu parte'));
 const er=earned(m);D2.h(T('Ingresos por concepto'));
 if(Object.keys(er.by).length)D2.table([T('Concepto'),T('Monto')],Object.entries(er.by).sort((a,b)=>b[1]-a[1]).map(([x,v])=>[DN(x),f(v)]),{ws:[366,150],tot:[T('Total'),f(er.total)]});else D2.note(T('Sin ingresos registrados.'));
 D2.note(T('sin reembolsos, transferencias entre tus cuentas ni pagos de tarjeta'));
 const td=tonyData(k);D2.h(T('Tony: transferencia'));td.bills.forEach(b=>D2.row(DN(b.name)+' ('+T(billSt2(b)==='paid'?'pagada':'pendiente')+')',f(b.amount),{ind:8}));
 D2.row(T('Total cuentas'),f(c.bills),{b:1});D2.row('− '+T('Tu parte de las compras'),f(c.tony));D2.row(T('= A transferir'),f(c.toTony),{b:1});if(c.xfer)D2.row(T('Ya transferido'),f(c.xfer));D2.row(T('Pendiente'),f(c.tonyDue),{b:1});
 D2.h(T('Carlos (por cobrar)'));D2.row(T('Total compras'),f(c.carlos));D2.row(T('Ya cobrado'),f(c.recv));D2.row(T('Pendiente'),f(c.carlosDue),{b:1});
 D2.h(T('Compras compartidas'));const P=[...m.purchases].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
 if(P.length)D2.table([T('Tienda'),T('Fecha'),T('Total'),'Tony','Carlos',DN('Yo')],P.map(p=>[DN(p.store)+(p.items&&Object.keys(p.items).length?' *':''),p.date?fdate(p.date):'',f(p.total),f((p.shares||{}).Tony||0),f((p.shares||{}).Carlos||0),f((p.shares||{}).Yo||0)]),
  {ws:[146,74,74,74,74,74],tot:[T('Total'),'',f(sum(P,p=>p.total)),f(c.tony),f(c.carlos),f(sum(P,p=>(p.shares||{}).Yo))]});else D2.note(T('Sin compras este mes.'));
 if(P.some(p=>p.items&&Object.keys(p.items).length))D2.note('* '+T('Ítems individuales').replace(/^[+−] /,''));
 D2.h(T('Saldos de tarjetas'));if(m.cards.length)D2.table([T('Tarjeta'),T('Saldo')],m.cards.map(x=>[DN(x.name),f(x.amount)]),{ws:[366,150],tot:[T('Total'),f(c.credit)]});else D2.note('—');
 return D2.out()}
function pdfTony(k){const{c,bills,pur}=tonyData(k),D2=Doc(T('Cuentas de {0} – Tony',lbl(k)),'Finanzas · '+lbl(k));
 D2.h(T('Cuentas'));D2.table([T('Cuentas'),T('Monto'),''],bills.map(b=>[DN(b.name),f(b.amount),T(billSt2(b)==='paid'?'pagada':'pendiente')]),{ws:[316,100,100],tot:[T('Total cuentas'),f(c.bills),'']});
 D2.h(T('Tu parte de las compras'));if(pur.length)D2.table([T('Tienda'),T('Fecha'),T('Total'),T('Ítems individuales').replace(/^[+−] /,''),T('Compartido'),T('Tu parte')],pur.map(x=>[DN(x.p.store),x.p.date?fdate(x.p.date):'',f(x.p.total),hasI(x)?f(x.i):'',hasI(x)?f(x.s):'',f(x.t)]),{ws:[136,66,76,82,76,80],tot:[T('Total'),'','','','',f(c.tony)]});else D2.note('—');
 {const its=pur.filter(hasI);if(its.length){D2.h(T('Ítems individuales').replace(/^[+−] /,''));its.forEach(x=>((x.p.items||{}).Tony||[]).forEach(it=>D2.row(DN(x.p.store)+' · '+itLbl(it,x.p),f(it.a),{ind:8})))}}
 D2.h(T('Balance'));D2.row(T('Total cuentas'),f(c.bills));D2.row('− '+T('Tu parte de las compras'),f(c.tony));D2.row(T('= A transferir'),f(c.toTony),{b:1});if(c.xfer)D2.row(T('Ya transferido'),f(c.xfer));D2.row(T('Pendiente'),f(c.tonyDue),{b:1});return D2.out()}
function pdfCarlos(k){const{c,pur}=carlosData(k),D2=Doc(T('Compras de {0} – Carlos',lbl(k)),'Finanzas · '+lbl(k));
 D2.h(T('Compras compartidas'));pur.forEach(x=>{D2.row(DN(x.p.store)+' · '+(x.p.date?fdate(x.p.date):'')+' · '+T('Total')+' '+f(x.p.total),undefined,{b:1});
  if(hasI(x)){((x.p.items||{}).Carlos||[]).forEach(it=>D2.row(T('Solo de {0}','Carlos')+': '+itLbl(it,x.p),f(it.a),{ind:12,muted:1}));D2.row(T('solo tuyo {0} + parte {1}',f(x.i),f(x.s)),'= '+f(x.t),{ind:12,b:1})}
  else D2.row(T('Tu parte: {0}','').replace(/\s*$/,''),f(x.t),{ind:12,b:1});D2.sep()});
 if(!pur.length)D2.note('—');D2.h(T('Balance'));D2.row(T('Total'),f(c.carlos));D2.row(T('Ya pagado'),f(c.recv));D2.row(T('Pendiente'),f(c.carlosDue),{b:1});return D2.out()}
async function makePDF(kind,k){await loadPDF();const doc=kind==='tony'?pdfTony(k):kind==='carlos'?pdfCarlos(k):pdfMonth(k);
 const nm=(kind==='tony'?'Tony':kind==='carlos'?'Carlos':T('Resumen mensual').replace(/\s/g,'-'))+'-'+k+'.pdf';return new File([doc.output('blob')],nm,{type:'application/pdf'})}
function dl(file){const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast(T('PDF descargado'))}
async function shareOut({text,file,title}){const d={title};if(text)d.text=text;
 if(file&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({...d,files:[file]});return 'shared'}catch(e){if(e&&e.name==='AbortError')return 'abort'}}
 if(file)dl(file);if(text&&navigator.share&&!file){try{await navigator.share(d);return 'shared'}catch(e){if(e&&e.name==='AbortError')return 'abort'}}
 if(text){try{await navigator.clipboard.writeText(text);toast(T('Copiado'))}catch(e){}}return 'fallback'}
async function pdfMes(k){k=k||S.cur;toast(T('Generando PDF…'));try{const file=await makePDF('mes',k);await shareOut({file,title:T('Resumen mensual')+' '+lbl(k)})}catch(e){console.error(e);alert(T('No se pudo generar el PDF'))}}
// ---------- diálogo Tony / Carlos ----------
shareMsg=function(who,k){const P=who==='tony'?'Tony':'Carlos',t=msgFor(who,k);
 dlg().innerHTML=`<h2>📤 ${T('Mensaje para {0}',P)}</h2><textarea id="msgt" rows="11" style="width:100%;font-family:inherit;font-size:14px;border-radius:10px;border:1px solid #cbd5e1;padding:8px">${esc(t)}</textarea>
 <label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="msgpdf" style="width:auto;min-height:0"> ${T('Adjuntar PDF')}</label>
 <div class="muted" style="margin:6px 0">${T('Nada se envía solo: revisas y envías tú.')}</div>
 <div class="grid" style="margin-top:6px"><button id="msgsh" onclick="msgShare('${who}','${k}')">${T('Compartir')}</button><button class="sec" id="msgcp" onclick="copyMsg()">${T('Copiar')}</button></div>
 <button class="sec" style="width:100%;margin-top:8px" onclick="dlg().close()">${T('Cerrar')}</button>`;dlg().showModal()};
async function msgShare(who,k){const t=document.getElementById('msgt').value.replace(/\r\n?/g,'\n'),pdf=document.getElementById('msgpdf').checked,P=who==='tony'?'Tony':'Carlos';
 try{const file=pdf?await makePDF(who,k):null;await shareOut({text:t,file,title:T('Mensaje para {0}',P)})}catch(e){console.error(e);alert(T('No se pudo generar el PDF'))}}

// ---------- entrada en Reportes ----------
const _rep56=rep;rep=function(){return _rep56().replace('<div class="card" id="gpcard">',`<div style="display:flex;justify-content:flex-end;margin:0 2px 8px"><button class="sec" id="pdfbtn" style="min-height:36px;padding:2px 14px;font-size:14px" onclick="pdfMes()">${T('📄 PDF del mes')}</button></div><div class="card" id="gpcard">`)};
