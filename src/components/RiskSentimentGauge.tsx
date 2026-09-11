import React from 'react';
import {
  ShieldAlert,
  Compass,
  Gauge,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Layers,
  Coins,
  DollarSign,
  BarChart3,
  Scale,
} from 'lucide-react';
import { MarketRegimeState } from '../types';

interface RiskSentimentGaugeProps {
  regime: MarketRegimeState;
  onOpenAiDeepdive?: (topic: string) => void;
}

export const RiskSentimentGauge: React.FC<RiskSentimentGaugeProps> = ({
  regime,
  onOpenAiDeepdive,
}) => {
  // Normalize fear/greed (0-100)
  const fgScore = regime.fearGreedIndex.value;
  // Normalize regime score (-100 to +100 -> 0% to 100%)
  const regimePercent = ((regime.score + 100) / 200) * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Sentimen Pasar Global & Regim Risiko
            </h2>
            <p className="text-xs text-slate-400">
              Kompilasi real-time dari VIX, Imbal Hasil Obligasi, DXY, dan Likuiditas
            </p>
          </div>
        </div>

        {/* Current Regime Tag */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Status Regim:</span>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono uppercase tracking-wider ${
              regime.regime === 'RISK_ON'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                : regime.regime === 'RISK_OFF'
                ? 'bg-rose-950 text-rose-400 border border-rose-700'
                : 'bg-amber-950 text-amber-400 border border-amber-700'
            }`}
          >
            {regime.label}
          </span>
        </div>
      </div>

      {/* Main Meters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* 1. Global Risk-On / Risk-Off Dial */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Risk Regime Index
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {regime.score > 0 ? `+${regime.score}` : regime.score} / 100
            </span>
          </div>

          {/* Meter Bar */}
          <div className="my-3">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
              <span className="text-rose-400">Extreme Risk-Off</span>
              <span className="text-amber-400">Neutral</span>
              <span className="text-emerald-400">Extreme Risk-On</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${regimePercent}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Kondisi likuiditas akomodatif; pasar ekuitas & kripto menyerap modal
            sementara safe-haven selektif.
          </p>
        </div>

        {/* 2. Fear & Greed Gauge */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              Fear & Greed Index
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                fgScore >= 70
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : fgScore >= 50
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              {regime.fearGreedIndex.status} ({fgScore})
            </span>
          </div>

          <div className="my-3">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
              <span>0 (Extreme Fear)</span>
              <span>100 (Extreme Greed)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-yellow-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${fgScore}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Sentimen berada pada zona optimis institusional. Hati-hati terhadap
            kejutan data inflasi tinggi.
          </p>
        </div>

        {/* 3. VIX & Volatilitas Pasar */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              CBOE VIX (Volatilitas)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Status: {regime.vix.level}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {regime.vix.value}
            </span>
            <span
              className={`text-xs font-mono font-medium ${
                regime.vix.change <= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {regime.vix.change <= 0 ? '' : '+'}
              {regime.vix.change} d/d
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            <span className="text-slate-300 font-medium">Ambang Batas:</span> &lt;18
            (Stabil / Bullish), 18-25 (Waspada), &gt;25 (Krisis Volatilitas).
          </div>
        </div>

        {/* 4. Kurva 10Y-2Y Treasury Spread */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              10Y - 2Y Yield Spread
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
              {regime.spread10Y2Y.status}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              +{regime.spread10Y2Y.valueBps} bps
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (US10Y: {regime.us10y.value}%)
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Kurva kembali normal (un-inversion). Mengindikasikan siklus pemangkasan suku bunga awal.
          </div>
        </div>
      </div>

      {/* Sentiment Breakdown per Asset Category requested by trader */}
      <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Sentimen Berdasarkan Kelas Aset (Forex, Indeks, Komoditas, Bitcoin)
          </span>
          {onOpenAiDeepdive && (
            <button
              onClick={() => onOpenAiDeepdive('Global Macro & Asset Sentiment')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <span>Tanya AI Dampak Sentimen</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Forex */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                FOREX (Mata Uang)
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {regime.sentimentByCategory.forex.score}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${regime.sentimentByCategory.forex.score}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              {regime.sentimentByCategory.forex.bias}
            </p>
          </div>

          {/* Indeks */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                INDEKS GLOBAL
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {regime.sentimentByCategory.indices.score}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${regime.sentimentByCategory.indices.score}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              {regime.sentimentByCategory.indices.bias}
            </p>
          </div>

          {/* Komoditas */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                KOMODITAS
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {regime.sentimentByCategory.commodities.score}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${regime.sentimentByCategory.commodities.score}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              {regime.sentimentByCategory.commodities.bias}
            </p>
          </div>

          {/* Bitcoin */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-orange-400" />
                BITCOIN & KRIPTO
              </span>
              <span className="font-mono text-orange-400 font-bold">
                {regime.sentimentByCategory.bitcoin.score}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${regime.sentimentByCategory.bitcoin.score}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              {regime.sentimentByCategory.bitcoin.bias}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
