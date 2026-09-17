import React, { useState } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { PWAInstallButton } from './PWAInstallButton';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled, isStandalone } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Do not show banner if already running in installed standalone mode or user dismissed
  if (isStandalone || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="mx-4 mt-3 rounded-2xl bg-gradient-to-r from-amber-900/90 to-amber-800/90 p-3.5 text-white shadow-card backdrop-blur-md border border-amber-500/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <img
            src="/pwa-192x192.png"
            alt="Shreni PWA Emblem"
            className="size-10 shrink-0 rounded-xl shadow-md border border-amber-300/30 object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Install ShreniKart PWA
              </h4>
              <span className="rounded bg-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-100">
                App Only
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-amber-100/90">
              Install to your home screen or desktop for offline access, instant voice assistant, and zero browser bars.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-300/80 hover:text-white p-1"
          aria-label="Dismiss banner"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <PWAInstallButton variant="pill" />
      </div>
    </div>
  );
};
