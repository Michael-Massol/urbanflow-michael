"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let active = true;
    let updateRegistration: (() => void) | undefined;
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (!active) return;
      if (registration.waiting) setWaitingWorker(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        installingWorker?.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(installingWorker);
          }
        });
      });
      updateRegistration = () => void registration.update().catch(() => undefined);
      window.addEventListener("online", updateRegistration);
    }).catch(() => {
      // The application remains usable when service worker registration is unavailable.
    });
    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", reload);
    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener("controllerchange", reload);
      if (updateRegistration) window.removeEventListener("online", updateRegistration);
    };
  }, []);

  if (!waitingWorker) return null;
  return (
    <aside className="update-banner" aria-live="polite">
      <span>Une mise à jour d’UrbanFlow est disponible.</span>
      <div className="actions update-actions">
        <button className="button button-small" type="button" onClick={() => waitingWorker.postMessage({ type: "SKIP_WAITING" })}>Mettre à jour</button>
        <button className="button button-secondary button-small" type="button" onClick={() => setWaitingWorker(null)}>Plus tard</button>
      </div>
    </aside>
  );
}
