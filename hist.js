// v55: historial de compras compartidas (solo UI; no cambia datos)
Object.assign(EN,{"Este mes":"This month","Meses anteriores":"Previous months","Todos":"All","ítems":"items","Ver detalle":"Show details","Ocultar detalle":"Hide details","Reparto final":"Final split","Sin compras compartidas.":"No shared purchases.","{0} compras · {1}":"{0} purchases · {1}"});
let hRange='cur';const hOpen=new Set();
function hList(){const out=[];keys().forEach(k=>{if(hRange==='cur'&&k!==S.cur)return;if(hRange==='prev'&&k>=S.cur)return;
 (S.months[k].purchases||[]).forEach((p,i)=>out.push({k,p,i}))});
 return out.sort((a,b)=>(b.p.date||b.k).localeCompare(a.p.date||a.k)||a.i-b.i)}
function hEdit(k,id){const prev=S.cur;if(k!==prev){S.cur=k;dlg().addEventListener('close',()=>{if(S.months[prev])S.cur=prev;render()},{once:true})}editP(id)}
function hTog(ev,id){ev.stopPropagation();hOpen.has(id)?hOpen.delete(id):hOpen.add(id);render()}
function hDetail(p){const it=p.items||{},sh=p.shares||{},ppl=[...new Set([...S.people,...Object.keys(sh),...Object.keys(it)])],iS=w=>r2((it[w]||[]).reduce((s,x)=>s+(+x.a||0),0)),all=r2(ppl.reduce((s,w)=>s+iS(w),0));
 return `<div class="hdet" style="margin-top:6px;padding:6px 8px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;font-size:14px">`+
 ppl.filter(w=>(it[w]||[]).length).map(w=>`<div style="font-weight:600;margin-top:2px">${T('Solo de {0}',esc(DN(w)))}</div>`+it[w].map(x=>`<div class="row" style="padding:2px 0"><span class="n muted">${esc(itLbl(x,p)||'—')}</span>${f(x.a)}</div>`).join('')).join('')+
 `<div class="row" style="padding:4px 0;border-top:1px solid #e2e8f0;margin-top:4px"><span class="n">${T('Compartido')}</span>${f(r2((+p.total||0)-all))}</div><div class="muted" style="margin-top:2px">${T('Reparto final')}</div>`+
 ppl.filter(w=>+sh[w]||iS(w)).map(w=>`<div class="row" style="padding:2px 0"><span class="n">${esc(DN(w))}</span>${iS(w)>0.004?`<span class="muted">${f(iS(w))} + ${f(r2((+sh[w]||0)-iS(w)))} =</span>&nbsp;`:''}<b>${f(sh[w]||0)}</b></div>`).join('')+`</div>`}
com=function(){const c=calc(M()),L=hList(),many=hRange!=='cur';
 const ch=(v,l)=>`<button class="chip ${hRange===v?'on':''}" data-hr="${v}" onclick="hRange='${v}';render()">${T(l)}</button>`;
 return `<div class="card"><button style="width:100%" onclick="editP()">${T('+ Nueva compra compartida')}</button>
 <div class="tot"><span>Tony ${f(c.tony)}</span><span>Carlos ${f(c.carlos)}</span></div>
 <div class="chips" id="hrange">${ch('cur','Este mes')}${ch('prev','Meses anteriores')}${ch('all','Todos')}</div>
 <div class="muted">${T('{0} compras · {1}',L.length,f(sum(L,o=>+o.p.total||0)))} · ${T('Toca una compra para editarla o borrarla.')}</div></div>
 ${L.map(({k,p},j)=>{const hasI=p.items&&Object.keys(p.items).length,op=hOpen.has(p.id),mh=many&&(j===0||L[j-1].k!==k);
  return `${mh?`<div class="muted" style="margin:10px 2px 0;font-weight:600">${lbl(k)}</div>`:''}<div class="card p hrow" data-id="${p.id}" onclick="hEdit('${k}','${p.id}')"><div class="tot" style="padding:0"><span>${esc(DN(p.store))}</span><span>${f(p.total)}</span></div>
  <div class="muted">${fdate(p.date)} · ${methName(p.method)}${pCat(p)!==SHARED_CAT?' · '+esc(DN(pCat(p))):''}</div>
  <div style="display:flex;flex-wrap:wrap;gap:4px 12px;font-size:14px;margin-top:2px;align-items:center">${Object.entries(p.shares||{}).filter(([w,v])=>+v).map(([w,v])=>`<span>${esc(DN(w))} <b>${f(v)}</b></span>`).join('')}
  ${hasI?`<button class="chip hexp" style="margin-left:auto;min-height:28px;padding:0 10px;font-size:13px" aria-label="${T(op?'Ocultar detalle':'Ver detalle')}" onclick="hTog(event,'${p.id}')">🧾 ${T('ítems')} ${op?'▴':'▾'}</button>`:''}</div>
  ${hasI&&op?hDetail(p):''}</div>`}).join('')||'<div class="card muted">'+T(hRange==='cur'?'Sin compras este mes.':'Sin compras compartidas.')+'</div>'}`};
