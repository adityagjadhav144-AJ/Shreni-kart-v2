import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'pill' | 'banner' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className,
  variant = 'pill',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running in standalone mode, display verified PWA badge
  if (isInstalled) {
    if (variant === 'compact') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/25',
            className
          )}
          title="Running in Standalone PWA Mode"
        >
          <Check className="size-3 text-emerald-600" />
          PWA Active
        </span>
      );
    }
    return null;
  }

  const handleTrigger = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        toast.success('ShreniKart PWA installed to your device!');
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleTrigger}
          className={cn(
            'tap inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-amber-700 transition-colors',
            className
          )}
          title="Install as PWA App"
        >
          <Download className="size-3" />
          <span>Install PWA</span>
        </button>
      ) : variant === 'full' ? (
        <button
          type="button"
          onClick={handleTrigger}
          className={cn(
            'tap flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-600 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:from-amber-800 hover:to-amber-700 transition-all',
            className
          )}
        >
          <Download className="size-4" />
          Install ShreniKart PWA App
        </button>
      ) : (
        <button
          type="button"
          onClick={handleTrigger}
          className={cn(
            'tap inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 transition-all',
            className
          )}
        >
          <Smartphone className="size-3.5 text-amber-700 dark:text-amber-300" />
          <span>Install PWA App</span>
        </button>
      )}

      {/* PWA Install Instructions Modal (for iOS or browsers without native prompt) */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-border">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src="/pwa-192x192.png"
                alt="ShreniKart App Icon"
                className="size-12 rounded-2xl shadow-md"
              />
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Install ShreniKart PWA
                </h3>
                <p className="text-xs text-muted-foreground">
                  Native app experience with offline capability
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5 text-sm text-foreground/90">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3">
                    <Share className="size-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      1. Tap the <strong>Share</strong> icon in your Safari bottom bar.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3">
                    <PlusSquare className="size-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      2. Scroll down and tap <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3">
                    <Smartphone className="size-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      3. Launch <strong>ShreniKart</strong> from your home screen as a fullscreen app.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3">
                    <Download className="size-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      1. Click the <strong>Install</strong> icon in your browser address bar (top right on Chrome / Edge).
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3">
                    <Smartphone className="size-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      2. Or click the browser menu (⋮) and select <strong>Install ShreniKart</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                Got It, Open as PWA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
