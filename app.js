const K='finanzas-v1';
const LANG_K='finanzas-lang';let LANG=localStorage.getItem(LANG_K)==='en'?'en':'es';
const LOC=()=>LANG==='en'?'en-US':'es-US';
const EN=/*EN*/{"+ Mes": "+ Month", "Nuevo gasto": "New expense", "sin fecha": "no date", "Efectivo": "Cash", "Pon el monto del cheque": "Enter the check amount", "Próximo cheque guardado": "Next check saved", "Cheque de {0} depositado automáticamente": "Check for {0} deposited automatically", "Depósito confirmado": "Deposit confirmed", "Crea un mes con “+ Mes”.": "Create a month with “+ Month”.", "{0} cheques por {1} depositados automáticamente": "{0} checks for {1} deposited automatically", "Disponible ahora": "Available now", "Confirmar depósito": "Confirm deposit", "Cheque del {0}. Ajusta si llegó otro monto.": "Check from {0}. Adjust if a different amount arrived.", "Confirmar": "Confirm", "Próximo cheque": "Next check", "Ajustar": "Adjust", "Monto del próximo cheque": "Next check amount", "Monto $": "Amount $", "Quitar": "Remove", "Guardar": "Save", "Disponible proyectado": "Projected available", "+ Próximo cheque": "+ Next check", "− Transferencia a Tony": "− Transfer to Tony", "(pendiente)": "(pending)", "− Pendiente a Tony (meses anteriores)": "− Owed to Tony (previous months)", "− Pagos de tarjetas": "− Card payments", "Cierre {0}": "{0} closing", "Transferir a Tony": "Transfer to Tony", "Cuentas {0} − comida Tony {1}": "Bills {0} − Tony food {1}", " − ya transferido {0}": " − already transferred {0}", "Sin monto aún": "No amount yet", " — si transfieres ahora, se paga solo lo que tiene monto": " — if you transfer now, only bills with an amount are paid", "Carlos te debe": "Carlos owes you", "Ya pagó {0}": "Already paid {0}", "Cobrar a Carlos": "Collect from Carlos", "Pendientes de meses anteriores": "Pending from previous months", "No se mezclan con el mes actual. Si llega un bill tarde, anótalo en su mes (Cuentas) y aquí se actualiza.": "Kept separate from the current month. If a bill arrives late, enter it in its month (Accounts) and this updates.", "Mi balance {0} (modelo Excel)": "My balance {0} (Excel model)", "Mi dinero {0} − Deuda total {1}": "My money {0} − Total debt {1}", "Detalle": "Details", "Ingresos (débito, efectivo, cheques)": "Income (debit, cash, checks)", "Ingreso Tony (su comida)": "Tony income (his food)", "Ingreso Carlos (por cobrar)": "Carlos income (to collect)", "ya cobrado {0}": "already collected {0}", "Mi dinero": "My money", "Subtotal crédito": "Credit subtotal", "Cuentas para Tony": "Bills to Tony", "− Ya transferido a Tony": "− Already transferred to Tony", "Deuda total": "Total debt", "Gastos registrados del mes": "Expenses recorded this month", "+ Añadir": "+ Add", "Depositar": "Deposit", "PAGAR": "PAY", "Fija": "Fixed", "Var.": "Var.", "Subtotal": "Subtotal", "pendiente": "pending", "pagado": "paid", "La primera línea es tu débito. Las demás (efectivo…) se pueden depositar al débito. Los cheques se registran en Inicio.": "The first line is your debit. The others (cash…) can be deposited to debit. Checks are recorded on Home.", "Tarjetas de crédito": "Credit cards", "“Fija” pasa su monto al mes siguiente; “Var.” empieza en 0": "“Fixed” carries its amount to next month; “Var.” starts at 0", "Cheques depositados ({0})": "Deposited checks ({0})", "Depositado": "Deposited", "importado": "imported", "Aún no hay cheques depositados este mes. Se agregan al confirmar el depósito en Inicio.": "No checks deposited this month yet. They are added when the deposit is confirmed on Home.", "+ Nueva compra compartida": "+ New shared purchase", "Toca una compra para editarla o borrarla.": "Tap a purchase to edit or delete it.", "Sin compras este mes.": "No purchases this month.", "Cheque": "Check", "automático": "automatic", "Pago {0}": "{0} payment", "Transferencia a débito ({0})": "Transfer to debit ({0})", "compartida": "shared", "Sin destinatario": "No recipient", "¿De qué tarjeta?": "Which card?", "Elige la tarjeta": "Pick the card", "Sin tarjeta": "No card", "Cash back por tarjeta": "Cash back by card", "Reembolso en efectivo por tarjeta": "Cash back by card", "Remesas por destinatario": "Remittances by recipient", "Gasto por categoría": "Spending by category", "compras compartidas cuentan solo tu parte": "shared purchases count only your share", "Sin gastos registrados.": "No expenses recorded.", "Ingresos por concepto": "Income by source", "sin reembolsos, transferencias entre tus cuentas ni pagos de tarjeta": "excluding reimbursements, transfers between your accounts and card payments", "Sin ingresos registrados.": "No income recorded.", "Movimientos": "Transactions", "Todas las categorías": "All categories", "Nada aquí.": "Nothing here.", "Acumulado": "Cumulative", "Total": "Total", "Neto {0}": "Net {0}", "Idioma": "Language", "Se guarda solo en este dispositivo.": "Saved on this device only.", "Conceptos de ingreso": "Income sources", "Uno por línea": "One per line", "Categorías": "Categories", "Una por línea (puedes poner emoji)": "One per line (emoji allowed)", "Personas": "People", "Tiendas": "Stores", "Seguridad": "Security", "Cambiar PIN": "Change PIN", "Respaldo": "Backup", "Exportar JSON": "Export JSON", "Importar JSON": "Import JSON", "Mes": "Month", "¿Borrar {0}?": "Delete {0}?", "Borrar este mes": "Delete this month", "La línea de débito no se puede borrar (puedes renombrarla)": "The debit line can't be deleted (you can rename it)", "Gasto": "Expense", "Ingreso": "Income", "¿A quién se lo enviaste?": "Who did you send it to?", "+ Nuevo destinatario": "+ New recipient", "Descripción (opcional)": "Description (optional)", "Cancelar": "Cancel", "Es compra compartida (Tony/Carlos)": "It's a shared purchase (Tony/Carlos)", "Registrar ingreso": "Record income", "Pon un monto": "Enter an amount", "Ingreso guardado": "Income saved", "Elige o escribe el destinatario": "Pick or type the recipient", "Gasto guardado": "Expense saved", "Depositar {0} al débito": "Deposit {0} to debit", "Disponible en {0}: {1}. Cambia el monto para un depósito parcial.": "Available in {0}: {1}. Change the amount for a partial deposit.", "El monto es mayor que lo disponible. ¿Continuar?": "The amount is more than available. Continue?", "Depósito registrado": "Deposit recorded", "Pagar {0}": "Pay {0}", "Saldo {0} · se descuenta del débito. Cambia el monto para un pago parcial.": "Balance {0} · taken from debit. Change the amount for a partial payment.", "Confirmar pago": "Confirm payment", "El monto es mayor que el saldo. ¿Continuar?": "The amount is more than the balance. Continue?", "Pago registrado": "Payment recorded", "se descuenta del débito": "taken from debit", "se suma al débito": "added to debit", "Transferencia registrada": "Transfer recorded", "¿Borrar este movimiento? Se revierte el saldo.": "Delete this transaction? The balance will be reverted.", "Compra compartida": "Shared purchase", "Editar compra": "Edit purchase", "Total $": "Total $", "Sin afectar saldo": "Don't affect balance", "Familia 50/25/25": "Family 50/25/25", "Iguales": "Equal", "Manual": "Manual", "Entre quiénes ({0}):": "Split between ({0}):", "Tony 50% · Carlos 25% · Yo 25% (el redondeo va a Yo)": "Tony 50% · Carlos 25% · Me 25% (rounding goes to Me)", "Falta {0} — asignar a:": "{0} left — assign to:", "Repartido {0} de {1}": "Split {0} of {1}", "no cuadra": "doesn't add up", "Borrar": "Delete", "Compra guardada": "Purchase saved", "Archivo inválido": "Invalid file", "Mes nuevo (AAAA-MM):": "New month (YYYY-MM):", "Aún debes {0} a Tony": "You still owe Tony {0}", " y ": " and ", "Carlos te debe {0}": "Carlos owes you {0}", "Carlos aún te debe {0}": "Carlos still owes you {0}", "Se pasarán a “Pendientes de meses anteriores” y el mes nuevo empieza limpio. ¿Continuar?": "They will move to “Pending from previous months” and the new month starts clean. Continue?", "Crea tu PIN (4 a 6 dígitos)": "Create your PIN (4 to 6 digits)", "Repite el PIN": "Repeat the PIN", "Introduce tu PIN": "Enter your PIN", "PIN actual": "Current PIN", "Nuevo PIN (4 a 6 dígitos)": "New PIN (4 to 6 digits)", "Repite el nuevo PIN": "Repeat the new PIN", "Demasiados intentos. Espera {0}s": "Too many attempts. Wait {0}s", "Olvidé mi PIN": "I forgot my PIN", "PIN cambiado": "PIN changed", "PIN incorrecto (1 intento antes de esperar)": "Wrong PIN (1 attempt left before waiting)", "PIN incorrecto ({0} intentos antes de esperar)": "Wrong PIN ({0} attempts left before waiting)", "⚠️ Si reinicias el PIN se BORRARÁN todos los datos de la app en este dispositivo (meses, gastos, compras). ¿Continuar?": "⚠️ Resetting the PIN will DELETE all app data on this device (months, expenses, purchases). Continue?", "¿Seguro? Esto no se puede deshacer. Exporta un respaldo antes si puedes.": "Are you sure? This can't be undone. Export a backup first if you can.", "Nube": "Cloud", "Conectado como {0}": "Signed in as {0}", "Sincronizar ahora": "Sync now", "Cerrar sesión": "Sign out", "Guarda tus datos en tu cuenta de Google y úsalos en varios dispositivos. El PIN sigue siendo de cada dispositivo.": "Save your data to your Google account and use it on several devices. The PIN stays per device.", "Iniciar sesión con Google": "Sign in with Google", "No se pudo iniciar sesión: {0}": "Couldn't sign in: {0}", "¿Cerrar sesión? Los datos se quedan en este dispositivo.": "Sign out? Your data stays on this device.", "Error al iniciar sesión: {0}": "Sign-in error: {0}", "Ya hay datos en la nube (guardados {0}).\n\nAceptar = usar los datos de la NUBE (reemplaza los de este dispositivo).\nCancelar = usar los datos de ESTE DISPOSITIVO (reemplaza la nube).": "There is already data in the cloud (saved {0}).\n\nOK = use the CLOUD data (replaces this device).\nCancel = use THIS DEVICE data (replaces the cloud).", "¿Quieres guardar tus datos en la nube con tu cuenta de Google?\n(Puedes hacerlo luego en Ajustes)": "Do you want to save your data to the cloud with your Google account?\n(You can do it later in Settings)", "Inicio": "Home", "Cuentas": "Accounts", "Compras": "Purchases", "Reportes": "Reports", "Ajustes": "Settings", "El PIN debe tener de 4 a 6 dígitos": "The PIN must be 4 to 6 digits", "No coinciden, inténtalo de nuevo": "They don't match, try again", "Transferencia a Tony": "Transfer to Tony", "Pago de Carlos": "Payment from Carlos", "☁️ Sin sesión": "☁️ Not signed in", "⏳ Sincronización pendiente": "⏳ Sync pending", "☁️ Sincronizado": "☁️ Synced", "📴 Sin conexión (se sincroniza al volver)": "📴 Offline (syncs when back online)", "⚠️ Error de sincronización": "⚠️ Sync error"};
function T(s,...a){const r=LANG==='en'&&EN[s]!==undefined?EN[s]:s;return r.replace(/\{(\d)\}/g,(_,i)=>a[i])}
// nombres por defecto guardados en los datos: se traducen solo al mostrar
const NM={es:{'Rent House':'Renta de casa','Car Insurance':'Seguro del carro','Car Letter':'Letra del carro','Phone':'Teléfono','Purifier':'Purificador','Food':'Comida','Water':'Agua','Electricity':'Electricidad'},
 en:{'Débito':'Debit','Efectivo':'Cash','Otros efectivos':'Other cash','Yo':'Me','🛒 Comida/Supermercado':'🛒 Food/Groceries','🍽️ Restaurantes':'🍽️ Restaurants','⛽ Gasolina':'⛽ Gasoline','🚗 Transporte':'🚗 Transportation','🏠 Hogar':'🏠 Home','💡 Servicios':'💡 Utilities','💊 Salud':'💊 Health','👕 Ropa':'👕 Clothing','🎬 Entretenimiento':'🎬 Entertainment','📺 Suscripciones':'📺 Subscriptions','💸 Envíos a familia':'💸 Remittances to family','📦 Otros':'📦 Other','💼 Cheque':'💼 Paycheck','💵 Propinas/Tips':'💵 Tips','💵 Propinas':'💵 Tips','💳 Reembolso en efectivo':'💳 Cash Back','🎁 Regalo':'🎁 Gift','↩️ Reembolso':'↩️ Refund','↩️ Reembolso de Carlos':'↩️ Carlos reimbursement','🔁 Transferencia a débito':'🔁 Transfer to debit','💳 Pago de tarjeta':'💳 Card payment','💵 Ingreso':'💵 Income'}};
const DN=s=>{const x=NM[LANG][s];return x!==undefined?x:s};
const DNrev=s=>{for(const[k,v]of Object.entries(NM[LANG]))if(v===s)return k;return s};
function navLbl(){document.documentElement.lang=LANG;document.querySelectorAll('nav button').forEach(b=>b.lastChild.textContent=T(b.dataset.l));const n=document.getElementById('newm');if(n)n.textContent=T('+ Mes');const fb=document.getElementById('fab');if(fb)fb.setAttribute('aria-label',T('Nuevo gasto'))}
function setLang(l){LANG=l==='en'?'en':'es';localStorage.setItem(LANG_K,LANG);navLbl();if(unlocked)render();else drawLock()}
const r2=n=>Math.round((+n||0)*100)/100, f=n=>(r2(n)<0?'−':'')+'$'+Math.abs(r2(n)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const PEOPLE=['Yo','Tony','Carlos'];
const STORES=["Sam's Club",'Walmart','Publix','Aldi','Amazon','Detwilers'];
function seed(){
 const bills=(a)=>a.map(([n,v])=>({id:uid(),name:n,amount:v}));
 const P=(store,tony,carlos,note)=>({id:uid(),store,date:'',total:r2(tony+carlos),mode:'manual',shares:{Tony:tony,Carlos:carlos},note:note||'Importado de Excel'});
 return {people:['Yo','Tony','Carlos'],stores:STORES.slice(),cur:'2026-10',months:{
 '2026-10':{income:[{id:uid(),name:'Débito',amount:0,role:'debit'},{id:uid(),name:'Efectivo',amount:0}],
  cards:bills([['BOA 1',0],['BOA 2',0],['Chase',0],['Amazon',0],['Capital One',0],['Affirm',0]]),
  bills:bills([['Car Insurance',0],['Car Letter',0],['Rent House',0],['Phone',0],['Internet',0],['Purifier',0],['Gas',0],['Food',0],['Water',0],['Electricity',0]]),
  purchases:[]}}};
}
let S=JSON.parse(localStorage.getItem(K)||'null')||seed();
try{Object.values(S.months||{}).forEach(m=>{if(m.cards&&!m.cards.some(c=>/affirm/i.test(c.name)))m.cards.push({id:uid(),name:'Affirm',amount:0})})}catch(e){}
// ---------- migración / modelo ----------
const CATS=['🛒 Comida/Supermercado','🍽️ Restaurantes','⛽ Gasolina','🚗 Transporte','🏠 Hogar','💡 Servicios','💊 Salud','👕 Ropa','🎬 Entretenimiento','📺 Suscripciones','💸 Envíos a familia','🤝 Tony','📦 Otros'];
const SHARED_CAT='🛒 Comida/Supermercado';
const INC_CATS=['💼 Cheque','💵 Propinas','💳 Reembolso en efectivo','🎁 Regalo','↩️ Reembolso','📦 Otros'];
if(!S.incCats)S.incCats=INC_CATS.slice();
S.incCats=S.incCats.filter(c=>!/pago de carlos/i.test(c));
if(!S.catsV2){S.cats=[...CATS,...(S.cats||[]).filter(c=>!CATS.some(x=>x.endsWith(' '+c)))];S.catsV2=1}
S.checks=S.checks||[];
const VAR=/^(gas|food|water|electricity)$/i;
// Cheques: las líneas 'Cheque mm/dd' pasan al historial (las de 0 se eliminan)
Object.entries(S.months).forEach(([k,m])=>{m.income=m.income.filter(x=>{const mt=/^cheque\b\s*(?:(\d{1,2})\/(\d{1,2}))?/i.exec(x.name||'');if(!mt)return true;
 if(+x.amount){const y=k.slice(0,4),date=mt[1]?`${y}-${mt[1].padStart(2,'0')}-${mt[2].padStart(2,'0')}`:k+'-01';S.checks.push({id:uid(),amount:r2(x.amount),date,status:'deposited',legacy:true,month:k})}
 return false})});
if(Object.values(S.months).some(m=>'carlosAdj'in m)){Object.values(S.months).forEach(m=>delete m.carlosAdj);localStorage.setItem(K,JSON.stringify(S))}
Object.values(S.months).forEach(m=>{
 m.bills.forEach(b=>{if(b.fixed===undefined)b.fixed=!VAR.test(b.name)});
 m.personal=m.personal||[];m.events=m.events||[];
 // Débito se identifica por role:'debit' (no por nombre). Respeta las líneas del usuario (no re-agrega 'Efectivo').
 if(!m.income.some(x=>x.role==='debit')){const d=m.income.find(x=>/d[eé]bit/i.test(x.name||''))||m.income[0];if(d)d.role='debit';else m.income.unshift({id:uid(),name:'Débito',amount:0,role:'debit'})}
});
// v24: transferencias parciales a Tony / pagos parciales de Carlos. tonyBase/carlosBase = lo ya saldado antes de v24.
// v27: Tips/Cash Back pasan a conceptos de ingreso; sus líneas de dinero se quitan solo si están en 0
const TIPLINE=/^\W*(tips?|cash[\s-]*back|propinas?(\s*\/\s*tips?)?)\W*$/i;
const isTipLine=x=>x&&x.role!=='debit'&&TIPLINE.test((x.name||'').trim());
function pruneTips(st){const k=Object.keys(st.months||{}).sort().at(-1),m=k&&st.months[k];if(!m||!m.income)return false;
 const n=m.income.length;m.income=m.income.filter(x=>!(isTipLine(x)&&Math.abs(+x.amount||0)<0.005));return m.income.length!==n}
function migrateInc(st){st.incCats=(st.incCats||INC_CATS.slice()).map(c=>/^💵\s*propinas\s*\/\s*tips$/i.test(c.trim())?'💵 Propinas':c);
 st.incCats=st.incCats.filter((c,i,a)=>a.indexOf(c)===i);
 if(!st.incCats.includes('💵 Propinas'))st.incCats.splice(1,0,'💵 Propinas');
 if(!st.incCats.includes('💳 Reembolso en efectivo'))st.incCats.splice(st.incCats.indexOf('💵 Propinas')+1,0,'💳 Reembolso en efectivo');
 Object.values(st.months||{}).forEach(m=>(m.events||[]).forEach(e=>{if(e.concept&&/^💵\s*propinas\s*\/\s*tips$/i.test(e.concept.trim())){e.concept='💵 Propinas';if(/^propinas\/tips$/i.test(e.desc||''))e.desc='Propinas'}}));
 pruneTips(st)}
function migrate(st){migrateInc(st);Object.values(st.months||{}).forEach(m=>{m.events=m.events||[];m.bills=m.bills||[];m.purchases=m.purchases||[];
 const ev=t=>m.events.filter(e=>e.type===t).reduce((s,e)=>s+(+e.amount||0),0);
 if(m.tonyBase===undefined){const b=m.bills.reduce((s,x)=>s+(+x.amount||0),0),fd=m.purchases.reduce((s,x)=>s+(+(x.shares||{}).Tony||0),0);
  m.tonyBase=m.tonyPaid?r2(Math.max(0,b-fd-ev('tony'))):0;if(m.tonyPaid)m.bills.forEach(x=>{if(+x.amount&&x.paid===undefined)x.paid=r2(x.amount)})}
 if(m.carlosBase===undefined){const ow=m.purchases.reduce((s,x)=>s+(+(x.shares||{}).Carlos||0),0);m.carlosBase=m.carlosPaid?r2(Math.max(0,ow-ev('carlos'))):0}})}
{const b4=JSON.stringify(S);migrate(S);if(JSON.stringify(S)!==b4)localStorage.setItem(K,JSON.stringify(S))}
function save(){S.updatedAt=Date.now();localStorage.setItem(K,JSON.stringify(S));window.onLocalSave&&window.onLocalSave()}
// puente para sync.js
window.getState=()=>S;
window.setState=(obj)=>{S=obj;migrate(S);localStorage.setItem(K,JSON.stringify(S));if(!S.months[S.cur])S.cur=Object.keys(S.months).sort().at(-1)||'';render()};
window.hasUserData=()=>!!S.updatedAt;
window.rerender=()=>render();
const M=()=>S.months[S.cur];
const keys=()=>Object.keys(S.months).sort();
const L=()=>S.months[keys().at(-1)];               // mes "vivo": saldos actuales
const lbl=k=>{const[y,m]=k.split('-');const s=new Date(+y,m-1,15).toLocaleDateString(LOC(),{month:'short'}).replace('.','');return s[0].toUpperCase()+s.slice(1)+' '+y};
const today=()=>new Date().toLocaleDateString('en-CA');
const fdate=d=>{if(!d)return T('sin fecha');const[y,m,dd]=d.split('-');return new Date(+y,m-1,+dd).toLocaleDateString(LOC(),{day:'numeric',month:'short'}).replace('.','')};
const sum=(a,fn)=>a.reduce((s,x)=>s+(+fn(x)||0),0);
const tXfer=m=>r2(sum(m.events.filter(e=>e.type==='tony'),e=>e.amount)+(+m.tonyBase||0));
const cRecv=m=>r2(sum(m.events.filter(e=>e.type==='carlos'),e=>e.amount)+(+m.carlosBase||0));
const prevPend=()=>keys().slice(0,-1).map(k=>({k,c:calc(S.months[k])})).filter(p=>p.c.tonyDue>0.005||p.c.carlosDue>0.005);
const debE=m=>m.income.find(x=>x.role==='debit')||m.income[0];
const cashLines=m=>m.income.filter(x=>x!==debE(m));
// 'cash' (antiguo) = línea llamada Efectivo o la primera no-débito; 'money:<nombre>' = línea por nombre
const moneyLine=(m,meth)=>{const cl=cashLines(m);if(meth==='cash')return cl.find(x=>/^efectivo$/i.test(x.name))||cl[0];const n=meth.slice(6);return cl.find(x=>x.name===n)||cl.find(x=>/^efectivo$/i.test(x.name))||cl[0]};
const monthFor=d=>S.months[(d||'').slice(0,7)]?(d||'').slice(0,7):keys().at(-1);
// método: 'deb' | 'cash' | 'card:<nombre>' | '' (sin efecto). amt>0 = sale dinero
function spend(method,amt){if(!method||!amt)return;const m=L();
 if(method==='deb'){const e=debE(m);e.amount=r2(e.amount-amt)}
 else if(method==='cash'||method.startsWith('money:')){let e=moneyLine(m,method);if(!e)e=debE(m);e.amount=r2((+e.amount||0)-amt)}
 else if(method.startsWith('card:')){const n=method.slice(5);let c=m.cards.find(x=>x.name===n);if(!c){c={id:uid(),name:n,amount:0};m.cards.push(c)}c.amount=r2(c.amount+amt)}}
const methName=x=>x==='deb'?esc(DN(debE(L()).name||'Débito')):x==='cash'?T('Efectivo'):x?.startsWith('money:')?esc(DN(x.slice(6))):x?.startsWith('card:')?'💳 '+esc(DN(x.slice(5))):'—';
const methOpts=sel=>[['deb',DN(debE(L()).name||'Débito')],...cashLines(L()).map(x=>['money:'+x.name,DN(x.name)]),...L().cards.map(c=>['card:'+c.name,'💳 '+DN(c.name)])].map(([v,t])=>`<option value="${esc(v)}"${v===sel?' selected':''}>${esc(t)}</option>`).join('');
function calc(m){
 const tony=sum(m.purchases,x=>x.shares.Tony),carlos=sum(m.purchases,x=>x.shares.Carlos);
 const mk=Object.keys(S.months).find(k=>S.months[k]===m),inc=sum(m.income,x=>x.amount)+sum(S.checks.filter(c=>c.legacy&&c.month===mk),c=>c.amount),credit=sum(m.cards,x=>x.amount),bills=sum(m.bills,x=>x.amount);
 const carlosOwes=carlos,toTony=r2(bills-tony),xfer=tXfer(m),recv=cRecv(m),tonyDue=Math.max(0,r2(toTony-xfer)),carlosDue=Math.max(0,r2(carlosOwes-recv));
 const money=inc+tony+carlosDue, debt=credit+bills-xfer;
 return {tony,carlos,carlosOwes,inc,credit,bills,money,debt,toTony,xfer,recv,tonyDue,carlosDue,bal:money-debt,pers:sum(m.personal,x=>x.amount)};
}
// ---------- cheques ----------
function nextThu(from){const d=new Date(from+'T12:00');do d.setDate(d.getDate()+1);while(d.getDay()!==4);return d.toLocaleDateString('en-CA')}
const pendingCheck=()=>S.checks.filter(c=>c.status==='pending').sort((a,b)=>a.date<b.date?-1:1)[0];
function nextCheckDate(){const dep=S.checks.filter(c=>c.status==='deposited').sort((a,b)=>a.date<b.date?-1:1).at(-1);
 if(dep){const d=new Date(dep.date+'T12:00');d.setDate(d.getDate()+7);const s=d.toLocaleDateString('en-CA');if(s>=today())return s}
 const t=new Date(today()+'T12:00');return t.getDay()===4?today():nextThu(today())}
let chkEdit=false;
const wd=d=>{const x=new Date(d+'T12:00');return x.toLocaleDateString(LOC(),{weekday:'short'}).replace('.','')+' '+x.toLocaleDateString(LOC(),{day:'2-digit',month:'2-digit'})};
function setCheck(){const a=r2(document.getElementById('chk').value),d=document.getElementById('chkd').value;if(!a)return alert(T('Pon el monto del cheque'));
 const pc=pendingCheck();if(pc){pc.amount=a;pc.date=d}else S.checks.push({id:uid(),amount:a,date:d,status:'pending'});chkEdit=false;save();render();toast(T('Próximo cheque guardado'))}
// Depósito automático: cheques pendientes cuya fecha llegó a las 5:00 AM (hora local)
let autoNote=null;
function autoDeposit(){if(!S.checks)return;const now=new Date(),dueL=S.checks.filter(c=>c.status==='pending'&&c.date&&new Date(c.date+'T05:00:00')<=now).sort((a,b)=>a.date<b.date?-1:1);
 if(!dueL.length)return;let tot=0;const m=L();
 dueL.forEach(c=>{c.status='deposited';c.auto=true;c.depositedOn=today();debE(m).amount=r2((+debE(m).amount||0)+c.amount);tot+=c.amount;
  S.months[monthFor(c.date)].events.push({id:uid(),type:'check',date:c.date,amount:c.amount,desc:'Cheque '+fdate(c.date)+' (automático)',checkId:c.id,auto:true})});
 autoNote={total:r2(tot),n:dueL.length};save();if(unlocked)render();toast(T('Cheque de {0} depositado automáticamente',f(tot)))}
function confirmCheck(){const c=pendingCheck(),a=r2(document.getElementById('cfa').value||c.amount);
 c.amount=a;c.status='deposited';c.depositedOn=today();const m=L();debE(m).amount=r2(debE(m).amount+a);
 S.months[monthFor(c.date)].events.push({id:uid(),type:'check',date:c.date,amount:a,desc:'Cheque '+fdate(c.date),checkId:c.id});
 save();render();toast(T('Depósito confirmado'))}
// ---------- vistas ----------
let tab='ini',filt='';
function render(){if(!unlocked)return;if(pruneTips(S))save();
 const sel=document.getElementById('msel');
 sel.innerHTML=keys().reverse().map(k=>`<option value="${k}"${k===S.cur?' selected':''}>${lbl(k)}</option>`).join('');
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
 const v=document.getElementById('v');
 if(!M()){v.innerHTML='<div class="card">'+T('Crea un mes con “+ Mes”.')+'</div>';return}
 v.innerHTML=({ini,res,cue,com,rep,cfg})[tab]();
}
function ini(){const m=L(),c=calc(m),deb=+debE(m).amount||0,disp=sum(m.income,x=>x.amount);const ss=window.syncStatus?`<div class="muted" id="syncst" style="text-align:right;margin:-4px 4px 6px">${window.syncStatus()}</div>`:'';
 const pc=pendingCheck(),due=false;
 const pp=prevPend(),oldT=sum(pp,p=>p.c.tonyDue),tonyDue=c.tonyDue,cards=c.credit,next=pc?pc.amount:0,proj=disp+next-tonyDue-oldT-cards;
 return ss+(autoNote?`<div class="card" style="background:#dcfce7;border:1px solid #86efac" id="autonote">✅ ${autoNote.n>1?T('{0} cheques por {1} depositados automáticamente',autoNote.n,f(autoNote.total)):T('Cheque de {0} depositado automáticamente',f(autoNote.total))} <button class="sec" style="min-height:32px;padding:2px 10px;float:right" onclick="autoNote=null;render()">OK</button></div>`:'')+`<div class="card hero"><div class="muted">${T('Disponible ahora')}</div><div class="big xl ${disp>=0?'pos':'neg'}">${f(disp)}</div>
 <div class="muted">${m.income.map(x=>esc(DN(x.name)||'—')+' '+f(x.amount)).join(' · ')}</div></div>
 ${due?`<div class="card" style="border:2px solid #15803d"><h2>💵 ${T('Confirmar depósito')}</h2><div class="muted">${T('Cheque del {0}. Ajusta si llegó otro monto.',fdate(pc.date))}</div>
  <div class="grid" style="margin-top:8px"><input id="cfa" type="number" inputmode="decimal" step="0.01" value="${pc.amount}"><button id="cfbtn" onclick="confirmCheck()">${T('Confirmar')}</button></div></div>`:''}
 ${due?'':`<div class="card">${pc&&!chkEdit?`<div class="row" style="border:0"><span class="n">${T('Próximo cheque')}: <b>${f(pc.amount)}</b> · ${wd(pc.date)}</span><button id="chkadj" class="sec" style="min-height:36px;padding:4px 12px;font-size:14px" onclick="chkEdit=true;render()">${T('Ajustar')}</button></div>`:
  `<h2>${T('Próximo cheque')}</h2><div class="muted">${T('Monto del próximo cheque')}</div><div class="grid" style="margin-top:8px"><input id="chk" type="number" inputmode="decimal" step="0.01" placeholder="${T('Monto $')}" value="${pc?pc.amount:''}"><input id="chkd" type="date" value="${pc?pc.date:nextCheckDate()}"></div>
  <div class="grid" style="margin-top:8px">${pc?`<button class="del" onclick="S.checks=S.checks.filter(x=>x.id!=='${pc.id}');chkEdit=false;save();render()">${T('Quitar')}</button>`:'<span></span>'}<button id="chkbtn" onclick="setCheck()">${T('Guardar')}</button></div>`}</div>`}
 <div class="card"><h2>${T('Disponible proyectado')}<span class="${proj>=0?'pos':'neg'}">${f(proj)}</span></h2>
 <div class="row"><span class="n">${T('Disponible ahora')}</span>${f(disp)}</div>
 <div class="row"><span class="n">${T('+ Próximo cheque')}</span>${f(next)}</div>
 <div class="row"><span class="n">${T('− Transferencia a Tony')} ${tonyDue>0.005?T('(pendiente)'):'✅'}</span>${f(tonyDue)}</div>
 ${oldT>0.005?`<div class="row"><span class="n">${T('− Pendiente a Tony (meses anteriores)')}</span>${f(oldT)}</div>`:''}
 <div class="row"><span class="n">${T('− Pagos de tarjetas')}</span>${f(cards)}</div></div>
 ${closeCard(m,keys().at(-1))}${pendCard()}`}
function closeCard(m,k){const c=calc(m),tp=c.tonyDue>0.005,cp=c.carlosDue>0.005,empty=m.bills.filter(b=>!(+b.amount));return `<div class="card"><h2>${T('Cierre {0}',lbl(k))}</h2>
 <div class="row"><span class="n">➡️ ${T('Transferir a Tony')}<div class="muted">${T('Cuentas {0} − comida Tony {1}',f(c.bills),f(c.tony))}${c.xfer?T(' − ya transferido {0}',f(c.xfer)):''}</div></span><b>${tp?f(c.tonyDue):'✅ '+f(c.xfer)}</b></div>
 ${empty.length?`<div class="muted">⏳ ${T('Sin monto aún')}: ${empty.map(b=>esc(DN(b.name))).join(', ')}${tp?T(' — si transfieres ahora, se paga solo lo que tiene monto'):''}</div>`:''}
 ${tp?`<button id="tonybtn" style="width:100%;margin:4px 0 8px" onclick="payDlg('tony','${k}')">${T('Transferir a Tony')}</button>`:''}
 <div class="row"><span class="n">💰 ${T('Carlos te debe')}${c.recv&&cp?`<div class="muted">${T('Ya pagó {0}',f(c.recv))}</div>`:''}</span><b>${cp?f(c.carlosDue):'✅ '+f(c.recv)}</b></div>
 ${cp?`<button id="carlosbtn" class="sec" style="width:100%;margin-top:4px" onclick="payDlg('carlos','${k}')">${T('Cobrar a Carlos')}</button>`:''}</div>`}
function pendCard(){const pp=prevPend();if(!pp.length)return'';return `<div class="card" id="pendcard" style="border:2px solid #f59e0b"><h2>⏳ ${T('Pendientes de meses anteriores')}</h2><div class="muted">${T('No se mezclan con el mes actual. Si llega un bill tarde, anótalo en su mes (Cuentas) y aquí se actualiza.')}</div>
 ${pp.map(({k,c})=>(c.tonyDue>0.005?`<div class="row"><span class="n">Tony – ${lbl(k)}</span><b>${f(c.tonyDue)}</b><button class="pay" onclick="payDlg('tony','${k}')">${T('Transferir a Tony')}</button></div>`:'')+
  (c.carlosDue>0.005?`<div class="row"><span class="n">Carlos – ${lbl(k)}</span><b>${f(c.carlosDue)}</b><button class="pay dep" onclick="payDlg('carlos','${k}')">${T('Cobrar a Carlos')}</button></div>`:'')).join('')}</div>`}
function res(){const c=calc(M());return `<div class="card"><div class="muted">${T('Mi balance {0} (modelo Excel)',lbl(S.cur))}</div><div class="big ${c.bal>=0?'pos':'neg'}">${f(c.bal)}</div>
 <div class="muted">${T('Mi dinero {0} − Deuda total {1}',f(c.money),f(c.debt))}</div></div>${closeCard(M(),S.cur)}${pendCard()}
 <div class="card"><h2>${T('Detalle')}</h2>
 <div class="row"><span class="n">${T('Ingresos (débito, efectivo, cheques)')}</span>${f(c.inc)}</div>
 <div class="row"><span class="n">${T('Ingreso Tony (su comida)')}</span>${f(c.tony)}</div>
 <div class="row"><span class="n">${T('Ingreso Carlos (por cobrar)')}${c.recv?'<div class="muted">'+T('ya cobrado {0}',f(c.recv))+'</div>':''}</span>${f(c.carlosDue)}</div>
 <div class="row"><span class="n"><b>${T('Mi dinero')}</b></span><b>${f(c.money)}</b></div>
 <div class="row"><span class="n">${T('Subtotal crédito')}</span>${f(c.credit)}</div>
 <div class="row"><span class="n">${T('Cuentas para Tony')}</span>${f(c.bills)}</div>
 ${c.xfer?`<div class="row"><span class="n">${T('− Ya transferido a Tony')}</span>${f(c.xfer)}</div>`:''}
 <div class="row"><span class="n"><b>${T('Deuda total')}</b></span><b>${f(c.debt)}</b></div>
 <div class="row"><span class="n">${T('Gastos registrados del mes')}</span>${f(spent(M()).total)}</div></div>`}
function list(key,title,hint){const m=M(),t=sum(m[key],x=>x.amount);return `<div class="card"><h2>${title}<button class="sec" onclick="addItem('${key}')">${T('+ Añadir')}</button></h2>${hint?`<div class="muted">${hint}</div>`:''}
 ${m[key].map(x=>`<div class="row"><input class="name n" value="${esc(DN(x.name))}" onchange="upd('${key}','${x.id}','name',this.value)"><input type="number" inputmode="decimal" step="0.01" value="${x.amount||''}" placeholder="0" onchange="upd('${key}','${x.id}','amount',this.value)">${key==='income'&&x!==debE(m)?`<button class="pay dep" ${+x.amount>0?'':'disabled'} onclick="depDlg('${x.id}')">${T('Depositar')}</button>`:''}${key==='cards'?`<button class="pay" ${+x.amount>0?'':'disabled'} onclick="cardPayDlg('${x.id}')">${T('PAGAR')}</button>`:''}${key==='bills'?billSt(x):''}${key==='bills'?`<button class="chip ${x.fixed?'on':''}" style="min-width:56px" onclick="tgFix('${x.id}')">${x.fixed?T('Fija'):T('Var.')}</button>`:''}<button class="del" onclick="delItem('${key}','${x.id}')">✕</button></div>`).join('')}
 <div class="tot"><span>${T('Subtotal')}</span><span>${f(t)}</span></div></div>`}
function billSt(b){const p=+b.paid||0,a=+b.amount||0;if(!p)return'';return a-p>0.005?`<span class="muted" title="${T('pendiente')}" style="white-space:nowrap">+${f(a-p)}</span>`:'<span title="'+T('pagado')+'">✅</span>'}
function cue(){const m=M();return list('income',T('Mi dinero'),T('La primera línea es tu débito. Las demás (efectivo…) se pueden depositar al débito. Los cheques se registran en Inicio.'))+
 
 list('cards',T('Tarjetas de crédito'))+list('bills',T('Cuentas para Tony'),T('“Fija” pasa su monto al mes siguiente; “Var.” empieza en 0'))+
 `<div class="card"><h2>${T('Cheques depositados ({0})',lbl(S.cur))}<span>${f(sum(depChecks(),c=>c.amount))}</span></h2>${depChecks().map(c=>`<div class="row"><span class="n">${wd(c.date)}<div class="muted">✅ ${T('Depositado')}${c.legacy?' · '+T('importado'):''}</div></span>${f(c.amount)}</div>`).join('')||'<div class="muted">'+T('Aún no hay cheques depositados este mes. Se agregan al confirmar el depósito en Inicio.')+'</div>'}</div>`}
const depChecks=()=>S.checks.filter(c=>c.status==='deposited'&&(c.legacy?c.month===S.cur:(c.date||'').startsWith(S.cur))).sort((a,b)=>a.date<b.date?-1:1);
function com(){const m=M(),c=calc(m);return `<div class="card"><button style="width:100%" onclick="editP()">${T('+ Nueva compra compartida')}</button>
 <div class="tot"><span>Tony ${f(c.tony)}</span><span>Carlos ${f(c.carlos)}</span></div><div class="muted">${T('Toca una compra para editarla o borrarla.')}</div></div>
 ${m.purchases.map(p=>`<div class="card p" onclick="editP('${p.id}')"><div class="tot" style="padding:0"><span>${esc(p.store)}</span><span>${f(p.total)}</span></div>
 <div class="muted">${fdate(p.date)} · ${methName(p.method)} · ${Object.entries(p.shares).filter(([k,v])=>+v).map(([k,v])=>esc(DN(k))+' '+f(v)).join(' · ')}</div></div>`).join('')||'<div class="card muted">'+T('Sin compras este mes.')+'</div>'}`}
// descripciones generadas por la app: se traducen al mostrar (los datos no cambian)
function evDesc(e){const d=e.desc||'';let mt;
 if((e.type==='tony'&&d==='Transferencia a Tony')||(e.type==='carlos'&&d==='Pago de Carlos'))return T(d);
 if(e.type==='check'&&/^Cheque /.test(d))return T('Cheque')+' '+fdate(e.date)+(e.auto||/automático/.test(d)?' ('+T('automático')+')':'');
 if(e.type==='cardpay'&&/^Pago /.test(d))return T('Pago {0}',DN(d.slice(5)));
 if(e.type==='todebit'&&(mt=/^Transferencia a débito \((.*)\)$/.exec(d)))return T('Transferencia a débito ({0})',DN(mt[1]));
 if(e.type==='income'&&e.concept&&d===e.concept.replace(/^\S+\s/,''))return DN(e.concept).replace(/^\S+\s/,'');
 return d}
// movimientos unificados de un mes
function moves(m){return [
 ...m.personal.map(x=>({id:x.id,kind:'gasto',date:x.date,amount:-x.amount,cat:x.cat||'📦 Otros',desc:(x.recipient?'→ '+x.recipient+(x.desc?' · ':''):'')+(x.desc||''),method:x.method,recipient:x.recipient})),
 ...m.purchases.map(p=>{const Tn=+p.shares.Tony||0,Cc=+p.shares.Carlos||0,tot=Math.max(+p.total||0,sum(Object.values(p.shares||{}),v=>v));return {id:p.id,kind:'compra',date:p.date,amount:-tot,cat:SHARED_CAT,desc:p.store+' ('+T('compartida')+')',method:p.method,mine:(m=>m<0.02?0:m)(r2(tot-Tn-Cc))}}),
 ...m.events.map(e=>({id:e.id,kind:e.type,date:e.date,amount:(e.type==='tony'||e.type==='cardpay')?-e.amount:e.amount,cat:e.type==='income'?(e.concept||'📦 Otros'):e.type==='check'?'💼 Cheque':e.type==='carlos'?'↩️ Reembolso de Carlos':e.type==='tony'?'🤝 Tony':e.type==='todebit'?'🔁 Transferencia a débito':e.type==='cardpay'?'💳 Pago de tarjeta':'💵 Ingreso',desc:evDesc(e)+(e.card?' · 💳 '+DN(e.card):''),method:e.method||'deb'}))
].sort((a,b)=>(b.date||'')<(a.date||'')?-1:1)}
// gasto real de Joe por categoría (compartidas: solo su parte; transferencia a Tony no cuenta como gasto)
function spent(m){const by={};moves(m).forEach(x=>{if(x.kind==='gasto')by[x.cat]=(by[x.cat]||0)+(-x.amount);if(x.kind==='compra'&&x.mine)by[x.cat]=(by[x.cat]||0)+x.mine});
 return {by,total:Object.values(by).reduce((a,b)=>a+b,0)}}
// ingresos por concepto (cheques, pagos de Carlos, ingresos registrados; no transferencias propias ni pagos de tarjeta)
const INC_KINDS=['income','check']; // reembolsos (Carlos) y transferencias propias no son ingreso
function earned(m){const by={};moves(m).forEach(x=>{if(INC_KINDS.includes(x.kind))by[x.cat]=(by[x.cat]||0)+x.amount});
 const k=keys().find(k=>S.months[k]===m);(S.checks||[]).filter(c=>c.legacy&&c.month===k).forEach(c=>by['💼 Cheque']=(by['💼 Cheque']||0)+(+c.amount||0));
 return {by,total:Object.values(by).reduce((a,b)=>a+b,0)}}
const bars=(by,cls)=>{const mx=Math.max(1,...Object.values(by));return Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar" onclick="filt='${esc(k)}';render()"><div class="bl"><span>${esc(DN(k))}</span><b class="${cls||''}">${f(v)}</b></div><div class="bt"><div style="width:${Math.max(2,v/mx*100)}%${cls?';background:#16a34a':''}"></div></div></div>`).join('')};
function remCard(m){const by={};m.personal.filter(x=>isRem(x.cat)).forEach(x=>{const r=x.recipient||T('Sin destinatario');by[r]=(by[r]||0)+(+x.amount||0)});const e=Object.entries(by);if(!e.length)return'';
 return `<div class="card"><h2>💸 ${T('Remesas por destinatario')}<span>${f(e.reduce((a,[,v])=>a+v,0))}</span></h2>${e.sort((a,b)=>b[1]-a[1]).map(([r,v])=>`<div class="row"><span class="n">${esc(r)}</span>${f(v)}</div>`).join('')}</div>`}
function cbBy(ms){const by={};ms.forEach(m=>(m.events||[]).filter(e=>e.type==='income'&&isCB(e.concept)).forEach(e=>{const k=e.card?DN(e.card):T('Sin tarjeta');by[k]=(by[k]||0)+(+e.amount||0)}));return by}
function cbCard(by,sub){const e=Object.entries(by);if(!e.length)return'';
 return `<div class="card" id="cbcard"><h2>💳 ${T('Reembolso en efectivo por tarjeta')}<span class="pos">${f(e.reduce((a,[,v])=>a+v,0))}</span></h2><div class="muted">${sub}</div>${e.sort((a,b)=>b[1]-a[1]).map(([r,v])=>`<div class="row"><span class="n">${esc(r)}</span><span class="pos">${f(v)}</span></div>`).join('')}</div>`}
function rep(){const m=M(),sp=spent(m),mx=Math.max(1,...Object.values(sp.by)),mv=moves(m).filter(x=>!filt||x.cat===filt),cats=[...new Set(moves(m).map(x=>x.cat))];
 const er=earned(m),all=keys().map(k=>[k,spent(S.months[k]).total,earned(S.months[k]).total]),acc=all.reduce((a,[,t])=>a+t,0),accI=all.reduce((a,[,,i])=>a+i,0);
 return `<div class="card"><h2>${T('Gasto por categoría')}<span>${f(sp.total)}</span></h2><div class="muted">${lbl(S.cur)} · ${T('compras compartidas cuentan solo tu parte')}</div>
 ${Object.entries(sp.by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar" onclick="filt='${esc(k)}';render()"><div class="bl"><span>${esc(DN(k))}</span><b>${f(v)}</b></div><div class="bt"><div style="width:${Math.max(2,v/mx*100)}%"></div></div></div>`).join('')||'<div class="muted">'+T('Sin gastos registrados.')+'</div>'}</div>
 <div class="card" id="inccard"><h2>${T('Ingresos por concepto')}<span class="pos">${f(er.total)}</span></h2><div class="muted">${lbl(S.cur)} · ${T('sin reembolsos, transferencias entre tus cuentas ni pagos de tarjeta')}</div>${bars(er.by,'pos')||'<div class="muted">'+T('Sin ingresos registrados.')+'</div>'}</div>
 ${remCard(m)}${cbCard(cbBy([m]),lbl(S.cur))}<div class="card"><h2>${T('Movimientos')}</h2><select style="width:100%" onchange="filt=this.value;render()"><option value="">${T('Todas las categorías')}</option>${cats.map(c=>`<option value="${esc(c)}"${c===filt?' selected':''}>${esc(DN(c))}</option>`).join('')}</select>
 ${mv.map(x=>`<div class="row"><span class="n">${esc(x.desc)||esc(DN(x.cat))}<div class="muted">${fdate(x.date)} · ${esc(DN(x.cat))} · ${methName(x.method)}</div></span><b class="${x.kind==='todebit'||x.kind==='carlos'?'':x.amount>=0?'pos':''}">${x.kind==='todebit'||x.kind==='carlos'?'↔ ':x.amount>=0?'+':'−'}${f(Math.abs(x.amount))}</b>${x.kind==='compra'?'':`<button class="del" onclick="delMove('${x.kind}','${x.id}')">✕</button>`}</div>`).join('')||'<div class="muted">'+T('Nada aquí.')+'</div>'}</div>
 <div class="card"><h2>${T('Acumulado')}</h2><div class="row"><span class="n"><b>${T('Total')}</b></span><span class="pos">+${f(accI)}</span>&nbsp;<span>−${f(acc)}</span></div>${all.reverse().map(([k,t,i])=>`<div class="row"><span class="n">${lbl(k)}<div class="muted">${T('Neto {0}',f(i-t))}</div></span><span class="pos">+${f(i)}</span>&nbsp;<span>−${f(t)}</span></div>`).join('')}</div>${cbCard(cbBy(keys().map(k=>S.months[k])),T('Acumulado'))}`}
function cfg(){return `<div class="card"><h2>${T('Idioma')}</h2><div class="chips"><button id="lang-es" class="chip ${LANG==='es'?'on':''}" onclick="setLang('es')">🇪🇸 Español</button><button id="lang-en" class="chip ${LANG==='en'?'on':''}" onclick="setLang('en')">🇺🇸 English</button></div><div class="muted">${T('Se guarda solo en este dispositivo.')}</div></div><div class="card"><h2>${T('Conceptos de ingreso')}</h2><div class="muted">${T('Uno por línea')}</div><textarea rows="6" style="width:100%;font-size:16px;border-radius:10px;border:1px solid #cbd5e1;padding:8px" onchange="S.incCats=this.value.split('\n').map(s=>DNrev(s.trim())).filter(Boolean);save()">${esc(S.incCats.map(DN).join('\n'))}</textarea></div>
 <div class="card"><h2>${T('Categorías')}</h2><div class="muted">${T('Una por línea (puedes poner emoji)')}</div><textarea id="cats" rows="9" style="width:100%;font-size:16px;border-radius:10px;border:1px solid #cbd5e1;padding:8px" onchange="S.cats=this.value.split('\\n').map(s=>DNrev(s.trim())).filter(Boolean);save()">${esc(S.cats.map(DN).join('\n'))}</textarea></div>
 <div class="card"><h2>${T('Personas')}</h2><input class="name" value="${esc(S.people.join(', '))}" onchange="S.people=this.value.split(',').map(s=>s.trim()).filter(Boolean);save()"></div>
 <div class="card"><h2>${T('Tiendas')}</h2><input class="name" value="${esc(S.stores.join(', '))}" onchange="S.stores=this.value.split(',').map(s=>s.trim()).filter(Boolean);save()"></div>
 ${window.syncCard?window.syncCard():''}
 <div class="card"><h2>${T('Seguridad')}</h2><button id="chpin" class="sec" style="width:100%" onclick="changePin()">🔒 ${T('Cambiar PIN')}</button></div>
 <div class="card"><h2>${T('Respaldo')}</h2><div class="grid"><button onclick="exp()">${T('Exportar JSON')}</button><button class="sec" onclick="document.getElementById('imp').click()">${T('Importar JSON')}</button></div>
 <input type="file" id="imp" accept="application/json,.json" hidden onchange="imp(this.files[0])"></div>
 <div class="card"><h2>${T('Mes')}</h2><button class="del" style="width:100%" onclick="if(confirm('${T('¿Borrar {0}?',lbl(S.cur))}')){delete S.months[S.cur];S.cur=keys().at(-1)||'';save();render()}">${T('Borrar este mes')}</button></div>`}
// ---------- acciones ----------
function toast(t){const d=document.createElement('div');d.textContent=t;d.className='toast';document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
function tgFix(id){const b=M().bills.find(x=>x.id===id);b.fixed=!b.fixed;save();render()}
function addItem(k){M()[k].push({id:uid(),name:'',amount:0,...(k==='bills'?{fixed:false}:{})});save();render()}
function upd(k,id,fld,val){const x=M()[k].find(x=>x.id===id);x[fld]=fld==='amount'?r2(val):fld==='name'?DNrev(val):val;save();render()}
function delItem(k,id){if(k==='income'&&debE(M()).id===id)return alert(T('La línea de débito no se puede borrar (puedes renombrarla)'));M()[k]=M()[k].filter(x=>x.id!==id);save();render()}
const dlg=()=>document.getElementById('dlg');
const qtabs=on=>`<div class="chips" style="margin-bottom:10px"><button id="tabg" class="chip ${on==='g'?'on':''}" onclick="quick()">➖ ${T('Gasto')}</button><button id="tabi" class="chip ${on==='i'?'on':''}" onclick="incDlg()">➕ ${T('Ingreso')}</button></div>`;
function quick(){dlg().innerHTML=qtabs('g')+`<h2>${T('Nuevo gasto')}</h2>
 <input id="qa" class="name" type="number" inputmode="decimal" step="0.01" placeholder="${T('Monto $')}" style="font-size:24px">
 <div class="chips" id="qcats">${S.cats.map((c,i)=>`<button class="chip ${i===0?'on':''}" data-c="${esc(c)}" onclick="document.querySelectorAll('#qcats .chip').forEach(b=>b.classList.remove('on'));this.classList.add('on');document.getElementById('qrec').hidden=!isRem(this.dataset.c)">${esc(DN(c))}</button>`).join('')}</div>
 <div id="qrec" hidden><div class="muted">${T('¿A quién se lo enviaste?')}</div><div class="chips" id="qrecs">${(S.recipients||[]).map(r=>`<button class="chip" data-r="${esc(r)}" onclick="pickRec(this)">${esc(r)}</button>`).join('')}</div>
 <input id="qrn" class="name" placeholder="${T('+ Nuevo destinatario')}" oninput="if(this.value)document.querySelectorAll('#qrecs .chip').forEach(b=>b.classList.remove('on'))"></div>
 <p><input id="qd" class="name" placeholder="${T('Descripción (opcional)')}"></p>
 <div class="grid"><input id="qf" type="date" value="${today()}"><select id="qm">${methOpts('deb')}</select></div>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="qsave" onclick="saveQuick()">${T('Guardar')}</button></div>
 <button class="sec" style="width:100%;margin-top:8px" onclick="dlg().close();editP()">🛒 ${T('Es compra compartida (Tony/Carlos)')}</button>`;if(!dlg().open)dlg().showModal()}
const isCB=c=>/reembolso en efectivo|cash ?back/i.test(c||'');
const isRem=c=>/env[ií]os? a familia|remesa/i.test(c||'');
function pickRec(b){document.querySelectorAll('#qrecs .chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');document.getElementById('qrn').value=''}
function incDlg(){const lines=L().income;dlg().innerHTML=qtabs('i')+`<h2>${T('Registrar ingreso')}</h2>
 <input id="ia" class="name" type="number" inputmode="decimal" step="0.01" placeholder="${T('Monto $')}" style="font-size:24px">
 <div class="chips" id="icats">${S.incCats.map((c,i)=>`<button class="chip ${i===0?'on':''}" data-c="${esc(c)}" onclick="document.querySelectorAll('#icats .chip').forEach(b=>b.classList.remove('on'));this.classList.add('on');document.getElementById('icard').hidden=!isCB(this.dataset.c)">${esc(DN(c))}</button>`).join('')}</div>
 <div id="icard" ${isCB(S.incCats[0])?'':'hidden'}><div class="muted">${T('¿De qué tarjeta?')}</div><div class="chips" id="icards">${(L().cards||[]).filter(c=>c.name).map(c=>`<button class="chip" data-k="${esc(c.name)}" onclick="document.querySelectorAll('#icards .chip').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${esc(DN(c.name))}</button>`).join('')}</div></div>
 <p><input id="id_" class="name" placeholder="${T('Descripción (opcional)')}"></p>
 <div class="grid"><input id="if_" type="date" value="${today()}"><select id="im">${lines.map(x=>{const v=x===debE(L())?'deb':'money:'+x.name;return `<option value="${esc(v)}">→ ${esc(DN(x.name))}</option>`}).join('')}</select></div>
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="isave" onclick="saveInc()">${T('Guardar')}</button></div>`;if(!dlg().open)dlg().showModal()}
function saveInc(){const a=r2(document.getElementById('ia').value);if(!a||a<=0)return alert(T('Pon un monto'));
 const date=document.getElementById('if_').value,method=document.getElementById('im').value,concept=document.querySelector('#icats .chip.on').dataset.c,desc=document.getElementById('id_').value;
 let card;if(isCB(concept)){card=document.querySelector('#icards .chip.on')?.dataset.k;if(!card)return alert(T('Elige la tarjeta'))}
 spend(method,-a);S.months[monthFor(date)].events.push({id:uid(),type:'income',date,amount:a,concept,desc:desc||concept.replace(/^\S+\s/,''),method,...(card?{card}:{})});
 save();dlg().close();render();toast(T('Ingreso guardado'))}
function saveQuick(){const a=r2(document.getElementById('qa').value);if(!a)return alert(T('Pon un monto'));
 const date=document.getElementById('qf').value,method=document.getElementById('qm').value,cat=document.querySelector('#qcats .chip.on').dataset.c;
 let recipient;if(isRem(cat)){recipient=(document.getElementById('qrn').value.trim()||document.querySelector('#qrecs .chip.on')?.dataset.r||'');if(!recipient)return alert(T('Elige o escribe el destinatario'));
  S.recipients=S.recipients||[];if(!S.recipients.includes(recipient))S.recipients.push(recipient)}
 S.months[monthFor(date)].personal.unshift({id:uid(),date,amount:a,cat,desc:document.getElementById('qd').value,method,...(recipient?{recipient}:{})});
 spend(method,a);save();dlg().close();render();toast(T('Gasto guardado'))}
function depDlg(id){const x=M().income.find(y=>y.id===id);if(!x||!(+x.amount>0))return;
 dlg().innerHTML=`<h2>${T('Depositar {0} al débito',esc(DN(x.name)))}</h2><div class="muted">${T('Disponible en {0}: {1}. Cambia el monto para un depósito parcial.',esc(DN(x.name)),f(x.amount))}</div>
 <p><input id="dpa" class="name" type="number" inputmode="decimal" step="0.01" value="${r2(x.amount)}" style="font-size:24px"></p><input id="dpf" class="name" type="date" value="${today()}">
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="dpok" onclick="doDep('${id}')">${T('Depositar')}</button></div>`;dlg().showModal()}
function doDep(id){const x=M().income.find(y=>y.id===id),a=r2(document.getElementById('dpa').value),d=document.getElementById('dpf').value;
 if(!a||a<=0)return alert(T('Pon un monto'));if(a>r2(x.amount)+0.001&&!confirm(T('El monto es mayor que lo disponible. ¿Continuar?')))return;
 x.amount=r2(x.amount-a);const db=debE(L());db.amount=r2((+db.amount||0)+a);
 S.months[monthFor(d)].events.push({id:uid(),type:'todebit',date:d,amount:a,desc:'Transferencia a débito ('+x.name+')',lineId:x.id,lineMonth:S.cur});
 save();dlg().close();render();toast(T('Depósito registrado'))}
function cardPayDlg(id){const c=M().cards.find(x=>x.id===id);if(!c||!(+c.amount>0))return;
 dlg().innerHTML=`<h2>${T('Pagar {0}',esc(DN(c.name)))}</h2><div class="muted">${T('Saldo {0} · se descuenta del débito. Cambia el monto para un pago parcial.',f(c.amount))}</div>
 <p><input id="cpa" class="name" type="number" inputmode="decimal" step="0.01" value="${r2(c.amount)}" style="font-size:24px"></p><input id="cpf" class="name" type="date" value="${today()}">
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="cpok" onclick="doCardPay('${id}')">${T('Confirmar pago')}</button></div>`;dlg().showModal()}
function doCardPay(id){const c=M().cards.find(x=>x.id===id),a=r2(document.getElementById('cpa').value),d=document.getElementById('cpf').value;
 if(!a||a<=0)return alert(T('Pon un monto'));if(a>r2(c.amount)+0.001&&!confirm(T('El monto es mayor que el saldo. ¿Continuar?')))return;
 c.amount=r2(c.amount-a);spend('deb',a);
 S.months[monthFor(d)].events.push({id:uid(),type:'cardpay',date:d,amount:a,desc:'Pago '+c.name,cardId:c.id,cardMonth:S.cur});
 save();dlg().close();render();toast(T('Pago registrado'))}
function payDlg(who,k){const m=S.months[k],c=calc(m),amt=who==='tony'?c.tonyDue:c.carlosDue;
 dlg().innerHTML=`<h2>${who==='tony'?T('Transferir a Tony'):T('Cobrar a Carlos')}</h2><div class="muted">${lbl(k)} · ${who==='tony'?T('se descuenta del débito'):T('se suma al débito')}</div>
 <p><input id="pa" class="name" type="number" inputmode="decimal" step="0.01" value="${r2(amt)}" style="font-size:24px"></p><input id="pf" class="name" type="date" value="${today()}">
 <div class="grid" style="margin-top:12px"><button class="sec" onclick="dlg().close()">${T('Cancelar')}</button><button id="payok" onclick="doPay('${who}','${k}')">${T('Confirmar')}</button></div>`;dlg().showModal()}
function doPay(who,k){const a=r2(document.getElementById('pa').value),d=document.getElementById('pf').value,m=S.months[k];if(!a)return;
 m.events.push({id:uid(),type:who,date:d,amount:a,desc:who==='tony'?'Transferencia a Tony':'Pago de Carlos'});
 if(who==='tony'){m.bills.forEach(b=>{if(+b.amount>0)b.paid=r2(b.amount)});m.tonyPaid=tXfer(m);spend('deb',a)}else{m.carlosPaid=cRecv(m);spend('deb',-a)}
 save();dlg().close();render();toast(who==='tony'?T('Transferencia registrada'):T('Pago registrado'))}
function findMonth(arr,id){return keys().map(k=>S.months[k]).find(m=>m[arr].some(x=>x.id===id))}
function delMove(kind,id){if(!confirm(T('¿Borrar este movimiento? Se revierte el saldo.')))return;
 if(kind==='gasto'){const m=findMonth('personal',id),x=m.personal.find(x=>x.id===id);spend(x.method,-x.amount);m.personal=m.personal.filter(y=>y.id!==id)}
 else{const m=findMonth('events',id),e=m.events.find(x=>x.id===id);
  if(e.type==='tony')spend('deb',-e.amount);
  if(e.type==='carlos')spend('deb',e.amount);
  if(e.type==='todebit'){const db=debE(L());db.amount=r2((+db.amount||0)-e.amount);const lm=S.months[e.lineMonth],ln=lm&&lm.income.find(y=>y.id===e.lineId);if(ln)ln.amount=r2((+ln.amount||0)+e.amount);else if(lm&&lm===L()){const mt=/\((.*)\)$/.exec(e.desc||'');lm.income.push({id:e.lineId,name:mt?mt[1]:'Efectivo',amount:r2(e.amount)})}}
  if(e.type==='income')spend(e.method||'deb',e.amount);
  if(e.type==='cardpay'){spend('deb',-e.amount);const cm=S.months[e.cardMonth],c=cm&&cm.cards.find(c=>c.id===e.cardId);if(c)c.amount=r2(c.amount+e.amount)}
  if(e.type==='check'){spend('deb',e.amount);const c=S.checks.find(c=>c.id===e.checkId);if(c)c.status='pending'}
  m.events=m.events.filter(y=>y.id!==id);
  if(e.type==='tony'){m.tonyPaid=tXfer(m);if(!m.tonyPaid)m.bills.forEach(b=>delete b.paid)}
  if(e.type==='carlos')m.carlosPaid=cRecv(m)}
 save();render()}
let D;
function editP(id){const p=id?M().purchases.find(x=>x.id===id):null;
 D=p?JSON.parse(JSON.stringify(p)):{id:uid(),store:S.stores[0],date:today(),total:0,mode:'fam',who:['Yo','Tony','Carlos'],shares:{},method:'deb'};
 if(!D.who)D.who=Object.keys(D.shares).filter(k=>+D.shares[k]);D.orig=p?{method:p.method||'',total:p.total}:null;D.isNew=!p;drawP();dlg().showModal()}
function recomputeEq(){if(D.mode==='fam'){const t=r2(D.total),tn=r2(t*.5),c=r2(t*.25);D.shares={Tony:tn,Carlos:c,Yo:r2(t-tn-c)};return}
 if(D.mode!=='eq')return;const n=D.who.length||1,each=r2(D.total/n);D.shares={};D.who.forEach(w=>D.shares[w]=each)}
function drawP(){recomputeEq();const ppl=[...new Set([...S.people,...Object.keys(D.shares)])],tot=r2(Object.values(D.shares).reduce((s,v)=>s+(+v||0),0));
 dlg().innerHTML=`<h2>${D.isNew?T('Compra compartida'):T('Editar compra')}</h2>
 <div class="grid"><select onchange="D.store=this.value">${[...new Set([...S.stores,D.store])].map(s=>`<option${s===D.store?' selected':''}>${esc(s)}</option>`).join('')}</select>
 <input type="date" value="${D.date||''}" onchange="D.date=this.value"></div>
 <div class="grid" style="margin-top:8px"><input id="tot" type="number" inputmode="decimal" step="0.01" placeholder="${T('Total $')}" value="${D.total||''}" onchange="D.total=r2(this.value);drawP()">
 <select onchange="D.method=this.value"><option value="">${T('Sin afectar saldo')}</option>${methOpts(D.method)}</select></div>
 <div class="chips"><button id="mfam" class="chip ${D.mode==='fam'?'on':''}" onclick="D.mode='fam';drawP()">${T('Familia 50/25/25')}</button><button id="meq" class="chip ${D.mode==='eq'?'on':''}" onclick="D.mode='eq';drawP()">${T('Iguales')}</button><button class="chip ${D.mode==='manual'?'on':''}" id="mman" onclick="D.mode='manual';drawP()">${T('Manual')}</button></div>
 ${D.mode==='eq'?`<div class="muted">${T('Entre quiénes ({0}):',D.who.length)}</div><div class="chips">${ppl.map(w=>`<button class="chip ${D.who.includes(w)?'on':''}" onclick="tg('${esc(w)}')">${esc(DN(w))}</button>`).join('')}</div>`:''}
 ${ppl.map(w=>`<div class="row"><span class="n">${esc(DN(w))}</span><input type="number" inputmode="decimal" step="0.01" value="${D.shares[w]||''}" placeholder="0" ${D.mode!=='manual'?'disabled':''} onchange="D.shares['${esc(w)}']=r2(this.value);drawP()"></div>`).join('')}
 ${D.mode==='fam'?'<div class="muted">'+T('Tony 50% · Carlos 25% · Yo 25% (el redondeo va a Yo)')+'</div>':''}
 ${D.mode==='manual'&&r2(D.total-tot)>0.009?`<div class="muted">${T('Falta {0} — asignar a:',f(D.total-tot))}</div><div class="chips">${ppl.map(w=>`<button class="chip rem" onclick="D.shares['${esc(w)}']=r2((+D.shares['${esc(w)}']||0)+${r2(D.total-tot)});drawP()">${esc(DN(w))}</button>`).join('')}</div>`:''}
 <div class="muted">${T('Repartido {0} de {1}',f(tot),f(D.total))}${Math.abs(tot-D.total)>0.02?' ⚠️ '+T('no cuadra'):''}</div>
 <div class="grid" style="margin-top:12px">${D.isNew?'<span></span>':`<button class="del" onclick="delP()">${T('Borrar')}</button>`}<button id="psave" onclick="saveP()">${T('Guardar')}</button></div>
 <button class="sec" style="width:100%;margin-top:8px" onclick="dlg().close()">${T('Cancelar')}</button>`}
function tg(w){D.who=D.who.includes(w)?D.who.filter(x=>x!==w):[...D.who,w];drawP()}
function saveP(){const{isNew,orig,...p}=D;if(orig)spend(orig.method,-orig.total);spend(p.method,p.total);
 const m=isNew?S.months[monthFor(p.date)]:M(),i=m.purchases.findIndex(x=>x.id===p.id);i>=0?m.purchases[i]=p:m.purchases.unshift(p);save();dlg().close();render();toast(T('Compra guardada'))}
function delP(){if(D.orig)spend(D.orig.method,-D.orig.total);M().purchases=M().purchases.filter(x=>x.id!==D.id);save();dlg().close();render()}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='finanzas-'+today()+'.json';a.click()}
function imp(file){if(!file)return;file.text().then(t=>{const d=JSON.parse(t);if(!d.months)throw 0;d.updatedAt=Date.now();localStorage.setItem(K,JSON.stringify(d));localStorage.setItem('finanzas-force-push','1');location.reload()}).catch(()=>alert(T('Archivo inválido')))}
document.getElementById('msel').onchange=e=>{S.cur=e.target.value;save();render()};
document.getElementById('newm').onclick=()=>{
 const ks=keys(),last=ks.at(-1);let k;
 if(last){let[y,m]=last.split('-').map(Number);m++;if(m>12){m=1;y++}k=y+'-'+String(m).padStart(2,'0')}else k=today().slice(0,7);
 k=prompt(T('Mes nuevo (AAAA-MM):'),k);if(!k||!/^\d{4}-\d{2}$/.test(k))return;if(S.months[k]){S.cur=k;save();render();return}
 const prev=S.months[last];if(prev){const c=calc(prev),t=c.tonyDue>0.005,cc=c.carlosDue>0.005;
  if((t||cc)&&!confirm(`⚠️ ${t?T('Aún debes {0} a Tony',f(c.tonyDue)):''}${t&&cc?T(' y '):''}${cc?(t?T('Carlos te debe {0}',f(c.carlosDue)):T('Carlos aún te debe {0}',f(c.carlosDue))):''} (${lbl(last)}). ${T('Se pasarán a “Pendientes de meses anteriores” y el mes nuevo empieza limpio. ¿Continuar?')}`))return}
 const cl=a=>a.map(x=>({id:uid(),name:x.name,amount:0}));
 const inc=prev?prev.income.filter(x=>!/^cheque/i.test(x.name)&&!(isTipLine(x)&&Math.abs(+x.amount||0)<0.005)).map(x=>({id:uid(),name:x.name,amount:+x.amount||0,...(debE(prev)===x?{role:'debit'}:{})})):[{id:uid(),name:'Débito',amount:0,role:'debit'},{id:uid(),name:'Efectivo',amount:0}];
 S.months[k]={income:inc,cards:prev?prev.cards.map(x=>({id:uid(),name:x.name,amount:+x.amount||0})):[{id:uid(),name:'BOA',amount:0},{id:uid(),name:'Amazon',amount:0},{id:uid(),name:'Capital One',amount:0}],
  bills:prev?prev.bills.map(x=>({id:uid(),name:x.name,fixed:!!x.fixed,amount:x.fixed?x.amount:0})):[],purchases:[],personal:[],events:[],carlosPaid:0,tonyPaid:0,tonyBase:0,carlosBase:0};
 S.cur=k;save();tab='ini';render()};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;filt='';render();scrollTo(0,0)});
document.getElementById('fab').onclick=quick;
// ---------- PIN ----------
const PK='finanzas-pin',FK='finanzas-pin-fails';
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function hashPin(pin,salt){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+pin)))}
const pinRec=()=>JSON.parse(localStorage.getItem(PK)||'null');
async function setPin(pin){const salt=hex(crypto.getRandomValues(new Uint8Array(16)));localStorage.setItem(PK,JSON.stringify({salt,hash:await hashPin(pin,salt)}))}
async function checkPin(pin){const r=pinRec();return !!r&&await hashPin(pin,r.salt)===r.hash}
const fails=()=>JSON.parse(localStorage.getItem(FK)||'{"n":0,"until":0}');
let LK={mode:'unlock',buf:'',first:'',msg:''},unlocked=false,hiddenAt=0,cdTimer;
const TITLES={create1:'Crea tu PIN (4 a 6 dígitos)',create2:'Repite el PIN',unlock:'Introduce tu PIN',old:'PIN actual',new1:'Nuevo PIN (4 a 6 dígitos)',new2:'Repite el nuevo PIN'};const _TK=[T('Crea tu PIN (4 a 6 dígitos)'),T('Repite el PIN'),T('Introduce tu PIN'),T('PIN actual'),T('Nuevo PIN (4 a 6 dígitos)'),T('Repite el nuevo PIN')];
function lockScreen(mode){LK={mode,buf:'',first:'',msg:''};
 if(mode!=='old'&&mode!=='new1'){unlocked=false;document.body.classList.add('locked');document.getElementById('v').innerHTML='';dlg().open&&dlg().close()}
 let el=document.getElementById('lock');if(!el){el=document.createElement('div');el.id='lock';document.body.appendChild(el)}drawLock()}
function drawLock(){const el=document.getElementById('lock');if(!el)return;const fl=fails(),wait=Math.ceil((fl.until-Date.now())/1000),cd=wait>0;
 const k=d=>`<button class="key" ${cd?'disabled':''} onclick="pinKey('${d}')">${d}</button>`;
 el.innerHTML=`<div class="lk"><div style="font-size:44px">🔒</div><h2 style="justify-content:center">${T(TITLES[LK.mode])}</h2>
 <div class="dots">${[0,1,2,3,4,5].map(i=>`<span class="${i<LK.buf.length?'on':''}${i>=4?' opt':''}"></span>`).join('')}</div>
 <div class="lmsg">${cd?T('Demasiados intentos. Espera {0}s',wait):esc(T(LK.msg))}</div>
 <div class="pad">${[1,2,3,4,5,6,7,8,9].map(k).join('')}<button class="key fn" onclick="pinKey('del')">⌫</button>${k(0)}<button class="key ok" ${cd?'disabled':''} onclick="pinKey('ok')">OK</button></div>
 ${LK.mode==='unlock'?`<button class="lnk" onclick="forgotPin()">${T('Olvidé mi PIN')}</button>`:''}
 ${LK.mode==='old'||LK.mode==='new1'||LK.mode==='new2'?`<button class="lnk" onclick="closeLock()">${T('Cancelar')}</button>`:''}</div>`;
 clearTimeout(cdTimer);if(cd)cdTimer=setTimeout(drawLock,1000)}
function closeLock(){document.getElementById('lock')?.remove();document.body.classList.remove('locked')}
async function pinKey(d){const fl=fails();if(fl.until>Date.now()&&d!=='del')return;
 if(d==='del'){LK.buf=LK.buf.slice(0,-1);return drawLock()}
 if(d!=='ok'){if(LK.buf.length<6)LK.buf+=d;LK.msg='';drawLock();if(LK.buf.length<6)return}
 const pin=LK.buf;LK.buf='';
 if(pin.length<4){LK.msg='El PIN debe tener de 4 a 6 dígitos';return drawLock()}
 if(LK.mode==='create1'||LK.mode==='new1'){LK.first=pin;LK.mode=LK.mode==='create1'?'create2':'new2';return drawLock()}
 if(LK.mode==='create2'||LK.mode==='new2'){if(pin!==LK.first){LK.mode=LK.mode==='create2'?'create1':'new1';LK.msg='No coinciden, inténtalo de nuevo';return drawLock()}
  const was=LK.mode;await setPin(pin);if(was==='new2'){closeLock();toast(T('PIN cambiado'))}else unlock();return}
 if(await checkPin(pin)){localStorage.removeItem(FK);if(LK.mode==='old'){LK.mode='new1';return drawLock()}return unlock()}
 const n=fl.n+1;localStorage.setItem(FK,JSON.stringify(n>=5?{n:0,until:Date.now()+30000}:{n,until:0}));
 LK.msg=n>=5?'':5-n===1?T('PIN incorrecto (1 intento antes de esperar)'):T('PIN incorrecto ({0} intentos antes de esperar)',5-n);drawLock()}
function unlock(){unlocked=true;closeLock();render();window.afterUnlock&&window.afterUnlock();setTimeout(autoDeposit,2500)}
setInterval(()=>{if(unlocked)autoDeposit()},60000);
addEventListener('focus',()=>{if(unlocked)setTimeout(autoDeposit,2500)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&unlocked)setTimeout(autoDeposit,2500)});
function forgotPin(){if(!confirm(T('⚠️ Si reinicias el PIN se BORRARÁN todos los datos de la app en este dispositivo (meses, gastos, compras). ¿Continuar?')))return;
 if(!confirm(T('¿Seguro? Esto no se puede deshacer. Exporta un respaldo antes si puedes.')))return;
 [K,PK,FK].forEach(x=>localStorage.removeItem(x));location.reload()}
function changePin(){let el=document.getElementById('lock');if(!el){el=document.createElement('div');el.id='lock';document.body.appendChild(el)}LK={mode:'old',buf:'',first:'',msg:''};drawLock()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(unlocked&&hiddenAt&&Date.now()-hiddenAt>60000)lockScreen('unlock')});
navLbl();lockScreen(pinRec()?'unlock':'create1');
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
