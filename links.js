// v71: enlaces privados de solo lectura para Tony y Carlos. Documento público shares/{token} (token aleatorio de 128 bits).
// Contiene SOLO: compras compartidas del mes actual y el anterior (tabla completa, como su PDF), sus totales y pagado/pendiente;
// para Tony también sus cuentas (nombre, monto, estado) y la transferencia. Nunca cuentas bancarias, tarjetas, saldos, gastos personales ni ingresos.
Object.assign(EN,{"Enlaces para Tony y Carlos":"Links for Tony and Carlos","Enlace privado de solo lectura: ven sus compras compartidas y lo que deben. Se actualiza solo.":"Private read-only link: they see their shared purchases and what they owe. Updates automatically.",
 "Copiar enlace":"Copy link","Compartir enlace":"Share link","Cambiar enlace":"Change link","Activo":"On","Inicia sesión con Google para usar enlaces.":"Sign in with Google to use links.",
 "Enlace copiado":"Link copied","¿Cambiar el enlace de {0}? El enlace anterior dejará de funcionar.":"Change {0}'s link? The old link will stop working.","Enlace de {0}":"{0}'s link",
 "Actualizado {0}":"Updated {0}","Desactivado":"Off","No se pudo actualizar el enlace":"Couldn't update the link"});
const LPPL=['Tony','Carlos'];
const newTok=()=>{const b=crypto.getRandomValues(new Uint8Array(16));return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const lnk=()=>S.links=S.links||{};
const linkUrl=t=>location.origin+'/v.html?t='+t;
// filas de una compra (mismo cálculo que el PDF)
function snapPurch(p){const sh=p.shares||{},L=pList(p).filter(it=>+it.a>0),fam=(p.mode||'fam')==='fam',ptx=(typeof pTaxOf==='function'&&pTaxOf(p))||null,txT=ptx?r2(+p.tax):0;
 const isum={};PPL3.forEach(w=>isum[w]=r2(L.reduce((s,it)=>s+(itPort(it)[w]||0),0)));const rest=r2((+p.total||0)-txT-L.reduce((s,it)=>s+(+it.a||0),0));
 const pp=o=>({Yo:r2(o.Yo||0),Tony:r2(o.Tony||0),Carlos:r2(o.Carlos||0)});const shr=fam?PPL3:Object.keys(sh).filter(w=>+sh[w]);
 const rows=L.map(it=>({n:it.n||DN(itCat(it,p)),c:DN(itCat(it,p)),a:r2(it.a),sh:ownTxt(ownOf(it)),v:pp(itPort(it))}));
 if(!L.length)rows.push({n:T('Toda la compra'),c:'',a:r2(p.total-txT),sh:ownTxt(shr),v:pp(Object.fromEntries(PPL3.map(w=>[w,(+sh[w]||0)-(ptx?ptx[w]||0:0)])))});
 else if(rest>0.004)rows.push({n:T('Resto de la compra'),c:'',a:rest,sh:ownTxt(shr),v:pp(Object.fromEntries(PPL3.map(w=>[w,(+sh[w]||0)-isum[w]-(ptx?ptx[w]||0:0)])))});
 if(ptx)rows.push({n:T('Impuesto'),c:'',a:txT,sh:T('Proporcional'),v:pp(ptx)});
 return {...(p.paidBy?{by:p.paidBy}:{}),d:dKey(p.date),s:DN(p.store),c:DN(pCat(p)),t:r2(p.total),rows,tot:pp(sh)}}
function snapMonth(k,who){const m=S.months[k];if(!m)return null;const c=calc(m),P=byNew(m.purchases,undefined,k).map(snapPurch);
 const o={k,label:lbl(k),purchases:P};
 if(who==='Tony'){o.bills=m.bills.filter(b=>+b.amount).map(b=>({n:DN(b.name),a:r2(b.amount),paid:billSt2(b)==='paid',...(+b.tfood>0?{x:r2(b.tfood)}:{})}));
  Object.assign(o,{billsTotal:r2(c.bills),share:r2(c.tony),toTransfer:r2(c.toTony),paid:r2(c.xfer||0),pending:r2(c.tonyDue)})}
 else Object.assign(o,{share:r2(c.carlos),joeShare:r2(c.joeCS||0),joeOwes:r2(c.joeOwesCarlos||0),paid:r2(c.recv||0),pending:r2(c.carlosDue)});
 if(typeof tcOf==='function'){const x=tcOf(m);if(x)o.tc={from:x.from,to:x.to,amount:x.amount,settled:x.settled}}o.nf=1;return o}
function snapFor(who){const ks=keys(),i=ks.indexOf(S.cur),cur=S.cur,prev=i>0?ks[i-1]:null;
 return {v:1,who,lang:LANG,buyers:who==='Tony'?['Tony','Arianna']:['Carlos'],cats:pCats().map(c=>({v:c,l:DN(c)})),names:{Yo:'Joe',Tony:DN('Tony'),Carlos:DN('Carlos')},from:(window.fbName&&fbName())||'Joe Albisa Cruz',months:[snapMonth(cur,who),prev&&snapMonth(prev,who)].filter(Boolean)}}
// escritura automática (solo si cambió)
let lnT=null;
window.linksSync=function(force){clearTimeout(lnT);lnT=setTimeout(()=>linksWrite(force),force?0:800)};
async function linksWrite(force){if(!(window.fbUser&&fbUser())||!window.fbShareSet)return;const L=lnk();
 for(const w of LPPL){const x=L[w];if(!x||!x.on||!x.t)continue;const d=snapFor(w),h=JSON.stringify(d);const k='finanzas-link-h-'+x.t;
  if(!force&&localStorage.getItem(k)===h)continue;try{await fbShareSet(x.t,{...d,updatedAt:Date.now()});localStorage.setItem(k,h)}catch(e){console.warn('link',w,e);toast(T('No se pudo actualizar el enlace'))}}}
async function linkToggle(w,on){const L=lnk();L[w]=L[w]||{};if(on){if(!L[w].t)L[w].t=newTok();L[w].on=true;save();await linksWrite(true)}
 else{L[w].on=false;save();if(L[w].t&&window.fbShareDel)try{await fbShareDel(L[w].t)}catch(e){console.warn(e)}localStorage.removeItem('finanzas-link-h-'+L[w].t)}render()}
async function linkRegen(w){const L=lnk(),x=L[w];if(!x||!x.t||!confirm(T('¿Cambiar el enlace de {0}? El enlace anterior dejará de funcionar.',DN(w))))return;
 const old=x.t;x.t=newTok();save();if(window.fbShareDel)try{await fbShareDel(old)}catch(e){console.warn(e)}localStorage.removeItem('finanzas-link-h-'+old);if(x.on)await linksWrite(true);render()}
async function linkCopy(w){const u=linkUrl(lnk()[w].t);try{await navigator.clipboard.writeText(u)}catch(e){prompt(T('Enlace de {0}',DN(w)),u);return}toast(T('Enlace copiado'))}
async function linkShare(w){const u=linkUrl(lnk()[w].t);if(navigator.share){try{await navigator.share({title:T('Enlace de {0}',DN(w)),url:u});return}catch(e){if(e&&e.name==='AbortError')return}}linkCopy(w)}
window.linksCard=function(){const L=lnk(),inn=window.fbUser&&fbUser();
 return `<div class="card" id="lnkcard"><h2>🔗 ${T('Enlaces para Tony y Carlos')}</h2><div class="muted" style="margin-bottom:6px">${T('Enlace privado de solo lectura: ven sus compras compartidas y lo que deben. Se actualiza solo.')}</div>
 ${!inn?`<div class="muted">${T('Inicia sesión con Google para usar enlaces.')}</div>`:LPPL.map(w=>{const x=L[w]||{};return `<div style="padding:8px 0;border-top:1px solid #eef2f6">
  <label style="display:flex;justify-content:space-between;align-items:center"><b>${esc(DN(w))}</b><span class="muted">${x.on?T('Activo'):T('Desactivado')} <input type="checkbox" id="lnkon-${w}" ${x.on?'checked':''} style="width:auto;min-height:0" onchange="linkToggle('${w}',this.checked)"></span></label>
  ${x.on&&x.t?`<div class="grid" style="margin-top:6px;grid-template-columns:1fr 1fr 1fr"><button class="sec" id="lnkcp-${w}" style="font-size:14px" onclick="linkCopy('${w}')">${T('Copiar enlace')}</button><button class="sec" id="lnksh-${w}" style="font-size:14px" onclick="linkShare('${w}')">${T('Compartir enlace')}</button><button class="del" id="lnkrg-${w}" style="font-size:14px" onclick="linkRegen('${w}')">${T('Cambiar enlace')}</button></div>`:''}</div>`}).join('')}</div>`};
