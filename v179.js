// v179 (Joe): fuera de Inicio la tarjeta «🧾 Deudas de compras» (#owecard). Joe ya le pagó a Tony esas compras
// (su parte va como abonos de comida en las cuentas de Tony) y la tarjeta solo mostraba una parte de las deudas.
// No cambia ningún cálculo (owesBy, calc, Reparto de cuentas, Transferir a Tony, Mi balance, PDFs): solo se quita la tarjeta.
(function(){
if(typeof render!=='function')return;
const _r=render;render=function(){const r=_r.apply(this,arguments);
  try{if(typeof tab!=='undefined'&&tab==='ini'){const c=document.getElementById('owecard');if(c)c.remove()}}catch(e){}
  return r};
const st=document.createElement('style');st.textContent='#v #owecard{display:none!important}';document.head.append(st);
window._v179=1;
})();
