import React, { useState, useEffect } from 'react';
import { Radio, Zap, ChevronRight, Volume2, VolumeX, ExternalLink, ArrowRight } from 'lucide-react';
import { NewsFlashItem } from '../types';

interface BreakingTickerProps {
  flashes: NewsFlashItem[];
  onOpenNewsTab: () => void;
  onAnalyzeFlash: (flash: NewsFlashItem) => void;
  audioAlertEnabled: boolean;
  onToggleAudio: () => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({
  flashes,
  onOpenNewsTab,
  onAnalyzeFlash,
  audioAlertEnabled,
  onToggleAudio,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Take top breaking or high-impact news
  const breakingItems = flashes.length > 0 ? flashes.slice(0, 8) : [];

  useEffect(() => {
    if (breakingItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [breakingItems.length]);

  if (breakingItems.length === 0) return null;

  const current = breakingItems[currentIndex] || breakingItems[0];

  return (
    <div className="bg-slate-950 border-y border-red-500/30 px-3 py-2 sm:px-4 shadow-sm relative overflow-hidden">
      {/* Subtle red glow effect on left */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-red-600/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Live Tag & Current Item */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex items-center space-x-1.5 shrink-0 bg-red-600/20 border border-red-500/40 px-2.5 py-1 rounded text-red-400 font-bold text-[11px] tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span>FLASH SQUAWK</span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono shrink-0 hidden sm:inline">
            {current.timeFormatted} ({current.timeAgo})
          </div>

          <div className="flex-1 min-w-0 flex items-center space-x-2">
            <p className="text-xs text-slate-200 font-medium truncate">
              {current.title}
            </p>

            {/* Affected Ticker Tag */}
            {current.affectedTickers.length > 0 && (
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px] font-mono shrink-0 border border-slate-700">
                ${current.affectedTickers[0]}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onAnalyzeFlash(current)}
            title="Analisis dampak headline ini dengan AI"
            className="flex items-center space-x-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-[11px] font-medium px-2.5 py-1 rounded transition cursor-pointer"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Analisis AI</span>
          </button>

          <button
            onClick={onToggleAudio}
            title={audioAlertEnabled ? 'Matikan suara alert flash' : 'Nyalakan suara alert flash'}
            className={`p-1 rounded border transition cursor-pointer ${
              audioAlertEnabled
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {audioAlertEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onOpenNewsTab}
            className="flex items-center space-x-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer border border-transparent hover:border-slate-700"
          >
            <span>Buka Feed Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
