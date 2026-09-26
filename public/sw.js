const CACHE="pwa-reload-v1";
self.addEventListener("install",()=>{self.skipWaiting()});
self.addEventListener("activate",(event)=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.map((k)=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener("message",(event)=>{if(event.data==="skipWaiting")self.skipWaiting()});
self.addEventListener("fetch",(event)=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const path=url.pathname;
  if(path==="/sw.js"||path.endsWith(".webmanifest")||path==="/manifest.json"||path.endsWith(".png")||path.includes("apple-touch-icon")){
    event.respondWith(fetch(request,{cache:"no-store"}));
    return;
  }
  const accept=request.headers.get("accept")||"";
  if(request.mode==="navigate"||request.destination==="document"||accept.includes("text/html")){
    event.respondWith(fetch(request,{cache:"no-store"}).catch(()=>caches.match(request)));
  }
});

