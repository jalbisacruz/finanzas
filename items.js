// v54: ítems individuales en compras compartidas. Campo nuevo opcional p.items={persona:[{a,n}]}; p.shares sigue siendo el total de cada persona.
Object.assign(EN,{"+ Ítems individuales":"+ Individual items","− Ítems individuales":"− Individual items","Solo de {0}":"Only {0}'s","Nota":"Note","Compartido":"Shared",
 "Compartido {0} = total − ítems individuales":"Shared {0} = total − individual items","Los ítems individuales superan el total.":"Individual items exceed the total.","Añadir ítem":"Add item","individual":"individual","parte":"share"});
const itemsSum=w=>r2(((D.items||{})[w]||[]).reduce((s,x)=>s+(+x.a||0),0));
const allItems=()=>r2(Object.keys(D.items||{}).reduce((s,w)=>s+itemsSum(w),0));
const pplP=()=>[...new Set([...S.people,...Object.keys(D.shares||{}),...Object.keys(D.items||{})])];
// reparto con centavos exactos: el redondeo va a Yo (o al último)
function splitShared(t){const o={};if(D.mode==='fam'){const tn=r2(t*.5),c=r2(t*.25);o.Tony=tn;o.Carlos=c;o.Yo=r2(t-tn-c);return o}
 const who=D.who&&D.who.length?D.who:['Yo'],each=r2(t/who.length);who.forEach(w=>o[w]=each);const rest=r2(t-each*who.length),k=who.includes('Yo')?'Yo':who.at(-1);o[k]=r2(o[k]+rest);return o}
recomputeEq=function(){if(D.mode==='manual')return;const sh=r2(r2(D.total)-allItems()),b=splitShared(sh),out={};
 pplP().forEach(w=>{const v=r2((b[w]||0)+itemsSum(w));if(v||w in b)out[w]=v});D.shares=out};
function itemsHtml(){const open=D._io||allItems()>0;if(D.mode==='manual')return'';const ppl=pplP();
 return `<button class="sec" id="itog" style="width:100%;margin:8px 0 4px;min-height:38px;font-size:14px" onclick="D._io=!(${open});drawP()">${open?T('− Ítems individuales'):T('+ Ítems individuales')}</button>
 ${open?`<div id="itbox" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px">${ppl.map(w=>{const L=(D.items||{})[w]||[];while(L.length<2)L.push({a:'',n:''});(D.items=D.items||{})[w]=L;
  return `<div style="margin:6px 0 2px;font-weight:600;font-size:14px">${T('Solo de {0}',esc(DN(w)))}</div>${L.map((x,i)=>`<div style="display:grid;grid-template-columns:96px 1fr;gap:6px;margin-bottom:4px"><input type="number" inputmode="decimal" step="0.01" placeholder="$0" data-iw="${esc(w)}" data-ii="${i}" data-k="a" style="min-width:0;width:100%" value="${x.a===''?'':x.a}" oninput="liveItems()"><input placeholder="${T('Nota')}" maxlength="40" data-iw="${esc(w)}" data-ii="${i}" data-k="n" style="min-width:0;width:100%" value="${esc(x.n||'')}" oninput="liveItems()"></div>`).join('')}
  <button class="sec" aria-label="${T('Añadir ítem')}" title="${T('Añadir ítem')}" style="min-height:30px;padding:0 12px;font-size:16px" onclick="liveItems();D.items['${esc(w)}'].push({a:'',n:''});D._io=true;drawP()">+</button>`}).join('')}</div>`:''}
 <div id="ibrk" style="margin-top:8px">${brkHtml()}</div>`}
function brkHtml(){const it=allItems(),sh=r2(r2(D.total)-it);if(!(it>0))return'';const b=splitShared(sh);
 if(sh<-0.004)return `<div style="color:#b91c1c;font-weight:700">${T('Sobra {0}',f(-sh))}</div><div class="muted">${T('Los ítems individuales superan el total.')}</div>`;
 return `<div class="muted">${T('Compartido {0} = total − ítems individuales',f(sh))}</div>`+pplP().filter(w=>itemsSum(w)||b[w]).map(w=>`<div class="row" style="font-size:14px;padding:4px 0"><span class="n">${esc(DN(w))}</span><span class="muted">${f(itemsSum(w))} + ${f(b[w]||0)} =</span>&nbsp;<b>${f(D.shares[w]||0)}</b></div>`).join('')}
function liveItems(){document.querySelectorAll('#itbox input[data-iw]').forEach(i=>{const L=D.items[i.dataset.iw];if(!L||!L[+i.dataset.ii])return;L[+i.dataset.ii][i.dataset.k]=i.dataset.k==='a'?(i.value===''?'':r2(i.value)):i.value});
 const t=document.getElementById('tot');if(t)D.total=r2(t.value);recomputeEq();
 document.querySelectorAll('#dlg input[data-w]').forEach(i=>{i.value=D.shares[i.dataset.w]||''});
 const b=document.getElementById('ibrk');if(b)b.innerHTML=brkHtml();
 const tot=r2(Object.values(D.shares).reduce((s,v)=>s+(+v||0),0)),si=document.getElementById('splitinfo');if(si)si.textContent=T('Repartido {0} de {1}',f(tot),f(D.total));
 const ps=document.getElementById('psave');if(ps)ps.disabled=allItems()>r2(D.total)+0.004}
const _drawP3=drawP;drawP=function(){_drawP3();if(D.mode==='manual')return;const ch=document.getElementById('mman')?.parentElement;if(ch)ch.insertAdjacentHTML('afterend',itemsHtml());
 const t=document.getElementById('tot');if(t){t.addEventListener('input',liveItems);t.onchange=()=>{D.total=r2(t.value);liveItems()}}liveItems()};
const _saveP3=saveP;saveP=function(){if(D.mode!=='manual'){liveItems();if(allItems()>r2(D.total)+0.004)return alert(T('Los ítems individuales superan el total.'))}
 const it={};if(D.mode!=='manual')Object.entries(D.items||{}).forEach(([w,L])=>{const k=L.filter(x=>+x.a>0).map(x=>({a:r2(x.a),...(x.n?{n:x.n.trim()}:{})}));if(k.length)it[w]=k});
 delete D._io;if(Object.keys(it).length)D.items=it;else delete D.items;_saveP3()};
