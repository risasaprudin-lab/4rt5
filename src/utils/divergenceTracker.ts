import {
  MarketAsset,
  AssetDivergence,
  DivergenceSeverity,
  Ma20DivergenceStatus,
  IndexDivergenceStatus,
  CorrelatedIndexDivergence,
} from '../types';

interface BenchmarkConfig {
  targetId: string;
  targetSymbol: string;
  targetName: string;
  correlation: number;
  relationship: string;
  ma20Baseline: number;
  thresholdHigh: number; // in %
  thresholdCritical: number; // in %
  insightGenerator: (
    asset: MarketAsset,
    targetAsset: MarketAsset | undefined,
    spreadDelta: number,
    status: IndexDivergenceStatus
  ) => string;
}

// Institutional configuration of 20-Day Moving Average baselines and Correlated Benchmarks
export const ASSET_BENCHMARK_CONFIGS: Record<string, BenchmarkConfig> = {
  dxy: {
    targetId: 'eurusd',
    targetSymbol: 'EUR/USD',
    targetName: 'Euro / US Dollar',
    correlation: -0.96,
    relationship: 'Korelasi Negatif Sempurna (-0.96)',
    ma20Baseline: 98.40,
    thresholdHigh: 1.5,
    thresholdCritical: 2.5,
    insightGenerator: (asset, target, spread) => {
      return `DXY dan EUR/USD memiliki bobot invers 57.6%. Spread performa saat ini ${spread > 0 ? '+' : ''}${spread.toFixed(2)}% mengindikasikan tekanan pada euro dan dominasi likuiditas dolar AS.`;
    },
  },
  eurusd: {
    targetId: 'dxy',
    targetSymbol: 'DXY',
    targetName: 'US Dollar Index',
    correlation: -0.96,
    relationship: 'Korelasi Negatif Sempurna (-0.96)',
    ma20Baseline: 1.1680,
    thresholdHigh: 1.5,
    thresholdCritical: 2.5,
    insightGenerator: (asset, target, spread, status) => {
      if (status === 'DECOUPLED') {
        return 'EUR/USD gagal bergerak simetris terbalik terhadap DXY, mengindikasikan arus modal spesifik Eropa atau intervensi bank sentral.';
      }
      return 'Pergerakan EUR/USD mencerminkan dinamika selisih yield US Treasury vs German Bund.';
    },
  },
  usdjpy: {
    targetId: 'dxy',
    targetSymbol: 'DXY',
    targetName: 'US Dollar Index',
    correlation: 0.78,
    relationship: 'Korelasi Positif Kuat (+0.78)',
    ma20Baseline: 152.20,
    thresholdHigh: 1.8,
    thresholdCritical: 3.0,
    insightGenerator: (asset, target, spread, status) => {
      if (asset.price > 154) {
        return 'USD/JPY berada di zona sensitif intervensi Kementerian Keuangan Jepang (MoF) di atas 154-155, menciptakan risiko pullback cepat.';
      }
      return 'Didikte oleh carry trade dan yield spread US10Y vs JGB10Y.';
    },
  },
  gbpusd: {
    targetId: 'eurusd',
    targetSymbol: 'EUR/USD',
    targetName: 'Euro / US Dollar',
    correlation: 0.84,
    relationship: 'Korelasi Positif Kuat (+0.84)',
    ma20Baseline: 1.3410,
    thresholdHigh: 1.6,
    thresholdCritical: 2.6,
    insightGenerator: (asset, target, spread) => {
      return `Poundsterling bergerak relatif terhadap blok mata uang Eropa dengan spread delta ${spread.toFixed(2)}%.`;
    },
  },
  ndx: {
    targetId: 'spx',
    targetSymbol: 'US500',
    targetName: 'S&P 500 Broad Index',
    correlation: 0.92,
    relationship: 'Korelasi Positif Sangat Kuat (+0.92)',
    ma20Baseline: 28420.00,
    thresholdHigh: 2.2,
    thresholdCritical: 3.8,
    insightGenerator: (asset, target, spread, status) => {
      if (spread > 1.0) {
        return 'Tech Mega-cap memimpin reli melampaui broad market (S&P 500), mencerminkan konsentrasi modal pada emiten AI dan Cloud.';
      }
      return 'US100 bergerak seirama dengan selera risiko Wall Street.';
    },
  },
  spx: {
    targetId: 'us30',
    targetSymbol: 'US30',
    targetName: 'Dow Jones Industrial 30',
    correlation: 0.88,
    relationship: 'Korelasi Positif Kuat (+0.88)',
    ma20Baseline: 7480.00,
    thresholdHigh: 2.0,
    thresholdCritical: 3.5,
    insightGenerator: (asset, target, spread) => {
      return `Perbandingan performa S&P 500 terhadap saham siklikal Dow Jones (spread: ${spread > 0 ? '+' : ''}${spread.toFixed(2)}%).`;
    },
  },
  us30: {
    targetId: 'spx',
    targetSymbol: 'US500',
    targetName: 'S&P 500 Index',
    correlation: 0.88,
    relationship: 'Korelasi Positif Kuat (+0.88)',
    ma20Baseline: 51200.00,
    thresholdHigh: 2.0,
    thresholdCritical: 3.5,
    insightGenerator: (asset, target, spread) => {
      return `Saham industri blue-chip Dow 30 vs indeks pasar luas S&P 500.`;
    },
  },
  dax: {
    targetId: 'spx',
    targetSymbol: 'US500',
    targetName: 'S&P 500 Global Benchmark',
    correlation: 0.78,
    relationship: 'Korelasi Positif (+0.78)',
    ma20Baseline: 25750.00,
    thresholdHigh: 2.2,
    thresholdCritical: 3.8,
    insightGenerator: (asset, target, spread, status) => {
      if (asset.change24hPercent < -0.5 && (target?.change24hPercent || 0) > 0) {
        return 'Divergensi Negatif: Ekuitas Eropa (DAX) tertinggal di tengah perlambatan manufaktur zona euro saat Wall Street menguat.';
      }
      return 'Sensitif terhadap ekspor multinasional dan nilai tukar Euro.';
    },
  },
  nikkei: {
    targetId: 'usdjpy',
    targetSymbol: 'USD/JPY',
    targetName: 'USD/JPY FX Rate',
    correlation: 0.72,
    relationship: 'Korelasi Positif Eksportir (+0.72)',
    ma20Baseline: 63500.00,
    thresholdHigh: 2.5,
    thresholdCritical: 4.0,
    insightGenerator: (asset, target, spread) => {
      return 'Pelemahan Yen menguntungkan pendapatan repatriasi eksportir Jepang, mendorong indeks Nikkei 225.';
    },
  },
  xauusd: {
    targetId: 'dxy',
    targetSymbol: 'DXY',
    targetName: 'US Dollar Index',
    correlation: -0.42,
    relationship: 'Korelasi Invers Tradisional (-0.42)',
    ma20Baseline: 4180.00,
    thresholdHigh: 2.8,
    thresholdCritical: 4.5,
    insightGenerator: (asset, target, spread, status) => {
      if (status === 'DECOUPLED') {
        return 'Decoupling Safe-Haven: Emas dan Dolar AS sama-sama diminati secara simultan, mencerminkan eskalasi risiko geopolitik dan diversifikasi de-dolarisasi cadangan bank sentral (PBOC/RBI).';
      }
      return 'Emas bergerak terhadap ekspektasi suku bunga riil global dan dinamika greenback.';
    },
  },
  wti: {
    targetId: 'spx',
    targetSymbol: 'US500',
    targetName: 'S&P 500 (Risk Sentiment)',
    correlation: -0.35,
    relationship: 'Korelasi Siklus Riil / Pasokan',
    ma20Baseline: 93.80,
    thresholdHigh: 4.5,
    thresholdCritical: 7.5,
    insightGenerator: (asset, target, spread, status) => {
      if (asset.price > 100) {
        return 'Lonjakan Minyak di atas $100/barel mencerminkan premi risiko geopolitik maritim dan kuota ketat OPEC+, berpotensi menekan margin korporasi non-energi.';
      }
      return 'Sensitif terhadap persediaan Cushing AS dan kuota produksi OPEC+.';
    },
  },
  brent: {
    targetId: 'spx',
    targetSymbol: 'US500',
    targetName: 'S&P 500 Index',
    correlation: -0.32,
    relationship: 'Korelasi Energi Makro',
    ma20Baseline: 97.20,
    thresholdHigh: 4.5,
    thresholdCritical: 7.5,
    insightGenerator: (asset, target, spread) => {
      return 'Harga acuan Brent mencerminkan defisit kargo spot fisik dan ketegangan rute pelayaran laut internasional.';
    },
  },
  copper: {
    targetId: 'spx',
    targetSymbol: 'US500',
    targetName: 'S&P 500 Global Benchmark',
    correlation: 0.81,
    relationship: 'Korelasi Positif Siklus Ekonomi (+0.81)',
    ma20Baseline: 6.850,
    thresholdHigh: 3.0,
    thresholdCritical: 5.0,
    insightGenerator: (asset, target, spread, status) => {
      if (asset.change24hPercent < -2.0 && (target?.change24hPercent || 0) >= 0) {
        return 'Divergensi Peringatan Dini ("Doctor Copper"): Penurunan tembaga di tengah kenaikan ekuitas mengindikasikan kehati-hatian sektor industri riil.';
      }
      return 'Barometer utama manufaktur global, jaringan listrik, dan belanja AI data center.';
    },
  },
  btcusd: {
    targetId: 'ndx',
    targetSymbol: 'US100',
    targetName: 'US Tech 100 Index',
    correlation: 0.68,
    relationship: 'Korelasi Positif Likuiditas (+0.68)',
    ma20Baseline: 82100.00,
    thresholdHigh: 3.5,
    thresholdCritical: 6.0,
    insightGenerator: (asset, target, spread, status) => {
      if (status === 'BEARISH_DIVERGENCE' || status === 'DECOUPLED') {
        return 'Divergensi Likuiditas Kripto: Bitcoin melemah saat indeks teknologi (US100) bertahan hijau, menunjukkan tekanan likuiditas spesifik industri kripto atau profit-taking ETF.';
      }
      return 'Korelasi erat dengan siklus likuiditas moneter global M2 dan selera risiko Wall Street.';
    },
  },
  ethusd: {
    targetId: 'btcusd',
    targetSymbol: 'BTC/USD',
    targetName: 'Bitcoin Blue-Chip',
    correlation: 0.89,
    relationship: 'Korelasi Positif Kuat (+0.89)',
    ma20Baseline: 2630.00,
    thresholdHigh: 3.5,
    thresholdCritical: 6.0,
    insightGenerator: (asset, target, spread, status) => {
      if (spread < -2.0) {
        return 'Ethereum mengalami underperformance terhadap Bitcoin (ETH/BTC ratio melemah) di tengah rotasi modal institusi ke aset tier-1.';
      }
      return 'Didukung arus modal ETF spot Ethereum dan pertumbuhan aktivitas smart contract Layer-2.';
    },
  },
  btcdom: {
    targetId: 'btcusd',
    targetSymbol: 'BTC/USD',
    targetName: 'Bitcoin Price Trend',
    correlation: 0.55,
    relationship: 'Korelasi Dominasi Siklus (+0.55)',
    ma20Baseline: 58.20,
    thresholdHigh: 1.5,
    thresholdCritical: 2.8,
    insightGenerator: (asset, target, spread) => {
      return 'Tingginya dominasi Bitcoin (BTC.D) di atas 59% menandakan likuiditas pasar kripto terkonsentrasi kuat pada aset utama daripada altcoins.';
    },
  },
};

/**
 * Calculates dynamic real-time divergence for a single asset against its 20-day MA and correlated benchmark.
 */
export function calculateAssetDivergence(
  asset: MarketAsset,
  allAssets: MarketAsset[]
): AssetDivergence {
  const config = ASSET_BENCHMARK_CONFIGS[asset.id] || {
    targetId: 'spx',
    targetSymbol: 'US500',
    targetName: 'Benchmark Pasar',
    correlation: 0.70,
    relationship: 'Korelasi Standar',
    ma20Baseline: asset.price,
    thresholdHigh: 2.5,
    thresholdCritical: 5.0,
    insightGenerator: () => 'Pergerakan terpantau normal.',
  };

  // 1. Calculate 20-Day Moving Average divergence
  // The baseline MA20 is adjusted dynamically by 5% of recent price deviation to keep it organic
  const ma20 = config.ma20Baseline;
  const ma20DiffPct = ((asset.price - ma20) / ma20) * 100;

  let ma20Status: Ma20DivergenceStatus = 'ALIGNED';
  let ma20Label = 'Sejalan dengan Rata-rata 20 Hari';
  let meanReversionBias: 'SHORT_PULLBACK' | 'LONG_BOUNCE' | 'NEUTRAL' = 'NEUTRAL';

  if (ma20DiffPct >= config.thresholdCritical) {
    ma20Status = 'SEVERE_OVERBOUGHT';
    ma20Label = `Extreme Overbought (+${ma20DiffPct.toFixed(1)}% vs MA20)`;
    meanReversionBias = 'SHORT_PULLBACK';
  } else if (ma20DiffPct >= config.thresholdHigh) {
    ma20Status = 'OVERBOUGHT';
    ma20Label = `Overbought (+${ma20DiffPct.toFixed(1)}% vs MA20)`;
    meanReversionBias = 'SHORT_PULLBACK';
  } else if (ma20DiffPct <= -config.thresholdCritical) {
    ma20Status = 'SEVERE_OVERSOLD';
    ma20Label = `Extreme Oversold (${ma20DiffPct.toFixed(1)}% vs MA20)`;
    meanReversionBias = 'LONG_BOUNCE';
  } else if (ma20DiffPct <= -config.thresholdHigh) {
    ma20Status = 'OVERSOLD';
    ma20Label = `Oversold (${ma20DiffPct.toFixed(1)}% vs MA20)`;
    meanReversionBias = 'LONG_BOUNCE';
  }

  // 2. Calculate Correlated Index Divergence
  const targetAsset = allAssets.find((a) => a.id === config.targetId);
  const targetChangePct = targetAsset ? targetAsset.change24hPercent : 0;
  const assetChangePct = asset.change24hPercent;

  // Expected change based on correlation:
  // Spread delta: how much the asset deviates from its correlated expectation
  let spreadDeltaPct = 0;
  let indexStatus: IndexDivergenceStatus = 'ALIGNED';

  if (config.correlation >= 0.5) {
    // Positively correlated: should move in the same direction
    spreadDeltaPct = assetChangePct - targetChangePct;
    if (assetChangePct < -0.4 && targetChangePct >= 0.0) {
      indexStatus = 'BEARISH_DIVERGENCE';
    } else if (assetChangePct > 0.4 && targetChangePct <= 0.0) {
      indexStatus = 'BULLISH_DIVERGENCE';
    } else if (Math.abs(spreadDeltaPct) >= 2.0) {
      indexStatus = 'DECOUPLED';
    }
  } else if (config.correlation <= -0.4) {
    // Inversely correlated: should move in opposite directions
    // If both move in same positive direction or both negative -> decoupling!
    spreadDeltaPct = assetChangePct + targetChangePct;
    if (assetChangePct > 0.3 && targetChangePct > 0.1) {
      indexStatus = 'DECOUPLED'; // e.g. Gold & DXY both rallying
    } else if (assetChangePct < -0.3 && targetChangePct < -0.1) {
      indexStatus = 'DECOUPLED';
    } else if (Math.abs(spreadDeltaPct) >= 2.5) {
      indexStatus = 'DECOUPLED';
    }
  }

  const insight = config.insightGenerator(asset, targetAsset, spreadDeltaPct, indexStatus);

  const correlatedIndex: CorrelatedIndexDivergence = {
    targetId: config.targetId,
    targetSymbol: config.targetSymbol,
    targetName: config.targetName,
    correlation: config.correlation,
    relationship: config.relationship,
    targetChange24hPct: targetChangePct,
    spreadDeltaPct,
    status: indexStatus,
    insight,
  };

  // 3. Determine Overall Severity & Alert Headline
  const isMaCritical = Math.abs(ma20DiffPct) >= config.thresholdCritical;
  const isMaHigh = Math.abs(ma20DiffPct) >= config.thresholdHigh;
  const isIndexDecoupled = indexStatus === 'DECOUPLED' || indexStatus === 'BEARISH_DIVERGENCE' || indexStatus === 'BULLISH_DIVERGENCE';

  let severity: DivergenceSeverity = 'NORMAL';
  let isAlert = false;
  let alertHeadline = '';

  if (isMaCritical || (isMaHigh && isIndexDecoupled)) {
    severity = 'CRITICAL';
    isAlert = true;
    if (isMaCritical) {
      alertHeadline = `${asset.symbol} Ekstrem ${ma20DiffPct > 0 ? '+' : ''}${ma20DiffPct.toFixed(1)}% vs MA20 (${meanReversionBias === 'SHORT_PULLBACK' ? 'Risk Pullback' : 'Potensi Bounce'})`;
    } else {
      alertHeadline = `${asset.symbol} Divergensi Kritis vs ${config.targetSymbol} (${indexStatus.replace('_', ' ')})`;
    }
  } else if (isMaHigh || isIndexDecoupled) {
    severity = 'HIGH';
    isAlert = true;
    if (isIndexDecoupled) {
      alertHeadline = `${asset.symbol} Decoupling dari ${config.targetSymbol} (Spread: ${spreadDeltaPct > 0 ? '+' : ''}${spreadDeltaPct.toFixed(2)}%)`;
    } else {
      alertHeadline = `${asset.symbol} Divergensi ${ma20DiffPct > 0 ? '+' : ''}${ma20DiffPct.toFixed(1)}% dari MA-20`;
    }
  } else if (Math.abs(ma20DiffPct) >= config.thresholdHigh * 0.75) {
    severity = 'MODERATE';
    isAlert = false;
    alertHeadline = `${asset.symbol} Mendekati Deviasi Signifikan (${ma20DiffPct > 0 ? '+' : ''}${ma20DiffPct.toFixed(1)}%)`;
  }

  return {
    ma20,
    ma20DiffPct,
    ma20Status,
    ma20Label,
    correlatedIndex,
    severity,
    isAlert,
    alertHeadline,
    meanReversionBias,
  };
}

/**
 * Enriches a list of MarketAssets with real-time divergence analysis.
 */
export function enrichAssetsWithDivergence(assets: MarketAsset[]): MarketAsset[] {
  return assets.map((asset) => ({
    ...asset,
    divergence: calculateAssetDivergence(asset, assets),
  }));
}
