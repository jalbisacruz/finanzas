// v142 (Joe):
// 1) «Ya se depositó»: registrar el cheque de YoWash cuando llega adelantado (no es EarlyPay de Walmart
//    ni un ingreso extra). Se marca el MISMO cobro programado (p.ej. jue 12 nov) como cobrado, con la
//    fecha real del depósito (p.ej. mié 11 nov) y el monto exacto. El autoDepósito del jueves a las 4:00
//    no lo vuelve a cargar. El siguiente Pendiente es el jueves siguiente (19 nov).
// 2) Categoría de gasto «Donaciones» en el gasto de siempre (monto, fecha, origen; destinatario/nota
//    opcional en la descripción). Es gasto personal, no ingreso ni compra compartida ni Envíos a familia.
Object.assign(EN,{
  "Ya se depositó":"Already deposited",
  "El cobro programado sigue siendo el {0}. Indica cuándo llegó y el monto exacto.":"The scheduled payday is still {0}. Enter when it arrived and the exact amount.",
  "Fecha en que llegó":"Date it arrived",
  "Monto exacto $":"Exact amount $",
  "Se sumará {0} al débito y se marcará el cheque del {1} como cobrado (recibido el {2}). No es un ingreso extra.":"{0} will be added to debit and the {1} check will be marked collected (received {2}). It is not extra income.",
  "Confirmar y sumar al débito":"Confirm and add to debit",
  "Cheque de YoWash registrado":"YoWash check recorded",
  "Pon el monto exacto del depósito":"Enter the exact deposit amount",
  "Donaciones":"Donations","🙌 Donaciones":"🙌 Donations",
  "Destinatario o nota (opcional)":"Recipient or note (optional)",
  "cobro del {0}":"payday {0}"
});

const chkWhen=c=>c&&(c.depositedOn||c.date);
const ywPending=()=>{const c=pendingCheck();return c&&c.status==='pending'?c:null};

function ywEarlyDlg(){const pc=ywPending();if(!pc)return;
 const pre=+pc.amount>0&&!pc.amtPending?r2(pc.amount):r2(chkEst()||0);
 const pay=wd(pc.date);
 dlg().innerHTML=`<h2>💼 ${T('Ya se depositó')}</h2>
  <div class="muted">${T('El cobro programado sigue siendo el {0}. Indica cuándo llegó y el monto exacto.',pay)}</div>
  <label style="display:block;margin-top:10px">${T('Fecha en que llegó')}<input id="ywed" type="date" value="${today()}"></label>
  <label style="display:block;margin-top:8px">${T('Monto exacto $')}<input id="ywea" type="number" inputmode="decimal" step="0.01" min="0" value="${pre>0?pre:''}" placeholder="${pre>0?'':T('Pon el monto exacto del depósito')}" style="font-size:24px"></label>
  <div id="ywenote" class="muted" style="margin-top:8px"></div>
  <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="yweok" onclick="ywEarlySave('${pc.id}')">${T('Confirmar y sumar al débito')}</button></div>`;
 const note=()=>{const a=r2(document.getElementById('ywea').value),d=document.getElementById('ywed').value||today();
  document.getElementById('ywenote').textContent=a>0?T('Se sumará {0} al débito y se marcará el cheque del {1} como cobrado (recibido el {2}). No es un ingreso extra.',f(a),pay,wd(d)):'';};
 document.getElementById('ywea').addEventListener('input',note);
 document.getElementById('ywed').addEventListener('change',note);note();
 if(!dlg().open)dlg().showModal();setTimeout(()=>document.getElementById('ywea')?.focus(),50)}

let ywEarlyBusy=0;
function ywEarlySave(id){const pc=(S.checks||[]).find(c=>c.id===(id||'')&&c.status==='pending')||(id?null:ywPending());
 if(!pc||pc.status!=='pending'||ywEarlyBusy)return;
 const a=r2((document.getElementById('ywea')||{}).value),d=(document.getElementById('ywed')||{}).value||today();
 if(!(a>0))return alert(T('Pon el monto exacto del depósito'));
 const already=Object.values(S.months||{}).some(m=>(m.events||[]).some(e=>e.type==='check'&&e.checkId===pc.id));
 if(already)return dlg().close();
 ywEarlyBusy=1;
 try{
  pc.amount=a;delete pc.amtPending;pc.status='deposited';pc.depositedOn=d;pc.early=true;
  const m=L();debE(m).amount=r2((+debE(m).amount||0)+a);
  const ev={id:uid(),type:'check',date:d,amount:a,checkId:pc.id,early:true,payday:pc.date,
    desc:'Cheque '+fdate(d)+(d!==pc.date?' (adelantado, cobro '+fdate(pc.date)+')':'')};
  S.months[monthFor(d)].events.push(ev);
  if(typeof v127NextYW==='function')v127NextYW();
  save();dlg().close();render();toast(T('Cheque de YoWash registrado',f(a)));
 }finally{ywEarlyBusy=0}}
window.ywEarlyDlg=ywEarlyDlg;window.ywEarlySave=ywEarlySave;

// Lista y Plan: mes y fecha visible = fecha real del cobro; la identidad del jueves programado no cambia.
{const _d=depChecks;depChecks=function(){const k=S.cur,isYW=c=>!c.src||/YoWash/.test(c.src||'');
  const raw=_d();
  const keep=raw.filter(c=>!isYW(c)||(c.legacy?c.month===k:(chkWhen(c)||'').startsWith(k)));
  const seen=new Set(keep.filter(isYW).map(c=>c.id));
  (S.checks||[]).forEach(c=>{
    if(c.status!=='deposited'||seen.has(c.id))return;
    if(!(c.legacy?c.month===k:(chkWhen(c)||'').startsWith(k)))return;
    keep.push({...c,src:c.src||'💼 YoWash'});seen.add(c.id);
  });
  return keep.map(c=>{if(!isYW(c))return c;const when=chkWhen(c);return {...c,when,payday:c.date,date:when}})
    .sort((a,b)=>(a.date||'')<(b.date||'')?1:(a.date||'')>(b.date||'')?-1:(a.src<b.src?-1:1))}}
{const _c=chkCard;chkCard=function(){const L2=depChecks();
  return `<div class="card defcol" id="chkcard"><h2>💼 ${T('Cheques depositados')}<span>${f(sum(L2,c=>c.amount))}</span></h2>${L2.map(c=>{
    const pay=c.payday&&c.when&&c.payday!==c.when?` · ${T('cobro del {0}',wd(c.payday))}`:'';
    return `<div class="row"><span class="n">${wd(c.date)}<div class="muted">✅ ${T('Depositado')}${c.src?' · '+c.src:''}${c.legacy?' · '+T('importado'):''}${pay}</div></span>${f(c.amount)}</div>`}).join('')||'<div class="muted">'+T('Nada aquí.')+'</div>'}</div>`}}
{const _v=typeof v138Data==='function'?v138Data:null;
 if(_v)v138Data=function(P){const D=_v(P),k=P.k;
  const ywReal=(S.checks||[]).filter(c=>c.status==='deposited'&&+c.amount>0&&(chkWhen(c)||'').startsWith(k))
    .map(c=>({d:chkWhen(c),a:r2(+c.amount),t:'r'})).sort((a,b)=>a.d<b.d?-1:1);
  const paid=new Set((S.checks||[]).filter(c=>c.status==='deposited').map(c=>c.date));
  const ywEst=(P.ywLines||[]).filter(x=>!paid.has(x.d)).map(x=>({d:x.d,a:r2(x.a),t:'e'}));
  const yw=[...ywReal,...ywEst],tot=L2=>r2(sum(L2,x=>x.a)),wm=D.wm||[];
  const real=r2(sum([...yw,...wm].filter(x=>x.t!=='e'),x=>x.a));
  return {...D,yw,wm,ywT:tot(yw),wmT:D.wmT,real}}}

{const _b=chkBox;chkBox=function(){const h=_b();if(chkEdit)return h;const pc=ywPending();if(!pc)return h;
  const t=document.createElement('template');t.innerHTML=h;
  if(!t.content.querySelector('#ywearly')){
    const y=t.content.querySelector('#chkadj');
    const b=document.createElement('button');b.type='button';b.id='ywearly';b.className='sec';
    b.textContent=T('Ya se depositó');b.setAttribute('onclick','ywEarlyDlg()');
    b.style.cssText='display:block;width:100%;margin:8px 0 0;min-height:40px;font-size:14px;grid-column:1/-1';
    if(y&&y.parentElement)y.parentElement.after(b);
    else t.content.append(b);
  }
  return t.innerHTML}}

// ---- Donaciones (gasto personal, flujo existente) ----
const DON_CAT='🙌 Donaciones';
const isDon=c=>/donaciones?|donations?/.test(String(c||'').replace(/^\W+\s*/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
function donCatEnsure(){const found=(S.cats||[]).filter(isDon);
  const dest=found.includes(DON_CAT)?DON_CAT:DON_CAT;
  found.forEach(c=>{if(c===dest)return;
    Object.values(S.months||{}).forEach(m=>{(m.personal||[]).forEach(x=>{if(x.cat===c)x.cat=dest})});
    if(S.budgets&&S.budgets[c]!==undefined){S.budgets[dest]=r2((+S.budgets[dest]||0)+(+S.budgets[c]||0));delete S.budgets[c]}
  });
  S.cats=(S.cats||[]).filter(c=>!isDon(c)||c===dest);
  if(!S.cats.includes(dest)){const i=S.cats.indexOf('📦 Otros'),j=S.cats.indexOf('💸 Envíos a familia');
    S.cats.splice(i>=0?i:(j>=0?j+1:S.cats.length),0,dest)}
  return dest}
window.donCatEnsure=donCatEnsure;
donCatEnsure();
{const _q=quick;quick=function(){_q();donCatEnsure();
  const chips=document.getElementById('qcats');if(!chips)return;
  if(![...chips.querySelectorAll('.chip')].some(b=>isDon(b.dataset.c))){
    const dest=donCatEnsure(),b=document.createElement('button');b.className='chip';b.dataset.c=dest;b.textContent=T(dest.replace(/^\W+\s*/,''))||dest;
    // rebuild via render of chips is messy; just insert if missing
    b.textContent=dest;const otros=[...chips.querySelectorAll('.chip')].find(x=>x.dataset.c==='📦 Otros');
    if(otros)otros.before(b);else chips.append(b);
    b.onclick=function(){document.querySelectorAll('#qcats .chip').forEach(x=>x.classList.remove('on'));this.classList.add('on');
      const rec=document.getElementById('qrec');if(rec)rec.hidden=!isRem(this.dataset.c);ph()}
  }
  const ph=()=>{const c=document.querySelector('#qcats .chip.on')?.dataset.c,qd=document.getElementById('qd'),rec=document.getElementById('qrec');
    if(qd)qd.placeholder=isDon(c)?T('Destinatario o nota (opcional)'):T('Descripción (opcional)');
    if(rec&&isDon(c))rec.hidden=true};
  document.querySelectorAll('#qcats .chip').forEach(b=>b.addEventListener('click',ph));ph()}}
