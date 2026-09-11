import React, { useState } from 'react';
import {
  DollarSign,
  BarChart3,
  Scale,
  Coins,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  ExternalLink,
  Crosshair,
  AlertTriangle,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { AssetCategory, MarketAsset } from '../types';
import { DivergenceMonitor, DivergenceMatrixModal } from './DivergenceMonitor';

interface AssetOverviewProps {
  assets: MarketAsset[];
  selectedCategory: AssetCategory | 'all';
  onSelectCategory: (cat: AssetCategory | 'all') => void;
  onAnalyzeAssetWithAi: (asset: MarketAsset) => void;
  flashMap?: Record<string, 'up' | 'down'>;
  lastSyncTime?: string;
  isLive?: boolean;
}

export const AssetOverview: React.FC<AssetOverviewProps> = ({
  assets,
  selectedCategory,
  onSelectCategory,
  onAnalyzeAssetWithAi,
  flashMap = {},
  lastSyncTime,
  isLive = true,
}) => {
  const [activeAssetId, setActiveAssetId] = useState<string | null>(assets[0]?.id || null);
  const [showOnlyDivergence, setShowOnlyDivergence] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  const baseFiltered =
    selectedCategory === 'all'
      ? assets
      : assets.filter((a) => a.category === selectedCategory);

  const filteredAssets = showOnlyDivergence
    ? baseFiltered.filter((a) => a.divergence?.isAlert)
    : baseFiltered;

  const allDivergentAssets = assets.filter((a) => a.divergence?.isAlert);
  const criticalCount = assets.filter((a) => a.divergence?.severity === 'CRITICAL').length;

  const activeAsset = assets.find((a) => a.id === activeAssetId) || filteredAssets[0] || assets[0];

  // Helper to render responsive SVG sparkline
  const renderSparkline = (data: number[], isPositive: boolean) => {
    if (!data || data.length === 0) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 120;
    const height = 36;
    const padding = 2;

    const points = data
      .map((val, idx) => {
        const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
        const y =
          height - padding - ((val - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#10b981' : '#f43f5e';
    const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

    const areaPoints = `${points} ${width - padding},${height} ${padding},${height}`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polygon points={areaPoints} fill={fillColor} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Fundamental Asset Matrix & Valuasi Mikro/Makro
            </h2>
            {isLive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mr-1.5"></span>
                LIVE REALTIME
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Analisis pendorong fundamental, sentimen institusional (COT), dan harga streaming real-time
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua Aset
          </button>
          <button
            onClick={() => onSelectCategory('forex')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              selectedCategory === 'forex'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Forex
          </button>
          <button
            onClick={() => onSelectCategory('indices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              selectedCategory === 'indices'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Indeks
          </button>
          <button
            onClick={() => onSelectCategory('commodities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              selectedCategory === 'commodities'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Komoditas
          </button>
          <button
            onClick={() => onSelectCategory('bitcoin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              selectedCategory === 'bitcoin'
                ? 'bg-orange-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Bitcoin
          </button>
        </div>
      </div>

      {/* Real-Time Divergence Tracker Alert & Radar Bar */}
      <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="relative flex items-center justify-center p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Crosshair className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  Real-Time Divergence Tracker
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {allDivergentAssets.length} Aset Berdeviasi Signifikan
                  {criticalCount > 0 && (
                    <span className="text-rose-400 font-bold ml-1">({criticalCount} Kritis)</span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Peringatan anomali harga terhadap 20-Day Moving Average & decoupling terhadap indeks acuan terkorelasi
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOnlyDivergence((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                showOnlyDivergence
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{showOnlyDivergence ? 'Tampilkan Semua' : `Hanya Divergensi (${allDivergentAssets.length})`}</span>
            </button>

            <button
              onClick={() => setIsMatrixModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
              title="Buka matriks perbandingan seluruh aset yang diurutkan berdasarkan deviasi"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Matriks Divergensi</span>
            </button>
          </div>
        </div>

        {/* Quick Clickable Divergence Radar Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Radar Aktif:
          </span>
          {allDivergentAssets.map((divAsset) => {
            const isSelected = activeAssetId === divAsset.id;
            const isCrit = divAsset.divergence?.severity === 'CRITICAL';
            const diffPct = divAsset.divergence?.ma20DiffPct || 0;
            const statusLabel =
              divAsset.divergence?.correlatedIndex.status !== 'ALIGNED'
                ? `Decoupled vs ${divAsset.divergence?.correlatedIndex.targetSymbol}`
                : `${diffPct > 0 ? '+' : ''}${diffPct.toFixed(1)}% vs MA20`;

            return (
              <button
                key={divAsset.id}
                onClick={() => {
                  setActiveAssetId(divAsset.id);
                  if (selectedCategory !== 'all' && divAsset.category !== selectedCategory) {
                    onSelectCategory('all');
                  }
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow ring-1 ring-cyan-500/50'
                    : isCrit
                    ? 'bg-rose-950/70 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800/70 hover:bg-amber-900/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isCrit ? 'bg-rose-400 animate-ping' : 'bg-amber-400'}`} />
                <strong>{divAsset.symbol}</strong>
                <span className="text-[10px] opacity-85">({statusLabel})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Left Column Cards list, Right Column Detailed Fundamental Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List of Assets (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
          {filteredAssets.map((asset) => {
            const isPositive = asset.change24hPercent >= 0;
            const isSelected = activeAsset?.id === asset.id;
            const flash = flashMap[asset.id];
            const hasDivergenceAlert = asset.divergence?.isAlert;

            return (
              <div
                key={asset.id}
                onClick={() => setActiveAssetId(asset.id)}
                className={`p-3.5 rounded-lg border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : flash === 'up'
                    ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-400 shadow-md'
                    : flash === 'down'
                    ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-400 shadow-md'
                    : hasDivergenceAlert
                    ? asset.divergence?.severity === 'CRITICAL'
                      ? 'bg-rose-950/20 border-rose-700/80 shadow-md shadow-rose-950/30 hover:bg-rose-900/30'
                      : 'bg-amber-950/20 border-amber-700/80 shadow-md shadow-amber-950/20 hover:bg-amber-900/30'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  {/* Symbol & Name */}
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="font-bold text-slate-100 font-mono text-sm">
                        {asset.symbol}
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                          asset.fundamentalBias === 'BULLISH'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : asset.fundamentalBias === 'BEARISH'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {asset.fundamentalBias}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                      <span className="truncate">{asset.name}</span>
                      {asset.broker && (
                        <span className="text-[9px] font-mono font-medium text-emerald-400/90 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/60 shrink-0">
                          {asset.broker}
                        </span>
                      )}
                      {asset.tradingviewSymbol && (
                        <span className="text-[9px] font-mono text-cyan-400/90 bg-slate-900/90 px-1 py-0.2 rounded border border-slate-800 shrink-0">
                          {asset.tradingviewSymbol}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sparkline & Price */}
                  <div className="flex items-center space-x-3">
                    <div className="hidden sm:block">
                      {renderSparkline(asset.sparkline, isPositive)}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {flash && (
                          <span className={`w-1.5 h-1.5 rounded-full ${flash === 'up' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400 animate-ping'}`} />
                        )}
                        <div className={`font-mono font-bold text-sm transition-colors ${
                          flash === 'up' ? 'text-emerald-300' : flash === 'down' ? 'text-rose-300' : 'text-slate-100'
                        }`}>
                          {asset.currencyPrefix}
                          {asset.price.toLocaleString(undefined, {
                            minimumFractionDigits: asset.decimals,
                            maximumFractionDigits: asset.decimals,
                          })}
                        </div>
                      </div>
                      <div
                        className={`text-xs font-mono font-semibold flex items-center justify-end ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {asset.change24hPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divergence alert badge in card if alert active */}
                {hasDivergenceAlert && asset.divergence && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80">
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        asset.divergence.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                      title={asset.divergence.alertHeadline}
                    >
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      DIV MA20: {asset.divergence.ma20DiffPct > 0 ? '+' : ''}
                      {asset.divergence.ma20DiffPct.toFixed(1)}%
                    </span>

                    {asset.divergence.correlatedIndex.status !== 'ALIGNED' && (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-800"
                        title={`Decoupling vs ${asset.divergence.correlatedIndex.targetSymbol}`}
                      >
                        <Crosshair className="w-2.5 h-2.5 text-purple-400" />
                        {asset.divergence.correlatedIndex.status === 'DECOUPLED'
                          ? 'DECOUPLED'
                          : asset.divergence.correlatedIndex.status.replace('_', ' ')}{' '}
                        vs {asset.divergence.correlatedIndex.targetSymbol}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Detail Pane: Deep Dive Fundamental Drivers (7 cols) */}
        {activeAsset && (
          <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              {/* Asset Header in Detail Card */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-xl font-bold font-mono text-slate-100">
                      {activeAsset.symbol}
                    </h3>
                    <span className="text-xs text-slate-400 font-sans">
                      ({activeAsset.name})
                    </span>
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded border uppercase ${
                        activeAsset.fundamentalBias === 'BULLISH'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : activeAsset.fundamentalBias === 'BEARISH'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                    >
                      Bias: {activeAsset.fundamentalBias} ({activeAsset.biasConfidence}% Keyakinan)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center space-x-4 text-xs font-mono text-slate-400 mt-1">
                    <span>
                      24h High:{' '}
                      <strong className="text-slate-200">
                        {activeAsset.currencyPrefix}
                        {activeAsset.high24h}
                      </strong>
                    </span>
                    <span>
                      24h Low:{' '}
                      <strong className="text-slate-200">
                        {activeAsset.currencyPrefix}
                        {activeAsset.low24h}
                      </strong>
                    </span>
                    {activeAsset.bid !== undefined && (
                      <span>
                        Bid:{' '}
                        <strong className="text-emerald-300">
                          {activeAsset.currencyPrefix}
                          {activeAsset.bid}
                        </strong>
                      </span>
                    )}
                    {activeAsset.ask !== undefined && (
                      <span>
                        Ask:{' '}
                        <strong className="text-rose-300">
                          {activeAsset.currencyPrefix}
                          {activeAsset.ask}
                        </strong>
                      </span>
                    )}
                    {activeAsset.spread !== undefined && (
                      <span>
                        Spread:{' '}
                        <strong className="text-cyan-300">
                          {activeAsset.spread}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {activeAsset.broker && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-[11px] font-mono text-emerald-300">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Broker Feed: <strong>{activeAsset.broker}</strong>
                        {activeAsset.instrumentType && (
                          <span className="text-emerald-400/80 font-normal">({activeAsset.instrumentType})</span>
                        )}
                      </span>
                    )}
                    {activeAsset.tradingviewSymbol && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-cyan-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        TradingView: <strong>{activeAsset.tradingviewSymbol}</strong>
                      </span>
                    )}
                    {activeAsset.tradingviewSymbol && (
                      <a
                        href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(activeAsset.tradingviewSymbol)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-400 hover:text-cyan-300 underline inline-flex items-center gap-1 font-medium transition-colors"
                        title="Buka live chart di TradingView untuk mencocokkan harga secara langsung"
                      >
                        Buka di TradingView <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* AI Deep Dive Trigger Button */}
                <button
                  id={`btn-ai-analyze-${activeAsset.id}`}
                  onClick={() => onAnalyzeAssetWithAi(activeAsset)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-950 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Analisis AI {activeAsset.symbol}</span>
                </button>
              </div>

              {/* CFD Broker Real-Time Feeds Comparison */}
              {activeAsset.brokerQuotes && activeAsset.brokerQuotes.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-cyan-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Perbandingan Broker CFD Real-Time (TradingView Live Feed)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Sub-second tick streaming
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {activeAsset.brokerQuotes.map((bq, i) => (
                      <div
                        key={i}
                        className="bg-slate-950/90 border border-slate-800 rounded p-2.5 text-xs hover:border-cyan-700/60 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-slate-200">{bq.broker}</span>
                          <a
                            href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(bq.symbol)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-0.5"
                          >
                            {bq.symbol} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-mono font-bold text-slate-100 text-sm">
                            {activeAsset.currencyPrefix}
                            {bq.price.toLocaleString(undefined, {
                              minimumFractionDigits: activeAsset.decimals,
                              maximumFractionDigits: activeAsset.decimals,
                            })}
                          </span>
                          <span
                            className={`font-mono text-[11px] font-semibold ${
                              bq.change24hPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {bq.change24hPercent >= 0 ? '+' : ''}
                            {bq.change24hPercent.toFixed(2)}%
                          </span>
                        </div>
                        {(bq.bid !== undefined || bq.ask !== undefined) && (
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/80">
                            <span>
                              Bid: <strong className="text-slate-300">{bq.bid ?? '-'}</strong>
                            </span>
                            <span>
                              Ask: <strong className="text-slate-300">{bq.ask ?? '-'}</strong>
                            </span>
                            {bq.spread !== undefined && (
                              <span className="text-cyan-400 font-semibold">
                                Spr: {bq.spread}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-Time Divergence Tracker & Mean Reversion Panel */}
              <DivergenceMonitor
                asset={activeAsset}
                allAssets={assets}
                onAnalyzeDivergenceWithAi={onAnalyzeAssetWithAi}
                onSelectAsset={(id) => {
                  setActiveAssetId(id);
                  if (selectedCategory !== 'all') {
                    const target = assets.find((a) => a.id === id);
                    if (target && target.category !== selectedCategory) {
                      onSelectCategory('all');
                    }
                  }
                }}
              />

              {/* Fundamental Catalysts List */}
              <div className="mt-4 mb-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Katalis Fundamental Utama (Key Drivers)
                </h4>
                <div className="space-y-1.5">
                  {activeAsset.keyCatalysts.map((cat, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-300 bg-slate-900/90 border border-slate-800/80 px-3 py-2 rounded-md flex items-start space-x-2"
                    >
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Macro & Micro Drivers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Macro Factors */}
                <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-3">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Info className="w-3 h-3 text-cyan-400" />
                    Faktor Makroekonomi
                  </h5>
                  <div className="space-y-2">
                    {activeAsset.macroDrivers.map((driver, idx) => (
                      <div key={idx} className="text-xs border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-slate-200">
                            {driver.factor}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              driver.impact === 'positive'
                                ? 'bg-emerald-950 text-emerald-400'
                                : driver.impact === 'negative'
                                ? 'bg-rose-950 text-rose-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {driver.impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {driver.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Micro & Valuation Metrics */}
                <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-3">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    Mikroekonomi & Metrik Valuasi
                  </h5>
                  <div className="space-y-2">
                    {activeAsset.microDrivers.map((micro, idx) => (
                      <div key={idx} className="text-xs border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-medium text-slate-400">
                            {micro.label}
                          </span>
                          <span className="font-mono font-bold text-cyan-300">
                            {micro.value}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {micro.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Institutional Positioning / COT Strip */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2 mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  COT / Posisi Institusi:
                </span>
                <span className="font-mono font-semibold text-emerald-400">
                  {activeAsset.institutionalPositioning.cotNetSpeculative}
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Arus Mingguan:{' '}
                <span className="text-slate-200">
                  {activeAsset.institutionalPositioning.weeklyFlowTrend}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Real-Time Cross-Asset Divergence Matrix Modal */}
      <DivergenceMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        assets={assets}
        onSelectAsset={(id) => {
          setActiveAssetId(id);
          if (selectedCategory !== 'all') {
            const target = assets.find((a) => a.id === id);
            if (target && target.category !== selectedCategory) {
              onSelectCategory('all');
            }
          }
        }}
        onAnalyzeAssetWithAi={onAnalyzeAssetWithAi}
      />
    </div>
  );
};
