// v169 (Joe): Reportes y Configuración más claros. En Reportes se quitan los recordatorios
// que ya están en Hoy, se juntan las dos tarjetas de reembolsos, Cuadrar banco queda una
// sola vez (la tarjeta, no el atajo), se mantienen Cuentas de Tony (v168) y se añade una
// comparación simple con el mes anterior. En Configuración, los atajos de arriba (que
// repetían Respaldo, Presupuesto, Suscripciones y Categorías) se quitan, y las secciones
// se agrupan en Ajustes, Listas y Datos.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "Ajustes":"Settings",
  "Listas":"Lists",
  "Comparación con {0}":"Comparison with {0}",
  "Mes anterior":"Previous month",
  "Por tarjeta":"By card",
  "No hay un mes anterior para comparar.":"There is no previous month to compare."
});

// atajos: en Reportes se quita Cuadrar (queda la tarjeta); en Configuración se quita la fila
if(typeof V114SC==='object'&&V114SC){
  if(Array.isArray(V114SC.rep))V114SC.rep=V114SC.rep.filter(x=>x&&x[1]!=='Cuadrar banco');
  V114SC.cfg=null;
}

function takeEl(root,sel){
  const el=root.querySelector(sel);if(!el)return '';
  const h=el.outerHTML;el.remove();return h;
}
function takeH2(root,re){
  const el=[...root.querySelectorAll(':scope>.card')].find(c=>{
    const h=c.querySelector(':scope>h2');return h&&re.test(h.textContent||'');
  });
  if(!el)return '';
  const h=el.outerHTML;el.remove();return h;
}

function cmpCard(){
  const ks=typeof keys==='function'?keys():[];
  const cur=typeof S!=='undefined'?S.cur:'';
  const i=ks.indexOf(cur);
  const prev=i>0?ks[i-1]:null;
  const curM=typeof M==='function'?M():null;
  if(!curM)return '';
  const sp=typeof spent==='function'?spent(curM).total:0;
  const er=typeof earned==='function'?earned(curM).total:0;
  const net=typeof r2==='function'?r2(er-sp):er-sp;
  const row=(lab,curV,oldV,kind)=>{
    const has=oldV!=null;
    const d=has&&typeof r2==='function'?r2(curV-oldV):has?curV-oldV:0;
    const up=d>0.004,down=d<-0.004;
    const cls=kind==='spend'?(up?'neg':down?'pos':''):(up?'pos':down?'neg':'');
    const sign=up?'+':down?'−':'';
    const sub=has?`${T('Mes anterior')} ${f(oldV)} · ${sign}${f(Math.abs(d))}`:T('No hay un mes anterior para comparar.');
    return `<div class="row v169cmp"><span class="n">${esc(lab)}<div class="muted">${sub}</div></span><b class="${cls}">${f(curV)}</b></div>`;
  };
  let spO=null,erO=null,netO=null;
  if(prev&&S.months[prev]){
    const m=S.months[prev];
    spO=spent(m).total;erO=earned(m).total;netO=typeof r2==='function'?r2(erO-spO):erO-spO;
  }
  const title=prev?T('Comparación con {0}',typeof lbl==='function'?lbl(prev):prev):T('Comparación con {0}',T('Mes anterior'));
  return `<div class="card" id="cmpcard"><h2>📊 ${esc(title)}</h2>
    ${row(T('Gastos'),sp,spO,'spend')}
    ${row(T('Ingresos'),er,erO,'inc')}
    ${row(T('Neto'),net,netO,'net')}</div>`;
}

function mergeReemb(root){
  const re=root.querySelector('#reemcard'),cb=root.querySelector('#cbcard');
  if(!cb)return;
  if(re){
    const rows=[...cb.querySelectorAll(':scope>.row')];
    const acc=[...cb.querySelectorAll(':scope>.muted')].find(m=>/Acumulado|Cumulative|Acumulado/.test(m.textContent||''));
    if(rows.length||acc){
      const box=document.createElement('div');box.id='cbsum';box.style.marginTop='8px';
      const lab=document.createElement('div');lab.className='muted v169h';lab.textContent=T('Por tarjeta');
      box.appendChild(lab);
      rows.forEach(r=>box.appendChild(r));
      if(acc)box.appendChild(acc);
      re.appendChild(box);
    }
    cb.remove();
  }else cb.id='reemcard';
}

function paintRep(h){
  const t=document.createElement('template');t.innerHTML=h;
  const root=t.content;
  const rem=root.querySelector('#remcard');if(rem)rem.remove();
  mergeReemb(root);
  const cmp=document.createElement('template');cmp.innerHTML=cmpCard();
  const gas=root.querySelector('#gastocard');
  if(gas)gas.after(cmp.content);
  else if(root.querySelector('#gpcard'))root.querySelector('#gpcard').before(cmp.content);
  else root.prepend(cmp.content);
  const wrap=document.createElement('div');wrap.appendChild(root);
  return wrap.innerHTML;
}

if(typeof rep==='function'){
  const prev=rep;
  rep=function(){return paintRep(prev.apply(this,arguments))};
}

function paintCfg(h){
  const wrap=document.createElement('div');wrap.innerHTML=h;
  [...wrap.querySelectorAll(':scope>.muted')].forEach(m=>{
    if(/cat[aá]logos|catalogs/i.test((m.textContent||'').trim()))m.remove();
  });
  const taken=new Set();
  const take=sel=>{
    const el=wrap.querySelector(sel);if(!el||taken.has(el))return '';
    taken.add(el);const o=el.outerHTML;el.remove();return o;
  };
  const takeH=re=>takeH2(wrap,re);
  const sec=(id,lab)=>`<div class="muted opsh v169sec" id="${id}">${lab}</div>`;
  const A=take('#s-cfg-idioma')||takeH(/^\s*Idioma\s*$|^\s*Language\s*$/)
    +(take('#s-cfg-seguridad')||takeH(/^\s*Seguridad\s*$|^\s*Security\s*$/))
    +take('#lnkcard')+take('#synccard')+take('#bkcfg');
  const L=take('#budcfg')+take('#ctl-inc')+take('#ctl-money')+take('#ctl-cards')+take('#ctl-bills')
    +take('#ctl-people')+take('#ctl-stores')+take('#ctl-subs')+take('#ctl-loans')+take('#goalcfg');
  let extra='';
  [...wrap.querySelectorAll(':scope>.card')].forEach(c=>{
    if(c.id==='datacard')return;
    extra+=c.outerHTML;c.remove();
  });
  const D=take('#datacard')+take('#appver');
  const rest=wrap.innerHTML;
  return sec('cfgajustes','⚙️ '+T('Ajustes'))+A
    +sec('cfglistas','📋 '+T('Listas'))+L+extra
    +sec('cfgdatos','🗂️ '+T('Datos'))+D+rest;
}

if(typeof cfg==='function'){
  const prev=cfg;
  cfg=function(){return paintCfg(prev.apply(this,arguments))};
}

document.head.insertAdjacentHTML('beforeend',`<style>
.v169sec{margin:16px 4px 6px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.v169h{font-weight:700;margin:8px 2px 4px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#475569}
#cbsum{padding-top:6px;border-top:1px solid #e2e8f0}
#cmpcard .v169cmp b.neg{color:#dc2626}#cmpcard .v169cmp b.pos{color:#16a34a}
</style>`);

window._v169={cmpCard,paintRep,paintCfg,mergeReemb};
})();
