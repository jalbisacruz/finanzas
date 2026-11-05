// v130 (Joe): si el próximo cheque está Pendiente (sin monto), los cobros que faltan del mes
// se estiman con el ÚLTIMO cheque cobrado de esa compañía. Si lo defines con ＋ Añadir, se usa ese.
// La caja azul sigue mostrando «Pendiente».
(function(){
  const thuIn=k=>{const out=[];let x=new Date(k+'-01T12:00');while(x.getDay()!==4)x.setDate(x.getDate()+1);
    for(;;){const s=x.toLocaleDateString('en-CA');if(!s.startsWith(k))break;out.push(s);x.setDate(x.getDate()+7)}return out};
  const ywLast=()=>{const d=(S.checks||[]).filter(c=>c.status==='deposited'&&+c.amount>0).sort((a,b)=>(a.date||'')<(b.date||'')?1:-1);return d.length?r2(+d[0].amount):0};
  const wmLast=()=>{const p=(S.wm||{}).paid||{};const ks=Object.keys(p).filter(k=>+p[k]>0).sort();return ks.length?r2(+p[ks[ks.length-1]]):0};
  const _p=planNums;planNums=function(){
    const P=_p(),k=P.k;let {ywEst,wmEst,n}=P;
    if(!(ywEst>0)){const a=ywLast();if(a>0){const paid=new Set((S.checks||[]).filter(c=>c.status==='deposited'&&(c.date||'').startsWith(k)).map(c=>c.date));
      const left=thuIn(k).filter(d=>!paid.has(d)).length;ywEst=r2(a*left);n+=left}}
    if(!(wmEst>0)){const a=wmLast();if(a>0){const left=wmPaydays(k+'-01',k+'-31').filter(d=>d>=WM_ANCHOR&&!((S.wm||{}).paid||{})[d]).length;wmEst=r2(a*left);n+=left}}
    const inc=r2(P.ywGot+P.wmGot+ywEst+wmEst);
    return {...P,inc,plan:r2(inc-P.bud),n,ywEst,wmEst};
  };
})();
