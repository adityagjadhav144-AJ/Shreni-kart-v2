import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Sparkles, Smartphone, CheckCircle2, Globe } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '@/hooks/usePWAInstall';
import { useI18n } from '@/lib/i18n';
import { PWAInstallButton } from './PWAInstallButton';
import { cn } from '@/lib/utils';

export const PWAAppHeader: React.FC = () => {
  const { isInstalled, isStandalone } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const { currentLanguage, openLanguageModal } = useI18n();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-stone-900 text-stone-200 select-none text-[11px] font-medium tracking-tight px-4 py-1.5 flex items-center justify-between border-b border-stone-800/80">
      {/* Time & PWA Native App identity */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white tracking-normal">{timeStr || '9:41'}</span>
        <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 text-[9px] uppercase tracking-wider">
          PWA APP
        </span>
      </div>

      {/* Center: status */}
      <div className="flex items-center gap-1 text-stone-300">
        {isStandalone ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
            <CheckCircle2 className="size-3" /> Standalone
          </span>
        ) : (
          <span className="text-[10px] text-stone-400">
            Artisan Mode
          </span>
        )}
      </div>

      {/* Right: Language switcher, Connectivity & Install Action */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openLanguageModal}
          className="tap inline-flex items-center gap-1 rounded-md bg-stone-800 hover:bg-stone-700 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-stone-700/80 transition-colors"
          title="Change language (24 Indian languages)"
        >
          <Globe className="size-2.5 text-amber-400" />
          <span className="max-w-[65px] truncate">{currentLanguage.native}</span>
        </button>

        {isOnline ? (
          <span className="flex items-center gap-1 text-[10px] text-stone-400" title="Online: Cloud sync active">
            <Wifi className="size-3 text-emerald-400" />
            <span className="hidden sm:inline">Online</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-amber-400" title="Offline: Cached PWA storage active">
            <WifiOff className="size-3 text-amber-400" />
            <span>Offline</span>
          </span>
        )}

        {!isStandalone && (
          <PWAInstallButton variant="compact" />
        )}
      </div>
    </div>
  );
};
