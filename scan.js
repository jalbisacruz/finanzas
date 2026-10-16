// v62: 📷 Escanear recibo. La foto se reduce en el teléfono (~1600px JPEG), se envía a Gemini (Firebase AI Logic) y se descarta:
// no se guarda en ningún sitio. Se abre la compra compartida ya llena para revisar; nada se guarda solo.
Object.assign(EN,{"📷 Escanear recibo":"📷 Scan receipt","Leyendo el recibo…":"Reading the receipt…","Esto tarda unos segundos. La foto no se guarda.":"This takes a few seconds. The photo is not saved.",
 "Para escanear recibos inicia sesión con Google (☰ › Configuración › Nube).":"To scan receipts, sign in with Google (☰ › Settings › Cloud).",
 "Sin conexión. Conéctate a internet para escanear, o anota la compra a mano.":"No connection. Connect to the internet to scan, or enter the purchase by hand.",
 "No pude leer el recibo. Prueba otra foto con buena luz y el recibo completo, o anótala a mano.":"I couldn't read the receipt. Try another photo with good light and the full receipt, or enter it by hand.",
 "Hay muchas solicitudes ahora mismo. Espera un minuto y vuelve a intentarlo.":"Too many requests right now. Wait a minute and try again.",
 "El escaneo no está disponible ahora mismo. Anota la compra a mano.":"Scanning isn't available right now. Enter the purchase by hand.",
 "No pude abrir la foto. Prueba otra vez.":"I couldn't open the photo. Try again.","Anotar a mano":"Enter by hand","Probar otra foto":"Try another photo",
 "📷 Leído del recibo. Revisa antes de guardar.":"📷 Read from the receipt. Review before saving.","⚠️ Revisa: {0}":"⚠️ Check: {0}",
 "tienda":"store","fecha":"date","total":"total","ítem {0}":"item {0}","Los ítems suman {0}; la diferencia {1} (impuestos, etc.) se reparte 50/25/25.":"Items add up to {0}; the difference {1} (tax, etc.) is split 50/25/25.",
 "Cada ítem empieza compartido entre los tres; toca los nombres para cambiar los dueños.":"Each item starts shared by all three; tap the names to change the owners.",
 "No encontré artículos; revisa el total.":"No items found; check the total.","No parece un recibo. Prueba otra foto o anótala a mano.":"It doesn't look like a receipt. Try another photo or enter it by hand."});
const SCAN_MAX=1600;
function scanPrompt(){const cats=pCats();return `Eres un lector de recibos de compra (tiendas de EE.UU., en inglés o español). Lee la foto y responde SOLO con JSON con esta forma exacta:
{"isReceipt":true,"store":"nombre corto de la tienda","date":"AAAA-MM-DD o null","total":0.00,"items":[{"name":"nombre corto y claro en español","amount":0.00,"category":"una de la lista","confident":true}],"uncertain":["store"|"date"|"total"]}
Reglas: "total" es el total pagado (con impuestos). "amount" es el precio final de la línea (cantidad × precio, menos descuentos de esa línea). No incluyas subtotal, impuestos, total, cambio ni pagos como ítems. Si no se lee algo, ponlo en "uncertain" (y en el ítem "confident":false). Si la foto no es un recibo, "isReceipt":false.
Categorías permitidas (copia el texto exacto, con emoji): ${JSON.stringify(cats)}. Si dudas, usa ${JSON.stringify(SHARED_CAT)}.`}
function scanErr(e){const c=String((e&&(e.code||''))+' '+(e&&e.message||e)).toLowerCase();
 if(c.includes('signin'))return T('Para escanear recibos inicia sesión con Google (☰ › Configuración › Nube).');
 if(!navigator.onLine||/network|failed to fetch|fetch-error/.test(c))return T('Sin conexión. Conéctate a internet para escanear, o anota la compra a mano.');
 if(/429|quota|resource.?exhausted|rate/.test(c))return T('Hay muchas solicitudes ahora mismo. Espera un minuto y vuelve a intentarlo.');
 if(/notreceipt/.test(c))return T('No parece un recibo. Prueba otra foto o anótala a mano.');
 if(/parse|json|empty/.test(c))return T('No pude leer el recibo. Prueba otra foto con buena luz y el recibo completo, o anótala a mano.');
 if(/image/.test(c))return T('No pude abrir la foto. Prueba otra vez.');
 return T('El escaneo no está disponible ahora mismo. Anota la compra a mano.')}
function scanResize(file){return new Promise((ok,ko)=>{const u=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{URL.revokeObjectURL(u);const k=Math.min(1,SCAN_MAX/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');
  c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
  const d=c.toDataURL('image/jpeg',0.8);c.width=c.height=0;ok(d.slice(d.indexOf(',')+1))};
 im.onerror=()=>{URL.revokeObjectURL(u);const e=new Error('image');ko(e)};im.src=u})}
function scanParse(txt){let s=String(txt||'').trim().replace(/^```(?:json)?\s*|\s*```$/g,'');const a=s.indexOf('{'),b=s.lastIndexOf('}');
 if(a<0||b<a)throw new Error('parse');const o=JSON.parse(s.slice(a,b+1));if(o.isReceipt===false)throw new Error('notreceipt');return o}
const scanNum=v=>{const n=typeof v==='number'?v:parseFloat(String(v??'').replace(/[^0-9.\-]/g,''));return isFinite(n)?r2(n):NaN};
function scanCat(c){const L=pCats();if(L.includes(c))return c;const k=s=>String(s||'').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase(),kc=k(c);
 return (kc&&L.find(x=>k(x)===kc||k(x).includes(kc)||kc.includes(k(x))))||SHARED_CAT}
function scanStore(n){n=String(n||'').trim().slice(0,40);if(!n)return null;const k=s=>s.toLowerCase().replace(/[^a-z0-9]/g,''),kn=k(n);
 return S.stores.find(s=>k(s)===kn||(kn.length>2&&(k(s).includes(kn)||kn.includes(k(s))&&k(s).length>2)))||n}
// Convierte la respuesta en el borrador de compra compartida (no guarda nada)
function scanApply(o){editP();const U=new Set((o.uncertain||[]).map(String));const st=scanStore(o.store);if(st)D.store=st;else U.add('store');
 if(/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')&&!isNaN(new Date(o.date)))D.date=o.date;else U.add('date');
 const L=(Array.isArray(o.items)?o.items:[]).map((x,i)=>({a:scanNum(x.amount),n:String(x.name||'').trim().slice(0,40),c:scanCat(x.category),own:['Yo','Tony','Carlos'],bad:x.confident===false||!(scanNum(x.amount)>0)})).filter(x=>x.a>0||x.n);
 let t=scanNum(o.total);const isum=r2(L.reduce((s,x)=>s+(x.a>0?x.a:0),0));if(!(t>0)){t=isum;U.add('total')}
 if(isum>t+0.004)U.add('total');D.total=t;
 const pc=L.length?(()=>{const by={};L.forEach(x=>by[x.c]=(by[x.c]||0)+(x.a||0));return Object.keys(by).sort((a,b)=>by[b]-by[a])[0]})():SHARED_CAT;D.cat=pc;
 D.list=L.map(x=>({a:x.a>0?x.a:'',n:x.n,own:x.own,...(x.c!==pc?{c:x.c}:{})}));D._io=L.length>0;
 D._scan={u:[...U].filter(k=>['store','date','total'].includes(k)),bad:L.map((x,i)=>x.bad?i:-1).filter(i=>i>=0),isum,none:!L.length};
 recomputeEq();drawP();return D}
const _drawPV62=drawP;drawP=function(){_drawPV62();if(!D||!D._scan)return;const s=D._scan,w=[...s.u.map(k=>T({store:'tienda',date:'fecha',total:'total'}[k])),...s.bad.map(i=>T('ítem {0}',i+1))];
 const dif=r2(r2(D.total)-allItems());
 dlg().querySelector('h2').insertAdjacentHTML('afterend',`<div id="scanbox" style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:14px">
  <div style="font-weight:700">${T('📷 Leído del recibo. Revisa antes de guardar.')}</div>${w.length?`<div id="scanwarn" style="color:#b45309;font-weight:700;margin-top:4px">${T('⚠️ Revisa: {0}',w.join(', '))}</div>`:''}
  ${s.none?`<div class="muted">${T('No encontré artículos; revisa el total.')}</div>`:`<div class="muted">${T('Cada ítem empieza compartido entre los tres; toca los nombres para cambiar los dueños.')}</div>`}
  ${dif>0.004&&allItems()>0?`<div class="muted">${T('Los ítems suman {0}; la diferencia {1} (impuestos, etc.) se reparte 50/25/25.',f(allItems()),f(dif))}</div>`:''}</div>`);
 const mark=el=>el&&(el.style.outline='2px solid #f59e0b');const g=dlg().querySelector('.grid');
 if(s.u.includes('store'))mark(g&&g.querySelector('select'));if(s.u.includes('date'))mark(g&&g.querySelector('input[type=date]'));if(s.u.includes('total'))mark(document.getElementById('tot'));
 s.bad.forEach(i=>mark(dlg().querySelector(`.itrow[data-li="${i}"] input[data-k="a"]`)))};
const _savePV62=saveP;saveP=function(){const sc=D&&D._scan;if(D){delete D._scan;delete D._io}_savePV62();if(sc&&D&&dlg().open)D._scan=sc};
function scanBusy(){dlg().innerHTML=`<div style="text-align:center;padding:24px 8px"><div style="font-size:44px">📷</div><h2 style="justify-content:center">${T('Leyendo el recibo…')}</h2><div class="muted" style="font-size:14px">${T('Esto tarda unos segundos. La foto no se guarda.')}</div></div>`;if(!dlg().open)dlg().showModal()}
function scanFail(msg){dlg().innerHTML=`<h2>${T('📷 Escanear recibo')}</h2><div id="scanerr" style="font-size:15px;margin:6px 0 14px">${esc(msg)}</div>
 <div class="grid"><button class="sec" onclick="dlg().close();editP()">${T('Anotar a mano')}</button><button onclick="scanReceipt()">${T('Probar otra foto')}</button></div>`;if(!dlg().open)dlg().showModal()}
async function scanFile(file){if(!file)return;scanBusy();let b64=null;
 try{b64=await scanResize(file);const txt=await window.fbScan(b64,scanPrompt());b64=null;scanApply(scanParse(txt))}
 catch(e){console.warn('scan',e);scanFail(scanErr(e))}finally{b64=null}}
function scanReceipt(){if(!window.fbScan||!(window.fbUser&&fbUser()))return scanFail(T('Para escanear recibos inicia sesión con Google (☰ › Configuración › Nube).'));
 if(!navigator.onLine)return scanFail(scanErr({message:'network'}));
 const i=document.createElement('input');i.type='file';i.accept='image/*';i.setAttribute('capture','environment');i.style.display='none';
 i.onchange=()=>{const f=i.files&&i.files[0];i.remove();scanFile(f)};document.body.appendChild(i);i.click()}
// entradas: diálogo ➕, junto a "+ Nueva compra compartida", y en Hoy
const scanBtn=id=>`<button class="sec" id="${id}" style="width:100%;margin-top:8px" onclick="dlg().open&&dlg().close();scanReceipt()">${T('📷 Escanear recibo')}</button>`;
const _quickV62=quick;quick=function(){_quickV62();const b=[...dlg().querySelectorAll('button')].find(x=>/editP\(\)/.test(x.getAttribute('onclick')||''));if(b&&!document.getElementById('scanq'))b.insertAdjacentHTML('afterend',scanBtn('scanq'))};
const _renderV62=render;render=function(){_renderV62();const v=document.getElementById('v');if(!v)return;
 v.querySelectorAll('button[onclick="editP()"]').forEach((b,k)=>{if(!b.nextElementSibling||!/^scan/.test(b.nextElementSibling.id||''))b.insertAdjacentHTML('afterend',scanBtn('scanc'+k))});
 if(typeof tab!=='undefined'&&tab==='ini'&&!document.getElementById('scanh')){const c=v.querySelector('.card');if(c)c.insertAdjacentHTML('afterend',`<div class="card" style="padding:10px">${scanBtn('scanh').replace('margin-top:8px','margin:0')}</div>`)}};
