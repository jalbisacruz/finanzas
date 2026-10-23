// v98 (Joe): movimiento «Transferencia» en Gastos (remesas a la familia u otras transferencias que no son compras).
// Campos: monto, a quién (texto libre), fecha, nota. Sin artículos, impuesto ni reparto. Sale SIEMPRE del débito y se bloquea
// si lo dejaría negativo (noDeb). Se guarda como gasto personal (m.personal, xfer:true) en la categoría elegida (por defecto «💸 Envíos a familia»), así cuenta
// en presupuesto, Mi mes, Reportes y Remesas por destinatario, y nunca aparece en compras compartidas ni en los reportes de Tony/Carlos.
const xCats=()=>S.cats.filter(c=>c!=='🤝 Tony'),xDef=()=>xCats().find(isRem)||xCats().find(c=>/otros/i.test(c))||xCats()[0];
Object.assign(EN,{"Transferencia":"Transfer","Nueva transferencia":"New transfer","¿A quién? (ej. familia)":"To whom? (e.g. family)","Nota (opcional)":"Note (optional)",
 "Escribe a quién se la mandas":"Type who you are sending it to","Remesas u otros envíos desde el débito. No es una compra.":"Remittances or other transfers from debit. Not a purchase.","Sale del débito. Disponible: {0}":"Taken from debit. Available: {0}"});
{const _f=fabMenu;fabMenu=function(){const r=_f.apply(this,arguments);const b=document.getElementById('fabinc');if(b&&!document.getElementById('fabxfer'))b.insertAdjacentHTML('afterend',`<button id="fabxfer" class="sec" style="width:100%;text-align:left;min-height:60px;margin-top:8px;padding:10px 14px" onclick="xferDlg()"><b style="font-size:17px">🔁 ${T('Transferencia')}</b><div class="muted" style="font-size:13px;margin-top:2px">${T('Remesas u otros envíos desde el débito. No es una compra.')}</div></button>`);return r}}
{const fb=document.getElementById('fab');if(fb)fb.onclick=fabMenu}
function xferDlg(){dlg().innerHTML=`<h2>${T('Nueva transferencia')}</h2>
 <input id="xa" class="name" type="number" inputmode="decimal" step="0.01" placeholder="${T('Monto $')}" style="font-size:24px">
 <p><input id="xr" class="name" list="xrl" placeholder="${T('¿A quién? (ej. familia)')}"><datalist id="xrl">${(S.recipients||[]).map(r=>`<option value="${esc(r)}">`).join('')}</datalist></p>
 <p><select id="xc" class="name" style="width:100%">${xCats().map(c=>`<option value="${esc(c)}"${c===xDef()?' selected':''}>${esc(DN(c))}</option>`).join('')}</select></p>
 <p><input id="xf" class="name" type="date" value="${today()}"></p>
 <p><input id="xn" class="name" placeholder="${T('Nota (opcional)')}"></p>
 <div class="muted">${T('Sale del débito. Disponible: {0}',f(debAvail()))}</div>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="xsave" onclick="saveXfer()">${T('Guardar')}</button></div>`;if(!dlg().open)dlg().showModal()}
function saveXfer(){const a=r2(document.getElementById('xa').value);if(!a||a<=0)return alert(T('Pon un monto'));
 const recipient=document.getElementById('xr').value.trim();if(!recipient)return alert(T('Escribe a quién se la mandas'));
 if(noDeb(a,'No se puede: el débito quedaría negativo. Disponible: {0}'))return;
 const cat=document.getElementById('xc').value||xDef();S.recipients=S.recipients||[];if(!S.recipients.includes(recipient))S.recipients.push(recipient);
 const date=document.getElementById('xf').value||today();spend('deb',a);
 S.months[monthFor(date)].personal.unshift({id:uid(),date,amount:a,cat,desc:document.getElementById('xn').value.trim(),method:'deb',recipient,xfer:true});
 save();dlg().close();render();toast(T('Transferencia registrada'))}
