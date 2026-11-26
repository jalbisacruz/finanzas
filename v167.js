// v167 (Joe): Hoy más simple. Se quita la fila de atajos (Compra, Recibo, Walmart, Cobro, Cuadrar banco);
// Walmart se entra con Añadir/Ajustar en la caja azul. Ahí el cheque sale por el TOTAL, con
// «Cobrado con OnePay» (antes EarlyPay) y «A cobrar» (la diferencia), y se queda la fecha.
// Deudas de compras añade Joe→Tony, etiquetado como ya incluido en Transferir a Tony (no se suma dos veces).
// Salen de Hoy las filas «Transferir a Tony» y «cosas por hacer» (siguen en Operaciones › Por hacer).
// Se quedan Mi balance, Compras por revisar, Plan del mes y los recordatorios de vencimiento y respaldo.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "Cobrado con OnePay":"Collected with OnePay",
  "A cobrar":"To collect",
  "Ya incluido en Transferir a Tony":"Already included in Transfer to Tony"
});
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};

// atajos: solo se quitan en Hoy; Operaciones, Reportes y Configuración siguen igual
if(typeof v114Row==='function'){
  const prev=v114Row;
  v114Row=function(){if(typeof tab!=='undefined'&&tab==='ini')return '';return prev.apply(this,arguments)};
}

// caja azul: Walmart = total del cheque; debajo OnePay y lo que falta por cobrar
function paintWm(root){
  const w=(root||document).querySelector && (root||document).querySelector('#wmhero');
  if(!w)return;
  const d=typeof wmNext==='function'?wmNext():null;
  const gross=d&&typeof wmGross==='function'?+wmGross(d)||0:(d&&typeof wmAmt==='function'?+wmAmt(d)||0:0);
  const cy=d&&typeof epCycleSum==='function'?+epCycleSum(d)||0:0;
  const due=typeof r2==='function'?r2(Math.max(0,gross-cy)):Math.max(0,Math.round((gross-cy)*100)/100);
  const n=w.querySelector('.n');if(!n)return;
  const sub=d?`${typeof wd==='function'?wd(d):d} · ${tt('jueves alternos')}`:'';
  const amt=gross>0?('~'+(typeof f==='function'?f(gross):gross)):tt('Pendiente');
  const show=gross>0.004||cy>0.004;
  const extra=show?`<div id="ephero" style="font-size:12px;color:#94a3b8;margin-top:4px;line-height:1.4">
    <div>${esc(tt('Cobrado con OnePay'))} <b style="color:#fbbf24;font-weight:600">${typeof f==='function'?f(cy):cy}</b></div>
    <div>${esc(tt('A cobrar'))} <b style="color:#fff;font-weight:600">${gross>0?(typeof f==='function'?f(due):due):'—'}</b></div>
  </div>`:'';
  n.innerHTML=`<span style="white-space:nowrap">🏪 ${esc(tt('Walmart'))} <b style="color:${gross>0?'#fff':'#fbbf24'};margin-left:4px;font-weight:600">${amt}</b></span><div style="font-size:12px;color:#94a3b8;margin-top:2px;white-space:nowrap">${sub}</div>${extra}`;
  const btn=w.querySelector('#wmadj');
  if(btn){btn.className=gross>0?'sec':'';btn.textContent=gross>0?tt('Ajustar'):('＋ '+tt('Añadir'));btn.style.minHeight='34px';btn.style.padding='4px 12px';btn.style.fontSize='14px'}
  // la línea vieja de EarlyPay (hermana de #wmhero) ya no hace falta
  const sib=w.parentElement&&w.nextElementSibling;
  if(sib&&sib.id==='ephero')sib.remove();
}
if(typeof chkBox==='function'){
  const prev=chkBox;
  chkBox=function(){
    const h=prev.apply(this,arguments);
    if(typeof chkEdit!=='undefined'&&chkEdit)return h;
    const t=document.createElement('template');t.innerHTML=h;
    const old=t.content.querySelector('#ephero');
    if(old&&!t.content.querySelector('#wmhero #ephero'))old.remove();
    paintWm(t.content);
    return t.innerHTML;
  };
}

// Deudas: Joe→Tony (compras de Tony/Arianna) ya va en Comida / Transferir a Tony
if(typeof owesBy==='function'){
  const prev=owesBy;
  owesBy=function(m){
    const o=prev.apply(this,arguments)||[];
    const v=typeof tonyFood==='function'?tonyFood(m):0;
    if(v>0.004&&!o.some(x=>x&&x.joeTony))o.push({a:'Yo',b:'Tony',v,joeTony:1});
    return o;
  };
}
function placeOwe(){
  const card=document.getElementById('owecard');if(!card)return;
  const bal=document.getElementById('balcard');
  if(bal&&bal.nextElementSibling!==card)bal.insertAdjacentElement('afterend',card);
}
function paintOwe(){
  const card=document.getElementById('owecard');if(!card||typeof owesBy!=='function')return;
  placeOwe();
  const jt=(owesBy(typeof M==='function'?M():null)||[]).find(x=>x&&x.joeTony);if(!jt)return;
  [...card.querySelectorAll('.row')].forEach(row=>{
    const n=row.querySelector('.n');if(!n)return;
    const t=n.textContent||'';
    if(!/Le debes a Tony|You owe Tony/.test(t))return;
    if(/Ya incluido|Already included/.test(t))return;
    const note=document.createElement('div');note.className='muted';note.textContent=tt('Ya incluido en Transferir a Tony');n.appendChild(note);
    row.classList.add('v167jt');
  });
}

// sin «cosas por hacer» en Hoy (Operaciones › Por hacer no usa esta línea)
if(typeof todoCard==='function'){
  const prev=todoCard;
  todoCard=function(){
    return String(prev.apply(this,arguments)||'').replace(/<div class="card" id="todoline"[^>]*>[\s\S]*?<\/div>/,'');
  };
}

// recordatorios de transferir a Tony fuera de Hoy; vencimiento y respaldo se quedan
if(typeof remList==='function'){
  const prev=remList;
  remList=function(){
    return prev.apply(this,arguments).filter(r=>!(r&&String(r.id||'').startsWith('tony:')));
  };
}

if(typeof render==='function'){
  const prev=render;
  render=function(){
    const r=prev.apply(this,arguments);
    try{
      if(typeof tab!=='undefined'&&tab==='ini'){
        const s=document.getElementById('scrow');if(s)s.remove();
        const tl=document.getElementById('todoline');if(tl)tl.remove();
        paintOwe();
      }
    }catch(e){console.warn('v167',e)}
    return r;
  };
}

window._v167={paintWm,paintOwe};
})();
