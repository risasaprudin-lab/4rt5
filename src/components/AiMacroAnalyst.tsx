import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  X,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BookOpen,
  RotateCw,
} from 'lucide-react';
import { MarketAsset, MarketRegimeState } from '../types';

interface AiMacroAnalystProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  targetAsset?: MarketAsset | null;
  macroRegime: MarketRegimeState;
}

export const AiMacroAnalyst: React.FC<AiMacroAnalystProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  targetAsset = null,
  macroRegime,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.8-flash');
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  const presets = [
    {
      title: 'Analisis Regim Makro Global',
      subtitle: 'Likuiditas M2 & Divergensi Fed-ECB-BOJ',
      prompt:
        'Berikan analisis regim makro ekonomi global saat ini. Bagaimana divergensi kebijakan moneter The Fed, ECB, dan Bank of Japan mempengaruhi arus modal global dan indeks dolar (DXY)?',
    },
    {
      title: 'Fundamental Emas (XAU/USD)',
      subtitle: 'De-dolarisasi vs Suku Bunga Riil',
      prompt:
        'Jelaskan pendorong fundamental utama XAU/USD saat ini: Mengapa emas terus mencetak rekor meskipun suku bunga riil (TIPS) tinggi? Bagaimana peran akumulasi cadangan devisa bank sentral (PBOC, India)?',
    },
    {
      title: 'Fundamental Bitcoin & Kripto',
      subtitle: 'ETF Spot, Halving, & Likuiditas M2',
      prompt:
        'Bagaimana transmisi fundamental Bitcoin pasca-halving dan arus ETF Spot institusi saat ini? Bagaimana korelasi Bitcoin dengan siklus likuiditas global M2 dan lantai biaya penambangan (mining cost floor)?',
    },
    {
      title: 'Mikroekonomi Indeks S&P 500',
      subtitle: 'Valuasi P/E, ERP, & Belanja Capex AI',
      prompt:
        'Analisis mikroekonomi konstituen S&P 500: Apakah forward P/E ~21.8x justified dengan pertumbuhan laba (EPS)? Bagaimana dampak siklus belanja modal (Capex) infrastruktur AI terhadap valuasi jangka menengah?',
    },
    {
      title: 'Simulasi Kejutan Rilis CPI AS',
      subtitle: 'Stress-test jika inflasi naik tak terduga',
      prompt:
        'Simulasikan skenario jika data inflasi Core CPI AS rilis 0.4% MoM (jauh lebih tinggi dari konsensus 0.2%). Jelaskan transmisi ke Yield 10Y, DXY, EUR/USD, Emas, S&P 500, dan Bitcoin.',
    },
  ];

  const handleRunAnalysis = async (customText?: string) => {
    const textToRun = customText || prompt;
    if (!textToRun.trim()) return;

    setIsLoading(true);
    setError(null);
    setFallbackNotice(null);

    try {
      const response = await fetch('/api/ai/macro-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToRun,
          asset: targetAsset ? `${targetAsset.symbol} (${targetAsset.name})` : 'Multi-Asset Macro',
          analysisType: targetAsset ? 'asset_deepdive' : 'regime',
          macroContext: {
            regime: macroRegime.regime,
            fearGreed: macroRegime.fearGreedIndex.value,
            vix: macroRegime.vix.value,
            dxy: macroRegime.dxy.value,
            us10y: macroRegime.us10y.value,
            spread10Y2Y: macroRegime.spread10Y2Y.valueBps,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errMsg = data.error || 'Terjadi kesalahan saat memproses analisis.';
        if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
          errMsg = 'Model AI upstream sedang mengalami lonjakan trafik (503 High Demand). Silakan coba lagi.';
        }
        throw new Error(errMsg);
      }

      setAnalysisResult(data.analysis);
      if (data.modelUsed) {
        setModelUsed(data.modelUsed);
      }
      if (data.notice) {
        setFallbackNotice(data.notice);
      }
    } catch (err: any) {
      console.warn('AI Macro Analysis Warning:', err);
      let rawMsg = String(err?.message || 'Gagal menghubungi server analisis AI.');
      if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
        rawMsg = 'Model AI sedang mengalami lonjakan beban sesaat (503 High Demand). Silakan klik tombol Coba Lagi.';
      } else if (rawMsg.includes('{"error":')) {
        try {
          const parsed = JSON.parse(rawMsg.replace(/^[^{]*/, ''));
          if (parsed?.error?.message) rawMsg = parsed.error.message;
        } catch {
          // ignore
        }
      }
      setError(rawMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Gemini Macro & Fundamental Co-Pilot
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {modelUsed}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sintesis makroekonomi, mikroekonomi, valuasi, dan stress-testing pasar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Quick Presets Grid */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              Pilihan Cepat Analisis Makro & Skenario:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.prompt);
                    handleRunAnalysis(p.prompt);
                  }}
                  disabled={isLoading}
                  className="p-3 text-left rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500 hover:bg-slate-800/50 transition cursor-pointer text-xs group disabled:opacity-50"
                >
                  <div className="font-bold text-slate-200 group-hover:text-cyan-400 transition flex items-center justify-between">
                    <span>{p.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-cyan-400" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    {p.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 focus-within:border-cyan-500 transition">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Pertanyaan Analisis atau Skenario Fundamental Anda:
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: Bagaimana dampak jika suku bunga The Fed ditahan lebih lama (higher-for-longer) terhadap yield spread US-JP dan pasangan mata uang USD/JPY?"
              className="w-full bg-transparent border-0 text-slate-100 text-xs focus:ring-0 resize-none placeholder:text-slate-600 outline-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                {targetAsset ? `Konteks Aset: ${targetAsset.symbol}` : 'Konteks: Lintas Aset Global'}
              </span>

              <button
                id="btn-submit-ai-analysis"
                onClick={() => handleRunAnalysis()}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis Data...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Jalankan Analisis AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-semibold block mb-0.5">Analisis Terkendala:</strong>
                <span>{error}</span>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => handleRunAnalysis()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-medium text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Coba Lagi Sekarang</span>
                  </button>
                  <span className="text-[11px] text-rose-400/80">
                    Sistem otomatis mengarahkan ke model cadangan.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback Notice Banner */}
          {fallbackNotice && (
            <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{fallbackNotice}</span>
              </div>
              <button
                onClick={() => handleRunAnalysis()}
                disabled={isLoading}
                className="shrink-0 text-xs font-semibold text-amber-200 hover:text-white px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-900 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Coba Lagi via Gemini</span>
              </button>
            </div>
          )}

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                  <BookOpen className="w-4 h-4" />
                  <span>HASIL SINTESIS FUNDAMENTAL INSTITUSIONAL</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(analysisResult);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800 transition cursor-pointer"
                >
                  Salin Laporan
                </button>
              </div>

              {/* Render formatted markdown response */}
              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 space-y-3 font-sans">
                {analysisResult.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('###') || paragraph.startsWith('##') || paragraph.startsWith('#')) {
                    const cleanHeading = paragraph.replace(/^#+\s*/, '');
                    return (
                      <h4
                        key={idx}
                        className="text-sm font-bold text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-800/80 text-cyan-300"
                      >
                        {cleanHeading}
                      </h4>
                    );
                  }

                  if (paragraph.includes('Fundamental Bias: BULLISH') || paragraph.includes('BULLISH')) {
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-emerald-950/40 border-l-4 border-emerald-500 rounded text-slate-200 my-2"
                      >
                        {paragraph}
                      </div>
                    );
                  }

                  if (paragraph.includes('Fundamental Bias: BEARISH') || paragraph.includes('BEARISH')) {
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-rose-950/40 border-l-4 border-rose-500 rounded text-slate-200 my-2"
                      >
                        {paragraph}
                      </div>
                    );
                  }

                  // Bullet points
                  if (paragraph.includes('- ') || paragraph.includes('* ')) {
                    const lines = paragraph.split('\n');
                    return (
                      <ul key={idx} className="list-disc list-inside space-y-1 my-2 pl-2">
                        {lines.map((line, lIdx) => (
                          <li key={lIdx} className="text-slate-300">
                            {line.replace(/^[-*]\s*/, '')}
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p key={idx} className="text-slate-300">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
