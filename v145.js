/* v145 — En Cuentas, las filas de tarjeta solo muestran nombre, vencimiento, saldo y PAGAR.
   «Devolución a la tarjeta» y «Ajustar saldo de tarjeta» quedan en el botón azul +.
   Elige la tarjeta (sin preselección) y luego sigue el diálogo de siempre.
   adjDlg/doAdj no se tocan. Las filas de débito/efectivo siguen con Ajustar. */
(function(){
const _bal=typeof balCard==='function'?balCard:null;
if(_bal)balCard=function(key){
  let h=_bal.apply(this,arguments);
  if(key==='cards'){
    h=h.replace(/<button class="sec" onclick="rfDlg\('([^']+)'\)">[^<]*<\/button>/g,'');
    h=h.replace(/<button class="sec adj" onclick="adjDlg\('cards','([^']+)'\)">[^<]*<\/button>/g,'');
  }
  return h;
};

function rfAdjDlg(){
  const cards=(M().cards||[]).filter(c=>c.name);
  const chips=cards.map(c=>`<button type="button" class="sec" data-adjcard="${esc(c.id)}" style="margin:3px 4px 3px 0">${esc(DN(c.name))} · ${f(c.amount)}</button>`).join('')
    ||`<span class="muted">${T('No hay tarjetas')}</span>`;
  dlg().innerHTML=`<h2>🛠️ ${T('Ajustar saldo de tarjeta')}</h2>
    <p class="muted">${T('Elige la tarjeta. Después puedes poner el saldo o la diferencia. El débito no se toca.')}</p>
    <div class="fi"><label>${T('Tarjeta')}</label><div id="adjchips">${chips}</div></div>
    <div class="muted" id="adjhint" style="margin:8px 0">${T('Primero elige la tarjeta.')}</div>
    <div class="row" style="margin-top:10px"><button type="button" class="sec" onclick="dlg().close()">${T('Cancelar')}</button></div>`;
  if(!dlg().open)dlg().showModal();
  const box=document.getElementById('adjchips')||dlg();
  box.querySelectorAll('[data-adjcard]').forEach(b=>b.onclick=()=>adjDlg('cards',b.dataset.adjcard));
}

const _fab=typeof fabMenu==='function'?fabMenu:null;
if(_fab)fabMenu=function(){
  const r=_fab.apply(this,arguments);
  const rf=document.getElementById('fabrf');
  if(rf&&!document.getElementById('fabadj')){
    rf.insertAdjacentHTML('afterend',
      `<button id="fabadj" class="sec" style="width:100%;text-align:left;min-height:60px;margin-top:8px;padding:10px 14px" onclick="rfAdjDlg()"><b style="font-size:17px">🛠️ ${T('Ajustar saldo de tarjeta')}</b><div class="muted" style="font-size:13px;margin-top:2px">${T('Corrige el saldo de una tarjeta. El débito no se toca.')}</div></button>`);
  }
  return r;
};
try{const fb=document.getElementById('fab');if(fb)fb.onclick=fabMenu}catch(e){}

Object.assign(EN,{
  'Ajustar saldo de tarjeta':'Adjust card balance',
  'Elige la tarjeta. Después puedes poner el saldo o la diferencia. El débito no se toca.':'Choose the card. Then you can set the balance or the difference. Debit is not touched.',
  'Primero elige la tarjeta.':'Choose a card first.',
  'Corrige el saldo de una tarjeta. El débito no se toca.':'Correct a card balance. Debit is not touched.',
  'No hay tarjetas':'No cards'
});

window.rfAdjDlg=rfAdjDlg;
})();
