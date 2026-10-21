// v97 (Joe): bloque «Mi mes» arriba de MI resumen (no en los de Tony/Carlos) y «Gastado X (Y% del presupuesto)» en el Plan del mes.
// Mismas definiciones que planNums (extra.js): presupuesto = suma de S.budgets>0; gastado = budBy(m) en categorías con presupuesto
// (compras compartidas: solo la parte de Joe); ingresos recibidos = earned(m).total; ahorrado = recibido − gastado (= «Sobrante real»).
Object.assign(EN,{"Gastado ({0}% del presupuesto)":"Spent ({0}% of budget)"});
function miMes(k){const m=S.months[k];if(!m)return null;const ent=Object.entries(S.budgets||{}).filter(([,l])=>+l>0);if(!ent.length)return null;
 const bud=r2(sum(ent,([,l])=>+l)),by=budBy(m).by,sp=r2(sum(ent,([c])=>by[c]||0)),rec=r2(earned(m).total);
 return {bud,sp,pct:bud>0?Math.round(sp/bud*100):null,rec,sav:r2(rec-sp)}}
pdfMonth=k=>{const R=r3Data(k,'Yo'),mm=miMes(k);if(mm)R.mimes=mm;return rep3PDF(R,D2=>pdfMine(D2,k))};
{const _p=planV78;planV78=function(){const h=_p(),P=planNums();if(!P.ent.length)return h;const pct=P.bud>0?Math.round(P.sp/P.bud*100):0;
 return h.replace(/(<div class="row pl" id="pl-bud">[\s\S]*?<\/div>)/,(a)=>a+`<div class="row pl" id="pl-sp"><span class="n">${T('Gastado ({0}% del presupuesto)',pct)}</span><b class="${P.sp>P.bud+0.004?'neg':''}">${f(P.sp)}</b></div>`)}}
