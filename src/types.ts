export type AssetCategory = 'forex' | 'indices' | 'commodities' | 'bitcoin';

export type FundamentalBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  currencyPrefix?: string;
  decimals: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  sparkline: number[];
  tradingviewSymbol?: string;
  broker?: string;
  instrumentType?: string;
  bid?: number;
  ask?: number;
  spread?: number;
  brokerQuotes?: {
    broker: string;
    symbol: string;
    price: number;
    change24hPercent: number;
    bid?: number;
    ask?: number;
    spread?: number;
  }[];
  fundamentalBias: FundamentalBias;
  biasConfidence: number; // 0 to 100%
  keyCatalysts: string[];
  macroDrivers: {
    factor: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  microDrivers: {
    label: string;
    value: string;
    note: string;
  }[];
  institutionalPositioning: {
    cotNetSpeculative: string; // e.g., "+32,450 Kontrak (Net Long)"
    weeklyFlowTrend: string;
    liquidityCondition: string;
  };
  divergence?: AssetDivergence;
}

export type DivergenceSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL';
export type Ma20DivergenceStatus =
  | 'SEVERE_OVERBOUGHT'
  | 'OVERBOUGHT'
  | 'ALIGNED'
  | 'OVERSOLD'
  | 'SEVERE_OVERSOLD';

export type IndexDivergenceStatus =
  | 'DECOUPLED'
  | 'BULLISH_DIVERGENCE'
  | 'BEARISH_DIVERGENCE'
  | 'ALIGNED';

export interface CorrelatedIndexDivergence {
  targetId: string;
  targetSymbol: string;
  targetName: string;
  correlation: number; // e.g. -0.96 or +0.68
  relationship: string;
  targetChange24hPct: number;
  spreadDeltaPct: number; // Difference in performance relative to correlation expectation
  status: IndexDivergenceStatus;
  insight: string;
}

export interface AssetDivergence {
  ma20: number; // 20-Day Moving Average
  ma20DiffPct: number; // ((Price - MA20) / MA20) * 100
  ma20Status: Ma20DivergenceStatus;
  ma20Label: string;
  correlatedIndex: CorrelatedIndexDivergence;
  severity: DivergenceSeverity;
  isAlert: boolean;
  alertHeadline: string;
  meanReversionBias: 'SHORT_PULLBACK' | 'LONG_BOUNCE' | 'NEUTRAL';
}

export interface EconomicEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "19:30 WIB"
  currency: string;
  country: string;
  countryFlag: string;
  title: string;
  impact: 'HIGH' | 'MED' | 'LOW';
  actual?: string;
  forecast: string;
  previous: string;
  status: 'completed' | 'upcoming';
  fundamentalImpact: {
    ifHigher: string;
    ifLower: string;
    marketTransmission: string;
  };
}

export interface CentralBankPolicy {
  id: string;
  bankName: string;
  currency: string;
  flag: string;
  currentRate: string;
  lastDecision: string;
  nextMeeting: string;
  bias: 'HAWKISH' | 'NEUTRAL' | 'DOVISH';
  cutProbPct: number;
  holdProbPct: number;
  hikeProbPct: number;
  balanceSheetAction: string;
  governorQuote: string;
}

export interface YieldPoint {
  tenor: string;
  rate: number;
  changeBps: number;
}

export interface MarketRegimeState {
  regime: 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL';
  score: number; // -100 (Extreme Risk Off) to +100 (Extreme Risk On)
  label: string;
  vix: {
    value: number;
    change: number;
    level: 'Low (Complacent)' | 'Normal' | 'Elevated' | 'Panic';
  };
  dxy: {
    value: number;
    change: number;
    trend: 'Bullish' | 'Bearish' | 'Consolidation';
  };
  us10y: {
    value: number;
    changeBps: number;
  };
  spread10Y2Y: {
    valueBps: number;
    status: 'Inverted' | 'Flat' | 'Normal Steepening';
  };
  fearGreedIndex: {
    value: number;
    status: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  };
  sentimentByCategory: {
    forex: { score: number; bias: string };
    indices: { score: number; bias: string };
    commodities: { score: number; bias: string };
    bitcoin: { score: number; bias: string };
  };
}

export interface CorrelationItem {
  assetA: string;
  assetB: string;
  correlation: number; // -1.0 to 1.0
  relationship: string;
  fundamentalDriver: string;
}

export type NewsCategory =
  | 'ALL'
  | 'BREAKING'
  | 'CENTRAL_BANK'
  | 'FOREX'
  | 'COMMODITY'
  | 'EQUITIES'
  | 'CRYPTO'
  | 'GEOPOLITICS';

export type NewsImpact = 'HIGH' | 'MED' | 'LOW';

export interface NewsFlashItem {
  id: string;
  title: string;
  source: string;
  timestamp: string; // ISO string
  timeAgo: string; // e.g. "2m lalu" or "Baru saja"
  timeFormatted: string; // e.g. "21:48 WIB"
  category: NewsCategory;
  categoryLabel: string;
  impact: NewsImpact;
  isBreaking?: boolean;
  affectedTickers: string[]; // e.g. ["XAUUSD", "DXY", "WTI"]
  sentiment: 'BULLISH' | 'BEARISH' | 'VOLATILITY' | 'NEUTRAL';
  summary?: string;
  link?: string;
}

export interface CurrencyStrengthItem {
  currency: string;
  name: string;
  flag: string;
  color: string;
  score: number;
  meterScore: number;
  rank: number;
  change1h: number;
  change24h: number;
  status: 'VERY_STRONG' | 'STRONG' | 'NEUTRAL' | 'WEAK' | 'VERY_WEAK';
  statusLabel: string;
}

export interface CurrencySeriesPoint {
  timestamp: number;
  timeFormatted: string;
  [key: string]: any;
}

export interface RecommendedPair {
  pair: string;
  base: string;
  quote: string;
  action: 'STRONG BUY' | 'BUY' | 'STRONG SELL' | 'SELL';
  strengthGap: number;
  reason: string;
  confidence: number;
}

export interface CurrencyStrengthState {
  timeframe: '1d' | '2d';
  timestamp: string;
  lastUpdatedUnixtime: number;
  currencies: CurrencyStrengthItem[];
  series: CurrencySeriesPoint[];
  chartKeys: string[];
  colors: Record<string, string>;
  recommendedPairs: RecommendedPair[];
  crossMatrix: Record<string, Record<string, number>>;
  metadata?: {
    source: string;
    interval: string;
    totalPoints: number;
  };
}

