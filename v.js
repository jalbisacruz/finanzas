// v71: página pública de solo lectura para Tony/Carlos (shares/{token}). No usa el estado privado de Joe.
let ES=!/^en/i.test(navigator.language||'es');
const TXA={es:{title:'{0} · {1}',from:'De {0} · Actualizado {1}',share:'Tu parte',paid:'Ya pagado',paidT:'Ya transferido',pend:'Pendiente',pendT:'Pendiente de transferirte',
 bills:'Cuentas',billsT:'Total cuentas',minus:'− Tu parte de las compras',toT:'= A transferirte',purch:'Compras compartidas',item:'Ítem',cat:'Categoría',amt:'Monto',shared:'Compartida',ptot:'Total de la compra',
 mtot:'Total del mes',none:'Sin compras este mes.',paidB:'pagada',pendB:'pendiente',dl:'⬇️ Descargar PDF',bad:'Este enlace no es válido o fue desactivado.',err:'No se pudo cargar. Revisa tu conexión.',sum:'Resumen'},
 en:{title:'{0} · {1}',from:'From {0} · Updated {1}',share:'Your share',paid:'Already paid',paidT:'Already transferred',pend:'Pending',pendT:'Pending to transfer you',
 bills:'Bills',billsT:'Bills total',minus:'− Your share of purchases',toT:'= To transfer you',purch:'Shared purchases',item:'Item',cat:'Category',amt:'Amount',shared:'Shared',ptot:'Purchase total',
 mtot:'Month total',none:'No purchases this month.',paidB:'paid',pendB:'pending',dl:'⬇️ Download PDF',bad:'This link is not valid or was turned off.',err:"Couldn't load. Check your connection.",sum:'Summary'}};
Object.assign(TXA.es,{reg:'➕ Registrar compra',buyer:'Compró',store:'Tienda',date:'Fecha',total:'Total $',tax:'Impuesto $ (opcional)',items:'Ítems (opcional)',addItem:'+ Ítem',send:'Enviar a Joe',cancel:'Cancelar',scan:'📷 Escanear recibo',reading:'Leyendo el recibo…',sent:'✅ Enviado, Joe lo revisará.',sending:'Enviando…',needT:'Pon la tienda y el total.',over:'Los ítems y el impuesto superan el total.',sendErr:'No se pudo enviar. Revisa tu conexión e inténtalo otra vez.',scanErr:'No pude leer el recibo. Llénalo a mano.',pdfBig:'El PDF es muy grande (máximo 15 MB).',pendN:'Enviadas desde este teléfono: {0}',note:'Nombre',scanned:'📷 Leído del recibo. Revisa antes de enviar.',byNote:'Pagada por quien la compró: no entra en el Total del mes.',joeOwes:'Joe te debe (compras que pagaste)'});
Object.assign(TXA.en,{reg:'➕ Record purchase',buyer:'Bought by',store:'Store',date:'Date',total:'Total $',tax:'Tax $ (optional)',items:'Items (optional)',addItem:'+ Item',send:'Send to Joe',cancel:'Cancel',scan:'📷 Scan receipt',reading:'Reading the receipt…',sent:'✅ Sent, Joe will review it.',sending:'Sending…',needT:'Enter the store and total.',over:'Items and tax exceed the total.',sendErr:"Couldn't send. Check your connection and try again.",scanErr:"I couldn't read the receipt. Fill it in by hand.",pdfBig:'The PDF is too big (15 MB max).',pendN:'Sent from this phone: {0}',note:'Name',scanned:'📷 Read from the receipt. Review before sending.',byNote:'Paid by the buyer: not included in the Month total.',joeOwes:'Joe owes you (purchases you paid)'});let TX=TXA[ES?'es':'en'];const setLangV=l=>{ES=l!=='en';TX=TXA[ES?'es':'en'];document.documentElement.lang=ES?'es':'en'};
const t=(k,...a)=>TX[k].replace(/\{(\d)\}/g,(_,i)=>a[i]);
const f=n=>(n<0?'−':'')+'$'+Math.abs(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fd=d=>{if(!d)return'';const[y,m,dd]=d.split('-');return new Date(+y,m-1,+dd).toLocaleDateString(ES?'es':'en-US',{day:'numeric',month:'short'}).replace('.','')};
const P3=['Yo','Tony','Carlos'];window.DOC=null;let MI=0;
const $=id=>document.getElementById(id);
function fail(msg){$('h1').textContent='Finanzas';$('sub').textContent='';$('m').innerHTML=`<div class="card err">${esc(msg)}</div>`}
function draw(){setLangV(DOC.lang);const d=DOC,mo=d.months[MI],w=d.who,N=x=>d.names[x]||x,T=w==='Tony';document.title=N(w)+' · '+mo.label;
 $('h1').textContent=t('title',N(w),mo.label);$('sub').textContent=t('from',d.from,new Date(d.updatedAt).toLocaleString(ES?'es':'en-US',{dateStyle:'medium',timeStyle:'short'}));
 let h=d.months.length>1?`<div class="tabs">${d.months.map((m,i)=>`<button class="${i===MI?'on':''}" onclick="pick(${i})">${esc(m.label)}</button>`).join('')}</div>`:'';
 h+=`<div class="card"><h2>${t('sum')}</h2>`;
 if(T)h+=`<div class="row"><span>${t('billsT')}</span><b>${f(mo.billsTotal)}</b></div><div class="row"><span>${t('minus')}</span><span>−${f(mo.share)}</span></div><div class="row"><span>${t('toT')}</span><b>${f(mo.toTransfer)}</b></div>${mo.paid?`<div class="row"><span>${t('paidT')}</span><span>${f(mo.paid)}</span></div>`:''}<div class="row"><b>${t('pendT')}</b><span class="big">${f(mo.pending)}</span></div>`;
 else h+=`<div class="row"><span>${t('share')}</span><b>${f(mo.share)}</b></div><div class="row"><span>${t('paid')}</span><span>${f(mo.paid)}</span></div><div class="row"><b>${t('pend')}</b><span class="big">${f(mo.pending)}</span></div>`;
 if(mo.joeOwes>0.004)h+=`<div class="row"><span>${t('joeOwes')}</span><b>${f(mo.joeOwes)}</b></div>`;
 h+=`</div>`;
 if(T&&mo.bills&&mo.bills.length)h+=`<div class="card"><h2>${t('bills')}</h2>${mo.bills.map(b=>`<div class="row"><span>${esc(b.n)} <span class="muted">${b.paid?t('paidB'):t('pendB')}</span></span><span>${f(b.a)}</span></div>`).join('')}<div class="row"><b>${t('billsT')}</b><b>${f(mo.billsTotal)}</b></div></div>`;
 const hc=c=>c===w?' class="hl"':'';const mt={Yo:0,Tony:0,Carlos:0};
 h+=`<div class="card"><h2>${t('purch')}</h2>`+(mo.purchases.length?mo.purchases.map(p=>{if(!p.by)P3.forEach(x=>mt[x]+=p.tot[x]||0);return `<div class="ph"><span>${esc(fd(p.d))} · ${esc(p.s)} <span class="muted">${esc(p.c)}</span>${p.by?` <span class="muted">· ${esc(TX.buyer)}: ${esc(p.by)} *</span>`:''}</span><span>${f(p.t)}</span></div>
  <div class="wrap"><table><tr><th>${t('item')}</th><th class="l cat">${t('cat')}</th><th>${t('amt')}</th><th class="l">${t('shared')}</th>${P3.map(x=>`<th${hc(x)}>${esc(N(x))}</th>`).join('')}</tr>
  ${p.rows.map(r=>`<tr><td>${esc(r.n)}</td><td class="l cat">${esc(r.c)}</td><td>${f(r.a)}</td><td class="l">${esc(r.sh)}</td>${P3.map(x=>`<td${hc(x)}>${r.v[x]?f(r.v[x]):'—'}</td>`).join('')}</tr>`).join('')}
  <tr class="tot"><td colspan="2" class="l">${t('ptot')}</td><td class="cat"></td><td></td>${P3.map(x=>`<td${hc(x)}>${f(p.tot[x])}</td>`).join('')}</tr></table></div>`}).join('')+
  `<div class="wrap"><table style="margin-top:12px"><tr class="tot"><td>${t('mtot')}</td>${P3.map(x=>`<td${hc(x)}>${f(mt[x])}</td>`).join('')}</tr></table></div>`:`<div class="muted">${t('none')}</div>`)+`</div>`;
 h+=`${mo.purchases.some(p=>p.by)?`<div class="muted" style="margin:-6px 4px 12px">* ${esc(t('byNote'))}</div>`:''}<button class="dl" id="vreg" style="background:#15803d;margin-bottom:10px" onclick="regOpen()">${t('reg')}</button><div id="regbox"></div><div id="regok" class="muted" style="text-align:center;margin-bottom:10px">${(+localStorage.getItem('vsent-'+tok)||0)?esc(t('pendN',localStorage.getItem('vsent-'+tok))):''}</div><button class="dl" id="vdl" onclick="pdf()">${t('dl')}</button><div class="muted" style="text-align:center;margin:12px 0 30px">Finanzas · ${esc(d.from)}</div>`;$('m').innerHTML=h;if(REG)regDraw()}
window.pick=i=>{MI=i;draw()};
window.REG=null;let FS=null;const today=()=>new Date().toLocaleDateString('en-CA');
const r2=n=>Math.round((+n||0)*100)/100;
window.regOpen=()=>{REG=REG||{by:DOC.buyers[0],store:'',date:today(),total:'',tax:'',items:[],scan:false};regDraw();setTimeout(()=>$('regbox').scrollIntoView({behavior:'smooth'}),50)};
const P3N=()=>P3.map(x=>[x,DOC.names[x]||x]);
window.regDraw=regDraw;function regDraw(){const b=$('regbox');if(!b)return;if(!REG){b.innerHTML='';return}const R=REG,cats=DOC.cats||[];
 const chip=(on,lbl,js)=>`<button type="button" class="chip${on?' on':''}" onclick="${js}">${esc(lbl)}</button>`;
 b.innerHTML=`<div class="card" id="regform"><h2>${t('reg')}</h2>${R.scan?`<div class="muted" style="color:#1d4ed8;margin-bottom:6px">${t('scanned')}</div>`:''}
 <button type="button" class="dl" id="vscan" style="background:#334155;margin-bottom:10px" onclick="vScan()">${t('scan')}</button>
 <div class="lbl">${t('buyer')}</div><div class="chips">${DOC.buyers.map(x=>chip(R.by===x,x,`REG.by='${esc(x)}';regDraw()`)).join('')}</div>
 <div class="lbl">${t('store')}</div><input id="rstore" maxlength="60" value="${esc(R.store)}" oninput="REG.store=this.value">
 <div class="g2"><div><div class="lbl">${t('date')}</div><input id="rdate" type="date" value="${esc(R.date)}" onchange="REG.date=this.value"></div><div><div class="lbl">${t('total')}</div><input id="rtot" type="number" inputmode="decimal" step="0.01" value="${R.total}" oninput="REG.total=this.value"></div></div>
 <div class="lbl">${t('tax')}</div><input id="rtax" type="number" inputmode="decimal" step="0.01" value="${R.tax}" oninput="REG.tax=this.value">
 <div class="lbl">${t('items')}</div>${R.items.map((it,i)=>`<div class="itr"><div class="g2"><input placeholder="${t('note')}" maxlength="40" value="${esc(it.n)}" oninput="REG.items[${i}].n=this.value"><input type="number" inputmode="decimal" step="0.01" placeholder="$0" value="${it.a}" oninput="REG.items[${i}].a=this.value"></div>
  <div class="chips">${P3N().map(([k,l])=>chip(it.own.includes(k),l,`regOwn(${i},'${k}')`)).join('')}<select onchange="REG.items[${i}].c=this.value">${cats.map(c=>`<option value="${esc(c.v)}"${c.v===it.c?' selected':''}>${esc(c.l)}</option>`).join('')}</select><button type="button" class="chip" onclick="REG.items.splice(${i},1);regDraw()">✕</button></div></div>`).join('')}
 <button type="button" class="chip" id="radd" onclick="REG.items.push({n:'',a:'',own:['Yo','Tony','Carlos'],c:(DOC.cats[0]||{}).v||''});regDraw()">${t('addItem')}</button>
 <div id="rerr" class="err2"></div><div class="g2" style="margin-top:10px"><button type="button" class="chip" style="min-height:46px" onclick="REG=null;regDraw()">${t('cancel')}</button><button type="button" class="dl" id="rsend" onclick="regSend()">${t('send')}</button></div></div>`}
window.regOwn=(i,k)=>{const o=REG.items[i].own;const j=o.indexOf(k);if(j>=0){if(o.length>1)o.splice(j,1)}else o.push(k);regDraw()};
async function fsLib(){if(FS)return FS;const V='11.10.0',B=`https://www.gstatic.com/firebasejs/${V}/`;const [A,F]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-firestore-lite.js')]);
 const app=A.getApps().length?A.getApp():A.initializeApp(window.FB_CONFIG);FS={A,F,app,db:F.getFirestore(app),B};return FS}
window.regSend=async()=>{const R=REG,e=$('rerr'),tot=r2(R.total),tax=r2(R.tax),items=R.items.filter(x=>+x.a>0).map(x=>({n:String(x.n||'').slice(0,40),a:r2(x.a),own:x.own.filter(k=>P3.includes(k)).slice(0,3),c:String(x.c||'').slice(0,60)}));
 if(!R.store.trim()||!(tot>0)){e.textContent=t('needT');return}if(r2(items.reduce((s,x)=>s+x.a,0)+tax)>tot+0.004){e.textContent=t('over');return}
 const btn=$('rsend');btn.disabled=true;btn.textContent=t('sending');
 try{const{F,db}=await fsLib();const d={by:R.by,store:R.store.trim().slice(0,60),date:/^\d{4}-\d{2}-\d{2}$/.test(R.date)?R.date:today(),total:tot,at:F.serverTimestamp(),scan:!!R.scan};if(tax>0)d.tax=tax;if(items.length)d.items=items;
  await F.addDoc(F.collection(db,'shares',tok,'inbox'),d);REG=null;localStorage.setItem('vsent-'+tok,(+localStorage.getItem('vsent-'+tok)||0)+1);regDraw();$('regok').textContent=t('sent')}
 catch(x){console.error(x);e.textContent=t('sendErr');btn.disabled=false;btn.textContent=t('send')}};
// escaneo (Firebase AI Logic + App Check, sin iniciar sesión). La foto no se guarda.
function vResize(file){return new Promise((ok,ko)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);const W=im.naturalWidth,H=im.naturalHeight,cap=Math.max(W,H)>2*Math.min(W,H)?3000:1600,k=Math.min(1,cap/Math.max(W,H)),c=document.createElement('canvas');
 c.width=Math.round(W*k);c.height=Math.round(H*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);const d=c.toDataURL('image/jpeg',0.8);c.width=c.height=0;ok(d.slice(d.indexOf(',')+1))};im.onerror=()=>{URL.revokeObjectURL(u);ko(new Error('image'))};im.src=u})}
const vPdf=file=>new Promise((ok,ko)=>{if(file.size>15*1024*1024)return ko(new Error('pdfsize'));const r=new FileReader();r.onload=()=>{const d=String(r.result);ok(d.slice(d.indexOf(',')+1))};r.onerror=()=>ko(new Error('image'));r.readAsDataURL(file)});
function vPrompt(){return `Eres un lector de recibos de compra (tiendas de EE.UU.). Lee la foto, captura o PDF y responde SOLO con JSON:
{"isReceipt":true,"store":"nombre corto","date":"AAAA-MM-DD o null","total":0.00,"tax":0.00,"items":[{"name":"nombre corto en español","amount":0.00,"category":"una de la lista"}]}
"total" es el total pagado (con impuestos); "tax" la suma del sales tax (0 si no hay); los "amount" son ANTES de impuesto. No incluyas subtotal, impuestos ni pagos como ítems.
Categorías permitidas (texto exacto): ${JSON.stringify((DOC.cats||[]).map(c=>c.v))}.`}
window.vAI=window.vAI||(async(b64,mime)=>{const L=await fsLib(),[AC,AI]=await Promise.all([import(L.B+'firebase-app-check.js'),import(L.B+'firebase-ai.js')]);
 if(!L.ac){try{L.ac=AC.initializeAppCheck(L.app,{provider:new AC.ReCaptchaEnterpriseProvider('6LczjvEtAAAAAEaAHmwLEj2DUiWYY--kne8BH3ei'),isTokenAutoRefreshEnabled:true})}catch(e){console.warn(e)}}
 const ai=AI.getAI(L.app,{backend:new AI.GoogleAIBackend()});let last;
 for(let tr=0;tr<3;tr++){if(tr)await new Promise(r=>setTimeout(r,800*tr));for(const name of ['gemini-3.5-flash','gemini-3.8-flash']){try{const m=AI.getGenerativeModel(ai,{model:name,generationConfig:{responseMimeType:'application/json',temperature:0}});
  return (await m.generateContent([vPrompt(),{inlineData:{mimeType:mime,data:b64}}])).response.text()}catch(e){last=e;if(/404|not found/i.test(String(e&&e.message)))continue;if(/\[?4\d\d\b/.test(String(e&&e.message)))throw e;break}}}throw last});
window.vScan=()=>{const i=document.createElement('input');i.type='file';i.accept='image/*,application/pdf';i.style.display='none';
 i.onchange=async()=>{const file=i.files&&i.files[0];i.remove();if(!file)return;const btn=$('vscan'),e=$('rerr');btn.disabled=true;btn.textContent=t('reading');
  try{const pdf=/pdf$/i.test(file.type)||/\.pdf$/i.test(file.name);const b64=pdf?await vPdf(file):await vResize(file);let s=String(await vAI(b64,pdf?'application/pdf':'image/jpeg')).trim().replace(/^```(?:json)?\s*|\s*```$/g,'');
   const o=JSON.parse(s.slice(s.indexOf('{'),s.lastIndexOf('}')+1));if(o.isReceipt===false)throw new Error('notreceipt');const cv=(DOC.cats||[]).map(c=>c.v);
   Object.assign(REG,{store:String(o.store||'').slice(0,60),date:/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')?o.date:REG.date,total:+o.total>0?r2(o.total):'',tax:+o.tax>0&&+o.tax<+o.total?r2(o.tax):'',scan:true,
    items:(Array.isArray(o.items)?o.items:[]).filter(x=>+x.amount>0).slice(0,60).map(x=>({n:String(x.name||'').slice(0,40),a:r2(x.amount),own:['Yo','Tony','Carlos'],c:cv.includes(x.category)?x.category:(cv[0]||'')}))});regDraw()}
  catch(x){console.warn('scan',x);regDraw();$('rerr').textContent=String(x&&x.message)==='pdfsize'?t('pdfBig'):t('scanErr')}};
 document.body.appendChild(i);i.click()};
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
var tok;tok=new URLSearchParams(location.search).get('t')||'';
if(!/^[A-Za-z0-9_-]{20,}$/.test(tok))fail(TX.bad);
else if(window.__SHARE_DOC){DOC=window.__SHARE_DOC;draw()}
else{try{const V='11.10.0',B=`https://www.gstatic.com/firebasejs/${V}/`;const [{initializeApp},F]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-firestore-lite.js')]);
  const db=F.getFirestore(initializeApp(window.FB_CONFIG));const sn=await F.getDoc(F.doc(db,'shares',tok));if(!sn.exists())fail(TX.bad);else{DOC=sn.data();if(!DOC.months||!DOC.months.length)fail(TX.bad);else draw()}}
 catch(e){console.error(e);fail(/permission/i.test(String(e&&e.code))?TX.bad:TX.err)}}
