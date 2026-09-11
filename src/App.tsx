import React, { useState, useEffect, useRef } from 'react';
import {
  INITIAL_ASSETS,
  INITIAL_ECONOMIC_CALENDAR,
  INITIAL_CENTRAL_BANKS,
  INITIAL_YIELD_CURVE,
  INITIAL_REGIME_STATE,
  CORRELATION_MATRIX,
} from './data/mockData';
import {
  AssetCategory,
  MarketAsset,
  EconomicEvent,
  CorrelationItem,
  NewsFlashItem,
  CurrencyStrengthState,
} from './types';
import { Header } from './components/Header';
import { RiskSentimentGauge } from './components/RiskSentimentGauge';
import { AssetOverview } from './components/AssetOverview';
import { EconomicCalendar } from './components/EconomicCalendar';
import { MacroYieldCurve } from './components/MacroYieldCurve';
import { CrossAssetCorrelation } from './components/CrossAssetCorrelation';
import { AiMacroAnalyst } from './components/AiMacroAnalyst';
import { NewsFlashTerminal } from './components/NewsFlashTerminal';
import { BreakingTicker } from './components/BreakingTicker';
import { CurrencyStrengthMeter } from './components/CurrencyStrengthMeter';
import { playFlashChime } from './utils/audioAlert';
import { enrichAssetsWithDivergence } from './utils/divergenceTracker';
import {
  Sparkles,
  LayoutDashboard,
  Calendar,
  Layers,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

export default function App() {
  const [assets, setAssets] = useState<MarketAsset[]>(() =>
    enrichAssetsWithDivergence(INITIAL_ASSETS)
  );
  const [calendarEvents, setCalendarEvents] = useState<EconomicEvent[]>(INITIAL_ECONOMIC_CALENDAR);
  const [yieldCurve, setYieldCurve] = useState(INITIAL_YIELD_CURVE);
  const [regime, setRegime] = useState(INITIAL_REGIME_STATE);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'currencyStrength' | 'calendar' | 'correlations' | 'yields'>('dashboard');

  // Currency Strength State (currency-strength.com engine)
  const [currencyStrength, setCurrencyStrength] = useState<CurrencyStrengthState | null>(null);
  const [isCsLoading, setIsCsLoading] = useState<boolean>(false);
  const [csTimeframe, setCsTimeframe] = useState<'1d' | '2d'>('1d');

  // MKT News Flash Live Squawk State
  const [flashes, setFlashes] = useState<NewsFlashItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(true);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const prevFlashIdsRef = useRef<Set<string>>(new Set());

  // Real-Time Live Stream State
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number>(140);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down'>>({});
  const [streamDataSources, setStreamDataSources] = useState<string[]>([
    'TradingView Live Feed (TVC, FX_IDC, OANDA, BINANCE)',
    'Binance Spot Feed',
    'Alternative.me',
  ]);

  // AI Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedAssetForAi, setSelectedAssetForAi] = useState<MarketAsset | null>(null);

  // Refresh status
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real-time market data from backend
  const fetchRealtimeMarketData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const t0 = performance.now();
      const res = await fetch('/api/market/realtime');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const elapsed = Math.round(performance.now() - t0);
      setLatencyMs(elapsed || data.latencyMs || 120);

      const now = new Date();
      setLastSyncTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setIsLiveConnected(true);

      if (data.sources && Array.isArray(data.sources)) {
        setStreamDataSources(data.sources);
      }

      // Identify price updates & trigger tick flash
      const newFlashes: Record<string, 'up' | 'down'> = {};
      if (data.assets) {
        setAssets((prevAssets) => {
          const updated = prevAssets.map((asset) => {
            const live = data.assets[asset.id];
            if (!live || live.price == null) return asset;

            if (live.price > asset.price) {
              newFlashes[asset.id] = 'up';
            } else if (live.price < asset.price) {
              newFlashes[asset.id] = 'down';
            }

            return {
              ...asset,
              price: live.price,
              change24h: live.change24h ?? asset.change24h,
              change24hPercent: live.change24hPercent ?? asset.change24hPercent,
              high24h: live.high24h ?? Math.max(asset.high24h, live.price),
              low24h: live.low24h ?? Math.min(asset.low24h, live.price),
              bid: live.bid !== undefined ? live.bid : asset.bid,
              ask: live.ask !== undefined ? live.ask : asset.ask,
              spread: live.spread !== undefined ? live.spread : asset.spread,
              brokerQuotes: live.brokerQuotes || asset.brokerQuotes,
              tradingviewSymbol: live.tradingviewSymbol ?? asset.tradingviewSymbol,
              broker: live.broker ?? asset.broker,
              instrumentType: live.instrumentType ?? asset.instrumentType,
              fundamentalBias: live.fundamentalBias ?? asset.fundamentalBias,
              biasConfidence: live.biasConfidence ?? asset.biasConfidence,
              keyCatalysts: live.keyCatalysts ?? asset.keyCatalysts,
              macroDrivers: live.macroDrivers ?? asset.macroDrivers,
              microDrivers: live.microDrivers ?? asset.microDrivers,
              institutionalPositioning: live.institutionalPositioning ?? asset.institutionalPositioning,
              sparkline:
                live.sparkline && live.sparkline.length >= 3
                  ? live.sparkline
                  : [...asset.sparkline.slice(1), live.price],
            };
          });
          return enrichAssetsWithDivergence(updated);
        });

        if (Object.keys(newFlashes).length > 0) {
          setFlashMap(newFlashes);
          setTimeout(() => {
            setFlashMap({});
          }, 900);
        }
      }

      // Update Market Regime
      if (data.regime) {
        setRegime((prev) => ({
          ...prev,
          regime: data.regime.regime || prev.regime,
          score: data.regime.score !== undefined ? data.regime.score : prev.score,
          label: data.regime.label || prev.label,
          vix: { ...prev.vix, ...(data.regime.vix || {}) },
          dxy: { ...prev.dxy, ...(data.regime.dxy || {}) },
          us10y: { ...prev.us10y, ...(data.regime.us10y || {}) },
          spread10Y2Y: { ...prev.spread10Y2Y, ...(data.regime.spread10Y2Y || {}) },
          fearGreedIndex: { ...prev.fearGreedIndex, ...(data.regime.fearGreedIndex || {}) },
          sentimentByCategory: data.regime.sentimentByCategory || prev.sentimentByCategory,
        }));
      }

      // Update Live Yield Curve
      if (data.yieldCurve && Array.isArray(data.yieldCurve)) {
        setYieldCurve(data.yieldCurve);
      }
    } catch (err) {
      console.warn('Realtime fetch warning:', err);
      // Keep connection status alive but log latency
      setIsLiveConnected(false);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  };

  // Fetch real-time MKT News Flashes
  const fetchNewsFlashes = async () => {
    try {
      setIsNewsLoading(true);
      const res = await fetch('/api/market/news-flash');
      if (!res.ok) return;
      const data = await res.json();
      if (data.flashes && Array.isArray(data.flashes)) {
        // Trigger audible chime if new breaking news arrived
        if (prevFlashIdsRef.current.size > 0 && audioAlertEnabled && !isStreamPaused) {
          const hasNewBreaking = data.flashes.some(
            (f: NewsFlashItem) =>
              !prevFlashIdsRef.current.has(f.id) && (f.isBreaking || f.impact === 'HIGH')
          );
          if (hasNewBreaking) {
            playFlashChime();
          }
        }

        const newIds = new Set<string>(data.flashes.map((f: NewsFlashItem) => f.id));
        prevFlashIdsRef.current = newIds;
        setFlashes(data.flashes);
      }
    } catch (err) {
      console.error('Failed to fetch news flashes:', err);
    } finally {
      setIsNewsLoading(false);
    }
  };

  // Real-time market data polling effect
  useEffect(() => {
    fetchRealtimeMarketData(false);

    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchRealtimeMarketData(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Real-time news flash polling effect (every 12 seconds if not paused)
  useEffect(() => {
    fetchNewsFlashes();

    if (isStreamPaused) return;
    const newsInterval = setInterval(() => {
      fetchNewsFlashes();
    }, 12000);

    return () => clearInterval(newsInterval);
  }, [isStreamPaused, audioAlertEnabled]);

  // Fetch Currency Strength Data (currency-strength.com engine)
  const fetchCurrencyStrength = async (tf: '1d' | '2d' = csTimeframe) => {
    try {
      setIsCsLoading(true);
      const res = await fetch(`/api/currency-strength?timeframe=${tf}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setCurrencyStrength(data);
      }
    } catch (err) {
      console.error('Failed to fetch currency strength:', err);
    } finally {
      setIsCsLoading(false);
    }
  };

  // Currency Strength polling effect (every 15 seconds)
  useEffect(() => {
    fetchCurrencyStrength(csTimeframe);

    const csInterval = setInterval(() => {
      fetchCurrencyStrength(csTimeframe);
    }, 15000);

    return () => clearInterval(csInterval);
  }, [csTimeframe]);

  const handleChangeCsTimeframe = (tf: '1d' | '2d') => {
    setCsTimeframe(tf);
    fetchCurrencyStrength(tf);
  };

  const handleAnalyzeFlash = (flash: NewsFlashItem) => {
    setSelectedAssetForAi(null);
    setAiPrompt(
      `Berikan analisis dampak instan (Instant Flash Breakdown) untuk breaking headline berikut:\n\n` +
      `Headline: "${flash.title}"\n` +
      `Sumber: ${flash.source} (${flash.timeFormatted})\n` +
      `Kategori: ${flash.categoryLabel}\n` +
      `Aset Terdampak: ${flash.affectedTickers.length > 0 ? flash.affectedTickers.join(', ') : 'Global Multi-Asset'}\n\n` +
      `Jelaskan implikasinya terhadap DXY, US 10Y Yield, Emas Spot (XAU/USD), Minyak Mentah (WTI), S&P 500, dan Bitcoin, serta playbook posisi taktikal yang direkomendasikan bagi trader.`
    );
    setIsAiModalOpen(true);
  };

  const handleManualRefresh = () => {
    fetchRealtimeMarketData(true);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh((prev) => !prev);
  };

  const handleOpenAiForAsset = (asset: MarketAsset) => {
    setSelectedAssetForAi(asset);
    const div = asset.divergence;
    if (div && div.isAlert) {
      setAiPrompt(
        `Analisis Divergensi Real-Time & Mean Reversion untuk ${asset.symbol} (${asset.name}):\n\n` +
        `- Deviasi 20-Day Moving Average: ${div.ma20DiffPct > 0 ? '+' : ''}${div.ma20DiffPct.toFixed(2)}% (Status: ${div.ma20Status})\n` +
        `- Harga Live: ${asset.currencyPrefix}${asset.price.toLocaleString()} vs MA20: ${asset.currencyPrefix}${div.ma20.toLocaleString()}\n` +
        `- Benchmark Terkorelasi: ${div.correlatedIndex.targetSymbol} (${div.correlatedIndex.targetName}), Korelasi: ${div.correlatedIndex.correlation > 0 ? '+' : ''}${div.correlatedIndex.correlation}\n` +
        `- Spread Delta: ${div.correlatedIndex.spreadDeltaPct > 0 ? '+' : ''}${div.correlatedIndex.spreadDeltaPct.toFixed(2)}% (Status Korelasi: ${div.correlatedIndex.status})\n` +
        `- Bias Mean Reversion: ${div.meanReversionBias}\n\n` +
        `Berikan evaluasi mendalam: Mengapa divergensi / anomali ini terjadi? Apakah ini peluang trade mean-reversion dengan risk-reward tinggi atau indikasi breakout rezim baru? Sebutkan katalis fundamental dan level teknikal kuncinya.`
      );
    } else {
      setAiPrompt(
        `Analisis fundamental dan valuasi mendalam untuk ${asset.symbol} (${asset.name}). Evaluasi katalis makro dan mikro, posisi COT institusi, serta target level fundamental penting.`
      );
    }
    setIsAiModalOpen(true);
  };

  const handleSimulateCalendarEvent = (event: EconomicEvent) => {
    setSelectedAssetForAi(null);
    setAiPrompt(
      `Simulasikan rilis data ekonomi: "${event.title}" (${event.currency}). Konsensus forecast: ${event.forecast}. Bagaimana jika data rilis meleset signifikan? Jelaskan transmisi ke DXY, US10Y Yield, Emas, S&P 500, dan Bitcoin.`
    );
    setIsAiModalOpen(true);
  };

  const handleAnalyzeCorrelation = (item: CorrelationItem) => {
    setSelectedAssetForAi(null);
    setAiPrompt(
      `Jelaskan korelasi makro fundamental antara ${item.assetA} dan ${item.assetB} (Korelasi: ${item.correlation}). Bagaimana trader dapat memanfaatkan divergensi atau anomali hubungan ini dalam strategi trading?`
    );
    setIsAiModalOpen(true);
  };

  const handleGeneralAiAnalyst = (customTopic?: string) => {
    setSelectedAssetForAi(null);
    if (customTopic) {
      setAiPrompt(
        `Berikan analisis makroekonomi dan sentimen pasar global untuk topik: "${customTopic}". Apa implikasi portofolio fundamentalnya?`
      );
    } else {
      setAiPrompt(
        'Berikan tinjauan makroekonomi komprehensif minggu ini: Arah kebijakan suku bunga The Fed, ECB, BOJ, tren likuiditas global M2, serta implikasi posisi trading pada Forex, Indeks, Emas, dan Bitcoin.'
      );
    }
    setIsAiModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation & Financial Session Header */}
      <Header
        assets={assets}
        regime={regime}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onOpenAiAnalyst={() => handleGeneralAiAnalyst()}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={toggleAutoRefresh}
        lastSyncTime={lastSyncTime}
        latencyMs={latencyMs}
        flashMap={flashMap}
        isLiveConnected={isLiveConnected}
      />

      {/* Top Breaking News Ticker (Always Visible, matching mktnews.com/flash.html) */}
      <BreakingTicker
        flashes={flashes}
        onOpenNewsTab={() => setActiveTab('news')}
        onAnalyzeFlash={handleAnalyzeFlash}
        audioAlertEnabled={audioAlertEnabled}
        onToggleAudio={() => setAudioAlertEnabled((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl">
          <div className="flex flex-wrap items-center gap-1">
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Terpadu</span>
            </button>

            {/* MKT News Flash Tab */}
            <button
              id="tab-news"
              onClick={() => setActiveTab('news')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer relative ${
                activeTab === 'news'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping mr-0.5" />
              <Radio className="w-4 h-4 text-red-400" />
              <span className="font-bold">News Flash Live</span>
              {flashes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-red-950/90 text-red-300 border border-red-700/80 font-mono font-bold">
                  {flashes.length} Wire
                </span>
              )}
            </button>

            {/* Currency Strength Meter Tab (currency-strength.com Engine) */}
            <button
              id="tab-currency-strength"
              onClick={() => setActiveTab('currencyStrength')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer relative ${
                activeTab === 'currencyStrength'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">Currency Strength</span>
              {currencyStrength?.currencies?.[0] && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800/80 font-mono font-bold hidden sm:inline-block">
                  #1 {currencyStrength.currencies[0].currency} ({currencyStrength.currencies[0].score > 0 ? '+' : ''}{currencyStrength.currencies[0].score})
                </span>
              )}
            </button>

            <button
              id="tab-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Kalender Rilis Ekonomi</span>
            </button>

            <button
              id="tab-yields"
              onClick={() => setActiveTab('yields')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'yields'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>Yield Curve & Bank Sentral</span>
            </button>

            <button
              id="tab-correlations"
              onClick={() => setActiveTab('correlations')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'correlations'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Korelasi Lintas Aset</span>
            </button>
          </div>

          {/* Real-time Status Badge & Sources */}
          <div className="flex items-center space-x-3 text-xs font-mono text-slate-400 pr-2">
            <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[11px] text-slate-300 font-semibold">
                {isLiveConnected ? 'DATA REALTIME AKTIF' : 'RECONNECTING'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[10px] text-cyan-400/90 font-medium hidden md:inline">
                TradingView Synchronized (TVC • FX_IDC • OANDA • BINANCE)
              </span>
            </div>
          </div>
        </div>

        {/* View Mode 0: MKT News Flash Full Squawk Terminal View */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <NewsFlashTerminal
              flashes={flashes}
              isLoading={isNewsLoading}
              onRefresh={fetchNewsFlashes}
              onAnalyzeFlash={handleAnalyzeFlash}
              audioAlertEnabled={audioAlertEnabled}
              onToggleAudio={() => setAudioAlertEnabled((prev) => !prev)}
              isStreamPaused={isStreamPaused}
              onToggleStreamPause={() => setIsStreamPaused((prev) => !prev)}
            />
          </div>
        )}

        {/* View Mode 0.5: Currency Strength Meter Dedicated View (currency-strength.com Engine) */}
        {activeTab === 'currencyStrength' && (
          <div className="space-y-6">
            <CurrencyStrengthMeter
              data={currencyStrength}
              isLoading={isCsLoading}
              timeframe={csTimeframe}
              onChangeTimeframe={handleChangeCsTimeframe}
              onRefresh={() => fetchCurrencyStrength(csTimeframe)}
              onAnalyzeWithAi={(promptText) => handleGeneralAiAnalyst(promptText)}
            />
          </div>
        )}

        {/* View Mode 1: Integrated Dashboard (All Modules) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 1. Global Market Sentiment & Risk Regime */}
            <RiskSentimentGauge
              regime={regime}
              onOpenAiDeepdive={(topic) => handleGeneralAiAnalyst(topic)}
            />

            {/* 2. Asset Overview (Forex, Indices, Commodities, Bitcoin) */}
            <AssetOverview
              assets={assets}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onAnalyzeAssetWithAi={handleOpenAiForAsset}
              flashMap={flashMap}
              lastSyncTime={lastSyncTime}
              isLive={isLiveConnected}
            />

            {/* 2.5 Currency Strength Meter (8 Majors) */}
            <CurrencyStrengthMeter
              data={currencyStrength}
              isLoading={isCsLoading}
              timeframe={csTimeframe}
              onChangeTimeframe={handleChangeCsTimeframe}
              onRefresh={() => fetchCurrencyStrength(csTimeframe)}
              onAnalyzeWithAi={(promptText) => handleGeneralAiAnalyst(promptText)}
            />

            {/* 3. Side-by-Side: Macro Yield Curve & Economic Calendar preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MacroYieldCurve
                yieldCurve={yieldCurve}
                centralBanks={INITIAL_CENTRAL_BANKS}
              />
              <EconomicCalendar
                events={calendarEvents}
                onSimulateEvent={handleSimulateCalendarEvent}
              />
            </div>

            {/* 4. Cross-Asset Correlation Matrix */}
            <CrossAssetCorrelation
              correlations={CORRELATION_MATRIX}
              onAnalyzeCorrelation={handleAnalyzeCorrelation}
            />
          </div>
        )}

        {/* View Mode 2: Full Economic Calendar Focused View */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <EconomicCalendar
              events={calendarEvents}
              onSimulateEvent={handleSimulateCalendarEvent}
            />
            {/* Contextual Market Regime Strip */}
            <RiskSentimentGauge
              regime={regime}
              onOpenAiDeepdive={(topic) => handleGeneralAiAnalyst(topic)}
            />
          </div>
        )}

        {/* View Mode 3: Yield Curve & Central Bank Policies View */}
        {activeTab === 'yields' && (
          <div className="space-y-6">
            <MacroYieldCurve
              yieldCurve={yieldCurve}
              centralBanks={INITIAL_CENTRAL_BANKS}
            />
            <CrossAssetCorrelation
              correlations={CORRELATION_MATRIX}
              onAnalyzeCorrelation={handleAnalyzeCorrelation}
            />
          </div>
        )}

        {/* View Mode 4: Cross-Asset Correlation View */}
        {activeTab === 'correlations' && (
          <div className="space-y-6">
            <CrossAssetCorrelation
              correlations={CORRELATION_MATRIX}
              onAnalyzeCorrelation={handleAnalyzeCorrelation}
            />
            <AssetOverview
              assets={assets}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onAnalyzeAssetWithAi={handleOpenAiForAsset}
            />
          </div>
        )}
      </main>

      {/* Terminal Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-slate-400 font-semibold">
              MacroPulse Terminal v2.4
            </span>
            <span>•</span>
            <span>Fundamental Macro & Micro Intelligence</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active Institutional Data Streams
            </span>
            <button
              onClick={() => handleGeneralAiAnalyst()}
              className="text-cyan-400 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Buka Analis AI</span>
            </button>
          </div>
        </div>
      </footer>

      {/* AI Macro Analyst Modal */}
      <AiMacroAnalyst
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialPrompt={aiPrompt}
        targetAsset={selectedAssetForAi}
        macroRegime={regime}
      />
    </div>
  );
}
