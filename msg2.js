// v70: diálogo de Tony/Carlos con dos opciones claras: 📎 Enviar con PDF (texto corto + PDF adjunto) o 💬 Solo texto (resumen corto, una línea por compra).
Object.assign(EN,{"📎 Enviar con PDF":"📎 Send with PDF","💬 Solo texto":"💬 Text only","Hola Tony, te envío las cuentas de {0}.":"Hi Tony, here are the bills for {0}.",
 "Hola Carlos, te envío tus compras de {0}.":"Hi Carlos, here are your purchases for {0}.","El detalle está en el PDF.":"The details are in the PDF.","Te transfiero":"I'll transfer you",
 "Se comparte el PDF junto con este resumen.":"The PDF is shared together with this summary.","Resumen corto, sin PDF.":"Short summary, no PDF.",
 "Este dispositivo no puede compartir archivos: descargué el PDF y copié el texto. Adjunta el PDF en tu correo o chat y pega el texto.":"This device can't share files: I downloaded the PDF and copied the text. Attach the PDF in your email or chat and paste the text.",
 "Compartir con PDF":"Share with PDF","Compartir texto":"Share text"});
const pLineS=x=>`${x.p.date?fdate(x.p.date)+' · ':''}${DN(x.p.store)} — ${f(x.t)}`;
function msgShort(who,k){const L=[];
 if(who==='tony'){const{c,bills,pur}=tonyData(k),pend=bills.filter(b=>billSt2(b)!=='paid'),all=pend.length===bills.length,none=!pend.length;
  L.push(T('Hola Tony, estas son las cuentas de {0}:',lbl(k)),'',T('CUENTAS')+(bills.length&&all?' '+T('(todas pendientes)'):bills.length&&none?' '+T('(todas pagadas ✅)'):''));
  bills.forEach(b=>L.push(mLine(DN(b.name),f(b.amount))+(!all&&!none&&billSt2(b)!=='paid'?' ⏳':'')));L.push(mLine(T('Total cuentas'),f(c.bills)));if(!all&&!none)L.push(T('⏳ = pendiente'));
  if(pur.length){L.push('',T('TU PARTE DE LAS COMPRAS'));pur.forEach(x=>L.push(pLineS(x)));L.push(mLine(T('Total compras'),mNeg(c.tony)))}
  if(c.xfer)L.push('',mLine(T('YA TRANSFERIDO'),mNeg(c.xfer)));L.push('',c.tonyDue>0.005?mLine(T('A TRANSFERIRTE'),f(c.tonyDue)):T('Todo al día ✅'))}
 else{const{c,pur}=carlosData(k);L.push(T('Hola Carlos, estas son tus compras de {0}:',lbl(k)),'',T('COMPRAS'));pur.forEach(x=>L.push(pLineS(x)));L.push(mLine(T('Total compras'),f(c.carlos)));
  if(c.recv)L.push('',mLine(T('YA PAGASTE'),mNeg(c.recv)));L.push('',c.carlosDue>0.005?mLine(T('PENDIENTE'),f(c.carlosDue)):T('Todo al día ✅'))}
 return L.join('\n')}
function msgPdfText(who,k){if(who==='tony'){const{c}=tonyData(k);return [T('Hola Tony, te envío las cuentas de {0}.',lbl(k)),c.tonyDue>0.005?mLine(T('Te transfiero')+':',f(c.tonyDue)):T('Todo al día ✅'),T('El detalle está en el PDF.')].join('\n')}
 const{c}=carlosData(k);return [T('Hola Carlos, te envío tus compras de {0}.',lbl(k)),c.carlosDue>0.005?mLine(T('PENDIENTE')+':',f(c.carlosDue)):T('Todo al día ✅'),T('El detalle está en el PDF.')].join('\n')}
let MSGM='pdf';
shareMsg=function(who,k,mode){MSGM=mode||MSGM;const P=who==='tony'?'Tony':'Carlos',pdf=MSGM==='pdf',t=pdf?msgShort(who,k)+'\n\n'+T('El detalle está en el PDF.'):msgShort(who,k);
 dlg().innerHTML=`<h2>📤 ${T('Mensaje para {0}',P)}</h2>
 <div class="chips" style="margin:0 0 8px"><button class="chip ${pdf?'on':''}" id="mmpdf" onclick="shareMsg('${who}','${k}','pdf')">${T('📎 Enviar con PDF')}</button><button class="chip ${pdf?'':'on'}" id="mmtxt" onclick="shareMsg('${who}','${k}','txt')">${T('💬 Solo texto')}</button></div>
 <div class="muted" style="margin-bottom:6px">${pdf?T('Se comparte el PDF junto con este resumen.'):T('Resumen corto, sin PDF.')}</div>
 <textarea id="msgt" rows="11" style="width:100%;font-family:inherit;font-size:14px;border-radius:10px;border:1px solid #cbd5e1;padding:8px">${esc(t)}</textarea>
 <div id="msgnote" class="muted" style="margin:6px 0;font-size:13px;color:#b45309"></div>
 <div class="muted" style="margin:6px 0">${T('Nada se envía solo: revisas y envías tú.')}</div>
 <div class="grid" style="margin-top:6px"><button id="msgsh" onclick="msgSend('${who}','${k}')">${pdf?T('Compartir con PDF'):T('Compartir texto')}</button><button class="sec" id="msgcp" onclick="copyMsg()">${T('Copiar')}</button></div>
 <button class="sec" id="msgdl" style="width:100%;margin-top:8px" onclick="pdfDl('${who}','${k}')">${T('⬇️ Descargar PDF')}</button>
 <button class="sec" style="width:100%;margin-top:8px" onclick="dlg().close()">${T('Cerrar')}</button>`;if(!dlg().open)dlg().showModal()};
async function msgSend(who,k){const t=document.getElementById('msgt').value.replace(/\r\n?/g,'\n'),P=who==='tony'?'Tony':'Carlos',title=T('Mensaje para {0}',P);
 if(MSGM!=='pdf')return shareOut({text:t,title});
 let file;try{file=await makePDF(who,k)}catch(e){console.error(e);return alert(T('No se pudo generar el PDF'))}
 if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({title,text:t,files:[file]});return 'shared'}catch(e){if(e&&e.name==='AbortError')return 'abort'}}
 dl(file);try{await navigator.clipboard.writeText(t)}catch(e){}const n=document.getElementById('msgnote');if(n)n.textContent=T('Este dispositivo no puede compartir archivos: descargué el PDF y copié el texto. Adjunta el PDF en tu correo o chat y pega el texto.');return 'fallback'}
