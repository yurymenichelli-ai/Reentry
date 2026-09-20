const CACHE_NAME = 'rientro-shell-v88';
const APP_SHELL = [
  './',
  './index.html',
  './office/bridge.js',
  './office/embed.css?v=1',
  './styles.css?v=33',
  './app.js?v=64',
  './editorial.css?v=48',
  './marea.css?v=28',
  './refinement.css?v=4',
  './theme.js?v=33',
  './ui.js?v=47',
  './motion.js?v=46',
  './assets/architecture-light.jpg',
  './assets/architecture-dark.jpg',
  './assets/marea-home-light.jpg',
  './assets/marea-home-dark.jpg',
  './assets/lumi/home.jpg',
  './assets/lumi/piano.jpg',
  './assets/lumi/movimenti.jpg',
  './assets/lumi/analisi.jpg',
  './assets/lumi/obiettivi.jpg',
  './assets/lumi/profilo.jpg',
  './assets/lumi/piano-light.png',
  './assets/lumi/piano-dark.png',
  './assets/lumi/movimenti-light.png',
  './assets/lumi/movimenti-dark.png',
  './assets/lumi/analisi-light.png',
  './assets/lumi/analisi-dark.png',
  './assets/lumi/obiettivi-light.png',
  './assets/lumi/obiettivi-dark.png',
  './assets/lumi/profilo-light.png',
  './assets/lumi/profilo-dark.png',
  './assets/lumi-editoriale.jpg',
  './assets/notturno-materico.jpg',
  './debt-flow.js',
  './recurring-flow.js',
  './engine-v31.js',
  './budget.js',
  './budget-home.js',
  './cloud.js?v=40',
  './capital-flow.js?v=25',
  './manifest.webmanifest?v=2',
  './icons/icon-192.png?v=2',
  './icons/icon-512.png?v=2',
  './icons/icon-maskable-512.png?v=2',
  './icons/apple-touch-icon.png?v=2',
  './icons/favicon-32.png?v=2'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }
  if (['script','style'].includes(event.request.destination)) {
    event.respondWith(fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone()));return response}).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      const updated = fetch(event.request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || updated;
    })
  );
});
