// v71: página pública de solo lectura para Tony/Carlos (shares/{token}). No usa el estado privado de Joe.
let ES=!/^en/i.test(navigator.language||'es');
const TXA={es:{title:'{0} · {1}',from:'De {0} · Actualizado {1}',share:'Tu parte',paid:'Ya pagado',paidT:'Ya transferido',pend:'Pendiente',pendT:'Pendiente de transferirte',
 bills:'Cuentas',billsT:'Total cuentas',minus:'− Tu parte de las compras',toT:'= A transferirte',purch:'Compras compartidas',item:'Ítem',cat:'Categoría',amt:'Monto',shared:'Compartida',ptot:'Total de la compra',
 mtot:'Total del mes',none:'Sin compras este mes.',paidB:'pagada',pendB:'pendiente',dl:'⬇️ Descargar PDF',bad:'Este enlace no es válido o fue desactivado.',err:'No se pudo cargar. Revisa tu conexión.',sum:'Resumen'},
 en:{title:'{0} · {1}',from:'From {0} · Updated {1}',share:'Your share',paid:'Already paid',paidT:'Already transferred',pend:'Pending',pendT:'Pending to transfer you',
 bills:'Bills',billsT:'Bills total',minus:'− Your share of purchases',toT:'= To transfer you',purch:'Shared purchases',item:'Item',cat:'Category',amt:'Amount',shared:'Shared',ptot:'Purchase total',
 mtot:'Month total',none:'No purchases this month.',paidB:'paid',pendB:'pending',dl:'⬇️ Download PDF',bad:'This link is not valid or was turned off.',err:"Couldn't load. Check your connection.",sum:'Summary'}};let TX=TXA[ES?'es':'en'];const setLangV=l=>{ES=l!=='en';TX=TXA[ES?'es':'en'];document.documentElement.lang=ES?'es':'en'};
const t=(k,...a)=>TX[k].replace(/\{(\d)\}/g,(_,i)=>a[i]);
const f=n=>(n<0?'−':'')+'$'+Math.abs(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fd=d=>{if(!d)return'';const[y,m,dd]=d.split('-');return new Date(+y,m-1,+dd).toLocaleDateString(ES?'es':'en-US',{day:'numeric',month:'short'}).replace('.','')};
const P3=['Yo','Tony','Carlos'];let DOC=null,MI=0;
const $=id=>document.getElementById(id);
function fail(msg){$('h1').textContent='Finanzas';$('sub').textContent='';$('m').innerHTML=`<div class="card err">${esc(msg)}</div>`}
function draw(){setLangV(DOC.lang);const d=DOC,mo=d.months[MI],w=d.who,N=x=>d.names[x]||x,T=w==='Tony';document.title=N(w)+' · '+mo.label;
 $('h1').textContent=t('title',N(w),mo.label);$('sub').textContent=t('from',d.from,new Date(d.updatedAt).toLocaleString(ES?'es':'en-US',{dateStyle:'medium',timeStyle:'short'}));
 let h=d.months.length>1?`<div class="tabs">${d.months.map((m,i)=>`<button class="${i===MI?'on':''}" onclick="pick(${i})">${esc(m.label)}</button>`).join('')}</div>`:'';
 h+=`<div class="card"><h2>${t('sum')}</h2>`;
 if(T)h+=`<div class="row"><span>${t('billsT')}</span><b>${f(mo.billsTotal)}</b></div><div class="row"><span>${t('minus')}</span><span>−${f(mo.share)}</span></div><div class="row"><span>${t('toT')}</span><b>${f(mo.toTransfer)}</b></div>${mo.paid?`<div class="row"><span>${t('paidT')}</span><span>${f(mo.paid)}</span></div>`:''}<div class="row"><b>${t('pendT')}</b><span class="big">${f(mo.pending)}</span></div>`;
 else h+=`<div class="row"><span>${t('share')}</span><b>${f(mo.share)}</b></div><div class="row"><span>${t('paid')}</span><span>${f(mo.paid)}</span></div><div class="row"><b>${t('pend')}</b><span class="big">${f(mo.pending)}</span></div>`;
 h+=`</div>`;
 if(T&&mo.bills&&mo.bills.length)h+=`<div class="card"><h2>${t('bills')}</h2>${mo.bills.map(b=>`<div class="row"><span>${esc(b.n)} <span class="muted">${b.paid?t('paidB'):t('pendB')}</span></span><span>${f(b.a)}</span></div>`).join('')}<div class="row"><b>${t('billsT')}</b><b>${f(mo.billsTotal)}</b></div></div>`;
 const hc=c=>c===w?' class="hl"':'';const mt={Yo:0,Tony:0,Carlos:0};
 h+=`<div class="card"><h2>${t('purch')}</h2>`+(mo.purchases.length?mo.purchases.map(p=>{P3.forEach(x=>mt[x]+=p.tot[x]||0);return `<div class="ph"><span>${esc(fd(p.d))} · ${esc(p.s)} <span class="muted">${esc(p.c)}</span></span><span>${f(p.t)}</span></div>
  <div class="wrap"><table><tr><th>${t('item')}</th><th class="l cat">${t('cat')}</th><th>${t('amt')}</th><th class="l">${t('shared')}</th>${P3.map(x=>`<th${hc(x)}>${esc(N(x))}</th>`).join('')}</tr>
  ${p.rows.map(r=>`<tr><td>${esc(r.n)}</td><td class="l cat">${esc(r.c)}</td><td>${f(r.a)}</td><td class="l">${esc(r.sh)}</td>${P3.map(x=>`<td${hc(x)}>${r.v[x]?f(r.v[x]):'—'}</td>`).join('')}</tr>`).join('')}
  <tr class="tot"><td colspan="2" class="l">${t('ptot')}</td><td class="cat"></td><td></td>${P3.map(x=>`<td${hc(x)}>${f(p.tot[x])}</td>`).join('')}</tr></table></div>`}).join('')+
  `<div class="wrap"><table style="margin-top:12px"><tr class="tot"><td>${t('mtot')}</td>${P3.map(x=>`<td${hc(x)}>${f(mt[x])}</td>`).join('')}</tr></table></div>`:`<div class="muted">${t('none')}</div>`)+`</div>`;
 h+=`<button class="dl" id="vdl" onclick="pdf()">${t('dl')}</button><div class="muted" style="text-align:center;margin:12px 0 30px">Finanzas · ${esc(d.from)}</div>`;$('m').innerHTML=h}
window.pick=i=>{MI=i;draw()};
const pt=s=>String(s??'').replace(/[−–—]/g,'-').replace(/[^\x00-\xff]/g,'').replace(/\s+/g,' ').trim();
window.pdf=()=>{const d=DOC,mo=d.months[MI],w=d.who,N=x=>d.names[x]||x,J=new jspdf.jsPDF({unit:'pt',format:'letter'}),X=48,R=564;let y=0;
 const head=()=>{J.setFillColor(37,99,235);J.rect(0,0,612,64,'F');J.setTextColor(255);J.setFont('helvetica','bold');J.setFontSize(18);J.text(pt(t('title',N(w),mo.label)),X,30);J.setFont('helvetica','normal');J.setFontSize(10);J.text(pt(t('from',d.from,new Date(d.updatedAt).toLocaleDateString(ES?'es':'en-US',{dateStyle:'medium'}))),X,48);J.setTextColor(15,23,42);y=90};head();
 const need=h=>{if(y+h>742){J.addPage();y=48}};const W=[128,96,58,74,54,54,52],xs=[];let a=X;W.forEach(v=>{xs.push(a);a+=v});const hi=4+P3.indexOf(w);
 const line=(cells,bold,fill)=>{need(18);if(fill){J.setFillColor(...fill);J.rect(X,y-11,R-X,16,'F')}J.setFillColor(...(bold?[147,197,253]:[219,234,254]));J.rect(xs[hi],y-11,W[hi],16,'F');J.setFontSize(9.5);
  cells.forEach((c,i)=>{J.setFont('helvetica',bold||i===hi?'bold':'normal');const s=J.splitTextToSize(pt(c),W[i]-6)[0]||'';if(i<2||i===3)J.text(s,xs[i]+3,y);else J.text(s,xs[i]+W[i]-3,y,{align:'right'})});y+=16};
 const row=(l,v,b)=>{need(16);J.setFont('helvetica',b?'bold':'normal');J.setFontSize(10.5);J.text(pt(l),X,y);J.text(pt(v),R,y,{align:'right'});y+=15};
 const h2=s=>{need(40);y+=8;J.setFont('helvetica','bold');J.setFontSize(13);J.setTextColor(37,99,235);J.text(pt(s),X,y);J.setDrawColor(203,213,225);J.line(X,y+5,R,y+5);J.setTextColor(15,23,42);y+=20};
 h2(t('sum'));if(w==='Tony'){row(t('billsT'),f(mo.billsTotal));row(t('minus'),f(mo.share));row(t('toT'),f(mo.toTransfer),1);if(mo.paid)row(t('paidT'),f(mo.paid));row(t('pendT'),f(mo.pending),1);
  if(mo.bills&&mo.bills.length){h2(t('bills'));mo.bills.forEach(b=>row(b.n+' ('+(b.paid?t('paidB'):t('pendB'))+')',f(b.a)))}}
 else{row(t('share'),f(mo.share));row(t('paid'),f(mo.paid));row(t('pend'),f(mo.pending),1)}
 h2(t('purch'));const mt={Yo:0,Tony:0,Carlos:0};
 mo.purchases.forEach(p=>{need(60);J.setFont('helvetica','bold');J.setFontSize(10.5);J.text(pt(fd(p.d)+' · '+p.s+' · '+p.c),X,y);J.text(pt(f(p.t)),R,y,{align:'right'});y+=14;
  line([t('item'),t('cat'),t('amt'),t('shared'),...P3.map(N)],true,[241,245,249]);p.rows.forEach((r,j)=>line([r.n,r.c,f(r.a),r.sh,...P3.map(x=>r.v[x]?f(r.v[x]):'-')],false,j%2?[248,250,252]:null));
  line([t('ptot'),'','','',...P3.map(x=>f(p.tot[x]))],true,[226,232,240]);P3.forEach(x=>mt[x]+=p.tot[x]||0);y+=4});
 if(mo.purchases.length)line([t('mtot'),'','','',...P3.map(x=>f(mt[x]))],true,[226,232,240]);
 const n=J.getNumberOfPages();for(let i=1;i<=n;i++){J.setPage(i);J.setFontSize(8);J.setTextColor(148,163,184);J.text(i+'/'+n,R,770,{align:'right'})}
 const b=J.output('blob'),u=URL.createObjectURL(b),el=document.createElement('a');el.href=u;el.download=(N(w)+'-'+mo.k+'.pdf');document.body.append(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)};
const tok=new URLSearchParams(location.search).get('t')||'';
if(!/^[A-Za-z0-9_-]{20,}$/.test(tok))fail(TX.bad);
else if(window.__SHARE_DOC){DOC=window.__SHARE_DOC;draw()}
else{try{const V='11.10.0',B=`https://www.gstatic.com/firebasejs/${V}/`;const [{initializeApp},F]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-firestore-lite.js')]);
  const db=F.getFirestore(initializeApp(window.FB_CONFIG));const sn=await F.getDoc(F.doc(db,'shares',tok));if(!sn.exists())fail(TX.bad);else{DOC=sn.data();if(!DOC.months||!DOC.months.length)fail(TX.bad);else draw()}}
 catch(e){console.error(e);fail(/permission/i.test(String(e&&e.code))?TX.bad:TX.err)}}
