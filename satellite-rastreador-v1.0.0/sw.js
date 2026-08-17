const CACHE='satellite-rastreador-v1.0.0';
const SHELL=[
  './', './index.html', './css/app.css', './manifest.webmanifest', './assets/icons/app-icon.svg', './assets/icons/app-icon-192.png', './assets/icons/app-icon-512.png', './js/app.js', './js/config.js', './js/utils.js', './js/storage.js', './js/time-controller.js', './js/orbit.js', './js/passes.js', './js/catalog.js', './js/weather.js', './js/overlays.js', './js/map.js', './js/ui.js', './js/icons.js', './js/metadata.js', './assets/satellite-icons/32/iss.png', './assets/satellite-icons/32/sat1.png', './assets/satellite-icons/32/sat10.png', './assets/satellite-icons/32/sat11.png', './assets/satellite-icons/32/sat12.png', './assets/satellite-icons/32/sat13.png', './assets/satellite-icons/32/sat14.png', './assets/satellite-icons/32/sat15.png', './assets/satellite-icons/32/sat16.png', './assets/satellite-icons/32/sat17.png', './assets/satellite-icons/32/sat2.png', './assets/satellite-icons/32/sat3.png', './assets/satellite-icons/32/sat4.png', './assets/satellite-icons/32/sat5.png', './assets/satellite-icons/32/sat6.png', './assets/satellite-icons/32/sat7.png', './assets/satellite-icons/32/sat8.png', './assets/satellite-icons/32/sat9.png', './assets/satellite-icons/64/iss.png', './assets/satellite-icons/64/sat1.png', './assets/satellite-icons/64/sat10.png', './assets/satellite-icons/64/sat11.png', './assets/satellite-icons/64/sat12.png', './assets/satellite-icons/64/sat13.png', './assets/satellite-icons/64/sat14.png', './assets/satellite-icons/64/sat15.png', './assets/satellite-icons/64/sat16.png', './assets/satellite-icons/64/sat17.png', './assets/satellite-icons/64/sat2.png', './assets/satellite-icons/64/sat3.png', './assets/satellite-icons/64/sat4.png', './assets/satellite-icons/64/sat5.png', './assets/satellite-icons/64/sat6.png', './assets/satellite-icons/64/sat7.png', './assets/satellite-icons/64/sat8.png', './assets/satellite-icons/64/sat9.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
  if(url.origin!==location.origin)return; // APIs, CDN y teselas siguen en red para evitar datos externos obsoletos.
  if(url.pathname.includes('/data/')){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;}).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;})));
});
