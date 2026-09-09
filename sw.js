/* ミルトン道場 — オフライン用サービスワーカー
   外部サーバーとは一切やり取りしない。このサイト内のファイルだけを、
   この端末のブラウザに保存して、電波がないときに使う。 */

const CACHE = "milton-dojo-v1";

/* 最初に保存しておくファイル */
const ASSETS = [
  "./",
  "./index.html",
  "./renshukai.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ネットワーク優先。つながるときは必ず最新を取りに行き、
   ついでにキャッシュを更新する。つながらないときだけ保存済みを返す。
   こうしておくと、GitHubにファイルを上げ直した内容がすぐ反映される。 */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => {
          if (hit) return hit;
          if (req.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        })
      )
  );
});
