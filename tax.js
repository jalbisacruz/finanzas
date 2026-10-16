// v69: impuesto (sales tax) opcional en compras compartidas. Campo nuevo p.tax; sin campo = igual que antes.
// El impuesto se reparte en proporción a la parte antes de impuesto de cada persona (ítems + resto); el resto (total − ítems − impuesto) sigue según el modo (50/25/25).
// Centavos exactos: el centavo sobrante va a Joe (Yo).
Object.assign(EN,{"Impuesto $":"Tax $","Impuesto":"Tax","Proporcional":"Proportional","Impuesto {0}: {1}":"Tax {0}: {1}","+ impuesto {0}":"+ tax {0}",
 "Compartido {0} = total − ítems − impuesto":"Shared {0} = total − items − tax","Los ítems y el impuesto superan el total.":"Items and tax exceed the total.","impuesto {0}":"tax {0}"});
const ptax=P=>{const x=r2(+(P&&P.tax)||0);return x>0&&P.mode!=='manual'?x:0};
const _csV69=computeShares;
function taxSplit(P,list){const tax=ptax(P);if(!tax)return null;const pre=_csV69({...P,total:r2(r2(P.total)-tax)},list),s=Object.values(pre).reduce((a,v)=>a+v,0);if(!(s>0))return null;
 const o={};Object.keys(pre).forEach(w=>o[w]=r2(Math.floor(tax*pre[w]/s*100+1e-9)/100));const d=r2(tax-Object.values(o).reduce((a,v)=>a+v,0));
 const k='Yo' in o?'Yo':Object.keys(o).at(-1);o[k]=r2(o[k]+d);return {pre,tax:o}}
computeShares=function(P,list){const ts=taxSplit(P,list);if(!ts)return _csV69(P,list);const out={};
 Object.keys(ts.pre).forEach(w=>out[w]=r2(ts.pre[w]+(ts.tax[w]||0)));const d=r2(r2(P.total)-Object.values(out).reduce((a,v)=>a+v,0));if(Math.abs(d)>0.0001){const k='Yo' in out?'Yo':Object.keys(out).at(-1);out[k]=r2(out[k]+d)}return out};
// impuesto por persona de una compra guardada (PDF / mensajes)
const pTaxOf=p=>{const ts=taxSplit(p,pList(p).filter(x=>+x.a>0));return ts?ts.tax:null};
const _pShareV69=pShare;pShare=function(p,w){const r=_pShareV69(p,w),tx=pTaxOf(p),v=tx?r2(tx[w]||0):0;if(v)r.s=r2(r.s-v);r.tx=v;return r};
// diálogo
const _drawPV69=drawP;drawP=function(){_drawPV69();if(!D||D.mode==='manual'||document.getElementById('ptax'))return;const tot=document.getElementById('tot');if(!tot)return;
 tot.closest('.grid').insertAdjacentHTML('afterend',`<label class="muted" style="display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:center;margin-top:8px">${T('Impuesto $')}<input id="ptax" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0.00" value="${+D.tax>0?D.tax:''}" style="min-width:0;width:100%" oninput="liveItems()" onchange="liveItems()"></label><div id="taxprev" class="muted" style="margin-top:4px">${taxPrev()}</div>`)};
function taxPrev(){if(!D||!ptax(D))return'';const ts=taxSplit(D,(D.list||[]).filter(x=>+x.a>0));if(!ts)return'';
 return T('Impuesto {0}: {1}',f(ptax(D)),Object.keys(ts.tax).filter(w=>ts.tax[w]).map(w=>DN(w)+' '+f(ts.tax[w])).join(' · '))}
const _liveV69=liveItems;liveItems=function(){if(window._noLive)return;const e=document.getElementById('ptax');if(e){const v=r2(e.value);if(v>0)D.tax=v;else delete D.tax}
 _liveV69();const pv=document.getElementById('taxprev');if(pv)pv.textContent=taxPrev();
 const ps=document.getElementById('psave');if(ps&&D.mode!=='manual')ps.disabled=r2(allItems()+ptax(D))>r2(D.total)+0.004};
const _brkV69=brkHtml;brkHtml=function(){const tx=ptax(D);if(!tx)return _brkV69();const it=allItems(),sh=r2(r2(D.total)-it-tx);if(!(it>0))return'';
 if(sh<-0.004)return `<div id="isobra" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:8px 10px"><div style="color:#b91c1c;font-weight:700">${T('Sobra {0}',f(-sh))}</div><div class="muted">${T('Los ítems y el impuesto superan el total.')}</div></div>`;
 const ts=taxSplit(D,(D.list||[]).filter(x=>+x.a>0))||{tax:{}};
 return `<div class="muted">${T('Compartido {0} = total − ítems − impuesto',f(sh))}</div>`+pplP().filter(w=>(D.shares||{})[w]).map(w=>{const i=itemsSum(w),v=D.shares[w]||0,t=r2(ts.tax[w]||0);
  return `<div class="row" style="font-size:14px;padding:4px 0"><span class="n">${esc(DN(w))}</span><span class="muted">${i>0.004?T('ítems {0}',f(i))+' + ':''}${f(r2(v-i-t))} + ${T('impuesto {0}',f(t))} =</span>&nbsp;<b>${f(v)}</b></div>`}).join('')};
const _savePV69=saveP;saveP=function(){if(D){if(D.mode!=='manual')liveItems();if(!ptax(D))delete D.tax;
 if(D.mode!=='manual'&&ptax(D)&&r2(allItems()+ptax(D))>r2(D.total)+0.004)return alert(T('Los ítems y el impuesto superan el total.'))}return _savePV69()};
