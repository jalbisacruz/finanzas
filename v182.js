// v182 (Joe): v168 quitó la sección Movimientos de Operaciones. Un gasto «Solo mía» con tarjeta
// sí se veía en Pagar tarjeta y en los cargos de la tarjeta, pero no había lista donde
// editarlo o borrarlo. Se vuelve a mostrar Movimientos (por fecha, con búsqueda); al editar
// el monto o borrar, se actualiza el saldo de la tarjeta y su lista de cargos.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "La cuenta o tarjeta no cambia.":"The account or card does not change."
});

// etiqueta con tienda, igual que en la tarjeta
function labOf(p,fb){
  if(typeof v181GLabel==='function')return v181GLabel(p,fb);
  const d=String((p&&p.desc)||fb||'');
  const st=p&&p.store?String(p.store):'';
  return st?(d&&d!==st?st+' · '+d:st):d;
}
if(typeof moves==='function'){
  const _mv=moves;
  moves=function(m){
    const P={};((m&&m.personal)||[]).forEach(p=>P[p.id]=p);
    return _mv(m).map(x=>{
      const p=x.kind==='gasto'&&P[x.id];
      if(!p)return x;
      return Object.assign({},x,{desc:labOf(p,x.desc||(typeof DN==='function'?DN(x.cat||p.cat):'')||''),store:p.store||x.store});
    });
  };
}

// la búsqueda de Movimientos también mira la tienda
if(typeof movList==='function'){
  const _ml=movList;
  movList=function(){
    const q=(typeof movQ==='string'?movQ:'').trim().toLowerCase(),keep=typeof filt!=='undefined'?filt:'';
    if(!q)return _ml.apply(this,arguments);
    const prev=movQ;
    try{
      movQ='';
      const h=_ml.apply(this,arguments);
      const box=document.createElement('div');box.innerHTML=h;
      const inp=box.querySelector('#movq');if(inp)inp.value=prev;
      box.querySelectorAll(':scope .row').forEach(row=>{
        const t=((row.innerText||'')+' ').toLowerCase();
        if(!t.includes(q))row.remove();
      });
      return box.innerHTML;
    }finally{movQ=prev}
  };
}

// v168 había dejado opsMov vacío; se restaura la lista completa, siempre visible y con búsqueda
if(typeof opsMov==='function'){
  opsMov=function(){
    if(typeof movList!=='function'||typeof opsHtml!=='function')return '';
    const fr=opsHtml(movList());
    const cd=fr.firstElementChild;if(!cd)return '';
    return cd.outerHTML;
  };
}

if(typeof render==='function'){
  const _r=render;
  render=function(){
    const r=_r.apply(this,arguments);
    try{
      const c=document.getElementById('movcard');
      if(c)c.classList.remove('col');
    }catch(e){}
    return r;
  };
}

// editar monto y fecha; el cambio de monto mueve el saldo (débito o tarjeta)
if(typeof mvEdit==='function'){
  const _ed=mvEdit;
  mvEdit=function(id){
    const r=_ed.apply(this,arguments);
    try{
      const m=typeof findMonth==='function'&&findMonth('personal',id)||(typeof M==='function'?M():null);
      const p=m&&(m.personal||[]).find(x=>x.id===id);if(!p)return r;
      const d=typeof dlg==='function'?dlg():document.getElementById('dlg');if(!d)return r;
      const note=[...d.querySelectorAll('.muted')].find(e=>/no cambian|don't change/i.test(e.textContent||''));
      const html=`<div class="grid" id="mvamt" style="margin:10px 0;gap:8px">
        <p style="margin:0"><label class="muted" for="mva">${T('Monto $')}</label><input id="mva" class="name" type="number" inputmode="decimal" step="0.01" value="${r2(+p.amount||0)}"></p>
        <p style="margin:0"><label class="muted" for="mvf">${T('Fecha')}</label><input id="mvf" class="name" type="date" value="${esc(p.date||'')}"></p>
      </div><div class="muted">${T('La cuenta o tarjeta no cambia.')}</div>`;
      if(note)note.outerHTML=html;
      else{const h=d.querySelector('h2');if(h)h.insertAdjacentHTML('afterend',html)}
    }catch(e){}
    return r;
  };
}
if(typeof mvSave==='function'){
  const _sv=mvSave;
  mvSave=function(id){
    let neuA,neuD;
    try{
      const aEl=document.getElementById('mva'),dEl=document.getElementById('mvf');
      if(aEl)neuA=r2(aEl.value);
      if(dEl)neuD=dEl.value;
    }catch(e){}
    const m0=typeof findMonth==='function'?findMonth('personal',id):null;
    const p0=m0&&(m0.personal||[]).find(x=>x.id===id);
    const oldA=p0?r2(+p0.amount||0):0,oldD=p0&&p0.date,meth=p0&&p0.method;
    if(neuA!=null&&!(neuA>0)){alert(T('Pon un monto'));return}
    if(meth==='deb'&&neuA!=null&&neuA>oldA&&typeof noDeb==='function'&&noDeb(r2(neuA-oldA)))return;
    const r=_sv.apply(this,arguments);
    try{
      const m=typeof findMonth==='function'?findMonth('personal',id):null;
      const p=m&&(m.personal||[]).find(x=>x.id===id);if(!p)return r;
      let changed=false;
      if(neuA!=null&&Math.abs(neuA-oldA)>=0.005){
        if(typeof spend==='function')spend(p.method,r2(neuA-oldA));
        p.amount=neuA;changed=true;
      }
      if(neuD&&neuD!==oldD){
        p.date=neuD;changed=true;
        const nk=typeof monthFor==='function'?monthFor(neuD):String(neuD).slice(0,7);
        const ok=Object.keys(S.months).find(k=>S.months[k]===m);
        if(nk&&ok&&nk!==ok&&S.months[nk]){
          m.personal=m.personal.filter(x=>x.id!==id);
          (S.months[nk].personal=S.months[nk].personal||[]).unshift(p);
        }
      }
      if(changed){if(typeof save==='function')save();if(typeof render==='function')render()}
    }catch(e){}
    return r;
  };
}

window._v182={labOf};
})();
