// v86: en iPhone/iPad (sobre todo la app de la pantalla de inicio) una descarga abre una vista del archivo y la app se queda ahí.
// Restaurar ya no descarga nada en iOS: la copia de seguridad va a la nube («antes de restaurar») y al teléfono, y se restaura sin salir.
// Exportar y los PDF en iOS usan Compartir (Guardar en Archivos) en vez de descargar. En la computadora todo sigue igual.
Object.assign(EN,{"¿Restaurar el respaldo del {0}? Antes se guarda una copia de tus datos actuales en la nube y en este teléfono.":"Restore the backup from {0}? A copy of your current data is saved first to the cloud and on this phone.",
 "Guardando copia de seguridad…":"Saving a safety copy…","Copia guardada. Restaurando…":"Copy saved. Restoring…","Respaldo restaurado":"Backup restored",
 "No se pudo guardar la copia en la nube. Hay una copia en este teléfono. ¿Restaurar de todos modos?":"Couldn't save the copy to the cloud. There's a copy on this phone. Restore anyway?",
 "No se pudo restaurar":"Couldn't restore","(antes de restaurar)":"(before restore)","Deshacer la última restauración":"Undo the last restore",
 "¿Volver a tus datos de antes de restaurar ({0})?":"Go back to your data from before the restore ({0})?","Listo: volviste a como estaba antes de restaurar":"Done: back to how it was before the restore",
 "Archivo listo":"File ready","Toca para guardarlo o compartirlo (Guardar en Archivos).":"Tap to save or share it (Save to Files).","Compartir / Guardar":"Share / Save","Cerrar":"Close"});
const IOS_DEV=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const IOS_SA=()=>navigator.standalone===true||!!(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
const NO_DL=()=>IOS_DEV;   // v91: SOLO iPhone/iPad (una descarga saca al usuario de la app). Windows/Mac/Android/Linux, navegador o app instalada: descarga normal
const PRE_K='finanzas-pre-restore';
function preRestoreLocal(){try{localStorage.setItem(PRE_K,JSON.stringify({at:Date.now(),state:JSON.stringify(S)}));return true}catch(e){console.warn(e);return false}}
// compartir un archivo sin salir de la app; si iOS no lo permite tras esperar, pide un toque
async function shareFile(file){
 const can=navigator.canShare&&navigator.canShare({files:[file]});
 if(can){try{await navigator.share({files:[file],title:file.name});return 'shared'}catch(e){if(e&&e.name==='AbortError')return 'abort';if(!(e&&e.name==='NotAllowedError'))console.warn(e)}
  return new Promise(ok=>{const box=document.createElement('div');box.id='fileready';box.setAttribute('role','dialog');
   box.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:60;background:#0f172a;color:#fff;border-radius:14px;padding:12px 14px;box-shadow:0 8px 24px #0005';
   box.innerHTML=`<b>${esc(T('Archivo listo'))}</b> · ${esc(file.name)}<div class="muted" style="color:#cbd5e1;margin:4px 0 8px">${esc(T('Toca para guardarlo o compartirlo (Guardar en Archivos).'))}</div><div class="grid"><button id="fileshare">${esc(T('Compartir / Guardar'))}</button><button class="sec" id="fileclose">${esc(T('Cerrar'))}</button></div>`;
   document.getElementById('fileready')?.remove();document.body.append(box);
   box.querySelector('#fileclose').onclick=()=>{box.remove();ok('closed')};
   box.querySelector('#fileshare').onclick=async()=>{try{await navigator.share({files:[file],title:file.name});box.remove();ok('shared')}catch(e){if(e&&e.name==='AbortError'){box.remove();ok('abort')}else{console.warn(e);box.remove();ok('fail')}}}})}
 return null}
// PDF (Descargar PDF) y archivos: en iOS, Compartir; en la computadora, descarga como antes
const _dlV86=dl;dl=function(file){if(NO_DL()){shareFile(file).then(r=>{if(r===null)_dlV86(file)});return}_dlV86(file)};
const _bkDlV86=bkDownload;bkDownload=function(txt,d){if(NO_DL()){const f=new File([txt],bkName(d),{type:'application/json'});shareFile(f).then(r=>{if(r===null)_bkDlV86(txt,d)});return}_bkDlV86(txt,d)};
restoreBk=async function(id){
 if(!NO_DL()){if(!confirm(T('¿Restaurar el respaldo del {0}? Primero se descargará una copia de tus datos actuales.',bkWhen(id))))return;
  preRestoreLocal();exp();try{await window.fbRestore(id);toast(T('Respaldo restaurado'))}catch(e){console.warn(e);alert(T('No se pudo restaurar'))}render();return}
 if(!confirm(T('¿Restaurar el respaldo del {0}? Antes se guarda una copia de tus datos actuales en la nube y en este teléfono.',bkWhen(id))))return;
 toast(T('Guardando copia de seguridad…'));preRestoreLocal();let cloud=false;
 try{if(window.fbSafetyBackup){await window.fbSafetyBackup();cloud=true}}catch(e){console.warn(e)}
 if(!cloud&&!confirm(T('No se pudo guardar la copia en la nube. Hay una copia en este teléfono. ¿Restaurar de todos modos?')))return;
 toast(T('Copia guardada. Restaurando…'));
 try{await window.fbRestore(id);toast(T('Respaldo restaurado'))}catch(e){console.warn(e);alert(T('No se pudo restaurar'))}
 render()};
function preRestoreInfo(){try{const o=JSON.parse(localStorage.getItem(PRE_K)||'null');return o&&o.state?o:null}catch(e){return null}}
function undoRestore(){const o=preRestoreInfo();if(!o)return;const when=new Date(o.at).toLocaleString(LOC(),{dateStyle:'medium',timeStyle:'short'});
 if(!confirm(T('¿Volver a tus datos de antes de restaurar ({0})?',when)))return;
 const st=JSON.parse(o.state);setState(st);save();localStorage.removeItem(PRE_K);render();toast(T('Listo: volviste a como estaba antes de restaurar'))}
// lista de respaldos: marca las copias «antes de restaurar» y ofrece deshacer
const _loadBkV86=loadBk;loadBk=async function(){await _loadBkV86();const el=document.getElementById('bklist');if(!el)return;
 el.querySelectorAll('button[onclick^="restoreBk("]').forEach(b=>{const id=(b.getAttribute('onclick').match(/restoreBk\('([^']+)'\)/)||[])[1]||'';if(/antes-de-restaurar/.test(id)){const n=b.parentElement.querySelector('.n');if(n&&!n.querySelector('.prer'))n.insertAdjacentHTML('beforeend',` <span class="muted prer">${esc(T('(antes de restaurar)'))}</span>`)}});
 if(preRestoreInfo()&&!document.getElementById('undorestore'))el.insertAdjacentHTML('beforeend',`<button class="sec" id="undorestore" style="width:100%;margin-top:6px" onclick="undoRestore()">↩️ ${esc(T('Deshacer la última restauración'))}</button>`)};
