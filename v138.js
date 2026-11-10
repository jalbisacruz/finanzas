// v138 (Joe): Ingresos del mes por empresa y por fecha.
//   Real cobrado (total)
//   💼 YoWash (total del mes): cheques cobrados ✅ por fecha, luego los jueves que faltan ~estimados
//   🏪 Walmart (total del mes): cada ⚡ EarlyPay justo antes del cheque al que pertenece (mismo ciclo que v137),
//      luego ese cheque ✅ (ya neto) o ~estimado. Misma matemática que planNums (real + estimados).
Object.assign(EN,{"Real cobrado":"Actually received","Con estimados, mes":"With estimates, month","solo lo cobrado ✅":"collected ✅ only"});
function v138Payday(d){const p=epWmPaydayOnOrBefore(d);if(!p)return (S.wm&&S.wm.anchor)||WM_ANCHOR;return p===d?p:addD(p,14)}
function v138Data(P){const k=P.k;
 const ywReal=(S.checks||[]).filter(c=>c.status==='deposited'&&(c.date||'').startsWith(k)&&+c.amount>0).map(c=>({d:c.date,a:r2(+c.amount),t:'r'})).sort((a,b)=>a.d<b.d?-1:1);
 const ywEst=(P.ywLines||[]).map(x=>({d:x.d,a:r2(x.a),t:'e'}));
 const wmEv=[];Object.keys(S.months||{}).forEach(m=>(S.months[m].events||[]).forEach(e=>{if(e.type==='income'&&epIsWm(e.concept)&&+e.amount>0&&(e.date||'').startsWith(k))wmEv.push(e)}));
 const G={},g=p=>G[p]=G[p]||{ep:[],r:null,e:null};
 epAll().filter(e=>(e.date||'').startsWith(k)).forEach(e=>g(v138Payday(e.date)).ep.push({d:e.date,a:r2(+e.amount),t:'p'}));
 wmEv.forEach(e=>{const p=epWmPaydayOnOrBefore(e.date)||e.date,x=g(p);x.r=x.r?{...x.r,a:r2(x.r.a+ +e.amount)}:{d:e.date,a:r2(+e.amount),t:'r'}});
 (P.wmLines||[]).forEach(x=>{const y=g(x.d);if(!y.r)y.e={d:x.d,a:r2(x.a),t:'e'}});
 const wm=[];Object.keys(G).sort().forEach(p=>{const x=G[p];x.ep.sort((a,b)=>a.d<b.d?-1:1).forEach(z=>wm.push(z));if(x.r)wm.push(x.r);else if(x.e)wm.push(x.e)});
 const yw=[...ywReal,...ywEst],tot=L2=>r2(sum(L2,x=>x.a)),real=r2(sum([...yw,...wm].filter(x=>x.t!=='e'),x=>x.a));
 return {yw,wm,ywT:tot(yw),wmT:tot(wm),real}}
function v138Html(P){const D2=v138Data(P);if(!D2.yw.length&&!D2.wm.length&&!(D2.real>0))return'';
 const ln=x=>{const ic=x.t==='p'?'⚡ ':x.t==='r'?'✅ ':'',cls=x.t==='e'?'est':'real';
  return `<div class="row pl-ib d ${cls}" data-t="${x.t}"><span class="n">${ic}${wd(x.d)}${x.t==='p'?' · '+T('EarlyPay'):''}</span><span>${x.t==='e'?'~':''}${f(x.a)}</span></div>`};
 const co=(lab,v,L2)=>{if(!L2.length)return'';const got=r2(sum(L2.filter(x=>x.t!=='e'),x=>x.a)),est=L2.some(x=>x.t==='e');
  return `<div class="row pl-ib co"><span class="n">${lab}</span><b style="color:#15803d">${f(got)}</b></div>${est?`<div class="row pl-ib d est"><span class="n">${T('Con estimados, mes')}</span><span>~${f(v)}</span></div>`:''}`+L2.map(ln).join('')};
 return `<div id="pl-inc-break"><div class="row pl-ib real"><span class="n">${T('Real cobrado')}<div class="muted" style="font-size:11px">${T('solo lo cobrado ✅')}</div></span><b>${f(D2.real)}</b></div>`+co('💼 YoWash',D2.ywT,D2.yw)+co('🏪 Walmart',D2.wmT,D2.wm)+`</div>`}
{const _pv=planV78;planV78=function(){const h=_pv(),t=document.createElement('template');t.innerHTML=h;const b=t.content.querySelector('#pl-inc-break');
 const nh=v138Html(planNums());if(!nh)return h;
 if(b)b.outerHTML=nh;else{const r=t.content.querySelector('#pl-inc');if(!r)return h;r.insertAdjacentHTML('afterend',nh)}return t.innerHTML}}
document.head.insertAdjacentHTML('beforeend',`<style>#pl-inc-break .row.pl-ib.d.real span:last-child{color:#15803d;font-weight:600}#pl-inc-break .row.pl-ib.d.est{color:#94a3b8}#pl-inc-break .row.pl-ib.d.est span:last-child{color:#94a3b8}#pl-inc-break .row.pl-ib.d[data-t="p"] .n{color:#b45309}</style>`);
