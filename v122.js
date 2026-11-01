// v122 (Joe): «AMAZON STORE CARD -8720» (nombre de la tarjeta) → «Amazon». Se corrige en la lista de tiendas, en las compras
// y en la memoria de tiendas, al abrir y cada vez que llegan datos de la nube. El escaneo nunca vuelve a poner el nombre de la tarjeta.
const V122_AMZ=/amazon|amzn/i;
function v122Name(n){const s=String(n||'').trim();return (V122_AMZ.test(s)&&(v115Junk(s)||/^amzn|amazon\.com|amazon\s*(mktp|marketplace|prime)/i.test(s)))?'Amazon':s}
function v122Fix(st){if(!st)return 0;let n=0;const k=x=>String(x).toLowerCase().replace(/[^a-z0-9]/g,'');
 if(Array.isArray(st.stores)){const out=[];st.stores.forEach(s=>{const t=v122Name(s);if(t!==s)n++;if(!out.some(x=>k(x)===k(t)))out.push(t);else if(t!==s)0});st.stores=out}
 Object.values(st.months||{}).forEach(m=>(m.purchases||[]).forEach(p=>{const t=v122Name(p.store);if(p.store&&t!==p.store){p.store=t;n++}}));
 if(st.storeMem)Object.keys(st.storeMem).forEach(key=>{const v=st.storeMem[key]||{};const nm=v.name||key;if(v122Name(nm)!==nm){const nk=k('Amazon');if(!st.storeMem[nk])st.storeMem[nk]={...v,name:'Amazon'};if(key!==nk)delete st.storeMem[key];n++}});
 const I=st.catalog&&st.catalog.items;if(I&&typeof idFor==='function'){const aid=idFor('store','Amazon');let hit=0;
  Object.keys(I).forEach(id=>{const it=I[id];if(it&&it.t==='store'&&v122Name(it.key)!==it.key){hit=1;n++;if(id!==aid)delete I[id];else it.key='Amazon'}});
  if(hit||n){if(!I[aid])I[aid]={t:'store',key:'Amazon'};Object.values(st.months||{}).forEach(m=>(m.purchases||[]).forEach(p=>{if(p.store==='Amazon')p.storeId=aid}))}}
 if(n&&Array.isArray(st.stores)&&!st.stores.some(x=>k(x)==='amazon'))st.stores.push('Amazon');return n}
{const _ss=scanStore;scanStore=function(n){if(V122_AMZ.test(String(n||'')))return _ss('Amazon')&&'Amazon';const r=_ss.apply(this,arguments);return r?v122Name(r):r}}
{const _sv=saveP;saveP=function(){if(D&&D.store)D.store=v122Name(D.store);return _sv.apply(this,arguments)}}
{const _m=migrate;migrate=function(st){const r=_m.apply(this,arguments);v122Fix(st);return r}}
{const _st=window.setState;window.setState=o=>{const ch=v122Fix(o);_st(o);if(ch)setTimeout(()=>{save();render()},0)}}
if(v122Fix(S)){localStorage.setItem(K,JSON.stringify(S));window.__v122dirty=true}
