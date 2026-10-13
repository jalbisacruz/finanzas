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
export const getDoc=async r=>snap(r.path);
export const setDoc=async(r,d)=>{W.__fs.docs[r.path]=JSON.parse(JSON.stringify(d));W.__fs.log.push(r.path)};
export const deleteDoc=async r=>{delete W.__fs.docs[r.path];W.__fs.log.push('DEL '+r.path)};
export const getDocs=async c=>({docs:Object.keys(W.__fs.docs).filter(k=>k.startsWith(c.path+'/')&&!k.slice(c.path.length+1).includes('/')).map(snap)});
export const onSnapshot=(r,o,cb)=>{setTimeout(()=>cb(snap(r.path)),30);return()=>{}};
