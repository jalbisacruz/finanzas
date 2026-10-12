// ---------- navegación: menú ☰, chips de secciones, colapsables, volver arriba ----------
Object.assign(EN,{"Menú":"Menu","Secciones":"Sections","Volver arriba":"Back to top","Mes":"Month","Plegar o desplegar":"Collapse or expand","Sección":"Section"});
const NAV_COL='finanzas-collapsed';let navCol={};try{navCol=JSON.parse(localStorage.getItem(NAV_COL)||'{}')}catch(e){}
const navTabs=[['ini','🏠','Inicio'],['res','📊','Mes'],['cue','💳','Cuentas'],['com','🛒','Compras'],['rep','📈','Reportes'],['cfg','⚙️','Ajustes']];
function secTitle(c){const h=c.querySelector(':scope>h2');let t='';
 if(h){h.childNodes.forEach(n=>{if(n.nodeType===3)t+=n.textContent;else if(n.tagName!=='SPAN'&&!n.classList.contains('cv'))t+=n.textContent})}
 return t.replace(/\s+/g,' ').trim()}
function navSlug(s){return s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)}
function navSections(){const out=[];document.querySelectorAll('#v>.card').forEach((c,i)=>{const t=secTitle(c);if(!t)return;
 if(!c.id)c.id='s-'+tab+'-'+(navSlug(t)||i);c.dataset.sec=t;out.push({id:c.id,t})});return out}
function navOff(){const h=document.querySelector('header'),cb=document.getElementById('chipbar');return (h?h.offsetHeight:0)+(cb&&cb.offsetParent?cb.offsetHeight:0)+8}
function goSec(id){const el=document.getElementById(id);if(!el)return;closeDrawer();
 const k=el.dataset.ck;if(k&&navCol[k]){delete navCol[k];localStorage.setItem(NAV_COL,JSON.stringify(navCol));el.classList.remove('col')}
 window.scrollTo({top:el.getBoundingClientRect().top+scrollY-navOff(),behavior:'smooth'})}
function navCollapsibles(){document.querySelectorAll('#v>.card').forEach(c=>{const h=c.querySelector(':scope>h2'),t=c.dataset.sec;if(!h||!t||c.children.length<2)return;
 const k=tab+':'+c.id;c.dataset.ck=k;c.classList.add('colb');c.classList.toggle('col',!!navCol[k]);
 if(!h.querySelector('.cv')){const s=document.createElement('i');s.className='cv';s.textContent='▾';s.setAttribute('aria-hidden','true');h.prepend(s)}
 h.title=T('Plegar o desplegar');
 h.onclick=e=>{if(e.target.closest('button,input,select,a,label,textarea'))return;const on=!c.classList.contains('col');c.classList.toggle('col',on);
  if(on)navCol[k]=1;else delete navCol[k];localStorage.setItem(NAV_COL,JSON.stringify(navCol))}})}
function navChips(secs){let cb=document.getElementById('chipbar');const v=document.getElementById('v');
 if(secs.length<3){if(cb)cb.remove();return}
 if(!cb){cb=document.createElement('div');cb.id='chipbar';v.parentNode.insertBefore(cb,v)}
 cb.setAttribute('aria-label',T('Secciones'));cb.innerHTML=secs.map(s=>`<button class="nchip" onclick="goSec('${s.id}')">${esc(s.t)}</button>`).join('')}
function navDrawer(secs){const d=document.getElementById('drawer');if(!d)return;
 d.innerHTML=`<div class="dh">${T('Menú')}<button class="dx" onclick="closeDrawer()" aria-label="✕">✕</button></div>`+navTabs.map(([k,i,l])=>`<button class="dt${k===tab?' on':''}" onclick="navGo('${k}')"><b>${i}</b>${T(l)}</button>`+(k===tab&&secs.length?`<div class="ds">${secs.map(s=>`<button onclick="goSec('${s.id}')">${esc(s.t)}</button>`).join('')}</div>`:'')).join('')}
function navGo(k){closeDrawer();if(k===tab){scrollTo({top:0,behavior:'smooth'});return}tab=k;render();scrollTo(0,0)}
function openDrawer(){navDrawer(navSections());document.body.classList.add('dopen')}
function closeDrawer(){document.body.classList.remove('dopen')}
function navAfter(){const secs=navSections();navCollapsibles();navChips(secs);navDrawer(secs);const m=document.getElementById('menub');if(m)m.setAttribute('aria-label',T('Menú'));const tt=document.getElementById('totop');if(tt)tt.setAttribute('aria-label',T('Volver arriba'))}
(function(){const st=document.createElement('style');st.textContent=`
#menub{min-width:44px;font-size:22px;padding:0 10px}
#chipbar{position:sticky;top:var(--hh,64px);z-index:4;display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:#f1f5f9ee;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);scrollbar-width:none;border-bottom:1px solid #e2e8f0}
#chipbar::-webkit-scrollbar{display:none}
.nchip{flex:none;min-height:34px;padding:4px 12px;border-radius:17px;background:#fff;color:#0f172a;border:1px solid #cbd5e1;font-size:14px;font-weight:500;white-space:nowrap}
#drawer{position:fixed;top:0;bottom:0;left:0;width:min(82vw,320px);background:#fff;z-index:40;transform:translateX(-105%);transition:transform .25s;overflow-y:auto;padding:env(safe-area-inset-top) 0 calc(16px + env(safe-area-inset-bottom));box-shadow:4px 0 20px #0003}
#dscrim{position:fixed;inset:0;background:#0f172a66;z-index:39;opacity:0;pointer-events:none;transition:opacity .25s}
body.dopen #drawer{transform:none}body.dopen #dscrim{opacity:1;pointer-events:auto}
.dh{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:18px;padding:12px 12px 8px 16px;border-bottom:1px solid #eef2f6}
.dx{background:none;color:#64748b;font-size:20px;min-width:44px}
.dt{display:flex;gap:12px;align-items:center;width:100%;background:none;color:#0f172a;border-radius:0;text-align:left;padding:10px 16px;font-size:16px}
.dt b{font-size:20px;width:26px;text-align:center}.dt.on{background:#eff6ff;color:#2563eb}
.ds{padding:2px 0 8px;background:#f8fafc}.ds button{display:block;width:100%;background:none;color:#334155;text-align:left;font-weight:500;font-size:15px;min-height:40px;padding:6px 16px 6px 54px;border-radius:0}
.card.colb>h2{cursor:pointer;justify-content:flex-start;gap:6px}.card.colb>h2>span{margin-left:auto}
.cv{font-style:normal;color:#94a3b8;font-size:14px;transition:transform .2s;flex:none}
.card.col>h2{margin-bottom:0}.card.col>h2 .cv{transform:rotate(-90deg)}.card.col>:not(h2){display:none!important}
#totop{position:fixed;left:16px;bottom:calc(84px + env(safe-area-inset-bottom));width:44px;height:44px;border-radius:22px;padding:0;background:#0f172acc;font-size:20px;z-index:6;opacity:0;pointer-events:none;transition:opacity .2s}
#totop.on{opacity:1;pointer-events:auto}
body.locked #chipbar,body.locked #totop,body.locked #drawer,body.locked #dscrim{display:none}`;document.head.appendChild(st);
 const hd=document.querySelector('header'),mb=document.createElement('button');mb.id='menub';mb.textContent='☰';mb.onclick=openDrawer;hd.prepend(mb);
 const dr=document.createElement('aside');dr.id='drawer';const sc=document.createElement('div');sc.id='dscrim';sc.onclick=closeDrawer;document.body.append(sc,dr);
 const tt=document.createElement('button');tt.id='totop';tt.textContent='↑';tt.onclick=()=>scrollTo({top:0,behavior:'smooth'});document.body.append(tt);
 const sh=()=>document.documentElement.style.setProperty('--hh',hd.offsetHeight+'px');sh();addEventListener('resize',sh);
 addEventListener('scroll',()=>tt.classList.toggle('on',scrollY>500),{passive:true});
 addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
 const r0=render;render=function(){const r=r0.apply(this,arguments);try{navAfter();sh()}catch(e){console.error(e)}return r};
 try{if(typeof unlocked!=='undefined'&&unlocked)render()}catch(e){}})();
