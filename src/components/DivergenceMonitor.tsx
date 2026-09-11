import React from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldAlert,
  Crosshair,
  SlidersHorizontal,
  X,
  ExternalLink,
} from 'lucide-react';
import { MarketAsset } from '../types';

interface DivergenceMonitorProps {
  asset: MarketAsset;
  allAssets: MarketAsset[];
  onAnalyzeDivergenceWithAi: (asset: MarketAsset) => void;
  onSelectAsset?: (assetId: string) => void;
}

export const DivergenceMonitor: React.FC<DivergenceMonitorProps> = ({
  asset,
  allAssets,
  onAnalyzeDivergenceWithAi,
  onSelectAsset,
}) => {
  const div = asset.divergence;
  if (!div) return null;

  const isAlert = div.isAlert;
  const ma20Diff = div.ma20DiffPct;
  const correlated = div.correlatedIndex;

  // Find target correlated asset for quick comparison
  const targetAsset = allAssets.find((a) => a.id === correlated.targetId);

  // Position on deviation bar (-7% to +7% mapped to 0% to 100%)
  const clampDiff = Math.max(-7, Math.min(7, ma20Diff));
  const pointerPercent = ((clampDiff + 7) / 14) * 100;

  return (
    <div
      className={`rounded-xl border transition-all duration-300 p-4 mb-4 ${
        isAlert
          ? div.severity === 'CRITICAL'
            ? 'bg-rose-950/20 border-rose-600/80 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
            : 'bg-amber-950/20 border-amber-600/80 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/30'
          : 'bg-slate-900/90 border-slate-800'
      }`}
    >
      {/* Header bar of the Divergence Monitor */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div
            className={`p-1.5 rounded-lg ${
              isAlert
                ? div.severity === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-amber-500/20 text-amber-300'
                : 'bg-cyan-500/20 text-cyan-300'
            }`}
          >
            <Crosshair className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Real-Time Divergence Tracker
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded border ${
                  div.severity === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                    : div.severity === 'HIGH'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : div.severity === 'MODERATE'
                    ? 'bg-blue-950 text-blue-300 border-blue-700'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                STATUS: {div.severity}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deviasi harga terhadap Moving Average 20-Hari & Decoupling Indeks Terkorelasi
            </p>
          </div>
        </div>

        {/* AI Analyze Divergence Button */}
        <button
          onClick={() => onAnalyzeDivergenceWithAi(asset)}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-md text-[11px] font-semibold shadow transition cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-cyan-200" />
          <span>Analisis Divergensi AI</span>
        </button>
      </div>

      {/* Active Alert Banner if Divergence Exceeds Normal Threshold */}
      {isAlert && (
        <div
          className={`mt-3 p-2.5 rounded-lg border flex items-start space-x-2.5 text-xs ${
            div.severity === 'CRITICAL'
              ? 'bg-rose-950/60 border-rose-700/80 text-rose-200'
              : 'bg-amber-950/60 border-amber-700/80 text-amber-200'
          }`}
        >
          <AlertTriangle
            className={`w-4 h-4 mt-0.5 shrink-0 ${
              div.severity === 'CRITICAL' ? 'text-rose-400 animate-bounce' : 'text-amber-400'
            }`}
          />
          <div className="flex-1">
            <span className="font-bold">{div.alertHeadline}</span>
            <span className="block text-[11px] opacity-90 mt-0.5">
              {div.meanReversionBias === 'SHORT_PULLBACK'
                ? 'Harga berada jauh di atas rerata statistik 20-hari. Waspadai potensi mean reversion pullback atau exhaustion rally.'
                : div.meanReversionBias === 'LONG_BOUNCE'
                ? 'Harga berada jauh di bawah rerata statistik 20-hari. Terdapat potensi mean reversion relief bounce secara teknikal.'
                : 'Penyimpangan signifikan dari hubungan korelasi historis benchmark makro.'}
            </span>
          </div>
        </div>
      )}

      {/* Grid: 20-Day MA Deviation on Left, Benchmark Divergence on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5">
        {/* Module 1: 20-Day Moving Average Divergence Gauge */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Deviasi 20-Day Moving Average (MA20)
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                div.ma20Status.includes('OVERBOUGHT')
                  ? 'bg-rose-950 text-rose-400 border-rose-800'
                  : div.ma20Status.includes('OVERSOLD')
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {div.ma20Status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Live vs MA20</span>
              <div className="font-mono text-xs">
                <span className="font-bold text-slate-100">
                  {asset.currencyPrefix}
                  {asset.price.toLocaleString(undefined, {
                    minimumFractionDigits: asset.decimals,
                    maximumFractionDigits: asset.decimals,
                  })}
                </span>
                <span className="text-slate-500 mx-1.5">/</span>
                <span className="text-slate-400">
                  MA20:{' '}
                  {div.ma20.toLocaleString(undefined, {
                    minimumFractionDigits: asset.decimals,
                    maximumFractionDigits: asset.decimals,
                  })}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Spread MA20</span>
              <span
                className={`text-sm font-mono font-bold ${
                  ma20Diff > 0
                    ? 'text-rose-400'
                    : ma20Diff < 0
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                {ma20Diff > 0 ? '+' : ''}
                {ma20Diff.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Visual Deviation Gauge Bar */}
          <div className="mt-3 pt-1">
            <div className="relative h-2.5 bg-slate-800 rounded-full overflow-visible">
              {/* Center 0% Reference */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400/80 z-10"></div>
              {/* Oversold zone (-7% to -2.5%) */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-emerald-500/20 rounded-l-full"
                style={{ width: '32.1%' }}
              ></div>
              {/* Neutral zone (-2.5% to +2.5%) */}
              <div
                className="absolute top-0 bottom-0 left-[32.1%] bg-cyan-500/20"
                style={{ width: '35.8%' }}
              ></div>
              {/* Overbought zone (+2.5% to +7%) */}
              <div
                className="absolute top-0 bottom-0 right-0 bg-rose-500/20 rounded-r-full"
                style={{ width: '32.1%' }}
              ></div>

              {/* Pin Indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md z-20 transition-all duration-300"
                style={{
                  left: `${pointerPercent}%`,
                  backgroundColor:
                    ma20Diff > 2.5 ? '#f43f5e' : ma20Diff < -2.5 ? '#10b981' : '#06b6d4',
                }}
                title={`Deviasi: ${ma20Diff.toFixed(2)}%`}
              />
            </div>

            <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1.5">
              <span className="text-emerald-400">-5.0% Oversold</span>
              <span className="text-slate-400">0.0% MA20</span>
              <span className="text-rose-400">+5.0% Overbought</span>
            </div>
          </div>
        </div>

        {/* Module 2: Correlated Major Index Divergence */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Divergensi vs Indeks Terkorelasi
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  correlated.status === 'DECOUPLED'
                    ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                    : correlated.status === 'BEARISH_DIVERGENCE'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : correlated.status === 'BULLISH_DIVERGENCE'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {correlated.status.replace('_', ' ')}
              </span>
            </div>

            {/* Benchmark Details */}
            <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-slate-800/70">
              <div>
                <span className="text-slate-400 text-[11px]">Benchmark: </span>
                <span className="font-mono font-bold text-slate-200">
                  {correlated.targetSymbol}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">({correlated.targetName})</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                r = {correlated.correlation > 0 ? '+' : ''}
                {correlated.correlation.toFixed(2)}
              </span>
            </div>

            {/* Performance Comparison */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono mb-2">
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{asset.symbol}</span>
                <span
                  className={`font-bold ${
                    asset.change24hPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {asset.change24hPercent >= 0 ? '+' : ''}
                  {asset.change24hPercent.toFixed(2)}%
                </span>
              </div>
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{correlated.targetSymbol}</span>
                <span
                  className={`font-bold ${
                    correlated.targetChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {correlated.targetChange24hPct >= 0 ? '+' : ''}
                  {correlated.targetChange24hPct.toFixed(2)}%
                </span>
              </div>
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Spread Delta</span>
                <span
                  className={`font-bold ${
                    Math.abs(correlated.spreadDeltaPct) >= 1.5
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  {correlated.spreadDeltaPct > 0 ? '+' : ''}
                  {correlated.spreadDeltaPct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Qualitative Macro Transmission */}
            <p className="text-[11px] text-slate-400 leading-snug">
              {correlated.insight}
            </p>
          </div>

          {/* Quick jump to correlated target asset if present in app */}
          {targetAsset && onSelectAsset && (
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Analisis benchmark terkait:</span>
              <button
                onClick={() => onSelectAsset(targetAsset.id)}
                className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                Buka {targetAsset.symbol} <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface DivergenceMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: MarketAsset[];
  onSelectAsset: (assetId: string) => void;
  onAnalyzeAssetWithAi: (asset: MarketAsset) => void;
}

export const DivergenceMatrixModal: React.FC<DivergenceMatrixModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSelectAsset,
  onAnalyzeAssetWithAi,
}) => {
  if (!isOpen) return null;

  // Sort assets by absolute MA20 divergence descending
  const sorted = [...assets].sort(
    (a, b) =>
      Math.abs(b.divergence?.ma20DiffPct || 0) - Math.abs(a.divergence?.ma20DiffPct || 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-cyan-600 to-indigo-600 rounded-lg text-white">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Real-Time Cross-Asset Divergence Matrix
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Ranking Deviasi Pasar
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Memetakan seluruh 16 instrumen berdasarkan anomali harga vs 20-Day MA dan decoupling indeks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Aset</th>
                  <th className="p-3">Harga Live</th>
                  <th className="p-3">20-Day MA</th>
                  <th className="p-3 text-right">Deviasi MA20 (%)</th>
                  <th className="p-3">Status MA20</th>
                  <th className="p-3">Benchmark Terkorelasi</th>
                  <th className="p-3 text-center">Status Korelasi</th>
                  <th className="p-3 text-center">Severity</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {sorted.map((item) => {
                  const div = item.divergence;
                  const isAlert = div?.isAlert;
                  const maDiff = div?.ma20DiffPct || 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isAlert
                          ? div?.severity === 'CRITICAL'
                            ? 'bg-rose-950/15'
                            : 'bg-amber-950/15'
                          : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-100 flex items-center gap-1.5">
                        {isAlert && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              div?.severity === 'CRITICAL'
                                ? 'bg-rose-400 animate-ping'
                                : 'bg-amber-400'
                            }`}
                          />
                        )}
                        <span>{item.symbol}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({item.name.split(' ')[0]})
                        </span>
                      </td>

                      <td className="p-3 font-mono text-slate-200">
                        {item.currencyPrefix}
                        {item.price.toLocaleString(undefined, {
                          minimumFractionDigits: item.decimals,
                          maximumFractionDigits: item.decimals,
                        })}
                      </td>

                      <td className="p-3 font-mono text-slate-400">
                        {item.currencyPrefix}
                        {div?.ma20.toLocaleString(undefined, {
                          minimumFractionDigits: item.decimals,
                          maximumFractionDigits: item.decimals,
                        })}
                      </td>

                      <td
                        className={`p-3 font-mono font-bold text-right ${
                          maDiff > 2.5
                            ? 'text-rose-400'
                            : maDiff < -2.5
                            ? 'text-emerald-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {maDiff > 0 ? '+' : ''}
                        {maDiff.toFixed(2)}%
                      </td>

                      <td className="p-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            div?.ma20Status.includes('OVERBOUGHT')
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : div?.ma20Status.includes('OVERSOLD')
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {div?.ma20Status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3 text-slate-300 font-mono">
                        <span>{div?.correlatedIndex.targetSymbol}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          (r = {div?.correlatedIndex.correlation})
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            div?.correlatedIndex.status === 'DECOUPLED'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : div?.correlatedIndex.status === 'BEARISH_DIVERGENCE'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : div?.correlatedIndex.status === 'BULLISH_DIVERGENCE'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {div?.correlatedIndex.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            div?.severity === 'CRITICAL'
                              ? 'bg-rose-900/60 text-rose-300'
                              : div?.severity === 'HIGH'
                              ? 'bg-amber-900/60 text-amber-300'
                              : div?.severity === 'MODERATE'
                              ? 'bg-blue-900/60 text-blue-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {div?.severity}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            onSelectAsset(item.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-[11px] font-semibold transition cursor-pointer mr-1.5"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Pembaruan real-time: Divergensi dihitung secara dinamis dari harga pasar terkini dan korelasi silang antar aset.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
