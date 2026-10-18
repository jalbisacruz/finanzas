// v92: cada compra cuenta exactamente la parte calculada de cada persona (ítems + resto según el modo + impuesto).
// Si la parte guardada (p.shares) no cuadra con la compra —p. ej. quedó vieja: la suma no da el total, o tiene ítems y alguien difiere en más de 1¢—
// se recalcula con la misma fórmula del diálogo. Las diferencias de 1¢ del redondeo antiguo se dejan como están (no cambia la historia).
// Reparto Manual: nunca se toca.
const SH_K='finanzas-v92-healed';
function shareFix(p){if(!p||p.mode==='manual'||!(+p.total>0)||typeof computeShares!=='function')return null;const L2=pList(p).filter(x=>+x.a>0),c=computeShares(p,L2),s=p.shares||{};
 const ws=[...new Set([...Object.keys(s),...Object.keys(c)])],sum=r2(Object.values(s).reduce((a,v)=>a+(+v||0),0)),off=Math.abs(sum-r2(+p.total))>0.011,diff=ws.some(w=>Math.abs((+s[w]||0)-(+c[w]||0))>0.011);
 return (off||(L2.length&&diff))?c:null}
function healShares(st){const out=[];Object.entries((st&&st.months)||{}).forEach(([k,m])=>(m.purchases||[]).forEach(p=>{const c=shareFix(p);if(c){out.push({k,id:p.id,store:p.store,date:p.date,total:p.total,before:{...(p.shares||{})},after:c});p.shares=c}}));
 if(out.length){try{const old=JSON.parse(localStorage.getItem(SH_K)||'[]');localStorage.setItem(SH_K,JSON.stringify(old.concat(out.map(o=>({...o,at:Date.now()}))).slice(-200)))}catch(e){}console.info('v92: partes recalculadas',out)}
 return out}
window.healShares=healShares;
if(healShares(S).length){save();setTimeout(()=>{try{render()}catch(e){}},0)}
{const _ssV92=window.setState;window.setState=o=>{_ssV92(o);if(healShares(S).length){save();render()}}}
