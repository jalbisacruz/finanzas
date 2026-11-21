// v152 (Joe + Tony):
// 1) Tras aprobar la hoja, la parte de Carlos (y la de cada uno) en las cuentas entra en
//    «Quién transfiere a quién», en las tarjetas de persona («Su parte de las cuentas»)
//    y en los PDF. Antes solo entraban las compras; Joe↔Tony ya llevaba la parte de Joe
//    (b.amount). No se toca calc() ni lo que Joe transfiere a Tony.
// 2) En la hoja de Tony: «Pendiente de aprobación» si ya envió y Joe no ha aprobado,
//    y «Aprobada» cuando el enlace ya trae el mes aprobado (sin cambiar reglas).
//    En la tarjeta, si falta aprobar: «Falta aprobar la hoja de Tony».
// 3) Tras aprobar, el aviso «Tony envió las cuentas de {mes}» no reaparece (ni envíos
//    viejos del mes, ni al recargar u otro dispositivo) salvo que Tony envíe una
//    actualización más nueva (rev mayor o fecha posterior a la aprobada).
// 4) Un PDF por persona: el de Joe es el completo (todos, cuentas con cada parte,
//    detalle de todas las compras). Los de Tony y Carlos, solo su resumen y su detalle.
//    El de Carlos, después del resumen, desglosa cuentas (cada una + su parte),
//    compras/comida y a quién transferir (a Tony y a Joe).
// 5) «Reparto de cuentas» muestra Carlos → Tony (cuentas + compras con Tony)
//    y Carlos → Joe (compras que le debe a Joe). La tarjeta «Quién transfiere a quién»
//    usa las mismas cifras. No se cambia la matemática de las compras.
(function(){
Object.assign(typeof EN!=='undefined'?EN:{},{
  "Su parte de las cuentas":"Share of bills",
  "Falta aprobar la hoja de Tony":"Tony's bill sheet is still pending approval",
  "Pendiente de aprobación":"Pending approval",
  "Aprobada":"Approved",
  "Parte de Carlos en las cuentas de Tony":"Carlos's share of Tony's bills",
  "Total":"Total",
  "Carlos → Joe":"Carlos → Joe",
  "Joe → Carlos":"Joe → Carlos",
  "cuentas {0} + compras {1}":"bills {0} + purchases {1}",
  "de compras compartidas":"from shared purchases",
  "La app no registra cuándo le paga a Tony.":"The app doesn't record when he pays Tony.",
  "De dónde sale tu total":"Where your total comes from",
  "Compras y comida":"Purchases and food",
  "A quién transferir":"Who to transfer to",
  "A Tony":"To Tony",
  "A Joe":"To Joe",
  "Joe te transfiere":"Joe transfers to you",
  "Cuenta":"Bill",
  "Tu parte":"Your share"
});
if(typeof window!=='undefined'&&window.R3L){
  Object.assign(R3L.es||{},{billsPart:'Su parte de las cuentas',sheetPend:'Falta aprobar la hoja de Tony',btot:'Total',billsFullT:'Cuentas de Tony (reparto)',
    fromWhere:'De dónde sale tu total',purchFood:'Compras y comida',toWhom:'A quién transferir',toTony:'A Tony',toJoe:'A Joe',joeToYou:'Joe te transfiere',yourPart:'Tu parte'});
  Object.assign(R3L.en||{},{billsPart:'Share of bills',sheetPend:"Tony's bill sheet is still pending approval",btot:'Total',billsFullT:"Tony's bills (split)",
    fromWhere:'Where your total comes from',purchFood:'Purchases and food',toWhom:'Who to transfer to',toTony:'To Tony',toJoe:'To Joe',joeToYou:'Joe transfers to you',yourPart:'Your share'});
}
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=(es,en)=>(typeof ES!=='undefined'&&ES===false)||(typeof LANG!=='undefined'&&LANG==='en')?en:es;
const rr=n=>typeof r2==='function'?r2(n):Math.round((+n||0)*100)/100;
const P3=['Yo','Tony','Carlos'];
const joeOf=p=>p==='Yo'?'Joe':p;

function bsheet(){try{return typeof bsS==='function'?bsS():(typeof S!=='undefined'&&S? (S.bsheet=S.bsheet||{months:{}},S.bsheet.months=S.bsheet.months||{},S.bsheet):{months:{}})}catch(e){return {months:{}}}}
function shMonth(k){const B=bsheet();return (B.months&&B.months[k])||null}

function sheetTime(x){
  const a=x&&x.at;
  if(!a)return 0;
  if(typeof a.toMillis==='function')return a.toMillis();
  if(a.seconds)return a.seconds*1000;
  const n=+a;return isFinite(n)?n:0;
}

function sheetShares(m){
  const t={Joe:0,Tony:0,Carlos:0,Arianna:0};
  ((m&&m.bills)||[]).forEach(b=>{
    const sp=b&&b.sheet&&b.sheet.sp;if(!sp)return;
    ['Joe','Tony','Carlos','Arianna'].forEach(p=>t[p]=rr(t[p]+(+sp[p]||0)));
  });
  return t;
}
function billRowsFor(m,who){
  const key=who==='Yo'||who==='Joe'?'Joe':who;
  return ((m&&m.bills)||[]).filter(b=>b&&b.sheet&&b.sheet.sp).map(b=>{
    const sp=b.sheet.sp;
    return {n:typeof billLbl==='function'?billLbl(b):(typeof DN==='function'?DN(b.name):b.name),
      total:rr(+b.sheet.total||0),share:rr(+sp[key]||0),paid:typeof billSt2==='function'?billSt2(b)==='paid':!!b.paid};
  }).filter(r=>Math.abs(r.share)>0.004||who==='Yo');
}
function purchTonyCarlos(m){
  const po=typeof paidOther==='function'?paidOther(m):((m&&m.purchases)||[]).filter(p=>p.paidBy);
  const fam=typeof TFAM!=='undefined'?TFAM:['Tony','Arianna'];
  const cT=rr(po.filter(p=>fam.includes(p.paidBy)).reduce((s,p)=>s+(+(p.shares||{}).Carlos||0),0));
  const tC=rr(po.filter(p=>p.paidBy==='Carlos').reduce((s,p)=>s+(+(p.shares||{}).Tony||0),0));
  return {cT,tC,net:rr(cT-tC)};
}
// Deudas de Carlos: compras no se recalculan; se les SUMA su parte de las cuentas (con Tony).
function carlosFlows(m){
  const sh=sheetShares(m),pt=purchTonyCarlos(m),c=typeof calc==='function'?calc(m):{};
  const purchJoe=rr((+c.carlos||0)-(+c.joeCS||0)),recv=rr(+c.recv||0),pendJoe=rr(purchJoe-recv);
  const billsTony=rr(sh.Carlos||0);
  return {billsTony,purchTony:pt.net,toTony:rr(billsTony+pt.net),purchJoe,recv,pendJoe,toJoe:pendJoe,sh,pt};
}

function monthApproved(k){
  const sh=shMonth(k);if(!sh)return false;
  if(sh.gate||(sh.hist&&sh.hist.length)||Object.keys(sh.applied||{}).length||Object.keys(sh.rows||{}).length)return true;
  const m=typeof S!=='undefined'&&S.months&&S.months[k];
  return !!(m&&(m.bills||[]).some(b=>b&&b.sheet&&b.sheet.sp));
}

function setGate(k,doc){
  const sh=typeof bsMonth==='function'?bsMonth(k):((bsheet().months[k]=bsheet().months[k]||{rev:0,rows:{},applied:{},hist:[]}));
  sh.gate={id:doc&&doc.id||'',rev:+(doc&&doc.rev)||0,at:sheetTime(doc)||Date.now()};
  return sh.gate;
}

function isCovered(x){
  if(!x||x.kind&&x.kind!=='bills')return false;
  const id=x.id;
  try{
    if(id&&typeof window._v151!=='undefined'&&typeof _v151.isHandled==='function'&&_v151.isHandled(id))return true;
  }catch(e){}
  const sh=shMonth(x.month);if(!sh)return false;
  if(id&&sh.applied&&sh.applied[id])return true;
  const g=sh.gate,rev=+(x.rev)||0;
  if(g){
    if(id&&id===g.id)return true;
    const gr=+(g.rev)||0,t=sheetTime(x),gt=+(g.at)||0;
    if(rev<gr)return true;
    if(rev>gr)return false;
    if(t&&gt)return t<=gt;
    return true;
  }
  const approved=(sh.hist&&sh.hist.length)||Object.keys(sh.applied||{}).length||Object.keys(sh.rows||{}).length;
  if(!approved)return false;
  const shRev=+(sh.rev)||0;
  if(rev<shRev)return true;
  if(rev>shRev)return false;
  if(sh.hist&&sh.hist.length){
    const last=+(sh.hist[sh.hist.length-1].at)||0,t=sheetTime(x);
    if(t&&last)return t<=last;
  }
  return true;
}

function pendingLatest(){
  const L=(typeof INBOX!=='undefined'&&Array.isArray(INBOX))?INBOX:[];
  const by={};
  L.filter(x=>x&&x.kind==='bills'&&!isCovered(x)).forEach(x=>{
    const k=x.month||'';
    const prev=by[k];
    if(!prev){by[k]=x;return}
    if(typeof window._v151!=='undefined'&&_v151.newerSheet)by[k]=_v151.newerSheet(prev,x);
    else by[k]=(+(x.rev)||0)>=(+(prev.rev)||0)?x:prev;
  });
  return Object.keys(by).sort().reverse().map(k=>by[k]);
}

function dropCovered(){
  if(typeof INBOX==='undefined'||!Array.isArray(INBOX))return;
  INBOX=INBOX.filter(x=>!(x&&x.kind==='bills'&&isCovered(x)));
}

function monthLabel(k){
  if(k&&typeof S!=='undefined'&&S.months&&S.months[k]&&typeof lbl==='function')return lbl(k);
  if(typeof inbStr==='function')return inbStr(k||'',7);
  return k||'';
}

function noticeHtml(){
  const L=pendingLatest();if(!L.length)return '';
  const rows=L.map(x=>{
    const mes=monthLabel(x.month);
    const tt=typeof T==='function'?T('🧾 Tony envió las cuentas de {0}',mes):('🧾 Tony envió las cuentas de '+mes);
    const btn=typeof T==='function'?T('Revisar y aprobar'):'Revisar y aprobar';
    return `<div class="row" style="align-items:center;gap:8px"><span class="n">${esc(tt)}</span>
      <button type="button" class="sec bsrev" id="bsrev-${esc(x.id)}" data-month="${esc(x.month||'')}" onclick="bsReview('${esc(x.id)}')">${esc(btn)}</button></div>`;
  }).join('');
  return `<div class="card" id="bsnotice">${rows}</div>`;
}

function cutCard(h,id){
  const needle='id="'+id+'"';
  const mid=h.indexOf(needle);
  if(mid<0)return h;
  const open=h.lastIndexOf('<div',mid);
  if(open<0)return h;
  const tag=/<\/?div\b[^>]*>/gi;tag.lastIndex=open;
  let depth=0,m;
  while((m=tag.exec(h))){
    if(/^<\//.test(m[0]))depth--;else depth++;
    if(depth===0)return h.slice(0,open)+h.slice(m.index+m[0].length);
  }
  return h;
}
function insertNotice(h,extra){
  if(!extra)return h;
  const ie=h.indexOf('id="inberr"');
  if(ie>=0){
    const open=h.lastIndexOf('<div',ie);
    const tag=/<\/?div\b[^>]*>/gi;tag.lastIndex=open>=0?open:ie;
    let depth=0,m;
    while((m=tag.exec(h))){
      if(/^<\//.test(m[0]))depth--;else depth++;
      if(depth===0){const end=m.index+m[0].length;return h.slice(0,end)+extra+h.slice(end)}
    }
  }
  const j=h.indexOf('<div class="card');
  return j<0?extra+h:h.slice(0,j)+extra+h.slice(j);
}
function withNotice(h){return insertNotice(cutCard(h,'bsnotice'),noticeHtml())}

function monthPending(k){
  return pendingLatest().some(x=>x.month===k);
}

function pairKey(p){return [p.a,p.b].sort().join('|')}

// ---------- r3Data: cuentas aprobadas en el reparto de la casa ----------
if(typeof r3Data==='function'){
  const _r=r3Data;
  r3Data=function(k,who){
    const o=_r(k,who);who=who||'Yo';
    const m=typeof S!=='undefined'&&S.months&&S.months[k];
    const sh=m?sheetShares(m):{Joe:0,Tony:0,Carlos:0,Arianna:0};
    const cB=rr(sh.Carlos||0),jB=rr(sh.Joe||0),tB=rr(sh.Tony||0),aB=rr(sh.Arianna||0);
    o.billsShare={Joe:jB,Tony:tB,Carlos:cB,Arianna:aB};
    o.sheetApproved=monthApproved(k);
    o.sheetPending=!o.sheetApproved&&monthPending(k);
    const lblC=typeof T==='function'?T('Parte de Carlos en las cuentas de Tony'):'Parte de Carlos en las cuentas de Tony';
    const pairs=o.pairs||[];
    let tc=pairs.find(p=>(p.a==='Carlos'&&p.b==='Tony')||(p.a==='Tony'&&p.b==='Carlos'));
    if(cB>0.004){
      if(!tc){
        if(who==='Yo'||who==='Tony'||who==='Carlos'){
          tc={a:'Carlos',b:'Tony',lines:[{l:lblC,v:cB}],net:cB,paid:null,pend:cB,tc:1};
          pairs.push(tc);
        }
      }else if(!tc.lines.some(x=>x.l===lblC)){
        if(tc.a==='Carlos'&&tc.b==='Tony'){
          tc.lines.unshift({l:lblC,v:cB});
          tc.net=rr((+tc.net||0)+cB);
          tc.pend=rr((+tc.pend||0)+cB);
        }else{
          tc.lines.unshift({l:lblC,v:-cB});
          tc.net=rr((+tc.net||0)-cB);
          tc.pend=rr((+tc.pend||0)-cB);
        }
      }
    }
    const transfers=[],people={};
    P3.forEach(x=>{
      const prev=(o.people&&o.people[x])||{};
      people[x]={pays:0,gets:0,part:+prev.part||0,bills:x==='Yo'?jB:x==='Tony'?tB:cB};
    });
    pairs.forEach(p=>{
      const v=+p.pend||0;if(Math.abs(v)<0.005)return;
      const x=v>0?{from:p.a,to:p.b,amount:rr(v)}:{from:p.b,to:p.a,amount:rr(-v)};
      transfers.push(x);
      if(people[x.from])people[x.from].pays=rr(people[x.from].pays+x.amount);
      if(people[x.to])people[x.to].gets=rr(people[x.to].gets+x.amount);
    });
    o.pairs=pairs;o.transfers=transfers;o.people=people;

    if(m&&who==='Yo'){
      const rows=(m.bills||[]).filter(b=>b&&(b.sheet||+b.amount)).map(b=>{
        const sp=b.sheet&&b.sheet.sp?{Yo:rr(b.sheet.sp.Joe||0),Tony:rr(b.sheet.sp.Tony||0),Carlos:rr(b.sheet.sp.Carlos||0),Arianna:rr(b.sheet.sp.Arianna||0)}:null;
        return {n:typeof billLbl==='function'?billLbl(b):(typeof DN==='function'?DN(b.name):b.name),
          a:rr(+b.amount||0),total:b.sheet?rr(+b.sheet.total||0):rr(+b.amount||0),sp,paid:typeof billSt2==='function'?billSt2(b)==='paid':!!b.paid};
      });
      if(rows.some(b=>b.sp)){o.bills=rows;o.billsFull=true;o.showBills=true;
        o.billsGrand=rr(rows.reduce((s,b)=>s+(+b.total||0),0));
        o.billsTotal=rr(jB||o.billsTotal||0);o.hasArianna=rows.some(b=>b.sp&&+b.sp.Arianna>0.004)}
    }else if(m&&(who==='Tony'||who==='Carlos')&&monthApproved(k)){
      const p=who,key=who;
      const rows=(m.bills||[]).filter(b=>b&&b.sheet&&+(b.sheet.sp||{})[key]>0.004).map(b=>({
        n:typeof billLbl==='function'?billLbl(b):(typeof DN==='function'?DN(b.name):b.name),
        a:rr(b.sheet.sp[key]||0),paid:typeof billSt2==='function'?billSt2(b)==='paid':!!b.paid
      }));
      o.bills=rows;o.showBills=!!rows.length;o.billsTotal=rr(who==='Tony'?tB:cB);o.billsFull=false;
    }
    if(m){
      const fl=carlosFlows(m);
      o.carlosFlows=fl;
      if(who==='Carlos'){
        const TT=typeof T==='function'?T:(s=>s);
        const bills=billRowsFor(m,'Carlos');
        const c0=typeof calc==='function'?calc(m):{};
        const purchRows=[];
        if(Math.abs(fl.pt.cT)>0.004)purchRows.push([TT('Parte de Carlos en compras que pagaron Tony/Arianna'),fl.pt.cT]);
        if(Math.abs(fl.pt.tC)>0.004)purchRows.push([TT('Parte de Tony en compras que pagó Carlos'),-fl.pt.tC]);
        if(Math.abs(+c0.carlos||0)>0.004)purchRows.push([TT('Parte de Carlos en compras que pagó Joe'),rr(c0.carlos)]);
        if(Math.abs(+c0.joeCS||0)>0.004)purchRows.push([TT('Parte de Joe en compras que pagó Carlos'),-rr(c0.joeCS)]);
        if(fl.recv>0.004)purchRows.push([TT('Ya pagado a Joe'),-fl.recv]);
        const splitRows=[[TT('A Tony'),fl.toTony]];
        if(fl.pendJoe>0.004)splitRows.push([TT('A Joe'),fl.pendJoe]);
        else if(fl.pendJoe<-0.004)splitRows.push([TT('Joe te transfiere'),rr(-fl.pendJoe)]);
        const fm=n=>(n<-0.004?'-':'')+'$'+Math.abs(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
        const purchNet=rr(fl.purchTony+fl.purchJoe);
        o.breakDown={title:TT('De dónde sale tu total'),sections:[
          {h:TT('Cuentas'),cols:[TT('Cuenta'),TT('Total'),TT('Tu parte')],ws:[316,100,100],
            rows:bills.map(b=>[b.n,fm(b.total),fm(b.share)]),
            tot:bills.length?[TT('Total'),'',fm(fl.billsTony)]:undefined},
          {h:TT('Compras y comida'),cols:['',TT('Total')],ws:[416,100],
            rows:purchRows.map(r=>[r[0],(r[1]<-0.004?'- ':'+ ')+fm(Math.abs(r[1]))]),
            tot:purchRows.length?[TT('Total'),fm(purchNet)]:undefined},
          {h:TT('A quién transferir'),cols:['',TT('Total')],ws:[416,100],
            rows:splitRows.map(r=>[r[0],fm(r[1])]),
            tot:[TT('Total'),fm(rr(fl.toTony+Math.max(0,fl.pendJoe)))]}
        ].filter(sec=>sec.rows&&sec.rows.length)};
      }
    }
    return o;
  };
}

// ---------- PDF de Joe: el más completo (detalle de TODAS las compras) ----------
if(typeof pdfMonth==='function'){
  const _pm=pdfMonth;
  pdfMonth=function(k){
    const R=r3Data(k,'Yo');
    if(typeof miMes==='function'){const mm=miMes(k);if(mm)R.mimes=mm}
    return rep3PDF(R,o=>{
      if(typeof pdfMine==='function')pdfMine(o,k);
      if(typeof r3DetInto==='function'&&R.det){const who=R.who;R.who='__all__';try{r3DetAll(o,R)}finally{R.who=who}}
    });
  };
}
function r3DetAll(o,R){
  if(typeof r3DetInto!=='function')return;
  const orig=R.who,rows=((R.det&&R.det.rows)||[]).slice();
  // r3DetInto filtra a compartidas de esa persona; para Joe usamos todas
  const det={rows:rows};
  const R2=Object.assign({},R,{who:'Yo',det,detAll:true});
  const _f=r3DetInto;
  // reimplementa el detalle sin filtrar a 2+ / includes(who)
  const L3=(window.R3L||{}),lg=R.lang==='en'?'en':'es',v=(typeof LD120!=='undefined'?LD120:null);
  const ues={h:'Detalle de compras',n:'{0} compras'};
  const uen={h:'Purchase detail',n:'{0} purchases'};
  const u=lg==='en'?uen:ues;
  const N=x=>(R.names||{})[x]||x,d=o.d,X=o.X,RR=o.R,fill=(s,...a)=>String(s).replace(/\{(\d)\}/g,(_,i)=>a[i]);
  const P3b=['Yo','Tony','Carlos'];
  const fm=n=>(n<-0.004?'-':'')+'$'+Math.abs(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const pt=s=>String(s??'').replace(/[−–—]/g,'-').replace(/[•·]/g,m=>m==='•'?'-':'·').replace(/[^\x00-\xff]/g,'').replace(/\s+/g,' ').trim();
  const LD={es:{paid:'Pagó {0}',art:'Artículo',pr:'Precio',ptot:'Total de la compra',rest:'Resto de la compra',all:'Toda la compra',tax:'Impuesto'},
            en:{paid:'Paid by {0}',art:'Item',pr:'Price',ptot:'Purchase total',rest:'Rest of the purchase',all:'Whole purchase',tax:'Tax'}};
  const uu=LD[lg],ws=[236,70,70,70,70],cols=[uu.art,uu.pr,...P3b.map(N)],sh=s=>P3b.map(x=>Math.abs(+s[x]||0)>0.004?fm(s[x]):'-');
  const all=rows;
  o.page();o.h(u.h+' · '+fill(u.n,all.length));
  if(!all.length){if(typeof o.note==='function')o.note(lg==='en'?'No purchases this month.':'Sin compras este mes.');return}
  all.forEach(p=>{
    o.need(16*(p.lines.length+2)+40);const y=o.y;
    d.setFillColor(239,246,255);d.setDrawColor(191,219,254);d.setLineWidth(0.8);d.roundedRect(X-6,y-13,RR-X+12,22,5,5,'FD');
    d.setFont('helvetica','bold');d.setFontSize(11);d.setTextColor(15,23,42);d.text(pt((p.dl?p.dl+'  ·  ':'')+p.s),X+2,y+2);
    d.setFont('helvetica','normal');d.setFontSize(9.5);d.setTextColor(71,85,105);d.text(pt(fill(uu.paid,N(p.by))),RR-90,y+2,{align:'right'});
    d.setFont('helvetica','bold');d.setFontSize(11);d.setTextColor(15,23,42);d.text(fm(p.t),RR-2,y+2,{align:'right'});o.y=y+24;
    o.table(cols,p.lines.map(l=>[l.k==='rest'?uu.rest:l.k==='all'?uu.all:l.k==='tax'?uu.tax:l.n,fm(l.a),...sh(l.sh)]),{ws,tot:[uu.ptot,fm(p.t),...sh(p.sh)]});o.y+=8;
  });
}

// ---------- aviso: no reaparece tras aprobar ----------
if(typeof bsApprove==='function'){
  const _ap=bsApprove;
  bsApprove=function(id,force){
    const x=(typeof INBOX!=='undefined'?INBOX:[]).find(y=>y&&y.id===id);
    const r=_ap(id,force);
    if(r&&(r.ok||r.done)&&x&&x.month){
      setGate(x.month,x);
      if(typeof window._v151!=='undefined'&&_v151.markHandled){
        const L=(INBOX||[]).concat([x]).filter(y=>y&&y.kind==='bills'&&y.month===x.month);
        _v151.markHandled(L.filter(y=>y.id!==id&&isCovered(y)).map(y=>y.id));
      }
      if(typeof save==='function')save();
      dropCovered();
    }
    return r;
  };
}
if(typeof inboxLoad==='function'){
  const _il=inboxLoad;
  inboxLoad=async function(){
    const r=await _il.apply(this,arguments);
    dropCovered();
    return r;
  };
}
if(typeof inboxList==='function'){
  const _list=inboxList;
  inboxList=function(){
    dropCovered();
    _list.apply(this,arguments);
    const keep=new Set(pendingLatest().map(x=>x.id));
    document.querySelectorAll('[id^="bsrow-"]').forEach(el=>{
      const id=el.id.slice('bsrow-'.length);
      if(!keep.has(id))el.remove();
    });
  };
}
if(typeof ini==='function'){const _ini=ini;ini=function(){return withNotice(_ini())}}
if(typeof billsMonth==='function'){const _bm=billsMonth;billsMonth=function(){return withNotice(_bm())}}

if(typeof snapFor0==='function'){
  const _s=snapFor0;
  snapFor0=function(who){
    const d=_s(who);
    if(who==='Tony'&&d.billSheet){
      const k=d.billSheet.k,approved=d.billSheet.from===d.billSheet.k;
      d.billSheet.approved=!!approved;
      d.billSheet.pending=!approved&&monthPending(k);
    }
    return d;
  };
}

// ---------- tarjeta HTML (app / pruebas) y página de Tony ----------
function money(n){return (n<-0.004?'-':'')+'$'+Math.abs(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function r3CardHtml(R){
  const L=(window.R3L||{})[(R&&R.lang)==='en'?'en':'es']||{};
  const N=x=>(R.names||{})[x]||x;
  const fl=(s,...a)=>String(s||'').replace(/\{(\d)\}/g,(_,i)=>a[i]);
  const f=typeof window.f==='function'?window.f:money;
  let h=`<div class="card sum" id="vsum"><h2>${esc(L.xfer||'Quién transfiere a quién')}</h2>`;
  h+=(R.transfers&&R.transfers.length)?R.transfers.map(x=>`<div class="row r3x"><span>${esc(fl(L.x1||'{0} le transfiere a {1}',N(x.from),N(x.to)))}</span><b class="big">${f(x.amount)}</b></div>`).join(''):`<div class="muted">${esc(L.ok||'')}</div>`;
  if(R.sheetPending)h+=`<div class="muted" id="vsumpend" style="color:#b45309;margin-top:4px">${esc(L.sheetPend||tr('Falta aprobar la hoja de Tony',"Tony's bill sheet is still pending approval"))}</div>`;
  h+=`<div class="r3p">${P3.map(p=>{const P=(R.people||{})[p]||{};const bills=+P.bills||0;
    return `<div class="r3c${p===R.who?' me':''}"><b>${esc(N(p))}</b>${P.pays>0.004?`<div><span class="muted">${esc(L.pays||'Paga')}</span> <b style="color:#b91c1c">${f(P.pays)}</b></div>`:''}${P.gets>0.004?`<div><span class="muted">${esc(L.gets||'Recibe')}</span> <b style="color:#15803d">${f(P.gets)}</b></div>`:''}${!(P.pays>0.004)&&!(P.gets>0.004)?`<div class="muted">${esc(L.even||'Al día')}</div>`:''}<div class="muted">${esc(L.part||tr('Su parte de las compras','Share of purchases'))}: ${f(P.part||0)}</div>${Math.abs(bills)>0.004||R.sheetApproved?`<div class="muted" id="r3bills-${p}">${esc(L.billsPart||tr('Su parte de las cuentas','Share of bills'))}: ${f(bills)}</div>`:''}</div>`;
  }).join('')}</div></div>`;
  return h;
}

function currentMonthR3(){
  const D=window.__DOC;if(!D||!D.months)return null;
  const tabs=document.querySelectorAll('.tabs button');
  let i=0;tabs.forEach((b,n)=>{if(b.classList.contains('on'))i=n});
  const mo=D.months[i]||D.months[0];
  return mo&&mo.r3?{mo,R:mo.r3,D}:null;
}

function tonyStatus(){
  const D=window.__DOC,sh=D&&D.billSheet;if(!sh)return null;
  if(sh.approved||sh.status==='approved'||(sh.from&&sh.from===sh.k))return 'approved';
  let sent=!!sh.pending;
  try{
    const ST=window.vbState&&window.vbState();
    if(ST&&ST.sent)sent=true;
    const tok=window.__TOK||'';
    if(localStorage.getItem('vbills-sent-'+tok+'-'+sh.k))sent=true;
    const dr=JSON.parse(localStorage.getItem('vbills-'+tok+'-'+sh.k)||'null');
    if(dr&&dr.sent)sent=true;
  }catch(e){}
  return sent?'pending':null;
}

function stampTonyStatus(){
  const form=$('bsform');if(!form)return;
  const st=tonyStatus();
  let el=$('bsst');
  if(!st){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='bsst';
    const h=form.querySelector('h2');if(h&&h.nextSibling)form.insertBefore(el,h.nextSibling);else form.prepend(el)}
  if(st==='approved'){el.textContent='✅ '+tr('Aprobada','Approved');el.style.cssText='background:#dcfce7;color:#166534;border-radius:10px;padding:8px 10px;margin:0 0 8px;font-weight:700;font-size:15px'}
  else{el.textContent=tr('Pendiente de aprobación','Pending approval');el.style.cssText='background:#fef3c7;color:#92400e;border-radius:10px;padding:8px 10px;margin:0 0 8px;font-weight:700;font-size:15px'}
}

function enhanceVsum(){
  const box=$('vsum');if(!box)return;
  const cur=currentMonthR3();const R=cur&&cur.R,D=window.__DOC,sh=D&&D.billSheet;
  const pending=(R&&R.sheetPending)||(sh&&sh.pending)||tonyStatus()==='pending';
  const approved=tonyStatus()==='approved'||(R&&R.sheetApproved);
  if(pending&&!approved){
    if(!$('vsumpend')){
      const d=document.createElement('div');d.id='vsumpend';d.className='muted';
      d.style.cssText='color:#b45309;margin-top:4px';
      d.textContent=tr('Falta aprobar la hoja de Tony',"Tony's bill sheet is still pending approval");
      const p=box.querySelector('.r3p');if(p)box.insertBefore(d,p);else box.append(d);
    }
  }else{const x=$('vsumpend');if(x)x.remove()}
  if(!R||!R.people)return;
  P3.forEach(p=>{
    const P=R.people[p]||{},bills=+P.bills||0;
    const card=[...box.querySelectorAll('.r3c')].find(el=>el.querySelector('b')&&el.querySelector('b').textContent===(R.names&&R.names[p]||p));
    if(!card)return;
    let line=card.querySelector('#r3bills-'+p);
    if(Math.abs(bills)>0.004||R.sheetApproved){
      const txt=tr('Su parte de las cuentas','Share of bills')+': '+(typeof f==='function'?f(bills):money(bills));
      if(!line){line=document.createElement('div');line.id='r3bills-'+p;line.className='muted';card.append(line)}
      line.textContent=txt;
    }else if(line)line.remove();
  });
}

function afterTonyDraw(){stampTonyStatus();enhanceVsum()}
if(typeof window.vBillsDraw==='function'){
  const _vb=window.vBillsDraw;
  window.vBillsDraw=function(){const r=_vb.apply(this,arguments);try{afterTonyDraw()}catch(e){console.warn(e)}return r};
}
if(typeof window.vRedraw==='function'){
  const _d=window.vRedraw;
  window.vRedraw=function(){const r=_d.apply(this,arguments);try{afterTonyDraw()}catch(e){}return r};
}

// ---------- Operaciones: Reparto de cuentas (Carlos → Tony y Carlos → Joe) ----------
if(typeof bsShareCard==='function'){
  const _bs=bsShareCard;
  bsShareCard=function(){
    const k=typeof S!=='undefined'?S.cur:'',m=S.months&&S.months[k];
    if(!m)return _bs.apply(this,arguments);
    const L2=(m.bills||[]).filter(b=>b.sheet&&b.sheet.sp);if(!L2.length)return _bs.apply(this,arguments);
    const fl=carlosFlows(m),c=calc(m),t=sheetShares(m),TT=typeof T==='function'?T:(s=>s);
    const ff=typeof f==='function'?f:(n=>'$'+(+n||0).toFixed(2));
    const food=typeof comidaBill==='function'?comidaBill(m,false):null,foodPaid=food?rr(Math.min(+food.paid||0,+food.amount||0)):0,foodRem=food?rr(Math.max(0,(+food.amount||0)-foodPaid)):0;
    const foodNote=foodPaid>0.005?`<div class="muted">${TT('Incluye abonos de comida {0} (queda {1} en Comida)',ff(foodPaid),ff(foodRem))}</div>`:'';
    const c2tNote=`<div class="muted">${TT('cuentas {0} + compras {1}',ff(fl.billsTony),ff(fl.purchTony))}</div><div class="muted">${TT('La app no registra cuándo le paga a Tony.')}</div>`;
    let cj='';
    if(fl.pendJoe>0.004){
      const paid=fl.recv>0.004?`<div class="muted">${TT('Ya pagado')} ${ff(fl.recv)}</div>`:'';
      cj=`<div class="row" id="bscj"><span class="n">${TT('Carlos → Joe')}<div class="muted">${TT('de compras compartidas')}</div>${paid}</span><b>${ff(fl.pendJoe)}</b></div>`;
    }else if(fl.pendJoe<-0.004){
      cj=`<div class="row" id="bscj"><span class="n">${TT('Joe → Carlos')}<div class="muted">${TT('de compras compartidas')}</div></span><b>${ff(-fl.pendJoe)}</b></div>`;
    }
    const ar=Math.abs(t.Arianna)>0.004?`<div class="row"><span class="n">${TT('Arianna (lo paga Tony)')}</span><span>${ff(t.Arianna)}</span></div>`:'';
    return `<div class="card" id="bscard"><h2>🧾 ${TT('Reparto de cuentas')}<span class="muted" style="font-size:13px">${typeof lbl==='function'?lbl(k):k}</span></h2>
 <div class="row"><span class="n">${TT('Joe → Tony')}<div class="muted">${TT('Ya pagado')} ${ff(c.xfer||0)}</div>${foodNote}</span><span>${ff(c.bills)} · <b>${TT('Pendiente')} ${ff(c.tonyDue)}</b></span></div>
 <div class="row" id="bsct"><span class="n">${TT('Carlos → Tony')}${c2tNote}</span><b>${ff(fl.toTony)}</b></div>
 ${cj}${ar}
 <div class="row"><span class="n">${TT('Tony (suyo)')}</span><span>${ff(t.Tony)}</span></div></div>`;
  };
}

window._v152={sheetShares,isCovered,setGate,pendingLatest,dropCovered,monthApproved,monthPending,r3CardHtml,tonyStatus,enhanceVsum,r3DetAll,carlosFlows,purchTonyCarlos};

document.head.insertAdjacentHTML('beforeend',`<style>
#bsst{line-height:1.3}#vsumpend{font-size:13px}
.r3p{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
.r3c{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px;font-size:13px}
.r3c.me{border:2px solid #2563eb;background:#eff6ff}
</style>`);
})();
