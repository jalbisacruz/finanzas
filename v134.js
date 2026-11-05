// v134 (Joe): Walmart se deposita SOLO a las 4:00 AM del jueves de cobro, igual que YoWash (autoDeposit),
// con el monto que Joe puso (estimado/ajuste). Sin monto (Pendiente / $0) no se deposita nada (como YoWash).
// Ya no sale la tarjeta «¿Llegó el cheque de Walmart?». Tras depositar, el próximo queda «Pendiente».
Object.assign(EN,{"Cheque Walmart de {0} depositado automáticamente":"Walmart check for {0} deposited automatically"});
wmConfirmCard=function(){return''};
function v134WmAuto(){if(!S.wm&&!S.months)return 0;const now=new Date(),w=v116W();let tot=0,d=wmNext(),g=0;
 while(d&&g++<30&&new Date(d+'T04:00:00')<=now){const a=wmAmt(d);if(!(a>0))break;
  const mk=monthFor(d);if(!S.months[mk])break;const c='🏪 Walmart';if(!S.incCats.includes(c))S.incCats.push(c);
  const m=S.months[mk],dm=L();debE(dm).amount=r2((+debE(dm).amount||0)+a);
  (m.events=m.events||[]).push({id:uid(),type:'income',date:d,amount:a,concept:c,desc:'Walmart '+fdate(d)+' (automático)',method:'deb',auto:true});
  w.paid[d]=a;const nx=addD(d,14);w.chk[nx]=0;if(w.pendCleared===nx)delete w.pendCleared;tot+=a;d=wmNext()}
 if(tot>0){save();toast(T('Cheque Walmart de {0} depositado automáticamente',f(r2(tot))))}return tot}
{const _a=autoDeposit;autoDeposit=function(){_a();if(v134WmAuto()>0&&unlocked)render()}}
