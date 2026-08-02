const CACHE='trafficcop-v362-direct';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const key of await caches.keys()) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  if(e.request.method==='GET'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
  }
});
