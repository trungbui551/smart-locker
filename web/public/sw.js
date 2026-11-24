// Service Worker cơ bản để trình duyệt di động (Android/iOS) nhận diện PWA và cài ra màn hình chính.
// Luôn ưu tiên gọi mạng cho mọi yêu cầu /api/ để dữ liệu đơn hàng và OTP luôn mới nhất.

const CACHE_NAME = 'smart-locker-shell-v1';
const SHELL_ASSETS = ['/', '/logo.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
