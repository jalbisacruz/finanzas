// v60: categoría de la compra compartida (campo nuevo opcional p.cat/p.catId; sin campo = Comida/Supermercado).
// Lo de Tony/Carlos sigue siendo "Por cobrar" (nunca ingreso); sus categorías de ítem son informativas.
Object.assign(EN,{"Categoría":"Category"});
// movimientos: la compra aparece con su categoría
const _movesV60=moves;moves=function(m){const P={};(m.purchases||[]).forEach(p=>P[p.id]=p);return _movesV60(m).map(x=>x.kind==='compra'&&P[x.id]?{...x,cat:pCat(P[x.id])}:x)};
// gasto de Joe: su parte compartida va a la categoría de la compra; sus ítems individuales, a la suya
const _spentV60=spent;spent=function(m){const r=_spentV60(m),by=r.by;
 (m.purchases||[]).forEach(p=>{const Tn=+(p.shares||{}).Tony||0,Cc=+(p.shares||{}).Carlos||0,tot=Math.max(+p.total||0,sum(Object.values(p.shares||{}),v=>v)),mine=r2(tot-Tn-Cc);if(mine<0.02)return;
  const pc=pCat(p);personItems(p,'Yo').forEach(({it:x,por})=>{const c=itCat(x,p),a=Math.min(por,by[pc]||0);if(c===pc||!(a>0))return;by[pc]=r2(by[pc]-a);by[c]=r2((by[c]||0)+a)})});
 Object.keys(by).forEach(c=>{if(Math.abs(by[c])<0.005)delete by[c]});return {by,total:r.total}};
// diálogo: selector de categoría de la compra
const _drawPV60=drawP;drawP=function(){_drawPV60();const g=dlg().querySelector('.grid');if(!g||document.getElementById('pcat'))return;const v=pCat(D);
 g.insertAdjacentHTML('afterend',`<label class="muted" style="display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:center;margin-top:8px">${T('Categoría')}<select id="pcat" style="min-width:0;width:100%" onchange="D.cat=this.value;drawP()">${[...new Set([...pCats(),v])].map(c=>`<option value="${esc(c)}"${c===v?' selected':''}>${esc(DN(c))}</option>`).join('')}</select></label>`);
 const s=g.querySelector('select');if(s){const o=s.onchange;s.onchange=function(){if(D.isNew){const mm=RS()[memK(this.value)];if(mm&&mm.cat)D.cat=mm.cat}return o&&o.call(this)}}};
const _editPV60=editP;editP=function(id){_editPV60(id);if(D&&D.isNew){const mm=RS()[memK(D.store)];if(mm&&mm.cat&&pCats().includes(mm.cat)){D.cat=mm.cat;drawP()}}};
const _savePV60=saveP;saveP=function(){const st=D.store,c=pCat(D);if(c===SHARED_CAT){delete D.cat;delete D.catId}else{D.cat=c;D.catId=catIdOf(c)}
 _savePV60();if(!dlg().open&&st){const k=memK(st);RS()[k]={...(RS()[k]||{}),name:st,cat:c};save()}};
// presupuesto: aviso con la categoría correcta
const _savePV60b=saveP;saveP=function(){const cs=[pCat(D),...(D.list||[]).filter(x=>ownOf(x).includes('Yo')).map(x=>itCat(x,D))].filter(c=>c!==SHARED_CAT),b={...spent(L()).by};_savePV60b();if(!dlg().open&&cs.length)budToast(b,cs)};
