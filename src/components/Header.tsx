import React, { useEffect, useState } from 'react';
import {
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { MarketAsset, MarketRegimeState } from '../types';

interface HeaderProps {
  assets: MarketAsset[];
  regime: MarketRegimeState;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenAiAnalyst: () => void;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
  lastSyncTime?: string;
  latencyMs?: number;
  flashMap?: Record<string, 'up' | 'down'>;
  isLiveConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  assets,
  regime,
  onRefresh,
  isRefreshing,
  onOpenAiAnalyst,
  autoRefresh = true,
  onToggleAutoRefresh,
  lastSyncTime,
  latencyMs = 120,
  flashMap = {},
  isLiveConnected = true,
}) => {
  const [timeState, setTimeState] = useState({
    ny: '',
    london: '',
    tokyo: '',
    jkt: '',
  });

  // Real-time financial clocks
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setTimeState({
        ny: now.toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        london: now.toLocaleTimeString('en-GB', {
          timeZone: 'Europe/London',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        tokyo: now.toLocaleTimeString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        jkt: now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter ticker assets
  const tickerAssets = assets.filter((a) =>
    ['dxy', 'eurusd', 'spx', 'xauusd', 'wti', 'btcusd'].includes(a.id)
  );

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Bar: Brand, Session Clocks, Regime Badge, Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                MacroPulse <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-medium">TERMINAL</span>
              </h1>
              <div className="flex items-center space-x-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                  isLiveConnected
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 shadow-sm shadow-emerald-950'
                    : 'bg-amber-950/90 text-amber-300 border-amber-700/80'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}></span>
                  <span className="font-semibold tracking-wider font-mono text-[10px]">REALTIME FEED</span>
                </span>
                {lastSyncTime && (
                  <span className="hidden xl:inline-block text-[10px] text-slate-400 font-mono">
                    • Sync: {lastSyncTime} ({latencyMs}ms)
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Fundamental, Makroekonomi, Mikroekonomi & Sentimen Global
            </p>
          </div>
        </div>

        {/* Global Financial Session Clocks */}
        <div className="hidden lg:flex items-center space-x-5 text-xs font-mono bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">SESSIONS:</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 font-sans">NY:</span>
            <span className="text-slate-200 font-semibold">{timeState.ny || '--:--'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 font-sans">LON:</span>
            <span className="text-slate-200 font-semibold">{timeState.london || '--:--'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 font-sans">TYO:</span>
            <span className="text-slate-200 font-semibold">{timeState.tokyo || '--:--'}</span>
          </div>
          <div className="flex items-center space-x-1 border-l border-slate-700 pl-3">
            <span className="text-cyan-400 font-sans">WIB:</span>
            <span className="text-cyan-300 font-semibold">{timeState.jkt || '--:--'}</span>
          </div>
        </div>

        {/* Status Regime Badge & Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Auto Refresh Stream Toggle */}
          {onToggleAutoRefresh && (
            <button
              id="btn-toggle-auto-stream"
              onClick={onToggleAutoRefresh}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-semibold border transition cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={autoRefresh ? 'Streaming realtime aktif (setiap 4 detik)' : 'Streaming realtime dijeda'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
              <span>{autoRefresh ? 'AUTO-STREAM (4S)' : 'STREAM PAUSED'}</span>
            </button>
          )}

          {/* Regime Indicator Badge */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium border ${
            regime.regime === 'RISK_ON'
              ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
              : regime.regime === 'RISK_OFF'
              ? 'bg-rose-950/70 border-rose-700/60 text-rose-300'
              : 'bg-amber-950/70 border-amber-700/60 text-amber-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span className="uppercase font-semibold tracking-wide">
              {regime.regime.replace('_', ' ')}
            </span>
            <span className="text-slate-400 text-[10px] hidden md:inline">
              (VIX {regime.vix.value})
            </span>
          </div>

          {/* AI Macro Co-Pilot Button */}
          <button
            id="btn-open-ai-analyst"
            onClick={onOpenAiAnalyst}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-md text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>AI Macro Analyst</span>
          </button>

          {/* Refresh Data Button */}
          <button
            id="btn-refresh-market-data"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Fetch Data Makro Realtime Sekarang"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Market Ticker Tape */}
      <div className="bg-slate-900/70 border-t border-slate-800/80 px-4 sm:px-6 py-1.5 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center space-x-6 min-w-max text-xs">
          <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>LIVE BENCHMARKS:</span>
            <span className="text-[10px] text-cyan-400/90 font-mono font-normal bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
              TradingView Live Feed (TVC • FX_IDC • OANDA • BINANCE)
            </span>
          </div>

          {tickerAssets.map((asset) => {
            const isPositive = asset.change24hPercent >= 0;
            const flash = flashMap[asset.id];
            return (
              <div
                key={asset.id}
                className={`flex items-center space-x-2 font-mono px-2.5 py-0.5 rounded transition-all duration-300 ${
                  flash === 'up'
                    ? 'bg-emerald-950/90 text-emerald-300 ring-1 ring-emerald-500 shadow-sm'
                    : flash === 'down'
                    ? 'bg-rose-950/90 text-rose-300 ring-1 ring-rose-500 shadow-sm'
                    : 'hover:bg-slate-800/50 text-slate-200'
                }`}
              >
                <span className="font-bold text-slate-300">{asset.symbol}</span>
                <span className="font-medium text-slate-100">
                  {asset.currencyPrefix}
                  {asset.price.toLocaleString(undefined, {
                    minimumFractionDigits: asset.decimals,
                    maximumFractionDigits: asset.decimals,
                  })}
                </span>
                <span
                  className={`flex items-center text-[11px] font-semibold ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                  )}
                  {isPositive ? '+' : ''}
                  {asset.change24hPercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
