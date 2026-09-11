import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Landmark,
  Scale,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CentralBankPolicy, YieldPoint } from '../types';

interface MacroYieldCurveProps {
  yieldCurve: YieldPoint[];
  centralBanks: CentralBankPolicy[];
}

export const MacroYieldCurve: React.FC<MacroYieldCurveProps> = ({
  yieldCurve,
  centralBanks,
}) => {
  const [activeBankId, setActiveBankId] = useState<string>(centralBanks[0]?.id || 'fed');

  const activeBank = centralBanks.find((b) => b.id === activeBankId) || centralBanks[0];

  // SVG Chart Calculation for Yield Curve
  const chartWidth = 540;
  const chartHeight = 160;
  const paddingX = 45;
  const paddingY = 25;

  const minRate = Math.min(...yieldCurve.map((y) => y.rate)) - 0.2;
  const maxRate = Math.max(...yieldCurve.map((y) => y.rate)) + 0.2;
  const rateRange = maxRate - minRate || 1;

  const points = yieldCurve.map((pt, idx) => {
    const x =
      paddingX +
      (idx / (yieldCurve.length - 1)) * (chartWidth - paddingX * 2);
    const y =
      chartHeight -
      paddingY -
      ((pt.rate - minRate) / rateRange) * (chartHeight - paddingY * 2);
    return { x, y, tenor: pt.tenor, rate: pt.rate, change: pt.changeBps };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${polylineStr} ${points[points.length - 1].x},${
    chartHeight - paddingY
  } ${points[0].x},${chartHeight - paddingY}`;

  // 10Y minus 2Y calculation
  const y10 = yieldCurve.find((y) => y.tenor.includes('10Y'))?.rate || 4.24;
  const y2 = yieldCurve.find((y) => y.tenor.includes('2Y'))?.rate || 4.02;
  const spreadBps = Math.round((y10 - y2) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Kurva Imbal Hasil (Yield Curve) & Kebijakan Bank Sentral
            </h2>
            <p className="text-xs text-slate-400">
              Benchmark US Treasury, dinamika kurva 10Y-2Y, dan probabilitas suku bunga acuan
            </p>
          </div>
        </div>

        {/* 10Y-2Y Spread Pill */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
          <span className="text-slate-400">10Y-2Y Spread:</span>
          <span
            className={`font-bold ${
              spreadBps >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {spreadBps >= 0 ? `+${spreadBps}` : spreadBps} bps
          </span>
          <span className="text-[10px] text-slate-500 font-sans">
            (Normal Steepening)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: US Treasury Yield Curve Visual (6 cols) */}
        <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                US Treasury Yield Curve (Tenor 3M hingga 30Y)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Bps d/d
              </span>
            </div>

            {/* SVG Chart */}
            <div className="w-full overflow-x-auto py-2">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto max-h-[170px]"
              >
                <defs>
                  <linearGradient id="yieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                {[0, 0.33, 0.66, 1].map((ratio, i) => {
                  const y = paddingY + ratio * (chartHeight - paddingY * 2);
                  const rateLabel = (maxRate - ratio * rateRange).toFixed(2);
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 3}
                        fill="#64748b"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {rateLabel}%
                      </text>
                    </g>
                  );
                })}

                {/* Gradient area */}
                <polygon points={areaPoints} fill="url(#yieldGrad)" />

                {/* Polyline */}
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylineStr}
                />

                {/* Data Points */}
                {points.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#0f172a"
                      stroke="#22d3ee"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 9}
                      fill="#f8fafc"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {pt.rate.toFixed(2)}%
                    </text>
                    <text
                      x={pt.x}
                      y={chartHeight - 6}
                      fill="#94a3b8"
                      fontSize="11"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {pt.tenor}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5 text-[11px] text-slate-400 mt-2">
            <strong className="text-slate-200">Implikasi Makro:</strong> Kurva yang
            mulai curam (steepening) mengonfirmasi pergeseran pasar ke fase normalisasi
            moneter, memberikan ruang likuiditas bagi aset berisiko (Indeks & BTC).
          </div>
        </div>

        {/* Right: Central Bank Matrix (6 cols) */}
        <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                Matriks Suku Bunga Bank Sentral Utama
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Pilih Bank Sentral:
              </span>
            </div>

            {/* Central Bank Selector Tabs */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {centralBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => setActiveBankId(bank.id)}
                  className={`p-2 rounded border text-center transition cursor-pointer ${
                    activeBank.id === bank.id
                      ? 'bg-slate-800 border-cyan-500 shadow ring-1 ring-cyan-500/40'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-base">{bank.flag}</div>
                  <div className="font-mono text-xs font-bold text-slate-200 mt-0.5">
                    {bank.currency}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-semibold font-mono">
                    {bank.currentRate}
                  </div>
                </button>
              ))}
            </div>

            {/* Active Bank Policy Detail */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <span>{activeBank.flag}</span>
                    <span>{activeBank.bankName}</span>
                  </h3>
                  <span className="text-slate-400 text-[11px]">
                    Meeting Berikutnya:{' '}
                    <strong className="text-slate-300">
                      {activeBank.nextMeeting}
                    </strong>
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase ${
                    activeBank.bias === 'HAWKISH'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : activeBank.bias === 'DOVISH'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  Stance: {activeBank.bias}
                </span>
              </div>

              {/* Rate Cut / Hold / Hike Probability Distribution */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
                  <span>Peluang Cut: {activeBank.cutProbPct}%</span>
                  <span>Peluang Hold: {activeBank.holdProbPct}%</span>
                  <span>Peluang Hike: {activeBank.hikeProbPct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${activeBank.cutProbPct}%` }}
                    className="bg-emerald-500 h-full"
                    title="Peluang Cut"
                  />
                  <div
                    style={{ width: `${activeBank.holdProbPct}%` }}
                    className="bg-amber-500 h-full"
                    title="Peluang Hold"
                  />
                  <div
                    style={{ width: `${activeBank.hikeProbPct}%` }}
                    className="bg-rose-500 h-full"
                    title="Peluang Hike"
                  />
                </div>
              </div>

              {/* Balance Sheet Trend */}
              <div className="text-[11px] text-slate-300">
                <span className="text-slate-400 font-semibold block">
                  Neraca Bank Sentral (QT / QE):
                </span>
                {activeBank.balanceSheetAction}
              </div>

              {/* Governor Quote */}
              <blockquote className="bg-slate-950 border-l-2 border-cyan-500 pl-2.5 py-1 text-[11px] text-slate-300 italic">
                {activeBank.governorQuote}
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
