const CACHE = "sonusarca-v8-1-shell-v2";
const SHELL = [
  "./",
  "./index.html",
  "./sonusarca_v8_1.html",
  "./sonusarca-config.js",
  "./manifest.webmanifest",
  "./img/sonusarca/icon-192.png",
  "./img/sonusarca/icon-512.png"
];
self.addEventListener("install", event => event.waitUntil((async()=>{
  const cache=await caches.open(CACHE); await Promise.allSettled(SHELL.map(url=>cache.add(url))); await self.skipWaiting();
})()));
self.addEventListener("activate", event => event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE && (k.startsWith("sonusarca-")||k.startsWith("radioyoutube-"))).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener("fetch", event=>{
  const req=event.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==self.location.origin) return;
  if(req.mode==="navigate"){
    event.respondWith((async()=>{try{const fresh=await fetch(req);const c=await caches.open(CACHE);c.put(req,fresh.clone());return fresh;}catch{return (await caches.match(req))||(await caches.match("./index.html"))||Response.error();}})());
    return;
  }
  event.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;try{const fresh=await fetch(req);if(fresh&&fresh.ok){const c=await caches.open(CACHE);c.put(req,fresh.clone())}return fresh}catch{return Response.error()}})());
});
