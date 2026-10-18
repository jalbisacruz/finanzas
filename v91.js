// v91: Compartir SOLO en iPhone/iPad (v86.js: NO_DL = iOS). En Windows/Mac/Android/Linux (navegador o app instalada) todo descarga.
// En iPhone/iPad los PDF abren el visor dentro de la app (pdfview.js) con «✕ Cerrar» y «⬆️ Compartir / Guardar». Exportar JSON sigue con Compartir.
Object.assign(EN,{"Compartir / Guardar":"Share / Save"});
{const _dlV91=dl;dl=function(file){if(NO_DL()&&window.pdfView&&file&&(/\.pdf$/i.test(file.name||'')||file.type==='application/pdf')){pdfView(file,{lang:LANG,labels:{close:'✕ '+T('Cerrar'),share:'⬆️ '+T('Compartir / Guardar')}});return}_dlV91(file)}}
