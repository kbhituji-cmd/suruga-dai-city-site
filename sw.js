// 駿河台シティのサービスワーカー：一度読み込んだファイルを iPad などに保存して、
// 次からは保存したものをすぐ使う（電波がなくても開ける）。新しい版は裏で取りに行って、次に開いたときに反映する。
// 地図の小窓の地理院タイル（別のサーバー）は保存しない。
const CACHE = 'suruga-dai-city-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      // ページ本体（index.html）は新しい版を優先、それ以外は保存した版をすぐ返す
      return req.mode === 'navigate' ? fresh.then((r) => r || cached) : cached || fresh;
    }),
  );
});
