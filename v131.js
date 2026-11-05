// v131 (Joe): bajo «Ingresos esperados», desglose claro estilo Credit Karma:
//   Real cobrado (total del mes)
//   💼 YoWash  (suma de lo que falta)
//      12 nov  ~$…
//   🏪 Walmart (suma de lo que falta)
//      19 nov  ~$…
// Cada fecha pendiente usa el monto del próximo cheque; si está Pendiente, el último cobrado.
Object.assign(EN,{"Real cobrado":"Actually received"});
(function(){
  const thuIn=k=>{const out=[];let x=new Date(k+'-01T12:00');while(x.getDay()!==4)x.setDate(x.getDate()+1);
    for(;;){const s=x.toLocaleDateString('en-CA');if(!s.startsWith(k))break;out.push(s);x.setDate(x.getDate()+7)}return out};
  const ywLast=()=>{const d=(S.checks||[]).filter(c=>c.status==='deposited'&&+c.amount>0).sort((a,b)=>(a.date||'')<(b.date||'')?1:-1);return d.length?r2(+d[0].amount):0};
  const wmLast=()=>{const p=(S.wm||{}).paid||{};const ks=Object.keys(p).filter(k=>+p[k]>0).sort();return ks.length?r2(+p[ks[ks.length-1]]):0};
  const ywUnit=()=>{const pc=pendingCheck();return pc&&!pc.amtPending&&+pc.amount>0?r2(+pc.amount):ywLast()};
  const wmUnit=()=>{const {a}=wmProj();return a>0?r2(a):wmLast()};

  const _p=planNums;planNums=function(){
    const P=_p(),k=P.k;
    const ywA=ywUnit(),wmA=wmUnit();
    const ywPaid=new Set((S.checks||[]).filter(c=>c.status==='deposited'&&(c.date||'').startsWith(k)).map(c=>c.date));
    const ywLeft=thuIn(k).filter(d=>!ywPaid.has(d));
    const wmLeft=wmPaydays(k+'-01',k+'-31').filter(d=>d>=WM_ANCHOR&&!((S.wm||{}).paid||{})[d]);
    const ywLines=ywA>0?ywLeft.map(d=>({d,a:ywA})):[];
    const wmLines=wmA>0?wmLeft.map(d=>({d,a:wmA})):[];
    const ywEst=r2(sum(ywLines,x=>x.a)),wmEst=r2(sum(wmLines,x=>x.a));
    const real=r2((P.ywGot||0)+(P.wmGot||0));
    const n=ywLines.length+wmLines.length;
    const inc=r2(real+ywEst+wmEst);
    return {...P,inc,plan:r2(inc-P.bud),n,ywEst,wmEst,real,ywLines,wmLines};
  };

  function breakHtml(P){
    const real=P.real||0,yw=P.ywLines||[],wm=P.wmLines||[];
    if(!(real>0.004||yw.length||wm.length))return'';
    const co=(lab,v)=>`<div class="row pl-ib co"><span class="n">${lab}</span><b>~${f(v)}</b></div>`;
    const dr=x=>`<div class="row pl-ib d"><span class="n">${fdate(x.d)}</span><span>~${f(x.a)}</span></div>`;
    let h=`<div id="pl-inc-break">`;
    if(real>0.004)h+=`<div class="row pl-ib real"><span class="n">${T('Real cobrado')}</span><b>${f(real)}</b></div>`;
    if(yw.length){h+=co('💼 YoWash',P.ywEst);yw.forEach(x=>h+=dr(x))}
    if(wm.length){h+=co('🏪 Walmart',P.wmEst);wm.forEach(x=>h+=dr(x))}
    return h+`</div>`;
  }

  const _pv=planV78;planV78=function(){
    const h=_pv(),br=breakHtml(planNums());
    if(!br)return h;
    return h.replace(/(<div class="row pl" id="pl-inc">[\s\S]*?<\/div>)/,m=>m+br);
  };

  document.head.insertAdjacentHTML('beforeend',`<style>
#pl-inc-break{margin:2px 0 6px;padding:8px 10px;background:#f8fafc;border-radius:10px;border-left:3px solid #93c5fd}
#pl-inc-break .row.pl-ib{border:0;padding:3px 0;font-size:14px;align-items:baseline}
#pl-inc-break .row.pl-ib.real b{color:#15803d;font-weight:700}
#pl-inc-break .row.pl-ib.co{font-weight:600;padding-top:7px}
#pl-inc-break .row.pl-ib.co:first-child,#pl-inc-break .row.pl-ib.real+ .row.pl-ib.co{padding-top:3px}
#pl-inc-break .row.pl-ib.d{padding:2px 0 2px 16px;color:#64748b;font-size:13px}
#pl-inc-break .row.pl-ib.d span:last-child{color:#334155;font-variant-numeric:tabular-nums}
</style>`);
})();
