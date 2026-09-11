import React, { useState } from 'react';
import {
  GitFork,
  ArrowRightLeft,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CorrelationItem } from '../types';

interface CrossAssetCorrelationProps {
  correlations: CorrelationItem[];
  onAnalyzeCorrelation?: (item: CorrelationItem) => void;
}

export const CrossAssetCorrelation: React.FC<CrossAssetCorrelationProps> = ({
  correlations,
  onAnalyzeCorrelation,
}) => {
  const [selectedPair, setSelectedPair] = useState<CorrelationItem>(correlations[0]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Korelasi Lintas Aset (Cross-Asset Macro Correlation)
            </h2>
            <p className="text-xs text-slate-400">
              Mekanisme transmisi fundamental antara DXY, Yield Riil, Ekuitas, Emas, Minyak & Bitcoin
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          Sample Window: 90-Hari Rolling Correlation
        </div>
      </div>

      {/* Grid of Correlation Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-4">
        {correlations.map((item, idx) => {
          const isSelected =
            selectedPair.assetA === item.assetA &&
            selectedPair.assetB === item.assetB;
          const isPositive = item.correlation > 0;
          const absVal = Math.abs(item.correlation);

          return (
            <div
              key={idx}
              onClick={() => setSelectedPair(item)}
              className={`p-3.5 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="font-mono font-bold text-slate-200">
                    {item.assetA}{' '}
                    <span className="text-slate-500 font-sans">vs</span>{' '}
                    {item.assetB}
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      isPositive
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {isPositive ? `+${item.correlation.toFixed(2)}` : item.correlation.toFixed(2)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-medium mb-2">
                  {item.relationship}
                </div>

                {/* Progress Visualizer (-1 to +1) */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2 relative">
                  <div
                    className={`h-full rounded-full ${
                      isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${absVal * 100}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                {item.fundamentalDriver}
              </p>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Selected Pair Banner */}
      {selectedPair && (
        <div className="bg-slate-950/90 border border-indigo-900/60 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-indigo-400 mb-1">
              <Info className="w-3.5 h-3.5" />
              <span>
                ANALISIS HUBUNGAN FUNDAMENTAL: {selectedPair.assetA} VS{' '}
                {selectedPair.assetB}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedPair.fundamentalDriver}
            </p>
          </div>

          {onAnalyzeCorrelation && (
            <button
              onClick={() => onAnalyzeCorrelation(selectedPair)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold shadow transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Eksplorasi dengan Gemini AI</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
