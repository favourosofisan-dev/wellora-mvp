const CACHE_NAME = "wellora-pwa-v6";
const APP_SHELL_FILES = [
  "/",
  "/index.html",
  "/home.html",
  "/login.html",
  "/signup.html",
  "/category.html",
  "/exercise.html",
  "/progress.html",
  "/profile.html",
  "/onboarding.html",
  "/forgot-password.html",
  "/reset-password-sent.html",
  "/privacy.html",
  "/terms.html",
  "/disclaimer.html",
  "/emergency.html",
  "/completion.html",
  "/reminders.html",
  "/reports.html",
  "/splash.html",
  "/styles.css",
  "/layout.css",
  "/manifest.json",
  "/pwa.js",
  "/wellora-flow.js",
  "/translations.js",
  "/legal-footer.js",
  "/wellora-guide.js",
  "/supabase-config.js",
  "/reminder-service.js",
  "/image/wellora-logo-192.png",
  "/image/wellora-logo-512.png"
];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.allSettled(
    APP_SHELL_FILES.map(async function (path) {
      const response = await fetch(path, { cache: "no-cache" });

      if (!response || !response.ok) {
        throw new Error("Failed to cache " + path);
      }

      await cache.put(path, response.clone());
    })
  );
}

self.addEventListener("install", function (event) {
  event.waitUntil(cacheAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }

          return Promise.resolve();
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isAppCodeRequest = isSameOrigin && (
    requestUrl.pathname.endsWith(".js") ||
    requestUrl.pathname.endsWith(".css") ||
    requestUrl.pathname.endsWith(".json") ||
    requestUrl.pathname.endsWith(".html")
  );

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).then(function (networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        }

        return networkResponse;
      }).catch(function () {
        return caches.match(event.request).then(function (cachedResponse) {
          return cachedResponse || caches.match("/index.html");
        });
      })
    );

    return;
  }

  if (isAppCodeRequest) {
    event.respondWith(
      fetch(event.request).then(function (networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        }

        return networkResponse;
      }).catch(function () {
        return caches.match(event.request);
      })
    );

    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(function (networkResponse) {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        if (isSameOrigin) {
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        }

        return networkResponse;
      }).catch(function () {
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }

        return caches.match(event.request);
      });
    })
  );
});
