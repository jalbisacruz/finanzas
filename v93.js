// v93: ¿participa esta persona en la compra? Tony incluye a Arianna (comparte su mitad).
// Sí si tiene parte > $0, o si la compró ella (o Arianna para Tony) y otra persona tiene parte (mueve lo que se debe).
const INV_BUY={Tony:['Tony','Arianna'],Carlos:['Carlos']};
function pInv(p,w){const sh=(p&&p.shares)||{};if((+sh[w]||0)>0.004)return true;
 return !!p.paidBy&&(INV_BUY[w]||[w]).includes(p.paidBy)&&Object.keys(sh).some(x=>x!==w&&(+sh[x]||0)>0.004)}
