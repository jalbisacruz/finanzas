// v123 (Joe): 1) Una tienda sin ficha en el catálogo (p. ej. añadida por el escaneo) no guardaba el nombre al editarla con ✏️:
// el cambio no tenía dónde guardarse. Ahora toda tienda de la lista tiene su ficha y la edición siempre se guarda (y sube a la nube).
// 2) v122 solo corregía el nombre interno; si el nombre visible (etiqueta) era «AMAZON STORE CARD -8720», seguía saliendo. Ahora también.
function v123Fix(st){if(!st||!st.catalog||!st.catalog.items)return 0;const I=st.catalog.items;let n=0;
 (st.stores||[]).forEach(s=>{if(s&&!Object.values(I).some(it=>it&&it.t==='store'&&it.key===s)){I[idFor('store',s)]={t:'store',key:s};n++}});
 Object.values(I).forEach(it=>{if(it&&it.t==='store'&&it.name!==undefined&&v122Name(it.name)!==it.name){const t=v122Name(it.name);if(t===it.key)delete it.name;else it.name=t;n++}});
 if(Array.isArray(st.stores)){const seen=new Set(),out=[];st.stores.forEach(s=>{if(!seen.has(s)){seen.add(s);out.push(s)}else n++});st.stores=out}
 if(n&&typeof lblDirty==='function')lblDirty();return n}
{const _m=migrate;migrate=function(st){const r=_m.apply(this,arguments);v123Fix(st);return r}}
{const _st=window.setState;window.setState=o=>{const ch=v123Fix(o);_st(o);if(ch)setTimeout(()=>{save();render()},0)}}
{const _e=CTL.stores.edit;CTL.stores.edit=i=>{if(v123Fix(S))save();return _e(i)}}
{const _sv=save;save=function(){v123Fix(S);return _sv.apply(this,arguments)}}
if(v123Fix(S)){localStorage.setItem(K,JSON.stringify(S));window.__v123dirty=true}
// 3) Al editar la fecha de una compra a otro mes, se quedaba en el mes viejo (solo las nuevas usaban la fecha). Ahora se mueve al mes de su fecha.
function v123Move(id,date){if(!id||!date||!S.months)return 0;const to=monthFor(date);if(!S.months[to])return 0;let p=null;
 Object.keys(S.months).forEach(k=>{if(k===to)return;const L=S.months[k].purchases||[],i=L.findIndex(x=>x.id===id);if(i>=0){p=L.splice(i,1)[0]}});
 if(!p)return 0;const T2=S.months[to].purchases=S.months[to].purchases||[];if(!T2.some(x=>x.id===id))T2.unshift(p);return 1}
{const _sv=saveP;saveP=function(){const id=D&&D.id,dt=D&&D.date;const r=_sv.apply(this,arguments);
 if(D&&D.id===id&&!Object.values(S.months).some(m=>(m.purchases||[]).some(x=>x.id===id&&x.date===dt)))return r; // no se guardó
 if(v123Move(id,dt)){save();render()}return r}}
