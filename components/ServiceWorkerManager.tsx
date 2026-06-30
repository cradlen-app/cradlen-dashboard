'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Registers the service worker (production only) and surfaces a small toast
 * when a new version is waiting, so admins are never stuck on a stale build.
 * Clicking "Reload" activates the waiting worker and refreshes the page.
 */
export function ServiceWorkerManager() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Don't register in dev: it caches aggressively and fights HMR.
    if (process.env.NODE_ENV !== 'production') return;

    let cancelled = false;

    const onControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    );

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        if (cancelled) return;

        // A worker may already be waiting from a previous visit.
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaiting(reg.waiting);
        }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setWaiting(reg.waiting);
            }
          });
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      );
    };
  }, []);

  if (!waiting) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
        <span className="text-sm text-brand-black">
          A new version is available.
        </span>
        <button
          onClick={() => waiting.postMessage('SKIP_WAITING')}
          className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
