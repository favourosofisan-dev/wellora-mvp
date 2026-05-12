if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    const hostname = window.location.hostname;
    const isLocalDevHost = hostname === "127.0.0.1" || hostname === "localhost";

    if (isLocalDevHost) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        registrations.forEach(function (registration) {
          registration.unregister();
        });
      }).catch(function () {
      });

      if ("caches" in window) {
        caches.keys().then(function (cacheNames) {
          cacheNames.forEach(function (cacheName) {
            caches.delete(cacheName);
          });
        }).catch(function () {
        });
      }

      return;
    }

    navigator.serviceWorker.register("/service-worker.js").catch(function (error) {
      console.error("Service worker registration failed:", error);
    });
  });
}
