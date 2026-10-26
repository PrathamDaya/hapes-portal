const CACHE='hetu-shell-v8';
const SHELL=['./','index.html','style.css','css/tokens.css','script.js','manifest.webmanifest','js/games/arcade.js','js/games/engine.js','js/games/heart-catch.js','js/games/love-slasher.js','js/games/memory-match.js','js/games/couple-dare.js','js/games/quiz-about-us.js','assets/favicon.svg','assets/hetu-logo.svg','assets/fonts/Fraunces-Variable.woff2','assets/fonts/DM-Sans-Variable.woff2'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==location.origin||url.pathname.startsWith('/api/'))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html'))));
});

