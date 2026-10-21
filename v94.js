// v94: Resumen = 3 resúmenes: «📄 Mi resumen», «📄 Tony», «📄 Carlos». Cada botón genera su PDF y lo ABRE directo:
// computadora (Chrome/Edge): pestaña nueva (se abre dentro del clic y luego recibe el PDF); si el navegador la bloquea, visor de la app.
// iPhone/iPad: visor dentro de la app (v91), que ya trae Compartir / Guardar. Sin botones aparte de ver/descargar. Operaciones no cambia.
Object.assign(EN,{"📄 Mi resumen":"📄 My summary","📄 Tony":"📄 Tony","📄 Carlos":"📄 Carlos"});
function pdfViewer(file){if(window.pdfView)pdfView(file,{lang:LANG,labels:{close:'✕ '+T('Cerrar'),share:'⬆️ '+T('Compartir / Guardar')}});else dl(file)}
window.pdfAbrir=function(kind,k){kind=kind||'mes';k=k||S.cur;const err=e=>{console.error(e);alert(T('No se pudo generar el PDF'))};
 if(NO_DL()){toast(T('Generando PDF…'));makePDF(kind,k).then(pdfViewer,err);return}
 let w=null;try{w=window.open('','_blank')}catch(e){}
 if(w)try{w.document.title=T('Generando PDF…');w.document.body.textContent=T('Generando PDF…')}catch(e){}
 makePDF(kind,k).then(file=>{if(w&&!w.closed){const u=URL.createObjectURL(new Blob([file],{type:'application/pdf'}));w.location.href=u;setTimeout(()=>URL.revokeObjectURL(u),300000)}else pdfViewer(file)},e=>{try{w&&w.close()}catch(_){}err(e)})};
{const _r=rep;rep=function(){const b=(id,t,js)=>`<button class="sec rlink" id="${id}" onclick="${js}">${T(t)}</button>`;
 return _r().replace(/<div class="rlinks">[\s\S]*?<\/div><\/div>/,`<div class="rlinks">${b('pdfbtn','📄 Mi resumen',"pdfAbrir('mes')")}${b('pdft','📄 Tony',"pdfAbrir('tony')")}${b('pdfc','📄 Carlos',"pdfAbrir('carlos')")}</div></div>`)}}
document.head.insertAdjacentHTML('beforeend','<style>#rescard .rlinks{grid-template-columns:repeat(3,1fr)!important}</style>');
