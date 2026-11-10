// App-shell cache so the tool opens fast and works with a weak connection.
// The model itself is cached separately by app.js (Cache Storage "studio-model").
const CACHE = 'studio-shell-v5';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest', 'icon.svg',
  'vendor/cropper.min.js', 'vendor/cropper.min.css', 'vendor/fflate.mjs',
  'vendor/ort.webgpu.bundle.min.mjs', 'vendor/ort-wasm-simd-threaded.jsep.mjs', 'vendor/ort-wasm-simd-threaded.jsep.wasm'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((k) => k.startsWith('studio-shell') && k !== CACHE).map((k) => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/model/')) return;
  // network first (so updates arrive), cache as fallback
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request)));
});
