// v140: hoja de cuentas de Tony (funciones puras, se usan en la app de Joe y en el enlace de Tony).
// Montos en centavos internamente para que el reparto sume EXACTO al total.
(function(G){
const PEOPLE=['Joe','Tony','Carlos','Arianna'];
const BS_ROWS=[
 {key:'renta',name:'Renta de casa',group:'casa',re:/^(rent( house)?|renta( de casa)?|casa)$/i},
 {key:'ventanas',name:'Ventanas de impacto',group:'casa',re:/ventanas|impact windows?/i},
 {key:'agua',name:'Agua',group:'casa',re:/^(water|agua)$/i},
 {key:'luz',name:'Electricidad',group:'casa',re:/^(electricity|electricidad|luz)$/i},
 {key:'gas',name:'Gas',group:'casa',re:/^gas$/i},
 {key:'telefono',name:'Teléfono',group:'casa',re:/^(phone|tel[eé]fono)$/i},
 {key:'internet',name:'Internet',group:'casa',re:/^internet$/i},
 {key:'purificador',name:'Purificador',group:'casa',re:/^(purifier|purificador)/i},
 {key:'seguro',name:'Seguro del carro',group:'auto',re:/car insurance|seguro/i},
 {key:'letra',name:'Letra del carro',group:'auto',re:/car letter|letra/i}];
const GROUPS=[['casa','Casa y servicios'],['auto','Auto']];
const H5025={who:['Tony','Joe','Carlos'],mode:'pct',pct:{Tony:50,Joe:25,Carlos:25}};
const J100={who:['Joe'],mode:'pct',pct:{Joe:100}};
// Defaults acordados con Joe. Teléfono, Internet y Purificador: como hoy en la app (todo a Joe) hasta que se cambie el reparto.
// Comida NO va en esta hoja: Tony ya no pasa factura; lo llevan los recibos (y los abonos) como hasta ahora.
const BS_DEF={renta:H5025,ventanas:H5025,agua:H5025,luz:H5025,gas:H5025,seguro:J100,letra:J100,telefono:J100,internet:J100,purificador:J100};
const DEF_NOTE={telefono:1,internet:1,purificador:1};
const cl=o=>JSON.parse(JSON.stringify(o));
const cents=v=>Math.round((+v||0)*100);
function bsDefault(key){return cl(BS_DEF[key]||J100)}
// reparte total (en $) según alloc → {Joe,Tony,Carlos,Arianna} en $ (2 decimales) o {err}
function bsSplit(total,alloc){const T=cents(total),out={Joe:0,Tony:0,Carlos:0,Arianna:0};const a=alloc||J100;
 const who=(a.who||[]).filter(p=>PEOPLE.includes(p));if(!who.length)return {err:'nadie'};
 if(T<0)return {err:'negativo'};
 if(a.mode==='amt'){let s=0;for(const p of who){const c=cents((a.amt||{})[p]);if(c<0)return {err:'negativo'};out[p]=c;s+=c}
  if(s!==T)return {err:'suma',sum:s/100};PEOPLE.forEach(p=>out[p]=out[p]/100);return out}
 let w;if(a.mode==='eq'||a.mode==='one'){w=Object.fromEntries(who.map(p=>[p,1]))}
 else{w=Object.fromEntries(who.map(p=>[p,+((a.pct||{})[p])||0]));const sw=Object.values(w).reduce((x,y)=>x+y,0);
  if(Math.abs(sw-100)>1e-6)return {err:'pct',sum:sw};if(Object.values(w).some(v=>v<0))return {err:'negativo'}}
 const sw=Object.values(w).reduce((x,y)=>x+y,0);let used=0;const rem=[];
 who.forEach((p,i)=>{const exact=T*w[p]/sw,fl=Math.floor(exact);out[p]=fl;used+=fl;rem.push([exact-fl,i,p])});
 rem.sort((x,y)=>y[0]-x[0]||x[1]-y[1]);for(let i=0;i<T-used;i++)out[rem[i%rem.length][2]]+=1;
 PEOPLE.forEach(p=>out[p]=out[p]/100);return out}
function bsAllocTxt(a){a=a||J100;const who=a.who||[];if(a.mode==='eq')return who.join(' · ')+' (iguales)';
 if(a.mode==='amt')return who.map(p=>p+' $'+(+(a.amt||{})[p]||0).toFixed(2)).join(' · ');
 return who.map(p=>p+' '+(+((a.pct||{})[p])||0)+'%').join(' · ')}
// quién paga: la parte de Arianna la paga Tony
const BS_PAYER={Arianna:'Tony'};
G.BS={PEOPLE,ROWS:BS_ROWS,GROUPS,DEF:BS_DEF,DEF_NOTE,def:bsDefault,split:bsSplit,txt:bsAllocTxt,payer:BS_PAYER,cents};
})(typeof window!=='undefined'?window:globalThis);
