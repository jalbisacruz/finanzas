// Minimal in-memory stand-in for the Firebase modules used by sync.js (tests only).
const W=window;W.__fs=W.__fs||{docs:JSON.parse(localStorage.getItem('__fsdocs')||'{}'),log:[]};
const P=s=>s.join('/');
export const initializeApp=c=>({c});
export const getAuth=()=>({currentUser:{uid:'u1',email:'test@example.com'}});
export const setPersistence=async()=>{};export const browserLocalPersistence={};
export class GoogleAuthProvider{setCustomParameters(){}}
export const signInWithPopup=async()=>{};export const signInWithRedirect=async()=>{};export const signOut=async()=>{};
export const getRedirectResult=async()=>null;
export const onAuthStateChanged=(a,cb)=>{setTimeout(()=>cb({uid:'u1',email:'test@example.com'}),50)};
export const initializeFirestore=()=>({});export const persistentLocalCache=()=>({});export const persistentMultipleTabManager=()=>({});
export const doc=(base,...s)=>({path:base&&base.path?P([base.path,...s]):P(s)});
export const collection=(fs,...s)=>({path:P(s)});
export const query=c=>c;export const orderBy=()=>0;export const limit=()=>0;
const snap=(path)=>{const d=W.__fs.docs[path];return{id:path.split('/').pop(),exists:()=>!!d,data:()=>d&&JSON.parse(JSON.stringify(d)),metadata:{hasPendingWrites:false,fromCache:false}}};
export const getDoc=async r=>{if(W.__getDelay)await new Promise(z=>setTimeout(z,W.__getDelay));if(W.__offline)throw Object.assign(new Error('unavailable'),{code:'unavailable'});return snap(r.path)};
export const setDoc=async(r,d)=>{W.__fs.docs[r.path]=JSON.parse(JSON.stringify(d));W.__fs.log.push(r.path)};
export const deleteDoc=async r=>{delete W.__fs.docs[r.path];W.__fs.log.push('DEL '+r.path)};
export const getDocs=async c=>({docs:Object.keys(W.__fs.docs).filter(k=>k.startsWith(c.path+'/')&&!k.slice(c.path.length+1).includes('/')).map(snap)});
export const onSnapshot=(r,o,cb)=>{setTimeout(()=>cb(snap(r.path)),W.__snapDelay||30);return()=>{}};
// App Check + AI Logic stand-ins (v63). window.__aiFail = list of errors to throw on successive calls.
export const initializeAppCheck=()=>({});export class ReCaptchaEnterpriseProvider{constructor(k){W.__ackey=k}}
export const getToken=async(ac,force)=>{W.__acLog=(W.__acLog||[]);W.__acLog.push('token');W.__acTokenCalls=(W.__acTokenCalls||0)+1;W.__acForce=!!force;if(W.__acTokenErr){const e=W.__acTokenErr;W.__acTokenErr=null;throw Object.assign(new Error(e.m),{code:e.c})}if(W.__acTokenDelay)await new Promise(r=>setTimeout(r,W.__acTokenDelay));return {token:W.__acToken||'tok'}}
export const signInAnonymously=async(a)=>{W.__anonCalls=(W.__anonCalls||0)+1;if(W.__anonErr)throw Object.assign(new Error(W.__anonErr.m),{code:W.__anonErr.c});const u={uid:'anon',isAnonymous:true};if(a)a.currentUser=u;W.__user=u;return {user:u}}
export const getAI=()=>({});export class GoogleAIBackend{}
export const getGenerativeModel=(ai,o)=>({generateContent:async()=>{W.__acLog=(W.__acLog||[]);W.__acLog.push('ai');W.__aiCalls=(W.__aiCalls||0)+1;const f=(W.__aiFail||[]).shift();if(f)throw Object.assign(new Error(f.m),{code:f.c});return{response:{text:()=>W.__aiText||'{"isReceipt":true,"store":"Publix","date":"2026-10-12","total":5,"items":[]}'}}}});
// v72 (public page: firestore-lite addDoc)
export const getApps=()=>W.__apps||[];export const getApp=()=>(W.__apps||[{}])[0];
export const getFirestore=()=>({});export const serverTimestamp=()=>'__now__';
export const addDoc=async(c,d)=>{const id='i'+Math.random().toString(36).slice(2,10);W.__fs.docs[c.path+'/'+id]=JSON.parse(JSON.stringify(d));W.__fs.log.push(c.path+'/'+id);return {id}};
