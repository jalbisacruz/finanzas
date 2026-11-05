// v132 (Joe):
// 1) Movimientos: una compra compartida en la que solo gastó una persona (las demás $0) ya no dice «(compartida)»,
//    sino el nombre de quien gastó: «Publix (Tony)», «Aldi (Yo)». Con 2+ personas sigue «(compartida)».
// 2) Ítems de compras compartidas con categoría «💸 Envíos a familia»: debajo del ítem sale «💸 Para:» (beneficiario).
//    Se guarda it.para (aditivo). Tu parte de ese ítem entra en la tabla «💸 Envíos a familia» de Reportes/PDF
//    bajo esa persona (sin elegir → «Sin destinatario»), así cuadra con el total de la categoría.
Object.assign(EN,{"Para:":"For:","Compra":"Purchase"});
{const _mv=moves;moves=function(m){const P={};(m.purchases||[]).forEach(p=>P[p.id]=p);const tag=' ('+T('compartida')+')';
 return _mv(m).map(x=>{const p=x.kind==='compra'&&P[x.id];if(!p||typeof x.desc!=='string'||!x.desc.includes(tag))return x;
  const w=Object.entries(p.shares||{}).filter(([k,v])=>Math.abs(+v||0)>=0.005).map(([k])=>k);
  return w.length===1?{...x,desc:x.desc.replace(tag,' ('+DN(w[0])+')')}:x})}}
// --- 2) «Para:» en ítems de envíos ---
const paraOpts=()=>[...new Set([...(S.recipients||[]),...S.people.filter(w=>w!=='Yo')])];
{const _ih=itemsHtml;itemsHtml=function(){const h=_ih.apply(this,arguments);if(!D||!D.list)return h;
 const box=document.createElement('div');box.innerHTML=h;
 box.querySelectorAll('.itrow[data-li]').forEach(r=>{const i=+r.dataset.li,x=D.list[i];if(!x||!isRem(itCat(x,D)))return;
  const v=x.para||'',o=[...new Set([...paraOpts(),...(v?[v]:[])])];
  r.insertAdjacentHTML('beforeend',`<div class="itpara" style="display:flex;gap:6px;align-items:center;margin-top:4px;font-size:14px"><span class="muted" style="white-space:nowrap">💸 ${T('Para:')}</span>
   <select data-para="${i}" style="flex:1;min-width:0;min-height:34px;font-size:14px" onchange="D.list[${i}].para=this.value||undefined"><option value="">${T('Elige…')}</option>${o.map(n=>`<option value="${esc(n)}"${n===v?' selected':''}>${esc(DN(n))}</option>`).join('')}</select></div>`)});
 return box.innerHTML}}
// al cambiar la categoría del ítem, redibuja para mostrar/ocultar «Para:»
document.addEventListener('change',e=>{const t=e.target;if(t&&t.matches&&t.matches('#dlg select.itcat[data-li]')&&typeof drawP==='function'){liveItems();D._io=true;drawP()}});
{const _s=saveP;saveP=function(){const id=D&&D.id,paras=D&&D.mode!=='manual'?(D.list||[]).filter(x=>+x.a>0).map(x=>isRem(itCat(x,D))&&x.para?x.para:null):[];
 const r=_s.apply(this,arguments);if(id&&paras.some(Boolean)){let ch=false;Object.values(S.months||{}).forEach(m=>(m.purchases||[]).forEach(p=>{if(p.id!==id||!Array.isArray(p.list))return;
  p.list.forEach((it,i)=>{if(paras[i]&&isRem(itCat(it,p))){it.para=paras[i];ch=true}})}));if(ch){save();typeof render==='function'&&!dlg().open&&render()}}return r}}
// en Reportes/PDF: tu parte de cada ítem de envíos cuenta para su beneficiario
{const _xh=xHist;xHist=function(k){const base=_xh(k),m=S.months[k];if(!m||!base)return base;const add=[];
 (m.purchases||[]).forEach(p=>{if(['Tony','Arianna'].includes(p.paidBy))return;const ls=personItems(p,'Yo').filter(({it,por})=>por>0&&isRem(itCat(it,p)));
  if(ls.length)add.push({id:p.id,date:p.date,cat:itCat(ls[0].it,p),total:r2(sum(ls,x=>x.por)),rate:null,desc:DN(p.store),fromP:true,lines:ls.map(({it,por})=>({n:it.para||'',a:por}))})});
 return [...base,...add].sort((a,b)=>String(dKey(b.date)||'').localeCompare(String(dKey(a.date)||''))||0)}}
