// v143 (Joe): «Ya se depositó» solo el día de calendario anterior al cobro programado
// pendiente (America/New_York; no UTC ni ventanas de 24 h). Tras usarlo, no vuelve a
// mostrarse hasta la previa del siguiente cheque. El auto del jueves a las 4:00 no cambia.
// Un diálogo o llamada fuera de ese día no acredita ni apunta a otro cheque.
(function(){
  function ywTodayNY(d){const x=d instanceof Date?d:(d?new Date(d):new Date());
    return x.toLocaleDateString('en-CA',{timeZone:'America/New_York'})}
  function ywPrevDay(payday){const p=String(payday||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(p))return'';
    const[y,m,da]=p.split('-').map(Number),x=new Date(Date.UTC(y,m-1,da));x.setUTCDate(x.getUTCDate()-1);
    return x.toISOString().slice(0,10)}
  function ywEarlyOk(c,now){if(!c||c.status!=='pending'||!c.date)return false;
    return ywTodayNY(now||new Date())===ywPrevDay(c.date)}
  window.ywTodayNY=ywTodayNY;window.ywPrevDay=ywPrevDay;window.ywEarlyOk=ywEarlyOk;

  const hide=()=>{try{if(typeof dlg==='function'&&dlg().open)dlg().close()}catch(e){}};
  const _d=ywEarlyDlg;ywEarlyDlg=function(){const pc=typeof ywPending==='function'?ywPending():pendingCheck();
    if(!ywEarlyOk(pc)){hide();return}return _d.apply(this,arguments)};
  const _s=ywEarlySave;ywEarlySave=function(id){
    const pc=(S.checks||[]).find(c=>c.id===(id||'')&&c.status==='pending')||(id?null:(typeof ywPending==='function'?ywPending():pendingCheck()));
    if(!pc||!ywEarlyOk(pc)){hide();return}
    return _s.apply(this,arguments)};
  window.ywEarlyDlg=ywEarlyDlg;window.ywEarlySave=ywEarlySave;

  const _b=chkBox;chkBox=function(){const h=_b();const t=document.createElement('template');t.innerHTML=h;
    const btn=t.content.querySelector('#ywearly'),pc=typeof ywPending==='function'?ywPending():pendingCheck();
    if(!ywEarlyOk(pc)){if(btn)btn.remove();return t.innerHTML}
    return btn?t.innerHTML:h};
})();
