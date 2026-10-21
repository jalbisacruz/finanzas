// v96 (decisión de Joe): los 3 resúmenes ya no llevan artículos (una línea por compra). Nuevo PDF único «🧾 Detalle de compras»:
// cada compra con quién pagó (Joe, Tony, Arianna, Carlos), sus artículos y la parte de cada uno, resto, impuesto y total por persona.
// Privacidad igual que v95 (r3Vis): en el enlace de Tony/Carlos, las compras personales de los demás van sumadas en «Otras compras personales».
Object.assign(EN,{"🧾 Detalle de compras":"🧾 Purchase detail","Detalle":"Detail"});
function r3DetRow(p){const sh=Object.fromEntries(R3P.map(x=>[x,r2(+(p.shares||{})[x]||0)])),L=pList(p).filter(it=>+it.a>0),ptx=(typeof pTaxOf==='function'&&pTaxOf(p))||null,txT=ptx?r2(+p.tax):0,lines=[],isum={Yo:0,Tony:0,Carlos:0};
 L.forEach(it=>{const po=itPort(it),s={};R3P.forEach(x=>{s[x]=r2(po[x]||0);isum[x]=r2(isum[x]+s[x])});lines.push({n:String(it.n||DN(itCat(it,p))).slice(0,48),a:r2(it.a),sh:s})});
 const rs={};R3P.forEach(x=>rs[x]=r2(sh[x]-isum[x]-(ptx?(ptx[x]||0):0)));const rest=r2((+p.total||0)-txT-L.reduce((s,it)=>s+(+it.a||0),0));
 if(!L.length)lines.push({k:'all',a:r2((+p.total||0)-txT),sh:rs});else if(rest>0.004||R3P.some(x=>Math.abs(rs[x])>0.004))lines.push({k:'rest',a:rest,sh:rs});
 if(ptx)lines.push({k:'tax',a:txT,sh:Object.fromEntries(R3P.map(x=>[x,r2(ptx[x]||0)]))});
 return {dl:p.date?fdate(p.date):'',s:DN(p.store),by:p.paidBy||'Yo',t:r2(p.total),sh,lines}}
{const _r=r3Data;r3Data=function(k,who){const o=_r(k,who);who=who||'Yo';o.purchases.forEach(x=>delete x.it);
 o.det={rows:byNew(S.months[k].purchases,undefined,k).filter(p=>r3Vis(p,who)).map(r3DetRow)};return o}}
{const _m=makePDF;makePDF=async function(kind,k){if(kind!=='det')return _m(kind,k);k=k||S.cur;await loadPDF();
 const mon=noAcc(lblL(k)).replace(/\s+/g,'-');return new File([rep3Det(r3Data(k,'Yo')).output('blob')],noAcc(T('Detalle')).replace(/\s/g,'')+'-'+mon+'-'+pdfStamp()+'.pdf',{type:'application/pdf'})}}
{const _r=rep;rep=function(){return _r().replace(/(<div class="rlinks">[\s\S]*?)(<\/div><\/div>)/,(m,a,b)=>a+`<button class="sec rlink" id="pdfdet" onclick="pdfAbrir('det')">${T('🧾 Detalle de compras')}</button>`+b)}}
document.head.insertAdjacentHTML('beforeend','<style>#rescard .rlinks{grid-template-columns:repeat(2,1fr)!important}</style>');
