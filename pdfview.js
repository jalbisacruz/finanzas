// v91: visor de PDF dentro de la app (iPhone/iPad). Nunca navega fuera: overlay a pantalla completa con «✕ Cerrar» y «⬆️ Compartir / Guardar».
// Dibuja las páginas con pdf.js (vendor/pdfjs, Apache-2.0); si pdf.js no carga, usa un <iframe> con el blob.
(function(){
 const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 window.PV_IOS=IOS;
 const L0={es:{close:'✕ Cerrar',share:'⬆️ Compartir / Guardar',load:'Cargando PDF…',err:'No se pudo mostrar el PDF.',noshare:'Este dispositivo no puede compartir el archivo.'},
  en:{close:'✕ Close',share:'⬆️ Share / Save',load:'Loading PDF…',err:"Couldn't show the PDF.",noshare:"This device can't share the file."}};
 let lib=null;
 function loadLib(){if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);if(lib)return lib;
  lib=new Promise((ok,ko)=>{const s=document.createElement('script');s.src='vendor/pdfjs/pdf.min.js';s.onload=()=>{try{pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdfjs/pdf.worker.min.js';ok(pdfjsLib)}catch(e){ko(e)}};s.onerror=()=>{lib=null;ko(new Error('pdfjs'))};document.head.appendChild(s)});return lib}
 function css(){if(document.getElementById('pvcss'))return;const st=document.createElement('style');st.id='pvcss';st.textContent=`
#pdfview{position:fixed;inset:0;z-index:2147483000;background:#334155;display:flex;flex-direction:column;-webkit-text-size-adjust:100%}
#pdfview .pvbar{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:calc(8px + env(safe-area-inset-top)) 10px 8px;background:#0f172a;color:#fff;box-shadow:0 2px 8px #0006}
#pdfview .pvbar button{font:600 16px -apple-system,system-ui,sans-serif;border:0;border-radius:12px;min-height:44px;padding:0 14px;cursor:pointer}
#pdfview #pvclose{background:#fff;color:#0f172a}#pdfview #pvshare{background:#2563eb;color:#fff}
#pdfview .pvname{flex:1;min-width:0;font:13px -apple-system,system-ui,sans-serif;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}
#pdfview .pvbody{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:10px 8px calc(16px + env(safe-area-inset-bottom));text-align:center}
#pdfview canvas{display:block;margin:0 auto 10px;background:#fff;box-shadow:0 2px 10px #0005;max-width:100%;height:auto}
#pdfview iframe{width:100%;height:100%;border:0;background:#fff}
#pdfview .pvmsg{color:#e2e8f0;font:15px -apple-system,system-ui,sans-serif;margin-top:30px}`;document.head.appendChild(st)}
 window.pdfViewClose=function(){const o=document.getElementById('pdfview');if(!o)return;if(o._url)URL.revokeObjectURL(o._url);o.remove();document.documentElement.style.overflow=o._ov||'';document.removeEventListener('keydown',window.__pvKey)};
 window.pdfView=async function(file,opt){opt=opt||{};const lang=opt.lang||(document.documentElement.lang||'es').slice(0,2);const L=Object.assign({},L0[lang]||L0.es,opt.labels||{});
  if(!(file instanceof Blob))throw new Error('no file');const name=file.name||opt.name||'documento.pdf';const f=file instanceof File?file:new File([file],name,{type:'application/pdf'});
  pdfViewClose();css();const o=document.createElement('div');o.id='pdfview';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',name);
  o.innerHTML=`<div class="pvbar"><button id="pvclose" type="button"></button><span class="pvname"></span><button id="pvshare" type="button"></button></div><div class="pvbody" id="pvbody"><div class="pvmsg" id="pvmsg"></div></div>`;
  o.querySelector('#pvclose').textContent=L.close;o.querySelector('#pvshare').textContent=L.share;o.querySelector('.pvname').textContent=name;o.querySelector('#pvmsg').textContent=L.load;
  o._ov=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';document.body.appendChild(o);
  o.querySelector('#pvclose').onclick=()=>pdfViewClose();
  window.__pvKey=e=>{if(e.key==='Escape')pdfViewClose()};document.addEventListener('keydown',window.__pvKey);
  o.querySelector('#pvshare').onclick=async()=>{try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return}
    if(navigator.share){await navigator.share({title:name});return}}catch(e){if(e&&e.name==='AbortError')return;console.warn(e)}
   const m=document.getElementById('pvmsg');if(m)m.textContent=L.noshare;else alert(L.noshare)};
  const body=o.querySelector('#pvbody');
  try{const pj=await loadLib();const buf=await f.arrayBuffer();const doc=await pj.getDocument({data:new Uint8Array(buf),isEvalSupported:false}).promise;
   if(!document.body.contains(o))return 'closed';body.innerHTML='';const W=Math.max(200,Math.min(body.clientWidth-16,900)),dpr=Math.min(window.devicePixelRatio||1,2);
   for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i),v0=pg.getViewport({scale:1}),sc=W/v0.width,vp=pg.getViewport({scale:sc*dpr});
    const c=document.createElement('canvas');c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);c.style.width=Math.floor(v0.width*sc)+'px';c.dataset.page=i;body.appendChild(c);
    await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;if(!document.body.contains(o))return 'closed'}
   o.dataset.pages=doc.numPages;o.dataset.ok='1';return 'shown'}
  catch(e){console.warn('pdfview',e);if(!document.body.contains(o))return 'closed';
   try{const u=URL.createObjectURL(f);o._url=u;body.innerHTML='';body.style.padding='0';const fr=document.createElement('iframe');fr.title=name;fr.src=u;body.appendChild(fr);o.dataset.ok='iframe';return 'iframe'}
   catch(e2){body.innerHTML=`<div class="pvmsg"></div>`;body.firstChild.textContent=L.err;return 'error'}}};
})();
