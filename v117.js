// v117 (Joe): Walmart con botón claro "＋ Añadir estimado" (visible aunque la tarjeta esté cerrada); si ya hay estimado, "✏️ Ajustar".
// La confirmación del día de cobro nunca sale cerrada.
Object.assign(EN,{"Añadir estimado":"Add estimate","Ajustar":"Adjust","Añadir estimado del cheque":"Add check estimate"});
{const _c=wmCard;wmCard=function(){const has=wmAmt(wmNext())>0,h=_c();
 const b=has?`<button id="wmhdr" class="sec" style="font-size:13px;padding:4px 10px;min-height:30px;margin-left:8px" onclick="wmWeekDlg()">✏️ ${T('Ajustar')}</button>`
  :`<button id="wmhdr" style="font-size:13px;padding:4px 10px;min-height:30px;margin-left:8px" onclick="wmWeekDlg()">＋ ${T('Añadir estimado')}</button>`;
 return h.replace('</h2>',b+'</h2>').replace(/<button id="wmweek"[^>]*>[^<]*<\/button>/,has?`<button id="wmweek" class="sec" style="width:100%;margin-top:8px" onclick="wmWeekDlg()">✏️ ${T('Ajustar estimado')}</button>`
  :`<button id="wmweek" style="width:100%;margin-top:8px" onclick="wmWeekDlg()">＋ ${T('Añadir estimado')}</button>`)}}
{const _d=wmWeekDlg;wmWeekDlg=function(){_d();if(!(wmAmt(wmNext())>0)){const h=dlg().querySelector('h2');if(h)h.textContent='🏪 '+T('Añadir estimado del cheque')}}}
function v117Nav(){const _n=navCollapsibles;window.navCollapsibles=navCollapsibles=function(){_n();const c=document.getElementById('wmconf');if(c)c.classList.remove('col')}}
if(typeof navCol!=='undefined')v117Nav();else addEventListener('DOMContentLoaded',v117Nav);
