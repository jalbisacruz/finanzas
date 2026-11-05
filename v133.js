// v133 (Joe): «Cheques depositados» solo leía S.checks (YoWash). Walmart se guarda en S.wm.paid (wmGotSave),
// así que nunca salía ahí. Ahora la lista junta YoWash + Walmart del mes, cada línea con su nombre.
{const _d=depChecks;depChecks=function(){const yw=_d().map(c=>({...c,src:c.src||'💼 YoWash'})),P=(S.wm||{}).paid||{};
 const wm=Object.keys(P).filter(d=>d.startsWith(S.cur)&&+P[d]>0).map(d=>({id:'wm-'+d,date:d,amount:+P[d],status:'deposited',src:'🏪 Walmart'}));
 return yw.concat(wm).sort((a,b)=>(a.date||'')<(b.date||'')?1:(a.date||'')>(b.date||'')?-1:(a.src<b.src?-1:1))}}
