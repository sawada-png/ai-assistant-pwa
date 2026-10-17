
const CACHE_NAME = "verity-shell-v1";

const APP_FILES = [
    "/",
    "/static/assistant/style.css",
    "/static/assistant/app.js",
    "/static/assistant/manifest.json",
    "/static/assistant/verity-icon.svg"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    if (url.pathname === "/api/chat/") {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async () => {
                const cachedPage = await caches.match("/");
                if (cachedPage) return cachedPage;

                return new Response(
                    "Verity is offline. Reconnect to use the AI chat.",
                    {
                        status: 503,
                        headers: { "Content-Type": "text/plain; charset=utf-8" }
                    }
                );
            })
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;

            return fetch(request).then(response => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return response;
            });
        })
    );
});
