import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Search,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Zap,
  Copy,
  Check,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  Globe,
  TrendingUp,
  TrendingDown,
  Activity,
  Coins,
  Landmark,
  ShieldAlert,
  Clock,
  Filter,
} from 'lucide-react';
import { NewsFlashItem, NewsCategory, NewsImpact } from '../types';
import { playFlashChime } from '../utils/audioAlert';

interface NewsFlashTerminalProps {
  flashes: NewsFlashItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onAnalyzeFlash: (flash: NewsFlashItem) => void;
  audioAlertEnabled: boolean;
  onToggleAudio: () => void;
  isStreamPaused: boolean;
  onToggleStreamPause: () => void;
}

export const NewsFlashTerminal: React.FC<NewsFlashTerminalProps> = ({
  flashes,
  isLoading,
  onRefresh,
  onAnalyzeFlash,
  audioAlertEnabled,
  onToggleAudio,
  isStreamPaused,
  onToggleStreamPause,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<'ALL' | NewsImpact>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live clocks for financial desk feel (WIB and UTC)
  const [timeWib, setTimeWib] = useState('');
  const [timeUtc, setTimeUtc] = useState('');

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setTimeWib(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setTimeUtc(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' UTC'
      );
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyHeadline = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAudioToggleWithSound = () => {
    if (!audioAlertEnabled) {
      playFlashChime();
    }
    onToggleAudio();
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return flashes.filter((item) => {
      // Category filter
      if (selectedCategory === 'BREAKING') {
        if (!item.isBreaking && item.impact !== 'HIGH') return false;
      } else if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Impact filter
      if (selectedImpact !== 'ALL' && item.impact !== selectedImpact) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSource = item.source.toLowerCase().includes(q);
        const matchTickers = item.affectedTickers.some((t) => t.toLowerCase().includes(q));
        const matchSummary = item.summary?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchSource && !matchTickers && !matchSummary) {
          return false;
        }
      }

      return true;
    });
  }, [flashes, selectedCategory, selectedImpact, searchQuery]);

  const categories: { id: NewsCategory; label: string; icon: any; count?: number }[] = [
    { id: 'ALL', label: 'Semua Flash', icon: Activity },
    { id: 'BREAKING', label: '🔴 Breaking Flash', icon: Flame },
    { id: 'CENTRAL_BANK', label: 'The Fed & Rate', icon: Landmark },
    { id: 'FOREX', label: 'Forex & DXY', icon: Globe },
    { id: 'COMMODITY', label: 'Komoditas (Emas/Minyak)', icon: SlidersHorizontal },
    { id: 'EQUITIES', label: 'Ekuitas & Saham', icon: TrendingUp },
    { id: 'CRYPTO', label: 'Kripto & BTC', icon: Coins },
    { id: 'GEOPOLITICS', label: 'Geopolitik', icon: ShieldAlert },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Squawk Desk Header */}
      <div className="bg-slate-950 border-b border-slate-800 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title and Live Status */}
          <div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-red-950/80 border border-red-800/80 px-2.5 py-1 rounded text-xs font-bold text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="tracking-wider">MKT SQUAWK FEED LIVE</span>
              </div>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Terinspirasi mktnews.com/flash.html
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2">
              <span>Terminal Breaking News & Macro Flash</span>
              <span className="text-xs font-normal text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {flashes.length} Wire Updates
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Arus berita finansial real-time, pernyataan gubernur bank sentral, pergerakan geopolitik, dan rilis data makroekonomi terhubung langsung ke mesin analisis AI.
            </p>
          </div>

          {/* Realtime Clocks & Desk Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Clocks */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-right flex items-center space-x-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block leading-none">JAKARTA</span>
                <span className="text-slate-200 font-semibold">{timeWib || '00:00:00 WIB'}</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 block leading-none">LONDON / UTC</span>
                <span className="text-slate-400 font-medium">{timeUtc || '00:00:00 UTC'}</span>
              </div>
            </div>

            {/* Audio Alert Toggle */}
            <button
              onClick={handleAudioToggleWithSound}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                audioAlertEnabled
                  ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 shadow-sm shadow-emerald-950'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
              title="Aktifkan suara lonceng alert setiap berita breaking masuk"
            >
              {audioAlertEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{audioAlertEnabled ? 'Audio Alert: ON' : 'Audio: OFF'}</span>
            </button>

            {/* Pause/Play Stream */}
            <button
              onClick={onToggleStreamPause}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isStreamPaused
                  ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
              title={isStreamPaused ? 'Lanjutkan auto-stream' : 'Jeda auto-stream'}
            >
              {isStreamPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isStreamPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 text-cyan-300 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              title="Muat ulang feed sekarang"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Impact Level Filter */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci headline, aset ($XAUUSD, $DXY, $WTI), atau sumber..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Impact Selector */}
          <div className="flex items-center space-x-1.5 w-full md:w-auto shrink-0 overflow-x-auto">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" />
              Impact:
            </span>
            {(['ALL', 'HIGH', 'MED'] as const).map((impact) => (
              <button
                key={impact}
                onClick={() => setSelectedImpact(impact)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  selectedImpact === impact
                    ? impact === 'HIGH'
                      ? 'bg-red-900/80 text-red-200 border border-red-700'
                      : 'bg-cyan-700 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {impact === 'ALL' ? 'Semua' : impact === 'HIGH' ? '🔴 High Impact' : '🟡 Medium'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills Navigation */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-3 pb-1 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-950'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* News Stream Body */}
      <div className="divide-y divide-slate-800/80 max-h-[720px] overflow-y-auto">
        {isLoading && flashes.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-sm">Menghubungkan ke Feed MKT News Flash...</p>
            <p className="text-slate-500 text-xs mt-1">Mengagregasi wire berita finansial terkini</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <SlidersHorizontal className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-sm">Tidak ada berita flash yang cocok dengan filter</p>
            <p className="text-slate-500 text-xs mt-1">Coba ubah kata kunci pencarian atau pilih kategori "Semua Flash"</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedImpact('ALL');
              }}
              className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isHigh = item.impact === 'HIGH';
            const isCopied = copiedId === item.id;

            // Border color depending on category
            let borderAccent = 'border-l-slate-700';
            if (item.isBreaking || isHigh) borderAccent = 'border-l-red-500';
            else if (item.category === 'CENTRAL_BANK') borderAccent = 'border-l-amber-500';
            else if (item.category === 'COMMODITY') borderAccent = 'border-l-yellow-500';
            else if (item.category === 'CRYPTO') borderAccent = 'border-l-purple-500';
            else if (item.category === 'FOREX') borderAccent = 'border-l-emerald-500';
            else if (item.category === 'EQUITIES') borderAccent = 'border-l-cyan-500';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 hover:bg-slate-850/70 transition border-l-4 ${borderAccent} group`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  {/* Main Content */}
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Badges Header */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Breaking Badge */}
                      {item.isBreaking && (
                        <span className="inline-flex items-center space-x-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase animate-pulse">
                          <Flame className="w-3 h-3" />
                          <span>BREAKING</span>
                        </span>
                      )}

                      {/* Category Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.categoryLabel}
                      </span>

                      {/* Impact Badge */}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.impact === 'HIGH'
                            ? 'bg-red-950/80 text-red-300 border border-red-800'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {item.impact === 'HIGH' ? '🔴 HIGH IMPACT' : '🟡 MED'}
                      </span>

                      {/* Time and relative time */}
                      <span className="flex items-center space-x-1 text-slate-400 text-[11px] font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{item.timeFormatted}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-400/90 font-medium">{item.timeAgo}</span>
                      </span>

                      {/* Source Tag */}
                      <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {item.source}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug group-hover:text-cyan-300 transition">
                      {item.title}
                    </h3>

                    {/* Indonesian Macro Summary */}
                    {item.summary && (
                      <p className="text-xs text-slate-300/90 bg-slate-950/60 p-2 rounded border border-slate-800/80 flex items-start gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{item.summary}</span>
                      </p>
                    )}

                    {/* Tickers & Market Sentiment Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {item.affectedTickers.map((ticker) => (
                        <span
                          key={ticker}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700"
                        >
                          ${ticker}
                        </span>
                      ))}

                      {item.sentiment && (
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            item.sentiment === 'BULLISH'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                              : item.sentiment === 'BEARISH'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                              : 'bg-amber-950/60 text-amber-300 border-amber-800'
                          }`}
                        >
                          {item.sentiment === 'BULLISH' && <TrendingUp className="w-3 h-3" />}
                          {item.sentiment === 'BEARISH' && <TrendingDown className="w-3 h-3" />}
                          {item.sentiment === 'VOLATILITY' && <Activity className="w-3 h-3" />}
                          <span>{item.sentiment}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                    {/* Instant AI Breakdown */}
                    <button
                      onClick={() => onAnalyzeFlash(item)}
                      className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md shadow-cyan-950 transition cursor-pointer w-full sm:w-auto justify-center"
                      title="Analisis dampak headline ini secara mendalam dengan AI"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Analisis AI</span>
                    </button>

                    <div className="flex items-center space-x-1 w-full sm:w-auto justify-end">
                      {/* Copy Headline */}
                      <button
                        onClick={() => handleCopyHeadline(item.id, item.title)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer border border-slate-700"
                        title="Salin headline ke clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Source Link */}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs transition border border-slate-700"
                          title="Buka link wire sumber asli"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer Info */}
      <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Feed Terkoneksi (Yahoo Wire • WSJ • ForexLive • CoinTelegraph)</span>
        </div>
        <div>
          <span>Menampilkan {filteredItems.length} dari total {flashes.length} flash berita</span>
        </div>
      </div>
    </div>
  );
};
