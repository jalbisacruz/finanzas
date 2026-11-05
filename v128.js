// v128 (Joe):
// 1) Tras cobrar Walmart, el PRÓXIMO queda como YoWash: solo «Pendiente» + fecha del próximo cobro.
//    Causa del ~$196.79 en el 19/11: sin chk[próximo]=0, wmAmt() caía a S.wm.est. Aquí se sanea y se fuerza siempre.
//    Sin línea verde «✅ Cobrado …» en la caja azul. Etiqueta: «Pendiente».
//    Botones: sin monto → «＋ Añadir»; con monto → «Ajustar» (YoWash y Walmart).
// 2) Cobro / pregunta automática de YoWash y Walmart a las 4:00 AM America/New_York (antes 5:00).
//    Hora en chk.js + app.js: T04:00:00 (chkDue, autoDeposit). Walmart usa chkDue vía v127.
Object.assign(EN,{"Añadir":"Add"});
(function(){
  const PEND=`<b style="color:#fbbf24;margin-left:4px;font-weight:600">${T('Pendiente')}</b>`;
  const btnStyle=el=>{el.style.minHeight='34px';el.style.padding='4px 12px';el.style.fontSize='14px'};
  const setBtn=(el,has)=>{if(!el)return;el.className=has?'sec':'';el.textContent=has?T('Ajustar'):('＋ '+T('Añadir'));btnStyle(el)};
  function v128PendNext(){
    const w=v116W(),nx=wmNext();
    if(!nx)return;
    w.chk=w.chk||{};w.chk[nx]=0;
    if(w.pendCleared===nx)delete w.pendCleared;
  }
  const _g=wmGotSave;wmGotSave=function(pd){
    const was=pd in (((S.wm||{}).paid)||{});
    _g(pd);
    if(was||!(pd in ((S.wm||{}).paid||{})))return;
    v128PendNext();save();if(typeof unlocked!=='undefined'&&unlocked)render();
  };
  const _s=wmWeekSave;wmWeekSave=function(){
    const nx=wmNext();_s();
    const w=v116W();if(nx){w.pendCleared=nx;save()}
  };
  function v128Heal(){
    const w=S.wm;if(!w)return;
    const nx=wmNext();if(!nx)return;
    const prev=addD(nx,-14);
    if(!(w.paid||{})[prev])return;
    if(w.pendCleared===nx)return;
    if(+(w.chk||{})[nx]>0)return;
    if((w.chk||{})[nx]===0)return;
    w.chk=w.chk||{};w.chk[nx]=0;save();
  }
  const _r=render;render=function(){try{v128Heal()}catch(e){}return _r.apply(this,arguments)};
  const _b=chkBox;chkBox=function(){
    const h=_b();if(chkEdit)return h;
    const t=document.createElement('template');t.innerHTML=h;
    t.content.querySelectorAll('#wmhero .n').forEach(n=>{
      [...n.querySelectorAll('div')].forEach(d=>{
        if(/Cobrado|Received/i.test(d.textContent||'')||/✅/.test(d.textContent||''))d.remove();
      });
    });
    const pc=pendingCheck(),y=t.content.querySelector('#chkadj');
    if(y&&pc){
      if(pc.amtPending){const b=y.parentElement.querySelector('.n b');if(b)b.outerHTML=PEND}
      setBtn(y,!(pc.amtPending||!(+pc.amount>0)));
    }
    const {d,a}=wmProj(),w=t.content.querySelector('#wmhero');
    if(w&&d){
      if(!(a>0)){const b=w.querySelector('.n b');if(b)b.outerHTML=PEND}
      setBtn(w.querySelector('#wmadj'),a>0);
    }
    return t.innerHTML;
  };
})();
