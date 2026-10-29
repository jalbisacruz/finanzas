// v115 (Joe): el escaneo de recibos no crea tiendas basura (tarjetas, métodos de pago, teléfonos, "Mobil" mal leído).
// Tiendas reales nuevas (p. ej. Kangaroo) SÍ se añaden a la lista al guardar. Al abrir, se quitan de la lista las basura ya guardadas
// (no se tocan las compras existentes).
const V115_PAY=/\b(store\s*card|credit|debit|d[eé]bito|cr[eé]dito|visa|master\s*card|mastercard|amex|american\s*express|discover|card|tarjeta|chase|bank\s*of\s*america|boa|capital\s*one|citi(bank)?|synchrony|paypal|apple\s*pay|google\s*pay|cash\s*app|zelle|venmo|efectivo|cash|change|cambio|approved|auth(orization)?|account|acct|xx+\d*)\b|\*{2,}\d+|-\s*\d{4}\s*$/i;
function v115Junk(n,o){const s=String(n||'').trim();if(!s)return true;
 const d=s.replace(/\D/g,'');if(d.length>=7&&d.length>=s.replace(/\s/g,'').length*.6)return true; // teléfono / números
 if(!/[a-z\u00c0-\u024f]{2}/i.test(s))return true;
 if(V115_PAY.test(s))return true;
 if(/^(m[oó]vil|mobile?)$/i.test(s)){ // "Mobil" solo vale si el recibo es claramente de gasolina
  const it=(o&&Array.isArray(o.items))?o.items:[];return !it.some(x=>/gas|fuel|unleaded|regular|premium|diesel|gasolina/i.test((x.name||'')+' '+(x.category||'')))}
 return false}
{const _ss=scanStore;scanStore=function(n){return v115Junk(n,window._v115o)?null:_ss.apply(this,arguments)}}
{const _sa=scanApply;scanApply=function(o){window._v115o=o;try{return _sa.apply(this,arguments)}finally{window._v115o=null}}}
{const _sp=scanPrompt;scanPrompt=function(){return _sp()+`\nIMPORTANTE: "store" es el nombre del comercio impreso arriba del recibo. NUNCA uses el nombre de la tarjeta o método de pago (p. ej. "AMAZON STORE CARD", "VISA", "Chase", "-8720"), ni un teléfono, ni "Mobil"/"Mobile" salvo que sea una gasolinera Mobil. Si no lo ves claro, pon null y añade "store" a "uncertain".`}}
// al guardar una compra con tienda real nueva → se añade a la lista
{const _sv=saveP;saveP=function(){const st=D&&D.store;const r=_sv.apply(this,arguments);
 if(st&&!v115Junk(st)){S.stores=S.stores||[];const k=x=>String(x).toLowerCase().replace(/[^a-z0-9]/g,'');if(!S.stores.some(x=>k(x)===k(st))){S.stores.push(st);save()}}return r}}
// limpieza de datos ya guardados (solo la lista de tiendas y la memoria de tiendas)
function v115Clean(st){if(!st)return 0;let n=0;if(Array.isArray(st.stores)){const b=st.stores.length;st.stores=st.stores.filter(s=>!v115Junk(s));n+=b-st.stores.length}
 if(st.storeMem)Object.keys(st.storeMem).forEach(k=>{const nm=(st.storeMem[k]||{}).name||k;if(v115Junk(nm)){delete st.storeMem[k];n++}});return n}
{const _m=migrate;migrate=function(st){const r=_m.apply(this,arguments);v115Clean(st);return r}}
if(v115Clean(S))localStorage.setItem(K,JSON.stringify(S));
