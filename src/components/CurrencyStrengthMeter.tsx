import React, { useState, useMemo, useRef } from 'react';
import { CurrencyStrengthState, CurrencyStrengthItem, RecommendedPair } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
} from 'lucide-react';

interface CurrencyStrengthMeterProps {
  data: CurrencyStrengthState | null;
  isLoading: boolean;
  timeframe: '1d' | '2d';
  onChangeTimeframe: (tf: '1d' | '2d') => void;
  onRefresh: () => void;
  onAnalyzeWithAi: (summaryText: string) => void;
}

export const CurrencyStrengthMeter: React.FC<CurrencyStrengthMeterProps> = ({
  data,
  isLoading,
  timeframe,
  onChangeTimeframe,
  onRefresh,
  onAnalyzeWithAi,
}) => {
  // Visible currencies in the interactive chart
  const [visibleCurrencies, setVisibleCurrencies] = useState<Record<string, boolean>>({
    USD: true,
    EUR: true,
    JPY: true,
    GBP: true,
    AUD: true,
    CHF: true,
    CAD: true,
    NZD: true,
  });

  // Hovered data point in chart
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'matrix' | 'setups'>('chart');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const toggleCurrency = (code: string) => {
    setVisibleCurrencies((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const selectAll = () => {
    setVisibleCurrencies({
      USD: true,
      EUR: true,
      JPY: true,
      GBP: true,
      AUD: true,
      CHF: true,
      CAD: true,
      NZD: true,
    });
  };

  const selectMajorsOnly = () => {
    setVisibleCurrencies({
      USD: true,
      EUR: true,
      JPY: true,
      GBP: true,
      AUD: false,
      CHF: false,
      CAD: false,
      NZD: false,
    });
  };

  const isolateCurrency = (code: string) => {
    setVisibleCurrencies({
      USD: code === 'USD',
      EUR: code === 'EUR',
      JPY: code === 'JPY',
      GBP: code === 'GBP',
      AUD: code === 'AUD',
      CHF: code === 'CHF',
      CAD: code === 'CAD',
      NZD: code === 'NZD',
    });
  };

  // Helper for status badge color
  const getStatusBadge = (status: CurrencyStrengthItem['status']) => {
    switch (status) {
      case 'VERY_STRONG':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'STRONG':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'WEAK':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'VERY_WEAK':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  // SVG Chart bounds calculation
  const series = data?.series || [];
  const chartKeys = data?.chartKeys || [];
  const colors = data?.colors || {};

  const { minVal, maxVal, chartPoints } = useMemo(() => {
    if (!series || series.length === 0) {
      return { minVal: -5, maxVal: 5, chartPoints: [] };
    }

    let min = 0;
    let max = 0;

    series.forEach((pt) => {
      chartKeys.forEach((k) => {
        const v = pt[k];
        if (typeof v === 'number') {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
    });

    // Add padding to range
    const pad = Math.max(1, (max - min) * 0.12);
    const effMin = min - pad;
    const effMax = max + pad;

    return {
      minVal: effMin,
      maxVal: effMax,
      chartPoints: series,
    };
  }, [series, chartKeys]);

  // Dimensions
  const svgWidth = 840;
  const svgHeight = 360;
  const padLeft = 46;
  const padRight = 30;
  const padTop = 24;
  const padBottom = 36;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getY = (val: number) => {
    if (maxVal === minVal) return padTop + plotHeight / 2;
    const norm = (val - minVal) / (maxVal - minVal);
    return padTop + plotHeight - norm * plotHeight;
  };

  const getX = (idx: number, total: number) => {
    if (total <= 1) return padLeft;
    return padLeft + (idx / (total - 1)) * plotWidth;
  };

  const zeroY = getY(0);

  // Handle AI analysis click
  const handleTriggerAiAnalysis = () => {
    if (!data) return;
    const top = data.currencies[0];
    const bottom = data.currencies[data.currencies.length - 1];
    const prompt =
      `Berikan analisis mendalam divergensi kekuatan mata uang Forex (Currency Strength Meter) saat ini:\n\n` +
      `Mata Uang Terkuat: ${top.flag} ${top.currency} (${top.name}) dengan skor ${top.score > 0 ? '+' : ''}${top.score} (Status: ${top.statusLabel})\n` +
      `Mata Uang Terlemah: ${bottom.flag} ${bottom.currency} (${bottom.name}) dengan skor ${bottom.score > 0 ? '+' : ''}${bottom.score} (Status: ${bottom.statusLabel})\n\n` +
      `Peringkat Kekuatan Keseluruhan:\n` +
      data.currencies.map((c) => `  #${c.rank} ${c.currency}: ${c.score > 0 ? '+' : ''}${c.score} (${c.statusLabel})`).join('\n') +
      `\n\nPasangan Trading Rekomendasi:\n` +
      data.recommendedPairs.map((p) => `  - ${p.pair}: ${p.action} (Spread Gap: ${p.strengthGap}, Confidence: ${p.confidence}%)`).join('\n') +
      `\n\nJelaskan faktor makroekonomi (kebijakan bank sentral, sentimen risiko global, suku bunga, dan rilis data ekonomi) yang mendasari perbedaan ekstrem ini, serta strategi eksekusi trading yang aman bagi swing dan intraday trader.`;

    onAnalyzeWithAi(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Currency Strength Meter & Chart
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                  currency-strength.com Engine
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Agregasi real-time 8 mata uang utama (USD, EUR, JPY, GBP, AUD, CHF, CAD, NZD) lintas 28 pasangan cross Forex. Membantu menemukan momentum pair terkuat vs terlemah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Timeframe Switcher (Today 1D vs Yesterday 2D) */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                id="btn-tf-1d"
                onClick={() => onChangeTimeframe('1d')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  timeframe === '1d'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                HARI INI (1D)
              </button>
              <button
                id="btn-tf-2d"
                onClick={() => onChangeTimeframe('2d')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  timeframe === '2d'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                KEMARIN (2D)
              </button>
            </div>

            {/* Refresh Button */}
            <button
              id="btn-refresh-cs"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh Data Kekuatan Mata Uang"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* AI Macro Analysis Button */}
            <button
              id="btn-cs-ai-analysis"
              onClick={handleTriggerAiAnalysis}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analisis Divergensi AI</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'chart'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Grafik Multi-Line (Chart)</span>
          </button>
          <button
            onClick={() => setActiveTab('setups')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'setups'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Peluang Trading Forex (Strong vs Weak)</span>
            {data?.recommendedPairs && data.recommendedPairs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                {data.recommendedPairs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Matriks Heatmap 28 Pasangan</span>
          </button>
        </div>
      </div>

      {/* Row: 8 Live Currency Strength Meter Cards (#1 to #8) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            Peringkat Kekuatan 8 Mata Uang Utama (Meter Skala 0 - 10)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Interval: 5 Menit • Sumber: Agregat Pasar FX Global
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {data?.currencies.map((item) => {
            const isVisible = visibleCurrencies[item.currency];
            const isPositive = item.score >= 0;

            return (
              <div
                key={item.currency}
                onClick={() => isolateCurrency(item.currency)}
                className={`bg-slate-900/95 rounded-lg p-3 border transition-all cursor-pointer hover:border-slate-600 relative group ${
                  isVisible
                    ? 'border-slate-800 shadow-sm'
                    : 'border-slate-900 opacity-60 bg-slate-950/60'
                }`}
                style={{
                  borderTopColor: item.color,
                  borderTopWidth: '3px',
                }}
                title={`Klik untuk mengisolasi kurva ${item.currency} di grafik`}
              >
                {/* Header: Rank + Flag + Currency Code */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    #{item.rank}
                  </span>
                  <span className="text-base" role="img" aria-label={item.name}>
                    {item.flag}
                  </span>
                </div>

                <div className="mt-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold text-slate-100 font-mono">
                      {item.currency}
                    </span>
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.score > 0 ? `+${item.score}` : item.score}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{item.name}</p>
                </div>

                {/* Meter Bar (0 to 10 scale) */}
                <div className="mt-2.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-mono">
                    <span>Meter</span>
                    <span className="font-bold text-slate-200">{item.meterScore}/10</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(8, item.meterScore * 10))}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-2.5 flex items-center justify-between">
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.statusLabel}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.change1h > 0 ? `+${item.change1h}` : item.change1h} 1h
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tab View: Interactive Chart / Setups / Matrix */}
      {activeTab === 'chart' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          {/* Chart Header & Currency Filter Chips */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                Grafik Multi-Line Kekuatan Relatif Forex
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({series.length} Titik Data • Interval 5M)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Garis di atas angka 0 = Menguat (Strengthening) • Garis di bawah angka 0 = Melemah (Weakening)
              </p>
            </div>

            {/* Quick selectors */}
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={selectAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Pilih Semua
              </button>
              <button
                onClick={selectMajorsOnly}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Hanya Major 4
              </button>
            </div>
          </div>

          {/* Interactive Currency Visibility Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-mono mr-1">Mata Uang:</span>
            {chartKeys.map((curr) => {
              const meta = data?.currencies.find((c) => c.currency === curr);
              const isVisible = visibleCurrencies[curr];
              const color = colors[curr] || '#94a3b8';

              return (
                <button
                  key={curr}
                  onClick={() => toggleCurrency(curr)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border transition cursor-pointer ${
                    isVisible
                      ? 'bg-slate-800 text-slate-100 shadow-sm'
                      : 'bg-slate-950 text-slate-500 border-slate-850 opacity-50'
                  }`}
                  style={{
                    borderColor: isVisible ? color : undefined,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{curr}</span>
                  {isVisible ? (
                    <Eye className="w-3 h-3 text-slate-300 ml-0.5" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-slate-600 ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* SVG Interactive Multi-Line Chart Canvas */}
          <div
            ref={chartContainerRef}
            className="w-full overflow-x-auto bg-slate-950/80 rounded-lg p-2 border border-slate-800/80 relative select-none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {series.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-500 text-xs">
                Memuat data grafik kekuatan mata uang...
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-80 min-w-[700px] overflow-visible"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clientX = e.clientX - rect.left;
                  const ratio = (clientX - padLeft) / plotWidth;
                  const idx = Math.round(ratio * (series.length - 1));
                  if (idx >= 0 && idx < series.length) {
                    setHoveredIndex(idx);
                  }
                }}
              >
                {/* Horizontal Grid lines */}
                {[-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10].map((level) => {
                  if (level < minVal || level > maxVal) return null;
                  const y = getY(level);
                  const isZero = level === 0;

                  return (
                    <g key={level}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={svgWidth - padRight}
                        y2={y}
                        stroke={isZero ? '#38bdf8' : '#1e293b'}
                        strokeWidth={isZero ? '1.5' : '1'}
                        strokeDasharray={isZero ? '4 3' : '2 2'}
                        opacity={isZero ? 0.75 : 0.5}
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="10"
                        fontFamily="monospace"
                        fill={isZero ? '#38bdf8' : '#64748b'}
                      >
                        {level > 0 ? `+${level}` : level}
                      </text>
                    </g>
                  );
                })}

                {/* Zero Reference Line Label */}
                <text
                  x={svgWidth - padRight + 6}
                  y={zeroY + 3.5}
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#38bdf8"
                  fontWeight="bold"
                >
                  NETRAL (0)
                </text>

                {/* Time Axis (X-Ticks) */}
                {series.map((pt, i) => {
                  const step = Math.max(1, Math.floor(series.length / 6));
                  if (i % step !== 0 && i !== series.length - 1) return null;
                  const x = getX(i, series.length);

                  return (
                    <g key={pt.timestamp}>
                      <line
                        x1={x}
                        y1={padTop + plotHeight}
                        x2={x}
                        y2={padTop + plotHeight + 4}
                        stroke="#334155"
                      />
                      <text
                        x={x}
                        y={padTop + plotHeight + 16}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="monospace"
                        fill="#64748b"
                      >
                        {pt.timeFormatted.replace(' WIB', '')}
                      </text>
                    </g>
                  );
                })}

                {/* Draw Currency Line for each visible currency */}
                {chartKeys.map((curr) => {
                  if (!visibleCurrencies[curr]) return null;
                  const color = colors[curr] || '#94a3b8';

                  // Build path
                  const points = series.map((pt, i) => {
                    const x = getX(i, series.length);
                    const y = getY(pt[curr] ?? 0);
                    return `${x},${y}`;
                  });

                  const d = `M ${points.join(' L ')}`;

                  return (
                    <g key={curr}>
                      {/* Glow stroke for depth */}
                      <path
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth="3.5"
                        strokeOpacity="0.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Primary crisp line */}
                      <path
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* End point marker */}
                      {series.length > 0 && (
                        <circle
                          cx={getX(series.length - 1, series.length)}
                          cy={getY(series[series.length - 1][curr] ?? 0)}
                          r="3.5"
                          fill={color}
                          stroke="#0f172a"
                          strokeWidth="1.5"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Vertical Crosshair Line when hovered */}
                {hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < series.length && (
                  <g>
                    <line
                      x1={getX(hoveredIndex, series.length)}
                      y1={padTop}
                      x2={getX(hoveredIndex, series.length)}
                      y2={padTop + plotHeight}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    {/* Hover dot for each active currency */}
                    {chartKeys.map((curr) => {
                      if (!visibleCurrencies[curr]) return null;
                      const x = getX(hoveredIndex, series.length);
                      const y = getY(series[hoveredIndex][curr] ?? 0);
                      const color = colors[curr] || '#94a3b8';

                      return (
                        <circle
                          key={curr}
                          cx={x}
                          cy={y}
                          r="4"
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </g>
                )}
              </svg>
            )}

            {/* Floating Tooltip Box */}
            {hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < series.length && (
              <div
                className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs font-mono z-10 w-56 pointer-events-none"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Waktu:
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {series[hoveredIndex].timeFormatted}
                  </span>
                </div>

                <div className="space-y-1">
                  {chartKeys
                    .slice()
                    .sort((a, b) => (series[hoveredIndex][b] ?? 0) - (series[hoveredIndex][a] ?? 0))
                    .map((curr) => {
                      const val = series[hoveredIndex][curr] ?? 0;
                      const isVisible = visibleCurrencies[curr];
                      const color = colors[curr] || '#94a3b8';
                      const isPos = val >= 0;

                      return (
                        <div
                          key={curr}
                          className={`flex items-center justify-between py-0.5 ${
                            isVisible ? '' : 'opacity-30'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-slate-200 font-bold">{curr}</span>
                          </div>
                          <span
                            className={`font-mono font-semibold ${
                              isPos ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Recommended Forex Trade Setups (Strongest vs Weakest) */}
      {activeTab === 'setups' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Peluang Pasangan Forex Momentum Tertinggi (Divergensi Ekstrem)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Strategi Currency Strength: Membeli mata uang dengan skor tertinggi dan menjual mata uang dengan skor terendah untuk memanfaatkan disparitas momentum.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 bg-emerald-950/70 border border-emerald-800/60 rounded">
              High Probability Playbook
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.recommendedPairs.map((pair, idx) => {
              const isBuy = pair.action.includes('BUY');

              return (
                <div
                  key={idx}
                  className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold font-mono text-slate-100">
                        {pair.pair}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          isBuy
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {pair.action}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-400">Momentum Gap:</span>
                      <span className="ml-1.5 text-xs font-mono font-bold text-cyan-300">
                        +{pair.strengthGap} pts
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                    {pair.reason}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <span>Keyakinan Algoritma:</span>
                      <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full"
                          style={{ width: `${pair.confidence}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-200">
                        {pair.confidence}%
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        onAnalyzeWithAi(
                          `Berikan rencana trading (entry, stop loss, take profit) untuk pasangan Forex ${pair.pair} berdasarkan sinyal kekuatan mata uang: ${pair.action} (Spread Gap: ${pair.strengthGap}).`
                        )
                      }
                      className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Trading Plan AI</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: 28 Pairs Cross Matrix Heatmap */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Matriks Kekuatan Silang 28 Pasangan Forex (Cross Pair Matrix)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nilai menunjukkan selisih relatif momentum (Mata Uang Baris vs Mata Uang Kolom). Nilai positif hijau = Baris lebih kuat dari Kolom.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr>
                  <th className="p-2.5 bg-slate-950 text-slate-500 border border-slate-800 text-left">
                    Base \ Quote
                  </th>
                  {chartKeys.map((curr) => (
                    <th
                      key={curr}
                      className="p-2.5 bg-slate-950 text-slate-200 border border-slate-800 text-center font-bold"
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: colors[curr] }}
                      />
                      {curr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartKeys.map((row) => (
                  <tr key={row} className="hover:bg-slate-850/50 transition">
                    <td className="p-2.5 bg-slate-950 text-slate-200 border border-slate-800 font-bold">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: colors[row] }}
                      />
                      {row}
                    </td>
                    {chartKeys.map((col) => {
                      if (row === col) {
                        return (
                          <td
                            key={col}
                            className="p-2.5 bg-slate-950 text-slate-600 border border-slate-800 text-center"
                          >
                            —
                          </td>
                        );
                      }

                      const diff = data?.crossMatrix?.[row]?.[col] ?? 0;
                      const isPos = diff > 0;
                      const abs = Math.abs(diff);

                      // Heatmap color shading
                      let bgClass = 'bg-slate-900/50 text-slate-400';
                      if (diff > 4) {
                        bgClass = 'bg-emerald-900/60 text-emerald-300 font-bold';
                      } else if (diff > 1) {
                        bgClass = 'bg-emerald-950/50 text-emerald-400';
                      } else if (diff < -4) {
                        bgClass = 'bg-rose-900/60 text-rose-300 font-bold';
                      } else if (diff < -1) {
                        bgClass = 'bg-rose-950/50 text-rose-400';
                      }

                      return (
                        <td
                          key={col}
                          className={`p-2.5 border border-slate-800 text-center ${bgClass}`}
                          title={`${row}/${col}: ${isPos ? '+' : ''}${diff.toFixed(2)}`}
                        >
                          {isPos ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
