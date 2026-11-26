// v164 (Joe): en el Mensaje para Carlos (v163, en vivo) «COMPRAS» y «PENDIENTE» no decían
// que eran con Joe, y «TOTAL QUE LE DEBES A TONY $49.89» (solo compras, v119) contradecía
// «Carlos le transfiere a Tony $1,149.82» (cuentas $1,099.93 + compras $49.89).
// Ahora, en Solo texto, Enviar con PDF y el texto corto del PDF:
//   Carlos: «Hola Carlos, este es tu resumen de {mes}:», «COMPRAS QUE PAGÓ JOE», «Total compras de Joe»,
//           «YA LE PAGASTE A JOE», «PENDIENTE CON JOE»; en ENTRE TÚ Y TONY «Total compras de Tony/Arianna»
//           y «TOTAL: CARLOS LE TRANSFIERE A TONY $X» + «(cuentas $A + compras $B)», la misma cifra del encabezado y del PDF.
//   Tony:   «TU PARTE DE LAS COMPRAS QUE PAGÓ JOE», «Total compras de Joe», y en ENTRE TÚ Y CARLOS
//           «TOTAL: CARLOS LE TRANSFIERE A TONY $X» + «(cuentas $A + compras $B)» en vez de «TOTAL QUE CARLOS TE DEBE».
// El PDF ya decía los nombres («Parte de Carlos en compras que pagó Joe», «Carlos le debe a Tony» = cuentas + compras).
(function(){
if(typeof EN==='object'&&EN)Object.assign(EN,{
  "Hola Carlos, este es tu resumen de {0}:":"Hi Carlos, here is your summary for {0}:",
  "Hola Carlos, te envío tu resumen de {0}.":"Hi Carlos, here is your summary for {0}.",
  "COMPRAS QUE PAGÓ JOE":"PURCHASES JOE PAID","Total compras de Joe":"Total purchases Joe paid",
  "YA LE PAGASTE A JOE":"ALREADY PAID TO JOE","PENDIENTE CON JOE":"PENDING WITH JOE",
  "TU PARTE DE LAS COMPRAS QUE PAGÓ JOE":"YOUR SHARE OF PURCHASES JOE PAID",
  "Total compras de {0}":"Total purchases {0} paid",
  "(cuentas {0} + compras {1})":"(bills {0} + purchases {1})","(cuentas {0} − compras {1})":"(bills {0} − purchases {1})"
});
const tt=(k,...a)=>{let s=typeof T==='function'?T(k,...a):k;if(typeof T!=='function')a.forEach((v,i)=>s=s.replace('{'+i+'}',v));return s};
const N=w=>w==='Yo'?'Joe':(typeof DN==='function'?DN(w):w);
const pre=(k)=>tt(k,'\u0001').split('\u0001')[0];   // parte fija de una frase con {0}
const ML=(l,v)=>typeof mLine==='function'?mLine(l,v):l+'  '+v;
function tc(k){
  const m=S.months[k];if(!m||!window._v152||typeof _v152.carlosFlows!=='function')return null;
  const fl=_v152.carlosFlows(m);return {fl,bills:fl.billsTony,purch:fl.purchTony,tot:fl.toTony};
}
function tcTotal(k,settled){
  const x=tc(k);if(!x||Math.abs(x.tot)<=0.004)return null;
  const [a,b]=x.tot>0?['Carlos','Tony']:['Tony','Carlos'];
  const head=ML(tt('TOTAL: {0} LE TRANSFIERE A {1}',N(a).toUpperCase(),N(b).toUpperCase()),f(Math.abs(x.tot)));
  if(Math.abs(x.purch)<=0.004)return [head];
  const br=x.purch>=0?tt('(cuentas {0} + compras {1})',f(x.bills),f(x.purch)):tt('(cuentas {0} − compras {1})',f(x.bills),f(-x.purch));
  return [head,br+(settled?' '+T('(ya pagado ✅)'):'')];
}
// «TOTAL QUE LE DEBES A TONY $X» / «TOTAL QUE CARLOS TE DEBE $X» (v119) y sus formas en inglés
function isPeerTot(x){
  const a=pre('TOTAL QUE LE DEBES A {0}'),b=pre('TOTAL QUE {0} TE DEBE');
  const b2=tt('TOTAL QUE {0} TE DEBE','\u0001').split('\u0001')[1]||'';
  return (a&&x.startsWith(a))||(b&&x.startsWith(b)&&b2&&x.includes(b2.trim()));
}
function fixPeer(L,k,shortPdf){
  // subtotales con el nombre de quien pagó
  const cp=pre('Compras que pagó {0}');let payer=null,sum=0;const tot=T('Total');
  const amt=x=>{const m=x.match(/— (−?)\$([\d,]+\.\d{2})\s*$/);return m?(m[1]?-1:1)*+m[2].replace(/,/g,''):null};
  const close=i=>{if(payer){L.splice(i,0,ML(tt('Total compras de {0}',payer),f(r2(sum))));payer=null;return 1}return 0};
  for(let i=0;i<=L.length;i++){
    const x=L[i];
    if(x===undefined){close(i);break}
    if(cp&&x.startsWith(cp)&&x.includes(' — ')){i+=close(i);payer=x.slice(cp.length,x.indexOf(' — '));sum=0;continue}
    if(payer&&x.startsWith(tot+'  ')){L[i]=ML(tt('Total compras de {0}',payer),x.slice(tot.length+2));payer=null;continue}
    if(payer){const v=amt(x);if(v!=null){sum+=v;continue}i+=close(i)}
  }
  // total entre Carlos y Tony = cuentas + compras (como el encabezado y el PDF)
  const j=L.findIndex(isPeerTot);
  if(j>=0){const settled=L[j].includes(T('(ya pagado ✅)'));const rep=tcTotal(k,settled);
    if(rep){if(shortPdf)L.splice(j,1,...(()=>{const x=tc(k);const [a,b]=x.tot>0?['Carlos','Tony']:['Tony','Carlos'];return [tt('{0} le transfiere a {1} {2}',N(a),N(b),f(Math.abs(x.tot)))]})());else L.splice(j,1,...rep)}
    else L.splice(j,1)}
  return j>=0;
}
function fixCarlos(s,k,shortPdf){
  const L=s.split('\n'),mes=typeof lbl==='function'?lbl(k):k;
  const h1=T('Hola Carlos, estas son tus compras de {0}:',mes),h2=T('Hola Carlos, te envío tus compras de {0}.',mes);
  if(L[0]===h1)L[0]=tt('Hola Carlos, este es tu resumen de {0}:',mes);
  if(L[0]===h2)L[0]=tt('Hola Carlos, te envío tu resumen de {0}.',mes);
  const C=T('COMPRAS'),TC=T('Total compras'),YP=T('YA PAGASTE'),P=T('PENDIENTE');
  let inJoe=false;
  for(let i=0;i<L.length;i++){const x=L[i];
    if(x===C){L[i]=tt('COMPRAS QUE PAGÓ JOE');inJoe=true;continue}
    if(inJoe&&x.startsWith(TC+'  ')){L[i]=ML(tt('Total compras de Joe'),x.slice(TC.length+2));inJoe=false;continue}
    if(x.startsWith(YP+'  '))L[i]=ML(tt('YA LE PAGASTE A JOE'),x.slice(YP.length+2));
    else if(x.startsWith(P+'  '))L[i]=ML(tt('PENDIENTE CON JOE'),x.slice(P.length+2));
    else if(x.startsWith(P+':  '))L[i]=ML(tt('PENDIENTE CON JOE')+':',x.slice(P.length+3));
  }
  {const x=tc(k);if(x&&x.tot<-0.004){const ln=tt('{0} le transfiere a {1} {2}',N('Tony'),N('Carlos'),f(-x.tot));if(!L.includes(ln))L.splice(1+(L[1]&&/le transfiere a|transfers/.test(L[1])?1:0),0,ln)}}
  const had=fixPeer(L,k,shortPdf);
  // sin compras con Tony pero con cuentas: el total con Tony también, tras las cuentas
  if(!had&&!shortPdf){
    const tb=T('Total tu parte de las cuentas'),i=L.findIndex(x=>x.startsWith(tb+'  '));const rep=tcTotal(k,false);
    if(i>=0&&rep)L.splice(i+1,0,'',...rep);
  }
  // en el texto corto del PDF, el total con Tony ya está arriba («Carlos le transfiere a Tony …»): no repetir
  if(shortPdf){const seen=new Set();for(let i=L.length-1;i>=0;i--){if(/le transfiere a|transfers .* to /.test(L[i])){if(seen.has(L[i]))L.splice(i,1);else seen.add(L[i])}}}
  return L.join('\n');
}
function fixTony(s,k,shortPdf){
  const L=s.split('\n'),TP=T('TU PARTE DE LAS COMPRAS'),TC=T('Total compras');let inJoe=false;
  for(let i=0;i<L.length;i++){const x=L[i];
    if(x===TP){L[i]=tt('TU PARTE DE LAS COMPRAS QUE PAGÓ JOE');inJoe=true;continue}
    if(inJoe&&x.startsWith(TC+'  ')){L[i]=ML(tt('Total compras de Joe'),x.slice(TC.length+2));inJoe=false}
  }
  fixPeer(L,k,shortPdf);
  return L.join('\n');
}
if(typeof msgShort==='function'&&typeof calc==='function'){
  const prev=msgShort;
  msgShort=function(who,k){const s=prev(who,k);try{return who==='carlos'?fixCarlos(s,k,false):fixTony(s,k,false)}catch(e){console.warn('v164 msg',e);return s}};
}
if(typeof msgPdfText==='function'&&typeof calc==='function'){
  const prev=msgPdfText;
  msgPdfText=function(who,k){const s=prev(who,k);try{return who==='carlos'?fixCarlos(s,k,true):fixTony(s,k,true)}catch(e){console.warn('v164 pdftext',e);return s}};
}
window._v164={tc,tcTotal,fixCarlos,fixTony};
})();
