// Sincronización en la nube con Firebase (Auth Google + Firestore). Doc: users/{uid}/data/state
const V='11.10.0',B=`https://www.gstatic.com/firebasejs/${V}/`;
const cfg=window.FB_CONFIG&&{...window.FB_CONFIG};
if(cfg&&/\.web\.app$/.test(location.hostname))cfg.authDomain=location.hostname;
// En Firebase Hosting usamos el mismo dominio para el login (más fiable en iPhone/PWA)
const CLIENT_V=2;let blocked=false;
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
  try{const cur=await F.getDoc(ref()).catch(()=>null);if(cur&&cur.exists()&&tooNew(cur.data()))return block();
   if(cur&&cur.exists()&&(+S.version||1)>=2&&!(+cur.data().ver>=2)&&localStorage.getItem('finanzas-cloud-v1-saved')!==user.uid){await bkId(cur.data().state);localStorage.setItem('finanzas-cloud-v1-saved',user.uid)}
   await F.setDoc(ref(),{state:JSON.stringify(S),updatedAt:S.updatedAt||Date.now(),ver:+S.version||1,device:navigator.userAgent.slice(0,80)});setS(navigator.onLine?'ok':'offline')}
  catch(e){console.warn(e);setS('err')}}
 // Respaldos: users/{uid}/backups/{YYYY-MM-DD_HH-MM-SS} (hora local; los antiguos YYYY-MM-DD siguen válidos), se conservan los 20 últimos
 const bcol=()=>F.collection(fs,'users',user.uid,'backups');
 const bkStamp=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.toLocaleDateString('en-CA')+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds())+'_antes-de-v2'};
 async function bkId(st){let id=bkStamp();if((await F.getDoc(F.doc(bcol(),id))).exists())id+='-2';await F.setDoc(F.doc(bcol(),id),{state:st,createdAt:Date.now(),label:'antes-de-v2'})}
 async function migBackup(){if(!user)return;let L;try{L=JSON.parse(localStorage.getItem('finanzas-mig-pending')||'[]')}catch(e){L=[]}
  for(const st of L){await bkId(st);await new Promise(r=>setTimeout(r,1100))}
  if(L.length)localStorage.removeItem('finanzas-mig-pending')}
 async function listB(){const q=await F.getDocs(bcol());return q.docs.map(d=>({id:d.id,createdAt:d.data().createdAt||0})).sort((a,b)=>(b.createdAt-a.createdAt)||(a.id<b.id?1:-1))}
 async function writeB(){const S=getState();if(!S||!S.months)return;const d=new Date(),p=n=>String(n).padStart(2,'0'),id=d.toLocaleDateString('en-CA')+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds());
  await F.setDoc(F.doc(bcol(),id),{state:JSON.stringify(S),createdAt:Date.now(),updatedAt:S.updatedAt||0});
  const all=await listB();for(const b of all.filter(b=>!/antes-de-v2/.test(b.id)).slice(20))await F.deleteDoc(F.doc(bcol(),b.id))}
 async function autoBackup(){if(!user||!navigator.onLine)return;try{const l=await F.getDocs(F.query(bcol(),F.orderBy('createdAt','desc'),F.limit(1)),);const last=l.docs[0];
  if(last&&Date.now()-(last.data().createdAt||0)<7*864e5)return;await writeB()}catch(e){console.warn('backup',e)}}
 window.fbUser=()=>!!user;
 window.fbBackups=async()=>user?listB():[];
 window.fbBackupNow=async()=>{if(user)await writeB()};
 window.fbRestore=async id=>{const sn=await F.getDoc(F.doc(bcol(),id));if(!sn.exists())throw new Error('missing');const st=JSON.parse(sn.data().state);st.updatedAt=Date.now();
  applying=true;try{setState(st)}finally{applying=false}await push()};
 window.onLocalSave=()=>{if(!user||applying)return;setS('pend');clearTimeout(pushT);pushT=setTimeout(push,1500)};
 window.fbSyncNow=async()=>{await pull(true);await push();rerender()};
 function applyRemote(d){if(!d)return;if(tooNew(d))return block();const S=getState();if((d.updatedAt||0)>(S.updatedAt||0)){applying=true;try{setState(JSON.parse(d.state))}finally{applying=false}}}
 async function pull(){if(!user)return;try{const sn=await F.getDoc(ref());if(sn.exists())applyRemote(sn.data())}catch(e){console.warn(e)}}
 async function firstLink(){const key='finanzas-sync-uid';if(localStorage.getItem(key)===user.uid)return;
  const sn=await F.getDoc(ref());if(sn.exists()&&tooNew(sn.data()))return block();
  if(!sn.exists()){await push()}
  else if(hasUserData()){
   const d=sn.data(),when=new Date(d.updatedAt||0).toLocaleString(LOC());
   if(confirm(T('Ya hay datos en la nube (guardados {0}).\n\nAceptar = usar los datos de la NUBE (reemplaza los de este dispositivo).\nCancelar = usar los datos de ESTE DISPOSITIVO (reemplaza la nube).',when))){applying=true;try{setState(JSON.parse(d.state))}finally{applying=false}}
   else await push()}
  else{applying=true;try{setState(JSON.parse(sn.data().state))}finally{applying=false}}
  localStorage.setItem(key,user.uid)}
 A.onAuthStateChanged(auth,async u=>{user=u;unsub&&unsub();unsub=null;
  if(!u){setS('out');rerender();return}
  setS('pend');rerender();
  try{await migBackup()}catch(e){console.warn('migBackup',e)}
  try{if(localStorage.getItem('finanzas-force-push')){localStorage.setItem('finanzas-sync-uid',u.uid);await push();localStorage.removeItem('finanzas-force-push')}else await firstLink()}catch(e){console.warn(e);setS('err');return}
  unsub=F.onSnapshot(ref(),{includeMetadataChanges:true},sn=>{if(!sn.exists())return;
   if(!sn.metadata.hasPendingWrites)applyRemote(sn.data());
   setS(sn.metadata.hasPendingWrites?'pend':sn.metadata.fromCache&&!navigator.onLine?'offline':'ok')},e=>{console.warn(e);setS('err')});
  rerender();setTimeout(autoBackup,5000)});
 addEventListener('focus',()=>pull());document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
 addEventListener('online',()=>{if(status==='offline'||status==='pend')push()});addEventListener('offline',()=>user&&setS('offline'));
 // Primera vez después del PIN: ofrecer iniciar sesión
 window.afterUnlock=()=>{if(user||localStorage.getItem('finanzas-sync-asked'))return;localStorage.setItem('finanzas-sync-asked','1');
  setTimeout(()=>{if(!auth.currentUser&&confirm(T('¿Quieres guardar tus datos en la nube con tu cuenta de Google?\n(Puedes hacerlo luego en Ajustes)')))fbSignIn()},400)};
 if(typeof unlocked!=='undefined'&&unlocked)rerender();
}
