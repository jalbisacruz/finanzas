// v106 (Joe): sincronización segura. Causa del problema: al abrir la app en un dispositivo con datos viejos (laptop), algo se guardaba
// ANTES de que llegaran los datos de la nube (p. ej. el depósito automático del cheque del jueves). save() ponía la hora actual, así que
// los datos viejos parecían «más nuevos», la app ignoraba la nube y luego la sobrescribía. Ahora (sync.js): se compara con la última
// versión de la nube que este dispositivo conoció (base) y si hay cambios locales sin subir (dirty); si ambos cambiaron se pregunta
// (por defecto la nube) y se guarda copia de la otra versión. Aquí: marcar cambios locales y no auto-depositar hasta tener la nube.
Object.assign(EN,{"Datos distintos en la nube":"Different data in the cloud",
 "La nube tiene cambios de otro dispositivo y este dispositivo tiene datos distintos. ¿Cuáles quieres usar?":"The cloud has changes from another device and this device has different data. Which do you want to use?",
 "Nube: guardado {0}":"Cloud: saved {0}","Este dispositivo: guardado {0}":"This device: saved {0}","Usar la nube (recomendado)":"Use the cloud (recommended)",
 "Usar este dispositivo (reemplaza la nube)":"Use this device (replaces the cloud)","Se guarda una copia de la otra versión en Configuración › Respaldo.":"A copy of the other version is kept in Settings › Backup.",
 "¿Seguro? Los datos de la nube se reemplazan por los de este dispositivo (queda una copia en Respaldo).":"Sure? The cloud data will be replaced by this device's (a copy is kept in Backup)."});
{const _s=save;save=function(){const r=_s.apply(this,arguments);if(!window.__syncApplying)try{localStorage.setItem('finanzas-sync-dirty','1')}catch(e){}return r}}
// depósito automático de cheques: espera a que la nube esté cargada (si este dispositivo usa la nube)
{const _a=autoDeposit;autoDeposit=function(){if(window.FB_CONFIG&&localStorage.getItem('finanzas-sync-uid')&&!window.__syncReady){clearTimeout(window.__adT);window.__adT=setTimeout(()=>autoDeposit(),3000);return}return _a.apply(this,arguments)}}
