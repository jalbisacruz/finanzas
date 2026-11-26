// v177 (Joe): al entrar a 📅 Calendario siempre sale la vista Día con la fecha de hoy (hora de Nueva York),
// aunque la última vez se quedara en Semana/Mes u otra fecha. Dentro de la sección se navega normal.
// Botón «Hoy» junto al período para volver a hoy (mantiene la vista Día/Semana/Mes elegida).
// Walmart ONE SAVINGS (era 3 % del bruto; $16.07 en el talón) lo desactivó Joe: ahora es un porcentaje en
// Configuración, por defecto 0 %. Migración una sola vez (marca m177): un ajuste guardado de $16.07 (o sin ajuste) → 0 %.
// Los cheques reales ya registrados no se tocan; solo cambian los estimados.
(function(){
if(typeof render!=='function'||typeof window.calGo!=='function'||!window._v176)return;
const nyToday=()=>{try{return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}catch(e){return typeof today==='function'?today():new Date().toLocaleDateString('en-CA')}};
function migSave(){if(typeof S!=='object'||!S)return false;const c=S.calPay||{};if(c.m177)return false;
  const n=Object.assign({},c,{m177:1});const v=c.wmSave;delete n.wmSave;
  if(n.wmSavePct==null)n.wmSavePct=0;if(v!=null&&Math.abs(+v-16.07)>0.001&&+v>0)n.wmSaveOld=+v;   // otro monto fijo: se guarda de referencia
  S.calPay=n;return true}
const hadPay=typeof S==='object'&&S&&S.calPay&&Object.keys(S.calPay).length>0;
if(migSave()&&hadPay&&typeof save==='function'){try{save()}catch(e){}}
// Configuración: ONE SAVINGS como % del bruto (en lugar de monto fijo)
if(typeof window.calPayCard==='function'){const _card=window.calPayCard;
  window.calPayCard=function(){migSave();const P=_v176.PAY(),h=_card.apply(this,arguments);
    return h.replace(/<label>Walmart: ONE SAVINGS por cheque \(\$\)<input id="cpws"[^>]*><\/label>/,
      `<label>Walmart: ONE SAVINGS (% del bruto) <span class="muted">0 = desactivado</span><input id="cpws" type="number" step="0.1" min="0" value="${+P.wmSavePct||0}"></label>`)}}
if(typeof window.calPaySave==='function'){const _sv=window.calPaySave;
  window.calPaySave=function(){const el=document.getElementById('cpws'),pct=el?Math.max(0,+el.value||0):null;
    const r=_sv.apply(this,arguments);           // v176 guarda las demás tarifas (y un «wmSave» fijo que aquí se descarta)
    if(pct!=null&&S.calPay){delete S.calPay.wmSave;S.calPay.wmSavePct=pct;S.calPay.m177=1;if(typeof save==='function')save();if(typeof render==='function')render()}
    return r}}
let prev=null,entering=false;
const _r=render;
render=function(){migSave();
  if(tab==='cal'&&prev!=='cal'&&!entering){prev='cal';entering=true;try{window.calGo('dia',nyToday())}finally{entering=false}return}
  prev=tab;const out=_r.apply(this,arguments);if(tab==='cal')addHoy();return out};
function curView(){const c=document.getElementById('cal');const m=c&&c.className.match(/\bv-(dia|semana|mes)\b/);return m?m[1]:'dia'}
function addHoy(){const per=document.querySelector('#cal .cper');if(!per||per.querySelector('#caltoday'))return;
  const p=window._v176.period(),t=nyToday(),here=t>=p.a&&t<=p.b;
  const b=document.createElement('button');b.id='caltoday';b.type='button';b.className=here?'sec':'';b.textContent=typeof T==='function'?T('Hoy'):'Hoy';
  b.title=here?'Estás viendo hoy':'Volver a hoy';b.onclick=()=>window.calGo(curView(),nyToday());
  const lbl=per.querySelector('b');lbl?lbl.after(b):per.append(b)}
window._v177={nyToday,curView,migSave};
const st=document.createElement('style');st.textContent='.cper #caltoday{min-width:auto;font-size:14px;padding:0 12px;min-height:36px;font-weight:600}';document.head.append(st);
})();
