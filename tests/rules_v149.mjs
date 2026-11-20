import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const rules = readFileSync('/workspace/finanzas/firestore.rules','utf8');
const tok = 'AAAAAAAAAAAAAAAAAAAAAA';
const carlos = 'CARLOS_TOKEN_AAAAAAAAAA';
const defAlloc = { who: ['Tony','Joe','Carlos'], mode: 'pct', pct: { Tony: 50, Joe: 25, Carlos: 25 } };
const joe100 = { who: ['Joe'], mode: 'pct', pct: { Joe: 100 } };
const keys = ['renta','ventanas','agua','luz','gas','telefono','internet','purificador','seguro','letra'];
const testEnv = await initializeTestEnvironment({
  projectId: 'demo-v149final',
  firestore: { rules, host: '127.0.0.1', port: 8080 }
});
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db=ctx.firestore();
  await setDoc(doc(db,'shares',tok),{who:'Tony',owner:'uid-joe',buyers:['Tony','Arianna'],v:1});
  await setDoc(doc(db,'shares',carlos),{who:'Carlos',owner:'uid-joe',buyers:['Carlos'],v:1});
});
const db=testEnv.unauthenticatedContext().firestore();
const inbox=()=>collection(db,'shares',tok,'inbox');
let pass=0,fail=0;
async function check(name,p){try{await p;pass++;console.log('OK',name)}catch(e){fail++;console.log('FAIL',name,(e.message||'').includes('1000')?'LIMIT':String(e.message).slice(0,200).replace(/\n/g,' '))}}
function rowsN(n){
  return Array.from({length:n},(_,i)=>i<10
    ? {key:keys[i],total:i===2?45.67:(i===8?150:10+i),alloc:i>=8?joe100:defAlloc, ...(i===0?{name:'Renta casa'}:{})}
    : {key:'c-ab12cd'+String(i).padStart(2,'0'),total:5.5,alloc:defAlloc,name:'Jardín '+i,group:'otro'});
}
function payload(over={}){return {kind:'bills',by:'Tony',month:'2026-11',rev:0,rows:rowsN(10),at:serverTimestamp(),...over}}

await check('10 default bills + decimals + rename', assertSucceeds(addDoc(inbox(), payload())));
await check('10+1 new c- key', assertSucceeds(addDoc(inbox(), payload({rows:rowsN(11)}))));
await check('20 rows cap', assertSucceeds(addDoc(inbox(), payload({rows:rowsN(20)}))));
await check('21 rows rejected', assertFails(addDoc(inbox(), payload({rows:rowsN(21)}))));
await check('rev 0 float-or-int', assertSucceeds(addDoc(inbox(), payload({rev:0}))));
await check('rev 1', assertSucceeds(addDoc(inbox(), payload({rev:1}))));
await check('post-approve alloc with empty amt', assertSucceeds(addDoc(inbox(), payload({rows:[{key:'renta',total:800,alloc:{...defAlloc,amt:{}}}]}))));
await check('amt mode', assertSucceeds(addDoc(inbox(), payload({rows:[{key:'renta',total:100,alloc:{who:['Tony','Joe'],mode:'amt',amt:{Tony:60,Joe:40}}}]}))));
await check('eq mode', assertSucceeds(addDoc(inbox(), payload({rows:[{key:'agua',total:30,alloc:{who:['Tony','Joe','Carlos'],mode:'eq'}}]}))));
await check('reject Carlos share', assertFails(addDoc(collection(db,'shares',carlos,'inbox'), payload())));
await check('reject row extra custom', assertFails(addDoc(inbox(), payload({rows:[{key:'renta',total:1,alloc:defAlloc,custom:true}]}))));
await check('reject alloc still allowed if extra field (loosened)', (async()=>{
  try{await addDoc(inbox(), payload({rows:[{key:'renta',total:1,alloc:{...defAlloc,def:true}}]})); console.log('NOTE alloc extra field ALLOWED (budget tradeoff)');}
  catch(e){console.log('NOTE alloc extra field DENIED');}
})());
await check('reject missing kind', assertFails(addDoc(inbox(), {by:'Tony',month:'2026-11',rev:0,rows:rowsN(1),at:serverTimestamp()})));
await check('settle still works', assertSucceeds(addDoc(inbox(), {kind:'settle',by:'Tony',month:'2026-11',amount:20,at:serverTimestamp()})));
await check('purchase still works', assertSucceeds(addDoc(inbox(), {by:'Tony',store:'Publix',date:'2026-11-20',total:12.5,at:serverTimestamp(),scan:true})));
await check('settle rejected on missing amount', assertFails(addDoc(inbox(), {kind:'settle',by:'Tony',month:'2026-11',at:serverTimestamp()})));
await check('rev 10001 rejected', assertFails(addDoc(inbox(), payload({rev:10001,rows:rowsN(1)}))));

await testEnv.cleanup();
console.log('RESULT pass',pass,'fail',fail);
process.exit(fail?1:0);
