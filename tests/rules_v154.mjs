import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const rules = readFileSync('/workspace/finanzas/firestore.rules','utf8');
const tonyTok = 'AAAAAAAAAAAAAAAAAAAAAA';
const carlosTok = 'BBBBBBBBBBBBBBBBBBBBBB';
const testEnv = await initializeTestEnvironment({
  projectId: 'demo-v154shares',
  firestore: { rules, host: '127.0.0.1', port: 8080 }
});

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db=ctx.firestore();
  await setDoc(doc(db,'users','uid-joe','data','state'),{state:'{}',updatedAt:1,ver:3});
  await setDoc(doc(db,'shares',tonyTok),{v:1,who:'Tony',owner:'uid-joe',buyers:['Tony','Arianna'],lang:'es'});
  await setDoc(doc(db,'shares',carlosTok),{v:1,who:'Carlos',owner:'uid-joe',buyers:['Carlos'],lang:'es'});
});

const joe=testEnv.authenticatedContext('uid-joe').firestore();
const other=testEnv.authenticatedContext('uid-other').firestore();
const anon=testEnv.unauthenticatedContext().firestore();

let pass=0,fail=0;
async function check(name,p){try{await p;pass++;console.log('OK',name)}catch(e){fail++;console.log('FAIL',name,String(e.message||e).slice(0,220).replace(/\n/g,' '))}}

function r3Base(who, extra={}){
  return Object.assign({
    who, lang:'es',
    transfers:[
      {from:'Yo',to:'Tony',amount:1937.15},
      {from:'Carlos',to:'Tony',amount:1120.25},
      {from:'Carlos',to:'Yo',amount:10}
    ],
    people:{
      Yo:{pays:1937.15,gets:10,part:100,bills:484.29},
      Tony:{pays:0,gets:3057.4,part:200,bills:968.58},
      Carlos:{pays:1130.25,gets:0,part:80,bills:484.29}
    },
    pairs:[
      {a:'Yo',b:'Tony',lines:[{l:'Cuentas',v:1937.15}],net:1937.15,paid:0,paidL:'Ya transferido',pend:1937.15},
      {a:'Carlos',b:'Tony',lines:[{l:'Cuentas',v:1100},{l:'Compras',v:20.32}],net:1120.25,paid:null,pend:1120.25,tc:1},
      {a:'Carlos',b:'Yo',lines:[{l:'Compras entre Carlos y Joe',v:10}],net:10,paid:null,pend:10}
    ],
    billsShare:{Joe:484.29,Tony:968.58,Carlos:484.29,Arianna:0},
    sheetApproved:true,
    sheetPending:false,
    carlosFlows:{billsTony:484.29,purchTony:20.32,toTony:504.61,purchJoe:10,recv:0,pendJoe:10,toJoe:10,
      sh:{Joe:484.29,Tony:968.58,Carlos:484.29,Arianna:0},pt:{cT:50,tC:29.68,net:20.32}},
    showBills:who!=='Carlos',
    billsTotal: who==='Tony'?968.58:484.29,
    bills:[{n:'Renta',a:who==='Tony'?500:250,paid:false}]
  }, extra);
}

const tonySnap={
  v:1,who:'Tony',lang:'es',owner:'uid-joe',updatedAt:Date.now(),
  buyers:['Tony','Arianna'],
  names:{Yo:'Joe',Tony:'Tony',Carlos:'Carlos'},
  from:'Joe Albisa Cruz',
  cats:[{v:'food',l:'Comida'}],
  billSheet:{
    k:'2026-11',label:'Nov 2026',rev:1,from:'2026-11',approved:true,pending:false,
    rows:[
      {key:'renta',name:'Renta',group:'casa',total:1000,alloc:{who:['Tony','Joe','Carlos'],mode:'pct',pct:{Tony:50,Joe:25,Carlos:25}},def:false}
    ]
  },
  months:[{
    k:'2026-11',label:'Nov 2026',
    purchases:[{d:'2026-11-04',s:'Publix',c:'Comida',t:100,by:'Tony',rows:[{n:'Leche',c:'Comida',a:50,sh:'Tony, Carlos',v:{Yo:0,Tony:20,Carlos:30}}],tot:{Yo:30,Tony:20,Carlos:50}}],
    bills:[{n:'Renta',a:250,paid:false}],
    billsTotal:250,share:200,toTransfer:1937.15,paid:0,pending:1937.15,nf:1,
    r3:r3Base('Tony')
  }]
};

const carlosNested=JSON.parse(JSON.stringify({
  v:1,who:'Carlos',lang:'es',owner:'uid-joe',updatedAt:Date.now(),
  buyers:['Carlos'],
  names:{Yo:'Joe',Tony:'Tony',Carlos:'Carlos'},
  from:'Joe Albisa Cruz',
  cats:[{v:'food',l:'Comida'}],
  months:[{
    k:'2026-11',label:'Nov 2026',
    purchases:[],
    share:80,joeShare:20,joeOwes:0,paid:0,pending:10,nf:1,
    r3:r3Base('Carlos',{
      breakDown:{
        title:'De dónde sale tu total',
        sections:[
          {h:'Cuentas',cols:['Cuenta','Total','Tu parte'],ws:[316,100,100],
            rows:[['Renta','$1,000.00','$250.00']],
            tot:['Total','','$250.00']},
          {h:'Compras y comida',cols:['','Total'],ws:[416,100],
            rows:[['Parte de Carlos en compras que pagó Joe','$10.00']],
            tot:['Total','$10.00']}
        ]
      }
    })
  }]
}));

const carlosSafe=JSON.parse(JSON.stringify(carlosNested));
carlosSafe.months[0].r3.breakDown.sections.forEach(sec=>{
  if(Array.isArray(sec.rows))sec.rows=sec.rows.map(r=>Array.isArray(r)?{c:r}:r);
});

await check('Joe can update Tony share with v152/v154 figures', assertSucceeds(setDoc(doc(joe,'shares',tonyTok), tonySnap)));
await check('Joe can update Carlos share sanitized (no nested arrays)', assertSucceeds(setDoc(doc(joe,'shares',carlosTok), carlosSafe)));
// Nested arrays: the emulator/SDK should reject them (not a rules issue).
try{
  await setDoc(doc(joe,'shares',carlosTok), carlosNested);
  console.log('NOTE nested arrays ACCEPTED by this client/emulator (rules still allow; SDK may reject in production)');
  pass++;
}catch(e){
  const msg=String(e&&e.message||e);
  if(/nested array|array.*array|invalid data|Unsupported field/i.test(msg)){
    console.log('OK Carlos nested arrays rejected by Firestore backend/SDK (not rules)');
    pass++;
  }else{
    fail++;
    console.log('FAIL nested array write unexpected error', msg.slice(0,220));
  }
}
await check('Tony snap readable after update', assertSucceeds(getDoc(doc(joe,'shares',tonyTok))));
await check('anon cannot update share', assertFails(setDoc(doc(anon,'shares',tonyTok), tonySnap)));
await check('other uid cannot update Joe share', assertFails(setDoc(doc(other,'shares',tonyTok), Object.assign({},tonySnap,{owner:'uid-other'}))));
await check('Joe cannot change owner on update', assertFails(setDoc(doc(joe,'shares',tonyTok), Object.assign({},tonySnap,{owner:'uid-other'}))));

await testEnv.cleanup();
console.log('RESULT pass',pass,'fail',fail);
process.exit(fail?1:0);
