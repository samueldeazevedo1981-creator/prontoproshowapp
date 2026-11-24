const CACHE_NAME = 'pronto-pro-show-offline-v12';
const PREFIX = 'pronto-pro-show-offline-';
// Only executable app resources may block offline installation.
const APP_SHELL = ['./index.html','./pedal.js','./lyrics.js','./media-import.js','./preferences.js','./soundtouch-node.js','./constants.js','./soundtouch-processor.js','./vendor/tailwind.js','./vendor/pdf.min.mjs','./vendor/pdf.worker.min.mjs'];
APP_SHELL.push(...[
  "./biblioteca.js",
  "./buscador-letras.js",
  "./colecao-trucker-cap-studio.png",
  "./biblioteca-drive.json",
  "./biblioteca-videos.json",
  "./avi-worker.js",
  "./repertorio.js",
  "./volume/index.html",
  "./volume/icon-192.png",
  "./separador/app.js",
  "./separador/audio-utils.js",
  "./separador/beat-engine.js",
  "./separador/beat-worker.js",
  "./separador/index.html",
  "./separador/mix-engine.js",
  "./separador/mp3-worker.js",
  "./separador/separator-worker.js",
  "./separador/style.css",
  "./separador/vendor/demucs/src/constants.js",
  "./separador/vendor/demucs/src/fft.js",
  "./separador/vendor/demucs/src/index.js",
  "./separador/vendor/demucs/src/processor.js",
  "./separador/vendor/lame/lame.min.js",
  "./separador/vendor/ort/ort-wasm-simd-threaded.mjs",
  "./separador/vendor/ort/ort-wasm-simd-threaded.wasm",
  "./separador/vendor/ort/ort.wasm.min.mjs",
  "./separador/icon-192.png",
  "./separador/logo.png"
]);
const OPTIONAL_ASSETS = ['./manifest.json','./icon.png','./icon-192.png','./icon-512.png','./SOUNDTOUCH-LICENSE.txt'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  // Bypass the HTTP cache so a deployment cannot silently reuse stale files.
  await cache.addAll(APP_SHELL.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
  // A missing icon or license must not disable the entire offline app.
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
  await self.clients.claim();
  const cache=await caches.open(CACHE_NAME);
  await Promise.allSettled(OPTIONAL_ASSETS.map(async path=>{
    const url=new URL(path,self.registration.scope);
    const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),5000);
    try{const response=await fetch(new Request(url,{cache:'reload',signal:abort.signal}));if(response.ok)await cache.put(url,response)}catch{}finally{clearTimeout(timeout)}
  }));
})()));
self.addEventListener('message',event=>{
  if(event.data?.type!=='OFFLINE_STATUS'||!event.ports[0])return;
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const found=await Promise.all(APP_SHELL.map(path=>cache.match(new URL(path,self.registration.scope))));
    event.ports[0].postMessage({ready:found.every(Boolean),version:CACHE_NAME});
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(url.pathname.startsWith("/api/"))return;
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(request.mode==='navigate'&&url.pathname===new URL(self.registration.scope).pathname)
      return (await cache.match(new URL('./index.html',self.registration.scope)))||fetch(request);
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    // Never return HTML as a missing JS, PDF or audio resource.
    return fetch(request);
  })());
});
