// v108 (Joe): «🏦 Cuadrar con el banco»: consulta de solo lectura (no cambia NINGÚN dato). Cuenta (Débito o tarjeta) + CSV del banco
// (BOA débito o Chase «Download account activity») + líneas en proceso opcionales (foto escaneada o a mano) → compara con los
// movimientos de la app desde su inicio (ajuste inicial o primer movimiento). Solo se recuerda la última cuenta (localStorage).
// Convención interna: «saldo» como débito; en tarjetas saldo = −lo que debes (cargo = negativo, pago = positivo, como Chase).
Object.assign(EN,{"🏦 Cuadrar con el banco":"🏦 Reconcile with bank","Cuadrar con el banco":"Reconcile with bank","Compara tus movimientos con el archivo del banco. No cambia nada.":"Compare your entries with the bank file. Changes nothing.",
 "Cuenta":"Account","Archivo del banco (CSV)":"Bank file (CSV)","Saldo en el banco":"Bank balance","Saldo actual de la tarjeta (lo que debes)":"Current card balance (what you owe)",
 "En proceso en el banco (opcional)":"Processing at the bank (optional)","+ Añadir línea":"+ Add line","📷 Escanear foto":"📷 Scan photo","Descripción":"Description","Monto":"Amount",
 "Comparar":"Compare","Cuadra":"Matches","En la app, falta en el banco":"In the app, missing at the bank","En el banco, falta en la app":"At the bank, missing in the app",
 "Saldo banco (archivo)":"Bank balance (file)","+ en proceso":"+ processing","= Saldo banco hoy":"= Bank balance today","+ lo que falta en el banco":"+ missing at the bank","= Esperado":"= Expected",
 "Saldo en la app":"Balance in the app","Diferencia":"Difference","✅ Todo cuadra":"✅ All matches","Se compara desde el {0} (inicio de la app para esta cuenta).":"Compared from {0} (the app's start for this account).",
 "No reconozco este archivo. Usa el CSV de Bank of America (débito) o de Chase (Download account activity).":"I don't recognize this file. Use the Bank of America (debit) CSV or the Chase one (Download account activity).",
 "{0} · {1} movimientos":"{0} · {1} entries","Elige el archivo del banco":"Choose the bank file","Pon el saldo en el banco":"Enter the bank balance","Nada.":"Nothing.","en proceso":"processing",
 "suma de 2 del banco":"sum of 2 bank rows","No se pudo leer la foto. Añade las líneas a mano.":"Couldn't read the photo. Add the lines by hand.","Leyendo la foto…":"Reading the photo…",
 "Débito":"Debit","Recompensa":"Reward","Pago Chase":"Chase payment","Pago tarjeta BOA":"BOA card payment","Nómina":"Payroll"});
// ---------- CSV ----------
function rcCsv(t){const rows=[];let r=[],c='',q=false;t=String(t).replace(/^\uFEFF/,'');for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch==='"')q=true;else if(ch===','){r.push(c);c=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);rows.push(r);r=[];c=''}else c+=ch}
 if(c!==''||r.length){r.push(c);rows.push(r)}return rows}
const rcNum=s=>{s=String(s||'').replace(/[$,\s]/g,'');if(!s)return null;const n=+s;return isFinite(n)?r2(n):null};
const rcDate=s=>{const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());if(iso)return iso[0];const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s).trim());return m?`${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`:null};
function rcTag(d){d=String(d);if(/RWRD RDM|CASHREWARD/i.test(d))return T('Recompensa');if(/CHASE CREDIT CRD DES:EPAY/i.test(d))return T('Pago Chase');
 if(/Mobile Banking payment to CRD \d+|PAYMENT TO ACCT \d+/i.test(d))return T('Pago tarjeta BOA');if(/Zelle/i.test(d))return 'Zelle';if(/PAYROLL ?DD/i.test(d))return T('Nómina');return ''}
function rcParse(text){const R=rcCsv(text).filter(r=>r.some(x=>String(x).trim()!==''));
 const hi=R.findIndex(r=>r[0]==='Date'&&r[1]==='Description'&&r[2]==='Amount');
 if(hi>=0){const endR=R.slice(0,hi).find(r=>/^Ending balance/i.test(r[0]||''));const rows=R.slice(hi+1).map(r=>({d:rcDate(r[0]),desc:r[1]||'',a:rcNum(r[2])})).filter(x=>x.d&&x.a!=null);
  return {fmt:'boa',name:'Bank of America',rows,end:endR?rcNum(endR[2]):null}}
 const h=R.findIndex(r=>r.includes('Transaction Date')&&r.includes('Post Date')&&r.includes('Amount'));
 if(h>=0){const H=R[h],ix=k=>H.indexOf(k),td=ix('Transaction Date'),de=ix('Description'),am=ix('Amount');
  return {fmt:'chase',name:'Chase',rows:R.slice(h+1).map(r=>({d:rcDate(r[td]),desc:r[de]||'',a:rcNum(r[am])})).filter(x=>x.d&&x.a!=null),end:null}}
 // genérico: date,description,amount (fechas ISO o MM/DD/YYYY; negativo = cargo/salida)
 const g=R.findIndex(r=>r.map(x=>String(x).trim().toLowerCase()).includes('date')&&r.map(x=>String(x).trim().toLowerCase()).includes('amount'));
 if(g>=0){const H=R[g].map(x=>String(x).trim().toLowerCase()),dI=H.indexOf('date'),sI=H.indexOf('description'),aI=H.indexOf('amount');
  return {fmt:'csv',name:'CSV',rows:R.slice(g+1).map(r=>({d:rcDate(r[dI]),desc:sI>=0?r[sI]||'':'',a:rcNum(r[aI])})).filter(x=>x.d&&x.a!=null),end:null}}
 return null}
// ---------- movimientos de la app por cuenta ----------
function rcCardName(e){const cm=S.months[e.cardMonth],c=cm&&(cm.cards||[]).find(c=>c.id===e.cardId);return c?c.name:String(e.desc||'').replace(/^Pago /,'')}
function rcApp(acct){const isC=acct!=='deb',cn=isC?acct.slice(5):'',deb=debE(L()).name,o=[];
 keys().forEach(k=>{const m=S.months[k],E={};(m.events||[]).forEach(e=>E[e.id]=e);
  moves(m).forEach(x=>{if(x.kind==='held'||x.kind==='heldsend')return;const e=E[x.id];let a=null;
   if(x.kind==='adjust'&&e){if(!isC&&e.lineKind==='income'&&same(e.lineName,deb))a=r2(e.diff);if(isC&&e.lineKind==='cards'&&same(e.lineName,cn))a=-r2(e.diff);if(a!=null)o.push({d:dKey(x.date),desc:x.desc||DN(x.cat),a,adj:1});return}
   if(isC&&x.kind==='cardpay'&&e){if(same(rcCardName(e),cn))o.push({d:dKey(x.date),desc:x.desc||DN(x.cat),a:r2(+e.amount||0)});return}
   if(!isC&&x.method==='deb')a=r2(x.amount);if(isC&&x.method==='card:'+cn)a=r2(x.amount);
   if(a!=null&&Math.abs(a)>0.004)o.push({d:dKey(x.date),desc:(x.desc||DN(x.cat)),cat:DN(x.cat),a})})});
 o.sort((a,b)=>String(a.d).localeCompare(String(b.d)));
 const adj=o.filter(x=>x.adj).map(x=>x.d).sort()[0],start=adj||(o[0]&&o[0].d)||today(),strict=!!adj;
 const bal=isC?-r2(+((L().cards||[]).find(c=>same(c.name,cn))||{}).amount||0):r2(+debE(L()).amount||0);
 return {moves:o.filter(x=>!x.adj&&(strict?x.d>start:x.d>=start)),start,strict,bal}}
// ---------- comparar ----------
const rcDd=(a,b)=>Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5);
function rcCompare(acct,bank,bankBal,pend){const A=rcApp(acct),B=bank.rows.filter(r=>A.strict?r.d>A.start:r.d>=A.start).map(r=>({...r})),ok=[],ap=A.moves.map(x=>({...x}));
 const cand=[];ap.forEach((x,i)=>B.forEach((b,j)=>{const dd=rcDd(x.d,b.d);if(Math.abs(x.a-b.a)<0.005&&dd>=-2&&dd<=5)cand.push([Math.abs(dd),i,j])}));
 cand.sort((p,q)=>p[0]-q[0]);cand.forEach(([,i,j])=>{if(ap[i].m||B[j].m)return;ap[i].m=B[j].m=1;ok.push({app:ap[i],bank:[B[j]]})});
 ap.filter(x=>!x.m).forEach(x=>{const fr=B.filter(b=>!b.m&&rcDd(x.d,b.d)>=-2&&rcDd(x.d,b.d)<=5);
  for(let i=0;i<fr.length&&!x.m;i++)for(let j=i+1;j<fr.length;j++)if(Math.abs(fr[i].a+fr[j].a-x.a)<0.005){x.m=fr[i].m=fr[j].m=1;ok.push({app:x,bank:[fr[i],fr[j]],pair:1});break}});
 const P=(pend||[]).filter(p=>p.a!=null&&Math.abs(p.a)>0.004).map(p=>({...p}));
 ap.filter(x=>!x.m).forEach(x=>{const p=P.find(p=>!p.m&&Math.abs(p.a-x.a)<0.005);if(p){x.m=p.m=1;ok.push({app:x,pend:p})}});
 const appOnly=ap.filter(x=>!x.m),bankOnly=[...B.filter(b=>!b.m),...P.filter(p=>!p.m).map(p=>({...p,pend:1}))];
 const pendT=r2(P.reduce((s,p)=>s+p.a,0)),today_=r2(bankBal+pendT),miss=r2(appOnly.reduce((s,x)=>s+x.a,0)),exp=r2(today_+miss),diff=r2(exp-A.bal);
 return {A,ok,appOnly,bankOnly,bankBal,pendT,today:today_,miss,exp,diff}}
// ---------- UI ----------
const RC={bank:null,pend:[]};
const rcAccts=()=>[['deb',DN(debE(L()).name||'')||T('Débito')],...(L().cards||[]).filter(c=>c.name).map(c=>['card:'+c.name,'💳 '+DN(c.name)])];
function rcCard(){return `<div class="card" id="rccard"><h2>${T('🏦 Cuadrar con el banco')}</h2><div class="muted">${T('Compara tus movimientos con el archivo del banco. No cambia nada.')}</div><button class="sec" id="rcopen" style="width:100%;margin-top:8px" onclick="rcDlg()">${T('Cuadrar con el banco')}</button></div>`}
{const _r=rep;rep=function(){const h=_r(),c=rcCard();const i=h.indexOf('<div class="card defcol" id="acccard"');return i<0?h+c:h.slice(0,i)+c+h.slice(i)}}
const rcIsC=()=>(document.getElementById('rcacct')||{}).value!=='deb';
function rcDlg(){RC.bank=null;RC.pend=[];const last=localStorage.getItem('finanzas-recon-acct'),ac=rcAccts(),sel=ac.some(a=>a[0]===last)?last:'deb';
 dlg().innerHTML=`<h2>${T('Cuadrar con el banco')}</h2><div class="muted">${T('Compara tus movimientos con el archivo del banco. No cambia nada.')}</div>
 <p><label class="muted" for="rcacct">${T('Cuenta')}</label><select id="rcacct" class="name" style="width:100%" onchange="localStorage.setItem('finanzas-recon-acct',this.value);rcBalLbl();document.getElementById('rcres').innerHTML=''">${ac.map(([v,l])=>`<option value="${esc(v)}"${v===sel?' selected':''}>${esc(l)}</option>`).join('')}</select></p>
 <p><label class="muted" for="rcfile">${T('Archivo del banco (CSV)')}</label><input id="rcfile" type="file" accept=".csv,text/csv" style="width:100%" onchange="rcFile(this.files[0])"><div id="rcinfo" class="muted"></div></p>
 <p><label class="muted" for="rcbal" id="rcball"></label><input id="rcbal" class="name" type="number" inputmode="decimal" step="0.01" style="width:100%"></p>
 <div class="muted" style="margin-top:6px">${T('En proceso en el banco (opcional)')}</div><div id="rcpl"></div>
 <div class="grid" style="margin-top:6px"><button class="sec" id="rcadd" onclick="rcAdd()">${T('+ Añadir línea')}</button><button class="sec" id="rcscanb" onclick="document.getElementById('rcscan').click()">${T('📷 Escanear foto')}</button></div><input id="rcscan" type="file" accept="image/*" hidden onchange="rcScan(this.files[0])">
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cerrar')}</button><button id="rcgo" onclick="rcGo()">${T('Comparar')}</button></div><div id="rcres"></div>`;
 rcBalLbl();rcDraw();if(!dlg().open)dlg().showModal()}
function rcBalLbl(){const l=document.getElementById('rcball');if(l)l.textContent=T(rcIsC()?'Saldo actual de la tarjeta (lo que debes)':'Saldo en el banco')}
function rcFile(file){if(!file)return;file.text().then(t=>{const b=rcParse(t),inf=document.getElementById('rcinfo');
 if(!b){RC.bank=null;inf.innerHTML=`<span class="neg">${T('No reconozco este archivo. Usa el CSV de Bank of America (débito) o de Chase (Download account activity).')}</span>`;return}
 RC.bank=b;inf.textContent=T('{0} · {1} movimientos',b.name,b.rows.length)+(b.end!=null?' · '+T('Saldo en el banco')+' '+f(b.end):'');if(b.end!=null&&!rcIsC())document.getElementById('rcbal').value=b.end})}
function rcDraw(){const e=document.getElementById('rcpl');if(!e)return;e.innerHTML=RC.pend.map((p,i)=>`<div class="row rcp" style="gap:6px"><input class="rcpd" placeholder="${T('Descripción')}" value="${esc(p.desc||'')}" style="flex:2" oninput="RC.pend[${i}].desc=this.value"><input class="rcpa" type="number" inputmode="decimal" step="0.01" placeholder="${T('Monto')}" value="${p.a!=null?p.a:''}" style="flex:1;max-width:110px" oninput="RC.pend[${i}].a=rcNum(this.value)"><button class="del" onclick="RC.pend.splice(${i},1);rcDraw()">✕</button></div>`).join('')}
function rcAdd(){RC.pend.push({desc:'',a:null});rcDraw()}
async function rcScan(file){if(!file)return;const inf=document.getElementById('rcinfo'),old=inf.innerHTML;inf.textContent=T('Leyendo la foto…');
 try{const b64=await scanResize(file);const txt=await window.fbScan(b64,'This is a bank app screenshot of PROCESSING / PENDING transactions. Return ONLY JSON {"lines":[{"desc":string,"amount":number}]} with one entry per transaction; amount negative for charges/withdrawals, positive for deposits/credits. No other text.','image/jpeg');
  const j=JSON.parse(String(txt).replace(/^```(json)?|```$/g,'').trim());(j.lines||[]).forEach(l=>{const a=rcNum(l.amount);if(a!=null)RC.pend.push({desc:String(l.desc||'').slice(0,60),a})});inf.innerHTML=old;rcDraw()}
 catch(e){console.warn('rcscan',e);inf.innerHTML=old+`<div class="neg">${T('No se pudo leer la foto. Añade las líneas a mano.')}</div>`}}
function rcGo(){if(!RC.bank)return alert(T('Elige el archivo del banco'));const acct=document.getElementById('rcacct').value,v=rcNum(document.getElementById('rcbal').value);if(v==null)return alert(T('Pon el saldo en el banco'));
 const isC=acct!=='deb',R=rcCompare(acct,RC.bank,isC?-v:v,RC.pend),sh=x=>isC?-x:x,fs=a=>(a<0?'−':'+')+f(Math.abs(a));
 const li=(d,desc,a,extra)=>`<div class="row" style="font-size:14px"><span class="n">${esc(desc)}<div class="muted">${d?fdate(d):''}${extra?' · '+extra:''}</div></span><b>${fs(a)}</b></div>`;
 const sec=(id,t,L)=>`<h3 id="${id}" style="margin:14px 0 4px;font-size:15px">${t} (${L.length})</h3>${L.join('')||`<div class="muted">${T('Nada.')}</div>`}`;
 const z=Math.abs(R.diff)<0.005;
 document.getElementById('rcres').innerHTML=`<div class="card" id="rcsum" style="margin-top:12px">
 <div class="muted">${T('Se compara desde el {0} (inicio de la app para esta cuenta).',fdate(R.A.start))}</div>
 <div class="row"><span class="n">${T('Saldo banco (archivo)')}</span><span>${f(sh(R.bankBal))}</span></div>
 ${Math.abs(R.pendT)>0.004?`<div class="row"><span class="n">${T('+ en proceso')}</span><span>${fs(sh(R.pendT))}</span></div><div class="row"><span class="n">${T('= Saldo banco hoy')}</span><span>${f(sh(R.today))}</span></div>`:''}
 <div class="row"><span class="n">${T('+ lo que falta en el banco')}</span><span>${fs(sh(R.miss))}</span></div>
 <div class="row"><span class="n"><b>${T('= Esperado')}</b></span><b>${f(sh(R.exp))}</b></div>
 <div class="row"><span class="n">${T('Saldo en la app')}</span><span>${f(sh(R.A.bal))}</span></div>
 <div id="rcdiff" style="text-align:center;font-size:22px;font-weight:700;margin-top:8px;color:${z?'#15803d':'#b91c1c'}">${z?T('✅ Todo cuadra'):T('Diferencia')+': '+fs(sh(R.diff))}</div></div>
 ${sec('rcok','✅ '+T('Cuadra'),R.ok.map(o=>li(o.app.d,o.app.desc,o.app.a,o.pend?T('en proceso'):o.pair?T('suma de 2 del banco'):fdate(o.bank[0].d)+' · '+esc((rcTag(o.bank[0].desc)||o.bank[0].desc).slice(0,28)))))}
 ${sec('rcapp','⏳ '+T('En la app, falta en el banco'),R.appOnly.map(x=>li(x.d,x.desc,x.a)))}
 ${sec('rcbank','❓ '+T('En el banco, falta en la app'),R.bankOnly.map(b=>li(b.d,(rcTag(b.desc)?rcTag(b.desc)+' · ':'')+b.desc,b.a,b.pend?T('en proceso'):'')))}`;
 window.__rc=R;document.getElementById('rcsum').scrollIntoView({block:'start'})}
