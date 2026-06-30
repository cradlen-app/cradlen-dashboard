'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// SSR-safe "are we on the client yet" flag without setState-in-effect.
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * In-app install affordance. On Chromium/Android/desktop it captures the
 * `beforeinstallprompt` event and triggers the native prompt. On iOS Safari
 * (which has no such event) it shows manual "Add to Home Screen" instructions.
 * Renders nothing once the app is already installed (standalone display mode).
 */
export function InstallPrompt() {
  const isClient = useIsClient();
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setCanInstall(false);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!isClient) return null;

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes this non-standard flag when launched from home screen.
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true;
  if (standalone) return null;

  const isIOS =
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  // Nothing to offer: not installable via prompt and not iOS.
  if (!canInstall && !isIOS) return null;

  async function handleClick() {
    if (canInstall && deferred.current) {
      await deferred.current.prompt();
      await deferred.current.userChoice;
      deferred.current = null;
      setCanInstall(false);
      return;
    }
    if (isIOS) setShowIOSHelp((v) => !v);
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        aria-label="Install app"
        className="flex size-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-primary/8 hover:text-brand-primary"
      >
        <Download className="size-5" />
      </button>

      {showIOSHelp && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowIOSHelp(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-black">
                Install Cradlen Admin
              </span>
              <button
                onClick={() => setShowIOSHelp(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-brand-primary"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-gray-600">
              Tap the Share icon
              <Share className="inline size-4 text-brand-primary" />
              then choose{' '}
              <span className="font-medium">Add to Home Screen</span>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
