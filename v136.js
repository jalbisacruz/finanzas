// v136 (Joe): recibos de Publix (Arianna / buzón) sugerían ⛽ Gasolina. Causas:
//  1) storeMem de «Publix» podía recordar Gasolina (p. ej. un Publix Fuel o un error viejo).
//  2) Al abrir el buzón, editP aplicaba la memoria de S.stores[0] y luego cambiaba la tienda a Publix
//     sin recalcular la categoría.
//  3) scanCat hacía match flojo: «Gas» ⊂ «Gasolina».
// Arreglo: Publix de supermercado → categoría «Compras» (la que ya tiene Joe). Publix Fuel / gasolinera
// sigue pudiendo ser Gasolina. No reescribe compras ya guardadas en la nube.
Object.assign(EN,{"Compras":"Shopping"});
function v136Compras(){const L=pCats(),hit=c=>{const n=DN(c).replace(/^\S+\s/,'').trim().toLowerCase();return n==='compras'||n==='shopping'};
 return L.find(hit)||L.find(c=>/compras|shopping/i.test(DN(c).replace(/^\S+\s/,'')))||null}
function v136IsFuelStore(s){return /\b(fuel|gas\s*station|gasolina|shell|bp\b|chevron|exxon|mobil|sunoco|circle\s*k|raceway|wawa\s*fuel|publix\s*fuel)\b/i.test(String(s||''))}
function v136IsPublix(s){return /\bpublix\b/i.test(String(s||''))}
function v136IsPublixGrocery(s){return v136IsPublix(s)&&!v136IsFuelStore(s)}
function v136IsGasCat(c){return /gasolina|gasoline/i.test(DN(c||'').replace(/^\S+\s/,''))}
function v136Suggest(store,cur){if(v136IsPublixGrocery(store)){const c=v136Compras();return c||SHARED_CAT}
 if(v136IsFuelStore(store))return cur&&pCats().includes(cur)?cur:(pCats().find(v136IsGasCat)||cur||SHARED_CAT);
 return cur&&pCats().includes(cur)?cur:SHARED_CAT}
function v136ApplyPublix(D){if(!D||!v136IsPublixGrocery(D.store))return false;const c=v136Suggest(D.store,D.cat);D.cat=c;
 (D.list||[]).forEach(it=>{if(!it.c||v136IsGasCat(it.c))it.c=c});return true}
function v136HealMem(){const c=v136Compras();if(!c||!S.storeMem)return 0;let n=0;Object.keys(S.storeMem).forEach(k=>{const m=S.storeMem[k],nm=(m&&m.name)||k;if(v136IsPublixGrocery(nm)&&v136IsGasCat(m.cat)){m.cat=c;n++}});return n}
{const _io=inboxOpen;inboxOpen=function(id){_io(id);if(!D||!D._inbox)return;const mm=RS()[memK(D.store)];
 if(v136IsPublixGrocery(D.store))v136ApplyPublix(D);
 else if(mm&&mm.cat&&pCats().includes(mm.cat))D.cat=mm.cat;
 drawP()}}
// Después de storeMem (pcat), Publix grocery vuelve a Compras si le pusieron Gasolina
{const _d=drawP;drawP=function(){_d();const s=dlg().querySelector('.grid select');if(!s||!D||!D.isNew)return;
 const o=s.onchange;s.onchange=function(){const r=o&&o.call(this);if(v136IsPublixGrocery(D.store)){v136ApplyPublix(D);_d()}return r}}}
// scanCat: no «Gas»→Gasolina; Publix grocery no cae en Gasolina
{const _sc=scanCat;scanCat=function(c){const L=pCats();if(L.includes(c)){if(v136IsGasCat(c)&&window._v136store&&v136IsPublixGrocery(window._v136store))return v136Suggest(window._v136store,c);return c}
 const k=s=>String(s||'').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase(),kc=k(c);if(!kc)return SHARED_CAT;
 const hit=L.find(x=>{const kx=k(x);if(kx===kc)return true;if(kc.length>=4&&(kx.includes(kc)||kc.includes(kx)))return true;return false});
 if(hit&&v136IsGasCat(hit)&&window._v136store&&v136IsPublixGrocery(window._v136store))return v136Suggest(window._v136store,hit);
 return hit||SHARED_CAT}}
{const _sa=scanApply;scanApply=function(o){window._v136store=o&&o.store;try{const r=_sa(o);if(D&&v136IsPublixGrocery(D.store)){v136ApplyPublix(D);drawP()}return r}finally{window._v136store=null}}}
// al guardar Publix grocery, memorizar Compras (no Gasolina)
{const _sv=saveP;saveP=function(){if(D&&v136IsPublixGrocery(D.store)&&v136IsGasCat(pCat(D)))v136ApplyPublix(D);const r=_sv();
 if(D&&!dlg().open&&v136IsPublixGrocery(D.store)){const c=v136Compras()||SHARED_CAT,k=memK(D.store);RS()[k]={...(RS()[k]||{}),name:D.store,cat:c};save()}return r}}
{const _m=migrate;migrate=function(st){const r=_m.apply(this,arguments);try{const c=(st.cats||[]).find(x=>/compras/i.test(String(x).replace(/^\S+\s/,'')));
 if(c&&st.storeMem)Object.keys(st.storeMem).forEach(k=>{const m=st.storeMem[k],nm=(m&&m.name)||k;if(/\bpublix\b/i.test(nm)&&!/\bfuel|gasolina|gas\s*station\b/i.test(nm)&&/gasolina|gasoline/i.test(String(m.cat||'')))m.cat=c})}catch(e){}return r}}
if(v136HealMem())try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}
