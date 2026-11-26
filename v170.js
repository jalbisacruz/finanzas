// v170 (Joe): En Operaciones › BANCO, Débitos y cada tarjeta de crédito salían abiertas
// y no se podían cerrar. Causa (verificada): v168 mete #bal-income y #bal-cards dentro de
// #bancobox, y navCollapsibles solo engancha «#v>.card» (hijos directos de #v), así que
// no recibían .col ni el toque en el título. Ahora empiezan cerradas, se abren/cierran
// tocando el encabezado, y PAGAR / Ajustar / Devolución no pliegan. Cada tarjeta guarda
// su lista de movimientos cerrada hasta que tocas su nombre. El estado se recuerda en
// la sesión (navCol).
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{});

const COLK=typeof NAV_COL==='string'?NAV_COL:'finanzas-collapsed';
function colMap(){try{return typeof navCol==='object'&&navCol?navCol:(window.navCol={})}catch(e){return {}}}
function saveCol(){try{const m=colMap();localStorage.setItem(COLK,JSON.stringify(m))}catch(e){}}

function foldCard(c,defCol){
  if(!c)return;
  const h=c.querySelector(':scope>h2');if(!h||c.children.length<2)return;
  if(!c.dataset.sec)c.dataset.sec=(h.textContent||'').replace(/\s+/g,' ').trim();
  const k=(typeof tab!=='undefined'?tab:'mov')+':'+c.id;
  c.dataset.ck=k;c.classList.add('colb');
  const m=colMap();
  const on=k in m?!!m[k]:defCol;
  c.classList.toggle('col',on);
  if(!h.querySelector('.cv')){const s=document.createElement('i');s.className='cv';s.textContent='▾';s.setAttribute('aria-hidden','true');h.prepend(s)}
  h.title=typeof T==='function'?T('Plegar o desplegar'):'';
  h.onclick=e=>{
    if(e.target.closest('button,input,select,a,label,textarea'))return;
    const next=!c.classList.contains('col');
    c.classList.toggle('col',next);
    colMap()[k]=next?1:0;saveCol();
  };
}

function foldFlows(){
  document.querySelectorAll('#bal-cards .v168cf').forEach(list=>{
    const row=list.previousElementSibling;
    if(!row||!row.classList.contains('row'))return;
    const k='mov:'+(list.id||'cf');
    const m=colMap();
    const hide=k in m?!!m[k]:true;
    list.classList.toggle('v170col',hide);
    row.classList.add('v170ch');
    row.classList.toggle('v170shut',hide);
    const n=row.querySelector('.n');
    if(n&&!n.querySelector('.cv')){const s=document.createElement('i');s.className='cv';s.textContent='▾';s.setAttribute('aria-hidden','true');n.prepend(s)}
    if(row.dataset.v170==='1')return;
    row.dataset.v170='1';
    row.addEventListener('click',e=>{
      if(e.target.closest('button,input,select,a,label,textarea'))return;
      const next=!list.classList.contains('v170col');
      list.classList.toggle('v170col',next);
      row.classList.toggle('v170shut',next);
      colMap()[k]=next?1:0;saveCol();
    });
  });
}

function v170Fold(){
  if(typeof tab!=='undefined'&&tab!=='mov')return;
  const box=document.getElementById('bancobox');if(!box)return;
  box.querySelectorAll(':scope>.card').forEach(c=>foldCard(c,true));
  foldFlows();
}

function hook(){
  if(typeof navCollapsibles!=='function'||navCollapsibles.__v170)return;
  const prev=navCollapsibles;
  const w=function(){prev.apply(this,arguments);try{v170Fold()}catch(e){console.warn('v170',e)}};
  w.__v170=true;
  window.navCollapsibles=navCollapsibles=w;
}
hook();
document.addEventListener('DOMContentLoaded',hook);
if(typeof render==='function'){
  const prev=render;
  render=function(){
    const r=prev.apply(this,arguments);
    try{hook();v170Fold()}catch(e){console.warn('v170',e)}
    return r;
  };
}

window.v170ExpandBanco=function(){
  ['bal-income','bal-cards'].forEach(id=>{
    const e=document.getElementById(id);if(!e)return;
    e.classList.remove('col');
    const k=e.dataset.ck||((typeof tab!=='undefined'?tab:'mov')+':'+id);
    colMap()[k]=0;
  });
  document.querySelectorAll('#bal-cards .v168cf').forEach(list=>{
    list.classList.remove('v170col');
    const row=list.previousElementSibling;if(row)row.classList.remove('v170shut');
    colMap()['mov:'+(list.id||'cf')]=0;
  });
  saveCol();
};

document.head.insertAdjacentHTML('beforeend',`<style>
#bancobox .card.colb>h2{cursor:pointer}
#bal-cards .row.v170ch{cursor:pointer}
#bal-cards .row.v170ch .cv{font-style:normal;color:#94a3b8;font-size:14px;margin-right:4px;display:inline-block;transition:transform .2s}
#bal-cards .row.v170shut .cv{transform:rotate(-90deg)}
#bal-cards .v168cf.v170col{display:none}
</style>`);

window._v170={foldCard,foldFlows,v170Fold,hook};
})();
