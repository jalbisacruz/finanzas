// Sincronización en la nube con Firebase (Auth Google + Firestore). Doc: users/{uid}/data/state
const V='11.10.0',B=`https://www.gstatic.com/firebasejs/${V}/`;
const cfg=window.FB_CONFIG&&{...window.FB_CONFIG};
if(cfg&&/\.web\.app$/.test(location.hostname))cfg.authDomain=location.hostname;
// En Firebase Hosting usamos el mismo dominio para el login (más fiable en iPhone/PWA)
let status='off',user=null,pushT=null,applying=false,unsub=null,fs=null,api=null,lastRemote=0;
const LBL={off:'',out:'☁️ Sin sesión',pend:'⏳ Sincronización pendiente',ok:'☁️ Sincronizado',offline:'📴 Sin conexión (se sincroniza al volver)',err:'⚠️ Error de sincronización'};
window.syncStatus=()=>cfg?LBL[status]:'';
const setS=s=>{status=s;const el=document.getElementById('syncst');if(el)el.textContent=LBL[s]};
window.syncCard=()=>!cfg?'':`<div class="card"><h2>Nube</h2>${user?`<div class="muted">Conectado como ${user.email}</div><div class="muted" style="margin:6px 0">${LBL[status]}</div>
 <div class="grid"><button class="sec" onclick="fbSyncNow()">Sincronizar ahora</button><button class="del" onclick="fbSignOut()">Cerrar sesión</button></div>`:
 `<div class="muted">Guarda tus datos en tu cuenta de Google y úsalos en varios dispositivos. El PIN sigue siendo de cada dispositivo.</div><button id="gsign" style="width:100%;margin-top:8px" onclick="fbSignIn()">Iniciar sesión con Google</button>`}</div>`;
if(cfg){
 const [{initializeApp},A,F]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
 api={A,F};const app=initializeApp(cfg);const auth=A.getAuth(app);
 await A.setPersistence(auth,A.browserLocalPersistence).catch(()=>{});
 fs=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})});
 const ref=()=>F.doc(fs,'users',user.uid,'data','state');
 const standalone=()=>navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;
 window.fbSignIn=async()=>{const pr=new A.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
  try{ await A.signInWithPopup(auth,pr)}
  catch(e){ if(/popup|cancelled|operation-not-supported/i.test(e.code||'')) return A.signInWithRedirect(auth,pr); alert('No se pudo iniciar sesión: '+(e.code||e.message))}};
 window.fbSignOut=async()=>{if(!confirm('¿Cerrar sesión? Los datos se quedan en este dispositivo.'))return;await A.signOut(auth)};
 A.getRedirectResult(auth).catch(e=>{console.warn('redirect',e.code);if(e.code)alert('Error al iniciar sesión: '+e.code)});
 async function push(){if(!user)return;clearTimeout(pushT);const S=getState();
  try{await F.setDoc(ref(),{state:JSON.stringify(S),updatedAt:S.updatedAt||Date.now(),device:navigator.userAgent.slice(0,80)});setS(navigator.onLine?'ok':'offline')}
  catch(e){console.warn(e);setS('err')}}
 window.onLocalSave=()=>{if(!user||applying)return;setS('pend');clearTimeout(pushT);pushT=setTimeout(push,1500)};
 window.fbSyncNow=async()=>{await pull(true);await push();rerender()};
 function applyRemote(d){if(!d)return;const S=getState();if((d.updatedAt||0)>(S.updatedAt||0)){applying=true;try{setState(JSON.parse(d.state))}finally{applying=false}}}
 async function pull(){if(!user)return;try{const sn=await F.getDoc(ref());if(sn.exists())applyRemote(sn.data())}catch(e){console.warn(e)}}
 async function firstLink(){const key='finanzas-sync-uid';if(localStorage.getItem(key)===user.uid)return;
  const sn=await F.getDoc(ref());
  if(!sn.exists()){await push()}
  else if(hasUserData()){
   const d=sn.data(),when=new Date(d.updatedAt||0).toLocaleString('es');
   if(confirm(`Ya hay datos en la nube (guardados ${when}).\n\nAceptar = usar los datos de la NUBE (reemplaza los de este dispositivo).\nCancelar = usar los datos de ESTE DISPOSITIVO (reemplaza la nube).`)){applying=true;try{setState(JSON.parse(d.state))}finally{applying=false}}
   else await push()}
  else{applying=true;try{setState(JSON.parse(sn.data().state))}finally{applying=false}}
  localStorage.setItem(key,user.uid)}
 A.onAuthStateChanged(auth,async u=>{user=u;unsub&&unsub();unsub=null;
  if(!u){setS('out');rerender();return}
  setS('pend');rerender();
  try{if(localStorage.getItem('finanzas-force-push')){localStorage.setItem('finanzas-sync-uid',u.uid);await push();localStorage.removeItem('finanzas-force-push')}else await firstLink()}catch(e){console.warn(e);setS('err');return}
  unsub=F.onSnapshot(ref(),{includeMetadataChanges:true},sn=>{if(!sn.exists())return;
   if(!sn.metadata.hasPendingWrites)applyRemote(sn.data());
   setS(sn.metadata.hasPendingWrites?'pend':sn.metadata.fromCache&&!navigator.onLine?'offline':'ok')},e=>{console.warn(e);setS('err')});
  rerender()});
 addEventListener('focus',()=>pull());document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
 addEventListener('online',()=>{if(status==='offline'||status==='pend')push()});addEventListener('offline',()=>user&&setS('offline'));
 // Primera vez después del PIN: ofrecer iniciar sesión
 window.afterUnlock=()=>{if(user||localStorage.getItem('finanzas-sync-asked'))return;localStorage.setItem('finanzas-sync-asked','1');
  setTimeout(()=>{if(!auth.currentUser&&confirm('¿Quieres guardar tus datos en la nube con tu cuenta de Google?\n(Puedes hacerlo luego en Ajustes)'))fbSignIn()},400)};
 if(typeof unlocked!=='undefined'&&unlocked)rerender();
}
