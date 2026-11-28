// v181 (Joe): (1) un solo dispositivo nunca debe recibir el aviso «Datos distintos en la nube» por sus propios cambios (sync.js: el dispositivo
// se reconoce por un id propio y por lo que ya mandó; «Sincronizado» solo si no hay cambios sin subir; texto del aviso y recomendación de la más nueva).
// (2) Un gasto con tienda (Compra manual › Solo mía) se muestra con la tienda en «Pagar tarjeta», en los cargos de cada tarjeta y en Devolución,
// y la búsqueda siempre ve lo último que se guardó (el índice ya no se queda viejo).
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "⚠️ Falta decidir qué datos usar":"⚠️ Choose which data to use",
  "La nube tiene cambios hechos desde otro dispositivo (o desde Safari / la app de la pantalla de inicio) y este dispositivo también cambió. ¿Cuáles quieres usar?":"The cloud has changes made from another device (or from Safari / the home-screen app) and this device changed too. Which do you want to use?",
  "La nube tiene una versión guardada por este mismo dispositivo que es más nueva que la de ahora. ¿Cuál quieres usar?":"The cloud has a version saved by this same device that is newer than the current one. Which do you want to use?",
  "La nube y este dispositivo tienen datos distintos (no se sabe desde dónde se guardó la de la nube). ¿Cuáles quieres usar?":"The cloud and this device have different data (it is not known where the cloud copy was saved from). Which do you want to use?",
  "Lo más nuevo: este dispositivo.":"Newest: this device.","Lo más nuevo: la nube.":"Newest: the cloud.",
  "Usar la nube (reemplaza este dispositivo)":"Use the cloud (replaces this device)","Usar este dispositivo (recomendado)":"Use this device (recommended)",
  "Detalle técnico":"Technical detail"
});
// etiqueta de un gasto propio: «Tienda · descripción (o categoría)»; sin tienda queda como antes
window.v181GLabel=function(x,fb){
  const d=String((x&&x.desc)||(typeof DN==='function'&&x&&x.cat?DN(x.cat):'')||fb||'');
  const st=x&&x.store?String(typeof v124Store==='function'?v124Store(x.store):(typeof DN==='function'?DN(x.store):x.store)):'';
  if(!st)return d;
  if(!d||d===st||d.startsWith(st+' ·')||d.startsWith(st+' '))return st;
  return st+' · '+d;
};
// la búsqueda de Operaciones guarda un índice; se invalida con cada guardado (antes dependía solo de S.updatedAt, que no cambia si se guarda antes de cargar la nube)
if(typeof save==='function'){
  const _s=save;
  save=function(){try{OS_IDX=null}catch(e){}const r=_s.apply(this,arguments);try{OS_IDX=null}catch(e){}return r};
}
if(typeof setState==='function'||window.setState){
  const _ss=window.setState;
  window.setState=function(){try{OS_IDX=null}catch(e){}return _ss.apply(this,arguments)};
}
window._v181={label:window.v181GLabel};
})();
