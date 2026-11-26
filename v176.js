// v176 (Joe): 📅 Calendario. Lee (solo lectura) los turnos de Google Calendar de Joe
// («Walmart (Front End Checkout)» y «YoWash (turno PM)»; estado en la 1.ª línea de la
// descripción: «Estado: confirmado/estimado/conflicto») y calcula sueño, horas libres y
// salario estimado. Vistas Día / Semana / Mes, ‹ › por período y «📄 PDF del período».
// Reglas (Joe): despertar 1 h 10 antes de un turno de mañana (Walmart 6:00 → 4:50);
// ~20 min de camino; después de cerrar YoWash (22:30) + camino + 1 h en casa (no es
// libre) → a dormir ~00:05; noche libre y Walmart al día siguiente → a dormir 22:00.
// Badge de sueño: rojo <5 h, ámbar 5–7 h, verde ≥7 h. Los eventos se guardan solo en
// este dispositivo (localStorage), no en la nube. Nada se escribe en el calendario.
(function(){
if(typeof render!=='function'||typeof cfg!=='function'||typeof navLbl!=='function'||typeof EN!=='object')return; // enlace de Tony (v.html): no aplica
Object.assign(EN,{"Calendario":"Calendar","Día":"Day","Semana":"Week","Mes":"Month","horas de trabajo":"work hours","horas libres":"free hours",
 "sueño (promedio)":"sleep (average)","📄 PDF del período":"📄 Period PDF","Conectar Google Calendar":"Connect Google Calendar","estimado":"estimated",
 "Salario estimado":"Estimated pay","bruto":"gross","neto aprox.":"approx. net","Libre":"Free","Sin turnos · día libre":"No shifts · day off","Conflicto":"Conflict",
 "Actualizar":"Refresh","Sueño":"Sleep","Casa · no cuenta como libre":"Home · not free time","a dormir {0}":"bed {0}","hoy":"today"});
const CAL_K='finanzas-cal-cache',TOK_K='finanzas-cal-tok',UI_K='finanzas-cal-ui';
const DOW=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],DOWL=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],MESL=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const TRAVEL=20,PREP=50,HOME=60,LATE=21*60,FREE_WAKE=7*60+30,FREE_BED=23*60;
const ls=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
const ss=(k,d)=>{try{const v=JSON.parse(sessionStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
let UI=Object.assign({view:'dia',d:null},ls(UI_K,{}));const saveUI=()=>localStorage.setItem(UI_K,JSON.stringify(UI));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const add=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return iso(d)};
const tday=()=>typeof today==='function'?today():iso(new Date());
const hm=m=>{m=((Math.round(m)%1440)+1440)%1440;return Math.floor(m/60)+':'+pad(m%60)};
const dur=m=>{m=Math.round(m);const h=Math.floor(m/60),r=m%60;return r?h+'h '+pad(r):h+'h'};
const money=n=>typeof f==='function'?f(n):'$'+(+n||0).toFixed(2);
const E=s=>typeof esc==='function'?esc(s):String(s);
// ---------- datos ----------
const cache=()=>ls(CAL_K,{items:[],at:0,ranges:[]});
const tok=()=>{const t=ss(TOK_K,null);return t&&t.exp>Date.now()?t.token:null};
const jobOf=s=>/^\s*walmart/i.test(s||'')?'wm':/^\s*yowash/i.test(s||'')?'yw':null;
const stOf=desc=>{const first=String(desc||'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim().split('\n')[0]||'';
 const m=first.match(/estado\s*:\s*(confirmado|estimado|conflicto)/i);return m?m[1].toLowerCase():'confirmado'};
function norm(ev){const j=jobOf(ev.summary);if(!j||!ev.start||!ev.start.dateTime||!ev.end||!ev.end.dateTime||ev.status==='cancelled')return null;
 const a=new Date(ev.start.dateTime),b=new Date(ev.end.dateTime);return {id:ev.id,job:j,day:iso(a),s:a.getHours()*60+a.getMinutes(),e:a.getHours()*60+a.getMinutes()+Math.round((b-a)/60000),st:stOf(ev.description),t:ev.summary}}
async function fetchRange(from,to){const t=tok();if(!t){const e=new Error('auth');e.code='auth';throw e}
 const out=[];let page='';for(let i=0;i<10;i++){
  const u='https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin='+encodeURIComponent(pd(from).toISOString())+'&timeMax='+encodeURIComponent(pd(add(to,1)).toISOString())+(page?'&pageToken='+encodeURIComponent(page):'');
  const r=await fetch(u,{headers:{Authorization:'Bearer '+t}});
  if(!r.ok){let j={};try{j=await r.json()}catch(e){}const e=new Error((j.error&&j.error.message)||('HTTP '+r.status));e.code=r.status===401?'auth':(r.status===403&&/not been used|disabled|accessNotConfigured/i.test(JSON.stringify(j)))?'api':'http';e.status=r.status;throw e}
  const j=await r.json();(j.items||[]).forEach(x=>{const n=norm(x);if(n)out.push(n)});page=j.nextPageToken;if(!page)break}
 const C=cache();C.items=C.items.filter(x=>x.day<from||x.day>to).concat(out).sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.s-b.s);C.at=Date.now();
 C.ranges=(C.ranges||[]).concat([[from,to]]).slice(-12);localStorage.setItem(CAL_K,JSON.stringify(C));return out.length}
function spanFor(){const a=UI.d||tday(),y=+a.slice(0,4),m=+a.slice(5,7);const first=iso(new Date(y,m-1,1)),last=iso(new Date(y,m,0));return [add(first,-70),add(last,7)]}
// ---------- reglas ----------
const shifts=d=>{const L=cache().items.filter(x=>x.day===d).map(x=>Object.assign({},x));
 L.forEach((x,i)=>{const nx=L[i+1];if(nx&&nx.s-x.e<TRAVEL){nx.cf=1;nx.cfMsg=`${jobName(x.job)} termina ${hm(x.e)} y ${jobName(nx.job)} empieza ${hm(nx.s)}. Faltan ${TRAVEL} min de camino.`}if(x.st==='conflicto')x.cf=1});return L};
const jobName=j=>j==='wm'?'Walmart':'YoWash';
function wakeOf(d,L){L=L||shifts(d);const f0=L[0];return f0&&f0.s<=12*60?f0.s-TRAVEL-PREP:FREE_WAKE}
function bedOf(d,L){L=L||shifts(d);const last=L[L.length-1];
 if(last&&last.e>=LATE)return last.e+TRAVEL+HOME+15;
 const n=shifts(add(d,1))[0];return n&&n.s<=8*60?22*60:FREE_BED}
function dayModel(d){const L=shifts(d),wake=wakeOf(d,L),bed=bedOf(d,L),sleep=1440-bedOf(add(d,-1))+wake;
 const seg=[];const put=(a,b,k,x)=>{if(b>a)seg.push(Object.assign({a,b,k},x||{}))};
 put(0,wake,'sleep');let cur=wake;
 L.forEach((x,i)=>{const prev=L[i-1],tra=prev?Math.min(TRAVEL,Math.max(0,x.s-prev.e)):TRAVEL;
  if(tra>0)put(Math.max(cur,x.s-tra),x.s,'travel');if(x.s-tra>cur)put(cur,x.s-tra,'free');put(x.s,x.e,'shift',{x});cur=Math.max(cur,x.e)});
 const last=L[L.length-1];if(last){put(cur,cur+TRAVEL,'travel');cur+=TRAVEL;if(last.e>=LATE){put(cur,Math.min(bed,cur+HOME),'home');cur=Math.min(bed,cur+HOME)}}
 put(cur,Math.min(bed,1440),'free');if(bed<1440)put(bed,1440,'sleep');
 const free=seg.filter(s=>s.k==='free'&&s.a>=wake).reduce((t,s)=>t+s.b-s.a,0),work=L.reduce((t,x)=>t+x.e-x.s,0);
 return {d,L,wake,bed,sleep,free,work,seg}}
// ---------- salario ----------
// Solo horas PROGRAMADAS (Joe). Walmart: $/h menos almuerzo sin pago (turnos > X h); neto solo si Joe pone su retención
// (talón pendiente). YoWash (talón real): semana de pago jue–mié, cheque el jueves 8 días después del cierre; primeras
// 40 h a $16, extra a 1.5×; retención ≈ 14.37 % (SS 6.2 + Medicare 1.45 + federal ~6.72). El jueves de cobro, cuando
// el cheque real está registrado, se muestra estimado vs real.
// Walmart (talón): quincenal sáb–vie, depósito el jueves 6 días después; extra >40 h/semana a 1.5×; impuestos ~10.86 %;
// después de impuestos: ONE SAVINGS y W+ (ajustes). El total del cheque menos los OnePay ya cobrados = lo que llega al banco.
const PAY=()=>{const P=Object.assign({wm:15,yw:16,lunch:30,lunchOver:6,ywOT:40,ywWith:14.37,wmOT:40,wmWith:10.86,wmSave:16.07,wmMbr:4.62},S.calPay||{});if(!(P.wmWith>=0))P.wmWith=10.86;return P};
const paidMin=x=>{const P=PAY(),m=x.e-x.s;return x.job==='wm'&&m>P.lunchOver*60?m-P.lunch:m};
const daysIn=(a,b)=>{const o=[];for(let d=a;d<=b;d=add(d,1))o.push(d);return o};
const covered=(a,b)=>(cache().ranges||[]).some(([x,y])=>x<=a&&y>=b);
const ywGross=h=>{const P=PAY();return r2(Math.min(h,P.ywOT)*P.yw+Math.max(0,h-P.ywOT)*P.yw*1.5)};
const ywNet=g=>r2(g*(1-PAY().ywWith/100));
const wmG=h=>{const P=PAY();return r2(Math.min(h,P.wmOT)*P.wm+Math.max(0,h-P.wmOT)*P.wm*1.5)};
const wmTax=g=>r2(g*PAY().wmWith/100),wmNet=g=>r2(g-wmTax(g));
const wmWeek=d=>add(d,-((pd(d).getDay()-6+7)%7));   // sábado que abre la semana de Walmart
const epIn=(a,b)=>typeof epAll==='function'?r2(epAll().filter(e=>e.date>a&&e.date<=b).reduce((t,e)=>t+(+e.amount||0),0)):0;
const ywWeek=d=>add(d,-((pd(d).getDay()-4+7)%7));   // jueves que abre la semana de pago
const hrs=(a,b,job)=>daysIn(a,b).flatMap(x=>shifts(x)).filter(x=>x.job===job).reduce((t,x)=>t+paidMin(x)/60,0);
// semanas de pago que tocan el período; si la semana cae a medias se prorratea por horas
function wk(a,b,job,wof,gf){let g=0,h=0;[...new Set(daysIn(a,b).map(wof))].forEach(w=>{const we=add(w,6),all=hrs(w,we,job),inn=hrs(w<a?a:w,we>b?b:we,job);if(!(all>0)||!(inn>0))return;g+=gf(all)*inn/all;h+=inn});return [r2(g),h]}
function pay(a,b){const [gwm,hwm]=wk(a,b,'wm',wmWeek,wmG),[gyw,hyw]=wk(a,b,'yw',ywWeek,ywGross);
 return {hwm,wm:gwm,hyw,yw:gyw,tax:{wm:wmTax(gwm),yw:r2(gyw-ywNet(gyw))},net:{wm:wmNet(gwm),yw:ywNet(gyw)}}}
// cheques con fecha de cobro dentro del período: estimado (horas programadas de su semana de pago) vs real
function checksIn(a,b){const out=[],P=PAY(),now=tday();
 daysIn(a,b).filter(d=>pd(d).getDay()===4).forEach(d=>{const pa=add(d,-14),pb=add(d,-8),h=hrs(pa,pb,'yw'),c=(S.checks||[]).find(x=>(x.date===d||x.depositedOn===d)&&x.status==='deposited');
  if(!(h>0)&&!c)return;out.push({job:'yw',d,pa,pb,h,est:covered(pa,pb)?ywNet(ywGross(h)):null,net:true,real:c?r2(+c.amount):null,fut:d>now})});
 (typeof wmPaydays==='function'?wmPaydays(a,b):[]).forEach(d=>{const pa=add(d,-19),pb=add(d,-6),h=hrs(pa,pb,'wm'),g=r2(wmG(hrs(pa,add(pa,6),'wm'))+wmG(hrs(add(pa,7),pb,'wm'))),rv=((S.wm&&S.wm.paid)||{})[d];
  if(!(h>0)&&!(+rv>0))return;const tx=wmTax(g),dd=r2((+P.wmSave||0)+(+P.wmMbr||0)),tot=r2(Math.max(0,g-tx-dd)),ep=epIn(add(d,-14),d),ok=covered(pa,pb),real=+rv>0?r2(+rv):null;
  out.push({job:'wm',d,pa,pb,h,gross:g,tax:tx,ded:dd,ep,est:ok?tot:null,bank:ok?r2(Math.max(0,tot-ep)):null,realBank:real!=null?r2(Math.max(0,real-ep)):null,net:true,real,fut:d>now})});
 return out.sort((x,y)=>x.d<y.d?-1:1)}
// ---------- período ----------
function period(){const a=UI.d||tday(),v=UI.view;
 if(v==='dia')return {a,b:a,lbl:DOWL[pd(a).getDay()]+' '+pd(a).getDate()+' '+MES[pd(a).getMonth()]};
 if(v==='semana'){const w=(pd(a).getDay()+6)%7,s=add(a,-w),e=add(s,6);return {a:s,b:e,lbl:pd(s).getDate()+(pd(s).getMonth()!==pd(e).getMonth()?' '+MES[pd(s).getMonth()]:'')+' – '+pd(e).getDate()+' '+MES[pd(e).getMonth()]}}
 const y=pd(a).getFullYear(),m=pd(a).getMonth();return {a:iso(new Date(y,m,1)),b:iso(new Date(y,m+1,0)),lbl:MESL[m]+' '+y}}
function stats(p){const D=daysIn(p.a,p.b).map(dayModel),g=pay(p.a,p.b),ck=checksIn(p.a,p.b);
 return {D,work:D.reduce((t,x)=>t+x.work,0),free:D.reduce((t,x)=>t+x.free,0),sleep:D.reduce((t,x)=>t+x.sleep,0)/Math.max(1,D.length),g,net:g.net,ck,cf:D.flatMap(x=>x.L.filter(y=>y.cfMsg))}}
// ---------- vista ----------
const badge=m=>{const h=m/60,c=h<5?'r':h<7?'a':'g';return `<span class="cbdg ${c}">😴 ${dur(m)}</span>`};
const tag=x=>x.st==='estimado'?`<span class="ctag">${T('estimado')}</span>`:'';
function sumCard(s,p){const g=s.g,tot=r2(g.wm+g.yw),nt=r2(s.net.wm+s.net.yw),hh=h=>(Math.round(h*10)/10)+' h';
 const line=(n,h,sub,gv,nv)=>h>0.01?`<div class="row"><span class="n">${n}<div class="muted">${sub}</div></span><span style="text-align:right">${money(gv)}${nv!=null?`<div class="muted">${T('impuestos')} −${money(r2(gv-nv))} · ${T('neto')} ${money(nv)}</div>`:''}</span></div>`:'';
 return `<div class="card" id="calsum"><div class="csum"><div><b>${dur(s.work)}</b><span class="muted">${T('horas de trabajo')}</span></div><div><b>${dur(s.free)}</b><span class="muted">${T('horas libres')}</span></div><div><b>${dur(s.sleep)}</b><span class="muted">${T('sueño (promedio)')}</span></div></div>
 <div id="calpay" style="margin-top:10px"><div class="row" style="border-bottom:1px solid #eef2f6"><b class="n">💵 ${T('Salario estimado')} <span class="muted">(${T('bruto')})</span></b><b>${money(tot)}</b></div>
 ${line('🏪 Walmart',g.hwm,hh(g.hwm)+' programadas (sin almuerzo) · extra >'+PAY().wmOT+' h/sem a 1.5×',g.wm,s.net.wm)}${line('💼 YoWash',g.hyw,hh(g.hyw)+' programadas · extra >'+PAY().ywOT+' h/sem a 1.5×',g.yw,s.net.yw)}
 <div class="row"><span class="n muted">${T('neto aprox.')} (${T('después de impuestos')})</span><b>${money(nt)}</b></div></div>${ckCard(s.ck)}</div>`}
function ckCard(L){if(!L.length)return '';const sd=d=>DOW[pd(d).getDay()].toLowerCase()+' '+pd(d).getDate()+' '+MES[pd(d).getMonth()];
 return `<div id="calck" style="margin-top:10px"><div class="row" style="border-bottom:1px solid #eef2f6"><b class="n">🧾 Cheques: estimado vs real</b></div>
 <div class="ckh"><span></span><span>Estimado</span><span>Real</span><span>Dif.</span></div>`+L.map(c=>{const df=c.real!=null&&c.est!=null?r2(c.real-c.est):null;
  return `<div class="ckr" data-d="${c.d}" data-j="${c.job}"><span>${c.job==='wm'?'🏪 Walmart':'💼 YoWash'}<div class="muted">${sd(c.d)} · semana ${pd(c.pa).getDate()}/${pd(c.pa).getMonth()+1}–${pd(c.pb).getDate()}/${pd(c.pb).getMonth()+1}${c.net?'':' · bruto'}</div></span>
  <span>${c.est!=null?money(c.est):'—'}</span><span>${c.real!=null?'<b>'+money(c.real)+'</b>':`<span class="muted">${c.fut?'llega '+sd(c.d):'falta registrar'}</span>`}</span>
  <span class="${df==null?'':df>=0?'pos':'neg'}">${df==null?'':(df>=0?'+':'−')+money(Math.abs(df))}</span>${c.job==='wm'&&c.gross>0?`<div class="ckb muted">${T('bruto')} ${money(c.gross)} · ${T('impuestos')} −${money(c.tax)} · ${T('ahorro + W+')} −${money(c.ded)}${c.ep>0?` · OnePay −${money(c.ep)}`:''} → <b>${T('al banco')} ${money(c.realBank!=null?c.realBank:c.bank)}</b>${c.realBank!=null?' (real)':''}</div>`:''}</div>`}).join('')+`</div>`}
const PH='var(--ph)';const top=m=>`calc(${(m-240)/60} * ${PH})`,hgt=m=>`calc(${m/60} * ${PH} - 2px)`;
function dayView(dm){const hrs=Array.from({length:21},(_,i)=>`<div class="chr" style="top:${top((i+4)*60)}"><span>${i+4}:00</span></div>`).join('');
 const blk=s=>{const a=Math.max(240,s.a),b=s.b;if(b<=a)return '';const sm=b-a<35,st=`top:${top(a)};height:${hgt(b-a)}`;let c='',t='';
  if(s.k==='sleep'){c='cbs';t=a===240&&s.b===dm.wake?`😴 ${T('Sueño')} ${hm(bedOf(add(dm.d,-1)))} → ${hm(dm.wake)} · <b>${dur(dm.sleep)}</b>`:`😴 ${T('a dormir {0}',hm(dm.bed))}`}
  else if(s.k==='free'){c='cbf';t=`${T('Libre')} · ${dur(b-a)}`}else if(s.k==='travel'){c='cbt';t=`🚗 ${dur(b-a)}`}else if(s.k==='home'){c='cbt';t=`🏠 ${T('Casa · no cuenta como libre')}${dm.bed>=1440?' · 😴 '+hm(dm.bed):''}`}
  else{const x=s.x;c=(x.job==='wm'?'cbw':'cby')+(x.st==='estimado'?' cest':'')+(x.cf?' ccf':'');t=`<b>${x.cf?'⚠️ ':''}${jobName(x.job)}</b> ${hm(x.s)} – ${hm(x.e)} ${tag(x)}${sm?'':`<br><span class="cmut">${x.cfMsg?E(x.cfMsg):dur(x.e-x.s)}</span>`}`}
  return `<div class="cblk ${c}${sm?' csm':''}" style="${st}">${t}</div>`};
 return `<div class="card" id="calday"><div class="ch3">${DOWL[pd(dm.d).getDay()]} ${pd(dm.d).getDate()} ${MES[pd(dm.d).getMonth()]}${dm.d===tday()?' · '+T('hoy'):''}<span>${badge(dm.sleep)}</span></div>
 <div class="ctl">${hrs}${dm.seg.map(blk).join('')}</div>${LEG}</div>`}
const LEG=`<div class="cleg"><span><i style="background:#2563eb"></i>Walmart</span><span><i style="background:#16a34a"></i>YoWash</span><span><i style="background:#6366f1"></i>${'Sueño'}</span><span><i style="border:1px dashed #64748b"></i>${'Estimado'}</span><span><i style="background:#dc2626"></i>${'Conflicto'}</span></div>`;
function dayCard(dm,sel){const rows=dm.L.map(x=>`<div class="csh ${x.job}${x.st==='estimado'?' est':''}${x.cf?' cf':''}"><span>${x.cf?'⚠️ ':''}<b>${jobName(x.job)}</b>${tag(x)}</span><span>${hm(x.s)} – ${hm(x.e)}</span></div>`).join('')||`<div class="muted" style="font-size:14px;padding:4px 0">${T('Sin turnos · día libre')}</div>`;
 const cf=dm.L.find(x=>x.cfMsg);
 return `<div class="card cdc${sel?' csel':''}" onclick="calGo('dia','${dm.d}')"><div class="ch3">${DOW[pd(dm.d).getDay()]} ${pd(dm.d).getDate()}${dm.d===tday()?' · '+T('hoy'):''}<span>${badge(dm.sleep)}</span></div>${rows}
 ${cf?`<div class="cwarnl">⚠️ ${E(cf.cfMsg)}</div>`:''}<div class="muted" style="font-size:13px;margin-top:4px">🌿 ${T('Libre')}: <b>${dur(dm.free)}</b></div></div>`}
function monthView(p,s){const first=pd(p.a),start=add(p.a,-((first.getDay()+6)%7));let c=['L','M','M','J','V','S','D'].map(x=>`<div class="cmh">${x}</div>`).join('');
 for(let i=0;i<42;i++){const d=add(start,i);if(i>=35&&d>p.b)break;const dm=dayModel(d),o=d<p.a||d>p.b,h=dm.sleep/60,col=h<5?'#dc2626':h<7?'#d97706':'#16a34a';
  const bars=dm.L.map(x=>`<div class="cbar ${x.cf?'bC':x.job==='wm'?'bW':x.st==='estimado'?'bE':'bY'}" title="${jobName(x.job)} ${hm(x.s)}–${hm(x.e)}"><span>${hm(x.s)}–${hm(x.e)}</span></div>`).join('');
  c+=`<div class="cmd${o?' o':''}${d===UI.d?' csel':''}" onclick="calGo('dia','${d}')"><span class="cn">${pd(d).getDate()}${dm.L.some(x=>x.cf)?' ⚠️':''}</span>${bars}<span style="flex:1"></span><span class="csb" style="background:${col}">${(Math.round(h*10)/10).toFixed(1)}h</span></div>`}
 const sel=dayModel(UI.d&&UI.d>=p.a&&UI.d<=p.b?UI.d:(tday()>=p.a&&tday()<=p.b?tday():p.a));
 return `<div class="cmonth"><div class="card" style="padding:10px"><div class="cmg">${c}</div>${LEG}<div class="muted" style="font-size:12px;margin-top:6px">Toca un día para ver su línea de tiempo. Número abajo = horas de sueño (rojo &lt;5h, ámbar 5–7h, verde ≥7h).</div></div>${dayCard(sel,true)}</div>`}
function connectView(err){return `<div class="card" id="calconnect" style="text-align:center;padding:22px 16px"><div style="font-size:46px">📅</div><h3 style="margin:6px 0">${T('Calendario')}</h3>
 <div style="font-size:15px;color:#334155;margin:6px 0 14px">Ve tus turnos de <b>Walmart</b> y <b>YoWash</b>, cuánto duermes, tus horas libres y el salario estimado.</div>
 <button id="calconn" style="width:100%;max-width:360px" onclick="calConnect()">🔗 ${T('Conectar Google Calendar')}</button>
 ${err?`<div class="cwarn" style="text-align:left;margin-top:12px">⚠️ ${E(err)}</div>`:''}
 <div class="muted" style="font-size:12px;margin-top:12px;text-align:left">• Solo lectura: la app no cambia nada en tu calendario.<br>• Lee los eventos «Walmart (Front End Checkout)» y «YoWash (turno PM)» de tu calendario principal, y el estado de la 1.ª línea de la descripción («Estado: confirmado / estimado / conflicto»).<br>• Usa tu misma cuenta de Google; Google te pedirá el permiso una vez.<br>• Los turnos se guardan solo en este dispositivo.</div></div>`}
let lastErr='',busy=false;
const errMsg=e=>e&&e.code==='api'?'Google Calendar API no está activada en el proyecto de Firebase. (Ver nota para Joe.)':e&&e.code==='auth'?'Tu permiso de Google Calendar venció. Toca «Actualizar».':e&&/popup|cancel/i.test(String(e.code||e.message))?'Se cerró la ventana de Google antes de terminar.':e&&/user-mismatch/i.test(String(e.code))?'Elige la misma cuenta de Google con la que entras a la app.':'No se pudo leer Google Calendar: '+((e&&(e.message||e.code))||'');
function calView(){const C=cache(),has=C.at>0;if(!has)return `<div id="cal">${connectView(lastErr)}</div>`;
 if(!UI.d)UI.d=tday();const p=period(),s=stats(p),v=UI.view;
 const seg=['dia','semana','mes'].map(k=>`<button id="calv-${k}" class="${k===v?'on':''}" onclick="calGo('${k}')">${T(k==='dia'?'Día':k==='semana'?'Semana':'Mes')}</button>`).join('');
 const ago=Math.round((Date.now()-C.at)/60000),upd=`<div class="muted ccupd">Google Calendar · ${ago<1?'ahora':'hace '+(ago<60?ago+' min':Math.round(ago/60)+' h')} <button class="sec" id="calref" onclick="calRefresh()">🔄 ${T('Actualizar')}</button></div>`;
 const warn=(v==='dia'?s.cf:[]).map(x=>`<div class="cwarn">⚠️ <b>${T('Conflicto')}:</b> ${E(x.cfMsg)}</div>`).join('')+(lastErr?`<div class="cwarn">⚠️ ${E(lastErr)}</div>`:'');
 const body=v==='dia'?dayView(s.D[0]):v==='semana'?`<div class="cwk">${s.D.map(x=>dayCard(x,x.d===tday())).join('')}</div>`:monthView(p,s);
 return `<div id="cal" class="v-${v}"><div class="cseg">${seg}</div><div class="cper"><button class="sec" id="calprev" onclick="calMove(-1)">‹</button><b>${p.lbl}</b><button class="sec" id="calnext" onclick="calMove(1)">›</button></div>
 <div class="cgrid"><div class="cside">${sumCard(s,p)}${warn}<button id="calpdf" style="width:100%;margin-bottom:12px" onclick="calPDF()">📄 ${T('PDF del período')}</button>${upd}</div><div class="cmain">${body}</div></div></div>`}
// ---------- acciones ----------
window.calGo=(v,d)=>{UI.view=v;if(d)UI.d=d;saveUI();render();scrollTo(0,0)};
window.calMove=n=>{const a=UI.d||tday(),v=UI.view;if(v==='dia')UI.d=add(a,n);else if(v==='semana')UI.d=add(a,7*n);else{const x=pd(a);UI.d=iso(new Date(x.getFullYear(),x.getMonth()+n,1))}saveUI();render();maybeFetch()};
async function doFetch(){const [a,b]=spanFor();busy=true;try{await fetchRange(a,b);lastErr=''}catch(e){lastErr=errMsg(e);if(e.code==='auth')sessionStorage.removeItem(TOK_K)}finally{busy=false}render()}
window.calConnect=async()=>{lastErr='';if(typeof window.fbCalAuth!=='function'){lastErr='Inicia sesión con Google en Configuración › Nube y vuelve a intentar.';render();return}
 try{const t=await window.fbCalAuth();sessionStorage.setItem(TOK_K,JSON.stringify(t));await doFetch()}catch(e){lastErr=errMsg(e);render()}};
window.calRefresh=async()=>{if(!tok())return calConnect();await doFetch()};
function maybeFetch(){const [a,b]=spanFor();if(tok()&&!busy&&!covered(a,b))doFetch()}
// ---------- PDF ----------
window.calPDF=async()=>{await loadPDF();const p=period(),s=stats(p),d=new jspdf.jsPDF({unit:'pt',format:'letter'}),X=48,R=564;let y=0;
 const pt=x=>String(x??'').replace(/[–—]/g,'-').replace(/[^\x00-\xff]/g,'').trim();
 d.setFillColor(30,58,138);d.rect(0,0,612,64,'F');d.setTextColor(255);d.setFont('helvetica','bold');d.setFontSize(19);d.text(pt('Calendario · '+p.lbl),X,30);
 d.setFont('helvetica','normal');d.setFontSize(10);d.setTextColor(203,213,225);d.text(pt('Turnos de Google Calendar · '+p.a+' a '+p.b),X,48);d.setTextColor(15,23,42);y=92;
 const row=(l,v,b)=>{d.setFont('helvetica',b?'bold':'normal');d.setFontSize(10.5);d.text(pt(l),X,y);d.text(pt(v),R,y,{align:'right'});y+=15};
 row('Horas de trabajo',dur(s.work),1);row('Horas libres',dur(s.free));row('Sueño (promedio por noche)',dur(s.sleep));y+=4;
 row('Salario estimado (bruto)',money(r2(s.g.wm+s.g.yw)),1);row('  Walmart · '+(Math.round(s.g.hwm*10)/10)+' h pagadas',money(s.g.wm)+'  (impuestos -'+money(s.g.tax.wm)+', neto '+money(s.net.wm)+')');
 row('  YoWash · '+(Math.round(s.g.hyw*10)/10)+' h',money(s.g.yw)+'  (impuestos -'+money(s.g.tax.yw)+', neto '+money(s.net.yw)+')');
 s.ck.forEach(c=>row('  Cheque '+(c.job==='wm'?'Walmart':'YoWash')+' '+c.d+': estimado '+(c.est!=null?money(c.est):'-'),c.real!=null?'real '+money(c.real)+' ('+(c.real-c.est>=0?'+':'-')+money(Math.abs(r2(c.real-(c.est||0))))+')':(c.fut?'por llegar':'falta registrar'))||c.job==='wm'&&c.gross>0&&row('      bruto '+money(c.gross)+' - impuestos '+money(c.tax)+' - ahorro/W+ '+money(c.ded)+(c.ep>0?' - OnePay '+money(c.ep):''),'al banco '+money(c.realBank!=null?c.realBank:c.bank)));y+=10;
 const cols=[['Día',110],['Turnos',250],['Sueño',70],['Libre',86]],head=()=>{d.setFillColor(241,245,249);d.rect(X,y-11,R-X,16,'F');d.setFont('helvetica','bold');d.setFontSize(9.5);let x=X;cols.forEach(([c,w])=>{d.text(c,x+3,y);x+=w});y+=16};head();
 s.D.forEach((m,i)=>{if(y>740){d.addPage();y=52;head()}const t=m.L.map(x=>jobName(x.job)+' '+hm(x.s)+'-'+hm(x.e)+(x.st==='estimado'?' (est.)':'')+(x.cf?' (!)':'')).join(', ')||'Libre';
  if(i%2){d.setFillColor(248,250,252);d.rect(X,y-11,R-X,16,'F')}d.setFont('helvetica','normal');d.setFontSize(9.5);let x=X;
  [DOW[pd(m.d).getDay()]+' '+pd(m.d).getDate()+' '+MES[pd(m.d).getMonth()],t,dur(m.sleep),dur(m.free)].forEach((v,j)=>{const h=m.sleep/60;if(j===2)d.setTextColor(...(h<5?[185,28,28]:h<7?[180,83,9]:[21,128,61]));d.text(d.splitTextToSize(pt(v),cols[j][1]-6)[0]||'',x+3,y);d.setTextColor(15,23,42);x+=cols[j][1]});y+=16});
 y+=8;d.setFont('helvetica','italic');d.setFontSize(8.5);d.setTextColor(100,116,139);
 d.text(d.splitTextToSize(pt('Sueño y horas libres son estimados con tus reglas (despertar 1 h 10 antes del turno de mañana, ~20 min de camino, 1 h en casa después de YoWash). (!) = conflicto. Salario: Walmart $'+PAY().wm+'/h menos '+PAY().lunch+' min de almuerzo en turnos de más de '+PAY().lunchOver+' h; extra despues de '+PAY().wmOT+' h/semana a 1.5x, impuestos ~'+PAY().wmWith+'%, ahorro $'+PAY().wmSave+' y W+ $'+PAY().wmMbr+' por cheque, menos OnePay ya cobrado; YoWash $'+PAY().yw+'/h, extra despues de '+PAY().ywOT+' h a 1.5x, retencion ~'+PAY().ywWith+'%. Solo horas programadas.'),R-X),X,y);
 const n=d.getNumberOfPages();for(let i=1;i<=n;i++){d.setPage(i);d.setFontSize(8);d.setTextColor(148,163,184);d.text(i+'/'+n,R,770,{align:'right'})}
 const file=new File([d.output('blob')],'Calendario-'+p.a+'-'+p.b+'.pdf',{type:'application/pdf'});if(typeof dl==='function')dl(file);return file};
// ---------- Configuración: tarifas ----------
window.calPayCard=()=>{const P=PAY();
 return `<div class="card" id="calpaycard"><h2>📅 ${T('Calendario')} · ${T('Salario estimado')}</h2>
 <div class="grid"><label>Walmart $/h<input id="cpwm" type="number" step="0.01" value="${P.wm}"></label><label>YoWash $/h<input id="cpyw" type="number" step="0.01" value="${P.yw}"></label>
 <label>Walmart: almuerzo sin pago (min)<input id="cplu" type="number" step="5" value="${P.lunch}"></label><label>…en turnos de más de (h)<input id="cplo" type="number" step="0.5" value="${P.lunchOver}"></label>
 <label>YoWash: extra (1.5×) después de (h/semana)<input id="cpot" type="number" step="1" value="${P.ywOT}"></label><label>YoWash: retención (%)<input id="cpwi" type="number" step="0.01" value="${P.ywWith}"></label>
 <label>Walmart: extra (1.5×) después de (h/semana)<input id="cpwot" type="number" step="1" value="${P.wmOT}"></label><label>Walmart: impuestos (%)<input id="cpww" type="number" step="0.01" value="${P.wmWith}"></label>
 <label>Walmart: ONE SAVINGS por cheque ($)<input id="cpws" type="number" step="0.01" value="${P.wmSave}"></label><label>Walmart: W+ por cheque ($)<input id="cpwp" type="number" step="0.01" value="${P.wmMbr}"></label></div>
 <div class="muted" style="margin-top:6px">Se estima con las horas programadas del calendario. Walmart: quincena sábado a viernes; el depósito llega el jueves 6 días después; al total se le restan los OnePay ya cobrados (no se cuentan dos veces). YoWash: semana de pago jueves a miércoles; el cheque llega el jueves 8 días después. El día de cobro, cuando registras el cheque real, se ve estimado vs real.</div>
 <button id="cpsave" style="width:100%;margin-top:8px" onclick="calPaySave()">${T('Guardar')}</button></div>`};
window.calPaySave=()=>{const g=id=>+document.getElementById(id).value;S.calPay=Object.assign({},S.calPay||{},{wm:g('cpwm')||15,yw:g('cpyw')||16,lunch:Math.max(0,g('cplu')),lunchOver:g('cplo')||6,ywOT:g('cpot')||40,ywWith:Math.max(0,g('cpwi')),wmOT:g('cpwot')||40,wmWith:Math.max(0,g('cpww')),wmSave:Math.max(0,g('cpws')),wmMbr:Math.max(0,g('cpwp'))});save();render();if(typeof toast==='function')toast(T('Guardado'))};
if(typeof cfg==='function'){const _c=cfg;cfg=function(){return _c.apply(this,arguments)+calPayCard()}}
// ---------- barra de abajo + render ----------
function navAdd(){const nv=document.querySelector('nav');if(!nv||nv.querySelector('[data-t="cal"]'))return;const after=nv.querySelector('[data-t="mov"]');
 const b=document.createElement('button');b.dataset.t='cal';b.dataset.l='Calendario';b.innerHTML='<b>📅</b>'+T('Calendario');b.onclick=()=>{tab='cal';filt='';render();scrollTo(0,0);maybeFetch()};
 after?after.after(b):nv.append(b)}
navAdd();
const _r=render;render=function(){navAdd();if(tab!=='cal')return _r.apply(this,arguments);if(!unlocked)return;
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==='cal'));document.getElementById('v').innerHTML=calView()};
const st=document.createElement('style');st.textContent=`
#cal{--ph:26px;max-width:1240px;margin:0 auto}.cgrid>*,.cmain,.cside,.cwk>*,.cmonth>*{min-width:0}
.cseg{display:flex;background:#e2e8f0;border-radius:12px;padding:3px;gap:3px;max-width:520px;margin:0 auto}.cseg button{flex:1;min-height:38px;background:none;color:#334155;border-radius:9px}.cseg button.on{background:#fff;color:#0f172a;box-shadow:0 1px 3px #0002}
.cper{display:flex;align-items:center;gap:8px;margin:10px auto 10px;max-width:520px}.cper b{flex:1;text-align:center;font-size:17px}.cper button{min-width:44px;font-size:22px;padding:0}
.csum{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center}.csum div{background:#f8fafc;border-radius:10px;padding:8px 4px}.csum b{display:block;font-size:20px}
.cbdg{display:inline-block;font-size:12px;font-weight:700;padding:2px 7px;border-radius:10px;color:#fff;white-space:nowrap}.cbdg.r{background:#dc2626}.cbdg.a{background:#d97706}.cbdg.g{background:#16a34a}
.ctag{font-size:10px;font-weight:700;border:1px dashed currentColor;border-radius:6px;padding:0 4px;margin-left:4px;color:#475569}
.ch3{font-weight:700;font-size:16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.ctl{position:relative;margin-left:42px;border-left:1px solid #e2e8f0;height:calc(20 * var(--ph))}
.chr{position:absolute;left:-42px;width:calc(100% + 42px);border-top:1px solid #f1f5f9;font-size:10px;color:#94a3b8}.chr span{display:inline-block;width:36px;text-align:right;transform:translateY(-6px);background:#fff}
.cblk{position:absolute;left:5px;right:5px;border-radius:8px;padding:3px 8px;font-size:12.5px;overflow:hidden;line-height:1.3}.cblk.csm{font-size:11px;padding:0 8px;white-space:nowrap;display:flex;align-items:center}
.cbw{background:#dbeafe;border:2px solid #2563eb;color:#1e3a8a}.cby{background:#dcfce7;border:2px solid #16a34a;color:#14532d}.cbs{background:#e0e7ff;border:1.5px solid #6366f1;color:#312e81}.cbf{background:#f8fafc;border:1px dashed #cbd5e1;color:#64748b}.cbt{background:#f1f5f9;color:#64748b}
.cest{border-style:dashed!important}.ccf{background:#fee2e2!important;border:2px solid #dc2626!important;color:#7f1d1d!important}.cmut{opacity:.85}
.cwarn{background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;border-radius:10px;padding:8px 10px;font-size:14px;margin:0 0 12px}.cwarnl{color:#991b1b;font-size:12px}
.cdc{padding:10px 12px;cursor:pointer}.csel{outline:3px solid #2563eb}
.csh{display:flex;justify-content:space-between;gap:6px;font-size:14px;padding:5px 8px;border-radius:8px;margin:4px 0}.csh.wm{background:#dbeafe}.csh.yw{background:#dcfce7}.csh.est{border:1.5px dashed #16a34a}.csh.cf{background:#fee2e2;border:2px solid #dc2626}
.cmg{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}.cmh{font-size:11px;color:#64748b;text-align:center}
.cmd{background:#fff;border:1px solid #e2e8f0;border-radius:8px;min-height:64px;padding:3px;font-size:12px;display:flex;flex-direction:column;gap:2px;cursor:pointer;min-width:0}.cmd.o{opacity:.35}.cn{font-weight:700}
.cbar{height:5px;border-radius:3px;overflow:hidden}.cbar span{display:none}.bW{background:#2563eb}.bY{background:#16a34a}.bE{background:#dcfce7;outline:1.5px dashed #16a34a;outline-offset:-1.5px}.bC{background:#dc2626}
.csb{font-size:10px;font-weight:700;border-radius:6px;color:#fff;text-align:center}
.cleg{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:#475569;margin-top:8px}.cleg i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:4px;vertical-align:-2px}
.ckb{grid-column:1/-1;font-size:11px;line-height:1.35;margin-top:2px;text-align:left}.ckh,.ckr{display:grid;grid-template-columns:1fr 72px 72px 64px;gap:4px;align-items:center;font-size:13px;text-align:right}.ckh{font-size:11px;color:#64748b;padding:4px 0}.ckr{padding:5px 0;border-bottom:1px solid #f1f5f9}.ckr>span:first-child,.ckh>span:first-child{text-align:left}
.ccupd{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;margin-bottom:12px}.ccupd button{min-height:34px;font-size:13px;padding:4px 10px}
#calconnect{max-width:560px;margin:10px auto}
@media(min-width:700px){#cal{--ph:30px}.cwk{display:grid;grid-template-columns:repeat(2,1fr);gap:0 12px}.cmd{min-height:84px}.cbar{height:auto;padding:1px 3px;color:#fff;font-size:10px}.cbar span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bE{color:#14532d}}
@media(min-width:1000px){.cgrid{display:grid;grid-template-columns:340px 1fr;gap:16px;align-items:start}.cside{position:sticky;top:calc(var(--hh,64px) + 8px)}
 .cwk{grid-template-columns:repeat(4,minmax(0,1fr))}.v-dia .cmain{max-width:720px}.cmonth{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:12px;align-items:start}.cmd{min-height:96px}}
@media(min-width:1200px){.cwk{grid-template-columns:repeat(7,minmax(0,1fr));gap:0 8px}.cwk .cdc{padding:8px}.cwk .ch3{flex-direction:column;align-items:flex-start;gap:3px;font-size:15px}.cwk .csh{flex-direction:column;font-size:12.5px;padding:4px 6px}}`;document.head.appendChild(st);
window._v176={dayModel,shifts,wakeOf,bedOf,stats,period,pay,checksIn,ywGross,ywNet,ywWeek,wmG,wmTax,wmNet,wmWeek,epIn,norm,stOf,calView,fetchRange,PAY};
})();
