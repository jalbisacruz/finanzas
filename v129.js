// v129 (Joe): Ingresos esperados del mes = cobrados reales (YoWash + Walmart) del mes
// + estimado de los cobros que AÚN faltan: monto del PRÓXIMO cheque × nº de cobros sin cobrar
//   · YoWash: cada jueves del mes (~4)
//   · Walmart: jueves alternos del mes (~2)
// Si el próximo está Pendiente (sin monto), NO se inventa nada para esas semanas.
(function(){
  const thuIn=k=>{const out=[];let x=new Date(k+'-01T12:00');while(x.getDay()!==4)x.setDate(x.getDate()+1);
    for(;;){const s=x.toLocaleDateString('en-CA');if(!s.startsWith(k))break;out.push(s);x.setDate(x.getDate()+7)}return out};
  const ywNextAmt=()=>{const pc=pendingCheck();return pc&&!pc.amtPending&&+pc.amount>0?r2(+pc.amount):0};
  const wmNextAmt=()=>{const {a}=wmProj();return a>0?r2(a):0};
  const _p=planNums;planNums=function(){
    const P=_p(),k=P.k,m=S.months[k]||L(),er=earned(m);
    const ywGot=r2(er.by['💼 Cheque']||0),wmGot=r2(er.by['🏪 Walmart']||0);
    const ywA=ywNextAmt(),wmA=wmNextAmt();
    const ywPaid=new Set((S.checks||[]).filter(c=>c.status==='deposited'&&(c.date||'').startsWith(k)).map(c=>c.date));
    const ywLeft=thuIn(k).filter(d=>!ywPaid.has(d));
    const wmLeft=wmPaydays(k+'-01',k+'-31').filter(d=>d>=WM_ANCHOR&&!((S.wm||{}).paid||{})[d]);
    const ywEst=ywA>0?r2(ywA*ywLeft.length):0,wmEst=wmA>0?r2(wmA*wmLeft.length):0;
    const n=(ywA>0?ywLeft.length:0)+(wmA>0?wmLeft.length:0);
    const inc=r2(ywGot+wmGot+ywEst+wmEst);
    return {...P,inc,plan:r2(inc-P.bud),n,ywGot,wmGot,ywEst,wmEst};
  };
})();
