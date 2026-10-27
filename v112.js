// v112 (Joe): la laptop con datos viejos borraba lo nuevo del móvil. Causas: (1) restaurar un respaldo .json ponía la hora ACTUAL y
// subía a la nube sin comparar (un archivo viejo pisaba todo); (2) guardados automáticos al abrir, antes de llegar la nube, marcaban los
// datos viejos como «recién guardados». Ahora: lo que se guarda antes de cargar la nube no cambia la fecha ni cuenta como cambio
// local, y sync.js nunca sube datos más viejos que la nube sin una elección explícita con aviso.
Object.assign(EN,{"Los datos de este dispositivo son MÁS VIEJOS que los de la nube.":"This device's data is OLDER than the cloud's.",
 "⚠️ CUIDADO: los datos de este dispositivo son MÁS VIEJOS que los de la nube. Si sigues, se BORRAN de la nube los cambios más nuevos (por ejemplo, lo que guardaste en el móvil). Queda una copia en Respaldo. ¿Reemplazar la nube con los datos viejos?":"⚠️ CAREFUL: this device's data is OLDER than the cloud's. If you continue, the newer changes (e.g. what you saved on your phone) are ERASED from the cloud. A copy is kept in Backup. Replace the cloud with the old data?"});
{const _s=save;save=function(){
  const pre=window.FB_CONFIG&&localStorage.getItem('finanzas-sync-uid')&&!window.__syncReady&&!window.__syncApplying;
  if(!pre)return _s.apply(this,arguments);
  const u=S.updatedAt,dirty=localStorage.getItem('finanzas-sync-dirty');const r=_s.apply(this,arguments);
  S.updatedAt=u;localStorage.setItem(K,JSON.stringify(S));if(dirty==null)localStorage.removeItem('finanzas-sync-dirty');return r}}
