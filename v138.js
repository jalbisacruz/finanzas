// v138 (Joe): bajo «Real cobrado» se ve de dónde sale: 💼 YoWash, 🏪 Walmart y ⚡ EarlyPay del mes
// (solo los > 0). Mismas fuentes que el total (ywGot, wmGot, ep), así siempre cuadran.
{const _pv=planV78;planV78=function(){const h=_pv(),P=planNums(),yw=r2(P.ywGot||0),wm=r2(P.wmGot||0),ep=r2(P.ep||0);
 const row=(id,l,v)=>v>0.004?`<div class="row pl-ib d" id="${id}"><span class="n">${l}</span><span>${f(v)}</span></div>`:'';
 const rows=row('pl-yw','💼 YoWash',yw)+row('pl-wmg','🏪 Walmart',wm)+row('pl-ep','⚡ '+T('EarlyPay'),ep);
 const t=h.replace(/<div class="row pl-ib d" id="pl-ep">[\s\S]*?<\/div><\/span><\/div>|<div class="row pl-ib d" id="pl-ep"><span class="n">[^<]*<\/span><span>[^<]*<\/span><\/div>/,'');
 return t.replace(/(<div class="row pl-ib real">[\s\S]*?<\/div>)/,'$1'+rows)}}
