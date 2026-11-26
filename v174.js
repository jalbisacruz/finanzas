// v174 (Joe): el PDF de Tony ya no repite la tabla vieja «Cuentas de Tony»
// (Cuenta / Monto / Estado) cuando trae la página 2 «Reparto de las cuentas de
// la casa» (v173), que ya muestra cada cuenta con su reparto, lo transferido y
// lo pendiente. Si el mes no tiene hoja aprobada (no hay página 2), la tabla
// vieja se queda para que Tony siga viendo sus cuentas. El PDF de Joe y el de
// Carlos no cambian.
(function(){
const hasSplit=R=>!!(R&&R.tonySplit&&R.tonySplit.rows&&R.tonySplit.rows.length);
if(typeof rep3PDF==='function'){
  const prev=rep3PDF;
  rep3PDF=function(R,extra){
    try{
      if(R&&R.who==='Tony'&&!R.tonySplit&&window._v173&&typeof _v173.buildTonySplit==='function'&&typeof S!=='undefined'){
        const sp=_v173.buildTonySplit(R.k);if(sp)R=Object.assign({},R,{tonySplit:sp});
      }
      if(R&&R.who==='Tony'&&hasSplit(R)&&R.showBills)R=Object.assign({},R,{showBills:false});
    }catch(e){console.warn('v174',e)}
    return prev.call(this,R,extra);
  };
}
window._v174={hasSplit};
})();
