// v153 (Joe): después de aprobar la hoja (y al abrir la app o al guardar),
// se republica el enlace de Tony/Carlos con las cifras de v152 (parte de
// Carlos en las cuentas, Carlos→Joe, estado aprobado). Antes, el snapshot
// del enlace solo se escribía tras un push a la nube; si Joe abría la app
// nueva sin guardar, Tony seguía viendo el r3 viejo (compras nada más).
// No se tocan las reglas. Escritura solo desde la app de Joe (fbShareSet).
(function(){
function publishShares(force){
  if(typeof linksSync==='function')linksSync(!!force);
}
if(typeof save==='function'){
  const _s=save;
  save=function(){const r=_s.apply(this,arguments);try{publishShares(false)}catch(e){}return r};
}
if(typeof bsApprove==='function'){
  const _ap=bsApprove;
  bsApprove=function(id,force){
    const r=_ap(id,force);
    if(r&&(r.ok||r.done))try{publishShares(true)}catch(e){}
    return r;
  };
}
function waitAndPublish(){
  if(typeof linksSync!=='function'||typeof snapFor0!=='function')return;
  let n=0;
  const tick=()=>{
    n++;
    if(window.fbShareSet&&typeof window.fbUser==='function'&&window.fbUser()){publishShares(false);return}
    if(n<80)setTimeout(tick,250);
  };
  setTimeout(tick,200);
}
if(typeof linksSync==='function'&&typeof snapFor0==='function'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitAndPublish);
  else waitAndPublish();
}
window._v153={publishShares};
})();
