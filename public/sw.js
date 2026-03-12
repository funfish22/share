// VERSION: 1.0.1 (每當發布新版本時，請修改此數字)

self.addEventListener('install', (e) => {
  self.skipWaiting(); // 強制跳過等待，立即取代舊版 SW
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim()); // 讓新版 SW 立即控制所有分頁
});

self.addEventListener('fetch', (e) => {
  // 不快取 JS/CSS，直接放行，確保每次都是讀取最新版
  e.respondWith(fetch(e.request).catch(() => new Response('Network error')));
});