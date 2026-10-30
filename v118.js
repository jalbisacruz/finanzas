// v118 (Joe): "Dinero de terceros" se veía roto (montos que empiezan con $1 se reemplazaban como $1 del regex — arreglado en v87.js).
// Además: filas del balance responsive en pantallas pequeñas (etiqueta se ajusta, el monto nunca baja de línea).
document.head.insertAdjacentHTML('beforeend','<style>#balcard .row{display:flex;align-items:baseline;gap:10px}#balcard .row>.n{flex:1 1 auto;min-width:0;overflow-wrap:anywhere}#balcard .row>:last-child:not(.n){flex:0 0 auto;white-space:nowrap;text-align:right}</style>');
