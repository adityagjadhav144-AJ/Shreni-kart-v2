import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-stone-900/95 px-4 py-2 text-xs font-semibold text-amber-400 shadow-2xl border border-amber-500/40 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
      <span className="relative flex size-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full size-2 bg-amber-500"></span>
      </span>
      <WifiOff className="size-3.5 text-amber-400" />
      <span>PWA Offline Mode — Local Cache Active</span>
    </div>
  );
};
