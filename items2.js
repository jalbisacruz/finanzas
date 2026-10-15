// v61: ítems con dueños (multi-selección). Campo nuevo opcional p.list=[{a,n?,c?,catId?,own:[...]}].
// Los "solo de" antiguos (p.items) se leen como ítems de un solo dueño, sin reescribir nada hasta que se edite la compra.
Object.assign(EN,{"+ Ítem":"+ Item","Quitar ítem":"Remove item","Dueños":"Owners","con {0}":"with {0}","conmigo":"with me","con {0} y conmigo":"with {0} and me","{0} y {1}":"{0} and {1}","tu parte {0}":"your share {0}",
 "+ parte compartida {0}":"+ shared part {0}","ítems {0}":"items {0}","parte {0}":"share {0}","Ítems":"Items","Al menos una persona":"At least one person"});
const FAM3=['Yo','Tony','Carlos'];
function pList(p){if(!p)return[];if(Array.isArray(p.list))return p.list;const o=[];Object.entries(p.items||{}).forEach(([w,L])=>(L||[]).forEach(x=>{if(+x.a>0)o.push({...x,own:[w]})}));return o}
const ownOf=it=>{const o=(it.own||[]).filter(Boolean);return o.length?o:['Yo']};
// reparto exacto (sin redondear) de un ítem
function itPort(it){const a=+it.a||0,o=ownOf(it),r={};
 if(o.length===3&&FAM3.every(w=>o.includes(w))){r.Tony=a*.5;r.Carlos=a*.25;r.Yo=a*.25;return r}
 o.forEach(w=>r[w]=(r[w]||0)+a/o.length);return r}
// totales por persona: ítems + resto según el modo; los centavos sobrantes van a Yo
function computeShares(P,list){const t=r2(P.total),L2=(list||[]).filter(x=>+x.a>0),rem=t-L2.reduce((s,x)=>s+(+x.a||0),0),ex={},base={};
 if(P.mode==='eq'){const who=P.who&&P.who.length?P.who:['Yo'];who.forEach(w=>base[w]=rem/who.length)}else{base.Tony=rem*.5;base.Carlos=rem*.25;base.Yo=rem*.25}
 Object.entries(base).forEach(([w,v])=>ex[w]=(ex[w]||0)+v);L2.forEach(it=>Object.entries(itPort(it)).forEach(([w,v])=>ex[w]=(ex[w]||0)+v));
 const out={};Object.entries(ex).forEach(([w,v])=>{const x=r2(Math.round(v*1e6)/1e6);if(x||w in base)out[w]=x});
 const d=r2(t-Object.values(out).reduce((s,v)=>s+v,0));if(Math.abs(d)>0.0001){const k='Yo' in out?'Yo':Object.keys(out).at(-1);if(k)out[k]=r2(out[k]+d)}return out}
// porciones de una persona en una compra (para mensajes, PDF, historial y presupuesto)
function personItems(p,w){return pList(p).filter(it=>ownOf(it).includes(w)).map(it=>({it,por:r2(itPort(it)[w]||0)}))}
function withTxt(it,w){const o=ownOf(it).filter(x=>x!==w);if(!o.length)return'';const me=o.includes('Yo'),nm=o.filter(x=>x!=='Yo').map(DN),j=nm.length>1?T('{0} y {1}',nm.slice(0,-1).join(', '),nm.at(-1)):nm[0];
 return ' ('+(me?(j?T('con {0} y conmigo',j):T('conmigo')):T('con {0}',j))+')'}
function itLine(it,p,w,por){const cat=itCat(it,p),dif=cat!==pCat(p),nm=it.n||DN(cat),ct=it.n&&dif?' · '+DN(cat):'';
 return `${nm}${withTxt(it,w)}${ct} ${f(it.a)}${ownOf(it).length>1?' → '+T('tu parte {0}',f(por)):''}`}
// ---------- diálogo ----------
itemsSum=w=>r2((D.list||[]).filter(x=>+x.a>0).reduce((s,it)=>s+(itPort(it)[w]||0),0));
allItems=()=>r2((D.list||[]).reduce((s,x)=>s+(+x.a||0),0));
pplP=()=>[...new Set([...S.people,...Object.keys(D.shares||{}),...(D.list||[]).flatMap(ownOf)])];
recomputeEq=function(){if(D.mode==='manual')return;D.shares=computeShares(D,D.list)};
const chipS='min-height:28px;padding:0 9px;font-size:13px;margin:0';
function itemsHtml(){if(D.mode==='manual')return'';D.list=D.list||[];const open=D._io||D.list.some(x=>+x.a>0);
 if(open&&!D.list.length)D.list.push({a:'',n:'',own:['Yo']});const ppl=[...new Set([...S.people,...D.list.flatMap(ownOf)])];
 return `<button class="sec" id="itog" style="width:100%;margin:8px 0 4px;min-height:38px;font-size:14px" onclick="liveItems();D._io=!(${open});drawP()">${open?T('− Ítems individuales'):T('+ Ítems individuales')}</button>
 ${open?`<div id="itbox" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:6px 8px">${D.list.map((x,i)=>`<div class="itrow" data-li="${i}" style="padding:6px 0;${i?'border-top:1px solid #e2e8f0':''}">
  <div style="display:grid;grid-template-columns:78px 1fr 44px;gap:6px;align-items:center"><input type="number" inputmode="decimal" step="0.01" placeholder="$0" data-li="${i}" data-k="a" style="min-width:0;width:100%" value="${x.a===''?'':x.a}" oninput="liveItems()">
  <div class="chips" style="margin:0;gap:4px;flex-wrap:wrap" aria-label="${T('Dueños')}">${ppl.map(w=>`<button class="chip ${ownOf(x).includes(w)?'on':''}" data-own="${esc(w)}" style="${chipS}" onclick="itOwn(${i},'${esc(w)}')">${esc(DN(w))}</button>`).join('')}</div>${itCatSel2(i,x)}</div>
  <div style="display:grid;grid-template-columns:1fr 36px;gap:6px;margin-top:4px"><input placeholder="${T('Nota')}" maxlength="40" data-li="${i}" data-k="n" style="min-width:0;width:100%;min-height:34px;font-size:14px" value="${esc(x.n||'')}" oninput="liveItems()"><button class="sec" title="${T('Quitar ítem')}" aria-label="${T('Quitar ítem')}" style="min-height:34px;padding:0" onclick="liveItems();D.list.splice(${i},1);D._io=true;drawP()">✕</button></div></div>`).join('')}
  <button class="sec" id="itadd" style="min-height:32px;padding:0 12px;font-size:14px;margin-top:4px" onclick="liveItems();D.list.push({a:'',n:'',own:['Yo']});D._io=true;drawP()">${T('+ Ítem')}</button></div>`:''}
 <div id="ibrk" style="margin-top:8px">${brkHtml()}</div>`}
function itCatSel2(i,x){const v=itCat(x,D);return `<select class="itcat" data-li="${i}" title="${T('Categoría')}" aria-label="${T('Categoría')}" style="min-width:0;width:100%;padding:0 0 0 9px;font-size:20px;-webkit-appearance:none;appearance:none;background:#fff;overflow:hidden;white-space:nowrap" onchange="D.list[${i}].c=this.value">${[...new Set([...pCats(),v])].map(c=>`<option value="${esc(c)}"${c===v?' selected':''}>${esc(DN(c))}</option>`).join('')}</select>`}
function itOwn(i,w){liveItems();const x=D.list[i];let o=ownOf(x);o=o.includes(w)?o.filter(y=>y!==w):[...o,w];if(!o.length)return toast(T('Al menos una persona'));x.own=o;drawP()}
brkHtml=function(){const it=allItems(),sh=r2(r2(D.total)-it);if(!(it>0))return'';
 if(sh<-0.004)return `<div id="isobra" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:8px 10px"><div style="color:#b91c1c;font-weight:700">${T('Sobra {0}',f(-sh))}</div><div class="muted">${T('Los ítems individuales superan el total.')}</div></div>`;
 return `<div class="muted">${T('Compartido {0} = total − ítems individuales',f(sh))}</div>`+pplP().filter(w=>(D.shares||{})[w]).map(w=>{const i=itemsSum(w),v=D.shares[w]||0;
  return `<div class="row" style="font-size:14px;padding:4px 0"><span class="n">${esc(DN(w))}</span>${i>0.004?`<span class="muted">${T('ítems {0}',f(i))} + ${f(r2(v-i))} =</span>&nbsp;`:''}<b>${f(v)}</b></div>`}).join('')};
liveItems=function(){if(window._noLive)return;document.querySelectorAll('#itbox input[data-li]').forEach(i=>{const x=(D.list||[])[+i.dataset.li];if(!x)return;x[i.dataset.k]=i.dataset.k==='a'?(i.value===''?'':r2(i.value)):i.value});
 const t=document.getElementById('tot');if(t)D.total=r2(t.value);recomputeEq();
 document.querySelectorAll('#dlg input[data-w]').forEach(i=>{i.value=D.shares[i.dataset.w]||''});
 const b=document.getElementById('ibrk');if(b)b.innerHTML=brkHtml();
 const tot=r2(Object.values(D.shares).reduce((s,v)=>s+(+v||0),0)),si=document.getElementById('splitinfo');if(si)si.textContent=T('Repartido {0} de {1}',f(tot),f(D.total));
 const ps=document.getElementById('psave');if(ps)ps.disabled=allItems()>r2(D.total)+0.004};
const _editPV61=editP;editP=function(id){_editPV61(id);if(!D)return;const p=id?M().purchases.find(x=>x.id===id):null;D.list=JSON.parse(JSON.stringify(pList(p)));delete D.items;
 if(D.mode!=='manual'&&D.list.length)recomputeEq();if(dlg().open)drawP()};
const _savePV61=saveP;saveP=function(){if(D.mode!=='manual')liveItems();
 if(D.mode!=='manual'&&allItems()>r2(D.total)+0.004)return alert(T('Los ítems individuales superan el total.'));
 const pc=pCat(D),L2=D.mode==='manual'?[]:(D.list||[]).filter(x=>+x.a>0).map(x=>{const c=x.c&&x.c!==pc?x.c:null;return {a:r2(x.a),...(x.n&&x.n.trim()?{n:x.n.trim()}:{}),...(c?{c,catId:catIdOf(c)}:{}),own:ownOf(x)}});
 // compatibilidad: si todos los ítems tienen un solo dueño, también se guarda el formato antiguo equivalente
 if(L2.length)D.list=L2;else delete D.list;D.items={};if(L2.length&&L2.every(x=>x.own.length===1))L2.forEach(x=>{const{own,...r}=x;(D.items[own[0]]=D.items[own[0]]||[]).push(r)});
 window._noLive=true;try{return _savePV61()}finally{window._noLive=false}};
