/**
 * Service Worker Registration
 * Registers the service worker for offline support and caching
 */

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  // Service workers break local dev/HMR if stale caches survive between ports.
  // In development, force-unregister and clear CRM caches instead of registering.
  if (import.meta.env.DEV) {
    void unregisterServiceWorker({ clearCaches: true });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);

        // Check for updates periodically
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("New service worker available. Refresh to update.");
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

export function unregisterServiceWorker({
  clearCaches = false,
}: {
  clearCaches?: boolean;
} = {}) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  Promise.resolve()
    .then(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if (clearCaches && "caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith("crm-"))
            .map((name) => caches.delete(name)),
        );
      }
      console.log("Service Worker unregistered");
    })
    .catch((error) => {
      console.error("Service Worker unregistration failed:", error);
    });
}
