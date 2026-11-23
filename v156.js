// v156 (Joe): en Compra manual › Solo mía no había forma de elegir o añadir
// la tienda (solo monto, categoría, descripción y cuenta). La compra compartida
// sí usa la lista de Tiendas. Se añade el mismo selector, opcional: una tienda
// de la lista o una nueva. Se guarda en el gasto y se ve en Movimientos y
// búsquedas como en las compartidas. No se toca el escaneo ni los saldos.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "Tienda (opcional)":"Store (optional)",
  "+ Nueva tienda…":"+ New store…",
  "Nombre de la tienda":"Store name"
});
const lab=s=>typeof v124Store==='function'?v124Store(s):(typeof DN==='function'?DN(s):s);
function storeNames(){return [...new Set((S.stores||[]).filter(Boolean))]}
function storeOpts(sel){
  const cur=sel||'';
  const names=storeNames();
  if(cur&&!names.some(s=>s===cur))names.push(cur);
  return `<option value="">${T('Tienda (opcional)')}</option>`+
    names.map(s=>`<option value="${esc(s)}"${s===cur?' selected':''}>${esc(lab(s))}</option>`).join('')+
    `<option value="__new">${T('+ Nueva tienda…')}</option>`;
}
function storeField(idSel,idNew,sel){
  return `<p id="qstwrap" style="margin:8px 0 0"><select id="${idSel}" class="name" style="width:100%" onchange="document.getElementById('${idNew}').hidden=this.value!=='__new'">${storeOpts(sel)}</select>
<input id="${idNew}" class="name" style="width:100%;margin-top:6px" hidden placeholder="${esc(T('Nombre de la tienda'))}" autocomplete="off"></p>`;
}
function storePicked(idSel,idNew){
  const s=document.getElementById(idSel),n=document.getElementById(idNew);
  if(!s)return '';
  let v=s.value==='__new'?((n&&n.value)||''):s.value;
  v=String(v||'').trim();
  if(v&&typeof v122Name==='function')v=v122Name(v);
  return v;
}
function rememberStore(st,extra){
  if(!st)return;
  if(typeof v115Junk==='function'&&v115Junk(st))return;
  S.stores=S.stores||[];
  const k=x=>String(x).toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!S.stores.some(x=>k(x)===k(st)||k(lab(x))===k(st)))S.stores.push(st);
  if(typeof RS==='function'&&typeof memK==='function'){
    const key=memK(st);RS()[key]={...(RS()[key]||{}),name:st,...(extra||{})};
  }
}
function applyStoreMem(name){
  if(!name||name==='__new'||typeof RS!=='function'||typeof memK!=='function')return;
  const mm=RS()[memK(name)];if(!mm)return;
  if(mm.cat){const b=[...document.querySelectorAll('#qcats .chip')].find(x=>x.dataset.c===mm.cat);if(b)b.click()}
  if(mm.method){const q=document.getElementById('qm');if(q&&[...q.options].some(o=>o.value===mm.method))q.value=mm.method}
}
function injectQuickStore(){
  if(document.getElementById('qst')||!document.getElementById('qa'))return;
  const qd=document.getElementById('qd');
  const html=storeField('qst','qstn','');
  if(qd){const wrap=qd.closest('p')||qd;wrap.insertAdjacentHTML('beforebegin',html)}
  else{const grid=document.querySelector('#dlg .grid');if(grid)grid.insertAdjacentHTML('beforebegin',html);else return}
  const sel=document.getElementById('qst');
  if(sel)sel.addEventListener('change',()=>{
    const n=document.getElementById('qstn');if(n)n.hidden=sel.value!=='__new';
    if(sel.value&&sel.value!=='__new')applyStoreMem(sel.value);
    if(sel.value==='__new'&&n)setTimeout(()=>n.focus(),0);
  });
}

if(typeof quick==='function'){
  const _q=quick;
  quick=function(){const r=_q.apply(this,arguments);try{injectQuickStore()}catch(e){}return r};
}
if(typeof saveQuick==='function'){
  const _sq=saveQuick;
  saveQuick=function(){
    const st=storePicked('qst','qstn');
    const date=(document.getElementById('qf')||{}).value;
    const cat=document.querySelector('#qcats .chip.on')?.dataset.c;
    const method=(document.getElementById('qm')||{}).value;
    const r=_sq.apply(this,arguments);
    try{
      if(dlg()&&!dlg().open&&st&&date){
        const m=S.months[monthFor(date)],p=m&&(m.personal||[])[0];
        if(p){p.store=st;rememberStore(st,{cat,method});save();if(typeof render==='function')render()}
      }
    }catch(e){}
    return r;
  };
}

if(typeof mvEdit==='function'){
  const _ed=mvEdit;
  mvEdit=function(id){
    const r=_ed.apply(this,arguments);
    try{
      if(document.getElementById('mvst')||!document.getElementById('mvd'))return r;
      const p=(typeof findMonth==='function'&&findMonth('personal',id)||M()).personal.find(x=>x.id===id);
      if(!p||p.loan||p.xfer||p.sub)return r;
      const mvd=document.getElementById('mvd');
      const wrap=mvd&&mvd.closest('p')||mvd;
      if(wrap)wrap.insertAdjacentHTML('beforebegin',storeField('mvst','mvstn',p.store||''));
      const n=document.getElementById('mvstn'),sel=document.getElementById('mvst');
      if(sel&&n&&sel.value==='__new')n.hidden=false;
    }catch(e){}
    return r;
  };
}
if(typeof mvSave==='function'){
  const _sv=mvSave;
  mvSave=function(id){
    let st;
    try{if(document.getElementById('mvst'))st=storePicked('mvst','mvstn')}catch(e){}
    const r=_sv.apply(this,arguments);
    try{
      if(st!==undefined){
        const m=findMonth('personal',id),p=m&&m.personal.find(x=>x.id===id);
        if(p){if(st){p.store=st;rememberStore(st,{cat:p.cat,method:p.method})}else delete p.store;save();if(typeof render==='function')render()}
      }
    }catch(e){}
    return r;
  };
}

if(typeof moves==='function'){
  const _mv=moves;
  moves=function(m){
    const P={};((m&&m.personal)||[]).forEach(p=>P[p.id]=p);
    return _mv(m).map(x=>{
      const p=x.kind==='gasto'&&P[x.id];
      if(!p||!p.store)return x;
      const st=lab(p.store),d=x.desc||'';
      if(d===st||d.startsWith(st+' ·')||d.startsWith(st+' '))return Object.assign({},x,{store:p.store});
      return Object.assign({},x,{desc:d?st+' · '+d:st,store:p.store});
    });
  };
}

window._v156={storeOpts,storePicked,storeField,rememberStore,storeNames,injectQuickStore};
})();
