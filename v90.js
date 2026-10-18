// v90 «Nada de redundar»: en Hoy cada cosa aparece una sola vez.
// · Compras por revisar: solo la línea de Recordatorios (el botón amarillo se quitó). Si Joe la oculta (✕), sigue en Operaciones › Compras.
// · «📌 cosas por hacer» ya no cuenta lo que Recordatorios muestra (tarjetas que vencen, Tony sin transferir); si no queda nada más, la línea no sale.
Object.assign(EN,{"📌 1 cosa más por hacer":"📌 1 more thing to do","📌 {0} cosas más por hacer":"📌 {0} more things to do"});
const remDupN=()=>{try{return remList().filter(r=>/^(card|tony):/.test(r.id)).length}catch(e){return 0}};
{const _tcV90=todoCard;todoCard=function(){const h=_tcV90(),n=todoN(),d=Math.min(remDupN(),n);if(!d)return h;const rest=n-d;if(rest<=0)return '';
 return h.replace(/(<button[^>]*id="todobtn"[^>]*><span>)[^<]*(<\/span>)/,(_,a,b)=>a+(rest===1?T('📌 1 cosa más por hacer'):T('📌 {0} cosas más por hacer',rest))+b)}}
// Operaciones › Compras: entrada al buzón (no está en Hoy, así que no se repite allí)
{const _ocV90=opsCompras;opsCompras=function(){const h=_ocV90(),n=typeof INBOX!=='undefined'?INBOX.length:0;if(typeof inboxLoad==='function')try{inboxLoad()}catch(e){}if(!n)return h;const i=h.indexOf('</h2>');if(i<0)return h;
 return h.slice(0,i+5)+`<button id="inbbtn" style="width:100%;background:#ca8a04;margin:4px 0 8px" onclick="inboxList()">${T('📥 Compras por revisar ({0})',n)}</button>`+h.slice(i+5)}}
