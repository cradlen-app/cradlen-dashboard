'use client';

import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { postAction } from '@/lib/api';
import { Switch } from '@/components/ui';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Convert a base64url VAPID key into the Uint8Array the Push API expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

type Status = 'loading' | 'unsupported' | 'ready';

/**
 * Settings card to enable/disable Web Push on this device. Subscribes via the
 * Push API and registers the subscription with cradlen-api (through the proxy);
 * the subscription is per-device, so the toggle reflects only this browser.
 */
export function PushNotificationsCard() {
  const [status, setStatus] = useState<Status>('loading');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window &&
        Boolean(VAPID_PUBLIC_KEY);
      if (!supported) {
        if (!cancelled) setStatus('unsupported');
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (!cancelled) {
        setSubscribed(Boolean(sub));
        setStatus('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError(
          'Notifications are blocked for this site. Enable them in your browser settings, then try again.',
        );
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none',
      });
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
      });
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      try {
        await postAction('admin/push/subscribe', {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
      } catch (serverError) {
        // The browser subscription was created before the server registered it;
        // roll it back so we don't leave an orphan the backend never knows about.
        await sub.unsubscribe().catch(() => undefined);
        throw serverError;
      }
      setSubscribed(true);
    } catch {
      setError('Could not enable push notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        // Best-effort server cleanup — tolerate a missing/unreachable endpoint
        // (e.g. push not deployed) so turning push off never gets stuck. The
        // backend prunes dead endpoints on its next send anyway.
        await postAction('admin/push/unsubscribe', {
          endpoint: sub.endpoint,
        }).catch(() => undefined);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setError('Could not disable push notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
            <BellRing className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-brand-black">
              Push notifications
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Get alerts on this device for new signups, payments, and plan
              changes — even when the dashboard is closed.
            </p>
          </div>
        </div>

        {status === 'ready' && (
          <div className="mt-1">
            <Switch
              checked={subscribed}
              disabled={busy}
              aria-label="Push notifications"
              onChange={(next) => (next ? enable() : disable())}
            />
          </div>
        )}
      </div>

      {status === 'unsupported' && (
        <p className="mt-3 text-sm text-gray-400">
          This browser doesn&apos;t support push notifications, or push is not
          configured.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
