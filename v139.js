// v139 (Joe): en «Cheques depositados» salen también los EarlyPay (OnePay) del mes, por fecha entre los cheques.
// Los cheques quedan como estaban (formato, orden y total del encabezado = solo cheques).
function v139EPs(){return epAll().filter(e=>(e.date||'').startsWith(S.cur)).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0)}
function v139Fill(){document.querySelectorAll('#chkcard').forEach(card=>{if(card.dataset.v139)return;card.dataset.v139='1';
 const E=v139EPs();if(!E.length)return;const C=depChecks(),rows=[...card.querySelectorAll(':scope > .row')];
 const mk=e=>{const t=document.createElement('template');t.innerHTML=`<div class="row v139ep"><span class="n">${wd(e.date)}<div class="muted">⚡ ${T('EarlyPay')} · 🏪 Walmart</div></span>${f(+e.amount)}</div>`;return t.content.firstElementChild};
 const empty=card.querySelector(':scope > .muted:not(:first-child)');
 E.forEach(e=>{let at=null;for(let i=0;i<rows.length&&i<C.length;i++){if((C[i].date||'')<e.date){at=rows[i];break}}
  const r=mk(e);if(at)at.before(r);else if(rows.length)rows[rows.length-1].after(r),rows.push(r);else{if(empty&&/Nada|Aún|Nothing|No checks/.test(empty.textContent))empty.remove();card.append(r)}})})}
{const _r=render;render=function(){const x=_r.apply(this,arguments);try{v139Fill()}catch(e){console.warn('v139',e)}return x}}
