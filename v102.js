// v102 (Joe): ✏️ en Movimientos para gastos personales (cobros automáticos, transferencias, pagos de préstamo, gastos sueltos).
// Cambia solo categoría y descripción; monto, fecha y cuenta/tarjeta se quedan igual → los saldos no se tocan.
// Categorías según el tipo: transferencia → las de transferencia; pago de préstamo → solo descripción (la categoría la usa el préstamo);
// cobro automático → la de suscripciones o cualquier categoría de compra (si sale de suscripciones pasa a gasto normal y deja el historial);
// gasto normal → categorías de compra (sin suscripciones ni Tony).
Object.assign(EN,{"Editar movimiento":"Edit entry","Descripción":"Description","Monto, fecha y cuenta no cambian.":"Amount, date and account don't change.",
 "Al sacarlo de suscripciones pasa a ser una compra normal y sale del historial de suscripciones.":"Moving it out of subscriptions turns it into a normal purchase and removes it from the subscription history.",
 "La categoría de un pago de préstamo no se cambia.":"A loan payment's category can't be changed.","Movimiento actualizado":"Entry updated","Categoría":"Category"});
function mvCats(p){const all=(S.cats||[]).filter(c=>c!=='🤝 Tony'),sc=subCat(),lc=loanCat();
 if(p.loan)return [p.cat];if(p.xfer)return xCats().filter(c=>c!==sc&&c!==lc);
 const base=all.filter(c=>c!==sc&&c!==lc);if(p.sub||p.cat===sc)return [sc,...base].filter(Boolean);return base.includes(p.cat)?base:[p.cat,...base]}
function mvEdit(id){const m=findMonth('personal',id),p=m&&m.personal.find(x=>x.id===id);if(!p)return;const cs=mvCats(p),sc=subCat();
 dlg().innerHTML=`<h2>${T('Editar movimiento')}</h2><div class="muted">${fdate(p.date)} · ${methName(p.method)} · <b>${f(p.amount)}</b></div><div class="muted">${T('Monto, fecha y cuenta no cambian.')}</div>
 <p><label class="muted" for="mvc">${T('Categoría')}</label><select id="mvc" class="name" style="width:100%"${p.loan?' disabled':''} onchange="document.getElementById('mvsubw').hidden=!(${p.sub?'true':'false'}&&this.value!==${esc(JSON.stringify(sc||''))})">${cs.map(c=>`<option value="${esc(c)}"${c===p.cat?' selected':''}>${esc(DN(c))}</option>`).join('')}</select></p>
 ${p.loan?`<div class="muted">${T('La categoría de un pago de préstamo no se cambia.')}</div>`:''}
 <div id="mvsubw" class="muted" hidden>⚠️ ${T('Al sacarlo de suscripciones pasa a ser una compra normal y sale del historial de suscripciones.')}</div>
 <p><label class="muted" for="mvd">${T('Descripción')}</label><input id="mvd" class="name" style="width:100%" value="${esc(p.sub?(subName(p.sub)||p.desc||''):(p.desc||''))}"></p>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="mvsave" onclick="mvSave('${p.id}')">${T('Guardar')}</button></div>`;if(!dlg().open)dlg().showModal()}
function mvSave(id){const m=findMonth('personal',id),p=m&&m.personal.find(x=>x.id===id);if(!p)return;const c=document.getElementById('mvc').value,d=document.getElementById('mvd').value.trim().replace(/\s+/g,' ');
 if(!p.loan&&c&&mvCats(p).includes(c)){p.cat=c;if(p.sub&&c!==subCat()){delete p.sub;delete p.auto}}
 p.desc=d;save();dlg().close();render();toast(T('Movimiento actualizado'))}
// Fila de Movimientos: ✏️ en los gastos personales (kind 'gasto'); el ✕ sigue igual
{const _ml=movList;movList=function(){const h=_ml.apply(this,arguments),box=document.createElement('div');box.innerHTML=h;
 box.querySelectorAll('.row button.del').forEach(b=>{const mt=/delMove\('gasto','([^']+)'\)/.exec(b.getAttribute('onclick')||'');if(!mt)return;const n=b.parentElement.querySelector('span.n');if(!n||n.hasAttribute('onclick'))return;
  n.setAttribute('onclick',`mvEdit('${mt[1]}')`);n.setAttribute('role','button');n.setAttribute('title',T('Editar movimiento'));n.dataset.g=mt[1];n.insertBefore(document.createTextNode('✏️ '),n.firstChild)});return box.innerHTML}}
