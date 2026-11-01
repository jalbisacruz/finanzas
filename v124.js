// v124 (Joe): en Tiendas seguía saliendo «AMAZON STORE CARD -8720». Causa: los nombres visibles se buscaban solo por clave,
// sin mirar el tipo; si una tarjeta (u otra ficha) tenía la misma clave «Amazon» con ese nombre largo, la tienda tomaba
// el nombre de la tarjeta. Ahora una tienda usa solo el nombre de su ficha de tienda, y nunca muestra un nombre de tarjeta.
function v124Store(s){const I=(S&&S.catalog&&S.catalog.items)||{};const it=Object.values(I).find(x=>x&&x.t==='store'&&x.key===s);
 const n=it&&it.name!==undefined?it.name:DN0(s);const e=it&&it.emoji;const c=v122Name(n);return e?e+' '+c:c}
CTL.stores.items=()=>(S.stores||[]).map(s=>({label:v124Store(s)}));
{const _e=CTL.stores.edit;CTL.stores.edit=function(i){const r=_e.apply(this,arguments);const s=S.stores[i],el=document.getElementById('ndn');if(el&&s!==undefined)el.value=v124Store(s);return r}}
CTL.stores.add=()=>nameDlg({title:T('Nuevo'),onOk:({n})=>{n=v122Name(n);S.stores=S.stores||[];const k=x=>String(x).toLowerCase().replace(/[^a-z0-9]/g,'');
 if(S.stores.some(x=>k(x)===k(n)||k(v124Store(x))===k(n))){alert(T('Ya existe'));return false}S.stores.push(n)}});
// en compras, informes y notas: si la etiqueta de una tienda es un nombre de tarjeta, mostrar el nombre limpio
{const _d=window.DNo;window.DNo=s=>{const r=_d(s);if(r!==undefined&&S&&(S.stores||[]).includes(s)&&v122Name(r)!==r)return v124Store(s);return r}}
