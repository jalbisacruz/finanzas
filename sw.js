const C='finanzas-v98',F=['./','./index.html','./app.js','./extra.js','./ui2.js','./mig.js','./items.js','./hist.js','./share.js','./chk.js','./pcat.js','./items2.js','./tax.js','./msg2.js','./links.js','./inbox.js','./scan.js','./hoy.js','./ops.js','./v80.js','./v81.js','./v86.js','./v87.js','./v89.js','./v90.js','./pdfview.js','./v91.js','./v92.js','./v93.js','./v94.js','./rep3.js','./v95.js','./v96.js','./v97.js','./v98.js','./vendor/pdfjs/pdf.min.js','./vendor/pdfjs/pdf.worker.min.js','./vendor/jspdf.umd.min.js','./nav.js','./sync.js','./firebase-config.js','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
// Solo cachea GET del mismo origen; Firebase/Google van directo a la red
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))});
