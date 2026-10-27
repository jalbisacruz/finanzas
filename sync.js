// Sincronización en la nube con Firebase (Auth Google + Firestore). Doc: users/{uid}/data/state
const V='11.10.0',B=`https://www.gstatic.com/firebasejs/${V}/`;
const cfg=window.FB_CONFIG&&{...window.FB_CONFIG};
if(cfg&&/\.web\.app$/.test(location.hostname))cfg.authDomain=location.hostname;
// En Firebase Hosting usamos el mismo dominio para el login (más fiable en iPhone/PWA)
// v106: CLIENT_V 3 = sincronización segura (base + cambios pendientes). Al escribir ver:3 en la nube, una copia vieja de la app
// (caché de otro dispositivo, CLIENT_V 2) se bloquea y ya no puede sobrescribir la nube.
const CLIENT_V=3;let blocked=false,allowOlder=false;let ready=false,conflictOpen=false,needStamp=false;
const BASE_K='finanzas-sync-base',DIRTY_K='finanzas-sync-dirty';
const getBase=()=>{const v=localStorage.getItem(BASE_K);return v==null||v===''?null:+v},setBase=v=>localStorage.setItem(BASE_K,String(+v||0)),isDirty=()=>localStorage.getItem(DIRTY_K)==='1',clearDirty=()=>localStorage.removeItem(DIRTY_K);
const setReady=v=>{ready=v;window.__syncReady=v};window.__syncReady=false;
let status='off',user=null,pushT=null,applying=false,unsub=null,fs=null,api=null,lastRemote=0;
const LB={off:'',out:'☁️ Sin sesión',pend:'⏳ Sincronización pendiente',ok:'☁️ Sincronizado',offline:'📴 Sin conexión (se sincroniza al volver)',err:'⚠️ Error de sincronización'};
const LBL=new Proxy(LB,{get:(o,k)=>o[k]?T(o[k]):''});
window.syncStatus=()=>cfg?LBL[status]:'';
const setS=s=>{status=s;const el=document.getElementById('syncst');if(el)el.textContent=LBL[s]};
window.syncCard=()=>!cfg?'':`<div class="card"><h2>${T('Nube')}</h2>${user?`<div class="muted">${T('Conectado como {0}',user.email)}</div><div class="muted" style="margin:6px 0">${LBL[status]}</div>
 <div class="grid"><button class="sec" onclick="fbSyncNow()">${T('Sincronizar ahora')}</button><button class="del" onclick="fbSignOut()">${T('Cerrar sesión')}</button></div>`:
 `<div class="muted">${T('Guarda tus datos en tu cuenta de Google y úsalos en varios dispositivos. El PIN sigue siendo de cada dispositivo.')}</div><button id="gsign" style="width:100%;margin-top:8px" onclick="fbSignIn()">${T('Iniciar sesión con Google')}</button>`}</div>`;
if(cfg){
 const [{initializeApp},A,F]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
 api={A,F};const app=initializeApp(cfg);const auth=A.getAuth(app);
 // v62: App Check (reCAPTCHA Enterprise, sin enforce todavía) + escaneo de recibos con Gemini (Firebase AI Logic, Gemini Developer API)
 const RECAPTCHA_KEY='6LczjvEtAAAAAEaAHmwLEj2DUiWYY--kne8BH3ei';
 try{const AC=await import(B+'firebase-app-check.js');AC.initializeAppCheck(app,{provider:new AC.ReCaptchaEnterpriseProvider(RECAPTCHA_KEY),isTokenAutoRefreshEnabled:true})}catch(e){console.warn('appcheck',e)}
 let AI=null,aiP=null;const MODELS=['gemini-3.5-flash','gemini-3.8-flash'];
 const loadAI=()=>aiP=aiP||import(B+'firebase-ai.js').then(m=>AI=m).catch(e=>{aiP=null;throw e});
 window.fbScanWarm=()=>loadAI().catch(e=>console.warn('ai warm',e));
 const transient=e=>!/\[?4\d\d\b/.test(String(e&&e.message))&&/fetch|network|load failed|dynamically imported|timeout|503|500|unavailable|app.?check/i.test(String((e&&e.code)||'')+' '+String(e&&e.message));
 window.fbScan=async(b64,prompt,mime='image/jpeg')=>{if(!user){const e=new Error('signin');e.code='signin';throw e}
  let last;for(let t=0;t<3;t++){if(t)await new Promise(r=>setTimeout(r,800*t));
   try{await loadAI();const ai=AI.getAI(app,{backend:new AI.GoogleAIBackend()});
    for(const name of MODELS){try{const m=AI.getGenerativeModel(ai,{model:name,generationConfig:{responseMimeType:'application/json',temperature:0}});
      const r=await m.generateContent([prompt,{inlineData:{mimeType:mime,data:b64}}]);return r.response.text()}
     catch(e){last=e;if(!/404|not found|not supported/i.test(String(e&&e.message)))throw e}}
    throw last}
   catch(e){last=e;console.warn('scan attempt',t+1,e&&e.code,e&&e.message,e);if(!transient(e)||!navigator.onLine)break}}
  throw last};
 await A.setPersistence(auth,A.browserLocalPersistence).catch(()=>{});
 fs=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})});
 const ref=()=>F.doc(fs,'users',user.uid,'data','state');
 const standalone=()=>navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;
 window.fbSignIn=async()=>{const pr=new A.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
  try{ await A.signInWithPopup(auth,pr)}
  catch(e){ if(/popup|cancelled|operation-not-supported/i.test(e.code||'')) return A.signInWithRedirect(auth,pr); alert(T('No se pudo iniciar sesión: {0}',e.code||e.message))}};
 window.fbSignOut=async()=>{if(!confirm(T('¿Cerrar sesión? Los datos se quedan en este dispositivo.')))return;await A.signOut(auth)};
 A.getRedirectResult(auth).catch(e=>{console.warn('redirect',e.code);if(e.code)alert(T('Error al iniciar sesión: {0}',e.code))});
 const tooNew=d=>{let v=+d.ver||0;try{v=Math.max(v,+JSON.parse(d.state).version||0)}catch(e){}return v>CLIENT_V};
 function block(){if(blocked)return;blocked=true;setS('err');setTimeout(()=>alert(T('Hay una versión más nueva de la app en otro dispositivo. Cierra y vuelve a abrir la app para actualizar; no se guardará nada hasta entonces.')),100)}
 async function push(){if(!user||blocked)return;clearTimeout(pushT);try{await migBackup()}catch(e){console.warn('migBackup',e);setS('err');return}const S=getState();
  if(!ready||conflictOpen){setS('pend');return}
  try{const cur=await F.getDoc(ref()).catch(()=>null);if(!cur||(cur.metadata&&cur.metadata.fromCache)){setS(navigator.onLine?'err':'offline');clearTimeout(pushT);pushT=setTimeout(push,30000);return}
   if(cur.exists()&&tooNew(cur.data()))return block();
   // v106: si la nube cambió desde la última vez que este dispositivo sincronizó, NO se sobrescribe: se reconcilia (nube por defecto)
   // v112: además, NUNCA se sube una versión local más vieja que la de la nube (salvo elección explícita «usar este dispositivo»)
   if(cur.exists()){const cu=+cur.data().updatedAt||0,b=getBase(),lu=+S.updatedAt||0;if(cu>lu&&!allowOlder)return reconcile(cur.data());if(cu!==lu&&(b==null||cu!==b)&&!allowOlder)return reconcile(cur.data())}
   allowOlder=false;
   if(cur&&cur.exists()&&(+S.version||1)>=2&&!(+cur.data().ver>=2)&&localStorage.getItem('finanzas-cloud-v1-saved')!==user.uid){await bkId(cur.data().state);localStorage.setItem('finanzas-cloud-v1-saved',user.uid)}
   const u=S.updatedAt||Date.now();await F.setDoc(ref(),{state:JSON.stringify(S),updatedAt:u,ver:CLIENT_V,device:navigator.userAgent.slice(0,80)});setBase(u);clearDirty();setS(navigator.onLine?'ok':'offline');window.linksSync&&linksSync()}
  catch(e){console.warn(e);setS('err')}}
 // Respaldos: users/{uid}/backups/{YYYY-MM-DD_HH-MM-SS} (hora local; los antiguos YYYY-MM-DD siguen válidos), se conservan los 20 últimos
 const bcol=()=>F.collection(fs,'users',user.uid,'backups');
 const bkStamp=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.toLocaleDateString('en-CA')+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds())+'_antes-de-v2'};
 async function bkId(st){let id=bkStamp();if((await F.getDoc(F.doc(bcol(),id))).exists())id+='-2';await F.setDoc(F.doc(bcol(),id),{state:st,createdAt:Date.now(),label:'antes-de-v2'})}
 async function migBackup(){if(!user)return;let L;try{L=JSON.parse(localStorage.getItem('finanzas-mig-pending')||'[]')}catch(e){L=[]}
  for(const st of L){await bkId(st);await new Promise(r=>setTimeout(r,1100))}
  if(L.length)localStorage.removeItem('finanzas-mig-pending')}
 async function listB(){const q=await F.getDocs(bcol());const r=q.docs.map(d=>({id:d.id,createdAt:d.data().createdAt||0})).sort((a,b)=>(b.createdAt-a.createdAt)||(a.id<b.id?1:-1));if(r.length)abSet({last:Math.max(abGet().last||0,r[0].createdAt||0)});return r}
 // v89: estado del respaldo automático en este dispositivo (último respaldo conocido, intentos fallidos)
 const AB_K='finanzas-autobk',abGet=()=>{try{return JSON.parse(localStorage.getItem(AB_K)||'{}')||{}}catch(e){return {}}},abSet=o=>{try{localStorage.setItem(AB_K,JSON.stringify({...abGet(),...o}))}catch(e){}};
 const bkTs=d=>{const p=n=>String(n).padStart(2,'0');return d.toLocaleDateString('en-CA')+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds())};
 async function writeB(){const S=getState();if(!S||!S.months)return;const d=new Date(),p=n=>String(n).padStart(2,'0'),id=d.toLocaleDateString('en-CA')+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds());
  await F.setDoc(F.doc(bcol(),id),{state:JSON.stringify(S),createdAt:Date.now(),updatedAt:S.updatedAt||0});abSet({last:Date.now(),fails:0});
  // v89: la poda de los manuales (20) nunca toca los automáticos ni los «antes de …»
  const all=await listB();for(const b of all.filter(b=>!/antes-de-|_auto$/.test(b.id)).slice(20))await F.deleteDoc(F.doc(bcol(),b.id))}
 // v89: respaldo automático al abrir la app (no hay servidor). Semanal (7 días) o diario, según Configuración › Respaldo.
 // Cuenta cualquier respaldo en la nube (manual o automático). Si falla (sin conexión), se reintenta la próxima vez, sin avisos.
 async function autoBackup(){if(!user)return 'nouser';const st=getState()||{},cfg={on:true,freq:'w',...(st.autoBk||{})};if(!cfg.on)return 'off';
  const fail=()=>{abSet({fails:(abGet().fails||0)+1,lastTry:Date.now()});return 'fail'};
  if(!navigator.onLine)return fail();
  try{const l=await F.getDocs(F.query(bcol(),F.orderBy('createdAt','desc'),F.limit(1)));const last=Math.max(0,...l.docs.map(d=>+d.data().createdAt||0));
   const now=new Date(),due=!last||(cfg.freq==='d'?new Date(last).toLocaleDateString('en-CA')<now.toLocaleDateString('en-CA'):Date.now()-last>=7*864e5);
   if(!due){abSet({last:Math.max(abGet().last||0,last),fails:0,lastTry:Date.now()});return 'fresh'}
   if(!st.months)return 'empty';const id=bkTs(now)+'_auto';
   await F.setDoc(F.doc(bcol(),id),{state:JSON.stringify(st),createdAt:Date.now(),updatedAt:st.updatedAt||0,auto:true,label:'Automático · '+now.toLocaleString('es-US')});
   abSet({last:Date.now(),lastAuto:Date.now(),fails:0,lastTry:Date.now()});
   try{const all=await listB();for(const b of all.filter(b=>/_auto$/.test(b.id)).slice(8))await F.deleteDoc(F.doc(bcol(),b.id))}catch(e){console.warn('prune',e)}
   window.toast&&toast(window.T?T('Respaldo automático guardado ☁️'):'Respaldo automático guardado ☁️');if(window.bkRefresh)bkRefresh();return 'saved'}
  catch(e){console.warn('backup',e);return fail()}}
 window.fbAutoBackup=autoBackup;
 window.fbUser=()=>!!user;
 window.fbShareSet=(t,d)=>F.setDoc(F.doc(fs,'shares',t),{...d,owner:user.uid});
 window.fbShareDel=t=>F.deleteDoc(F.doc(fs,'shares',t));
 window.fbInbox=async t=>(await F.getDocs(F.collection(fs,'shares',t,'inbox'))).docs.map(d=>({t,id:d.id,...d.data()}));
 window.fbInboxDel=(t,id)=>F.deleteDoc(F.doc(fs,'shares',t,'inbox',id));window.fbName=()=>(user&&user.displayName)||'';
 window.fbBackups=async()=>user?listB():[];
 window.fbBackupNow=async()=>{if(user)await writeB()};
 // v86: copia antes de restaurar (en la nube, sin descargar nada; en iPhone una descarga saca de la app)
 window.fbSafetyBackup=async()=>{if(!user)throw new Error('no user');const S=getState();const d=new Date(),p=n=>String(n).padStart(2,'0'),id=d.toLocaleDateString('en-CA')+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds())+'_antes-de-restaurar';
  await F.setDoc(F.doc(bcol(),id),{state:JSON.stringify(S),createdAt:Date.now(),updatedAt:S.updatedAt||0,label:'Antes de restaurar · '+d.toLocaleString('es-US')});return id};
 window.fbRestore=async id=>{const sn=await F.getDoc(F.doc(bcol(),id));if(!sn.exists())throw new Error('missing');const st=JSON.parse(sn.data().state);st.updatedAt=Date.now();
  applying=true;window.__syncApplying=true;try{setState(st)}finally{applying=false;window.__syncApplying=false}localStorage.setItem(DIRTY_K,'1');await push()};
 window.onLocalSave=()=>{if(!user||applying)return;setS('pend');if(!ready)return;clearTimeout(pushT);pushT=setTimeout(push,1500)};
 window.fbSyncNow=async()=>{await pull(true);await push();rerender()};
 // v106: reconciliación. base = updatedAt de la nube con el que este dispositivo quedó igual la última vez; dirty = hay cambios locales sin subir.
 function useCloud(d){applying=true;window.__syncApplying=true;try{setState(JSON.parse(d.state))}finally{applying=false;window.__syncApplying=false}setBase(+d.updatedAt||0);clearDirty();rerender();if((+d.ver||0)<CLIENT_V){if(ready)push();else needStamp=true}}
 async function keepCopy(st,label){try{if(!user||!st)return;const d=new Date(),p=n=>String(n).padStart(2,'0'),id=d.toLocaleDateString('en-CA')+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds())+'_antes-de-'+label;
  await F.setDoc(F.doc(bcol(),id),{state:typeof st==='string'?st:JSON.stringify(st),createdAt:Date.now(),updatedAt:(typeof st==='string'?JSON.parse(st):st).updatedAt||0,label:(label==='nube'?'Antes de usar la nube':'Antes de usar este dispositivo')+' · '+d.toLocaleString('es-US')})}catch(e){console.warn('keepCopy',e)}}
 function reconcile(d){if(!d)return;if(tooNew(d))return block();if(conflictOpen)return;
  const S=getState(),cu=+d.updatedAt||0,lu=+S.updatedAt||0,b=getBase(),dirty=isDirty();
  if(cu===lu){setBase(cu);clearDirty();if((+d.ver||0)<CLIENT_V){if(ready)push();else needStamp=true}return}
  const changed=b==null||cu!==b;
  // v112: la versión más nueva gana. Nube más nueva y sin cambios locales -> nube. Local más nuevo y la nube no cambió -> subir.
  // Cualquier otro caso (ambos cambiaron, o la nube cambió pero es MÁS VIEJA) -> preguntar, por defecto la nube; nunca en silencio.
  if(cu>lu){if(!dirty||!changed)return useCloud(d);return conflictDlg(d)}
  if(!changed){push();return}
  return conflictDlg(d)}
 function conflictDlg(d){conflictOpen=true;const S=getState(),fmt=x=>x?new Date(x).toLocaleString(LOC()):'—',D=document.createElement('dialog');D.id='syncconf';
  D.style.cssText='max-width:420px;border:0;border-radius:14px;padding:18px;box-shadow:0 10px 40px #0004';
  D.innerHTML=`<h2 style="margin-top:0">⚠️ ${T('Datos distintos en la nube')}</h2><p>${T('La nube tiene cambios de otro dispositivo y este dispositivo tiene datos distintos. ¿Cuáles quieres usar?')}</p>
  <div class="muted">☁️ ${T('Nube: guardado {0}',fmt(+d.updatedAt))}</div><div class="muted" style="margin-bottom:12px">💻 ${T('Este dispositivo: guardado {0}',fmt(+S.updatedAt))}</div>
  <button id="sc-cloud" autofocus style="width:100%;min-height:52px;font-size:17px">☁️ ${T('Usar la nube (recomendado)')}</button>
  ${(+S.updatedAt||0)<(+d.updatedAt||0)?`<div id="sc-old" style="background:#fef3c7;border-radius:10px;padding:8px;margin:0 0 10px">⚠️ ${T('Los datos de este dispositivo son MÁS VIEJOS que los de la nube.')}</div>`:''}
  <button id="sc-local" class="sec" style="width:100%;margin-top:8px">💻 ${T('Usar este dispositivo (reemplaza la nube)')}</button>
  <div class="muted" style="margin-top:10px">${T('Se guarda una copia de la otra versión en Configuración › Respaldo.')}</div>`;
  document.body.appendChild(D);setS('pend');
  const done=async ch=>{if(D.dataset.done)return;D.dataset.done='1';try{D.close()}catch(e){}D.remove();
   if(ch==='local'){const older=(+getState().updatedAt||0)<(+d.updatedAt||0);
    if(!confirm(older?T('⚠️ CUIDADO: los datos de este dispositivo son MÁS VIEJOS que los de la nube. Si sigues, se BORRAN de la nube los cambios más nuevos (por ejemplo, lo que guardaste en el móvil). Queda una copia en Respaldo. ¿Reemplazar la nube con los datos viejos?'):T('¿Seguro? Los datos de la nube se reemplazan por los de este dispositivo (queda una copia en Respaldo).'))){D.dataset.done='';conflictOpen=false;return conflictDlg(d)}
    await keepCopy(d.state,'dispositivo');setBase(+d.updatedAt||0);conflictOpen=false;localStorage.setItem(DIRTY_K,'1');allowOlder=true;await push()}
   else{await keepCopy(getState(),'nube');conflictOpen=false;useCloud(d)}};
  D.querySelector('#sc-cloud').onclick=()=>done('cloud');D.querySelector('#sc-local').onclick=()=>done('local');D.addEventListener('cancel',e=>{e.preventDefault();done('cloud')});
  D.showModal()}
 window.fbReconcile=reconcile;
 function applyRemote(d){reconcile(d)}
 async function pull(){if(!user||!ready)return;try{const sn=await F.getDoc(ref());if(sn.exists()&&!(sn.metadata&&sn.metadata.fromCache))reconcile(sn.data())}catch(e){console.warn(e)}}
 async function firstLink(){const key='finanzas-sync-uid';
  const sn=await F.getDoc(ref());
  if(localStorage.getItem(key)!==user.uid){localStorage.removeItem(BASE_K);localStorage.setItem(key,user.uid);if(hasUserData())localStorage.setItem(DIRTY_K,'1')}
  if(sn.metadata&&sn.metadata.fromCache&&!navigator.onLine)return;
  if(!sn.exists()){setReady(true);if(hasUserData())await push();return}
  reconcile(sn.data())}
 A.onAuthStateChanged(auth,async u=>{user=u;unsub&&unsub();unsub=null;
  if(!u){setReady(true);setS('out');rerender();return}
  setS('pend');rerender();
  try{await migBackup()}catch(e){console.warn('migBackup',e)}
  setReady(false);
  try{if(localStorage.getItem('finanzas-force-push')){localStorage.setItem('finanzas-sync-uid',u.uid);const c=await F.getDoc(ref());localStorage.removeItem('finanzas-force-push');localStorage.setItem(DIRTY_K,'1');
   // v112: restaurar un archivo ya no pisa a ciegas la nube: si la nube es más nueva que el archivo, se pregunta (por defecto la nube)
   if(c.exists()&&(+c.data().updatedAt||0)>(+getState().updatedAt||0)){localStorage.removeItem(BASE_K);setReady(true);reconcile(c.data())}else{if(c.exists())setBase(+c.data().updatedAt||0);setReady(true);await push()}}else await firstLink()}catch(e){console.warn(e);setS('err');setReady(true);return}
  setReady(true);if((isDirty()||needStamp)&&!conflictOpen){needStamp=false;push()}
  unsub=F.onSnapshot(ref(),{includeMetadataChanges:true},sn=>{if(!sn.exists())return;
   if(!sn.metadata.hasPendingWrites&&!sn.metadata.fromCache&&ready)reconcile(sn.data());
   setS(sn.metadata.hasPendingWrites?'pend':sn.metadata.fromCache&&!navigator.onLine?'offline':'ok')},e=>{console.warn(e);setS('err')});
  rerender();setTimeout(autoBackup,5000);setTimeout(()=>window.fbScanWarm&&fbScanWarm(),1500)});
 addEventListener('focus',()=>pull());document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
 addEventListener('online',()=>{if(status==='offline'||status==='pend'||isDirty())push()});addEventListener('offline',()=>user&&setS('offline'));
 // Primera vez después del PIN: ofrecer iniciar sesión
 window.afterUnlock=()=>{if(user||localStorage.getItem('finanzas-sync-asked'))return;localStorage.setItem('finanzas-sync-asked','1');
  setTimeout(()=>{if(!auth.currentUser&&confirm(T('¿Quieres guardar tus datos en la nube con tu cuenta de Google?\n(Puedes hacerlo luego en Ajustes)')))fbSignIn()},400)};
 if(typeof unlocked!=='undefined'&&unlocked)rerender();
}
