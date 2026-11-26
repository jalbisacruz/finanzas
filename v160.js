// v160 (Joe): un recibo de Sam's Club enviado desde la página de Carlos
// (INST SV 2.00-, 2.00- y 4.00-; ítems 135.53 − 8.00 + tax 5.24 = 132.77)
// daba error en el cuadre del total al revisarlo. El lector no neteaba esas
// líneas (a veces las tiraba o las dejaba en positivo: el parseo de «2.00-»
// salía +2), y al abrir o enviar la compra se filtraba amount > 0, así que
// se perdían los descuentos y ítems + impuesto superaban el total. Aquí se
// leen los importes con el menos al final, se aplican los descuentos al
// ítem que corresponde (precio neto) y el cuadre es ítems − descuentos +
// impuesto ≈ total. Si un envío ya llegó sin esas líneas, en Revisar se
// añade «Descuentos» para cuadrar, sin que Joe edite números. El reparto
// usa los precios netos.
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "Se aplicaron los descuentos a cada ítem. El total cuadra.":"Discounts were applied to each item. The total matches.",
  "Faltaban {0} de descuentos en el envío. Se añadió la línea «Descuentos» para cuadrar el total.":"The submission was missing {0} in discounts. A “Discounts” line was added so the total matches.",
  "Aplicar descuentos":"Apply discounts",
  "Deshacer descuentos":"Undo discounts",
  "✅ El total cuadra":"✅ The total matches",
  "Descuentos":"Discounts"
});
const TOL=0.004;
const DISC_RE=/inst(?:ant)?\s*sv|instant\s*savings|\bsavings\b|\bdescuentos?\b|\bcup[oó]n(?:es)?\b|\bcoupons?\b|\bdiscount\b|\bsaved\b/i;
const DISC_STRIP=/inst(?:ant)?\s*sv(?:gs|ings)?|instant\s*savings|\b(?:savings?|descuentos?|cup[oó]nes?|coupons?|promo(?:ciones)?|saved|discount)\b/gi;
function t(k,a){if(typeof T==='function')return a!=null?T(k,a):T(k);return a!=null?String(k).replace('{0}',a):k}
function rr(n){return typeof r2==='function'?r2(n):Math.round((+n)*100)/100}

function scanAmt(v){
  if(typeof v==='number')return isFinite(v)?rr(v):NaN;
  let s=String(v??'').trim().replace(/[\u2212\u2013\u2014]/g,'-').replace(/,/g,'.');
  if(!s)return NaN;
  const par=s.match(/^\(\s*\$?\s*([\d.]+)\s*\)$/);
  if(par)return rr(-parseFloat(par[1]));
  const trail=s.match(/^\$?\s*([\d.]+)\s*-\s*$/);
  if(trail)return rr(-parseFloat(trail[1]));
  const lead=s.match(/^-+\s*\$?\s*([\d.]+)\s*$/);
  if(lead)return rr(-parseFloat(lead[1]));
  const n=parseFloat(s.replace(/[^0-9.\-]/g,''));
  return isFinite(n)?rr(n):NaN;
}

function normName(n){
  return String(n||'').toLowerCase().replace(DISC_STRIP,' ').replace(/[^a-z0-9áéíóúüñ]+/gi,' ').trim();
}
function isDiscName(n){return DISC_RE.test(String(n||''))}
function isDisc(it){const a=+it.a;return a<-TOL||isDiscName(it.n||it.name)}

function fixQty(it){
  const n=String(it.n||'');
  const m=n.match(/(\d+)\s*AT\s*(?:1\s*FOR\s*)?([\d.,]+)/i)||n.match(/(\d+)\s*[x×@]\s*([\d.,]+)/i);
  if(!m)return it;
  const q=+m[1],u=scanAmt(String(m[2]).replace(/-$/,''));
  const a=+it.a;
  if(q>1&&isFinite(u)&&u>0&&isFinite(a)&&Math.abs(a-u)<=0.02&&Math.abs(a-rr(q*u))>0.02)it.a=rr(q*u);
  return it;
}

function itemKey(it){return normName(it.n||it.name||'')}

function bestMatch(disc, items, used){
  const key=itemKey(disc);
  if(!key||key.length<2)return -1;
  let best=-1,score=-1;
  items.forEach((it,i)=>{
    if(used.has(i)||isDisc(it))return;
    const k=itemKey(it);
    if(!k)return;
    let sc=0;
    if(k===key)sc=100;
    else if(k.includes(key)||key.includes(k))sc=60+Math.min(k.length,key.length);
    else{
      const at=new Set(k.split(' ').filter(Boolean)),bt=new Set(key.split(' ').filter(Boolean));
      let c=0;bt.forEach(w=>{if(w.length>=3&&at.has(w))c++});
      if(c)sc=30+c*10;
    }
    if(sc<=0)return;
    if(isFinite(+it.a)&&Math.abs(+it.a)>=Math.abs(+disc.a)-0.004)sc+=5;
    if(sc>score){score=sc;best=i}
  });
  return best;
}

function cloneLine(x){
  const a=scanAmt(x.a!=null?x.a:x.amount);
  const n=String(x.n||x.name||'').trim().slice(0,60);
  const own=Array.isArray(x.own)?x.own.slice():['Yo','Tony','Carlos'];
  const o={a:isFinite(a)?a:0,n,own};
  if(x.c)o.c=x.c;
  if(x.category&&!o.c)o.c=x.category;
  return o;
}

function netDiscounts(list){
  const src=(list||[]).map(cloneLine).map(fixQty);
  const used=new Set(), out=[];
  src.forEach((it,i)=>{
    if(!isDisc(it))return;
    let amt=+it.a;
    if(amt>TOL&&isDiscName(it.n))amt=rr(-amt);
    if(!(amt<-TOL))return;
    const j=bestMatch({n:it.n,a:amt},src,used);
    if(j<0){it.a=amt;if(!it.n)it.n=t('Descuentos');return}
    used.add(i);
    src[j].a=rr((+src[j].a||0)+amt);
    if((!src[j].own||!src[j].own.length)&&it.own)src[j].own=it.own.slice();
  });
  src.forEach((it,i)=>{if(used.has(i))return;if(Math.abs(+it.a)>0.004||it.n)out.push(it)});
  return out;
}

function sumA(list){return rr((list||[]).reduce((s,x)=>s+(+x.a||0),0))}
function taxOf(P){const x=rr(+(P&&P.tax)||0);return x>0?x:0}
function overage(P,list){return rr(sumA(list)+taxOf(P)-rr(+P.total||0))}

function addBalanceLine(list,P){
  const d=overage(P,list);
  if(d<=TOL)return {list,added:0};
  if(d>sumA(list)*0.5+0.01)return {list,added:0};
  const own=(()=>{const s=new Set();(list||[]).forEach(x=>(x.own||[]).forEach(w=>s.add(w)));return s.size? [...s]:['Yo','Tony','Carlos']})();
  return {list:(list||[]).concat([{n:t('Descuentos'),a:rr(-d),own}]),added:rr(d)};
}

function scoreOf(list,P){return Math.abs(overage(P,list))}
function applyList(list,P,opts){
  const src=(list||[]).map(cloneLine).map(fixQty);
  const asNeg=src.map(it=>{
    const o={a:+it.a,n:it.n,own:(it.own||[]).slice()};if(it.c)o.c=it.c;
    if(+o.a>TOL&&isDiscName(o.n))o.a=rr(-o.a);
    return o;
  });
  const dropped=src.filter(it=>!(isDiscName(it.n)||+it.a<-TOL));
  const netted=netDiscounts(src);
  const cands=[{list:src,tag:'raw'},{list:asNeg,tag:'neg'},{list:dropped,tag:'drop'},{list:netted,tag:'net'}];
  let best=cands[0],bestS=scoreOf(best.list,P);
  cands.forEach(c=>{
    const s=scoreOf(c.list,P);
    if(s<bestS-0.0001||(Math.abs(s-bestS)<=0.0001&&c.tag==='net'&&best.tag!=='net')){best=c;bestS=s}
  });
  let out=best.list,added=0;
  if(!(opts&&opts.noBalance)&&overage(P,out)>TOL){
    const b=addBalanceLine(out,P);out=b.list;added=b.added;
  }
  return {list:out,tag:best.tag,added,score:bestS};
}

function lineOk(x){return Math.abs(+x.a)>0.004}

const HINT='\nDescuentos y cupones: las líneas de Instant Savings (INST SV), savings, descuento, cupón o un importe con el signo menos al final (p. ej. 2.00-) son descuentos. Réstalos del ítem que corresponda (mismo nombre) y deja el "amount" de ese ítem en el precio NETO. No los dejes como ítem suelto con importe positivo. Si no puedes emparejarlos, inclúyelos como ítem con amount negativo. Cantidades: si el recibo dice "3 AT 1 FOR 4.58" o "2 x 28.16", el "amount" es el TOTAL de la línea (13.74 o 56.32), no el precio unitario.';

function sharesPre(P,list){
  const t=rr(P.total),L2=(list||[]).filter(lineOk),rem=t-L2.reduce((s,x)=>s+(+x.a||0),0),ex={},base={};
  if(P.mode==='eq'){const who=P.who&&P.who.length?P.who:['Yo'];who.forEach(w=>base[w]=rem/who.length)}
  else{base.Tony=rem*.5;base.Carlos=rem*.25;base.Yo=rem*.25}
  Object.entries(base).forEach(([w,v])=>ex[w]=(ex[w]||0)+v);
  L2.forEach(it=>Object.entries(itPort(it)).forEach(([w,v])=>ex[w]=(ex[w]||0)+v));
  const out={};Object.entries(ex).forEach(([w,v])=>{const x=rr(Math.round(v*1e6)/1e6);if(x||w in base)out[w]=x});
  const d=rr(t-Object.values(out).reduce((s,v)=>s+v,0));
  if(Math.abs(d)>0.0001){const k='Yo' in out?'Yo':Object.keys(out).at(-1);if(k)out[k]=rr(out[k]+d)}
  return out;
}

function installApp(){
  if(window._v160App||typeof computeShares!=='function')return;
  window._v160App=true;

  if(typeof taxSplit==='function'){
    taxSplit=function(P,list){
      const tax=typeof ptax==='function'?ptax(P):taxOf(P);
      if(!tax)return null;
      const pre=sharesPre({...P,total:rr(rr(P.total)-tax)},list);
      const s=Object.values(pre).reduce((a,v)=>a+v,0);
      if(!(s>0))return null;
      const o={};Object.keys(pre).forEach(w=>o[w]=rr(Math.floor(tax*pre[w]/s*100+1e-9)/100));
      const d=rr(tax-Object.values(o).reduce((a,v)=>a+v,0));
      const k='Yo' in o?'Yo':Object.keys(o).at(-1);o[k]=rr(o[k]+d);
      return {pre,tax:o};
    };
  }
  computeShares=function(P,list){
    const ts=typeof taxSplit==='function'?taxSplit(P,list):null;
    if(!ts)return sharesPre(P,list);
    const out={};
    Object.keys(ts.pre).forEach(w=>out[w]=rr(ts.pre[w]+(ts.tax[w]||0)));
    const d=rr(rr(P.total)-Object.values(out).reduce((a,v)=>a+v,0));
    if(Math.abs(d)>0.0001){const k='Yo' in out?'Yo':Object.keys(out).at(-1);if(k)out[k]=rr(out[k]+d)}
    return out;
  };
  if(typeof itemsSum==='function'){
    itemsSum=w=>rr((D.list||[]).filter(lineOk).reduce((s,it)=>s+(itPort(it)[w]||0),0));
  }
  if(typeof pShare==='function'){
    const _ps=pShare;
    pShare=function(p,w){
      const r=_ps(p,w),old=r.tx||0;
      const ts=typeof taxSplit==='function'?taxSplit(p,pList(p).filter(lineOk)):null;
      const v=ts?rr(ts.tax[w]||0):0;
      r.s=rr((r.s||0)+old-v);r.tx=v;return r;
    };
  }
  if(typeof taxPrev==='function'){
    taxPrev=function(){
      if(!D||!(typeof ptax==='function'?ptax(D):taxOf(D)))return'';
      const ts=taxSplit(D,(D.list||[]).filter(lineOk));if(!ts)return'';
      return T('Impuesto {0}: {1}',f(ptax?ptax(D):taxOf(D)),Object.keys(ts.tax).filter(w=>ts.tax[w]).map(w=>DN(w)+' '+f(ts.tax[w])).join(' · '));
    };
  }

  if(typeof scanPrompt==='function'){
    const _sp=scanPrompt;
    scanPrompt=function(){return _sp()+HINT};
  }
  if(typeof scanApply==='function'){
    const _sa=scanApply;
    scanApply=function(o){
      const r=_sa(o);
      if(!D||D.mode==='manual')return r;
      const raw=(Array.isArray(o&&o.items)?o.items:[]).map(cloneLine);
      const cats=typeof pCats==='function'?pCats():[];
      raw.forEach(x=>{if(x.c&&cats.length&&!cats.includes(x.c)&&typeof scanCat==='function')x.c=scanCat(x.c)});
      const prev=D.list||[];
      const byN={};prev.forEach(x=>{if(x.n)byN[normName(x.n)]=x});
      raw.forEach(x=>{const p=byN[normName(x.n)];if(p){if(p.own)x.own=p.own.slice();if(p.c)x.c=p.c}});
      const tot=scanAmt(o&&o.total);if(tot>0)D.total=tot;
      const tx=scanAmt(o&&o.tax);if(tx>0&&tx<D.total)D.tax=tx;
      const ap=applyList(raw.length?raw:prev,D);
      D.list=ap.list;D._io=true;
      flagMsg(ap,raw.length?raw:prev);
      if(typeof recomputeEq==='function')recomputeEq();
      if(typeof drawP==='function'&&dlg&&dlg().open)drawP();
      return r;
    };
  }
  if(typeof inboxOpen==='function'){
    const _io=inboxOpen;
    inboxOpen=function(id){
      _io(id);
      if(!D||!D._inbox)return;
      const x=(typeof INBOX!=='undefined'?INBOX:[]).find(y=>y.id===id);
      if(!x)return;
      const raw=(Array.isArray(x.items)?x.items:[]).slice(0,60).map(cloneLine);
      const prev=D.list||[];
      const ap=applyList(raw.length?raw:prev,D);
      D.list=ap.list;D._io=true;
      flagMsg(ap,raw.length?raw:prev);
      if(typeof recomputeEq==='function')recomputeEq();
      if(typeof drawP==='function')drawP();
    };
  }

  function flagMsg(ap,prev){
    D._v160undo=null;D._v160msg=null;D._v160kind=null;
    if(ap.added>TOL){
      const pre=applyList(prev||[],D,{noBalance:true}).list;
      D._v160undo={list:JSON.parse(JSON.stringify(pre))};
      D._v160msg=t('Faltaban {0} de descuentos en el envío. Se añadió la línea «Descuentos» para cuadrar el total.',typeof f==='function'?f(ap.added):('$'+ap.added.toFixed(2)));
      D._v160kind='lump';
    }else if(ap.tag==='net'||ap.tag==='neg'||(prev||[]).some(isDisc)){
      D._v160msg=t('Se aplicaron los descuentos a cada ítem. El total cuadra.');
      D._v160kind='net';
    }else if(Math.abs(overage(D,D.list))<=TOL){
      D._v160kind='ok';
    }
  }

  window.v160Undo=function(){
    if(!D||!D._v160undo)return;
    D.list=JSON.parse(JSON.stringify(D._v160undo.list));
    D._v160undo=null;D._v160msg=null;D._v160kind=null;
    if(typeof recomputeEq==='function')recomputeEq();
    if(typeof drawP==='function')drawP();
  };
  window.v160Apply=function(){
    if(!D)return;
    const prev=D.list||[];
    const ap=applyList(prev,D);
    D.list=ap.list;D._io=true;
    flagMsg(ap,prev);
    if(typeof recomputeEq==='function')recomputeEq();
    if(typeof drawP==='function')drawP();
  };

  if(typeof drawP==='function'){
    const _dr=drawP;
    drawP=function(){
      _dr.apply(this,arguments);
      paintBan();
      syncSave();
    };
  }
  function paintBan(){
    if(!D||D.mode==='manual')return;
    const box=document.getElementById('inbbox')||document.querySelector('#dlg h2');
    if(!box||document.getElementById('v160ban')){
      if(document.getElementById('v160ban')&&D._v160msg)return;
    }
    const sh=rr(rr(+D.total||0)-sumA(D.list)-taxOf(D));
    const need=sh<-TOL&&!D._v160msg;
    if(!D._v160msg&&!need)return;
    const el=document.createElement('div');el.id='v160ban';
    const ok=Math.abs(overage(D,D.list))<=TOL;
    el.style.cssText='background:'+(ok?'#ecfdf5':'#fef2f2')+';border:1px solid '+(ok?'#6ee7b7':'#fca5a5')+';border-radius:10px;padding:8px 10px;margin:8px 0;font-size:14px';
    let html='';
    if(D._v160msg)html+=`<div>${D._v160msg}</div>`;
    if(ok)html+=`<div style="color:#15803d;font-weight:700;margin-top:4px">${t('✅ El total cuadra')}</div>`;
    else if(need)html+=`<div style="color:#b91c1c;font-weight:700">${t('Los ítems y el impuesto superan el total.')}</div>`;
    if(D._v160kind==='lump'&&D._v160undo)html+=`<button class="sec" id="v160undo" style="margin-top:6px;min-height:34px" onclick="v160Undo()">${t('Deshacer descuentos')}</button>`;
    if(need)html+=`<button class="sec" id="v160apply" style="margin-top:6px;min-height:34px" onclick="v160Apply()">${t('Aplicar descuentos')}</button>`;
    el.innerHTML=html;
    if(box.id==='inbbox')box.insertAdjacentElement('afterend',el);
    else box.insertAdjacentElement('afterend',el);
  }
  function syncSave(){
    const ps=document.getElementById('psave');
    if(ps&&D&&D.mode!=='manual')ps.disabled=overage(D,D.list)>TOL;
  }

  function foldNeg(list){
    const pos=(list||[]).filter(x=>+x.a>TOL),neg=(list||[]).filter(x=>+x.a<-TOL);
    const drop=rr(neg.reduce((s,x)=>s+(-x.a),0));
    if(!(drop>TOL)||!pos.length)return (list||[]).filter(lineOk).map(x=>({...x,a:rr(x.a),own:(x.own||[]).slice()}));
    const sum=pos.reduce((s,x)=>s+(+x.a||0),0)||1;
    let left=drop;
    return pos.map((x,i,a)=>{
      const cut=i<a.length-1?rr((+x.a/sum)*drop):rr(left);
      left=rr(left-cut);
      const o={a:rr(+x.a-cut),own:(x.own||[]).slice()};
      if(x.n)o.n=x.n;if(x.c)o.c=x.c;
      return o;
    });
  }
  if(typeof saveP==='function'){
    const _sv=saveP;
    saveP=function(){
      if(!D||D.mode==='manual')return _sv();
      if(typeof liveItems==='function')liveItems();
      const ap=applyList(D.list||[],D,{noBalance:!(D._v160kind==='lump'||overage(D,D.list)>TOL)});
      if(overage(D,ap.list)<=TOL)D.list=ap.list;
      if(overage(D,D.list)>TOL)return _sv();
      const full=(D.list||[]).filter(lineOk).map(x=>({a:rr(x.a),...(x.n?{n:String(x.n).trim().slice(0,40)}:{}),...(x.c?{c:x.c}:{}),own:(x.own||[]).slice()}));
      const id=D.id;
      const hasNeg=full.some(x=>+x.a<-TOL);
      const keep=D.list;
      if(hasNeg)D.list=foldNeg(full);
      const prevLive=window._noLive;window._noLive=true;
      let r;
      try{r=_sv()}finally{window._noLive=prevLive}
      const closed=!(typeof dlg==='function'&&dlg()&&dlg().open);
      if(closed&&id&&typeof S!=='undefined'){
        Object.keys(S.months||{}).forEach(k=>{
          const p=(S.months[k].purchases||[]).find(x=>x.id===id);
          if(!p)return;
          p.list=hasNeg?full:((p.list&&p.list.length)?p.list:full);
          if(typeof computeShares==='function')p.shares=computeShares(p,p.list);
          if(typeof save==='function')save();
        });
      }else if(hasNeg&&D)D.list=keep;
      return r;
    };
  }
}

function installShare(){
  if(window._v160Share)return;
  if(typeof window.vPrompt!=='function'&&typeof window.regSend!=='function'&&typeof window.vScanFile!=='function')return;
  window._v160Share=true;
  if(typeof window.vPrompt==='function'){
    const _vp=window.vPrompt;
    window.vPrompt=function(){return _vp()+HINT};
  }
  function fixREG(){
    const R=window.REG;if(!R)return;
    const ap=applyList(R.items||[],{total:R.total,tax:R.tax});
    R.items=ap.list;
    R._v160added=ap.added;
    return ap;
  }
  if(typeof window.vScanFile==='function'){
    const prev=window.vScanFile;
    window.vScanFile=async function(file){
      await prev(file);
      const er=document.getElementById('rerr');
      if(er&&String(er.textContent||'').trim())return;
      if(window.REG&&window.REG.scan){
        fixREG();
        if(typeof window.regDraw==='function')window.regDraw();
      }
    };
  }
  if(typeof window.regSend==='function'){
    const _rs=window.regSend;
    window.regSend=async function(){
      if(window.REG)fixREG();
      const R=window.REG;
      if(R&&Array.isArray(R.items)){
        const orig=R.items;
        const arr=orig.slice();
        arr.filter=function(fn){
          try{
            const neg=orig.find(x=>+x.a<-TOL);
            if(neg&&typeof fn==='function'&&!fn(neg))return Array.prototype.filter.call(this,x=>lineOk(x));
          }catch(e){}
          return Array.prototype.filter.call(this,fn);
        };
        R.items=arr;
        try{return await _rs.apply(this,arguments)}
        finally{R.items=orig}
      }
      return _rs.apply(this,arguments);
    };
  }
}

function install(){installApp();installShare()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
else install();
window._v160={scanAmt,normName,isDiscName,isDisc,fixQty,netDiscounts,sumA,overage,addBalanceLine,applyList,cloneLine,HINT,TOL,install};
})();
